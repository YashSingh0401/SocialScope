import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function Overview({
  overview,
  trends,
  alerts,
  onNavigate,
  onSelectAlert,
  onSelectDataset
}) {
  const [showChartTable, setShowChartTable] = useState(false);
  const totalEvents = overview?.total ?? 348;
  const activeTopics = 3;
  const openAlerts = alerts?.alerts?.length ?? 2;

  // Daily activity points
  const timeline = overview?.timeline || [
    { day: '2026-03-01', count: 24 },
    { day: '2026-03-02', count: 30 },
    { day: '2026-03-03', count: 28 },
    { day: '2026-03-04', count: 42 },
    { day: '2026-03-05', count: 184 },
    { day: '2026-03-06', count: 156 },
    { day: '2026-03-07', count: 68 }
  ];

  const maxVal = Math.max(...timeline.map((d) => d.count), 1);

  // Platform source cards
  const platforms = [
    { name: 'X (Twitter)', route: '/platforms/x', latestTime: '2026-03-07 11:42 UTC', count: 184 },
    { name: 'Telegram', route: '/platforms/telegram', latestTime: '2026-03-07 10:15 UTC', count: 96 },
    { name: 'Reddit', route: '/platforms/reddit', latestTime: '2026-03-07 09:30 UTC', count: 68 },
    { name: 'YouTube', route: '/platforms/youtube', latestTime: '2026-03-07 08:20 UTC', count: 34 },
    { name: 'Instagram', route: '/platforms/instagram', latestTime: '2026-03-06 22:10 UTC', count: 28 },
    { name: 'Facebook', route: '/platforms/facebook', latestTime: '2026-03-06 20:45 UTC', count: 22 }
  ];

  const alertItems = alerts?.alerts || [
    {
      alert_id: 'alert_cluster_top-01',
      topic_label: 'Critical Grid Blackout Claims',
      attention_score: 88.5,
      strongest_signal: 'Coordinated bot surge exceeding dynamic EWMA baseline (+338%)',
      last_update: '2026-03-05 09:30 UTC',
      threat_level: 'CRITICAL'
    },
    {
      alert_id: 'alert_cluster_top-02',
      topic_label: 'Cross-Border Incursion Rumors',
      attention_score: 64.0,
      strongest_signal: 'Cross-platform broadcast via bridge brokers across isolated channels',
      last_update: '2026-03-05 10:15 UTC',
      threat_level: 'HIGH'
    }
  ];

  const evidenceRows = [
    {
      cells: [
        <strong key="1">Sudden volume surge (+338%)</strong>,
        <span key="2" className="platform-pill x">X (Twitter)</span>,
        <span key="3">Patient zero post from <code>disinfo_seed_01</code> claiming complete grid collapse.</span>
      ]
    },
    {
      cells: [
        <strong key="1">Synchronized relay bursts</strong>,
        <span key="2" className="platform-pill telegram">Telegram</span>,
        <span key="3">4 identical forward chains propagated within 90 seconds across regional channels.</span>
      ]
    },
    {
      cells: [
        <strong key="1">Community counter-evidence</strong>,
        <span key="2" className="platform-pill reddit">Reddit</span>,
        <span key="3">r/infrastructure engineers confirming standard SCADA telemetry and operating voltage.</span>
      ]
    }
  ];

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <h4 className="section-headline">Activity by day</h4>
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

      {!showChartTable ? (
        <div className="chart-container" aria-label="Daily event counts plot">
          <div className="bar-chart-series">
            {timeline.map((point, idx) => {
              const heightPct = Math.round((point.count / maxVal) * 100);
              return (
                <div key={idx} className="bar-column" title={`${point.day}: ${point.count} events`}>
                  <span className="bar-value-tooltip">{point.count}</span>
                  <div className="bar-fill" style={{ height: `${heightPct}%` }} />
                  <span className="bar-label">{point.day.slice(5)}</span>
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
              <th>Recorded Events</th>
              <th>Baseline Status</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((point, idx) => (
              <tr key={idx}>
                <td>{point.day}</td>
                <td>{point.count}</td>
                <td>{point.count > 100 ? 'Exceeded threshold (Spike)' : 'Within normal bounds'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Source Cards */}
      <div style={{ marginTop: '20px' }}>
        <h4 className="section-headline" style={{ marginBottom: '10px' }}>Monitored Platform Sources</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {platforms.map((p, idx) => (
            <div
              key={idx}
              className="ranking-item"
              onClick={() => onNavigate(p.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(p.route); }}
            >
              <div className="ranking-title-row">
                <span className="ranking-name">{p.name}</span>
                <span className="ranking-metric">{p.count} events</span>
              </div>
              <div className="ranking-sub">Latest: {p.latestTime}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Attention queue</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Ranked alerts by algorithmic severity triage. Select an alert to open Investigation.
      </p>

      <div className="ranking-list">
        {alertItems.map((alt) => (
          <div
            key={alt.alert_id}
            className="attention-queue-item"
            onClick={() => onSelectAlert && onSelectAlert(alt.alert_id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelectAlert(alt.alert_id); }}
          >
            <div className="attention-queue-header">
              <span className={`attention-badge ${alt.threat_level?.toLowerCase() || 'high'}`}>
                Score: {alt.attention_score?.toFixed(1) || alt.attention_score}
              </span>
              <small style={{ color: '#64748b', fontSize: '11px' }}>{alt.last_update || 'Recent'}</small>
            </div>
            <strong style={{ fontSize: '13px', color: '#142838', marginTop: '2px' }}>
              {alt.topic_label || alt.topic}
            </strong>
            <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0 0 0' }}>
              {alt.strongest_signal || alt.reasons?.[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/overview</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Overview</h1>
        <p className="screen-question">What changed in the selected dataset, and which change deserves a closer look?</p>
      </header>

      <ScreenCard
        scopeFilters={['All platforms', 'Last 7 days']}
        metricCards={[
          { label: 'Events', value: totalEvents.toLocaleString(), sub: 'Distinct records in scope' },
          { label: 'Active topics', value: activeTopics, sub: 'Clustered themes' },
          { label: 'Open alerts', value: openAlerts, sub: 'Requiring review' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Recent changes', 'Platform', 'Evidence']}
        evidenceRows={evidenceRows}
        evidenceTitle="Recent Changes Evidence"
        onRowClick={() => onNavigate('/investigations/alert_cluster_top-01')}
      />
    </div>
  );
}
