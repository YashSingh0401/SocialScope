import React from 'react';
import { useFilters } from '../context/FilterContext';
import { formatDate, formatLanguage } from '../utils/formatters';

export default function EventExplorer({ rows = [], offset = 0, setOffset, totalShown = 0 }) {
  const { language, setLanguage, sentiment, setSentiment, platform, setPlatform, resetFilters } = useFilters();

  return (
    <div className="page-event-explorer">
      <div className="explorer-filter-bar">
        <div className="filter-group">
          <label>Language</label>
          <select value={language} onChange={(e) => { setLanguage(e.target.value); setOffset(0); }}>
            <option value="">All Languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="und">Undetermined</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sentiment</label>
          <select value={sentiment} onChange={(e) => { setSentiment(e.target.value); setOffset(0); }}>
            <option value="">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Platform</label>
          <input
            type="text"
            placeholder="twitter, telegram..."
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setOffset(0); }}
          />
        </div>

        <button className="reset-filters-btn" onClick={resetFilters}>
          ↺ Reset
        </button>
      </div>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Surveillance Event Evidence</h3>
            <p className="panel-subtitle">Individual posts enriched with linguistic & sentiment classifications</p>
          </div>
          <span className="badge">{rows.length} DISPLAYED</span>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Event Metadata & Content</th>
                <th>Detected Language</th>
                <th>Predicted Sentiment</th>
                <th>Model Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const analysis = r.analysis || {};
                const sent = analysis.sentiment || 'pending';
                const score = analysis.sentiment_score;

                return (
                  <tr key={r.event_id}>
                    <td className="event-content-cell">
                      <div className="event-meta">
                        <span className="platform-tag">{r.platform}</span>
                        <span className="event-time">{formatDate(r.timestamp)}</span>
                        <code>{r.event_id?.slice(0, 8)}</code>
                        {r.actor_ref && <span className="actor-tag">@{r.actor_ref}</span>}
                      </div>
                      <p className="event-text">{r.text}</p>
                      {analysis.truncated && (
                        <small className="truncated-note">Text truncated to 256 tokens for model inference.</small>
                      )}
                    </td>
                    <td>
                      <strong>{formatLanguage(analysis.language)}</strong>
                      <small className="cell-sub">{analysis.language_status}</small>
                    </td>
                    <td>
                      <span className={`pill small ${sent}`}>
                        {sent.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <b>{score != null ? `${(score * 100).toFixed(1)}%` : '—'}</b>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                    No events match current filter conditions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <button
            className="btn-secondary small"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 20))}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {Math.floor(offset / 20) + 1}
          </span>
          <button
            className="btn-secondary small"
            disabled={rows.length < 20}
            onClick={() => setOffset(offset + 20)}
          >
            Next →
          </button>
        </div>
      </article>
    </div>
  );
}
