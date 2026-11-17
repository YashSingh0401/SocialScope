"""Durable replay scheduling. Snapshot and cursor live in PostgreSQL."""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from psycopg.types.json import Jsonb

from backend.app.db.connection import connect
from backend.app.schemas.event import CanonicalEvent
from backend.app.services.events import import_events


class ReplayNotFound(Exception):
    pass


class ReplayStateError(Exception):
    pass


def utcnow():
    return datetime.now(timezone.utc)


def create_replay(request):
    replay_id = uuid4()
    # Python's stable sort preserves input order for simultaneous events.
    events = sorted(request.events, key=lambda event: event.timestamp)
    with connect() as conn:
        conn.execute("""INSERT INTO replay_jobs
            (replay_id,dataset_name,status,speed,immediate,total,next_due_at)
            VALUES (%s,%s,'queued',%s,%s,%s,%s)""",
            (replay_id,request.dataset_name,request.speed,request.immediate,len(events),utcnow()))
        for position, event in enumerate(events):
            conn.execute("""INSERT INTO replay_items(replay_id,position,event_time,payload)
                VALUES (%s,%s,%s,%s)""", (replay_id,position,event.timestamp,Jsonb(event.model_dump(mode="json"))))
    return get_replay(replay_id)


def get_replay(replay_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM replay_jobs WHERE replay_id=%s",(replay_id,)).fetchone()
    if row is None:
        raise ReplayNotFound()
    return row


def control_replay(replay_id, action, *, now=None):
    now = now or utcnow()
    with connect() as conn:
        row = conn.execute("SELECT * FROM replay_jobs WHERE replay_id=%s FOR UPDATE",(replay_id,)).fetchone()
        if row is None:
            raise ReplayNotFound()
        status = row['status']
        if (action == 'pause' and status == 'paused') or (action == 'resume' and status in ('queued','running')) or (action == 'cancel' and status == 'cancelled'):
            return row
        if action == 'pause' and status in ('queued','running'):
            remaining = max(0, (row['next_due_at'] - now).total_seconds())
            conn.execute("""UPDATE replay_jobs SET status='paused',remaining_seconds=%s,
                next_due_at=NULL,updated_at=%s WHERE replay_id=%s""",(remaining,now,replay_id))
        elif action == 'resume' and status == 'paused':
            conn.execute("""UPDATE replay_jobs SET status='running',next_due_at=%s,
                remaining_seconds=0,updated_at=%s WHERE replay_id=%s""",
                (now + timedelta(seconds=row['remaining_seconds']),now,replay_id))
        elif action == 'cancel' and status in ('queued','running','paused'):
            conn.execute("""UPDATE replay_jobs SET status='cancelled',next_due_at=NULL,
                updated_at=%s WHERE replay_id=%s""",(now,replay_id))
        else:
            raise ReplayStateError(f'Cannot {action} a {status} replay')
        return conn.execute("SELECT * FROM replay_jobs WHERE replay_id=%s",(replay_id,)).fetchone()


def process_next(*, now=None):
    """Claim one due event; ingestion and progress commit or roll back together.

    Row locking allows multiple worker processes without processing a cursor twice.
    Original timestamps are never replaced by wall-clock playback timestamps.
    """
    now = now or utcnow()
    with connect() as conn:
        job = conn.execute("""SELECT * FROM replay_jobs
            WHERE status IN ('queued','running') AND next_due_at <= %s
            ORDER BY next_due_at,created_at,replay_id
            FOR UPDATE SKIP LOCKED LIMIT 1""",(now,)).fetchone()
        if job is None:
            return None
        replay_id, position = job['replay_id'], job['processed']
        item = conn.execute("SELECT * FROM replay_items WHERE replay_id=%s AND position=%s",
                            (replay_id,position)).fetchone()
        event = CanonicalEvent.model_validate(item['payload'])
        result = import_events([event],job['dataset_name'],connection=conn)
        conn.execute("UPDATE replay_items SET import_run_id=%s WHERE replay_id=%s AND position=%s",
                     (result['run_id'],replay_id,position))
        processed = position + 1
        due = None
        if processed < job['total']:
            next_item = conn.execute("SELECT event_time FROM replay_items WHERE replay_id=%s AND position=%s",
                                     (replay_id,processed)).fetchone()
            gap = 0 if job['immediate'] else (next_item['event_time'] - event.timestamp).total_seconds()/job['speed']
            due = job['next_due_at'] + timedelta(seconds=gap)
        conn.execute("""UPDATE replay_jobs SET status=%s,processed=%s,
            inserted=inserted+%s,duplicates=duplicates+%s,conflicts=conflicts+%s,
            virtual_time=%s,next_due_at=%s,updated_at=%s WHERE replay_id=%s""",
            ('completed' if due is None else 'running',processed,result['inserted'],
             result['duplicates'],result['conflicts'],event.timestamp,due,now,replay_id))
        return {'replay_id':str(replay_id),'position':position,**result}
