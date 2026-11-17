CREATE TABLE replay_jobs (
    replay_id UUID PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued','running','paused','completed','cancelled')),
    speed DOUBLE PRECISION NOT NULL CHECK (speed > 0 AND speed <= 1000000),
    immediate BOOLEAN NOT NULL,
    total INTEGER NOT NULL CHECK (total > 0),
    processed INTEGER NOT NULL DEFAULT 0,
    inserted INTEGER NOT NULL DEFAULT 0,
    duplicates INTEGER NOT NULL DEFAULT 0,
    conflicts INTEGER NOT NULL DEFAULT 0,
    next_due_at TIMESTAMPTZ,
    remaining_seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
    virtual_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (processed BETWEEN 0 AND total),
    CHECK (processed = inserted + duplicates + conflicts)
);
CREATE TABLE replay_items (
    replay_id UUID NOT NULL REFERENCES replay_jobs(replay_id),
    position INTEGER NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    import_run_id UUID REFERENCES import_runs(run_id),
    PRIMARY KEY (replay_id, position)
);
CREATE INDEX replay_due_idx ON replay_jobs(next_due_at)
    WHERE status IN ('queued','running');
