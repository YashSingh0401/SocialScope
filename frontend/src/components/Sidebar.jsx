import React from 'react';

export default function Sidebar({ activePage, setActivePage, alertsCount = 0, spikeCount = 0 }) {
  const sections = [
    {
      label: 'CORE INTELLIGENCE',
      items: [
        { id: 'Overview', name: 'Overview', icon: '◈' },
        { id: 'Trend radar', name: 'Trend Radar', icon: '⚡', badge: spikeCount > 0 ? `${spikeCount} SPIKE` : null, badgeClass: 'spike-badge' },
        { id: 'Topic explorer', name: 'Topic Explorer', icon: '🏷' },
        { id: 'Narrative timeline', name: 'Narrative Timeline', icon: '⏳' },
        { id: 'Audience', name: 'Audience Analytics', icon: '👥' }
      ]
    },
    {
      label: 'GRAPH & TOPOLOGY',
      items: [
        { id: 'Network map', name: 'Network Map', icon: '🕸' }
      ]
    },
    {
      label: 'THREAT INTELLIGENCE',
      items: [
        { id: 'Alerts & Intel', name: 'Alerts & Intel', icon: '⚠', badge: alertsCount > 0 ? String(alertsCount) : null, badgeClass: 'alert-badge' },
        { id: 'Investigation', name: 'Investigation', icon: '🔍' },
        { id: 'Reports', name: 'Intelligence Briefs', icon: '📄' }
      ]
    },
    {
      label: 'DATA PIPELINES',
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
          <span className="logo-glyph">S</span>
          <div className="brand-text">
            <strong>SocialScope</strong>
            <span className="brand-sub">NTRO / SIH26152</span>
          </div>
        </div>
        <span className="status-tag">INTELLIGENCE</span>
      </div>

      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div className="nav-section" key={sec.label}>
            <span className="nav-section-label">{sec.label}</span>
            <div className="nav-items">
              {sec.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-button ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-title">{item.name}</span>
                  {item.badge && (
                    <span className={`nav-badge ${item.badgeClass || ''}`}>{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span className="pulse-dot" />
          <div className="footer-info">
            <strong>System Operational</strong>
            <small>v1.0-mvp · Multi-Signal</small>
          </div>
        </div>
        <div className="footer-note">Evidence first · Rigorous attribution</div>
      </div>
    </aside>
  );
}
