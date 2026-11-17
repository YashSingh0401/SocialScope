"""Load canonical JSON/CSV files. Validate the entire batch before any writes."""
import csv
import json
from pathlib import Path

from pydantic import TypeAdapter

from backend.app.schemas.event import CanonicalEvent


def load_events(path: Path):
    if path.stat().st_size > 10 * 1024 * 1024:
        raise ValueError("Dataset file exceeds the 10 MiB batch limit")
    if path.suffix.lower() == ".json":
        records = json.loads(path.read_text(encoding="utf-8-sig"))
    elif path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as f:
            records = list(csv.DictReader(f))
        for record in records:
            for key in list(record):
                if record[key] == "":
                    del record[key]
                elif key in {"engagement","interactions","hashtags","urls"}:
                    record[key] = json.loads(record[key])
    else:
        raise ValueError("Supported formats: .json and .csv")
    if not isinstance(records,list) or not 1 <= len(records) <= 1000:
        raise ValueError("Each import must contain 1 to 1000 events")
    return TypeAdapter(list[CanonicalEvent]).validate_python(records)
