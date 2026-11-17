import React from 'react';
import { getThreatColor, getScoreColor, formatDate } from '../utils/formatters';

export default function AlertCard({ alert, onInvestigate, onExportBrief }) {
  const threatColors = getThreatColor(alert.threat_level);
  const scoreColor = getScoreColor(alert.attention_score);
  const pz = alert.patient_zero;
  const cib = alert.cib_findings || alert.cib_evidence;

  return (
    <article
      className="alert-card"
      style={{ borderLeft: `5px solid ${threatColors.border}` }}
    >
      <div className="alert-card-head">
        <div className="alert-title-block">
          <div className="alert-badges">
            <span
              className="threat-pill"
              style={{
                backgroundColor: threatColors.bg,
                color: threatColors.text,
                borderColor: threatColors.border
              }}
            >
              {alert.threat_level || 'LOW'}
            </span>
            <div className="attention-meter-container">
              <span className="meter-label">Attention Score</span>
              <div className="meter-bar-wrap">
                <div
                  className="meter-bar-fill"
                  style={{
                    width: `${Math.min(100, alert.attention_score || 0)}%`,
                    backgroundColor: scoreColor
                  }}
                />
              </div>
              <strong style={{ color: scoreColor }}>
                {(alert.attention_score || 0).toFixed(0)}/100
              </strong>
            </div>

            {cib?.is_coordinated && (
              <span className="cib-pill">
                🤖 Coordinated Campaign
              </span>
            )}
          </div>

          <h3 className="alert-topic-name">{alert.topic_label || alert.topic || 'General Anomaly'}</h3>
        </div>

        <div className="alert-actions">
          {onInvestigate && (
            <button
              className="btn-secondary small"
              onClick={() => onInvestigate(alert)}
            >
              🔍 Deep Dive
            </button>
          )}
          {onExportBrief && (
            <button
              className="btn-primary small"
              onClick={() => onExportBrief(alert)}
            >
              📄 Brief
            </button>
          )}
        </div>
      </div>

      <div className="alert-signals">
        <strong className="signals-header">EXPLAINABILITY SIGNALS:</strong>
        <ul className="signals-list">
          {(alert.reasons || alert.signals || [
            'Multi-signal anomaly triggered by attention engine velocity scoring.'
          ]).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="alert-dossier-grid">
        {pz && (
          <div className="dossier-subbox">
            <span className="subbox-label">📍 PATIENT ZERO (ORIGIN)</span>
            <p className="subbox-main">
              <strong>{pz.actor_ref || 'Unknown Actor'}</strong> on <em>{pz.platform || 'Platform'}</em>
              <small className="subbox-time"> · {formatDate(pz.timestamp)}</small>
            </p>
            <p className="subbox-quote">"{pz.text}"</p>
          </div>
        )}

        {cib && (
          <div className="dossier-subbox">
            <span className="subbox-label">🤖 CIB & BOT PATTERNS</span>
            <div className="cib-metrics">
              <span>Coordination: <strong>{((cib.coordination_score || 0) * 100).toFixed(0)}%</strong></span>
              <span>Copypasta clusters: <strong>{cib.copypasta_clusters || 0}</strong></span>
              <span>Time bursts: <strong>{cib.burst_count || 0}</strong></span>
            </div>
            {cib.flagged_accounts?.length > 0 && (
              <p className="cib-accounts">
                Flagged accounts: {cib.flagged_accounts.slice(0, 3).join(', ')}
                {cib.flagged_accounts.length > 3 ? ` +${cib.flagged_accounts.length - 3} more` : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
