import React from 'react';

export default function VolumeChart({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return <p className="muted">No event volume recorded yet.</p>;
  }

  const maxCount = Math.max(1, ...timeline.map((x) => x.count || 0));

  return (
    <div className="volume-histogram">
      <div className="histogram-bars">
        {timeline.map((x) => {
          const heightPct = Math.max(6, Math.round(((x.count || 0) / maxCount) * 100));
          return (
            <div className="histogram-col" key={x.day} title={`${x.day}: ${x.count} events`}>
              <span className="col-count">{x.count}</span>
              <div className="col-bar-wrap">
                <div className="col-bar" style={{ height: `${heightPct}%` }} />
              </div>
              <small className="col-label">{(x.day || '').slice(5, 10)}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
