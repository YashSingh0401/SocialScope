import unittest
from datetime import datetime, timezone

from connectors.reddit import RedditConnector
from connectors.youtube import YouTubeConnector
from connectors.telegram import TelegramConnector, _parse_views


class ConnectorTests(unittest.TestCase):
    def test_reddit_normalization(self):
        connector = RedditConnector()
        mock_raw = {
            "id": "abc123z",
            "title": "Major cybersecurity update released #security #patch",
            "selftext": "Details available at https://example.com/advisory regarding grid defenses.",
            "author": "analyst_john",
            "created_utc": 1774300000.0,
            "subreddit": "cybersecurity",
            "score": 42,
            "num_comments": 8,
            "url": "https://example.com/advisory",
            "crosspost_parent_list": [{"id": "parent99"}],
        }

        event = connector.normalize_post(mock_raw, subreddit="cybersecurity")
        self.assertIsNotNone(event)
        self.assertEqual(event.platform, "reddit")
        self.assertEqual(event.source_id, "reddit_abc123z")
        self.assertEqual(event.actor_ref, "u/analyst_john")
        self.assertEqual(event.engagement.likes, 42)
        self.assertEqual(event.engagement.replies, 8)
        self.assertIn("#cybersecurity", event.hashtags)
        self.assertIn("#security", event.hashtags)
        self.assertIn("https://example.com/advisory", event.urls)
        self.assertEqual(len(event.interactions), 1)
        self.assertEqual(event.interactions[0].kind, "share")
        self.assertEqual(event.interactions[0].target_source_id, "reddit_parent99")

    def test_youtube_video_normalization(self):
        connector = YouTubeConnector(api_key="mock_key")
        mock_item = {
            "id": {"videoId": "dQw4w9WgXcQ"},
            "snippet": {
                "title": "Grid Infrastructure Protection Briefing #security",
                "description": "Full briefing on power grid defenses at https://grid.org",
                "channelTitle": "CyberDefenders Official",
                "publishedAt": "2026-11-20T12:00:00Z",
            },
        }

        event = connector.normalize_video_item(mock_item)
        self.assertIsNotNone(event)
        self.assertEqual(event.platform, "youtube")
        self.assertEqual(event.source_id, "yt_vid_dQw4w9WgXcQ")
        self.assertEqual(event.actor_ref, "CyberDefenders Official")
        self.assertEqual(event.timestamp.isoformat(), "2026-11-20T12:00:00+00:00")
        self.assertIn("#security", event.hashtags)
        self.assertIn("https://www.youtube.com/watch?v=dQw4w9WgXcQ", event.urls)

    def test_telegram_views_parser(self):
        self.assertEqual(_parse_views("1.2K"), 1200)
        self.assertEqual(_parse_views("450"), 450)
        self.assertEqual(_parse_views("2.5M"), 2500000)
        self.assertIsNone(_parse_views(""))

    def test_missing_credentials_raise_informative_error(self):
        yt = YouTubeConnector(api_key=None)
        with self.assertRaises(ValueError):
            yt.search_videos("cyber")

        tg = TelegramConnector(bot_token=None)
        with self.assertRaises(ValueError):
            tg.fetch_bot_updates()
