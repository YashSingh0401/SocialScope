import React from 'react';
import MetricCard from '../components/MetricCard';
import SentimentBar from '../charts/SentimentBar';
import VolumeChart from '../charts/VolumeChart';
import { formatLanguage } from '../utils/formatters';

export default function Overview({ overview, trends, alerts, onLoadDemo, isBusy }) {
  const total = overview?.total ?? 0;
  const analyzed = overview?.analyzed ?? 0;
  const coverage = total > 0 ? Math.round(((overview?.sentiment_available ?? 0) / total) * 100) : 0;
  const spikes = trends?.spike_alerts?.length ?? 0;

  return (
    <div className="page-overview">
      <div className="metrics-grid">
        <MetricCard
          title="Total Events"
          value={total.toLocaleString()}
          detail="In current surveillance scope"
          icon="📊"
          theme="cyan"
        />
        <MetricCard
          title="Analyzed"
          value={analyzed.toLocaleString()}
          detail="Multilingual NLP enrichment done"
          icon="⚡"
          badge={{ text: 'ONNX INT8', type: 'info' }}
          theme="emerald"
        />
        <MetricCard
          title="Sentiment Coverage"
          value={`${coverage}%`}
          detail="Confidence-backed predictions"
          icon="🎯"
          theme="purple"
        />
        <MetricCard
          title="Active Spikes"
          value={spikes}
          detail="EWMA statistical surges"
          icon="🚨"
          badge={spikes > 0 ? { text: 'HIGH VELOCITY', type: 'danger' } : { text: 'NORMAL', type: 'neutral' }}
          theme={spikes > 0 ? 'rose' : 'amber'}
        />
      </div>

      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Sentiment Polarity Distribution</h3>
              <p className="panel-subtitle">Multilingual model output for conversation polarity</p>
            </div>
            <span className="badge badge-purple">MODEL OUTPUT</span>
          </div>
          <SentimentBar items={overview?.sentiment || []} total={total} />
          <div className="panel-footnote">
            * 'Unavailable' includes neutral or text below language threshold. It is not negative sentiment.
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Language Demographics</h3>
              <p className="panel-subtitle">Inferred from textual content via language identification</p>
            </div>
            <span className="badge badge-emerald">LINGUISTIC</span>
          </div>
          <div className="language-list">
            {(overview?.languages || []).map((l) => (
              <div className="lang-row" key={l.label}>
                <div className="lang-info">
                  <span className="lang-name">{formatLanguage(l.label)}</span>
                  <span className="lang-code">[{l.label}]</span>
                </div>
                <div className="lang-bar-wrap">
                  <div
                    className="lang-bar-fill"
                    style={{ width: `${total ? (l.count / total) * 100 : 0}%` }}
                  />
                </div>
                <strong className="lang-count">{l.count}</strong>
              </div>
            ))}
            {!(overview?.languages || []).length && (
              <p className="muted">No language distribution recorded yet.</p>
            )}
          </div>
        </article>
      </div>

      <article className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h3>Conversation Volume Timeline</h3>
            <p className="panel-subtitle">Normalized UTC timestamps across monitored channels</p>
          </div>
          <span className="badge badge-cyan">TIME SERIES</span>
        </div>

        {overview?.timeline && overview.timeline.length > 0 ? (
          <VolumeChart timeline={overview.timeline} />
        ) : (
          <div className="empty-state">
            <h4>SocialScope Surveillance Workspace Ready</h4>
            <p>Import your conversation JSON or load the pre-configured synthetic intelligence demo.</p>
            <button className="primary" onClick={onLoadDemo} disabled={isBusy}>
              {isBusy ? 'Loading demo…' : '🚀 Load Synthetic Intelligence Demo'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
