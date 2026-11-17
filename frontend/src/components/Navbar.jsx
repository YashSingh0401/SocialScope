import React from 'react';
import { useFilters } from '../context/FilterContext';

export default function Navbar({
  activePage,
  connected,
  onOpenImport,
  autoRefresh,
  setAutoRefresh,
  demoMode,
  setDemoMode
}) {
  const { search, setSearch, triggerRefresh } = useFilters();

  return (
    <header className="navbar">
      <div className="nav-left">
        <span className="breadcrumb">
          Workspace <span className="sep">/</span> <strong className="page-accent">{activePage}</strong>
        </span>
      </div>

      <div className="nav-center">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search keywords, actors, hashtags, threats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className="nav-right">
        <button
          className={`demo-toggle-btn ${demoMode ? 'active' : ''}`}
          onClick={() => setDemoMode(!demoMode)}
          title="Toggle rich sample intelligence scenario"
        >
          <span className="demo-icon">⚡</span>
          <span>{demoMode ? 'Demo Data: ON' : 'Live Mode'}</span>
        </button>

        <div className={`status-pill ${connected ? 'connected' : 'offline'}`} title={connected ? 'Connected to FastAPI backend' : 'Backend offline or reconnecting'}>
          <span className="indicator" />
          <span>{connected ? 'LIVE API' : 'STANDALONE'}</span>
        </div>

        <button
          className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          title="Toggle 5s automatic polling"
        >
          ↻ {autoRefresh ? '5s' : 'Paused'}
        </button>

        <button className="manual-refresh" onClick={triggerRefresh} title="Manual Refresh">
          🔄
        </button>

        <button className="primary import-trigger" onClick={onOpenImport}>
          ＋ Ingest Data
        </button>
      </div>
    </header>
  );
}
