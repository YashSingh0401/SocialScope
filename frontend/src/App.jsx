import React, { useState, useEffect } from 'react';
import { useFilters } from './context/FilterContext';
import { api, DEMO_EVENTS } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';

// Pages
import Overview from './pages/Overview';
import TrendRadar from './pages/TrendRadar';
import TopicExplorer from './pages/TopicExplorer';
import NarrativeTimeline from './pages/NarrativeTimeline';
import Audience from './pages/Audience';
import Network from './pages/Network';
import Alerts from './pages/Alerts';
import Investigation from './pages/Investigation';
import Reports from './pages/Reports';
import EventExplorer from './pages/EventExplorer';
import ReplayStudio from './pages/ReplayStudio';

export default function App() {
  const [activePage, setActivePage] = useState('Overview');
  const [connected, setConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [offset, setOffset] = useState(0);

  // Data states
  const [overview, setOverview] = useState(null);
  const [rows, setRows] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [topicsData, setTopicsData] = useState({ topics: [], total_events: 0, noise_count: 0 });
  const [trendsData, setTrendsData] = useState({ timeline: [], spike_alerts: [] });
  const [networkData, setNetworkData] = useState({ elements: { nodes: [], edges: [] }, metrics: {} });
  const [alertsData, setAlertsData] = useState({ alerts: [], total_alerts: 0 });

  // Navigation memory for drilldowns
  const [investigatingAlertId, setInvestigatingAlertId] = useState(null);
  const [reportingAlertId, setReportingAlertId] = useState(null);

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState('import');
  const [importDatasetName, setImportDatasetName] = useState('surveillance-sample');
  const [importSpeed, setImportSpeed] = useState(60);
  const [importJsonText, setImportJsonText] = useState('');

  const { queryString, refreshKey } = useFilters();

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [o, e, j, top, tr, net, alt] = await Promise.all([
          api.getOverview(queryString).catch(() => ({ total: 0, analyzed: 0, sentiment_available: 0, sentiment: [], languages: [], timeline: [] })),
          api.getEvents(queryString, 20, offset).catch(() => ({ items: [] })),
          api.getReplays().catch(() => ({ items: [] })),
          api.getTopics().catch(() => ({ topics: [], total_events: 0, noise_count: 0 })),
          api.getTrends().catch(() => ({ timeline: [], spike_alerts: [] })),
          api.getNetwork().catch(() => ({ elements: { nodes: [], edges: [] }, metrics: {} })),
          api.getAlerts().catch(() => ({ alerts: [], total_alerts: 0 }))
        ]);

        if (active) {
          setOverview(o);
          setRows(e.items || []);
          setJobs(j.items || []);
          setTopicsData(top);
          setTrendsData(tr);
          setNetworkData(net);
          setAlertsData(alt);
          setConnected(true);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error communicating with surveillance backend.');
          setConnected(false);
        }
      }
    }

    loadData();

    if (!autoRefresh) return () => { active = false; };

    const timer = setInterval(loadData, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [queryString, offset, refreshKey, autoRefresh]);

  async function handleAction(fn) {
    setIsBusy(true);
    setNotice('');
    try {
      const msg = await fn();
      setNotice(msg || 'Action completed successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLoadDemo() {
    await handleAction(async () => {
      const res = await api.importEvents({
        dataset_name: 'synthetic NLP demo',
        events: DEMO_EVENTS
      });
      return `Loaded synthetic demo: ${res.inserted} inserted, ${res.duplicates} existing.`;
    });
  }

  async function handleSubmitImport() {
    await handleAction(async () => {
      let parsed;
      try {
        parsed = JSON.parse(importJsonText);
      } catch {
        throw new Error('Invalid JSON format. Please supply a valid JSON array.');
      }
      if (!Array.isArray(parsed)) {
        throw new Error('Events must be provided as a JSON array.');
      }

      const res = importMode === 'import'
        ? await api.importEvents({ dataset_name: importDatasetName, events: parsed })
        : await api.createReplay({ dataset_name: importDatasetName, events: parsed, speed: Number(importSpeed) });

      setShowImportModal(false);
      setImportJsonText('');
      return importMode === 'import'
        ? `Dataset imported: ${res.inserted} inserted, ${res.duplicates} duplicates, ${res.conflicts} conflicts.`
        : `Replay queued. The worker will replay events at ${importSpeed}× playback speed.`;
    });
  }

  function handleInvestigateAlert(alertItem) {
    setInvestigatingAlertId(alertItem.alert_id);
    setActivePage('Investigation');
  }

  function handleExportBrief(alertItem) {
    setReportingAlertId(alertItem.alert_id);
    setActivePage('Reports');
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        alertsCount={alertsData?.total_alerts || alertsData?.alerts?.length || 0}
        spikeCount={trendsData?.spike_alerts?.length || 0}
      />

      <main className="main-content">
        <Navbar
          activePage={activePage}
          connected={connected}
          onOpenImport={() => {
            setImportMode('import');
            setShowImportModal(true);
          }}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
        />

        <section className="page-body">
          {error && (
            <div className="alert-banner error" role="alert">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')}>✕</button>
            </div>
          )}

          {notice && (
            <div className="alert-banner notice" role="status">
              <span>✓ {notice}</span>
              <button onClick={() => setNotice('')}>✕</button>
            </div>
          )}

          {activePage === 'Overview' && (
            <Overview
              overview={overview}
              trends={trendsData}
              alerts={alertsData}
              onLoadDemo={handleLoadDemo}
              isBusy={isBusy}
            />
          )}

          {activePage === 'Trend radar' && (
            <TrendRadar
              trends={trendsData}
              topics={topicsData}
            />
          )}

          {activePage === 'Topic explorer' && (
            <TopicExplorer
              topics={topicsData}
              onExploreTopic={(t) => {
                setActivePage('Event explorer');
              }}
            />
          )}

          {activePage === 'Narrative timeline' && (
            <NarrativeTimeline />
          )}

          {activePage === 'Audience' && (
            <Audience />
          )}

          {activePage === 'Network map' && (
            <Network
              networkData={networkData}
            />
          )}

          {activePage === 'Alerts & Intel' && (
            <Alerts
              alertsData={alertsData}
              onInvestigate={handleInvestigateAlert}
              onExportBrief={handleExportBrief}
            />
          )}

          {activePage === 'Investigation' && (
            <Investigation
              alertsData={alertsData}
              activeAlertId={investigatingAlertId}
              onExportBrief={handleExportBrief}
            />
          )}

          {activePage === 'Reports' && (
            <Reports
              alertsData={alertsData}
              preselectedAlertId={reportingAlertId}
            />
          )}

          {activePage === 'Event explorer' && (
            <EventExplorer
              rows={rows}
              offset={offset}
              setOffset={setOffset}
              totalShown={rows.length}
            />
          )}

          {activePage === 'Replay studio' && (
            <ReplayStudio
              jobs={jobs}
              onOpenCreateReplay={() => {
                setImportMode('replay');
                setShowImportModal(true);
              }}
              onAction={handleAction}
            />
          )}

          <footer className="app-footer">
            <div className="footer-content">
              <strong>SOCIALSCOPE NTRO DEFENSE PLATFORM</strong>
              <p>
                Strict explainability protocol: Model outputs reflect probabilistic inferences, not verified ground truth.
                All algorithmic attribution flags must be cross-verified through human analyst adjudication.
              </p>
            </div>
          </footer>
        </section>
      </main>

      {/* Dataset Ingestion & Replay Modal */}
      <Modal
        title={importMode === 'import' ? 'Ingest Intelligence Dataset' : 'Configure Historical Replay Stream'}
        subtitle="Canonical JSON format with platform, timestamp, and actor metadata"
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        footer={
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setImportJsonText(JSON.stringify(DEMO_EVENTS, null, 2));
                setImportDatasetName('synthetic-cib-scenario');
              }}
            >
              Fill Synthetic Demo
            </button>
            <button
              className="primary"
              disabled={isBusy || !importJsonText.trim() || !importDatasetName.trim()}
              onClick={handleSubmitImport}
            >
              {isBusy ? 'Processing…' : importMode === 'import' ? 'Ingest Events' : 'Start Replay Stream'}
            </button>
          </div>
        }
      >
        <div className="modal-form">
          <div className="form-group">
            <label>Dataset Identifier</label>
            <input
              type="text"
              value={importDatasetName}
              onChange={(e) => setImportDatasetName(e.target.value)}
              placeholder="e.g. twitter-election-burst-2026"
            />
          </div>

          <div className="form-group">
            <label>Processing Mode</label>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
            >
              <option value="import">Direct Import (Immediate Storage & Analysis)</option>
              <option value="replay">Historical Replay (Simulate Real-Time Influx)</option>
            </select>
          </div>

          {importMode === 'replay' && (
            <div className="form-group">
              <label>Replay Speed Multiplier</label>
              <input
                type="number"
                min="0.1"
                max="1000000"
                value={importSpeed}
                onChange={(e) => setImportSpeed(e.target.value)}
              />
              <small className="field-hint">e.g. 60 = 1 minute of historical time unfolds in 1 second.</small>
            </div>
          )}

          <div className="form-group">
            <label>JSON Event Array</label>
            <textarea
              rows="10"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='[{"platform":"twitter","source_id":"post-01","actor_ref":"user_x","timestamp":"2026-03-01T10:00:00Z","text":"Your post content"}]'
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
