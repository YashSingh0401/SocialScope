import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import EvidencePanel from '../components/EvidencePanel';
import { formatDate } from '../utils/formatters';

export default function Investigation({ alertsData, activeAlertId, onExportBrief }) {
  const alertList = alertsData?.alerts || [];
  const [selectedAlertId, setSelectedAlertId] = useState(activeAlertId || alertList[0]?.alert_id);
  const [verdict, setVerdict] = useState('CONFIRMED_THREAT');
  const [analystNotes, setAnalystNotes] = useState('');
  const [investigations, setInvestigations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const currentDossier = alertList.find((a) => a.alert_id === selectedAlertId) || alertList[0];

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getInvestigations();
        setInvestigations(res.investigations || []);
      } catch {
        setInvestigations([]);
      }
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
        analyst: 'Intelligence Analyst',
        notes: analystNotes
      });
      setInvestigations([res.entry, ...investigations]);
      setFeedbackMsg('Verdict successfully committed to the tamper-evident audit ledger.');
      setAnalystNotes('');
    } catch (err) {
      setFeedbackMsg(`Error logging verdict: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-investigation">
      <div className="investigation-hero">
        <div>
          <h2>Analyst Investigation & Attribution Workbench</h2>
          <p className="subtitle">
            Rigorous attribution workflow: Verify Patient Zero origin, inspect CIB coordination evidence, and record official analyst decisions.
          </p>
        </div>
        {currentDossier && (
          <button
            className="btn-primary"
            onClick={() => onExportBrief && onExportBrief(currentDossier)}
          >
            📄 Export Brief for Command
          </button>
        )}
      </div>

      <div className="investigation-layout">
        <div className="investigation-left">
          <article className="panel alert-selector-panel">
            <div className="panel-header">
              <h3>Surveillance Targets Under Review</h3>
              <span className="badge">{alertList.length} QUEUED</span>
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
                    Attention Score: {a.attention_score?.toFixed(0)}/100 · {a.analyzed_volume || a.events_count || 0} events
                  </small>
                </div>
              ))}
              {!alertList.length && (
                <p className="muted">No dossiers queued for investigation.</p>
              )}
            </div>
          </article>

          {/* Analyst Decision Console */}
          <article className="panel decision-console">
            <div className="panel-header">
              <h3>Analyst Decision & Audit Log</h3>
              <span className="badge">CHAIN OF CUSTODY</span>
            </div>

            <form onSubmit={handleSubmitDecision} className="decision-form">
              <label className="form-label">Classification Verdict</label>
              <div className="verdict-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="verdict"
                    value="CONFIRMED_THREAT"
                    checked={verdict === 'CONFIRMED_THREAT'}
                    onChange={(e) => setVerdict(e.target.value)}
                  />
                  <span className="radio-box confirmed">⚠️ Confirmed Threat</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="verdict"
                    value="FALSE_POSITIVE"
                    checked={verdict === 'FALSE_POSITIVE'}
                    onChange={(e) => setVerdict(e.target.value)}
                  />
                  <span className="radio-box dismissed">✓ False Positive</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="verdict"
                    value="ESCALATED_COMMAND"
                    checked={verdict === 'ESCALATED_COMMAND'}
                    onChange={(e) => setVerdict(e.target.value)}
                  />
                  <span className="radio-box escalated">🚨 Escalate to NTRO</span>
                </label>
              </div>

              <label className="form-label">Attribution & Technical Notes</label>
              <textarea
                rows="4"
                className="notes-textarea"
                placeholder="Detail the technical justification, cross-platform propagation links, and recommended response..."
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                required
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={isSubmitting || !analystNotes.trim()}
                >
                  {isSubmitting ? 'Recording…' : 'Commit Verdict to Audit Ledger'}
                </button>
              </div>
              {feedbackMsg && <p className="feedback-text">{feedbackMsg}</p>}
            </form>
          </article>
        </div>

        <div className="investigation-right">
          <EvidencePanel dossier={currentDossier} />

          {/* Historical Audit Trail */}
          <article className="panel audit-trail-panel">
            <div className="panel-header">
              <h3>Audit Trail & Historical Decisions</h3>
              <span className="badge">{investigations.length} LOGGED</span>
            </div>
            <div className="audit-feed">
              {investigations.map((inv) => (
                <div className="audit-entry" key={inv.id}>
                  <div className="audit-entry-head">
                    <span className={`pill small ${inv.verdict === 'CONFIRMED_THREAT' ? 'danger' : inv.verdict === 'ESCALATED_COMMAND' ? 'warning' : 'neutral'}`}>
                      {inv.verdict.replace('_', ' ')}
                    </span>
                    <strong className="audit-topic">{inv.topic}</strong>
                    <small className="audit-time">{formatDate(inv.timestamp)}</small>
                  </div>
                  <p className="audit-notes">"{inv.notes}"</p>
                  <small className="audit-analyst">Officer: {inv.analyst}</small>
                </div>
              ))}
              {!investigations.length && (
                <p className="muted">No investigation decisions recorded yet.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
