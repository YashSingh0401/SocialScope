import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function Reports({ onNavigate }) {
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    attribution: true,
    cib: true,
    amplifiers: true,
    verdict: true,
    evidenceTable: true
  });

  const [exportStatus, setExportStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const datasetVersion = 'power-grid-campaign-2026 (v0.4.0)';
  const analysisWindow = '2026-03-01T00:00:00Z to 2026-03-07T23:59:59Z';
  const reportGenerationTime = '2026-03-07 14:35:20 UTC';
  const includedEventsCount = 348;
  const evidenceLinksCount = 18;

  const sectionList = [
    { id: 'summary', name: '1. Executive Summary', scope: 'High-level threat assessment', count: 1 },
    { id: 'attribution', name: '2. Patient Zero & Origin Attribution', scope: 'Origin node disinfo_seed_01', count: 4 },
    { id: 'cib', name: '3. Coordinated Inauthentic Behavior (CIB)', scope: '4 copypasta clusters, 3 bursts', count: 6 },
    { id: 'amplifiers', name: '4. Amplifiers & Bridge Nodes', scope: 'Top 5 graph actors by betweenness', count: 5 },
    { id: 'verdict', name: '5. Analyst Decision & Audit Trail', scope: 'Adjudication by Lead Analyst', count: 2 },
    { id: 'evidenceTable', name: '6. Supporting Records Table', scope: 'Cross-platform canonical records', count: 18 }
  ];

  const activeSectionsCount = Object.values(selectedSections).filter(Boolean).length;

  const toggleSection = (id) => {
    setSelectedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setExportStatus('Compiling print-ready document and pinning dataset metadata...');
    setTimeout(() => {
      setIsExporting(false);
      window.print();
      setExportStatus('Export PDF ready: Document opened in browser print dialog.');
    }, 600);
  };

  const evidenceRows = sectionList.map((sec) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{sec.name}</strong>,
      <span key="2">{sec.scope}</span>,
      <span key="3">
        <strong style={{ color: selectedSections[sec.id] ? '#15803d' : '#94a3b8' }}>
          {selectedSections[sec.id] ? `${sec.count} items included` : 'Excluded from report'}
        </strong>
      </span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Report preview (Paginated Document)</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Pinned Dataset Version: <code>{datasetVersion}</code>
          </span>
        </div>
        <button
          className="btn-primary"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? 'Preparing PDF...' : '📄 Export PDF / Print'}
        </button>
      </div>

      {exportStatus && (
        <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', fontSize: '12px', color: '#047857', marginBottom: '12px' }}>
          ✓ {exportStatus}
        </div>
      )}

      {/* Styled Printable Paginated Preview Container */}
      <div
        className="printable-report"
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-border-strong)',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid var(--color-navy-scope)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-teal)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              SocialScope Intelligence Brief
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Report ID: <code>REP-2026-GRID-01</code>
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--color-navy-heading)', margin: '8px 0 4px 0' }}>
            Threat Investigation: Critical Grid Blackout Disinformation Campaign
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11.5px', color: '#475569', marginTop: '12px' }}>
            <div>
              <strong>Report Generated:</strong> {reportGenerationTime}
            </div>
            <div>
              <strong>Event Observation Window:</strong> 2026-03-01 to 2026-03-07
            </div>
            <div>
              <strong>Classification:</strong> Internal Forensic Use Only
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        {selectedSections.summary && (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-navy-heading)', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              1. Executive Summary
            </h3>
            <p style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#334155' }}>
              Between March 1 and March 7, 2026, algorithmic monitoring detected an acute +338% volume surge over dynamic EWMA baselines regarding alleged power grid failure across northern district substations. Forensic analysis confirms an orchestrated coordinated inauthentic behavior (CIB) operation initiated on X (Twitter) by actor <code>disinfo_seed_01</code> and amplified simultaneously across Telegram regional channels.
            </p>
          </div>
        )}

        {/* Section 2: Origin Attribution */}
        {selectedSections.attribution && (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-navy-heading)', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              2. Origin & Patient Zero Attribution
            </h3>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderLeft: '4px solid var(--color-teal)', borderRadius: '2px', fontSize: '12.5px' }}>
              <div><strong>Seed Actor:</strong> <code>disinfo_seed_01</code> (X/Twitter)</div>
              <div><strong>First Timestamp:</strong> 2026-03-05 08:00:00 UTC</div>
              <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#1e293b' }}>
                "BREAKING: Critical security breach reported in central communications grid. Do not trust updates."
              </div>
            </div>
          </div>
        )}

        {/* Section 3: CIB Findings */}
        {selectedSections.cib && (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-navy-heading)', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              3. Coordinated Inauthentic Behavior Indicators
            </h3>
            <ul style={{ fontSize: '12.5px', color: '#334155', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li><strong>Copypasta Clusters:</strong> 4 distinct duplicate text clusters replicated verbatim across 184 posts.</li>
              <li><strong>Synchronized Relay Bursts:</strong> 3 propagation bursts occurring within 90 seconds of seed post across Telegram and X.</li>
              <li><strong>Language Alignment:</strong> Parallel dissemination in English and Hindi (हिंदी) to target regional demographic cohorts.</li>
            </ul>
          </div>
        )}

        {/* Section 4: Amplifiers */}
        {selectedSections.amplifiers && (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-navy-heading)', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              4. Key Amplifiers & Bridge Nodes
            </h3>
            <div style={{ fontSize: '12px', color: '#334155' }}>
              Primary relay node: <code>amplifier_bot_99</code> (Betweenness Centrality: 0.28, Degree: 14) connecting to bridge broker <code>bridge_broker_alpha</code>.
            </div>
          </div>
        )}

        {/* Section 5: Analyst Verdict */}
        {selectedSections.verdict && (
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-navy-heading)', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              5. Analyst Adjudication & Ground Truth Verification
            </h3>
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12.5px', color: '#166534' }}>
              <strong>Adjudication Verdict: CONFIRMED DISINFORMATION OPERATION</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                Ground truth telemetry verified through SCADA logs confirms operational stability across all regional transmission hubs. Official utility press release bulletin successfully released.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Included sections</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Check or uncheck sections to customize the generated export.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sectionList.map((sec) => (
          <label
            key={sec.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '5px',
              border: '1px solid var(--color-border)',
              background: selectedSections[sec.id] ? 'var(--color-teal-light)' : '#ffffff',
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
          >
            <input
              type="checkbox"
              checked={selectedSections[sec.id]}
              onChange={() => toggleSection(sec.id)}
            />
            <span style={{ fontWeight: 500, color: '#1e293b' }}>{sec.name}</span>
          </label>
        ))}
      </div>

      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
        <strong style={{ fontSize: '12px', color: '#142838' }}>Reproducibility Guarantee</strong>
        <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 0 0' }}>
          This export is cryptographically bound to dataset commit hash <code>git-rev:9a4f2c</code> and pipeline schema v0.4.
        </p>
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/reports</span>
          <span className="section-kicker">Threat Operations</span>
        </div>
        <h1 className="screen-title">Reports</h1>
        <p className="screen-question">How can I share a reproducible account of this investigation?</p>
      </header>

      <ScreenCard
        scopeFilters={['Investigation: Blackout Claims', `${activeSectionsCount} Sections Selected`, 'Last 7 Days']}
        metricCards={[
          { label: 'Included events', value: includedEventsCount, sub: 'Corpus in report' },
          { label: 'Evidence links', value: evidenceLinksCount, sub: 'Direct record citations' },
          { label: 'Sections', value: `${activeSectionsCount} / 6`, sub: 'Checklist configured' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Section', 'Scope', 'Evidence count']}
        evidenceRows={evidenceRows}
        evidenceTitle="Report Section Scope & Manifest"
      />
    </div>
  );
}
