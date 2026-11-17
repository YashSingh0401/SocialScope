CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    platform TEXT NOT NULL,
    source_id TEXT NOT NULL,
    actor_ref TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    text TEXT NOT NULL CHECK (length(trim(text)) > 0),
    language TEXT,
    payload JSONB NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(platform, source_id)
);
CREATE INDEX events_timestamp_idx ON events(timestamp);
CREATE INDEX events_language_idx ON events(language);
CREATE TABLE import_runs (
    run_id UUID PRIMARY KEY,
    dataset_name TEXT NOT NULL,
    received INTEGER NOT NULL,
    inserted INTEGER NOT NULL,
    duplicates INTEGER NOT NULL,
    conflicts INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE import_events (
    run_id UUID NOT NULL REFERENCES import_runs(run_id),
    event_id UUID NOT NULL REFERENCES events(event_id),
    PRIMARY KEY (run_id, event_id)
);
