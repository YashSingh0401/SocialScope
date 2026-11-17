from fastapi import APIRouter, Query
import networkx as nx
from backend.app.db.connection import connect
from ml.sentiment.registry import PIPELINE_VERSION
from ml.topics.clustering import TopicClusterer
from ml.topics.labeling import TopicLabeler
from ml.trends.detector import TrendDetector
from graph.builder import GraphBuilder
from graph.serializers import serialize_to_cytoscape
from ml.attention.cib import CIBDetector
from ml.attention.score import AttentionEngine
from ml.attention.evidence import assemble_evidence_dossier

router=APIRouter(prefix='/analytics',tags=['Analytics'])

_clusterer = TopicClusterer(min_samples=2)
_labeler = TopicLabeler(top_k_keywords=4)
_trend_detector = TrendDetector(spike_growth_threshold=1.5, min_spike_volume=3)
_graph_builder = GraphBuilder()
_cib_detector = CIBDetector()
_attention_engine = AttentionEngine()


def filters(platform,language,sentiment):
    parts=[]; params=[]
    for expr,value in [('e.platform',platform),("a.result->>'language'",language),("a.result->>'sentiment'",sentiment)]:
        if value:
            parts.append(expr+'=%s');params.append(value)
    return (' WHERE '+' AND '.join(parts) if parts else ''),params


