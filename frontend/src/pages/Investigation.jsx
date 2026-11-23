import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function Investigation({ alertId = 'alert_cluster_top-01', onNavigate }) {
  const [decision, setDecision] = useState('Confirm');
  const [notes, setNotes] = useState('Confirmed coordinated inauthentic behavior campaign propagating falsified power grid blackout claims. Attributed to bot swarm cluster initiated by actor disinfo_seed_01.');
  const [analystName, setAnalystName] = useState('Lead Analyst');
  const [saveStatus, setSaveStatus] = useState('');
  const [concurrencyConflict, setConcurrencyConflict] = useState(null);

  const [auditHistory, setAuditHistory] = useState([
    {
      decision: 'Investigate',
      analyst: 'Security Analyst 04',
      timestamp: '2026-03-05 09:45:00 UTC',
      note: 'Triaged spike alert. High negative polarity and rapid cross-platform synchronization warrant full review.'
    },
    {
      decision: 'Unreviewed',
      analyst: 'System (Attention Engine)',
      timestamp: '2026-03-05 09:30:00 UTC',
      note: 'Automated threshold exceedance: EWMA growth surge +338%.'
    }
  ]);

  const alertData = {
    id: alertId,
    title: 'Critical Grid Blackout Claims',
    attentionScore: 88.5,
    threatLevel: 'CRITICAL',
    reviewStatus: auditHistory[0]?.decision || 'Under Review',
    evidenceRecordsCount: 184,
    rationale: 'Multiple statistical indicators point to an orchestrated disinformation campaign: rapid synchronized relays across 3 platforms within 180 seconds, 4 duplicate copypasta variants, and verified SCADA operational telemetry demonstrating normal power station profiles.'
  };

  const evidenceRecords = [
    { source: 'tw-101 (disinfo_seed_01)', signal: 'Patient Zero Origin Post', time: '2026-03-05 08:00:00 UTC', excerpt: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.' },
    { source: 'tg-102 (amplifier_bot_99)', signal: 'Synchronized Telegram Relay', time: '2026-03-05 08:01:15 UTC', excerpt: 'Forwarded: Total grid collapse confirmed across Sector 4. Generators failing.' },
    { source: 'tw-103 (bot_relay_44)', signal: 'Identical Copypasta Tweet', time: '2026-03-05 08:01:45 UTC', excerpt: 'BREAKING: Critical security breach reported in central communications grid. #Blackout' },
    { source: 'rd-104 (citizen_observer)', signal: 'Ground-Truth Contradiction', time: '2026-03-05 08:15:00 UTC', excerpt: 'Local power is completely fine. Suspicious identical posts spreading on Twitter.' }
  ];

  const evidenceRows = evidenceRecords.map((ev, idx) => ({
    cells: [
      <span key="1"><code>{ev.source}</code></span>,
      <span key="2" className="platform-pill">{ev.signal}</span>,
      <span key="3">
        <strong style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{ev.time}</strong>
        "{ev.excerpt}"
      </span>
    ]
  }));

  const handleSaveDecision = () => {
    // Optimistic concurrency check simulation
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const newEntry = {
      decision: decision,
      analyst: analystName,
      timestamp: nowIso,
      note: notes
    };

    setAuditHistory([newEntry, ...auditHistory]);
    setSaveStatus('Decision successfully recorded and committed to audit trail.');
    setConcurrencyConflict(null);
  };

  const primaryContent = (
    <div>
      {/* Alert Rationale Panel */}
      <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Alert Rationale & Threat Context
          </span>
          <span className="attention-badge critical">Attention: {alertData.attentionScore}/100</span>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
          {alertData.rationale}
        </p>
      </div>

      {/* Multi-Signal Evidence Timeline */}
      <h4 className="section-headline" style={{ marginBottom: '12px' }}>Multi-Signal Evidence Timeline</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {/* Trend Evidence Card */}
        <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <strong style={{ fontSize: '12px', color: '#142838' }}>📈 Trend Evidence</strong>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#b91c1c', margin: '4px 0' }}>+338% Surge</div>
          <small style={{ color: '#64748b' }}>184 posts observed vs 42 baseline expected count in 2-hour window.</small>
        </div>

        {/* Sentiment Polarity Card */}
        <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <strong style={{ fontSize: '12px', color: '#142838' }}>🎯 Sentiment & Tone</strong>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#b45309', margin: '4px 0' }}>88% Negative</div>
          <small style={{ color: '#64748b' }}>Heavy alarmist panic markers across both English and Hindi text.</small>
        </div>

        {/* Audience Geographic Card */}
        <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <strong style={{ fontSize: '12px', color: '#142838' }}>👥 Audience Demographics</strong>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0369a1', margin: '4px 0' }}>Northern Grid Sector</div>
          <small style={{ color: '#64748b' }}>80% of regional mentions geolocated to Sector 4 and NCR substations.</small>
        </div>

        {/* Network Topology Card */}
        <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <strong style={{ fontSize: '12px', color: '#142838' }}>🕸️ Network Topology</strong>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#6d28d9', margin: '4px 0' }}>CIB Coordination: 0.86</div>
          <small style={{ color: '#64748b' }}>3 bot accounts with identical copypasta within 90-second propagation window.</small>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/reports')}
        >
          Include In Intelligence Report Preview →
        </button>
        <button
          className="btn-secondary btn-small"
          onClick={() => onNavigate('/network')}
        >
          Inspect Network Topology →
        </button>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Decision panel</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Record formal analyst adjudication and defensible rationale.
      </p>

      {saveStatus && (
        <div style={{ padding: '8px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534' }}>
          ✓ {saveStatus}
        </div>
      )}

      {concurrencyConflict && (
        <div style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '11.5px', color: '#92400e' }}>
          <strong>Conflict Detected:</strong> A newer decision exists. Your draft notes have been preserved below.
        </div>
      )}

      {/* Decision Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Analyst Verdict</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {['Confirm', 'Reject', 'Investigate'].map((opt) => (
            <button
              key={opt}
              type="button"
              className={`btn-toggle-view ${decision === opt ? 'active' : ''}`}
              onClick={() => setDecision(opt)}
              style={{ justifyContent: 'center', padding: '6px' }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Analyst Name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Analyst Identifier</label>
        <input
          type="text"
          className="scope-input"
          value={analystName}
          onChange={(e) => setAnalystName(e.target.value)}
        />
      </div>

      {/* Notes Field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Adjudication Notes</label>
        <textarea
          rows={5}
          className="scope-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Record justification, attribution evidence, and recommendations..."
        />
      </div>

      <button
        className="btn-primary"
        onClick={handleSaveDecision}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Save Decision & Update Audit History
      </button>

      {/* Audit History */}
      <div style={{ marginTop: '16px' }}>
        <strong style={{ fontSize: '11.5px', color: '#142838', textTransform: 'uppercase' }}>Audit History & Prior Decisions</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {auditHistory.map((entry, idx) => (
            <div key={idx} style={{ padding: '8px 10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span className={`badge-status ${entry.decision === 'Confirm' ? 'critical' : entry.decision === 'Reject' ? 'ready' : 'pending'}`}>
                  {entry.decision.toUpperCase()}
                </span>
                <span style={{ color: '#64748b' }}>{entry.timestamp}</span>
              </div>
              <div style={{ color: '#1e293b', fontWeight: 500, margin: '3px 0' }}>By: {entry.analyst}</div>
              <p style={{ margin: 0, color: '#475569', fontStyle: 'italic' }}>"{entry.note}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/investigations/:id</span>
          <span className="section-kicker">Threat Operations</span>
        </div>
        <h1 className="screen-title">Investigation</h1>
        <p className="screen-question">Does the evidence support the alert, and what should be recorded?</p>
      </header>

      <ScreenCard
        scopeFilters={[`Alert: ${alertData.title}`, 'All Evidence Types', 'Audited Scope']}
        metricCards={[
          { label: 'Attention score', value: `${alertData.attentionScore}/100`, sub: `${alertData.threatLevel} Priority` },
          { label: 'Evidence records', value: alertData.evidenceRecordsCount, sub: 'Corpus in alert cluster' },
          { label: 'Review status', value: alertData.reviewStatus, sub: 'Audit-logged state' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Source record', 'Signal', 'Event time']}
        evidenceRows={evidenceRows}
        evidenceTitle="Supporting Evidence Records"
      />
    </div>
  );
}
