import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import EvidencePanel from '../components/EvidencePanel';

export default function Investigation({ alertsData, activeAlertId, onExportBrief }) {
  const alertList = alertsData?.alerts || [];
  const [selectedAlertId, setSelectedAlertId] = useState(activeAlertId || alertList[0]?.alert_id);
  const [verdict, setVerdict] = useState('CONFIRMED_THREAT');
  const [analystNotes, setAnalystNotes] = useState('');
  const [confidenceRating, setConfidenceRating] = useState('HIGH');
  const [investigations, setInvestigations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const currentDossier = alertList.find((a) => a.alert_id === selectedAlertId) || alertList[0];

  useEffect(() => {
    if (activeAlertId) {
      setSelectedAlertId(activeAlertId);
    }
  }, [activeAlertId]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getInvestigations();
        if (res && res.investigations) {
          setInvestigations(res.investigations);
          return;
        }
      } catch {
        // Fallback demo audit history
      }
      setInvestigations([
        {
          investigation_id: 'inv-901',
          alert_id: 'alert_cluster_top-01',
          topic: 'Critical Grid Blackout Claims',
          verdict: 'CONFIRMED_THREAT',
          analyst: 'Officer Sharma (Cyber Forensics)',
          notes: 'Multi-platform copypasta burst confirmed from 3 bot accounts. Disinformation vector targeting Sector 4 infrastructure.',
          timestamp: '2026-03-05T09:45:00Z'
        }
      ]);
    }
    loadLogs();
  }, []);

  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!currentDossier) return;
    setIsSubmitting(true);
    setFeedbackMsg('');
    try {
      const res = await api.postInvestigation({
        alert_id: currentDossier.alert_id,
        topic: currentDossier.topic_label || currentDossier.topic || 'General Topic',
        verdict: verdict,
        analyst: 'Duty Intelligence Officer',
        notes: analystNotes || `Adjudicated as ${verdict} with ${confidenceRating} confidence rating.`
      });
      setInvestigations([res.entry || {
        investigation_id: `inv-${Date.now()}`,
        alert_id: currentDossier.alert_id,
        topic: currentDossier.topic_label || currentDossier.topic,
        verdict: verdict,
        analyst: 'Duty Intelligence Officer',
        notes: analystNotes || `Adjudicated as ${verdict}.`,
        timestamp: new Date().toISOString()
      }, ...investigations]);
      setFeedbackMsg('Verdict successfully committed to the tamper-evident audit ledger.');
      setAnalystNotes('');
    } catch (err) {
      // Local demo fallback if backend DB is not configured
      setInvestigations([{
        investigation_id: `inv-${Date.now()}`,
        alert_id: currentDossier.alert_id,
        topic: currentDossier.topic_label || currentDossier.topic,
        verdict: verdict,
        analyst: 'Duty Intelligence Officer',
        notes: analystNotes || `Adjudicated as ${verdict}.`,
        timestamp: new Date().toISOString()
      }, ...investigations]);
      setFeedbackMsg('Verdict recorded in local analyst session ledger.');
      setAnalystNotes('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-investigation">
      {/* Investigation Workbench Hero */}
      <div className="investigation-hero">
        <div>
          <h2>Analyst Investigation & Attribution Workbench</h2>
          <p className="subtitle">
            Rigorous attribution workflow: Examine Patient Zero origin, compare contradictory signals, and record binding analyst decisions.
          </p>
        </div>
        {currentDossier && (
          <button
            className="btn-primary"
            onClick={() => onExportBrief && onExportBrief(currentDossier)}
          >
            📄 Export Formal Brief →
          </button>
        )}
      </div>

      <div className="investigation-layout">
        {/* Left Column: Queued Surveillance Targets */}
        <div className="investigation-left">
          <article className="panel alert-selector-panel">
            <div className="panel-header">
              <h3>Dossiers Under Review</h3>
              <span className="badge badge-amber">{alertList.length} QUEUED</span>
            </div>
            <div className="selector-list">
              {alertList.map((a) => (
                <div
                  key={a.alert_id}
                  className={`selector-item ${selectedAlertId === a.alert_id ? 'active' : ''}`}
                  onClick={() => setSelectedAlertId(a.alert_id)}
                >
                  <div className="item-head">
                    <strong>{a.topic_label || a.topic}</strong>
                    <span className={`pill small ${a.threat_level?.toLowerCase()}`}>
                      {a.threat_level}
                    </span>
                  </div>
                  <small className="item-sub">
                    Attention: <strong>{a.attention_score?.toFixed(1)}</strong>/100 · {a.analyzed_volume || 0} events
                  </small>
                </div>
              ))}
              {!alertList.length && (
                <p className="muted" style={{ padding: '1rem' }}>No dossiers queued for investigation.</p>
              )}
            </div>
          </article>

          {/* Record Analyst Decision Studio */}
          <article className="panel decision-panel">
            <div className="panel-header">
              <h3>Record Official Verdict</h3>
              <span className="badge badge-purple">Human Adjudication</span>
            </div>

            <form onSubmit={handleSubmitDecision} className="decision-form">
              <div className="form-group">
                <label>Adjudication Verdict:</label>
                <div className="verdict-options-grid">
                  {[
                    { id: 'CONFIRMED_THREAT', label: 'Confirmed Threat', color: 'rose' },
                    { id: 'FALSE_POSITIVE', label: 'False Positive', color: 'emerald' },
                    { id: 'MONITORING', label: 'Keep Monitoring', color: 'amber' },
                    { id: 'ESCALATED_COMMAND', label: 'Escalate Command', color: 'purple' }
                  ].map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      className={`verdict-btn ${verdict === v.id ? 'active ' + v.color : ''}`}
                      onClick={() => setVerdict(v.id)}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Analyst Forensic Justification:</label>
                <textarea
                  rows="3"
                  placeholder="Detail evidence rationale, identified threat actor, and recommended defensive countermeasures..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary full-width"
                disabled={isSubmitting || !currentDossier}
              >
                {isSubmitting ? 'Recording Verdict...' : 'Commit Verdict to Audit Ledger'}
              </button>

              {feedbackMsg && (
                <div className="feedback-banner">
                  ✓ {feedbackMsg}
                </div>
              )}
            </form>
          </article>
        </div>

        {/* Right Column: Evidence Examination & Signal Comparison */}
        <div className="investigation-right">
          {/* Signal Comparison / Contradiction Matrix */}
          <article className="panel contradiction-panel">
            <div className="panel-header">
              <div>
                <h3>Signal Comparison & Contradiction Matrix</h3>
                <p className="panel-subtitle">Side-by-side reconciliation of viral claims vs verified state bulletins</p>
              </div>
              <span className="badge badge-rose">Contradiction Detected</span>
            </div>

            <div className="signal-comparison-grid">
              <div className="signal-box claim-signal">
                <div className="signal-head">
                  <span className="pill small danger">UNVERIFIED CLAIM</span>
                  <code>@disinfo_seed_01</code>
                </div>
                <blockquote className="signal-quote">
                  "CRITICAL: Complete grid collapse confirmed across Sector 4. Do not trust official news. #Blackout"
                </blockquote>
                <div className="signal-meta">
                  <span>🚨 Emotion: <strong>Panic / Fear (88%)</strong></span>
                  <span>⚡ Platform: <strong>Twitter/X Mirror</strong></span>
                </div>
              </div>

              <div className="signal-box official-signal">
                <div className="signal-head">
                  <span className="pill small success">VERIFIED COUNTER-SIGNAL</span>
                  <code>@official_press</code>
                </div>
                <blockquote className="signal-quote">
                  "Notice: All national grid substations are functioning normally under standard operating procedures. #FactCheck"
                </blockquote>
                <div className="signal-meta">
                  <span>🛡 Sentiment: <strong>Neutral / Factual</strong></span>
                  <span>🏛 Source: <strong>State Transmission Authority</strong></span>
                </div>
              </div>
            </div>
          </article>

          {/* Detailed Forensic Evidence Panel */}
          {currentDossier ? (
            <EvidencePanel dossier={currentDossier} />
          ) : (
            <div className="panel empty-state">
              <p>Select a queued dossier on the left to examine technical evidence.</p>
            </div>
          )}

          {/* Audit Ledger History */}
          <article className="panel audit-log-panel">
            <div className="panel-header">
              <div>
                <h3>Tamper-Evident Adjudication Audit Trail</h3>
                <p className="panel-subtitle">Cryptographic log of all recorded officer decisions and verdicts</p>
              </div>
              <span className="badge badge-emerald">{investigations.length} DECISIONS</span>
            </div>

            <div className="audit-table-wrap">
              <table className="tactical-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Target Alert</th>
                    <th>Verdict</th>
                    <th>Officer</th>
                    <th>Forensic Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {investigations.map((inv, idx) => (
                    <tr key={idx}>
                      <td>
                        <small>{inv.timestamp ? new Date(inv.timestamp).toLocaleString() : 'Just now'}</small>
                      </td>
                      <td>
                        <strong>{inv.topic}</strong>
                      </td>
                      <td>
                        <span className={`pill small ${inv.verdict === 'CONFIRMED_THREAT' ? 'danger' : inv.verdict === 'FALSE_POSITIVE' ? 'success' : 'warning'}`}>
                          {inv.verdict?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <code>{inv.analyst}</code>
                      </td>
                      <td>
                        <p className="audit-note-text">{inv.notes}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
