# Checkpoint 0.2 verification

- PostgreSQL 17.11 initialized with password authentication and loopback-only TCP.
- 12 tests passed, including 6 real PostgreSQL integration tests in a disposable database.
- Migration rerun creates no duplicate version records.
- Reimported events create no duplicate rows; changed content is flagged and preserved.
- Invalid input batches write no events.
- Platform/language/time filters, pagination bounds and SQL-like inputs checked.
- JSON and CSV loading equivalence checked.
- File importer run twice on the synthetic sample: first inserted 1, second inserted 0 and skipped 1 duplicate.
- Live Uvicorn readiness and event query returned successfully against stored data.
- Servers stopped after checks; data remains in the workspace-local cluster.
- Source compiles successfully.
- Upstream test-client httpx deprecation warning remains; no failing tests.

Limits: no NLP, replay scheduler, frontend, pgvector, authentication or public hosting yet.
Source archive excludes database files, generated credentials and downloaded binaries.
The sample plus migrations recreate the demonstrated data.


## Checkpoint 0.3 verification

- 18 tests passed, including real PostgreSQL replay integration tests.
- Verified chronological ordering, stable ties, original timestamps and 60x timing.
- Verified pause/resume remaining delay, cancellation, unknown IDs and invalid speed.
- Simulated failure after event insertion: event, import provenance and progress all rolled back.
- Parallel workers committed each replay position only once; repeat replay counted duplicates.
- Live HTTP test queued three synthetic events, paused/resumed, processed one with a
  separate worker process, then finished with a new worker process: all three positions completed. Repeating the demonstration skipped three existing posts as duplicates.
- API and PostgreSQL stopped after verification. Workspace cluster retains demo progress.
- NLP and frontend remain pending. Replay scheduling is now implemented.
