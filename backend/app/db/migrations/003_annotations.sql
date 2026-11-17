CREATE TABLE event_annotations (
    event_id UUID NOT NULL REFERENCES events(event_id),
    pipeline_version TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(event_id,pipeline_version)
);
