import React from 'react';

export default function MetricCard({ title, value, detail, icon, badge, trend, theme = 'cyan' }) {
  return (
    <article className={`metric-card theme-${theme}`}>
      <div className="metric-glow-accent" />
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && (
          <div className={`metric-icon-box box-${theme}`}>
            <span className="metric-icon">{icon}</span>
          </div>
        )}
      </div>
      <div className="metric-main">
        <strong className={`metric-value val-${theme}`}>{value ?? '—'}</strong>
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