@router.get('/overview')
def overview(platform: str | None=None,language: str | None=None,sentiment: str | None=None):
    where,params=filters(platform,language,sentiment)
    join=' FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s'
    args=[PIPELINE_VERSION,*params]
    with connect() as conn:
        counts=conn.execute('''SELECT count(*) AS total,count(a.event_id) AS analyzed,
            count(*) FILTER (WHERE a.result->>'sentiment_status'='predicted') AS sentiment_available'''+join+where,args).fetchone()
        sentiment_rows=conn.execute("SELECT coalesce(a.result->>'sentiment','unavailable') AS label,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 1',args).fetchall()
        languages=conn.execute("SELECT coalesce(a.result->>'language','pending') AS label,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 2 DESC',args).fetchall()
        timeline=conn.execute("SELECT date_trunc('day',e.timestamp AT TIME ZONE 'UTC') AS day,count(*) AS count"+join+where+' GROUP BY 1 ORDER BY 1',args).fetchall()
    return {**counts,'sentiment':sentiment_rows,'languages':languages,'timeline':timeline,'pipeline_version':PIPELINE_VERSION}


@router.get('/events')
def events(platform: str | None=None,language: str | None=None,sentiment: str | None=None,
           limit: int=Query(50,ge=1,le=200),offset: int=Query(0,ge=0)):
    where,params=filters(platform,language,sentiment)
    with connect() as conn:
        rows=conn.execute('''SELECT e.event_id,e.platform,e.timestamp,e.text,e.language AS supplied_language,a.result AS analysis
            FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s'''+where+
            ' ORDER BY e.timestamp DESC,e.event_id LIMIT %s OFFSET %s',[PIPELINE_VERSION,*params,limit,offset]).fetchall()
    return {'items':rows,'limit':limit,'offset':offset}


@router.get('/topics')
def topics(limit: int = Query(200, ge=10, le=1000)):
    """Discovers semantic topic clusters from stored events."""
    with connect() as conn:
        events = conn.execute(
            '''SELECT event_id, text, timestamp, platform FROM events
               ORDER BY timestamp DESC LIMIT %s''', [limit]
        ).fetchall()

    if not events:
        return {'topics': [], 'total_events': 0, 'noise_count': 0}

    cluster_result = _clusterer.cluster_events(events)
    clusters = cluster_result['clusters']
    cluster_events = cluster_result['cluster_events']

    topic_items = []
    for cid, info in sorted(clusters.items(), key=lambda x: x[1]['size'], reverse=True):
        label_data = _labeler.label_cluster(cluster_events[cid], info.get('centroid'))
        topic_items.append({
            'topic_id': cid,
            'label': label_data['label'],
            'keywords': label_data['keywords'],
            'size': info['size'],
            'exemplar_text': label_data['exemplar_text'],
            'exemplar_id': label_data['exemplar_id']
        })

    return {
        'topics': topic_items,
        'total_events': cluster_result['total_events'],
        'noise_count': cluster_result['noise_count']
    }


@router.get('/trends')
def trends():
    """Returns conversation volume trends and flags emerging spike alerts."""
    with connect() as conn:
        daily_rows = conn.execute(
            '''SELECT date_trunc('day', timestamp AT TIME ZONE 'UTC') AS day, count(*) AS count
               FROM events GROUP BY 1 ORDER BY 1'''
        ).fetchall()

    timeline = [{'day': str(r['day']), 'count': int(r['count'])} for r in daily_rows]
    enriched = _trend_detector.analyze_topic_timeline(timeline)
    active_spikes = [b for b in enriched if b.get('is_spike')]

    return {
        'timeline': enriched,
        'has_active_spike': len(active_spikes) > 0,
        'spike_alerts': active_spikes
    }


@router.get('/network')
def network(limit: int = Query(200, ge=10, le=1000)):
    """Constructs actor interaction graph and calculates PageRank, communities, and bridge nodes."""
    with connect() as conn:
        events = conn.execute(
            '''SELECT event_id, platform, source_id, actor_ref, text, payload, timestamp
               FROM events ORDER BY timestamp DESC LIMIT %s''', [limit]
        ).fetchall()

    if not events:
        return serialize_to_cytoscape(nx.DiGraph())

    graph = _graph_builder.build_interaction_graph(events)
    return serialize_to_cytoscape(graph)


@router.get('/alerts')
def alerts(limit: int = Query(200, ge=10, le=1000)):
    """Computes multi-signal Attention Scores and assembles evidence dossiers for analyst review."""
    with connect() as conn:
        events = conn.execute(
            '''SELECT e.event_id, e.platform, e.source_id, e.actor_ref, e.text, e.payload, e.timestamp,
                      a.result AS analysis
               FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s
               ORDER BY e.timestamp DESC LIMIT %s''', [PIPELINE_VERSION, limit]
        ).fetchall()

    if not events:
        return {'alerts': [], 'total_alerts': 0}

    cluster_result = _clusterer.cluster_events(events)
    clusters = cluster_result['clusters']
    cluster_events = cluster_result['cluster_events']
    graph = _graph_builder.build_interaction_graph(events)
    graph_data = serialize_to_cytoscape(graph)

    alerts_list = []
    if clusters:
        for cid, info in clusters.items():
            ev_list = cluster_events[cid]
            cib_res = _cib_detector.analyze_coordination(ev_list)

            neg_count = sum(1 for e in ev_list if isinstance(e.get('analysis'), dict) and e['analysis'].get('sentiment') == 'negative')
            neg_ratio = (neg_count / len(ev_list)) if ev_list else 0.0
            plats = set(e.get('platform') for e in ev_list if e.get('platform'))
            growth_est = min(3.0, len(ev_list) / max(1.0, len(events) / max(1.0, len(clusters))))

            att_res = _attention_engine.calculate_attention(
                growth_rate=growth_est,
                negative_sentiment_ratio=neg_ratio,
                community_count=graph_data['metrics']['communities_count'],
                platform_count=len(plats),
                cib_score=cib_res['coordination_score'],
                total_volume=len(ev_list)
            )

            label_data = _labeler.label_cluster(ev_list, info.get('centroid'))
            dossier = assemble_evidence_dossier(
                topic_label=label_data['label'],
                attention_result=att_res,
                cib_result=cib_res,
                events=ev_list,
                graph_metrics=graph_data['metrics']
            )
            dossier['alert_id'] = f"alert_cluster_{cid}"
            alerts_list.append(dossier)
    else:
        cib_res = _cib_detector.analyze_coordination(events)
        neg_count = sum(1 for e in events if isinstance(e.get('analysis'), dict) and e['analysis'].get('sentiment') == 'negative')
        neg_ratio = (neg_count / len(events)) if events else 0.0
        plats = set(e.get('platform') for e in events if e.get('platform'))

        att_res = _attention_engine.calculate_attention(
            growth_rate=1.0,
            negative_sentiment_ratio=neg_ratio,
            community_count=graph_data['metrics']['communities_count'],
            platform_count=len(plats),
            cib_score=cib_res['coordination_score'],
            total_volume=len(events)
        )
        dossier = assemble_evidence_dossier(
            topic_label="General Conversation Scope",
            attention_result=att_res,
            cib_result=cib_res,
            events=events,
            graph_metrics=graph_data['metrics']
        )
        dossier['alert_id'] = "alert_general"
        alerts_list.append(dossier)

    alerts_list.sort(key=lambda a: a['attention_score'], reverse=True)
    return {'alerts': alerts_list, 'total_alerts': len(alerts_list)}


@router.get('/reports/{alert_id}')
def export_intelligence_brief(alert_id: str):
    """Exports a formatted intelligence brief (Markdown) for an alert dossier."""
    alerts_data = alerts(limit=300)
    matched = next((a for a in alerts_data['alerts'] if a.get('alert_id') == alert_id), None)
    if not matched and alerts_data['alerts']:
        matched = alerts_data['alerts'][0]

    if not matched:
        return {'detail': 'No alert dossier found for report generation.'}

    pz = matched.get('patient_zero') or {}
    cib = matched.get('cib_findings') or {}
    amps = matched.get('top_amplifiers') or []

    report_lines = [
        f"# 🛡 SOCIALSCOPE INTELLIGENCE BRIEF: {matched.get('topic_label', 'Unknown')}",
        f"**Generated**: {matched.get('generated_at', 'N/A')} UTC",
        f"**Classification**: STRICTLY INTERNAL / ANALYST USE ONLY",
        f"**Attention Score**: {matched.get('attention_score', 0):.1f}/100 ({matched.get('threat_level', 'LOW')})",
        "",
        "## 1. Executive Summary",
        f"- **Analyzed Volume**: {matched.get('analyzed_volume', 0)} events",
        f"- **Threat Assessment**: {matched.get('threat_level', 'LOW')}",
        f"- **Coordinated Inauthentic Behavior (CIB) Detected**: {'YES' if cib.get('cib_detected') else 'NO'}",
        f"- **CIB Score**: {cib.get('cib_score', 0):.2f}",
        "",
        "## 2. Origin & Patient Zero Attribution",
        f"- **Actor**: `{pz.get('actor_ref', 'Anonymous')}`",
        f"- **Platform**: `{pz.get('platform', 'N/A')}`",
        f"- **Timestamp**: `{pz.get('timestamp', 'N/A')}`",
        f"- **Initial Text**: \"{pz.get('text', 'N/A')}\"",
        "",
        "## 3. Coordinated Inauthentic Behavior (CIB) Indicators",
        f"- **Copypasta Clusters**: {cib.get('copypasta_clusters', 0)} matching text patterns",
        f"- **Synchronized Time Bursts**: {cib.get('burst_count', 0)} rapid propagation bursts",
        "",
        "## 4. Key Amplifiers & Bridge Nodes",
    ]
    for i, a in enumerate(amps[:5], 1):
        report_lines.append(f"{i}. Actor `{a.get('actor_ref')}` — In-degree: {a.get('degree', 0)}")

    report_lines.extend([
        "",
        "## 5. Recommended Actions",
        "- Monitor cross-platform velocity for subsequent synchronized bursts.",
        "- Verify flagged bridge actors for automated bot-swarm coordination.",
        "- Archive evidence hashes for chain-of-custody verification."
    ])

    markdown_report = "\n".join(report_lines)
    return {
        'alert_id': alert_id,
        'threat_level': matched.get('threat_level'),
        'attention_score': matched.get('attention_score'),
        'markdown': markdown_report
    }


@router.get('/audience')
def audience():
    """Audience distribution, platform breakdown, and demographic language indicators."""
    with connect() as conn:
        platforms = conn.execute(
            '''SELECT coalesce(platform, 'unknown') AS label, count(*) AS count
               FROM events GROUP BY 1 ORDER BY 2 DESC'''
        ).fetchall()
        top_actors = conn.execute(
            '''SELECT actor_ref, count(*) AS count, count(DISTINCT platform) AS platforms_count
               FROM events WHERE actor_ref IS NOT NULL
               GROUP BY 1 ORDER BY 2 DESC LIMIT 10'''
        ).fetchall()
        languages = conn.execute(
            '''SELECT coalesce(a.result->>'language', 'undetermined') AS label, count(*) AS count
               FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s
               GROUP BY 1 ORDER BY 2 DESC''', [PIPELINE_VERSION]
        ).fetchall()
    return {
        'platforms': platforms,
        'top_actors': top_actors,
        'languages': languages,
        'demographic_notes': 'Demographic estimates are aggregate and defensible based on linguistic indicators.'
    }


_investigations_log = []


@router.get('/investigations')
def list_investigations():
    """Returns stored analyst decisions and investigation logs."""
    return {'investigations': _investigations_log}


@router.post('/investigations')
def record_investigation(payload: dict):
    """Logs an analyst verdict (CONFIRMED, DISMISSED, ESCALATED) with explanation."""
    import datetime
    entry = {
        'id': f"inv_{len(_investigations_log) + 1}",
        'alert_id': payload.get('alert_id', 'general'),
        'topic': payload.get('topic', 'General'),
        'verdict': payload.get('verdict', 'INVESTIGATING'),
        'analyst': payload.get('analyst', 'Lead Analyst'),
        'notes': payload.get('notes', ''),
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    _investigations_log.insert(0, entry)
    return {'status': 'logged', 'entry': entry}


@router.get('/narrative')
def narrative_phases(limit: int = Query(300, ge=10, le=1000)):
    """Analyzes narrative lifecycle evolution (Emergence -> Public Reaction -> Amplification -> Plateau)."""
    with connect() as conn:
        events = conn.execute(
            '''SELECT e.event_id, e.timestamp, e.platform, e.text, a.result AS analysis
               FROM events e LEFT JOIN event_annotations a ON a.event_id=e.event_id AND a.pipeline_version=%s
               ORDER BY e.timestamp ASC LIMIT %s''', [PIPELINE_VERSION, limit]
        ).fetchall()

    if not events:
        return {'stages': [], 'total_tracked': 0}

    total = len(events)
    q1 = max(1, total // 4)
    q2 = max(q1 + 1, (total * 2) // 4)
    q3 = max(q2 + 1, (total * 3) // 4)

    phases = [
        {'phase': '1. Emergence & Seeding', 'events': events[:q1], 'description': 'Initial narrative introduction and seed posts'},
        {'phase': '2. Public Reaction & Discussion', 'events': events[q1:q2], 'description': 'Organic audience reaction and engagement'},
        {'phase': '3. Coordinated Amplification', 'events': events[q2:q3], 'description': 'Cross-platform broadcast and rapid sharing'},
        {'phase': '4. Polarization & Plateau', 'events': events[q3:], 'description': 'Echo chamber entrenchment and narrative saturation'}
    ]

    stage_data = []
    for p in phases:
        evs = p['events']
        negs = sum(1 for e in evs if isinstance(e.get('analysis'), dict) and e['analysis'].get('sentiment') == 'negative')
        pos = sum(1 for e in evs if isinstance(e.get('analysis'), dict) and e['analysis'].get('sentiment') == 'positive')
        stage_data.append({
            'phase': p['phase'],
            'description': p['description'],
            'event_count': len(evs),
            'start_time': str(evs[0]['timestamp']) if evs else None,
            'end_time': str(evs[-1]['timestamp']) if evs else None,
            'negative_ratio': round(negs / max(1, len(evs)), 2),
            'positive_ratio': round(pos / max(1, len(evs)), 2),
            'sample_texts': [e['text'] for e in evs[:2]]
        })

    return {'stages': stage_data, 'total_tracked': total}



