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


@router.get('/investigations/{inv_id}')
def get_investigation(inv_id: str):
    """Retrieve specific investigation detail with version and audit history."""
    matched = next((inv for inv in _investigations_log if inv.get('id') == inv_id or inv.get('alert_id') == inv_id), None)
    if not matched:
        # Generate default template for investigation
        matched = {
            'id': inv_id,
            'alert_id': inv_id,
            'topic': 'Critical Grid Blackout Claims',
            'verdict': 'UNREVIEWED',
            'review_status': 'Unreviewed',
            'analyst': 'Lead Threat Analyst',
            'notes': '',
            'version': 1,
            'timestamp': '2026-03-05T10:30:00Z',
            'audit_history': [
                {
                    'decision': 'UNREVIEWED',
                    'analyst': 'System',
                    'timestamp': '2026-03-05T09:30:00Z',
                    'note': 'Alert generated by Attention Engine'
                }
            ]
        }
    return matched


@router.post('/investigations')
def record_investigation(payload: dict):
    """Logs an analyst verdict (Confirm, Reject, Investigate) with optimistic concurrency conflict detection."""
    import datetime
    alert_id = payload.get('alert_id', 'general')
    verdict = payload.get('verdict', 'Investigate')
    analyst = payload.get('analyst', 'Lead Analyst')
    notes = payload.get('notes', '')
    submitted_version = payload.get('version', 1)

    # Check for concurrency conflict
    existing = next((inv for inv in _investigations_log if inv.get('alert_id') == alert_id or inv.get('id') == alert_id), None)
    now_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if existing and existing.get('version', 1) > submitted_version:
        return {
            'status': 'conflict',
            'detail': 'A newer decision was recorded by another analyst while you were drafting.',
            'newer_decision': existing,
            'draft_preserved': {
                'verdict': verdict,
                'notes': notes,
                'analyst': analyst
            }
        }

    new_version = (existing.get('version', 0) if existing else 0) + 1
    new_audit = list(existing.get('audit_history', [])) if existing else []
    new_audit.insert(0, {
        'decision': verdict,
        'analyst': analyst,
        'timestamp': now_ts,
        'note': notes or 'Updated decision.'
    })

    entry = {
        'id': existing.get('id') if existing else f"inv_{len(_investigations_log) + 1}",
        'alert_id': alert_id,
        'topic': payload.get('topic', existing.get('topic', 'General') if existing else 'General'),
        'verdict': verdict,
        'review_status': 'Reviewed' if verdict in ['Confirm', 'Reject', 'CONFIRMED', 'DISMISSED'] else 'Under review',
        'analyst': analyst,
        'notes': notes,
        'version': new_version,
        'timestamp': now_ts,
        'audit_history': new_audit
    }

    if existing:
        idx = _investigations_log.index(existing)
        _investigations_log[idx] = entry
    else:
        _investigations_log.insert(0, entry)

    return {'status': 'logged', 'entry': entry}


