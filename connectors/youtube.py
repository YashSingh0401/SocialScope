"""YouTube connector for SocialScope.

Supports:
1. Official YouTube Data API v3 (videos search and comment threads) via YOUTUBE_API_KEY.
2. Zero-auth public channel RSS feed parsing for video metadata.
"""

import os
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
import httpx

from backend.app.schemas.event import CanonicalEvent, Engagement, Interaction

_HASHTAG_REGEX = re.compile(r"#\w+")
_URL_REGEX = re.compile(r"https?://[^\s<>\"']+")


class YouTubeConnector:
    """Fetches video records and comments from YouTube and maps them to CanonicalEvent."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("YOUTUBE_API_KEY")
        self.base_url = "https://www.googleapis.com/youtube/v3"

    def search_videos(self, query: str, max_results: int = 15) -> list[CanonicalEvent]:
        """Searches YouTube for videos matching a query using the Data API v3."""
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY is required for video search. Set it in .env or pass to constructor.")

        max_results = max(1, min(max_results, 50))
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": self.api_key,
        }

        with httpx.Client(timeout=15.0) as client:
            res = client.get(f"{self.base_url}/search", params=params)
            res.raise_for_status()
            data = res.json()

        events: list[CanonicalEvent] = []
        for item in data.get("items", []):
            event = self.normalize_video_item(item)
            if event:
                events.append(event)
        return events

    def fetch_video_comments(self, video_id: str, max_results: int = 25) -> list[CanonicalEvent]:
        """Fetches top-level comments for a specific YouTube video."""
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY is required for comment extraction. Set it in .env or pass to constructor.")

        max_results = max(1, min(max_results, 100))
        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": max_results,
            "textFormat": "plainText",
            "key": self.api_key,
        }

        with httpx.Client(timeout=15.0) as client:
            res = client.get(f"{self.base_url}/commentThreads", params=params)
            res.raise_for_status()
            data = res.json()

        events: list[CanonicalEvent] = []
        for item in data.get("items", []):
            top_level = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
            comment_id = item.get("id") or top_level.get("id")
            if not comment_id:
                continue

            text = (top_level.get("textDisplay") or top_level.get("textOriginal") or "").strip()
            if not text:
                continue

            author = top_level.get("authorDisplayName")
            pub_at = top_level.get("publishedAt")
            if pub_at:
                ts = datetime.fromisoformat(pub_at.replace("Z", "+00:00")).astimezone(timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            likes = top_level.get("likeCount", 0)
            total_reply_count = item.get("snippet", {}).get("totalReplyCount", 0)

            hashtags = [h.lower() for h in _HASHTAG_REGEX.findall(text)]
            urls = _URL_REGEX.findall(text)

            interactions = [
                Interaction(
                    kind="reply",
                    target_type="event",
                    target_source_id=f"yt_vid_{video_id}",
                    target_platform="youtube",
                )
            ]

            events.append(
                CanonicalEvent(
                    platform="youtube",
                    source_id=f"yt_cmt_{comment_id}",
                    actor_ref=author,
                    timestamp=ts,
                    text=text,
                    language=None,
                    hashtags=hashtags,
                    urls=urls,
                    engagement=Engagement(likes=likes, replies=total_reply_count),
                    interactions=interactions,
                )
            )

        return events

    def fetch_channel_feed_rss(self, channel_id: str) -> list[CanonicalEvent]:
        """Zero-auth fallback: parses a public YouTube channel RSS feed without needing an API key."""
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        headers = {"User-Agent": "SocialScope-Intelligence/1.0 (Enterprise Research)"}

        with httpx.Client(timeout=15.0) as client:
            res = client.get(url, headers=headers)
            res.raise_for_status()
            xml_text = res.text

        events: list[CanonicalEvent] = []
        root = ET.fromstring(xml_text)
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "yt": "http://www.youtube.com/xml/schemas/2015",
            "media": "http://search.yahoo.com/mrss/",
        }

        channel_title = root.findtext("atom:title", default="YouTube Channel", namespaces=ns)

        for entry in root.findall("atom:entry", ns):
            vid_elem = entry.find("yt:videoId", ns)
            if vid_elem is None or not vid_elem.text:
                continue
            video_id = vid_elem.text

            title = entry.findtext("atom:title", default="", namespaces=ns).strip()
            desc = ""
            media_group = entry.find("media:group", ns)
            if media_group is not None:
                desc = media_group.findtext("media:description", default="", namespaces=ns).strip()

            body = f"{title}\n\n{desc}" if desc else title
            pub_date_str = entry.findtext("atom:published", default="", namespaces=ns)
            if pub_date_str:
                ts = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00")).astimezone(timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            author_name = channel_title
            author_elem = entry.find("atom:author/atom:name", ns)
            if author_elem is not None and author_elem.text:
                author_name = author_elem.text

            views = None
            if media_group is not None:
                community = media_group.find("media:community", ns)
                if community is not None:
                    stats = community.find("media:statistics", ns)
                    if stats is not None and "views" in stats.attrib:
                        try:
                            views = int(stats.attrib["views"])
                        except ValueError:
                            pass

            events.append(
                CanonicalEvent(
                    platform="youtube",
                    source_id=f"yt_vid_{video_id}",
                    actor_ref=author_name,
                    timestamp=ts,
                    text=body,
                    language=None,
                    hashtags=[h.lower() for h in _HASHTAG_REGEX.findall(body)],
                    urls=[f"https://www.youtube.com/watch?v={video_id}"],
                    engagement=Engagement(views=views),
                    interactions=[],
                )
            )

        return events

    def normalize_video_item(self, item: dict) -> CanonicalEvent | None:
        """Converts raw YouTube Data API search result item into CanonicalEvent."""
        vid_id = item.get("id", {}).get("videoId")
        if not vid_id:
            return None

        snippet = item.get("snippet", {})
        title = (snippet.get("title") or "").strip()
        desc = (snippet.get("description") or "").strip()
        if not title:
            return None

        body = f"{title}\n\n{desc}" if desc else title
        channel_title = snippet.get("channelTitle")

        pub_at = snippet.get("publishedAt")
        if pub_at:
            ts = datetime.fromisoformat(pub_at.replace("Z", "+00:00")).astimezone(timezone.utc)
        else:
            ts = datetime.now(timezone.utc)

        hashtags = [h.lower() for h in _HASHTAG_REGEX.findall(body)]
        urls = [f"https://www.youtube.com/watch?v={vid_id}"]

        return CanonicalEvent(
            platform="youtube",
            source_id=f"yt_vid_{vid_id}",
            actor_ref=channel_title,
            timestamp=ts,
            text=body,
            language=None,
            hashtags=hashtags,
            urls=urls,
            engagement=Engagement(),
            interactions=[],
        )
