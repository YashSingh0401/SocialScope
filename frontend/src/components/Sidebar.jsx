import React from 'react';

export default function Sidebar({
  currentRoute,
  onNavigate,
  alertsCount = 2,
  spikesCount = 1
}) {
  const coreItems = [
    { id: '/overview', label: 'Overview', icon: '◈' },
    { id: '/trends', label: 'Trends', icon: '📈', badge: spikesCount > 0 ? `${spikesCount}` : null, badgeClass: 'spike' },
    { id: '/topics', label: 'Topics', icon: '🏷️' },
    { id: '/narratives', label: 'Narratives', icon: '⏳' },
    { id: '/audience', label: 'Audience', icon: '👥' },
    { id: '/network', label: 'Network', icon: '🕸️' }
  ];

  const platformItems = [
    { id: '/platforms/reddit', label: 'Reddit', icon: '🔴' },
    { id: '/platforms/youtube', label: 'YouTube', icon: '▶️' },
    { id: '/platforms/telegram', label: 'Telegram', icon: '✈️' },
    { id: '/platforms/x', label: 'X (Twitter)', icon: '✖️' },
    { id: '/platforms/instagram', label: 'Instagram', icon: '📸' },
    { id: '/platforms/facebook', label: 'Facebook', icon: '📘' }
  ];

  const workflowItems = [
    { id: '/compare', label: 'Compare platforms', icon: '⚖️' },
    { id: '/alerts', label: 'Alerts', icon: '⚠️', badge: alertsCount > 0 ? `${alertsCount}` : null, badgeClass: 'alert' },
    { id: '/reports', label: 'Reports', icon: '📄' },
    { id: '/sources', label: 'Sources', icon: '🗄️' }
  ];

  const isCurrent = (route) => {
    if (route === '/investigations' && currentRoute.startsWith('/investigations')) return true;
    return currentRoute === route;
  };

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-mark">S</div>
          <div>
            <div className="brand-name">SocialScope</div>
            <div className="brand-badge">Analyst Workspace</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <div className="nav-group-title">Analytics</div>
          {coreItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isCurrent(item.id) ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isCurrent(item.id) ? 'page' : undefined}
            >
              <div className="nav-item-content">
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-count-badge ${item.badgeClass || ''}`}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Platforms</div>
          {platformItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isCurrent(item.id) ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isCurrent(item.id) ? 'page' : undefined}
            >
              <div className="nav-item-content">
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Operations</div>
          {workflowItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isCurrent(item.id) ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isCurrent(item.id) ? 'page' : undefined}
            >
              <div className="nav-item-content">
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`nav-count-badge ${item.badgeClass || ''}`}>{item.badge}</span>
              )}
            </button>
          ))}

          {currentRoute.startsWith('/investigations') && (
            <button
              className="nav-item active"
              onClick={() => onNavigate(currentRoute)}
              aria-current="page"
              style={{ marginTop: '4px' }}
            >
              <div className="nav-item-content">
                <span className="nav-icon" aria-hidden="true">🔍</span>
                <span>Investigation</span>
              </div>
              <span className="nav-count-badge alert">Active</span>
            </button>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
          <strong style={{ color: '#1e293b' }}>Operational</strong>
        </div>
        <div>FastAPI Analytics 0.4.0</div>
      </div>
    </aside>
  );
}
