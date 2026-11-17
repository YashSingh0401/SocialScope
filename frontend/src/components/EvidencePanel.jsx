import React from 'react';
import { formatDate, formatPercentage } from '../utils/formatters';

export default function EvidencePanel({ dossier }) {
  if (!dossier) {
    return (
      <div className="evidence-panel empty">
        <p>Select an alert or topic to inspect its multi-signal evidence dossier.</p>
      </div>
    );
  }

  const pz = dossier.patient_zero;
  const cib = dossier.cib_findings || dossier.cib_evidence;
  const amps = dossier.top_amplifiers || [];

  return (
    <div className="evidence-panel">
      <div className="evidence-header">
        <div>
          <span className="evidence-tag">EVIDENCE DOSSIER</span>
          <h3 className="evidence-title">{dossier.topic_label || dossier.topic || 'Subject Dossier'}</h3>
          <small className="evidence-time">Generated: {formatDate(dossier.generated_at)}</small>
        </div>
        <div className="evidence-score-badge">
          <span>Attention Score</span>
          <strong>{(dossier.attention_score || 0).toFixed(0)}/100</strong>
        </div>
      </div>

      <div className="evidence-grid">
        <div className="evidence-box">
          <h4>📍 Patient Zero Attribution</h4>
          {pz ? (
            <div className="pz-content">
              <p><strong>Actor:</strong> <code>{pz.actor_ref || 'Unknown'}</code></p>
              <p><strong>Platform:</strong> {pz.platform || 'N/A'}</p>
              <p><strong>Timestamp:</strong> {formatDate(pz.timestamp)}</p>
              <blockquote className="evidence-quote">"{pz.text}"</blockquote>
            </div>
          ) : (
            <p className="muted">No single origin node determined yet.</p>
          )}
        </div>

        <div className="evidence-box">
          <h4>🤖 Coordinated Inauthentic Behavior</h4>
          {cib ? (
            <div className="cib-content">
              <p><strong>CIB Status:</strong> {cib.is_coordinated ? '⚠️ Detected' : 'Organic / Low Coordination'}</p>
              <p><strong>Coordination Score:</strong> {formatPercentage(cib.coordination_score)}</p>
              <p><strong>Copypasta Clusters:</strong> {cib.copypasta_clusters || 0}</p>
              <p><strong>Rapid Synchronized Bursts:</strong> {cib.burst_count || 0}</p>
            </div>
          ) : (
            <p className="muted">CIB checks pending.</p>
          )}
        </div>
      </div>

      <div className="evidence-amplifiers">
        <h4>📢 Top Amplifiers & Propagation Nodes</h4>
        <div className="tablewrap small">
          <table>
            <thead>
              <tr>
                <th>Actor Ref</th>
                <th>In-Degree</th>
                <th>Out-Degree</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {amps.slice(0, 5).map((a, i) => (
                <tr key={i}>
                  <td><code>{a.actor_ref}</code></td>
                  <td><b>{a.in_degree ?? a.degree ?? '—'}</b></td>
                  <td>{a.out_degree ?? '—'}</td>
                  <td><span className="pill small">Amplifier</span></td>
                </tr>
              ))}
              {!amps.length && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>
                    No amplifier nodes recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
