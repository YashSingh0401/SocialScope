# SocialScope — checkpoint 0.3

Cloud-developed social-media intelligence backend.

## Implemented

PostgreSQL 17, versioned SQL migrations, canonical event validation, JSON/CSV
import, import provenance, duplicate/conflict detection, filtered event queries,
API liveness/readiness and OpenAPI documentation.

Not implemented: NLP, analytics, frontend, authentication,
pgvector or public hosting. All bundled sample data is labelled synthetic.

## Cloud execution

Run from this project root with Python 3.11+:

```bash
python3 -m pip install -r requirements.txt
python3 -m scripts.setup_cloud_postgres
python3 -m scripts.run_with_db python3 -m unittest discover -s tests -v
python3 -m scripts.run_with_db python3 -m scripts.smoke_test
python3 -m scripts.run_with_db python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The setup helper targets this Debian 13 amd64 environment and checks package
SHA256 digests against Debian's HTTPS index. It extracts PostgreSQL into the sibling
`pg-runtime` directory and reuses system libraries. For other hosts install PostgreSQL
normally and set `PG_BINDIR`; optionally set `PG_LIBDIR` for shared libraries.

`run_with_db` initializes a password-protected cluster on loopback port 55432,
applies migrations, runs the command, then stops PostgreSQL. Set `PGPORT` if needed.
Generated credentials and data live in `.runtime`, excluded from Git and archives.
Data survives server restarts within this workspace. Re-import saved datasets after
workspace recreation. Only one wrapper may use the cluster at a time.

For an existing PostgreSQL server, set `DATABASE_URL` externally and run:

```bash
python3 -m scripts.migrate
python3 -m scripts.import_dataset data/samples/synthetic_events.json --dataset-name synthetic-foundation
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

`.env` is not loaded automatically. Localhost refers to the cloud workspace, not the
user's laptop. The API has no authentication yet and is for local development only.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /health | Process liveness |
| GET | /ready | Database and events-table readiness |
| POST | /events/import | Import a named batch |
| GET | /events/query | Filter stored events |
| GET | /docs | Interactive API documentation |

Import body: `{"dataset_name":"example","events":[...]}`. Events follow
`data/schemas/event.schema.json`. Batch limit: 1,000 events. File limit: 10 MiB.
CSV nested columns (`engagement`, `interactions`, `hashtags`, `urls`) contain JSON
strings; blank optional cells are omitted.

The entire batch is validated before writes. Event writes and provenance commit
in one transaction. Reports include received, inserted, duplicates and conflicts.
Identical `(platform, source_id)` records are skipped; changed content is flagged
as a conflict without overwriting the original. Source IDs must be stable and
namespaced by dataset when using the generic `dataset` platform.

Queries support `platform`, `language`, `since` (inclusive), `until` (exclusive),
`limit` (1–500) and `offset`. Times require explicit timezones. Results are ordered
by timestamp then event ID. Cursor pagination and explicit source-update handling
remain future work.

## Structure and next steps

`backend`: API, schemas, services and migrations. `connectors`: dataset parsing.
`scripts`: setup, migrations, import and live checks. `tests`: unit/API/isolated
PostgreSQL integration tests. `data`: synthetic samples and schema. `docs`: decisions.

`frontend`, `ml`, `graph` and `pipelines` reserve the planned structure; these
folders do not represent implemented features.

Next: evaluated language detection, embeddings and sentiment.


## Historical replay (0.3)

Replay snapshots the validated input into PostgreSQL, sorts by original UTC event
 time (stable input order for ties), and ingests one due event per transaction.
Original timestamps stay unchanged. Progress, import provenance and event writes
commit atomically; a worker interruption rolls back unfinished work.

```bash
python3 -m scripts.run_with_db python3 -m scripts.smoke_replay
python3 -m scripts.run_with_db python3 -m scripts.serve
```

`serve` runs the API and independent replay worker together. Creating a replay
through the API alone queues it; a worker must be running for progress to advance.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /replays | Create snapshot and queue job |
| GET | /replays/{id} | Status, counts, due time and virtual event time |
| POST | /replays/{id}/pause | Stop scheduling after the current transaction |
| POST | /replays/{id}/resume | Continue with remaining inter-event delay |
| POST | /replays/{id}/cancel | Stop remaining items; keep committed data |

Create body uses `dataset_name`, `events`, optional `speed` (default 1), and
`immediate` (default false). At speed 60, a historical gap of 120 seconds plays
in 2 seconds. Immediate mode removes delays. The first event is due immediately.
The batch limit is 1,000 events, matching import validation.

CLI equivalents for a separately configured DATABASE_URL:

```bash
python3 -m scripts.create_replay data/samples/synthetic_replay.json --dataset-name synthetic-demo --speed 60
python3 -m scripts.replay_worker
```

Worker options: `--max-events N` stops after N commits; `--idle-timeout N` exits
after N seconds without a due event. Idle timeout is a development option, not a
completion guarantee: future scheduled jobs may still remain.

Status transitions: queued/running -> paused -> running -> completed;
queued/running/paused -> cancelled. Repeating an applicable control is idempotent.
Completed/cancelled jobs cannot restart; create a new replay instead. Replaying
identical source IDs uses normal duplicate detection and does not duplicate events.

Downtime differs from pause: overdue events catch up when the worker restarts.
Explicit pause preserves the remaining delay. Multiple workers use row locks to
avoid advancing the same job concurrently. Database connectivity failures retry;
other unexpected failures stop the worker for diagnosis with its cursor preserved.

Replay is a feed into the shared event store, not an isolated simulation database.
Previously imported events remain visible in general event queries. Future ML
backtests must restrict inputs by replay position/virtual time to avoid lookahead.
No job deletion, automatic dead-letter handling or speed changes mid-run yet.
