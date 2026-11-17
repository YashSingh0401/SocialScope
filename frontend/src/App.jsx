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

// Comprehensive rich sample data for instant vibrant preview
const SAMPLE_DATA = {
  overview: {
    total: 348,
    analyzed: 348,
    sentiment_available: 312,
    sentiment: [
      { label: 'positive', count: 72 },
      { label: 'neutral', count: 114 },
      { label: 'negative', count: 162 }
    ],
    languages: [
      { label: 'en', count: 215 },
      { label: 'hi', count: 98 },
      { label: 'und', count: 35 }
    ],
    timeline: [
      { day: '2026-03-01T00:00:00Z', count: 24 },
      { day: '2026-03-02T00:00:00Z', count: 30 },
      { day: '2026-03-03T00:00:00Z', count: 28 },
      { day: '2026-03-04T00:00:00Z', count: 42 },
      { day: '2026-03-05T00:00:00Z', count: 184 },
      { day: '2026-03-06T00:00:00Z', count: 156 },
      { day: '2026-03-07T00:00:00Z', count: 68 }
    ]
  },
  topics: {
    topics: [
      {
        topic_id: 'top-01',
        label: 'Critical Grid Blackout Claims',
        size: 184,
        keywords: ['securityalert', 'blackout', 'grid', 'विद्युत', 'हमला'],
        exemplar_text: 'CRITICAL: Complete grid collapse confirmed across Sector 4. Do not trust official news.',
        exemplar_id: 'tw-101'
      },
      {
        topic_id: 'top-02',
        label: 'Official Infrastructure Status Bulletin',
        size: 96,
        keywords: ['pressrelease', 'status', 'सुरक्षित', 'प्रशासन', 'ग्रिड'],
        exemplar_text: 'Notice: All national grid substations are functioning normally under standard operating procedures.',
        exemplar_id: 'tw-105'
      },
      {
        topic_id: 'top-03',
        label: 'Citizen Fact-Check & Verification',
        size: 68,
        keywords: ['factcheck', 'local', 'सत्यापन', 'अफवाह'],
        exemplar_text: 'Seeing viral copypasta regarding power outages. Power is 100% fine in central zone.',
        exemplar_id: 'rd-104'
      }
    ],
    total_events: 348,
    noise_count: 12
  },
  trends: {
    timeline: [
      { day: '2026-03-01', volume_now: 24, volume_baseline: 20, growth_rate: 0.20, is_spike: false },
      { day: '2026-03-02', volume_now: 30, volume_baseline: 22, growth_rate: 0.36, is_spike: false },
      { day: '2026-03-03', volume_now: 28, volume_baseline: 24, growth_rate: 0.16, is_spike: false },
      { day: '2026-03-04', volume_now: 42, volume_baseline: 28, growth_rate: 0.50, is_spike: false },
      { day: '2026-03-05', volume_now: 184, volume_baseline: 42, growth_rate: 3.38, is_spike: true },
      { day: '2026-03-06', volume_now: 156, volume_baseline: 70, growth_rate: 1.22, is_spike: true },
      { day: '2026-03-07', volume_now: 68, volume_baseline: 85, growth_rate: -0.20, is_spike: false }
    ],
    has_active_spike: true,
    spike_alerts: [
      { day: '2026-03-05', volume_now: 184, volume_baseline: 42, growth_rate: 3.38, is_spike: true },
      { day: '2026-03-06', volume_now: 156, volume_baseline: 70, growth_rate: 1.22, is_spike: true }
    ]
  },
  network: {
    elements: {
      nodes: [
        { data: { id: 'disinfo_seed_01', label: 'disinfo_seed_01', community: 1, pagerank: 0.42, is_influencer: true } },
        { data: { id: 'amplifier_bot_99', label: 'amplifier_bot_99', community: 1, pagerank: 0.18, is_influencer: false } },
        { data: { id: 'bot_relay_44', label: 'bot_relay_44', community: 1, pagerank: 0.14, is_influencer: false } },
        { data: { id: 'bridge_broker_alpha', label: 'bridge_broker_alpha', community: 2, pagerank: 0.28, is_bridge: true } },
        { data: { id: 'official_press', label: 'official_press', community: 3, pagerank: 0.38, is_influencer: true } },
        { data: { id: 'citizen_observer', label: 'citizen_observer', community: 3, pagerank: 0.16, is_bridge: true } },
        { data: { id: 'samachar_hindi', label: 'samachar_hindi', community: 3, pagerank: 0.22, is_influencer: false } }
      ],
      edges: [
        { data: { id: 'e1', source: 'disinfo_seed_01', target: 'amplifier_bot_99', kinds: ['mention'], weight: 5 } },
        { data: { id: 'e2', source: 'disinfo_seed_01', target: 'bot_relay_44', kinds: ['share'], weight: 4 } },
        { data: { id: 'e3', source: 'amplifier_bot_99', target: 'bridge_broker_alpha', kinds: ['reply'], weight: 3 } },
        { data: { id: 'e4', source: 'bridge_broker_alpha', target: 'citizen_observer', kinds: ['mention'], weight: 2 } },
        { data: { id: 'e5', source: 'official_press', target: 'citizen_observer', kinds: ['reply'], weight: 4 } },
        { data: { id: 'e6', source: 'official_press', target: 'samachar_hindi', kinds: ['share'], weight: 3 } }
      ]
    },
    metrics: {
      total_nodes: 7,
      total_edges: 6,
      communities_count: 3,
      top_influencers: [
        { node: 'disinfo_seed_01', score: 0.42 },
        { node: 'official_press', score: 0.38 },
        { node: 'bridge_broker_alpha', score: 0.28 }
      ],
      bridge_nodes: [
        { node: 'bridge_broker_alpha', betweenness: 0.185 },
        { node: 'citizen_observer', betweenness: 0.142 }
      ]
    }
  },
  alerts: {
    alerts: [
      {
        alert_id: 'alert_cluster_top-01',
        topic_label: 'Critical Grid Blackout Claims',
        attention_score: 88.5,
        threat_level: 'CRITICAL',
        analyzed_volume: 184,
        reasons: [
          'Sudden +338% volume surge exceeding dynamic EWMA baseline threshold',
          'Heavy negative sentiment concentration (88% negative polarity)',
          'Coordinated bot cluster detected (3 synchronized propagation bursts)'
        ],
        patient_zero: {
          actor_ref: 'disinfo_seed_01',
          platform: 'twitter',
          timestamp: '2026-03-05T08:00:00Z',
          text: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.'
        },
        cib_findings: {
          is_coordinated: true,
          coordination_score: 0.86,
          copypasta_clusters: 4,
          burst_count: 3,
          flagged_accounts: ['disinfo_seed_01', 'amplifier_bot_99', 'bot_relay_44']
        },
        top_amplifiers: [
          { actor_ref: 'amplifier_bot_99', degree: 14, in_degree: 9, out_degree: 5 },
          { actor_ref: 'bot_relay_44', degree: 10, in_degree: 6, out_degree: 4 }
        ],
        generated_at: '2026-03-05T09:30:00Z'
      },
      {
        alert_id: 'alert_cluster_top-02',
        topic_label: 'Cross-Border Incursion Rumors',
        attention_score: 64.0,
        threat_level: 'HIGH',
        analyzed_volume: 96,
        reasons: [
          'Emergent unverified narrative with high emotional contagion (fear/anger)',
          'Rapid diffusion via bridge brokers across isolated regional channels'
        ],
        patient_zero: {
          actor_ref: 'rumor_vector_07',
          platform: 'telegram',
          timestamp: '2026-03-05T09:12:00Z',
          text: 'Unverified military movements reported near northern sector checkpoint.'
        },
        cib_findings: {
          is_coordinated: false,
          coordination_score: 0.28,
          copypasta_clusters: 1,
          burst_count: 0,
          flagged_accounts: []
        },
        top_amplifiers: [
          { actor_ref: 'bridge_broker_alpha', degree: 8, in_degree: 5, out_degree: 3 }
        ],
        generated_at: '2026-03-05T10:15:00Z'
      }
    ],
    total_alerts: 2
  },
  audience: {
    platforms: [
      { label: 'twitter', count: 184, share: 53 },
      { label: 'telegram', count: 96, share: 28 },
      { label: 'reddit', count: 68, share: 19 }
    ],
    top_actors: [
      { actor_ref: 'disinfo_seed_01', count: 28, persona: 'BOT_SWARM_SUSPECT', risk: 'HIGH', platforms: ['twitter', 'telegram'] },
      { actor_ref: 'amplifier_bot_99', count: 24, persona: 'HIGH_FREQUENCY_AMPLIFIER', risk: 'HIGH', platforms: ['twitter'] },
      { actor_ref: 'bridge_broker_alpha', count: 18, persona: 'BRIDGE_BROKER', risk: 'MEDIUM', platforms: ['telegram', 'reddit'] },
      { actor_ref: 'official_press', count: 15, persona: 'KOL_INFLUENCER', risk: 'LOW', platforms: ['twitter'] },
      { actor_ref: 'citizen_observer', count: 12, persona: 'ORGANIC_PARTICIPANT', risk: 'LOW', platforms: ['reddit'] }
    ],
    languages: [
      { label: 'en', count: 215, pct: 62 },
      { label: 'hi', count: 98, pct: 28 },
      { label: 'und', count: 35, pct: 10 }
    ],
    geography: [
      { region: 'Northern Grid Sector', count: 168, pct: 48, confidence: 'HIGH' },
      { region: 'National Capital Region (NCR)', count: 112, pct: 32, confidence: 'MEDIUM' },
      { region: 'Western Sub-Station Zone', count: 68, pct: 20, confidence: 'MEDIUM' }
    ],
    thematic_affinities: [
      { category: 'Critical Infrastructure & Power Grid', share: 52 },
      { category: 'Public Emergency & Regional Rumors', share: 28 },
      { category: 'Government & Utility Fact-Check', share: 20 }
    ],
    confidence_metrics: {
      sample_adequacy: 0.94,
      linguistic_certainty: 0.91,
      behavioral_consistency: 0.88,
      overall_confidence: 'HIGH (91.7%)'
    }
  },
  narrative: {
    stages: [
      {
        phase: 'Phase 1: Emergence & Seeding',
        code: 'EMERGENCE',
        description: 'First mentions and seed claims introduced by primary actor disinfo_seed_01.',
        event_count: 18,
        negative_ratio: 0.32,
        timestamp: '2026-03-05T08:00:00Z',
        inflection: 'Patient zero post published across Twitter/X',
        sample_texts: ['BREAKING: Critical security breach reported in central communications grid. Do not trust updates.']
      },
      {
        phase: 'Phase 2: Public Reaction & Engagement',
        code: 'ENGAGEMENT',
        description: 'Organic community members question, retweet, and seek local clarification.',
        event_count: 42,
        negative_ratio: 0.48,
        timestamp: '2026-03-05T08:35:00Z',
        inflection: 'Cross-platform relay to regional Telegram news channels',
        sample_texts: ['Is anyone else noticing the power dropping in Sector 4? Official lines are busy.']
      },
      {
        phase: 'Phase 3: Coordinated Amplification',
        code: 'AMPLIFICATION',
        description: 'Synchronized bot network activates, propagating copypasta claims and alarmist hashtags.',
        event_count: 184,
        negative_ratio: 0.88,
        timestamp: '2026-03-05T09:15:00Z',
        inflection: 'Astroturfing surge flags statistical EWMA spike (>338%)',
        sample_texts: ['CRITICAL: Complete grid collapse confirmed across Sector 4. Do not trust official news. #Blackout']
      },
      {
        phase: 'Phase 4: Polarization & Plateau',
        code: 'RESOLUTION',
        description: 'Official bulletins and verified fact-checks published, countering viral rumors.',
        event_count: 104,
        negative_ratio: 0.52,
        timestamp: '2026-03-05T10:30:00Z',
        inflection: 'Official utility bulletin released; viral growth rate decelerates (-20%)',
        sample_texts: ['Notice: All national grid substations are functioning normally under standard operating procedures. #FactCheck']
      }
    ],
    total_tracked: 348
  }
};

