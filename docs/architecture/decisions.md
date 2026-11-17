# Foundation decisions

- Use a modular Python backend with a separate React frontend.
- Keep ML jobs outside interactive request handlers.
- Begin with dataset imports and reproducible replay.
- Normalize event timestamps to UTC and reject timezone-free timestamps.
- Preserve unavailable engagement as null, distinct from an observed zero.
- Represent reply/share/mention relationships explicitly for later graph analysis.
- Allow missing actor references rather than inventing identities.
- Assign internal event IDs during persistence; deduplicate by source identity.
- Database model revisions will add dataset provenance, ingestion time and analysis-run versions.
- Keep raw data immutable and distinguish synthetic samples from real datasets.
- Do not infer demographics or report model accuracy without evaluation.

## Environment at foundation creation

Python, Node, npm and Git are available. FastAPI and its validation/runtime
dependencies are installed. PostgreSQL client, Docker, SQLAlchemy and psycopg
were not available in initial checks. No database has been provisioned.
GPU availability is unverified. Package/model download access still needs checking.

## Source basis

SocialScope Complete Major Project Report (sections 1–27), Architecture and Workflow,
and Project File Architecture, supplied by the user. Those PDFs are planning
documents, not evidence of implemented features or measured model performance.

## Checkpoint 0.2 update

PostgreSQL 17.11 now runs from user-local Debian packages; psycopg 3.3.9 is installed.
Python and Debian package downloads succeeded. GPU/model availability remains
unverified. Unix sockets are disabled because the workspace disallows them;
PostgreSQL uses password-authenticated loopback TCP. Docker is not required here.

Direct psycopg transactions keep persistence small. Ordered SQL migrations use
an advisory lock and checksums. Import provenance is implemented; model revisions,
analysis snapshots, pgvector and source-update versioning remain future work.


## Checkpoint 0.3 update

Replay uses durable PostgreSQL jobs and input snapshots, with a separate polling
worker. Each event import and cursor update share one transaction. FOR UPDATE SKIP
LOCKED supports competing workers; control requests acquire the same job lock.
A replay's event-time clock is separate from playback wall time. The first event
is due immediately; later due times derive from historical gaps divided by speed.
Paused jobs retain their remaining delay. Downtime catches up overdue events.
All replay imports reuse the existing validated ingestion service.
