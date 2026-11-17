import React from 'react';

export default function Sidebar({ activePage, setActivePage, alertsCount = 0, spikeCount = 0 }) {
  const sections = [
    {
      label: 'Core Intelligence',
      items: [
        { id: 'Overview', name: 'Overview', icon: '◈' },
        { id: 'Trend radar', name: 'Trend Radar', icon: '⚡', badge: spikeCount > 0 ? `${spikeCount} SPIKE` : null, badgeClass: 'spike-badge' },
        { id: 'Topic explorer', name: 'Topic Explorer', icon: '🏷' },
        { id: 'Narrative timeline', name: 'Narrative Timeline', icon: '⏳' },
        { id: 'Audience', name: 'Audience Intelligence', icon: '👥' }
      ]
    },
    {
      label: 'Graph & Topology',
      items: [
        { id: 'Network map', name: 'Network Intelligence', icon: '🕸' }
      ]
    },
    {
      label: 'Threat Operations',
      items: [
        { id: 'Alerts', name: 'Alerts', icon: '⚠', badge: alertsCount > 0 ? String(alertsCount) : null, badgeClass: 'alert-badge' },
        { id: 'Investigation', name: 'Investigation', icon: '🔍' },
        { id: 'Reports', name: 'Reports', icon: '📄' }
      ]
    },
    {
      label: 'Data Pipelines',
      items: [
        { id: 'Event explorer', name: 'Event Explorer', icon: '≡' },
        { id: 'Replay studio', name: 'Replay Studio', icon: '▷' }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="logo-glyph">S</div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-title">SocialScope</span>
              <span className="intel-pill">PRO</span>
            </div>
            <span className="brand-sub">Social Operations & Intelligence</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div className="nav-section" key={sec.label}>
            <span className="nav-section-label">{sec.label}</span>
            <div className="nav-items">
              {sec.items.map((item) => {
                const isActive = activePage === item.id || (item.id === 'Alerts' && activePage === 'Alerts & Intel');
                return (
                  <button
                    key={item.id}
                    className={`nav-button ${isActive ? 'active' : ''}`}
                    onClick={() => setActivePage(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-name">{item.name}</span>
                    {item.badge && (
                      <span className={`nav-badge ${item.badgeClass || ''}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="pulse-dot" />
          <div className="system-status-text">
            <strong>System Operational</strong>
            <small>Multi-Signal Forensic Pipeline</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
