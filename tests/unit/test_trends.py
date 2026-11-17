import unittest
from ml.trends.detector import TrendDetector


class TrendTests(unittest.TestCase):
    def setUp(self):
        self.detector = TrendDetector(spike_growth_threshold=1.5, min_spike_volume=5)

    def test_steady_traffic_does_not_flag_spike(self):
        history = [10, 11, 10, 12, 10]
        current = 11
        metrics = self.detector.compute_trend(history, current)
        self.assertFalse(metrics["is_spike"])
        self.assertAlmostEqual(metrics["velocity"], 1.0)
        self.assertLess(metrics["growth_rate"], 0.5)

    def test_sudden_surge_flags_spike(self):
        # Baseline ~10, suddenly surges to 45
        history = [8, 10, 9, 11, 10]
        current = 45
        metrics = self.detector.compute_trend(history, current)
        self.assertTrue(metrics["is_spike"])
        self.assertGreater(metrics["growth_rate"], 2.0)
        self.assertEqual(metrics["velocity"], 35.0)

    def test_low_volume_surge_ignored_under_min_volume(self):
        # Surges from 1 to 3 (growth is 200%), but volume is under min_spike_volume (5)
        history = [1, 1, 1]
        current = 3
        metrics = self.detector.compute_trend(history, current)
        self.assertFalse(metrics["is_spike"])

    def test_timeline_analysis_enriches_all_buckets(self):
        timeline = [
            {"day": "2026-11-01", "count": 10},
            {"day": "2026-11-02", "count": 12},
            {"day": "2026-11-03", "count": 60}
        ]
        analyzed = self.detector.analyze_topic_timeline(timeline)
        self.assertEqual(len(analyzed), 3)
        self.assertFalse(analyzed[0]["is_spike"])
        self.assertTrue(analyzed[2]["is_spike"])


if __name__ == "__main__":
    unittest.main()
