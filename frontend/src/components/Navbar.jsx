import React from 'react';
import { useFilters } from '../context/FilterContext';

export default function Navbar({ activePage, connected, onOpenImport, autoRefresh, setAutoRefresh }) {
  const { search, setSearch, triggerRefresh } = useFilters();

  return (
    <header className="navbar">
      <div className="nav-left">
        <span className="breadcrumb">
          Workspace <span className="sep">/</span> <strong>{activePage}</strong>
        </span>
      </div>

      <div className="nav-center">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search keywords, actors, hashtags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className="nav-right">
        <div className={`status-pill ${connected ? 'connected' : 'offline'}`} title={connected ? 'Connected to FastAPI backend' : 'Backend offline or reconnecting'}>
          <span className="indicator" />
          <span>{connected ? 'LIVE API' : 'OFFLINE'}</span>
        </div>

        <button
          className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          title="Toggle 5s automatic polling"
        >
          ↻ {autoRefresh ? 'Auto (5s)' : 'Paused'}
        </button>

        <button className="manual-refresh" onClick={triggerRefresh} title="Manual Refresh">
          🔄
        </button>

        <button className="primary import-trigger" onClick={onOpenImport}>
          ＋ Import Data
        </button>
      </div>
    </header>
  );
}
