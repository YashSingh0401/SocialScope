import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function NarrativeTimeline({ onNavigate }) {
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);

  const phases = [
    {
      label: 'Phase 1: Emergence & Seeding',
      range: '2026-03-05 08:00 – 08:30 UTC',
      firstObserved: '2026-03-05 08:00:00 UTC',
      eventsCount: 18,
      excerpt: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.',
      actor: 'disinfo_seed_01',
      platform: 'x',
      inferred: false
    },
    {
      label: 'Phase 2: Public Reaction & Engagement',
      range: '2026-03-05 08:35 – 09:10 UTC',
      firstObserved: '2026-03-05 08:35:12 UTC',
      eventsCount: 42,
      excerpt: 'Is anyone else noticing the power dropping in Sector 4? Official phone lines are busy.',
      actor: 'citizen_observer',
      platform: 'reddit',
      inferred: false
    },
    {
      label: 'Phase 3: Coordinated Amplification',
      range: '2026-03-05 09:15 – 10:20 UTC',
      firstObserved: '2026-03-05 09:15:00 UTC',
      eventsCount: 184,
      excerpt: 'CRITICAL: Complete grid collapse confirmed across Sector 4. Do not trust official news. #Blackout',
      actor: 'amplifier_bot_99',
      platform: 'telegram',
      inferred: false
    },
    {
      label: 'Phase 4: Polarization & Plateau',
      range: '2026-03-05 10:30 – 14:00 UTC',
      firstObserved: '2026-03-05 10:30:00 UTC',
      eventsCount: 104,
      excerpt: 'Notice: All national grid substations are functioning normally under standard operating procedures. #FactCheck',
      actor: 'official_press',
      platform: 'x',
      inferred: true
    }
  ];

  const relatedTopics = [
    { name: 'Official Infrastructure Status Bulletin', similarity: '91% Cosine Similarity', relation: 'Direct counter-narrative rebuttal' },
    { name: 'Citizen Fact-Check & Verification', similarity: '84% Cosine Similarity', relation: 'Ground-truth observational reports' },
    { name: 'Cross-Border Incursion Rumors', similarity: '68% Cosine Similarity', relation: 'Possible thematic spillover' }
  ];

  const activePhase = phases[selectedPhaseIdx] || phases[0];

  const evidenceRows = phases.map((p, idx) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{p.label}</strong>,
      <span key="2">{p.firstObserved}</span>,
      <span key="3">
        <strong>{p.eventsCount} events</strong> ({p.platform.toUpperCase()}) — <em>"{p.excerpt.slice(0, 70)}…"</em>
        {p.inferred && <span className="platform-pill" style={{ marginLeft: '8px', background: '#fef3c7', color: '#92400e' }}>Possible relationship</span>}
      </span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <h4 className="section-headline">Phases in time order</h4>
        <button
          className="btn-secondary btn-small"
          onClick={() => onNavigate('/compare')}
        >
          Compare platforms in this period →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {phases.map((p, idx) => {
          const isSelected = selectedPhaseIdx === idx;
          return (
            <div
              key={idx}
              className={`ranking-item ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedPhaseIdx(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPhaseIdx(idx); }}
              style={{ borderLeft: isSelected ? '4px solid var(--color-teal)' : '1px solid var(--color-border)' }}
            >
              <div className="ranking-title-row">
                <span className="ranking-name" style={{ fontSize: '14px' }}>{p.label}</span>
                <span className="ranking-metric">{p.eventsCount} events</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                📅 <strong>{p.range}</strong> · Origin: <span className={`platform-pill ${p.platform}`}>{p.platform.toUpperCase()}</span>
                {p.inferred && <span style={{ marginLeft: '8px', color: '#b45309', fontWeight: 600 }}>[Possible Inferred Relationship]</span>}
              </div>
              <blockquote style={{ margin: 0, padding: '8px 12px', background: 'var(--color-bg-subtle)', borderRadius: '4px', fontStyle: 'italic', fontSize: '12.5px', color: '#1e293b' }}>
                "{p.excerpt}"
              </blockquote>
            </div>
          );
        })}
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Related topics</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Semantic similarity across vector embeddings (all-MiniLM-L6-v2).
      </p>

      <div className="ranking-list">
        {relatedTopics.map((rt, idx) => (
          <div key={idx} className="ranking-item">
            <div className="ranking-title-row">
              <span className="ranking-name">{rt.name}</span>
              <span className="ranking-metric" style={{ fontSize: '11.5px' }}>{rt.similarity}</span>
            </div>
            <div className="ranking-sub">{rt.relation}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
        <strong style={{ fontSize: '12px', color: '#142838' }}>Timeline Continuity Note</strong>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
          No data collection gaps detected between 08:00 and 14:00 UTC. Continuous ingest confirmed across 4 synchronized platforms.
        </p>
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/narratives</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Narrative Timeline</h1>
        <p className="screen-question">How did the discussion evolve, and when did related activity appear elsewhere?</p>
      </header>

      <ScreenCard
        scopeFilters={['Critical Grid Blackout Claims', 'All platforms', 'Hourly buckets']}
        metricCards={[
          { label: 'Phases', value: 4, sub: 'Temporal progression stages' },
          { label: 'Linked topics', value: 3, sub: 'Semantic vector links' },
          { label: 'Covered days', value: '1 day (7h burst)', sub: '2026-03-05' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Phase', 'First observed', 'Supporting events']}
        evidenceRows={evidenceRows}
        evidenceTitle="Narrative Phase Evidence"
      />
    </div>
  );
}
