"""Defensible behavioral persona segmentation for social media actors."""


class AudienceSegmenter:
    """Classifies actors into transparent, explainable participation personas."""

    def segment_actors(self, actor_profiles: list[dict], graph_metrics: dict = None, cib_flagged_actors: list[str] = None) -> list[dict]:
        """Assigns personas with explicit evidentiary rationale."""
        cib_set = set(cib_flagged_actors or [])
        graph_metrics = graph_metrics or {}
        influencers = {inf['node']: inf['score'] for inf in graph_metrics.get('top_influencers', [])}
        bridges = {br['node']: br['betweenness'] for br in graph_metrics.get('bridge_nodes', [])}

        segmented = []
        for a in actor_profiles:
            handle = a['actor_ref']
            posts = a.get('post_count', 0)
            platforms = len(a.get('platforms', []))
            pr_score = influencers.get(handle, 0.0)
            betweenness = bridges.get(handle, 0.0)

            # Decision tree rules for behavioral personas
            if handle in cib_set:
                persona = 'BOT_SWARM_SUSPECT'
                rationale = 'Identified by CIB detector in synchronized temporal bursts or text copypasta clusters.'
            elif pr_score > 0.15:
                persona = 'KOL_INFLUENCER'
                rationale = f'High PageRank centrality ({round(pr_score * 100, 1)}%) driving authority diffusion.'
            elif betweenness > 0.05:
                persona = 'BRIDGE_BROKER'
                rationale = f'High betweenness centrality ({round(betweenness, 3)}) linking separate echo chambers.'
            elif posts >= 10:
                persona = 'HIGH_FREQUENCY_AMPLIFIER'
                rationale = f'High broadcast frequency ({posts} posts) across channels.'
            else:
                persona = 'ORGANIC_PARTICIPANT'
                rationale = 'Standard distribution of posts and natural interaction cadence.'

            segmented.append({
                **a,
                'persona': persona,
                'rationale': rationale,
                'is_cross_platform': platforms > 1
            })

        return segmented