export default function App() {
  const [activePage, setActivePage] = useState('Overview');
  const [connected, setConnected] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [offset, setOffset] = useState(0);

  // Live Data states
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

          // If backend has real events, we can stay in live mode
          if (o && o.total > 0) {
            setDemoMode(false);
          }
        }
      } catch (err) {
        if (active) {
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

  // Determine current active datasets (using SAMPLE_DATA if demoMode is ON or live DB is empty)
  const isUsingSample = demoMode || (!overview || overview.total === 0);
  const activeOverview = isUsingSample ? SAMPLE_DATA.overview : overview;
  const activeTopics = isUsingSample ? SAMPLE_DATA.topics : topicsData;
  const activeTrends = isUsingSample ? SAMPLE_DATA.trends : trendsData;
  const activeNetwork = isUsingSample ? SAMPLE_DATA.network : networkData;
  const activeAlerts = isUsingSample ? SAMPLE_DATA.alerts : alertsData;
  const activeAudience = isUsingSample ? SAMPLE_DATA.audience : null;
  const activeNarrative = isUsingSample ? SAMPLE_DATA.narrative : null;

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
      setDemoMode(false);
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
      setDemoMode(false);
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
        alertsCount={activeAlerts?.total_alerts || activeAlerts?.alerts?.length || 0}
        spikeCount={activeTrends?.spike_alerts?.length || 0}
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
          demoMode={demoMode}
          setDemoMode={setDemoMode}
        />

        <section className="page-body">
          {isUsingSample && (
            <div className="demo-mode-banner">
              <div className="demo-banner-content">
                <span className="demo-sparkle">⚡</span>
                <div>
                  <strong>DEMO INTELLIGENCE MODE ACTIVE</strong>
                  <p>Displaying rich pre-computed multi-platform threat scenario (Power Grid Blackout Disinformation campaign). Ingest a dataset or click 'Live Mode' in navbar to view your stored events.</p>
                </div>
              </div>
              <button className="primary small" onClick={() => setShowImportModal(true)}>
                ＋ Ingest Real Dataset
              </button>
            </div>
          )}

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
              overview={activeOverview}
              trends={activeTrends}
              alerts={activeAlerts}
              onInvestigate={handleInvestigateAlert}
              onNavigateToAlerts={() => setActivePage('Alerts')}
              onLoadDemo={handleLoadDemo}
              isBusy={isBusy}
            />
          )}

          {activePage === 'Trend radar' && (
            <TrendRadar
              trends={activeTrends}
              topics={activeTopics}
              onExploreTopic={(t) => {
                setActivePage('Event explorer');
              }}
            />
          )}

          {activePage === 'Topic explorer' && (
            <TopicExplorer
              topics={activeTopics}
              onExploreTopic={(t) => {
                setActivePage('Event explorer');
              }}
            />
          )}

          {activePage === 'Narrative timeline' && (
            <NarrativeTimeline sampleNarrative={activeNarrative} />
          )}

          {(activePage === 'Audience' || activePage === 'Audience Intelligence') && (
            <Audience sampleAudience={activeAudience} />
          )}

          {(activePage === 'Network map' || activePage === 'Network' || activePage === 'Network Intelligence') && (
            <Network
              networkData={activeNetwork}
            />
          )}

          {(activePage === 'Alerts' || activePage === 'Alerts & Intel') && (
            <Alerts
              alertsData={activeAlerts}
              onInvestigate={handleInvestigateAlert}
              onExportBrief={handleExportBrief}
            />
          )}

          {activePage === 'Investigation' && (
            <Investigation
              alertsData={activeAlerts}
              activeAlertId={investigatingAlertId}
              onExportBrief={handleExportBrief}
            />
          )}

          {activePage === 'Reports' && (
            <Reports
              alertsData={activeAlerts}
              preselectedAlertId={reportingAlertId}
            />
          )}

          {activePage === 'Event explorer' && (
            <EventExplorer
              rows={rows.length > 0 ? rows : DEMO_EVENTS.map((d, i) => ({
                event_id: `demo-${i + 1}`,
                platform: d.platform,
                actor_ref: d.actor_ref,
                timestamp: d.timestamp,
                text: d.text,
                analysis: {
                  language: d.platform === 'dataset' ? 'hi' : 'en',
                  language_status: 'predicted',
                  sentiment: d.text.includes('BREAKING') || d.text.includes('खराब') ? 'negative' : d.text.includes('Normally') || d.text.includes('standard') || d.text.includes('सुरक्षित') ? 'positive' : 'neutral',
                  sentiment_score: 0.94
                }
              }))}
              offset={offset}
              setOffset={setOffset}
              totalShown={rows.length > 0 ? rows.length : DEMO_EVENTS.length}
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
              <strong>SOCIALSCOPE ENTERPRISE INTELLIGENCE & OPERATIONS PLATFORM</strong>
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