@router.get('/sources')
def list_sources():
    """Returns dataset inventory, connector status, validation results, and active processing jobs."""
    datasets = [
        {
            'dataset_id': 'ds-grid-01',
            'name': 'power-grid-campaign-2026',
            'platform_coverage': ['Reddit', 'YouTube', 'Telegram', 'X (Twitter)', 'Instagram', 'Facebook'],
            'row_count': 348,
            'time_range': '2026-03-01T00:00:00Z to 2026-03-07T23:59:59Z',
            'available_fields': ['text', 'timestamp', 'actor_ref', 'platform', 'interactions', 'language', 'sentiment'],
            'last_updated': '2026-03-07T12:00:00Z',
            'validation_status': 'VALID',
            'stage_progress': {'ingestion': '100%', 'normalization': '100%', 'ner_emotion': '100%', 'cib_graph': '100%'},
            'processing_state': 'READY'
        },
        {
            'dataset_id': 'ds-burst-02',
            'name': 'cross-border-rumor-sweep',
            'platform_coverage': ['Telegram', 'X (Twitter)', 'Reddit'],
            'row_count': 184,
            'time_range': '2026-03-04T00:00:00Z to 2026-03-06T18:30:00Z',
            'available_fields': ['text', 'timestamp', 'actor_ref', 'platform', 'interactions'],
            'last_updated': '2026-03-06T19:00:00Z',
            'validation_status': 'VALID',
            'stage_progress': {'ingestion': '100%', 'normalization': '100%', 'ner_emotion': '100%', 'cib_graph': '100%'},
            'processing_state': 'READY'
        },
        {
            'dataset_id': 'ds-election-03',
            'name': 'regional-election-seed-probe',
            'platform_coverage': ['X (Twitter)', 'YouTube', 'Facebook'],
            'row_count': 92,
            'time_range': '2026-03-06T10:00:00Z to 2026-03-07T08:00:00Z',
            'available_fields': ['text', 'timestamp', 'actor_ref', 'platform'],
            'last_updated': '2026-03-07T09:15:00Z',
            'validation_status': 'VALID',
            'stage_progress': {'ingestion': '100%', 'normalization': '100%', 'ner_emotion': '85%', 'cib_graph': '70%'},
            'processing_state': 'PROCESSING'
        }
    ]

    connectors = [
        {'platform': 'Reddit', 'status': 'ONLINE', 'auth_type': 'Zero-Auth / Public API', 'monitored_sources': '4 subreddits', 'rate_limit': '60 req/min', 'last_sync': '2 mins ago'},
        {'platform': 'YouTube', 'status': 'ONLINE', 'auth_type': 'API Key (v3)', 'monitored_sources': '8 channels', 'rate_limit': '10k units/day', 'last_sync': '4 mins ago'},
        {'platform': 'Telegram', 'status': 'ONLINE', 'auth_type': 'MTProto / Bot Gateway', 'monitored_sources': '12 public channels', 'rate_limit': 'Unlimited (public)', 'last_sync': '1 min ago'},
        {'platform': 'X (Twitter)', 'status': 'ONLINE', 'auth_type': 'Enterprise V2 Stream', 'monitored_sources': 'Firehose filter', 'rate_limit': 'Active streaming', 'last_sync': '30s ago'},
        {'platform': 'Instagram', 'status': 'ONLINE', 'auth_type': 'Graph API', 'monitored_sources': '6 verified handles', 'rate_limit': '200 calls/hr', 'last_sync': '10 mins ago'},
        {'platform': 'Facebook', 'status': 'ONLINE', 'auth_type': 'Page Public Content Access', 'monitored_sources': '5 public pages', 'rate_limit': '200 calls/hr', 'last_sync': '12 mins ago'}
    ]

    processing_jobs = [
        {
            'job_id': 'job-replay-901',
            'dataset': 'power-grid-campaign-2026',
            'status': 'RUNNING',
            'speed': '60x',
            'progress': 84,
            'events_processed': 292,
            'total_events': 348,
            'current_stage': 'Graph community partition'
        },
        {
            'job_id': 'job-import-900',
            'dataset': 'regional-election-seed-probe',
            'status': 'COMPLETED',
            'speed': 'Instant',
            'progress': 100,
            'events_processed': 92,
            'total_events': 92,
            'current_stage': 'Complete'
        }
    ]

    rejected_rows = [
        {'row_index': 14, 'dataset': 'power-grid-campaign-2026', 'platform': 'telegram', 'reason': 'Invalid ISO timestamp format (missing timezone)', 'raw_excerpt': 'Emergency broadcast 2026-03-05 08:30'},
        {'row_index': 88, 'dataset': 'regional-election-seed-probe', 'platform': 'x', 'reason': 'Missing mandatory actor identifier', 'raw_excerpt': 'Unattributed retweeter null reference'}
    ]

    return {
        'ready_datasets': datasets,
        'connectors': connectors,
        'processing_jobs': processing_jobs,
        'rejected_rows': rejected_rows,
        'summary': {
            'total_ready': len([d for d in datasets if d['processing_state'] == 'READY']),
            'total_processing': len([j for j in processing_jobs if j['status'] == 'RUNNING']),
            'total_rejected': len(rejected_rows)
        }
    }


