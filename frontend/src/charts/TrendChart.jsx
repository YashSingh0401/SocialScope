import React, { useState } from 'react';

export default function TrendChart({ timeline = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="chart-empty">
        <p>No timeline data available for trend analysis.</p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    5,
    ...timeline.map((d) => Math.max(d.volume_now ?? d.count ?? 0, d.volume_baseline ?? 0))
  );

  const getX = (i) => padding.left + (i / Math.max(1, timeline.length - 1)) * innerWidth;
  const getY = (v) => padding.top + innerHeight - (v / maxVal) * innerHeight;

  // Build points for Volume
  const volumePoints = timeline.map((d, i) => `${getX(i)},${getY(d.volume_now ?? d.count ?? 0)}`).join(' ');

  // Build points for Baseline
  const baselinePoints = timeline.map((d, i) => `${getX(i)},${getY(d.volume_baseline ?? d.volume_now ?? d.count ?? 0)}`).join(' ');

  const hoveredData = hoverIndex !== null ? timeline[hoverIndex] : null;

  return (
    <div className="trend-chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-chart-svg"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + innerHeight * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct} className="grid-line-group">
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="2,2"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* Baseline Line (Dashed Slate) */}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4,4"
          points={baselinePoints}
        />

        {/* Volume Area & Line (Cyan / Blue) */}
        <polyline
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          points={volumePoints}
        />

        {/* Data points and Spikes */}
        {timeline.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.volume_now ?? d.count ?? 0);
          const isSpike = d.is_spike;

          return (
            <g
              key={i}
              className="chart-point"
              onMouseEnter={() => setHoverIndex(i)}
            >
              {isSpike ? (
                <g>
                  <circle cx={cx} cy={cy} r="6" fill="#ef4444" opacity="0.4" />
                  <circle cx={cx} cy={cy} r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={cx} y={cy - 9} fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ⚡
                  </text>
                </g>
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={hoverIndex === i ? 4.5 : 2.5}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              )}

              {/* X Axis Labels for sparse dates */}
              {(i === 0 || i === timeline.length - 1 || i % Math.ceil(timeline.length / 4) === 0) && (
                <text
                  x={cx}
                  y={height - 8}
                  fill="#64748b"
                  fontSize="9.5"
                  textAnchor="middle"
                >
                  {(d.day || '').slice(5, 10)}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover Crosshair */}
        {hoverIndex !== null && (
          <line
            x1={getX(hoverIndex)}
            y1={padding.top}
            x2={getX(hoverIndex)}
            y2={padding.top + innerHeight}
            stroke="#38bdf8"
            strokeDasharray="2,2"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Hover Info Tooltip */}
      {hoveredData && (
        <div className="chart-tooltip">
          <strong>{(hoveredData.day || '').slice(0, 10)}</strong>
          <div>Volume: <b>{hoveredData.volume_now ?? hoveredData.count}</b></div>
          <div>Baseline: <b>{hoveredData.volume_baseline ?? '—'}</b></div>
          {hoveredData.growth_rate != null && (
            <div>Growth: <b>{(hoveredData.growth_rate * 100).toFixed(0)}%</b></div>
          )}
          {hoveredData.is_spike && (
            <span className="tooltip-spike">⚡ STATISTICAL SPIKE</span>
          )}
        </div>
      )}

      <div className="chart-legend">
        <span className="legend-item"><i className="legend-line volume" /> Volume Activity</span>
        <span className="legend-item"><i className="legend-line baseline" /> EWMA Baseline</span>
        <span className="legend-item"><i className="legend-dot spike" /> Statistical Spike</span>
      </div>
    </div>
  );
}
