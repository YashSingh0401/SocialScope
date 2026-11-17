import argparse
import json
from pathlib import Path

from backend.app.services.events import import_events
from connectors.dataset import load_events


def main():
    parser = argparse.ArgumentParser(description="Import canonical CSV/JSON events")
    parser.add_argument("file", type=Path)
    parser.add_argument("--dataset-name", required=True)
    args = parser.parse_args()
    if not args.dataset_name.strip() or len(args.dataset_name) > 200:
        parser.error("dataset-name must contain 1 to 200 characters")
    events = load_events(args.file)
    print(json.dumps(import_events(events,args.dataset_name.strip()),indent=2))


if __name__ == "__main__":
    main()
