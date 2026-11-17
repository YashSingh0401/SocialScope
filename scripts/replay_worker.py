"""Run separately from the API, using the same DATABASE_URL."""
import argparse
import json
import logging
import time

import psycopg

from backend.app.services.replay import process_next


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--idle-timeout',type=float,default=None,
                        help='Exit after this many seconds without a due event (optional)')
    parser.add_argument('--max-events',type=int,default=None,
                        help='Stop after this many committed events (optional)')
    args = parser.parse_args()
    if args.idle_timeout is not None and args.idle_timeout <= 0:
        parser.error('idle-timeout must be positive')
    if args.max_events is not None and args.max_events <= 0:
        parser.error('max-events must be positive')
    processed = 0
    idle_since = time.monotonic()
    try:
        while True:
            try:
                result = process_next()
            except (psycopg.OperationalError, RuntimeError):
                logging.warning('Database unavailable; retrying in two seconds')
                time.sleep(2)
                continue
            if result:
                print(json.dumps(result),flush=True)
                idle_since = time.monotonic()
                processed += 1
                if args.max_events and processed >= args.max_events:
                    break
            else:
                if args.idle_timeout and time.monotonic()-idle_since >= args.idle_timeout:
                    break
                time.sleep(0.1)
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
