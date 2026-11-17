"""Aggregates actor-level engagement, linguistic distribution, and multi-platform presence."""
from collections import defaultdict


class AudienceAggregator:
    """Aggregates raw event activity into structured participant profiles."""

    def aggregate_actors(self, events: list[dict]) -> dict:
        """Aggregates actor statistics across events."""
        actors = defaultdict(lambda: {
            'post_count': 0,
            'platforms': set(),
            'languages': defaultdict(int),
            'first_seen': None,
            'last_seen': None,
            'interactions_sent': 0,
            'interactions_received': 0,
            'total_engagement': 0
        })

        for e in events:
            actor = e.get('actor_ref')
            if not actor:
                continue

            prof = actors[actor]
            prof['post_count'] += 1

            plat = e.get('platform')
            if plat:
                prof['platforms'].add(plat)

            lang = None
            if isinstance(e.get('analysis'), dict):
                lang = e['analysis'].get('language')
            elif e.get('language'):
                lang = e.get('language')

            if lang:
                prof['languages'][lang] += 1

            ts = str(e.get('timestamp') or '')
            if not prof['first_seen'] or ts < prof['first_seen']:
                prof['first_seen'] = ts
            if not prof['last_seen'] or ts > prof['last_seen']:
                prof['last_seen'] = ts

            # Ingest payload interactions/engagement if present
            payload = e.get('payload') or {}
            if isinstance(payload, dict):
                eng = payload.get('engagement') or {}
                if isinstance(eng, dict):
                    prof['total_engagement'] += sum(v for v in eng.values() if isinstance(v, (int, float)))

        # Format into list of serializable dicts
        result = []
        for handle, data in actors.items():
            top_lang = max(data['languages'].items(), key=lambda x: x[1])[0] if data['languages'] else 'undetermined'
            result.append({
                'actor_ref': handle,
                'post_count': data['post_count'],
                'platforms': sorted(list(data['platforms'])),
                'primary_language': top_lang,
                'first_seen': data['first_seen'],
                'last_seen': data['last_seen'],
                'total_engagement': data['total_engagement']
            })

        result.sort(key=lambda a: a['post_count'], reverse=True)
        return {'actors': result, 'total_actors': len(result)}
