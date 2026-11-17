import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import AlertCard from '../components/AlertCard';

export default function Alerts({ alertsData, onInvestigate, onExportBrief }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const alertList = alertsData?.alerts || [];

  const criticalCount = alertList.filter((a) => a.threat_level === 'CRITICAL').length;
  const highCount = alertList.filter((a) => a.threat_level === 'HIGH').length;
  const cibCount = alertList.filter((a) => a.cib_evidence?.is_coordinated || a.cib_findings?.is_coordinated).length;

  const filteredAlerts = alertList.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.threat_level === severityFilter;
  });

  return (
    <div className="page-alerts">
      <div className="metrics-grid">
        <MetricCard
          title="Active Alerts"
          value={alertList.length}
          detail="Prioritized for analyst review"
          icon="⚠"
        />
        <MetricCard
          title="Critical Severity"
          value={criticalCount}
          detail="Attention score ≥ 75"
          icon="🚨"
          badge={criticalCount > 0 ? { text: 'IMMEDIATE', type: 'danger' } : { text: 'ZERO', type: 'neutral' }}
        />
        <MetricCard
          title="Coordinated Bot Swarms"
          value={cibCount}
          detail="Astroturfing & copypasta detected"
          icon="🤖"
          badge={cibCount > 0 ? { text: 'CIB DETECTED', type: 'warning' } : null}
        />
      </div>

      <div className="alerts-filter-bar">
        <span className="filter-label">SEVERITY FILTER:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
          <button
            key={lvl}
            className={`filter-btn ${severityFilter === lvl ? 'active' : ''}`}
            onClick={() => setSeverityFilter(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      <div className="alerts-feed">
        {filteredAlerts.map((alertItem) => (
          <AlertCard
            key={alertItem.alert_id}
            alert={alertItem}
            onInvestigate={onInvestigate}
            onExportBrief={onExportBrief}
          />
        ))}

        {!filteredAlerts.length && (
          <div className="empty-state">
            <h4>No Active Alerts in this Category</h4>
            <p>The surveillance engine has not flagged any abnormal behavioral bursts matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
