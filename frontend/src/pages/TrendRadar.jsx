import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function TrendRadar({ trends, topics, onNavigate }) {
  const [selectedTopicId, setSelectedTopicId] = useState('top-01');
  const [showChartTable, setShowChartTable] = useState(false);

  const risingTopicsCount = 2;
  const currentVolume = 348;
  const baselineWindow = '7-day EWMA (α=0.3)';

  const rankedTopics = [
    {
      id: 'top-01',
      name: 'Critical Grid Blackout Claims',
      growth: '+338%',
      persistence: 'High (48h sustained)',
      baselinePeriod: 'Previous 7 days',
      baselineCount: 42,
      currentCount: 184,
      isSpike: true
    },
    {
      id: 'top-02',
      name: 'Official Infrastructure Status Bulletin',
      growth: '+122%',
      persistence: 'Medium (24h reactive)',
      baselinePeriod: 'Previous 7 days',
      baselineCount: 43,
      currentCount: 96,
      isSpike: true
    },
    {
      id: 'top-03',
      name: 'Citizen Fact-Check & Verification',
      growth: '+45%',
      persistence: 'Low (organic steady)',
      baselinePeriod: 'Previous 7 days',
      baselineCount: 47,
      currentCount: 68,
      isSpike: false
    }
  ];

  const currentTopic = rankedTopics.find((t) => t.id === selectedTopicId) || rankedTopics[0];

  // Timeline for selected topic
  const timelinePoints = [
    { day: '2026-03-01', observed: 24, baseline: 20 },
    { day: '2026-03-02', observed: 30, baseline: 22 },
    { day: '2026-03-03', observed: 28, baseline: 24 },
    { day: '2026-03-04', observed: 42, baseline: 28 },
    { day: '2026-03-05', observed: 184, baseline: 42 },
    { day: '2026-03-06', observed: 156, baseline: 70 },
    { day: '2026-03-07', observed: 68, baseline: 85 }
  ];

  const maxVal = Math.max(...timelinePoints.map((p) => Math.max(p.observed, p.baseline)), 1);

  const evidenceRows = rankedTopics.map((t) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{t.name}</strong>,
      <span key="2" style={{ color: t.isSpike ? '#b91c1c' : '#15803d', fontWeight: 700 }}>{t.growth}</span>,
      <span key="3">{t.persistence}</span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Observed and expected volume</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Overlay for topic: <strong>{currentTopic.name}</strong>
          </span>
        </div>
        <div className="view-controls">
          <button
            type="button"
            className={`btn-toggle-view ${!showChartTable ? 'active' : ''}`}
            onClick={() => setShowChartTable(false)}
          >
            Chart
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${showChartTable ? 'active' : ''}`}
            onClick={() => setShowChartTable(true)}
          >
            Table view
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', marginBottom: '8px', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', background: 'var(--color-teal)', borderRadius: '2px' }} />
          <span>Observed Volume</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '16px', height: '0px', borderTop: '2px dashed #94a3b8' }} />
          <span>Dynamic EWMA Baseline</span>
        </div>
      </div>

      {!showChartTable ? (
        <div className="chart-container" aria-label="Observed volume and baseline chart">
          <div className="bar-chart-series">
            {timelinePoints.map((pt, idx) => {
              const obsPct = Math.round((pt.observed / maxVal) * 100);
              const basePct = Math.round((pt.baseline / maxVal) * 100);
              return (
                <div key={idx} className="bar-column" title={`${pt.day} | Observed: ${pt.observed}, Baseline: ${pt.baseline}`}>
                  <span className="bar-value-tooltip">{pt.observed}</span>
                  <div
                    className="bar-baseline-marker"
                    style={{ bottom: `${basePct}%` }}
                    title={`Baseline: ${pt.baseline}`}
                  />
                  <div className="bar-fill" style={{ height: `${obsPct}%` }} />
                  <span className="bar-label">{pt.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <table className="accessible-chart-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Observed Volume</th>
              <th>Expected Baseline</th>
              <th>Growth Ratio</th>
            </tr>
          </thead>
          <tbody>
            {timelinePoints.map((pt, idx) => (
              <tr key={idx}>
                <td>{pt.day}</td>
                <td>{pt.observed}</td>
                <td>{pt.baseline}</td>
                <td>{((pt.observed / pt.baseline) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/topics')}
        >
          Open Topic Explorer for representative records →
        </button>
        <button
          className="btn-secondary btn-small"
          onClick={() => onNavigate('/narratives')}
        >
          Open Narrative Timeline →
        </button>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Trend ranking</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Ranked by growth above baseline. Select to update plot.
      </p>

      <div className="ranking-list">
        {rankedTopics.map((topic) => (
          <div
            key={topic.id}
            className={`ranking-item ${selectedTopicId === topic.id ? 'selected' : ''}`}
            onClick={() => setSelectedTopicId(topic.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTopicId(topic.id); }}
          >
            <div className="ranking-title-row">
              <span className="ranking-name">{topic.name}</span>
              <span className="ranking-metric" style={{ color: topic.isSpike ? '#b91c1c' : '#007a78' }}>
                {topic.growth}
              </span>
            </div>
            <div className="ranking-sub">
              Baseline: {topic.baselineCount} events ({topic.baselinePeriod})
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Current volume: <strong>{topic.currentCount}</strong> · {topic.persistence}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/trends</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Trend Radar</h1>
        <p className="screen-question">Which topics grew faster than their recent baseline, and did that growth last?</p>
      </header>

      <ScreenCard
        scopeFilters={['Daily bucket', 'Growth > 100%', 'All platforms']}
        metricCards={[
          { label: 'Rising topics', value: risingTopicsCount, sub: 'Exceeding baseline threshold' },
          { label: 'Current volume', value: currentVolume.toLocaleString(), sub: 'Events in window' },
          { label: 'Baseline window', value: baselineWindow, sub: 'Dynamic EWMA model' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Topic', 'Growth', 'Persistence']}
        evidenceRows={evidenceRows}
        evidenceTitle="Trend Growth & Persistence Evidence"
      />
    </div>
  );
}
