"""Telegram connector for SocialScope.

Supports:
1. Zero-auth public channel preview scraping (https://t.me/s/<channel>) - 100% free with no credentials.
2. Official Telegram Bot API (getUpdates) via TELEGRAM_BOT_TOKEN.
"""

import html
import os
import re
from datetime import datetime, timezone
import httpx

from backend.app.schemas.event import CanonicalEvent, Engagement, Interaction

_HASHTAG_REGEX = re.compile(r"#\w+")
_URL_REGEX = re.compile(r"https?://[^\s<>\"']+")

# Regex patterns for parsing public channel web preview at https://t.me/s/<channel>
_MSG_DIV_REGEX = re.compile(
    r'<div class="tgme_widget_message_wrap[^"]*"[^>]*>([\s\S]*?)</div>\s*</div>\s*</div>',
    re.MULTILINE,
)
_POST_ID_REGEX = re.compile(r'data-post="([^"]+)"')
_TIME_REGEX = re.compile(r'<time[^>]*datetime="([^"]+)"')
_TEXT_REGEX = re.compile(r'<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)</div>')
_VIEWS_REGEX = re.compile(r'<span class="tgme_widget_message_views">([^<]+)</span>')
_STRIP_TAGS_REGEX = re.compile(r"<[^>]+>")


def _parse_views(view_str: str) -> int | None:
    if not view_str:
        return None
    cleaned = view_str.strip().replace(" ", "").upper()
    try:
        if cleaned.endswith("K"):
            return int(float(cleaned[:-1]) * 1000)
        if cleaned.endswith("M"):
            return int(float(cleaned[:-1]) * 1_000_000)
        return int(cleaned)
    except ValueError:
        return None


class TelegramConnector:
    """Fetches public channel broadcasts and bot updates, normalizing them into CanonicalEvent."""

    def __init__(self, bot_token: str | None = None):
        self.bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")

    def fetch_public_channel_posts(self, channel_username: str, limit: int = 20) -> list[CanonicalEvent]:
        """Scrapes the public web preview for a public channel (e.g. 'durov', 'telegram') without credentials."""
        channel = channel_username.lstrip("@").strip()
        url = f"https://t.me/s/{channel}"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }

        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            res = client.get(url, headers=headers)
            res.raise_for_status()
            content = res.text

        events: list[CanonicalEvent] = []
        # Find all message blocks
        post_blocks = _MSG_DIV_REGEX.findall(content)
        if not post_blocks:
            # Fallback simpler block search
            post_blocks = content.split('class="tgme_widget_message ')

        for block in reversed(post_blocks):
            pid_match = _POST_ID_REGEX.search(block)
            if not pid_match:
                continue
            data_post = pid_match.group(1)  # e.g. "durov/248"

            time_match = _TIME_REGEX.search(block)
            if time_match:
                try:
                    ts = datetime.fromisoformat(time_match.group(1).replace("Z", "+00:00")).astimezone(timezone.utc)
                except ValueError:
                    ts = datetime.now(timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            text_match = _TEXT_REGEX.search(block)
            if not text_match:
                continue

            raw_html = text_match.group(1)
            # Convert breaks to newlines and clean tags
            clean_text = raw_html.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
            clean_text = _STRIP_TAGS_REGEX.sub("", clean_text)
            clean_text = html.unescape(clean_text).strip()

            if not clean_text:
                continue

            views = None
            views_match = _VIEWS_REGEX.search(block)
            if views_match:
                views = _parse_views(views_match.group(1))

            hashtags = [h.lower() for h in _HASHTAG_REGEX.findall(clean_text)]
            urls = _URL_REGEX.findall(clean_text)

            events.append(
                CanonicalEvent(
                    platform="telegram",
                    source_id=f"tg_{data_post.replace('/', '_')}",
                    actor_ref=f"@{channel}",
                    timestamp=ts,
                    text=clean_text,
                    language=None,
                    hashtags=hashtags,
                    urls=urls,
                    engagement=Engagement(views=views),
                    interactions=[],
                )
            )

            if len(events) >= limit:
                break

        return events

    def fetch_bot_updates(self, limit: int = 25) -> list[CanonicalEvent]:
        """Fetches updates via Telegram Bot API for channels/groups where the bot is a member."""
        if not self.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN is required for Bot API. Set it in .env or pass to constructor.")

        url = f"https://api.telegram.org/bot{self.bot_token}/getUpdates"
        params = {"limit": limit}

        with httpx.Client(timeout=15.0) as client:
            res = client.get(url, params=params)
            res.raise_for_status()
            data = res.json()

        events: list[CanonicalEvent] = []
        for update in data.get("result", []):
            msg = update.get("message") or update.get("channel_post")
            if not msg:
                continue

            text = (msg.get("text") or msg.get("caption") or "").strip()
            if not text:
                continue

            chat = msg.get("chat", {})
            chat_id = chat.get("id")
            msg_id = msg.get("message_id")
            source_id = f"tg_{chat_id}_{msg_id}"

            actor_ref = None
            if msg.get("from"):
                from_user = msg["from"]
                actor_ref = f"@{from_user.get('username')}" if from_user.get("username") else from_user.get("first_name")
            elif chat.get("title"):
                actor_ref = f"@{chat.get('username')}" if chat.get("username") else chat.get("title")

            date_val = msg.get("date")
            ts = datetime.fromtimestamp(date_val, tz=timezone.utc) if date_val else datetime.now(timezone.utc)

            hashtags = [h.lower() for h in _HASHTAG_REGEX.findall(text)]
            urls = _URL_REGEX.findall(text)

            events.append(
                CanonicalEvent(
                    platform="telegram",
                    source_id=source_id,
                    actor_ref=actor_ref,
                    timestamp=ts,
                    text=text,
                    language=None,
                    hashtags=hashtags,
                    urls=urls,
                    engagement=Engagement(),
                    interactions=[],
                )
            )

        return events
