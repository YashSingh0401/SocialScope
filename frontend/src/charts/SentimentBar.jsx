import React from 'react';

export default function SentimentBar({ items = [], total = 0 }) {
  const safeTotal = total || items.reduce((acc, x) => acc + (x.count || 0), 0);

  const getStyleClass = (label) => {
    switch (label?.toLowerCase()) {
      case 'positive': return 'pos';
      case 'negative': return 'neg';
      case 'neutral': return 'neu';
      default: return 'unavail';
    }
  };

  return (
    <div className="sentiment-bar-widget">
      <div className="bar-stacked">
        {items.map((x) => {
          const pct = safeTotal ? (x.count / safeTotal) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={x.label}
              className={`bar-segment ${getStyleClass(x.label)}`}
              style={{ width: `${pct}%` }}
              title={`${x.label}: ${x.count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <div className="bar-legend">
        {items.map((x) => {
          const pct = safeTotal ? (x.count / safeTotal) * 100 : 0;
          return (
            <div className="legend-item" key={x.label}>
              <span className={`legend-dot ${getStyleClass(x.label)}`} />
              <span className="legend-label">{x.label}</span>
              <strong className="legend-count">{x.count}</strong>
              <small className="legend-pct">({pct.toFixed(0)}%)</small>
            </div>
          );
        })}
        {!items.length && <p className="muted">No sentiment data available.</p>}
      </div>
    </div>
  );
}
