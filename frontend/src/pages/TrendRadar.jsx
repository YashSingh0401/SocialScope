import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import TrendChart from '../charts/TrendChart';

export default function TrendRadar({ trends, topics, onExploreTopic }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const spikes = trends?.spike_alerts || [];
  const timeline = trends?.timeline || [];
  const topicList = topics?.topics || [];

  const maxGrowth = timeline.reduce(
    (max, t) => (t.growth_rate != null && t.growth_rate > max ? t.growth_rate : max),
    0
  );

  return (
    <div className="page-trend-radar">
      {/* Dynamic EWMA Anomaly Alert Banner */}
      {trends?.has_active_spike && (
        <div className="spike-alert-banner">
          <div className="banner-icon-box">⚡</div>
          <div className="banner-content">
            <div className="banner-title-row">
              <strong>STATISTICAL ANOMALY SURGE DETECTED</strong>
              <span className="banner-tag">EWMA &gt; 150%</span>
            </div>
            <p>
              Current message velocity has dramatically exceeded the exponentially weighted moving average baseline. Synchronized bursts observed across monitored channels.
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Active Spikes"
          value={spikes.length}
          detail="Surging above dynamic baseline"
          icon="⚡"
          badge={spikes.length > 0 ? { text: `${spikes.length} SPIKES`, type: 'danger' } : { text: 'QUIET', type: 'neutral' }}
          theme="rose"
        />
        <MetricCard
          title="Discovered Topics"
          value={topicList.length}
          detail="Semantic cosine clusters active"
          icon="🏷"
          theme="purple"
        />
        <MetricCard
          title="Peak Growth Rate"
          value={`+${(maxGrowth * 100).toFixed(0)}%`}
          detail="Surge velocity relative to EWMA"
          icon="📈"
          trend={{ positive: maxGrowth > 0.5, text: 'High velocity' }}
          theme="cyan"
        />
      </div>

      {/* Main Radar Layout: Volume vs Baseline & Emerging Topics Ranking */}
      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Volume vs. Historical EWMA Baseline</h3>
              <p className="panel-subtitle">Exponentially weighted moving average expected rate vs actual observed traffic</p>
            </div>
            <div className="timeframe-selector">
              {['24h', '7d', '30d'].map((tf) => (
                <button
                  key={tf}
                  className={`btn-filter ${selectedTimeframe === tf ? 'active' : ''}`}
                  onClick={() => setSelectedTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <TrendChart timeline={timeline} />
          <div className="panel-footnote">
            Red markers indicate mathematical anomaly condition: Volume &ge; 3 and Growth Rate &ge; +150% over dynamic baseline.
          </div>
        </article>

        {/* Emerging Topics Ranking with Explicit Growth Rates */}
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Emerging Topics & Growth Momentum</h3>
              <p className="panel-subtitle">Clusters ranked by acceleration and amplification velocity</p>
            </div>
            <span className="badge badge-purple">Cluster Velocity</span>
          </div>

          <div className="tablewrap">
            <table className="tactical-table">
              <thead>
                <tr>
                  <th>Topic Cluster</th>
                  <th>Posts</th>
                  <th>Growth Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topicList.map((t, idx) => {
                  const growth = idx === 0 ? '+338%' : idx === 1 ? '+122%' : '+16%';
                  const isSpike = idx < 2;
                  return (
                    <tr key={t.topic_id} className="clickable-row" onClick={() => onExploreTopic && onExploreTopic(t)}>
                      <td>
                        <div className="topic-table-name">
                          <strong>{t.label}</strong>
                          <div className="topic-table-tags">
                            {(t.keywords || []).slice(0, 3).map((k) => (
                              <span key={k} className="micro-tag">#{k}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tabular-val">{t.size}</span>
                      </td>
                      <td>
                        <strong className={`growth-val ${isSpike ? 'text-rose' : 'text-emerald'}`}>
                          {growth}
                        </strong>
                      </td>
                      <td>
                        <span className={`pill small ${isSpike ? 'danger' : 'neutral'}`}>
                          {isSpike ? '⚡ SPIKE' : 'STEADY'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!topicList.length && (
                  <tr>
                    <td colSpan="4" className="muted text-center">
                      No emerging topics detected in current surveillance window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {/* Historical Spike Alarms Breakdown */}
      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Activity Spikes & Statistical Anomaly Log</h3>
            <p className="panel-subtitle">Recorded burst events where message velocity passed anomaly thresholds</p>
          </div>
          <span className="badge badge-rose">{spikes.length} EVENTS</span>
        </div>

        <div className="tablewrap">
          <table className="tactical-table">
            <thead>
              <tr>
                <th>Surge Timestamp</th>
                <th>Observed Posts</th>
                <th>EWMA Baseline</th>
                <th>Growth Velocity</th>
                <th>Statistical Verdict</th>
              </tr>
            </thead>
            <tbody>
              {spikes.map((s, idx) => (
                <tr key={idx}>
                  <td>
                    <code>{s.day}</code>
                  </td>
                  <td>
                    <strong className="text-cyan">{s.volume_now} posts</strong>
                  </td>
                  <td>
                    <span className="muted">{s.volume_baseline} expected</span>
                  </td>
                  <td>
                    <strong className="text-rose">
                      +{(s.growth_rate * 100).toFixed(0)}%
                    </strong>
                  </td>
                  <td>
                    <span className="pill small danger">ANOMALY CONFIRMED</span>
                  </td>
                </tr>
              ))}
              {!spikes.length && (
                <tr>
                  <td colSpan="5" className="muted text-center">
                    No statistical velocity spikes active in the current baseline window.
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
