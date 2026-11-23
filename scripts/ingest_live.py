"""CLI utility to ingest live data from Reddit, YouTube, or Telegram into SocialScope."""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

from connectors.reddit import RedditConnector
from connectors.youtube import YouTubeConnector
from connectors.telegram import TelegramConnector


def main():
    parser = argparse.ArgumentParser(
        description="Ingest live social events from Reddit, YouTube, or Telegram into SocialScope"
    )
    parser.add_argument(
        "--platform",
        required=True,
        choices=["reddit", "youtube", "telegram"],
        help="Target platform to pull live data from",
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Subreddit name (reddit), search keyword/video ID (youtube), or public channel username (telegram)",
    )
    parser.add_argument(
        "--mode",
        default="default",
        choices=["default", "search", "comments", "rss", "bot"],
        help="Specific sub-mode (e.g. 'search' or 'comments' for YouTube/Reddit)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Number of events to retrieve (1-100)",
    )
    parser.add_argument(
        "--dataset-name",
        help="Dataset name for import provenance. Default: live-<platform>-<target>",
    )
    parser.add_argument(
        "--save-db",
        action="store_true",
        help="Import directly into PostgreSQL database using backend services",
    )
    parser.add_argument(
        "--api-url",
        help="Send to a running SocialScope API instance (e.g., http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        help="Save canonical events to a JSON file on disk",
    )

    args = parser.parse_args()
    platform = args.platform.lower()
    target = args.target.strip()
    limit = max(1, min(args.limit, 100))
    dataset_name = args.dataset_name or f"live-{platform}-{target[:30]}"

    print(f"[*] Ingesting live data from {platform.upper()} (target: '{target}', limit: {limit})...")

    events = []
    try:
        if platform == "reddit":
            connector = RedditConnector()
            if args.mode == "search":
                events = connector.fetch_search_posts(query=target, limit=limit)
            else:
                events = connector.fetch_subreddit_posts(subreddit=target, limit=limit)

        elif platform == "youtube":
            connector = YouTubeConnector()
            if args.mode == "comments":
                events = connector.fetch_video_comments(video_id=target, max_results=limit)
            elif args.mode == "rss":
                events = connector.fetch_channel_feed_rss(channel_id=target)
            else:
                events = connector.search_videos(query=target, max_results=limit)

        elif platform == "telegram":
            connector = TelegramConnector()
            if args.mode == "bot":
                events = connector.fetch_bot_updates(limit=limit)
            else:
                events = connector.fetch_public_channel_posts(channel_username=target, limit=limit)

    except Exception as exc:
        print(f"[!] Error pulling from {platform}: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"[+] Successfully fetched and validated {len(events)} CanonicalEvents from {platform}.")

    if not events:
        print("[-] No events retrieved. Exiting.")
        return

    # 1. Output to file if requested
    if args.output_json:
        payloads = [e.model_dump(mode="json") for e in events]
        args.output_json.parent.mkdir(parents=True, exist_ok=True)
        args.output_json.write_text(json.dumps(payloads, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[+] Saved events to file: {args.output_json}")

    # 2. Send to API if requested
    if args.api_url:
        endpoint = f"{args.api_url.rstrip('/')}/events/import"
        import_payload = {
            "dataset_name": dataset_name,
            "events": [e.model_dump(mode="json") for e in events],
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(endpoint, json=import_payload)
                if res.status_code == 200:
                    print(f"[+] API import successful: {res.json()}")
                else:
                    print(f"[!] API import returned status {res.status_code}: {res.text}", file=sys.stderr)
        except Exception as exc:
            print(f"[!] Failed to post to API at {endpoint}: {exc}", file=sys.stderr)

    # 3. Direct DB write if requested
    if args.save_db:
        try:
            from backend.app.services.events import import_events
            report = import_events(events, dataset_name=dataset_name)
            print(f"[+] Database import report: {json.dumps(report, indent=2)}")
        except Exception as exc:
            print(f"[!] Database import failed: {exc}", file=sys.stderr)

    # 4. If neither save option given, print preview
    if not args.save_db and not args.api_url and not args.output_json:
        print("\n--- Event Preview Sample ---")
        first = events[0]
        print(f"ID: {first.source_id}")
        print(f"Author: {first.actor_ref}")
        print(f"Timestamp: {first.timestamp}")
        print(f"Text: {first.text[:140]}...")
        print(f"Hashtags: {first.hashtags}")
        print(f"URLs: {first.urls}")
        print(f"Engagement: {first.engagement.model_dump(exclude_none=True)}")
        print("----------------------------")
        print("(Tip: Use --save-db to persist into PostgreSQL or --api-url http://127.0.0.1:8000 to ingest live)")


if __name__ == "__main__":
    main()