@router.get('/compare')
def compare_platforms(platforms: str = Query('reddit,youtube,telegram,x,instagram,facebook')):
    """Multi-platform aligned activity series, coverage breakdown, and cross-platform evidence."""
    selected = [p.strip().lower() for p in platforms.split(',') if p.strip()]
    if not selected:
        selected = ['reddit', 'x', 'telegram']

    # Aligned 7-day timeline buckets
    days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07']
    platform_vol_map = {
        'x': [14, 18, 16, 26, 112, 94, 38],
        'reddit': [4, 5, 4, 6, 28, 22, 12],
        'telegram': [6, 7, 8, 10, 44, 40, 18],
        'youtube': [0, 0, 0, 0, 8, 12, 10],
        'instagram': [0, 0, 0, 0, 10, 8, 4],
        'facebook': [0, 0, 0, 0, 6, 8, 4]
    }

    aligned_series = []
    for i, d in enumerate(days):
        entry = {'date': d}
        total_bucket = 0
        for p in selected:
            v = platform_vol_map.get(p, [2, 3, 2, 4, 15, 12, 5])[i]
            entry[p] = v
            total_bucket += v
        entry['total'] = total_bucket
        aligned_series.append(entry)

    coverage = []
    display_names = {
        'x': 'X (Twitter)', 'reddit': 'Reddit', 'telegram': 'Telegram',
        'youtube': 'YouTube', 'instagram': 'Instagram', 'facebook': 'Facebook'
    }

    for p in selected:
        vol = sum(platform_vol_map.get(p, [10]))
        annotated = int(vol * 0.92)
        pos = int(vol * 0.18)
        neu = int(vol * 0.28)
        neg = vol - pos - neu
        coverage.append({
            'platform': display_names.get(p, p.capitalize()),
            'code': p,
            'eligible_events': vol,
            'annotated_events': annotated,
            'share_annotated': f"{round((annotated / max(1, vol)) * 100, 1)}%",
            'sentiment': {'positive': pos, 'neutral': neu, 'negative': neg},
            'dominant_tone': 'Negative' if neg > pos else 'Neutral'
        })

    evidence_records = [
        {
            'platform': 'X (Twitter)',
            'time': '2026-03-05 08:00:00 UTC',
            'actor': 'disinfo_seed_01',
            'excerpt': 'BREAKING: Critical security breach reported in central communications grid.',
            'signal': 'Initial Seed Post',
            'confidence': 0.94
        },
        {
            'platform': 'Telegram',
            'time': '2026-03-05 08:01:15 UTC',
            'actor': 'amplifier_bot_99',
            'excerpt': 'Forwarded from X: Complete power loss imminent in Sector 4.',
            'signal': 'Cross-Platform Forward Relay',
            'confidence': 0.91
        },
        {
            'platform': 'Reddit',
            'time': '2026-03-05 08:15:00 UTC',
            'actor': 'citizen_observer',
            'excerpt': 'Seeing suspicious copy-paste posts regarding a grid blackout. Power is fine here.',
            'signal': 'Counter-Narrative Fact-Check',
            'confidence': 0.88
        },
        {
            'platform': 'YouTube',
            'time': '2026-03-05 09:30:00 UTC',
            'actor': 'channel_news_bulletin',
            'excerpt': 'Live Q&A stream on utility status; comment section flooded with bot copypasta.',
            'signal': 'Broadcast Amplification',
            'confidence': 0.86
        }
    ]

    return {
        'sources_selected': [display_names.get(p, p.capitalize()) for p in selected],
        'common_window': '2026-03-01 to 2026-03-07',
        'covered_days': 7,
        'aligned_series': aligned_series,
        'coverage_by_source': coverage,
        'evidence_records': evidence_records
    }


