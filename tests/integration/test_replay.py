from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from tests.integration import test_database
from backend.app.db.connection import connect
from backend.app.services import replay
from backend.app.api.routes_replays import ReplayRequest


class ReplayTests(test_database.DatabaseFixture):
    def create(self, immediate=False, speed=60):
        # Deliberately out of order; the second and third items share a timestamp.
        events = [self.event('last',timestamp='2026-01-01T00:02:00Z'),
                  self.event('first',timestamp='2026-01-01T00:00:00Z'),
                  self.event('tie',timestamp='2026-01-01T00:02:00Z')]
        return replay.create_replay(ReplayRequest(dataset_name='synthetic replay',events=events,
                                                   speed=speed,immediate=immediate))

    def test_order_speed_and_original_event_times(self):
        job = self.create()
        start = job['next_due_at']
        replay.process_next(now=start)
        state = replay.get_replay(job['replay_id'])
        self.assertEqual(state['virtual_time'].isoformat(),'2026-01-01T00:00:00+00:00')
        self.assertEqual(state['next_due_at'],start+timedelta(seconds=2))
        self.assertIsNone(replay.process_next(now=start+timedelta(seconds=1)))
        replay.process_next(now=start+timedelta(seconds=2))
        replay.process_next(now=start+timedelta(seconds=2))
        state = replay.get_replay(job['replay_id'])
        self.assertEqual((state['status'],state['processed'],state['inserted']),('completed',3,3))
        with connect() as conn:
            items=conn.execute('SELECT payload FROM replay_items ORDER BY position').fetchall()
        self.assertEqual([i['payload']['source_id'] for i in items],['first','last','tie'])

    def test_pause_resume_retains_remaining_delay(self):
        job=self.create()
        start=job['next_due_at']
        replay.process_next(now=start)
        paused=replay.control_replay(job['replay_id'],'pause',now=start+timedelta(seconds=0.5))
        self.assertEqual(paused['remaining_seconds'],1.5)
        self.assertIsNone(replay.process_next(now=start+timedelta(days=1)))
        resumed=replay.control_replay(job['replay_id'],'resume',now=start+timedelta(seconds=10))
        self.assertEqual(resumed['next_due_at'],start+timedelta(seconds=11.5))
        replay.process_next(now=resumed['next_due_at'])
        self.assertEqual(replay.get_replay(job['replay_id'])['processed'],2)

    def test_cancel_and_invalid_controls(self):
        job=self.create()
        cancelled=replay.control_replay(job['replay_id'],'cancel')
        self.assertEqual(cancelled['status'],'cancelled')
        self.assertIsNone(replay.process_next(now=job['next_due_at']+timedelta(days=1)))
        response=self.client.post(f"/replays/{job['replay_id']}/resume")
        self.assertEqual(response.status_code,409)
        self.assertEqual(self.client.get(f'/replays/{uuid4()}').status_code,404)
        self.assertEqual(self.client.get('/replays/not-a-uuid').status_code,422)

    def test_transaction_rolls_back_import_and_cursor(self):
        job=self.create(immediate=True)
        original=replay.import_events
        def fail_after_import(*args,**kwargs):
            original(*args,**kwargs)
            raise RuntimeError('simulated worker crash before progress commit')
        with patch.object(replay,'import_events',side_effect=fail_after_import):
            with self.assertRaises(RuntimeError): replay.process_next(now=job['next_due_at'])
        self.assertEqual(replay.get_replay(job['replay_id'])['processed'],0)
        with connect() as conn:
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM events').fetchone()['n'],0)
            self.assertEqual(conn.execute('SELECT count(*) AS n FROM import_runs').fetchone()['n'],0)
        replay.process_next(now=job['next_due_at'])
        self.assertEqual(replay.get_replay(job['replay_id'])['inserted'],1)

    def test_parallel_workers_and_repeat_replay(self):
        job=self.create(immediate=True)
        def step(_): return replay.process_next(now=job['next_due_at']+timedelta(seconds=1))
        with ThreadPoolExecutor(max_workers=4) as executor:
            list(executor.map(step,range(12)))
        state=replay.get_replay(job['replay_id'])
        self.assertEqual((state['processed'],state['inserted']),(3,3))
        second=self.create(immediate=True)
        for _ in range(3): replay.process_next(now=second['next_due_at'])
        state=replay.get_replay(second['replay_id'])
        self.assertEqual((state['inserted'],state['duplicates']),(0,3))

    def test_api_creation_validation_and_controls(self):
        response=self.client.post('/replays',json={'dataset_name':'api replay','events':[self.event()],
                                                  'immediate':True})
        self.assertEqual(response.status_code,201)
        replay_id=response.json()['replay_id']
        self.assertEqual(self.client.post(f'/replays/{replay_id}/pause').json()['status'],'paused')
        self.assertEqual(self.client.post(f'/replays/{replay_id}/resume').json()['status'],'running')
        self.assertEqual(self.client.get(f'/replays/{replay_id}').status_code,200)
        for speed in [0,-1,1000001]:
            response=self.client.post('/replays',json={'dataset_name':'bad','events':[self.event()],'speed':speed})
            self.assertEqual(response.status_code,422)
