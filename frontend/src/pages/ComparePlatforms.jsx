import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function ComparePlatforms({ onNavigate }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    x: true,
    telegram: true,
    reddit: true,
    youtube: true,
    instagram: false,
    facebook: false
  });

  const [metricMode, setMetricMode] = useState('counts'); // 'counts' or 'share'

  const allPlatforms = [
    { key: 'x', name: 'X (Twitter)', route: '/platforms/x', color: '#0f172a' },
    { key: 'telegram', name: 'Telegram', route: '/platforms/telegram', color: '#0284c7' },
    { key: 'reddit', name: 'Reddit', route: '/platforms/reddit', color: '#ea580c' },
    { key: 'youtube', name: 'YouTube', route: '/platforms/youtube', color: '#dc2626' },
    { key: 'instagram', name: 'Instagram', route: '/platforms/instagram', color: '#db2777' },
    { key: 'facebook', name: 'Facebook', route: '/platforms/facebook', color: '#2563eb' }
  ];

  const activePlatforms = allPlatforms.filter((p) => selectedPlatforms[p.key]);

  const togglePlatform = (key) => {
    setSelectedPlatforms((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount <= 2) return prev; // Keep at least two sources
      return { ...prev, [key]: !prev[key] };
    });
  };

  const timelineDays = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07'];

  const platformData = {
    x: { total: 184, annotated: 172, sentiment: { pos: 28, neu: 36, neg: 108 }, daily: [14, 18, 16, 26, 112, 94, 38], interactions: 'Quote posts & Retweets' },
    telegram: { total: 96, annotated: 92, sentiment: { pos: 12, neu: 16, neg: 64 }, daily: [6, 7, 8, 10, 44, 40, 18], interactions: 'Forward chains' },
    reddit: { total: 68, annotated: 65, sentiment: { pos: 22, neu: 20, neg: 23 }, daily: [4, 5, 4, 6, 28, 22, 12], interactions: 'Thread comment trees' },
    youtube: { total: 34, annotated: 32, sentiment: { pos: 8, neu: 10, neg: 14 }, daily: [0, 0, 0, 0, 14, 12, 8], interactions: 'Top comments & replies' },
    instagram: { total: 28, annotated: 26, sentiment: { pos: 6, neu: 8, neg: 12 }, daily: [0, 0, 0, 0, 12, 10, 6], interactions: 'Media comments' },
    facebook: { total: 22, annotated: 20, sentiment: { pos: 4, neu: 6, neg: 10 }, daily: [0, 0, 0, 0, 10, 8, 4], interactions: 'Reactions mix (Like, Angry)' }
  };

  const evidenceRows = activePlatforms.map((p) => {
    const d = platformData[p.key];
    const sharePct = d.total > 0 ? `${((d.annotated / d.total) * 100).toFixed(1)}%` : '0%';
    return {
      cells: [
        <div key="1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`platform-pill ${p.key}`}>{p.name}</span>
          <button
            className="btn-tiny"
            onClick={(e) => { e.stopPropagation(); onNavigate(p.route); }}
          >
            Open page →
          </button>
        </div>,
        <span key="2">
          <strong>{d.total}</strong> distinct events ({d.interactions})
        </span>,
        <span key="3">
          <strong>{sharePct}</strong> ({d.annotated} annotated / {d.total} eligible)
        </span>
      ],
      route: p.route
    };
  });

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Aligned activity series (Small Multiples)</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Aligned to identical daily time buckets. Compare velocity spikes across platforms.
          </span>
        </div>
        <div className="view-controls">
          <button
            type="button"
            className={`btn-toggle-view ${metricMode === 'counts' ? 'active' : ''}`}
            onClick={() => setMetricMode('counts')}
          >
            Raw Counts
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${metricMode === 'share' ? 'active' : ''}`}
            onClick={() => setMetricMode('share')}
          >
            % Period Share
          </button>
        </div>
      </div>

      {/* Platform Multi-select checklist */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {allPlatforms.map((p) => {
          const isChecked = selectedPlatforms[p.key];
          return (
            <button
              key={p.key}
              type="button"
              className={`btn-toggle-view ${isChecked ? 'active' : ''}`}
              onClick={() => togglePlatform(p.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{isChecked ? '✓' : '＋'}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Small Multiples Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {activePlatforms.map((p) => {
          const d = platformData[p.key];
          const maxDay = Math.max(...d.daily, 1);
          return (
            <div
              key={p.key}
              style={{
                padding: '14px',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onClick={() => onNavigate(p.route)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13.5px', color: '#142838' }}>{p.name}</strong>
                <span className="badge-status ready">{d.total} events</span>
              </div>

              {/* Mini bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>
                {d.daily.map((val, idx) => {
                  const hPct = val > 0 ? Math.round((val / maxDay) * 100) : 0;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: val > 0 ? `${hPct}%` : '2px',
                          background: val === 0 ? '#e2e8f0' : 'var(--color-teal)',
                          borderRadius: '1px 1px 0 0'
                        }}
                        title={`${timelineDays[idx]}: ${val} events`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Sentiment Proportions Breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                <span>Sentiment:</span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>{d.sentiment.pos} Pos</span> ·
                <span style={{ color: '#64748b' }}>{d.sentiment.neu} Neu</span> ·
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>{d.sentiment.neg} Neg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Coverage by source</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Cross-platform denominator and enrichment rates.
      </p>

      <div className="ranking-list">
        {activePlatforms.map((p) => {
          const d = platformData[p.key];
          return (
            <div
              key={p.key}
              className="ranking-item"
              onClick={() => onNavigate(p.route)}
            >
              <div className="ranking-title-row">
                <span className="ranking-name">{p.name}</span>
                <span className="ranking-metric">{((d.annotated / d.total) * 100).toFixed(0)}%</span>
              </div>
              <div className="ranking-sub">
                Eligible: {d.total} / Annotated: {d.annotated}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Interactions: {d.interactions}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Cross-Platform Signal:</strong> Twitter and Telegram show synchronous emergence at 08:00 UTC, while Reddit fact-checking appeared 15 minutes later.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/compare</span>
          <span className="section-kicker">Threat Operations</span>
        </div>
        <h1 className="screen-title">Compare platforms</h1>
        <p className="screen-question">How does discussion of one topic differ across selected platforms?</p>
      </header>

      <ScreenCard
        scopeFilters={['Topic: Blackout Claims', `${activePlatforms.length} Platforms Selected`, 'Common 7-Day Window']}
        metricCards={[
          { label: 'Sources selected', value: activePlatforms.length, sub: 'Active small multiples' },
          { label: 'Common window', value: '2026-03-01 to 03-07', sub: 'Synchronized baseline' },
          { label: 'Covered days', value: 7, sub: 'Zero collection gaps' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Platform', 'Eligible events', 'Share annotated']}
        evidenceRows={evidenceRows}
        evidenceTitle="Cross-Platform Comparative Evidence"
        onRowClick={(row) => {
          if (row.route) onNavigate(row.route);
        }}
      />
    </div>
  );
}
