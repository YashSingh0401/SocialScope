import json
from contextlib import nullcontext
from uuid import NAMESPACE_URL, uuid4, uuid5

from psycopg.types.json import Jsonb

from backend.app.db.connection import connect
from backend.app.schemas.event import CanonicalEvent


def import_events(events: list[CanonicalEvent], dataset_name: str, *, connection=None):
    run_id = uuid4()
    inserted = duplicates = conflicts = 0
    ids = set()
    with (nullcontext(connection) if connection is not None else connect()) as conn:
        for event in events:
            payload = event.model_dump(mode="json")
            identity = json.dumps([event.platform, event.source_id], ensure_ascii=False)
            event_id = uuid5(NAMESPACE_URL, "socialscope:" + identity)
            row = conn.execute("""INSERT INTO events
                (event_id,platform,source_id,actor_ref,timestamp,text,language,payload)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (platform,source_id) DO NOTHING RETURNING event_id""",
                (event_id,event.platform,event.source_id,event.actor_ref,event.timestamp,
                 event.text,event.language,Jsonb(payload))).fetchone()
            if row:
                inserted += 1
            else:
                existing = conn.execute("SELECT payload FROM events WHERE platform=%s AND source_id=%s",
                                        (event.platform,event.source_id)).fetchone()
                if existing["payload"] == payload:
                    duplicates += 1
                else:
                    # Never overwrite original content silently.
                    conflicts += 1
            ids.add(event_id)
        conn.execute("""INSERT INTO import_runs
            (run_id,dataset_name,received,inserted,duplicates,conflicts)
            VALUES (%s,%s,%s,%s,%s,%s)""",
            (run_id,dataset_name,len(events),inserted,duplicates,conflicts))
        for event_id in ids:
            conn.execute("INSERT INTO import_events(run_id,event_id) VALUES (%s,%s)", (run_id,event_id))
    return dict(run_id=str(run_id), received=len(events), inserted=inserted,
                duplicates=duplicates, conflicts=conflicts)


def query_events(platform=None, language=None, since=None, until=None, limit=50, offset=0):
    clauses, values = [], []
    for column, op, value in [("platform","=",platform),("language","=",language),
                               ("timestamp",">=",since),("timestamp","<",until)]:
        if value is not None:
            clauses.append(f"{column} {op} %s")
            values.append(value)
    where = " WHERE " + " AND ".join(clauses) if clauses else ""
    with connect() as conn:
        rows = conn.execute("SELECT event_id,payload,ingested_at FROM events" + where +
                            " ORDER BY timestamp,event_id LIMIT %s OFFSET %s", (*values,limit,offset)).fetchall()
    return [{**row["payload"], "event_id":str(row["event_id"]), "ingested_at":row["ingested_at"]} for row in rows]
