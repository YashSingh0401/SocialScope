import React from 'react';

export default function ScreenCard({
  scopeFilters = [],
  metricCards = [],
  primaryContent,
  inspectorContent,
  evidenceColumns = [],
  evidenceRows = [],
  evidenceTitle = 'Evidence list',
  evidenceActions,
  onRowClick,
  emptyState,
  isLoading = false
}) {
  return (
    <article className="analyst-workstation-card">
      {/* Dark Navy Scope Bar */}
      <div className="card-scope-bar">
        <div className="scope-bar-tags">
          {scopeFilters.map((tag, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="scope-bar-sep">/</span>}
              <span className={`scope-bar-tag ${idx === 0 ? 'active' : ''}`}>{tag}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3-Card Metric Summary Bar */}
      {metricCards.length > 0 && (
        <div className="metrics-summary-bar">
          {metricCards.map((mc, idx) => (
            <div key={idx} className="metric-summary-card">
              <span className="metric-summary-label">{mc.label}</span>
              <div className="metric-summary-value-row">
                <span className="metric-summary-val">{isLoading ? '—' : mc.value}</span>
                {mc.sub && <span className="metric-summary-sub">{mc.sub}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incomplete / Empty Data State */}
      {emptyState ? (
        <div style={{ padding: '24px' }}>
          {emptyState}
        </div>
      ) : (
        <>
          {/* 12-Column Content Grid: 8 Columns Primary / 4 Columns Inspector */}
          <div className="grid-12-content">
            <section className="col-primary-8">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                  <div className="skeleton skeleton-card" style={{ height: '220px' }} />
                </div>
              ) : (
                primaryContent
              )}
            </section>

            <aside className="col-inspector-4">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                  <div className="skeleton skeleton-card" style={{ height: '100px' }} />
                  <div className="skeleton skeleton-card" style={{ height: '100px' }} />
                </div>
              ) : (
                inspectorContent
              )}
            </aside>
          </div>

          {/* Evidence List Table at Bottom */}
          <section className="evidence-section">
            <div className="evidence-header-row">
              <h3 className="evidence-heading">
                <span>📁</span> {evidenceTitle}
              </h3>
              {evidenceActions && <div className="evidence-actions">{evidenceActions}</div>}
            </div>

            <div className="evidence-table-container">
              <table className="evidence-table" aria-label={evidenceTitle}>
                <thead>
                  <tr>
                    {evidenceColumns.map((col, idx) => (
                      <th key={idx} scope="col">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evidenceRows.length > 0 ? (
                    evidenceRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={onRowClick ? 'clickable' : ''}
                        onClick={() => onRowClick && onRowClick(row)}
                        tabIndex={onRowClick ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }}
                      >
                        {Array.isArray(row.cells) ? (
                          row.cells.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))
                        ) : (
                          Object.values(row).map((val, cIdx) => (
                            <td key={cIdx}>{val}</td>
                          ))
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={evidenceColumns.length} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No evidence records matching current filter scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </article>
  );
}
