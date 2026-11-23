"""Reddit connector for SocialScope.

Supports:
1. Zero-auth public JSON fetching (no API credentials required, immediate testable use).
2. Authenticated OAuth script app fetching (using REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET).
"""

import os
import re
import time
from datetime import datetime, timezone
import httpx

from backend.app.schemas.event import CanonicalEvent, Engagement, Interaction

_HASHTAG_REGEX = re.compile(r"#\w+")
_URL_REGEX = re.compile(r"https?://[^\s<>\"']+")


class RedditConnector:
    """Fetches posts and discussions from Reddit and maps them to CanonicalEvent."""

    def __init__(
        self,
        client_id: str | None = None,
        client_secret: str | None = None,
        user_agent: str | None = None,
    ):
        self.client_id = client_id or os.getenv("REDDIT_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("REDDIT_CLIENT_SECRET")
        self.user_agent = user_agent or os.getenv("REDDIT_USER_AGENT", "SocialScope-Intelligence/1.0 (Enterprise Research)")
        self._access_token: str | None = None
        self._token_expiry: float = 0

    def _get_auth_token(self) -> str | None:
        """Obtains an OAuth bearer token if client credentials are provided."""
        if not self.client_id or not self.client_secret:
            return None

        if self._access_token and time.time() < self._token_expiry - 60:
            return self._access_token

        auth = httpx.BasicAuth(self.client_id, self.client_secret)
        headers = {"User-Agent": self.user_agent}
        data = {"grant_type": "client_credentials"}

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://www.reddit.com/api/v1/access_token", auth=auth, data=data, headers=headers)
                if res.status_code == 200:
                    payload = res.json()
                    self._access_token = payload.get("access_token")
                    expires_in = payload.get("expires_in", 3600)
                    self._token_expiry = time.time() + expires_in
                    return self._access_token
        except Exception:
            pass
        return None

    def fetch_subreddit_posts(
        self,
        subreddit: str = "technology",
        sort: str = "new",
        limit: int = 25,
    ) -> list[CanonicalEvent]:
        """Fetches latest posts from a subreddit and normalizes them into CanonicalEvent."""
        limit = max(1, min(limit, 100))
        token = self._get_auth_token()

        if token:
            url = f"https://oauth.reddit.com/r/{subreddit}/{sort}"
            headers = {"Authorization": f"bearer {token}", "User-Agent": self.user_agent}
            params = {"limit": limit}
        else:
            url = f"https://www.reddit.com/r/{subreddit}/{sort}.json"
            headers = {"User-Agent": self.user_agent}
            params = {"limit": limit}

        with httpx.Client(timeout=15.0) as client:
            res = client.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        children = data.get("data", {}).get("children", [])
        events: list[CanonicalEvent] = []
        for child in children:
            post_data = child.get("data", {})
            event = self.normalize_post(post_data, subreddit=subreddit)
            if event:
                events.append(event)

        return events

    def fetch_search_posts(
        self,
        query: str,
        subreddit: str | None = None,
        sort: str = "new",
        limit: int = 25,
    ) -> list[CanonicalEvent]:
        """Searches Reddit posts by keyword/query."""
        limit = max(1, min(limit, 100))
        token = self._get_auth_token()

        if subreddit:
            base = f"https://oauth.reddit.com/r/{subreddit}/search" if token else f"https://www.reddit.com/r/{subreddit}/search.json"
        else:
            base = "https://oauth.reddit.com/search" if token else "https://www.reddit.com/search.json"

        params = {"q": query, "sort": sort, "limit": limit, "restrict_sr": bool(subreddit)}
        headers = {"User-Agent": self.user_agent}
        if token:
            headers["Authorization"] = f"bearer {token}"

        with httpx.Client(timeout=15.0) as client:
            res = client.get(base, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()

        children = data.get("data", {}).get("children", [])
        events: list[CanonicalEvent] = []
        for child in children:
            post_data = child.get("data", {})
            event = self.normalize_post(post_data, subreddit=subreddit)
            if event:
                events.append(event)

        return events

    def normalize_post(self, data: dict, subreddit: str | None = None) -> CanonicalEvent | None:
        """Converts raw Reddit post data into a verified CanonicalEvent."""
        post_id = data.get("id")
        title = (data.get("title") or "").strip()
        selftext = (data.get("selftext") or "").strip()

        if not post_id or not title:
            return None

        # Build combined body
        if selftext and selftext != "[deleted]" and selftext != "[removed]":
            body = f"{title}\n\n{selftext}"
        else:
            body = title

        # Author handle
        author = data.get("author")
        actor_ref = f"u/{author}" if author and author not in {"[deleted]", "[removed]"} else None

        # Timestamp in UTC
        created_utc = data.get("created_utc", time.time())
        ts = datetime.fromtimestamp(created_utc, tz=timezone.utc)

        # Subreddit as hashtag
        sub = data.get("subreddit") or subreddit or "reddit"
        hashtags = [f"#{sub}"]
        for h in _HASHTAG_REGEX.findall(body):
            clean_h = h.lower()
            if clean_h not in hashtags:
                hashtags.append(clean_h)

        # External URLs
        urls: list[str] = []
        ext_url = data.get("url")
        if ext_url and not ext_url.startswith("https://www.reddit.com/r/"):
            urls.append(ext_url)
        for u in _URL_REGEX.findall(body):
            if u not in urls:
                urls.append(u)

        # Engagement metrics
        score = data.get("score")
        likes = max(0, score) if score is not None else None
        num_comments = data.get("num_comments")
        replies = max(0, num_comments) if num_comments is not None else None

        engagement = Engagement(
            likes=likes,
            replies=replies,
            shares=None,
            views=data.get("view_count"),
        )

        # Interactions (e.g. cross-posts)
        interactions: list[Interaction] = []
        crosspost_parent_list = data.get("crosspost_parent_list", [])
        if crosspost_parent_list and isinstance(crosspost_parent_list, list):
            parent = crosspost_parent_list[0]
            if parent.get("id"):
                interactions.append(
                    Interaction(
                        kind="share",
                        target_type="event",
                        target_source_id=f"reddit_{parent['id']}",
                        target_platform="reddit",
                    )
                )

        return CanonicalEvent(
            platform="reddit",
            source_id=f"reddit_{post_id}",
            actor_ref=actor_ref,
            timestamp=ts,
            text=body,
            language=None,
            hashtags=hashtags,
            urls=urls,
            engagement=engagement,
            interactions=interactions,
        )
