import React from 'react';
import MetricCard from '../components/MetricCard';
import TrendChart from '../charts/TrendChart';

export default function TrendRadar({ trends, topics }) {
  const spikes = trends?.spike_alerts || [];
  const timeline = trends?.timeline || [];
  const topicList = topics?.topics || [];

  const maxGrowth = timeline.reduce(
    (max, t) => (t.growth_rate != null && t.growth_rate > max ? t.growth_rate : max),
    0
  );

  return (
    <div className="page-trend-radar">
      {trends?.has_active_spike && (
        <div className="spike-alert-banner">
          <span className="banner-icon">⚡</span>
          <div className="banner-content">
            <strong>STATISTICAL ANOMALY SURGE DETECTED</strong>
            <p>
              Recent conversation velocity has exceeded the EWMA dynamic baseline by &gt;150%. Inspect emerging topics below.
            </p>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          title="Active Spikes"
          value={spikes.length}
          detail="Surging above dynamic baseline"
          icon="⚡"
          badge={spikes.length > 0 ? { text: 'ALERT', type: 'danger' } : { text: 'QUIET', type: 'neutral' }}
        />
        <MetricCard
          title="Discovered Topics"
          value={topicList.length}
          detail="Semantic clusters identified"
          icon="🏷"
        />
        <MetricCard
          title="Peak Growth Rate"
          value={`${(maxGrowth * 100).toFixed(0)}%`}
          detail="Relative to moving expected rate"
          icon="📈"
          trend={{ positive: maxGrowth > 0.5, text: 'High velocity' }}
        />
      </div>

      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Volume vs. EWMA Baseline</h3>
              <p className="panel-subtitle">Calculated expected moving volume vs actual incoming posts</p>
            </div>
            <span className="badge">STATISTICAL RADAR</span>
          </div>
          <TrendChart timeline={timeline} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Top Emerging Topics</h3>
              <p className="panel-subtitle">Clusters with highest current momentum</p>
            </div>
            <span className="badge">CLUSTERS</span>
          </div>

          <div className="topic-radar-list">
            {topicList.slice(0, 5).map((t) => (
              <div className="radar-topic-item" key={t.topic_id}>
                <div className="radar-topic-header">
                  <strong>{t.label}</strong>
                  <span className="pill small">{t.size} posts</span>
                </div>
                <div className="radar-keywords">
                  {(t.keywords || []).map((k) => (
                    <span key={k}>#{k}</span>
                  ))}
                </div>
                <p className="radar-exemplar">"{t.exemplar_text}"</p>
              </div>
            ))}
            {!topicList.length && (
              <p className="muted">No emerging topics detected in current timeframe.</p>
            )}
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Velocity & Anomaly Ledger</h3>
            <p className="panel-subtitle">Timestamped statistical baseline logs</p>
          </div>
          <span className="badge">LEDGER</span>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Date (UTC)</th>
                <th>Volume Now</th>
                <th>EWMA Baseline</th>
                <th>Relative Growth</th>
                <th>Anomaly Status</th>
              </tr>
            </thead>
            <tbody>
              {timeline.slice(-10).reverse().map((b, i) => (
                <tr key={i}>
                  <td><code>{(b.day || '').slice(0, 10)}</code></td>
                  <td><b>{b.volume_now ?? b.count}</b></td>
                  <td>{b.volume_baseline ?? '—'}</td>
                  <td>{b.growth_rate != null ? `${(b.growth_rate * 100).toFixed(0)}%` : '—'}</td>
                  <td>
                    {b.is_spike ? (
                      <span className="pill danger small">⚡ ANOMALOUS SPIKE</span>
                    ) : (
                      <span className="pill neutral small">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
              {!timeline.length && (
                <tr>
                  <td colSpan="5" className="muted" style={{ textAlign: 'center' }}>
                    No timeline logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
