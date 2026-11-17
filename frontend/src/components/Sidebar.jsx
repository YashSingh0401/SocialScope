import React from 'react';

export default function Sidebar({ activePage, setActivePage, alertsCount = 0, spikeCount = 0 }) {
  const sections = [
    {
      label: 'CORE INTELLIGENCE',
      items: [
        { id: 'Overview', name: 'Overview', icon: '◈', color: '#38bdf8' },
        { id: 'Trend radar', name: 'Trend Radar', icon: '⚡', color: '#f59e0b', badge: spikeCount > 0 ? `${spikeCount} SPIKE` : null, badgeClass: 'spike-badge' },
        { id: 'Topic explorer', name: 'Topic Explorer', icon: '🏷', color: '#818cf8' },
        { id: 'Narrative timeline', name: 'Narrative Timeline', icon: '⏳', color: '#ec4899' },
        { id: 'Audience', name: 'Audience Analytics', icon: '👥', color: '#10b981' }
      ]
    },
    {
      label: 'GRAPH & TOPOLOGY',
      items: [
        { id: 'Network map', name: 'Network Map', icon: '🕸', color: '#a78bfa' }
      ]
    },
    {
      label: 'THREAT INTELLIGENCE',
      items: [
        { id: 'Alerts & Intel', name: 'Alerts & Intel', icon: '⚠', color: '#ef4444', badge: alertsCount > 0 ? String(alertsCount) : null, badgeClass: 'alert-badge' },
        { id: 'Investigation', name: 'Investigation', icon: '🔍', color: '#06b6d4' },
        { id: 'Reports', name: 'Intelligence Briefs', icon: '📄', color: '#3b82f6' }
      ]
    },
    {
      label: 'DATA PIPELINES',
      items: [
        { id: 'Event explorer', name: 'Event Explorer', icon: '≡', color: '#94a3b8' },
        { id: 'Replay studio', name: 'Replay Studio', icon: '▷', color: '#14b8a6' }
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="logo-glyph">S</span>
          <div className="brand-text">
            <div className="brand-title-row">
              <strong>SocialScope</strong>
              <span className="status-tag">INTEL</span>
            </div>
            <span className="brand-sub">NTRO / SIH26152</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div className="nav-section" key={sec.label}>
            <span className="nav-section-label">{sec.label}</span>
            <div className="nav-items">
              {sec.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    className={`nav-button ${isActive ? 'active' : ''}`}
                    onClick={() => setActivePage(item.id)}
                  >
                    <span
                      className="nav-icon"
                      style={{ color: isActive ? '#38bdf8' : item.color }}
                    >
                      {item.icon}
                    </span>
                    <span className="nav-title">{item.name}</span>
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
        <div className="footer-status">
          <span className="pulse-dot" />
          <div className="footer-info">
            <strong>Active Surveillance</strong>
            <small>v1.0-mvp · Multi-Signal</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
