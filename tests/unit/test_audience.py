import unittest
from ml.audience.aggregator import AudienceAggregator
from ml.audience.segmentation import AudienceSegmenter
from ml.audience.confidence import calculate_demographic_confidence


class AudienceTests(unittest.TestCase):
    def setUp(self):
        self.aggregator = AudienceAggregator()
        self.segmenter = AudienceSegmenter()

    def test_aggregates_actor_profiles(self):
        events = [
            {'actor_ref': 'bot_01', 'platform': 'twitter', 'language': 'en', 'timestamp': '2026-03-01T10:00:00Z'},
            {'actor_ref': 'bot_01', 'platform': 'telegram', 'language': 'en', 'timestamp': '2026-03-01T10:01:00Z'},
            {'actor_ref': 'citizen_a', 'platform': 'twitter', 'language': 'hi', 'timestamp': '2026-03-01T10:05:00Z'}
        ]
        res = self.aggregator.aggregate_actors(events)
        self.assertEqual(res['total_actors'], 2)
        bot = next(a for a in res['actors'] if a['actor_ref'] == 'bot_01')
        self.assertEqual(bot['post_count'], 2)
        self.assertEqual(len(bot['platforms']), 2)

    def test_segments_actors_by_persona(self):
        profiles = [
            {'actor_ref': 'cib_suspect', 'post_count': 5, 'platforms': ['twitter']},
            {'actor_ref': 'influencer_hub', 'post_count': 3, 'platforms': ['twitter']},
            {'actor_ref': 'ordinary_user', 'post_count': 1, 'platforms': ['reddit']}
        ]
        segmented = self.segmenter.segment_actors(
            profiles,
            graph_metrics={'top_influencers': [{'node': 'influencer_hub', 'score': 0.35}]},
            cib_flagged_actors=['cib_suspect']
        )
        personas = {a['actor_ref']: a['persona'] for a in segmented}
        self.assertEqual(personas['cib_suspect'], 'BOT_SWARM_SUSPECT')
        self.assertEqual(personas['influencer_hub'], 'KOL_INFLUENCER')
        self.assertEqual(personas['ordinary_user'], 'ORGANIC_PARTICIPANT')

    def test_confidence_scoring(self):
        conf = calculate_demographic_confidence(total_events=100, analyzed_count=90, language_distribution=[])
        self.assertEqual(conf['confidence_tier'], 'HIGH')
        self.assertTrue(conf['is_defensible'])


if __name__ == '__main__':
    unittest.main()
