"""Background enrichment; model inference is never run in API handlers."""
from psycopg.types.json import Jsonb
from backend.app.db.connection import connect
from ml.sentiment.registry import PIPELINE_VERSION


def process_next(analyzer):
    with connect() as conn:
        event=conn.execute('''SELECT e.event_id,e.text FROM events e
            WHERE NOT EXISTS (SELECT 1 FROM event_annotations a
            WHERE a.event_id=e.event_id AND a.pipeline_version=%s)
            ORDER BY e.timestamp,e.event_id LIMIT 1 FOR UPDATE OF e SKIP LOCKED''',
            (PIPELINE_VERSION,)).fetchone()
        if not event: return None
        result=analyzer.analyze(event['text'])
        conn.execute('''INSERT INTO event_annotations(event_id,pipeline_version,result)
            VALUES (%s,%s,%s) ON CONFLICT DO NOTHING''',(event['event_id'],PIPELINE_VERSION,Jsonb(result)))
        return str(event['event_id'])
