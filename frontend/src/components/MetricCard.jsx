import React from 'react';

export default function MetricCard({ title, value, detail, icon, badge, trend }) {
  return (
    <article className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <div className="metric-main">
        <strong className="metric-value">{value ?? '—'}</strong>
        {badge && (
          <span className={`metric-badge ${badge.type || 'info'}`}>
            {badge.text}
          </span>
        )}
      </div>
      {detail && <small className="metric-detail">{detail}</small>}
      {trend && (
        <div className={`metric-trend ${trend.positive ? 'up' : 'down'}`}>
          <span>{trend.positive ? '↑' : '↓'} {trend.text}</span>
        </div>
      )}
    </article>
  );
}
