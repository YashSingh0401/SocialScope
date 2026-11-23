import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function Alerts({ alertsData, onSelectAlert, onNavigate }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState('alert_cluster_top-01');

  const alerts = [
    {
      alert_id: 'alert_cluster_top-01',
      topic_label: 'Critical Grid Blackout Claims',
      attention_score: 88.5,
      threat_level: 'CRITICAL',
      review_status: 'Unreviewed',
      scoring_window: '2026-03-05 08:00 – 10:00 UTC',
      timestamp: '2026-03-05T09:30:00Z',
      contributing_signals: [
        '+338% surge above dynamic EWMA baseline threshold',
        '88% negative sentiment concentration in English and Hindi',
        '3 synchronized copypasta propagation bursts detected'
      ],
      breakdown: {
        growth: { score: 92, weight: '30%', note: 'Sudden +338% velocity surge' },
        cib: { score: 86, weight: '25%', note: 'High coordination: 4 copypasta clusters' },
        sentiment: { score: 88, weight: '20%', note: 'Predominantly alarmist polarity' },
        cross_platform: { score: 85, weight: '15%', note: 'Active across Twitter, Telegram, Reddit' },
        reach: { score: 78, weight: '10%', note: '3 modular network communities involved' }
      }
    },
    {
      alert_id: 'alert_cluster_top-02',
      topic_label: 'Cross-Border Incursion Rumors',
      attention_score: 64.0,
      threat_level: 'HIGH',
      review_status: 'Under review',
      scoring_window: '2026-03-05 09:00 – 11:00 UTC',
      timestamp: '2026-03-05T10:15:00Z',
      contributing_signals: [
        '+120% velocity increase across regional news channels',
        'Bridge broker diffusion between isolated Telegram groups'
      ],
      breakdown: {
        growth: { score: 65, weight: '30%', note: '+120% increase' },
        cib: { score: 28, weight: '25%', note: 'Organic diffusion pattern' },
        sentiment: { score: 72, weight: '20%', note: 'High emotional tension' },
        cross_platform: { score: 60, weight: '15%', note: 'Telegram & X' },
        reach: { score: 68, weight: '10%', note: '2 communities' }
      }
    },
    {
      alert_id: 'alert_cluster_top-03',
      topic_label: 'Official Clarification Transmission',
      attention_score: 41.2,
      threat_level: 'MEDIUM',
      review_status: 'Reviewed',
      scoring_window: '2026-03-05 10:00 – 12:00 UTC',
      timestamp: '2026-03-05T11:00:00Z',
      contributing_signals: [
        'Press release broadcast by verified authority handle',
        'Countering viral blackout rumor with high positive sentiment'
      ],
      breakdown: {
        growth: { score: 45, weight: '30%', note: 'Gradual broadcast' },
        cib: { score: 10, weight: '25%', note: 'Zero bot coordination' },
        sentiment: { score: 18, weight: '20%', note: 'Positive official tone' },
        cross_platform: { score: 55, weight: '15%', note: 'Multi-channel press' },
        reach: { score: 70, weight: '10%', note: 'Broad audience' }
      }
    }
  ];

  const unreviewedCount = alerts.filter((a) => a.review_status === 'Unreviewed').length;
  const underReviewCount = alerts.filter((a) => a.review_status === 'Under review').length;
  const reviewedCount = alerts.filter((a) => a.review_status === 'Reviewed').length;

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.review_status.toLowerCase() === statusFilter.toLowerCase();
  });

  const activeAlert = alerts.find((a) => a.alert_id === selectedAlertId) || alerts[0];

  const evidenceRows = filteredAlerts.map((alt) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{alt.topic_label}</strong>,
      <span key="2" className={`attention-badge ${alt.threat_level.toLowerCase()}`}>
        {alt.attention_score.toFixed(1)}/100 ({alt.threat_level})
      </span>,
      <span key="3" className={`badge-status ${alt.review_status === 'Reviewed' ? 'ready' : alt.review_status === 'Under review' ? 'pending' : 'unassigned'}`}>
        {alt.review_status}
      </span>
    ],
    alert_id: alt.alert_id
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <h4 className="section-headline">Prioritized alert queue</h4>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'Unreviewed', 'Under review', 'Reviewed'].map((st) => (
            <button
              key={st}
              className={`btn-toggle-view ${statusFilter.toLowerCase() === st.toLowerCase() ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {filteredAlerts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAlerts.map((alt) => {
            const isSelected = activeAlert.alert_id === alt.alert_id;
            return (
              <div
                key={alt.alert_id}
                className={`ranking-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedAlertId(alt.alert_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedAlertId(alt.alert_id); }}
                style={{ borderLeft: `4px solid ${alt.threat_level === 'CRITICAL' ? '#b91c1c' : alt.threat_level === 'HIGH' ? '#f59e0b' : '#0284c7'}` }}
              >
                <div className="ranking-title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`attention-badge ${alt.threat_level.toLowerCase()}`}>
                      Score {alt.attention_score.toFixed(1)}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#142838' }}>{alt.topic_label}</strong>
                  </div>
                  <span className={`badge-status ${alt.review_status === 'Reviewed' ? 'ready' : alt.review_status === 'Under review' ? 'pending' : 'unassigned'}`}>
                    {alt.review_status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 6px 0' }}>
                  Scoring window: {alt.scoring_window}
                </div>

                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#334155' }}>
                  {alt.contributing_signals.map((sig, sIdx) => (
                    <li key={sIdx}>{sig}</li>
                  ))}
                </ul>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    className="btn-primary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectAlert) onSelectAlert(alt.alert_id);
                      else onNavigate(`/investigations/${alt.alert_id}`);
                    }}
                  >
                    Open Investigation →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-data-box">
          <div className="empty-data-title">No alerts match status filter: "{statusFilter}"</div>
          <div className="empty-data-desc">Try clearing the status filter to view all current algorithmic signals.</div>
          <button className="btn-secondary btn-small" onClick={() => setStatusFilter('all')}>
            Clear status filter
          </button>
        </div>
      )}
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Score explanation</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Algorithmic components for <strong>{activeAlert.topic_label}</strong> ({activeAlert.attention_score.toFixed(1)}/100).
      </p>

      <div className="ranking-list">
        {Object.entries(activeAlert.breakdown).map(([key, item]) => (
          <div key={key} className="ranking-item" style={{ cursor: 'default' }}>
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
              <span className="ranking-metric">{item.score}/100 <small style={{ color: '#64748b' }}>({item.weight})</small></span>
            </div>
            <div className="ranking-sub">{item.note}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11.5px', color: '#475569' }}>
        <strong>Explainability Guarantee:</strong> Scores are computed over verifiable statistical signals without black-box opacity.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/alerts</span>
          <span className="section-kicker">Threat Operations</span>
        </div>
        <h1 className="screen-title">Alerts</h1>
        <p className="screen-question">Which signals still need analyst review?</p>
      </header>

      <ScreenCard
        scopeFilters={['Status: ' + statusFilter, 'All platforms', 'Attention Score > 40']}
        metricCards={[
          { label: 'Unreviewed', value: unreviewedCount, sub: 'High-priority queue' },
          { label: 'Under review', value: underReviewCount, sub: 'Assigned to analyst' },
          { label: 'Reviewed', value: reviewedCount, sub: 'Adjudicated verdicts' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Alert', 'Attention score', 'Review status']}
        evidenceRows={evidenceRows}
        evidenceTitle="Alert Prioritization Evidence"
        onRowClick={(row) => {
          if (row.alert_id) {
            if (onSelectAlert) onSelectAlert(row.alert_id);
            else onNavigate(`/investigations/${row.alert_id}`);
          }
        }}
      />
    </div>
  );
}
