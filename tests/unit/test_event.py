import unittest

from pydantic import ValidationError

from backend.app.schemas.event import CanonicalEvent


class EventTests(unittest.TestCase):
    def payload(self):
        return dict(platform="dataset", source_id="sample-1",
                    timestamp="2026-11-17T10:00:00+05:30", text="Sample post")

    def test_converts_local_time_to_utc(self):
        event = CanonicalEvent(**self.payload())
        self.assertEqual(event.timestamp.isoformat(), "2026-11-17T04:30:00+00:00")

    def test_unknown_engagement_is_not_zero(self):
        self.assertIsNone(CanonicalEvent(**self.payload()).engagement.likes)
        self.assertEqual(CanonicalEvent(**self.payload(), engagement={"likes": 0}).engagement.likes, 0)

    def test_rejects_bad_inputs(self):
        for change in [{"text": "   "}, {"timestamp": "2026-11-17T10:00:00"},
                       {"engagement": {"likes": -1}}, {"source_id": ""}]:
            with self.subTest(change=change), self.assertRaises(ValidationError):
                CanonicalEvent(**(self.payload() | change))