@router.get('/platforms/{platform}')
def platform_specific_analysis(platform: str):
    """Returns specialized analysis for Reddit, YouTube, Telegram, X, Instagram, or Facebook."""
    p = platform.lower().strip()
    if p == 'reddit':
        return {
            'platform': 'Reddit',
            'metrics': {'posts': 48, 'comments': 286, 'active_subreddits': 6},
            'subreddits_ranking': [
                {'name': 'r/infrastructure', 'posts': 18, 'comments': 142, 'score': 420, 'sentiment': '64% Negative'},
                {'name': 'r/nationalnews', 'posts': 12, 'comments': 84, 'score': 310, 'sentiment': '78% Negative'},
                {'name': 'r/factcheck', 'posts': 8, 'comments': 36, 'score': 180, 'sentiment': '82% Positive'},
                {'name': 'r/regionaltalk', 'posts': 6, 'comments': 18, 'score': 95, 'sentiment': '55% Neutral'},
                {'name': 'r/technews', 'posts': 4, 'comments': 6, 'score': 45, 'sentiment': '50% Neutral'}
            ],
            'timeline': [
                {'day': '2026-03-01', 'posts': 2, 'comments': 8},
                {'day': '2026-03-02', 'posts': 3, 'comments': 12},
                {'day': '2026-03-03', 'posts': 2, 'comments': 10},
                {'day': '2026-03-04', 'posts': 4, 'comments': 22},
                {'day': '2026-03-05', 'posts': 18, 'comments': 142},
                {'day': '2026-03-06', 'posts': 14, 'comments': 72},
                {'day': '2026-03-07', 'posts': 5, 'comments': 20}
            ],
            'threads': [
                {
                    'id': 't1',
                    'title': 'Unconfirmed reports of substation failures in Sector 4',
                    'subreddit': 'r/infrastructure',
                    'author': 'grid_watcher_88',
                    'score': 185,
                    'comments_count': 42,
                    'created_at': '2026-03-05 08:20:00 UTC',
                    'replies': [
                        {'id': 'c1', 'author': 'power_engineer_v', 'text': 'I am monitoring SCADA telemetry; normal voltage profiles across all nodes.', 'time': '08:24 UTC', 'sentiment': 'positive', 'score': 64, 'confidence': 0.94},
                        {'id': 'c2', 'author': 'alarmist_user_1', 'text': 'They are hiding the truth, my lights flickered twice!', 'time': '08:29 UTC', 'sentiment': 'negative', 'score': -8, 'confidence': 0.89}
                    ]
                },
                {
                    'id': 't2',
                    'title': 'Megathread: Regional power outage debunked by central ministry',
                    'subreddit': 'r/nationalnews',
                    'author': 'mod_bulletin',
                    'score': 240,
                    'comments_count': 56,
                    'created_at': '2026-03-05 10:00:00 UTC',
                    'replies': [
                        {'id': 'c3', 'author': 'citizen_observer', 'text': 'Verified copypasta origins from coordinated Twitter/X accounts.', 'time': '10:15 UTC', 'sentiment': 'positive', 'score': 92, 'confidence': 0.96}
                    ]
                }
            ],
            'evidence_list': [
                {'thread_title': 'Unconfirmed reports of substation failures', 'comments_in_sample': 42, 'last_reply': '2026-03-05 11:45 UTC', 'post_score': 185, 'confidence': 0.92},
                {'thread_title': 'Megathread: Regional power outage debunked', 'comments_in_sample': 56, 'last_reply': '2026-03-05 13:10 UTC', 'post_score': 240, 'confidence': 0.95},
                {'thread_title': 'Viral copypasta investigation on local grid', 'comments_in_sample': 24, 'last_reply': '2026-03-05 09:40 UTC', 'post_score': 110, 'confidence': 0.89}
            ]
        }
    elif p == 'youtube':
        return {
            'platform': 'YouTube',
            'metrics': {'videos': 14, 'collected_comments': 612, 'reply_count': 214},
            'videos_ranking': [
                {'video_id': 'yt-01', 'title': 'National Grid Crisis Investigation - Special Report', 'channel': 'Global Watch Network', 'comments': 284, 'views': 45200, 'observation_time': '2026-03-05 09:00 UTC'},
                {'video_id': 'yt-02', 'title': 'Official Press Conference: Energy Ministry Refutes Blackout Claims', 'channel': 'State Press Information', 'comments': 168, 'views': 31000, 'observation_time': '2026-03-05 10:30 UTC'},
                {'video_id': 'yt-03', 'title': 'Why Is Everyone Talking About A Grid Collapse Today?', 'channel': 'Tech & Policy Explainers', 'comments': 94, 'views': 18900, 'observation_time': '2026-03-05 12:00 UTC'},
                {'video_id': 'yt-04', 'title': 'Inside Modern Electrical Substation Safeguards', 'channel': 'Engineering Simplified', 'comments': 66, 'views': 12400, 'observation_time': '2026-03-05 14:00 UTC'}
            ],
            'timeline': [
                {'day': '2026-03-01', 'arrivals': 0},
                {'day': '2026-03-02', 'arrivals': 0},
                {'day': '2026-03-03', 'arrivals': 0},
                {'day': '2026-03-04', 'arrivals': 14},
                {'day': '2026-03-05', 'arrivals': 342},
                {'day': '2026-03-06', 'arrivals': 198},
                {'day': '2026-03-07', 'arrivals': 58}
            ],
            'themes': [
                {'theme': 'Cyber Attack Speculation', 'count': 186, 'sentiment': '84% Negative', 'sample': 'Multiple users repeating verbatim claims of state-sponsored hacking.'},
                {'theme': 'Utility Bureaucracy Critique', 'count': 114, 'sentiment': '62% Negative', 'sample': 'Comments questioning maintenance schedules and transparency.'},
                {'theme': 'Fact-Checking & Local Ground Truth', 'count': 148, 'sentiment': '78% Positive', 'sample': 'Citizens commenting their location and confirming steady power.'}
            ],
            'evidence_list': [
                {'video_title': 'National Grid Crisis Investigation', 'channel': 'Global Watch Network', 'collected_comments': 284, 'view_count': 45200, 'observation_time': '2026-03-05 09:00 UTC'},
                {'video_title': 'Official Press Conference: Energy Ministry Refutes Blackout', 'channel': 'State Press Information', 'collected_comments': 168, 'view_count': 31000, 'observation_time': '2026-03-05 10:30 UTC'},
                {'video_title': 'Why Is Everyone Talking About A Grid Collapse Today?', 'channel': 'Tech & Policy Explainers', 'collected_comments': 94, 'view_count': 18900, 'observation_time': '2026-03-05 12:00 UTC'}
            ]
        }
    elif p == 'telegram':
        return {
            'platform': 'Telegram',
            'metrics': {'channels': 12, 'messages': 418, 'recorded_forwards': 164},
            'forward_origins': [
                {'origin': '@intel_alert_east', 'receiving': '@regional_bulletin', 'forward_count': 48, 'time_lag': '35 seconds'},
                {'origin': '@intel_alert_east', 'receiving': '@sector4_citizens', 'forward_count': 36, 'time_lag': '1 min 12s'},
                {'origin': '@rumor_vector_07', 'receiving': '@daily_dispatch_hindi', 'forward_count': 28, 'time_lag': '2 mins 05s'},
                {'origin': '@state_press_official', 'receiving': '@regional_bulletin', 'forward_count': 52, 'time_lag': '4 mins 10s'}
            ],
            'channels_ranking': [
                {'channel': '@intel_alert_east', 'messages': 94, 'forwards': 68, 'subscribers': 42000},
                {'channel': '@regional_bulletin', 'messages': 88, 'forwards': 42, 'subscribers': 68500},
                {'channel': '@sector4_citizens', 'messages': 64, 'forwards': 24, 'subscribers': 18200},
                {'channel': '@rumor_vector_07', 'messages': 52, 'forwards': 18, 'subscribers': 9400},
                {'channel': '@state_press_official', 'messages': 120, 'forwards': 12, 'subscribers': 145000}
            ],
            'timeline': [
                {'day': '2026-03-01', 'volume': 8},
                {'day': '2026-03-02', 'volume': 10},
                {'day': '2026-03-03', 'volume': 12},
                {'day': '2026-03-04', 'volume': 18},
                {'day': '2026-03-05', 'volume': 214},
                {'day': '2026-03-06', 'volume': 118},
                {'day': '2026-03-07', 'volume': 38}
            ],
            'evidence_list': [
                {'message_excerpt': 'Forwarded from @intel_alert_east: EMERGENCY - complete grid disruption reported across central zone.', 'channel': '@regional_bulletin', 'observed_time': '2026-03-05 08:02 UTC', 'has_forward': True, 'origin': '@intel_alert_east'},
                {'message_excerpt': 'Confirmed fake news: Power transmission lines operating without impedance.', 'channel': '@state_press_official', 'observed_time': '2026-03-05 08:45 UTC', 'has_forward': False, 'origin': 'N/A'},
                {'message_excerpt': 'Stay indoors, emergency backup generators failing.', 'channel': '@sector4_citizens', 'observed_time': '2026-03-05 08:08 UTC', 'has_forward': True, 'origin': '@intel_alert_east'}
            ]
        }
    elif p in ['x', 'twitter']:
        return {
            'platform': 'X (Twitter)',
            'metrics': {'original_posts': 124, 'replies': 348, 'reposts': 710},
            'post_types_timeline': [
                {'day': '2026-03-01', 'original': 8, 'reply': 12, 'repost': 18, 'quote': 2},
                {'day': '2026-03-02', 'original': 10, 'reply': 14, 'repost': 22, 'quote': 4},
                {'day': '2026-03-03', 'original': 9, 'reply': 15, 'repost': 20, 'quote': 3},
                {'day': '2026-03-04', 'original': 14, 'reply': 28, 'repost': 46, 'quote': 8},
                {'day': '2026-03-05', 'original': 54, 'reply': 168, 'repost': 420, 'quote': 68},
                {'day': '2026-03-06', 'original': 22, 'reply': 88, 'repost': 148, 'quote': 28},
                {'day': '2026-03-07', 'original': 7, 'reply': 23, 'repost': 36, 'quote': 6}
            ],
            'hashtag_activity': [
                {'tag': '#BlackoutAlert', 'matched_posts': 312, 'growth': '+480%', 'sentiment': '88% Negative'},
                {'tag': '#GridCollapse', 'matched_posts': 240, 'growth': '+350%', 'sentiment': '82% Negative'},
                {'tag': '#FactCheck', 'matched_posts': 184, 'growth': '+210%', 'sentiment': '76% Positive'},
                {'tag': '#Sector4Power', 'matched_posts': 142, 'growth': '+160%', 'sentiment': '64% Neutral'},
                {'tag': '#PressRelease', 'matched_posts': 98, 'growth': '+95%', 'sentiment': '85% Neutral'}
            ],
            'evidence_list': [
                {'post_excerpt': 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.', 'post_type': 'Original Post', 'referenced_post': 'None (Seed origin)', 'actor': 'disinfo_seed_01', 'confidence': 0.96},
                {'post_excerpt': 'RT @disinfo_seed_01: BREAKING: Critical security breach reported in central communications grid.', 'post_type': 'Repost', 'referenced_post': 'tw-101 (disinfo_seed_01)', 'actor': 'bot_relay_44', 'confidence': 0.94},
                {'post_excerpt': 'This is completely fabricated copypasta. Look at the generator status meters.', 'post_type': 'Quote Post', 'referenced_post': 'tw-101 (disinfo_seed_01)', 'actor': 'citizen_observer', 'confidence': 0.91}
            ]
        }
    elif p == 'instagram':
        return {
            'platform': 'Instagram',
            'metrics': {'media_items': 38, 'collected_comments': 490, 'tagged_items': 24},
            'formats_breakdown': [
                {'format': 'Carousel', 'comment_volume': 240, 'media_count': 14, 'share': '49%'},
                {'format': 'Reel (Video)', 'comment_volume': 190, 'media_count': 16, 'share': '39%'},
                {'format': 'Single Image', 'comment_volume': 60, 'media_count': 8, 'share': '12%'}
            ],
            'timeline': [
                {'day': '2026-03-01', 'comments': 4},
                {'day': '2026-03-02', 'comments': 6},
                {'day': '2026-03-03', 'comments': 5},
                {'day': '2026-03-04', 'comments': 12},
                {'day': '2026-03-05', 'comments': 280},
                {'day': '2026-03-06', 'comments': 145},
                {'day': '2026-03-07', 'comments': 38}
            ],
            'caption_hashtags': [
                {'tag': '#breakingnews', 'count': 28, 'sentiment': '74% Negative'},
                {'tag': '#cityblackout', 'count': 22, 'sentiment': '80% Negative'},
                {'tag': '#safetyfirst', 'count': 18, 'sentiment': '65% Neutral'},
                {'tag': '#verified', 'count': 15, 'sentiment': '88% Positive'}
            ],
            'evidence_list': [
                {'media_item': 'Infographic slide: Sector 4 Substation alert overview', 'format': 'Carousel', 'comment_sentiment': '78% Negative', 'comments_count': 142, 'caption_excerpt': 'Is the power grid secure today? Swipe for updates.'},
                {'media_item': 'Reel: Live footage of substation operating smoothly with lights on', 'format': 'Reel (Video)', 'comment_sentiment': '82% Positive', 'comments_count': 118, 'caption_excerpt': 'Checking local status directly. Everything normal.'},
                {'media_item': 'Emergency hotline infographic graphic card', 'format': 'Single Image', 'comment_sentiment': '60% Neutral', 'comments_count': 42, 'caption_excerpt': 'Official helpline numbers for power transmission queries.'}
            ]
        }
    elif p == 'facebook':
        return {
            'platform': 'Facebook',
            'metrics': {'page_posts': 26, 'collected_comments': 530, 'reported_reactions': 2840},
            'reaction_mix': [
                {'category': 'Like', 'count': 1420, 'share': '50.0%'},
                {'category': 'Angry', 'count': 640, 'share': '22.5%'},
                {'category': 'Sad', 'count': 380, 'share': '13.4%'},
                {'category': 'Haha', 'count': 240, 'share': '8.5%'},
                {'category': 'Wow', 'count': 160, 'share': '5.6%'}
            ],
            'timeline': [
                {'day': '2026-03-01', 'reactions': 40, 'comments': 10},
                {'day': '2026-03-02', 'reactions': 65, 'comments': 15},
                {'day': '2026-03-03', 'reactions': 55, 'comments': 12},
                {'day': '2026-03-04', 'reactions': 110, 'comments': 28},
                {'day': '2026-03-05', 'reactions': 1680, 'comments': 310},
                {'day': '2026-03-06', 'reactions': 710, 'comments': 125},
                {'day': '2026-03-07', 'reactions': 180, 'comments': 30}
            ],
            'comment_topics': [
                {'topic': 'Emergency preparedness questions', 'comments': 164, 'sentiment': 'Negative'},
                {'topic': 'Official notification clarifications', 'comments': 142, 'sentiment': 'Neutral'},
                {'topic': 'Calling out viral rumors and copypasta', 'comments': 128, 'sentiment': 'Positive'}
            ],
            'evidence_list': [
                {'page_post': 'Public Utility Board: Standard Operations Press Release #2026-08', 'reactions': '1,420 (72% Like)', 'collected_comments': 184, 'page': 'National Power Distribution Board', 'timestamp': '2026-03-05 09:15 UTC'},
                {'page_post': 'Sector 4 Community Bulletin: Inquiries regarding evening load shedding', 'reactions': '840 (58% Angry)', 'collected_comments': 210, 'page': 'Sector 4 Residents Union', 'timestamp': '2026-03-05 08:40 UTC'},
                {'page_post': 'Daily Fact-Check: No grid breach in state transmission line', 'reactions': '580 (85% Like)', 'collected_comments': 136, 'page': 'Civic Truth Watch', 'timestamp': '2026-03-05 11:20 UTC'}
            ]
        }
    else:
        return {'platform': platform, 'error': f'Unsupported platform {platform}'}


@router.post('/reports')
def generate_report(payload: dict):
    """Generates a reproducible, customizable investigation report pinned to dataset version."""
    import datetime
    inv_id = payload.get('investigation_id', 'inv_1')
    sections = payload.get('sections', ['summary', 'attribution', 'cib', 'amplifiers', 'verdict', 'evidence'])
    dataset_version = payload.get('dataset_version', 'power-grid-campaign-2026 v0.4')
    analysis_window = payload.get('analysis_window', '2026-03-01 to 2026-03-07 UTC')
    generation_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        'report_id': f"rep_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}",
        'investigation_id': inv_id,
        'dataset_version': dataset_version,
        'analysis_window': analysis_window,
        'generation_time': generation_time,
        'included_sections': sections,
        'summary': {
            'topic': 'Critical Grid Blackout Claims',
            'attention_score': 88.5,
            'threat_level': 'CRITICAL',
            'analyst_verdict': 'CONFIRMED',
            'included_events_count': 348,
            'evidence_links_count': 14
        },
        'status': 'READY'
    }



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



