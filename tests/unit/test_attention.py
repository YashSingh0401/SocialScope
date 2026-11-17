import unittest
from ml.attention.cib import CIBDetector
from ml.attention.score import AttentionEngine
from ml.attention.evidence import assemble_evidence_dossier


class AttentionTests(unittest.TestCase):
    def setUp(self):
        self.cib_detector = CIBDetector(time_window_seconds=120, text_similarity_threshold=0.7)
        self.engine = AttentionEngine()

    def test_cib_detects_copypasta_campaign(self):
        # 4 different accounts posting identical propaganda within 30 seconds
        coordinated_events = [
            {"actor_ref": "bot_1", "text": "Breaking urgent announcement: city power grid failure nationwide!", "timestamp": "2026-11-17T10:00:05Z"},
            {"actor_ref": "bot_2", "text": "Breaking urgent announcement: city power grid failure nationwide!", "timestamp": "2026-11-17T10:00:15Z"},
            {"actor_ref": "bot_3", "text": "Breaking urgent announcement: city power grid failure nationwide!", "timestamp": "2026-11-17T10:00:25Z"},
            {"actor_ref": "bot_4", "text": "Breaking urgent announcement: city power grid failure nationwide!", "timestamp": "2026-11-17T10:00:40Z"}
        ]

        result = self.cib_detector.analyze_coordination(coordinated_events)
        self.assertTrue(result["is_coordinated"])
        self.assertGreater(result["coordination_score"], 0.5)
        self.assertGreaterEqual(len(result["flagged_actors"]), 2)
        self.assertGreater(len(result["reasons"]), 0)

    def test_cib_organic_traffic_not_flagged(self):
        organic_events = [
            {"actor_ref": "citizen_1", "text": "Enjoying the warm sunny afternoon in the park.", "timestamp": "2026-11-17T10:00:00Z"},
            {"actor_ref": "citizen_2", "text": "Traffic on ring road is unusually clear today.", "timestamp": "2026-11-17T10:45:00Z"},
            {"actor_ref": "citizen_3", "text": "Does anyone know when the library opens tomorrow?", "timestamp": "2026-11-17T11:30:00Z"}
        ]

        result = self.cib_detector.analyze_coordination(organic_events)
        self.assertFalse(result["is_coordinated"])
        self.assertLess(result["coordination_score"], 0.2)

    def test_attention_score_scales_with_severity(self):
        # Calm scenario
        calm = self.engine.calculate_attention(
            growth_rate=0.1,
            negative_sentiment_ratio=0.1,
            community_count=1,
            platform_count=1,
            cib_score=0.0,
            total_volume=50
        )
        self.assertLess(calm["attention_score"], 35)
        self.assertEqual(calm["severity"], "LOW")

        # Crisis scenario: 3x growth, 85% negative sentiment, 4 communities, 3 platforms, CIB botnet
        crisis = self.engine.calculate_attention(
            growth_rate=3.0,
            negative_sentiment_ratio=0.85,
            community_count=4,
            platform_count=3,
            cib_score=0.9,
            total_volume=100
        )
        self.assertGreaterEqual(crisis["attention_score"], 75)
        self.assertEqual(crisis["severity"], "CRITICAL")
        self.assertGreater(len(crisis["reasons"]), 2)

    def test_evidence_dossier_identifies_patient_zero(self):
        events = [
            {"event_id": "ev-late", "actor_ref": "amplifier", "platform": "x", "timestamp": "2026-11-17T12:00:00Z", "text": "Viral rumor!"},
            {"event_id": "ev-early", "actor_ref": "source_zero", "platform": "telegram", "timestamp": "2026-11-17T09:00:00Z", "text": "Initial leaked rumor."}
        ]

        attention = {"attention_score": 82, "severity": "CRITICAL", "reasons": ["High velocity"], "signals": {}}
        cib = {"is_coordinated": False, "coordination_score": 0.1, "flagged_actors": [], "reasons": []}

        dossier = assemble_evidence_dossier("Power Outage", attention, cib, events)
        self.assertEqual(dossier["patient_zero"]["event_id"], "ev-early")
        self.assertEqual(dossier["patient_zero"]["actor_ref"], "source_zero")
        self.assertEqual(dossier["patient_zero"]["platform"], "telegram")


if __name__ == "__main__":
    unittest.main()
