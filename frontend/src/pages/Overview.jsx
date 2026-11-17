import React from 'react';
import MetricCard from '../components/MetricCard';
import SentimentBar from '../charts/SentimentBar';
import VolumeChart from '../charts/VolumeChart';
import { formatLanguage } from '../utils/formatters';

export default function Overview({ overview, trends, alerts, onInvestigate, onNavigateToAlerts }) {
  const total = overview?.total ?? 0;
  const analyzed = overview?.analyzed ?? 0;
  const coverage = total > 0 ? Math.round(((overview?.sentiment_available ?? 0) / total) * 100) : 0;
  const spikes = trends?.spike_alerts?.length ?? 0;
  const alertList = alerts?.alerts || [];

  return (
    <div className="page-overview">
      {/* Tactical Key Telemetry Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Monitored Events"
          value={total.toLocaleString()}
          detail="Total ingest corpus in active scope"
          icon="📊"
          theme="cyan"
        />
        <MetricCard
          title="Enriched Posts"
          value={analyzed.toLocaleString()}
          detail="Multilingual NER, emotion & stance"
          icon="⚡"
          badge={{ text: 'ONNX INT8', type: 'info' }}
          theme="emerald"
        />
        <MetricCard
          title="Sentiment Coverage"
          value={`${coverage}%`}
          detail="Confidence-calibrated classifications"
          icon="🎯"
          theme="purple"
        />
        <MetricCard
          title="Statistical Spikes"
          value={spikes}
          detail="Dynamic EWMA baseline exceedances"
          icon="🚨"
          badge={spikes > 0 ? { text: `${spikes} ACTIVE`, type: 'danger' } : { text: 'QUIET', type: 'neutral' }}
          theme={spikes > 0 ? 'rose' : 'amber'}
        />
      </div>

      {/* High-Priority Active Alerts Queue */}
      <article className="panel alerts-briefing-panel">
        <div className="panel-header">
          <div>
            <h3>High-Priority Threat Queue</h3>
            <p className="panel-subtitle">Attention Engine algorithmic severity triage requiring human analyst review</p>
          </div>
          <button
            className="panel-action-link"
            onClick={onNavigateToAlerts}
          >
            View All Alerts ({alertList.length}) →
          </button>
        </div>

        <div className="overview-alerts-grid">
          {alertList.slice(0, 3).map((a) => (
            <div key={a.alert_id} className={`overview-alert-card border-${a.threat_level?.toLowerCase()}`}>
              <div className="alert-card-top">
                <span className={`pill small ${a.threat_level?.toLowerCase()}`}>
                  {a.threat_level} PRIORITY
                </span>
                <span className="attention-score-tag">
                  Attention: <strong>{a.attention_score?.toFixed(1)}</strong>/100
                </span>
              </div>

              <h4 className="alert-topic-name">{a.topic_label || a.topic}</h4>
              <p className="alert-primary-reason">
                {a.reasons?.[0] || 'Unusual behavioral cluster propagation detected.'}
              </p>

              <div className="alert-card-footer">
                <span className="alert-volume-metric">
                  📦 <strong>{a.analyzed_volume || 0}</strong> related posts
                </span>
                <button
                  className="btn-tiny"
                  onClick={() => onInvestigate && onInvestigate(a)}
                >
                  Investigate →
                </button>
              </div>
            </div>
          ))}

          {!alertList.length && (
            <p className="muted" style={{ padding: '1rem' }}>
              No critical threats flagged in the current observation window.
            </p>
          )}
        </div>
      </article>

      {/* Analytics Panels Grid */}
      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Sentiment & Polarity Distribution</h3>
              <p className="panel-subtitle">Multilingual transformer model inferences with defensible confidence thresholds</p>
            </div>
            <span className="badge badge-purple">NLP Model</span>
          </div>
          <SentimentBar items={overview?.sentiment || []} total={total} />
          <div className="panel-footnote">
            Confidence threshold: &gt;0.70 required for categorical assignment. Neutral or ambiguous tokens marked 'unavailable'.
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Linguistic Distribution</h3>
              <p className="panel-subtitle">Identified scripts across monitored English and Indic regional channels</p>
            </div>
            <span className="badge badge-emerald">Linguistic</span>
          </div>
          <div className="language-list">
            {(overview?.languages || []).map((l) => {
              const pct = total ? Math.round((l.count / total) * 100) : 0;
              return (
                <div className="lang-row" key={l.label}>
                  <div className="lang-info">
                    <span className="lang-name">{formatLanguage(l.label)}</span>
                    <span className="lang-code">[{l.label}]</span>
                  </div>
                  <div className="lang-bar-wrap">
                    <div
                      className="lang-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="lang-pct">{pct}%</span>
                  <strong className="lang-count">{l.count}</strong>
                </div>
              );
            })}
            {!(overview?.languages || []).length && (
              <p className="muted">No language distribution recorded yet.</p>
            )}
          </div>
        </article>
      </div>

      {/* Temporal Volume Chart */}
      <article className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h3>Conversation Volume Over Time</h3>
            <p className="panel-subtitle">Aggregated post frequency across monitored social streams (UTC timeline)</p>
          </div>
          <span className="badge badge-cyan">Time Series</span>
        </div>
        <VolumeChart timeline={overview?.timeline || []} />
      </article>
    </div>
  );
}
