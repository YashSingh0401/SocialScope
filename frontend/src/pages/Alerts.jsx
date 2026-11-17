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
      {/* Tactical Alerts Telemetry Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Active Alerts"
          value={alertList.length}
          detail="Prioritized by Attention Engine"
          icon="⚠"
          theme="amber"
        />
        <MetricCard
          title="Critical Threats"
          value={criticalCount}
          detail="Attention score ≥ 75 / 100"
          icon="🚨"
          badge={criticalCount > 0 ? { text: `${criticalCount} CRITICAL`, type: 'danger' } : { text: 'ZERO', type: 'neutral' }}
          theme="rose"
        />
        <MetricCard
          title="Coordinated Bot Swarms"
          value={cibCount}
          detail="Astroturfing & copypasta clusters"
          icon="🤖"
          badge={cibCount > 0 ? { text: 'CIB DETECTED', type: 'warning' } : null}
          theme="purple"
        />
      </div>

      {/* Severity Filter Bar */}
      <div className="alerts-filter-bar">
        <span className="filter-label">Filter by Severity Tier:</span>
        <div className="filter-buttons-group">
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
      </div>

      {/* Prioritized Alert Cards Feed */}
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
            <p>The Attention Engine has not flagged any abnormal behavioral bursts matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
