import React from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function ReplayStudio({ jobs = [], onOpenCreateReplay, onAction }) {
  async function handleControl(jobId, actionName) {
    if (onAction) {
      await onAction(async () => {
        await api.controlReplay(jobId, actionName);
        return `Replay job ${actionName}d successfully.`;
      });
    }
  }

  return (
    <div className="page-replay-studio">
      <div className="replay-banner">
        <div>
          <h2>Historical Event Replay Studio</h2>
          <p className="subtitle">
            Inject historical intelligence streams with high-precision virtual clock control to simulate real-time attacks and evaluate pipeline detection lag.
          </p>
        </div>
        <button className="primary" onClick={onOpenCreateReplay}>
          ▷ Launch New Replay
        </button>
      </div>

      <div className="replay-jobs-grid">
        {jobs.map((job) => {
          const progressPct = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
          return (
            <article className="panel replay-job-card" key={job.replay_id}>
              <div className="panel-header">
                <div>
                  <h3>{job.dataset_name}</h3>
                  <p className="panel-subtitle">
                    Job ID: <code>{job.replay_id?.slice(0, 8)}</code> · {job.immediate ? 'Immediate Batch' : `${job.speed}× Playback`}
                  </p>
                </div>
                <span className={`pill ${job.status}`}>
                  {job.status?.toUpperCase()}
                </span>
              </div>

              <div className="job-progress-section">
                <div className="progress-labels">
                  <strong>{job.processed} / {job.total} events ({progressPct}%)</strong>
                  <span>{job.inserted} inserted · {job.duplicates} duplicates · {job.conflicts} conflicts</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="job-virtual-clock">
                <span className="clock-icon">⏱</span>
                <span>Virtual Timestamp: <strong>{job.virtual_time ? formatDate(job.virtual_time) : 'Awaiting start'}</strong></span>
              </div>

              <div className="job-actions">
                {['queued', 'running'].includes(job.status) && (
                  <button
                    className="btn-secondary small"
                    onClick={() => handleControl(job.replay_id, 'pause')}
                  >
                    ⏸ Pause
                  </button>
                )}
                {job.status === 'paused' && (
                  <button
                    className="btn-secondary small"
                    onClick={() => handleControl(job.replay_id, 'resume')}
                  >
                    ▶ Resume
                  </button>
                )}
                {['queued', 'running', 'paused'].includes(job.status) && (
                  <button
                    className="btn-danger small"
                    onClick={() => handleControl(job.replay_id, 'cancel')}
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!jobs.length && (
          <div className="panel empty-state">
            <h4>No Active Replay Streams</h4>
            <p>Queue a historical scenario from canonical JSON to evaluate intelligence pipelines under controlled conditions.</p>
            <button className="primary" onClick={onOpenCreateReplay}>
              Create First Replay Stream
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
