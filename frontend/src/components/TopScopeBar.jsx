import React from 'react';
import { useFilters } from '../context/FilterContext';

export default function TopScopeBar({ isConnected, onOpenSources }) {
  const {
    dataset,
    setDataset,
    mode,
    setMode,
    dateRange,
    setDateRange,
    language,
    setLanguage,
    timezone,
    setTimezone,
    refreshKey,
    triggerRefresh
  } = useFilters();

  return (
    <header className="top-scope-bar" role="banner">
      <div className="scope-selectors">
        {/* Dataset Selector */}
        <div className="scope-control">
          <label htmlFor="dataset-select">Dataset</label>
          <select
            id="dataset-select"
            className="scope-select"
            value={dataset}
            onChange={(e) => setDataset(e.target.value)}
          >
            <option value="power-grid-campaign-2026">power-grid-campaign-2026 (348 records)</option>
            <option value="cross-border-rumor-sweep">cross-border-rumor-sweep (184 records)</option>
            <option value="regional-election-seed-probe">regional-election-seed-probe (92 records)</option>
          </select>
        </div>

        {/* Mode Toggle: Replay vs Live */}
        <div className="scope-control">
          <label>Mode</label>
          <div className="mode-toggle-group" role="radiogroup" aria-label="Stream Mode">
            <button
              type="button"
              className={`mode-toggle-btn ${mode === 'replay' ? 'active' : ''}`}
              onClick={() => setMode('replay')}
              aria-checked={mode === 'replay'}
              role="radio"
            >
              Replay
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
              aria-checked={mode === 'live'}
              role="radio"
            >
              Live
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="scope-control">
          <label htmlFor="daterange-select">Dates</label>
          <select
            id="daterange-select"
            className="scope-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-24-hours">Last 24 hours</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="custom">Custom window</option>
          </select>
        </div>

        {/* Language Selector */}
        <div className="scope-control">
          <label htmlFor="language-select">Lang</label>
          <select
            id="language-select"
            className="scope-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="all">All languages</option>
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
            <option value="und">Undetermined (und)</option>
          </select>
        </div>

        {/* Timezone Selector */}
        <div className="scope-control">
          <label htmlFor="tz-select">TZ</label>
          <select
            id="tz-select"
            className="scope-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            <option value="UTC">UTC (+00:00)</option>
            <option value="Local">Local (IST +05:30)</option>
          </select>
        </div>
      </div>

      <div className="top-scope-actions">
        <span className="status-badge-live" title="Backend health">
          <span className="pulse-indicator" />
          {isConnected ? 'API Live' : 'Offline / Standalone'}
        </span>

        <button
          className="btn-secondary btn-small"
          onClick={triggerRefresh}
          title="Refresh current data view"
          aria-label="Refresh view"
        >
          ↻ Refresh
        </button>

        <button
          className="btn-primary btn-small"
          onClick={onOpenSources}
          title="Manage replay datasets and connectors"
        >
          Datasets & Connectors
        </button>
      </div>
    </header>
  );
}
