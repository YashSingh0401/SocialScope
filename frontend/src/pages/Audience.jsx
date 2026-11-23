import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function Audience({ onNavigate }) {
  const [selectedLang, setSelectedLang] = useState('all');

  const totalEvents = 348;
  const knownLanguageCount = 313; // 215 en + 98 hi
  const unknownLanguageCount = 35; // und
  const regionCoverage = '80% (NCR & Northern Grid)';

  const languages = [
    { code: 'en', label: 'English', count: 215, pct: '61.8%' },
    { code: 'hi', label: 'Hindi (हिंदी)', count: 98, pct: '28.2%' },
    { code: 'und', label: 'Undetermined / Noise', count: 35, pct: '10.0%' }
  ];

  const attributes = [
    { attribute: 'Language (ISO 639-1)', known: 313, unknown: 35, pct: '89.9%', note: 'langid calibrated confidence > 0.85' },
    { attribute: 'Platform Source', known: 348, unknown: 0, pct: '100%', note: 'Canonical ingest origin verified' },
    { attribute: 'Regional Geographic Focus', known: 280, unknown: 68, pct: '80.5%', note: 'Linguistic toponym NER extraction' },
    { attribute: 'Actor Persona Category', known: 242, unknown: 106, pct: '69.5%', note: 'Heuristic interaction graph classification' },
    { attribute: 'Demographic Age/Gender Cohort', known: 0, unknown: 348, pct: '0%', note: 'Suppressed: No defensible aggregate supplied in raw dataset' }
  ];

  const evidenceRows = attributes.map((att) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{att.attribute}</strong>,
      <span key="2" style={{ color: att.known > 0 ? '#15803d' : '#64748b', fontWeight: 600 }}>{att.known} ({att.pct})</span>,
      <span key="3" style={{ color: att.unknown > 0 ? '#b45309' : '#15803d' }}>{att.unknown} ({att.note})</span>
    ]
  }));

  const maxLangCount = Math.max(...languages.map((l) => l.count), 1);

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Language distribution (Observed)</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Click a language bar to isolate evidence. Unknown language events remain in the denominator.
          </span>
        </div>
      </div>

      <div className="chart-container" style={{ minHeight: '160px', height: '170px' }}>
        <div className="bar-chart-series" style={{ height: '140px' }}>
          {languages.map((lang, idx) => {
            const heightPct = Math.round((lang.count / maxLangCount) * 100);
            const isSelected = selectedLang === lang.code;
            return (
              <div
                key={idx}
                className={`bar-column ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedLang(isSelected ? 'all' : lang.code)}
                title={`${lang.label}: ${lang.count} events (${lang.pct})`}
              >
                <span className="bar-value-tooltip">{lang.count}</span>
                <div
                  className="bar-fill"
                  style={{
                    height: `${heightPct}%`,
                    background: lang.code === 'und' ? '#94a3b8' : isSelected ? 'var(--color-teal-dark)' : 'var(--color-teal)'
                  }}
                />
                <span className="bar-label">{lang.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Estimates Inferred Section */}
      <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h5 style={{ margin: 0, fontSize: '13px', color: '#142838', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Inferred Geographic Cohort Distribution
          </h5>
          <span className="badge-status ready">Approved Aggregate Method (Toponym NER)</span>
        </div>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
          Toponym entity clustering reveals regional concentration across northern power grid districts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Primary Hotspot</span>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#142838' }}>Sector 4 / Northern Grid</div>
            <small style={{ color: '#007a78', fontWeight: 600 }}>168 events (48.3%)</small>
          </div>
          <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Secondary District</span>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#142838' }}>National Capital Region (NCR)</div>
            <small style={{ color: '#007a78', fontWeight: 600 }}>112 events (32.2%)</small>
          </div>
          <div style={{ padding: '10px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Western Substations</span>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#142838' }}>Western Distribution Loop</div>
            <small style={{ color: '#007a78', fontWeight: 600 }}>68 events (19.5%)</small>
          </div>
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Attribute coverage</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Denominator audits and missing value transparency.
      </p>

      <div className="ranking-list">
        {attributes.map((att, idx) => (
          <div key={idx} className="ranking-item" style={{ cursor: 'default' }}>
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ fontSize: '12px' }}>{att.attribute}</span>
              <span className="ranking-metric" style={{ fontSize: '12px' }}>{att.pct}</span>
            </div>
            <div className="ranking-sub">
              Known: <strong>{att.known}</strong> / Unknown: <strong>{att.unknown}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {att.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '11.5px', color: '#92400e' }}>
        <strong>Defensible Privacy Protocol:</strong> Individual demographic profiling is suppressed. Only aggregate linguistic and toponym distributions are rendered.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/audience</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Audience</h1>
        <p className="screen-question">Which aggregate audience characteristics are represented in this discussion?</p>
      </header>

      <ScreenCard
        scopeFilters={['Critical Grid Blackout Claims', 'All Languages', 'Cross-Platform']}
        metricCards={[
          { label: 'Events in scope', value: totalEvents, sub: 'Total observation denominator' },
          { label: 'Known language', value: `${knownLanguageCount} (${Math.round((knownLanguageCount/totalEvents)*100)}%)`, sub: 'ISO language confidence > 0.85' },
          { label: 'Region coverage', value: regionCoverage, sub: 'Toponym geo-resolution' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Attribute', 'Known count', 'Unknown count']}
        evidenceRows={evidenceRows}
        evidenceTitle="Audience Attribute Coverage Evidence"
      />
    </div>
  );
}
