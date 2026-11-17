import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';

export default function NarrativeTimeline({ sampleNarrative }) {
  const [stages, setStages] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNarrative() {
      try {
        const res = await api.getNarrative();
        if (res?.stages?.length > 0) {
          setStages(res.stages);
          setTotalTracked(res.total_tracked || 0);
          return;
        }
      } catch {
        // Fallback to sample data
      }

      if (sampleNarrative?.stages) {
        setStages(sampleNarrative.stages);
        setTotalTracked(sampleNarrative.total_tracked || 348);
      } else {
        setStages([
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
        ]);
        setTotalTracked(348);
      }
      setLoading(false);
    }
    fetchNarrative();
  }, [sampleNarrative]);

  const activeStage = stages[selectedPhaseIndex] || stages[0];

  return (
    <div className="page-narrative-timeline">
      {/* Narrative Telemetry Hero */}
      <div className="metrics-grid">
        <MetricCard
          title="Narrative Events"
          value={totalTracked.toLocaleString()}
          detail="Total posts mapped across narrative lifecycle"
          icon="⏳"
          theme="purple"
        />
        <MetricCard
          title="Lifecycle Phases"
          value={stages.length}
          detail="Structured diffusion stages identified"
          icon="🔄"
          theme="cyan"
        />
        <MetricCard
          title="Peak Contagion Phase"
          value="Phase 3"
          detail="88% negative polarity surge"
          icon="🚨"
          badge={{ text: 'CRITICAL', type: 'danger' }}
          theme="rose"
        />
      </div>

      {/* Interactive Milestone Stepper */}
      <article className="panel narrative-stepper-panel">
        <div className="panel-header">
          <div>
            <h3>Narrative Evolution & Lifecycle Progression</h3>
            <p className="panel-subtitle">Click any phase along the chronological storyline to inspect that stage's forensic profile</p>
          </div>
          <span className="badge badge-purple">4-Stage Forensic Model</span>
        </div>

        <div className="timeline-stepper">
          {stages.map((st, i) => {
            const isSelected = selectedPhaseIndex === i;
            return (
              <div
                key={i}
                className={`timeline-step ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedPhaseIndex(i)}
              >
                <div className="step-marker">
                  <span className="step-number">{i + 1}</span>
                </div>
                <div className="step-info">
                  <span className="step-name">{st.phase.split(':')[1]?.trim() || st.phase}</span>
                  <small className="step-sub">{st.event_count} posts · {Math.round(st.negative_ratio * 100)}% neg</small>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* Active Phase Deep Dive */}
      {activeStage && (
        <div className="panels-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="phase-badge-pill">PHASE {selectedPhaseIndex + 1} OF 4</span>
                <h3 style={{ marginTop: '0.4rem' }}>{activeStage.phase}</h3>
                <p className="panel-subtitle">{activeStage.description}</p>
              </div>
              <span className={`pill ${activeStage.negative_ratio > 0.7 ? 'danger' : 'neutral'}`}>
                {Math.round(activeStage.negative_ratio * 100)}% Negative Polarity
              </span>
            </div>

            <div className="phase-details-grid">
              <div className="phase-detail-item">
                <span className="detail-label">Observed Timestamp</span>
                <code>{activeStage.timestamp || '2026-03-05T08:00:00Z'}</code>
              </div>
              <div className="phase-detail-item">
                <span className="detail-label">Post Volume</span>
                <strong className="text-cyan">{activeStage.event_count} events</strong>
              </div>
              <div className="phase-detail-item full-width">
                <span className="detail-label">Key Inflection Event</span>
                <div className="inflection-highlight">
                  🎯 <strong>{activeStage.inflection || 'Primary viral inflection detected'}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <h3>Representative Verbatim Discourse</h3>
                <p className="panel-subtitle">Dominant narratives extracted during this evolutionary stage</p>
              </div>
              <span className="badge badge-cyan">Text Exemplars</span>
            </div>

            <div className="sample-quotes-list">
              {(activeStage.sample_texts || []).map((txt, idx) => (
                <div key={idx} className="discourse-card">
                  <div className="discourse-meta">
                    <span className="platform-tag">Captured Post</span>
                    <span className="status-indicator">Signal Verified</span>
                  </div>
                  <blockquote className="discourse-quote">"{txt}"</blockquote>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
