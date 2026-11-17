"""Integration tests use their own temporary database, never truncate app data."""
import os
import unittest
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.db.connection import connect
from scripts.migrate import migrate


@unittest.skipUnless(os.environ.get("DATABASE_URL"), "Run with scripts.run_with_db")
class DatabaseFixture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = os.environ["DATABASE_URL"]
        cls.name = "socialscope_test_" + uuid4().hex
        with psycopg.connect(cls.original, autocommit=True) as conn:
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(cls.name)))
        params = conninfo_to_dict(cls.original)
        params["dbname"] = cls.name
        os.environ["DATABASE_URL"] = make_conninfo(**params)
        migrate()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        os.environ["DATABASE_URL"] = cls.original
        with psycopg.connect(cls.original, autocommit=True) as conn:
            conn.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(cls.name)))

    def setUp(self):
        with connect() as conn:
            conn.execute("TRUNCATE replay_items,replay_jobs,import_events,import_runs,events")

    def event(self, source_id="one", **changes):
        return dict(platform="dataset",source_id=source_id,text="A sample discussion",
                    timestamp="2026-11-17T10:00:00+05:30") | changes

    def send(self, events):
        return self.client.post("/events/import", json={"dataset_name":"synthetic test","events":events})


class DatabaseTests(DatabaseFixture):
    def test_import_repeat_and_provenance(self):
        events = [self.event(),self.event("two")]
        self.assertEqual(self.send(events).json()["inserted"],2)
        repeated = self.send(events).json()
        self.assertEqual((repeated["inserted"],repeated["duplicates"]),(0,2))
        response = self.client.get("/events/query")
        self.assertEqual(response.status_code,200)
        self.assertEqual(len(response.json()["items"]),2)
        self.assertEqual(response.json()["items"][0]["timestamp"],"2026-11-17T04:30:00Z")
        with connect() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM import_runs").fetchone()["n"],2)
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM import_events").fetchone()["n"],4)

    def test_conflicting_content_preserves_original(self):
        self.send([self.event()])
        result = self.send([self.event(text="Changed content")]).json()
        self.assertEqual(result["conflicts"],1)
        self.assertEqual(self.client.get("/events/query").json()["items"][0]["text"],"A sample discussion")

    def test_invalid_batch_writes_nothing(self):
        result = self.send([self.event(),self.event("invalid",text=" ")])
        self.assertEqual(result.status_code,422)
        self.assertEqual(self.client.get("/events/query").json()["items"],[])

    def test_duplicate_in_batch_and_platform_identity(self):
        result = self.send([self.event(),self.event(),self.event(platform="other")]).json()
        self.assertEqual((result["inserted"],result["duplicates"]),(2,1))

    def test_filters_limits_and_sql_input(self):
        self.send([self.event(language="en"),self.event("two",language="hi")])
        self.assertEqual(len(self.client.get("/events/query?language=hi").json()["items"]),1)
        self.assertEqual(len(self.client.get("/events/query?limit=1&offset=1").json()["items"]),1)
        self.assertEqual(self.client.get("/events/query",params={"platform":"'; DROP TABLE events; --"}).json()["items"],[])
        self.assertEqual(self.client.get("/events/query?limit=0").status_code,422)
        self.assertEqual(self.client.get("/events/query?since=2026-11-17T00:00:00").status_code,422)
        params={"since":"2026-11-17T04:00:00Z","until":"2026-11-17T05:00:00Z"}
        self.assertEqual(len(self.client.get("/events/query",params=params).json()["items"]),2)

    def test_migration_repeat_and_readiness(self):
        migrate()
        with connect() as conn:
            self.assertEqual(conn.execute("SELECT count(*) AS n FROM schema_migrations").fetchone()["n"],2)
        self.assertEqual(self.client.get("/ready").status_code,200)
