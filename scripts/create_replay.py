import argparse
import json
from pathlib import Path

from connectors.dataset import load_events
from backend.app.api.routes_replays import ReplayRequest
from backend.app.services.replay import create_replay


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('file',type=Path)
    parser.add_argument('--dataset-name',required=True)
    parser.add_argument('--speed',type=float,default=1)
    parser.add_argument('--immediate',action='store_true')
    args = parser.parse_args()
    request = ReplayRequest(dataset_name=args.dataset_name,events=load_events(args.file),
                            speed=args.speed,immediate=args.immediate)
    print(json.dumps(create_replay(request),default=str,indent=2))


if __name__ == '__main__':
    main()
