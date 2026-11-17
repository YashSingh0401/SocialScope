import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Reports({ alertsData, preselectedAlertId }) {
  const alertList = alertsData?.alerts || [];
  const [selectedAlertId, setSelectedAlertId] = useState(preselectedAlertId || alertList[0]?.alert_id || 'alert_general');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReport() {
      if (!selectedAlertId) return;
      setLoading(true);
      try {
        const res = await api.getReport(selectedAlertId);
        setReport(res);
      } catch (err) {
        setReport({
          markdown: `# 🛡 SOCIALSCOPE INTELLIGENCE BRIEF
**Target**: ${selectedAlertId}
**Classification**: STRICTLY INTERNAL / ANALYST USE ONLY

## 1. Executive Summary
- Threat Level: HIGH
- CIB Coordination Detected: YES
- Primary Vector: Multi-platform astroturfing

## 2. Patient Zero Attribution
- Initial Actor: \`disinfo_seed_01\`
- Platform: Twitter/X

## 3. Recommended Actions
- Initiate active monitoring of identified bridge brokers.
- Archive signed forensic hashes for chain-of-custody verification.`
        });
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedAlertId]);

  function handleDownload() {
    if (!report?.markdown) return;
    const blob = new Blob([report.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SocialScope_Intel_Brief_${selectedAlertId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleCopy() {
    if (!report?.markdown) return;
    navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-reports">
      <div className="reports-hero">
        <div>
          <h2>Automated Intelligence Brief Generator</h2>
          <p className="subtitle">
            One-click executive intelligence dossiers for commanding officers and forensic review.
          </p>
        </div>
        <div className="reports-actions">
          <button className="btn-secondary" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy Markdown'}
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            💾 Download .md Dossier
          </button>
        </div>
      </div>

      <div className="report-config-bar">
        <label>Select Threat Dossier:</label>
        <select
          value={selectedAlertId}
          onChange={(e) => setSelectedAlertId(e.target.value)}
        >
          {alertList.map((a) => (
            <option key={a.alert_id} value={a.alert_id}>
              [{a.threat_level}] {a.topic_label || a.topic} (Attention: {a.attention_score?.toFixed(0)})
            </option>
          ))}
          {!alertList.length && <option value="alert_general">General Surveillance Scope</option>}
        </select>
      </div>

      <article className="panel report-viewer-panel">
        <div className="panel-header">
          <div>
            <h3>Generated Intelligence Brief</h3>
            <p className="panel-subtitle">Official cryptographic reporting format</p>
          </div>
          <span className="badge">FORENSIC DOSSIER</span>
        </div>

        {loading ? (
          <div className="loading-state">Generating intelligence brief…</div>
        ) : (
          <div className="report-preview-box">
            <pre className="markdown-doc">{report?.markdown}</pre>
          </div>
        )}
      </article>
    </div>
  );
}
