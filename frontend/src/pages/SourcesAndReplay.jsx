import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function SourcesAndReplay({ onNavigate, onStartProcessing }) {
  const [selectedDatasetId, setSelectedDatasetId] = useState('ds-grid-01');
  const [activeTab, setActiveTab] = useState('datasets'); // 'datasets' or 'connectors'

  const datasets = [
    {
      id: 'ds-grid-01',
      name: 'power-grid-campaign-2026',
      coverage: '6 platforms (X, Telegram, Reddit, YouTube, Instagram, Facebook)',
      rowCount: 348,
      dateRange: '2026-03-01 to 2026-03-07 UTC',
      fields: ['timestamp', 'platform', 'actor_ref', 'text', 'interactions', 'language', 'sentiment'],
      lastUpdate: '2026-03-07 12:00 UTC',
      state: 'Ready',
      validation: 'PASSED (0 errors, 2 warning toponyms)',
      stages: [
        { name: '1. Ingestion & JSON Schema Validation', status: 'Complete (348 records)' },
        { name: '2. Canonical Schema Normalization', status: 'Complete (100%)' },
        { name: '3. ONNX Multilingual NER & Emotion Analysis', status: 'Complete (348 records)' },
        { name: '4. Network Topology & Louvain Partition', status: 'Complete (7 actors, 3 clusters)' },
        { name: '5. Dynamic EWMA Spike & CIB Detection', status: 'Complete (Attention Score: 88.5)' }
      ]
    },
    {
      id: 'ds-burst-02',
      name: 'cross-border-rumor-sweep',
      coverage: '3 platforms (Telegram, X, Reddit)',
      rowCount: 184,
      dateRange: '2026-03-04 to 2026-03-06 UTC',
      fields: ['timestamp', 'platform', 'actor_ref', 'text', 'interactions'],
      lastUpdate: '2026-03-06 19:00 UTC',
      state: 'Ready',
      validation: 'PASSED (0 errors)',
      stages: [
        { name: '1. Ingestion & JSON Schema Validation', status: 'Complete (184 records)' },
        { name: '2. Canonical Schema Normalization', status: 'Complete (100%)' },
        { name: '3. ONNX Multilingual NER & Emotion Analysis', status: 'Complete (184 records)' },
        { name: '4. Network Topology & Louvain Partition', status: 'Complete (2 clusters)' },
        { name: '5. Dynamic EWMA Spike & CIB Detection', status: 'Complete (Attention Score: 64.0)' }
      ]
    },
    {
      id: 'ds-election-03',
      name: 'regional-election-seed-probe',
      coverage: '3 platforms (X, YouTube, Facebook)',
      rowCount: 92,
      dateRange: '2026-03-06 to 2026-03-07 UTC',
      fields: ['timestamp', 'platform', 'actor_ref', 'text'],
      lastUpdate: '2026-03-07 09:15 UTC',
      state: 'Processing',
      validation: 'IN PROGRESS (85% parsed)',
      stages: [
        { name: '1. Ingestion & JSON Schema Validation', status: 'Complete (92 records)' },
        { name: '2. Canonical Schema Normalization', status: 'Complete (100%)' },
        { name: '3. ONNX Multilingual NER & Emotion Analysis', status: 'Running (85%)' },
        { name: '4. Network Topology & Louvain Partition', status: 'Pending' },
        { name: '5. Dynamic EWMA Spike & CIB Detection', status: 'Pending' }
      ]
    }
  ];

  const connectors = [
    { platform: 'Reddit', status: 'Active (Online)', auth: 'Zero-Auth / Public API', sources: '4 subreddits', rateLimit: '60 req/min', lastSync: '2 mins ago' },
    { platform: 'YouTube', status: 'Active (Online)', auth: 'Data API v3', sources: '8 channels', rateLimit: '10,000 units/day', lastSync: '4 mins ago' },
    { platform: 'Telegram', status: 'Active (Online)', auth: 'MTProto / Bot Gateway', sources: '12 public channels', rateLimit: 'Unlimited', lastSync: '1 min ago' },
    { platform: 'X (Twitter)', status: 'Active (Online)', auth: 'Enterprise V2 Stream', sources: 'Firehose filter', rateLimit: 'Active streaming', lastSync: '30s ago' },
    { platform: 'Instagram', status: 'Active (Online)', auth: 'Graph API', sources: '6 handles', rateLimit: '200 calls/hr', lastSync: '10 mins ago' },
    { platform: 'Facebook', status: 'Active (Online)', auth: 'Page Public Content Access', sources: '5 pages', rateLimit: '200 calls/hr', lastSync: '12 mins ago' }
  ];

  const rejectedRows = [
    { index: 14, dataset: 'power-grid-campaign-2026', platform: 'Telegram', reason: 'Invalid ISO timestamp format (missing timezone)', sample: 'Emergency broadcast 2026-03-05 08:30' },
    { index: 88, dataset: 'regional-election-seed-probe', platform: 'X (Twitter)', reason: 'Missing mandatory actor_ref identifier', sample: 'Unattributed retweeter null reference' }
  ];

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  const readyDatasetsCount = datasets.filter((d) => d.state === 'Ready').length;
  const processingJobsCount = 1;
  const rejectedRowsCount = rejectedRows.length;

  const evidenceRows = datasets.map((d) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{d.name}</strong>,
      <span key="2">{d.coverage} ({d.rowCount} records)</span>,
      <span key="3" className={`badge-status ${d.state === 'Ready' ? 'ready' : 'pending'}`}>
        {d.state.toUpperCase()} · Last sync {d.lastUpdate}
      </span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn-toggle-view ${activeTab === 'datasets' ? 'active' : ''}`}
            onClick={() => setActiveTab('datasets')}
          >
            Replay Datasets ({datasets.length})
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${activeTab === 'connectors' ? 'active' : ''}`}
            onClick={() => setActiveTab('connectors')}
          >
            Live Connectors ({connectors.length})
          </button>
        </div>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/overview')}
        >
          Open Overview with Selected Dataset →
        </button>
      </div>

      {activeTab === 'datasets' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {datasets.map((d) => {
            const isSelected = d.id === selectedDatasetId;
            return (
              <div
                key={d.id}
                className={`ranking-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDatasetId(d.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedDatasetId(d.id); }}
                style={{ borderLeft: isSelected ? '4px solid var(--color-teal)' : '1px solid var(--color-border)' }}
              >
                <div className="ranking-title-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="ranking-name" style={{ fontSize: '14px' }}>{d.name}</span>
                    <span className={`badge-status ${d.state === 'Ready' ? 'ready' : 'pending'}`}>{d.state}</span>
                  </div>
                  <span className="ranking-metric">{d.rowCount} records</span>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>
                  Coverage: <strong>{d.coverage}</strong> · Date Range: {d.dateRange}
                </div>

                <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px' }}>
                  Available fields: {d.fields.map((f, fIdx) => (
                    <code key={fIdx} style={{ margin: '0 3px', padding: '1px 4px', background: '#e2e8f0', borderRadius: '3px' }}>{f}</code>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {connectors.map((c, idx) => (
            <div key={idx} style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13.5px', color: '#142838' }}>{c.platform}</strong>
                <span className="badge-status ready">{c.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Auth: {c.auth}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Monitored: {c.sources}</div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px' }}>
                Rate Limit: {c.rateLimit} · Last Sync: {c.lastSync}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejected Rows Banner */}
      {rejectedRows.length > 0 && (
        <div style={{ marginTop: '20px', padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
          <strong style={{ fontSize: '12.5px', color: '#92400e' }}>
            ⚠️ Rejected Rows Flagged ({rejectedRows.length} items with explanation)
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {rejectedRows.map((r, idx) => (
              <div key={idx} style={{ fontSize: '12px', color: '#78350f' }}>
                • Row #{r.index} in <code>{r.dataset}</code> ({r.platform}): <strong>{r.reason}</strong>. Raw: <em>"{r.sample}"</em>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Job progress & validation</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Pipeline stages for <strong>{currentDataset.name}</strong>.
      </p>

      <div style={{ padding: '10px 12px', background: currentDataset.state === 'Ready' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${currentDataset.state === 'Ready' ? '#bbf7d0' : '#fde68a'}`, borderRadius: '4px', fontSize: '12px', marginBottom: '12px' }}>
        <strong>Validation Status:</strong> {currentDataset.validation}
      </div>

      <strong style={{ fontSize: '11.5px', color: '#142838', textTransform: 'uppercase' }}>Ingest & Enrichment Stages</strong>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        {currentDataset.stages.map((st, idx) => (
          <div key={idx} style={{ padding: '8px 10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px' }}>
            <div style={{ fontWeight: 600, color: '#142838' }}>{st.name}</div>
            <div style={{ color: st.status.startsWith('Complete') ? '#15803d' : '#b45309', fontWeight: 500, marginTop: '2px' }}>
              ✓ {st.status}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => onNavigate('/overview')}
        >
          Load Into Analytics Workspace
        </button>
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/sources</span>
          <span className="section-kicker">Data Pipelines</span>
        </div>
        <h1 className="screen-title">Sources and replay</h1>
        <p className="screen-question">Which data can I analyze, and has processing finished?</p>
      </header>

      <ScreenCard
        scopeFilters={['Historical Replay Mode', 'All 6 Connectors Authorized', 'Job Status: Active']}
        metricCards={[
          { label: 'Ready datasets', value: readyDatasetsCount, sub: 'Ingested & enriched' },
          { label: 'Processing jobs', value: processingJobsCount, sub: 'Streaming replays' },
          { label: 'Rejected rows', value: rejectedRowsCount, sub: 'Flagged with reasons' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Dataset', 'Coverage', 'Processing state']}
        evidenceRows={evidenceRows}
        evidenceTitle="Dataset Inventory Manifest"
      />
    </div>
  );
}
