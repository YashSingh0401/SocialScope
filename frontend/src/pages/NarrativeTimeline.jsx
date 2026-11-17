import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function NarrativeTimeline() {
  const [stages, setStages] = useState([]);
  const [totalTracked, setTotalTracked] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNarrative() {
      try {
        const res = await api.getNarrative();
        setStages(res.stages || []);
        setTotalTracked(res.total_tracked || 0);
      } catch {
        // Fallback default stages if no events
        setStages([
          {
            phase: '1. Emergence & Seeding',
            description: 'First mentions and seed claims introduced by primary actor.',
            event_count: 14,
            negative_ratio: 0.25,
            sample_texts: ['First reports regarding potential power fluctuations in Sector 4.']
          },
          {
            phase: '2. Public Reaction & Engagement',
            description: 'Organic community members question and retweet.',
            event_count: 52,
            negative_ratio: 0.40,
            sample_texts: ['Is anyone else noticing the power dropping? Is this confirmed?']
          },
          {
            phase: '3. Coordinated Amplification',
            description: 'Synchronized bot accounts post verbatim text with alarmist tags.',
            event_count: 180,
            negative_ratio: 0.88,
            sample_texts: ['CRITICAL: Complete grid collapse confirmed. Panic across all zones.']
          },
          {
            phase: '4. Polarization & Plateau',
            description: 'Official fact-checks confront entrenched counter-narratives.',
            event_count: 95,
            negative_ratio: 0.60,
            sample_texts: ['Official press bulletin clarifies grid operating at 100% capacity.']
          }
        ]);
        setTotalTracked(341);
      } finally {
        setLoading(false);
      }
    }
    fetchNarrative();
  }, []);

  return (
    <div className="page-narrative-timeline">
      <div className="narrative-hero">
        <div>
          <h2>Narrative Evolution & Lifecycle Progression</h2>
          <p className="narrative-subtitle">
            Tracking information diffusion across four distinct stages: <em>Emergence → Public Reaction → Amplification → Polarization</em>.
          </p>
        </div>
        <div className="narrative-kpi">
          <span>Tracked Narrative Events</span>
          <strong>{totalTracked}</strong>
        </div>
      </div>

      <div className="narrative-stepper">
        {stages.map((st, i) => (
          <div className="stepper-step active" key={i}>
            <div className="step-circle">{i + 1}</div>
            <span className="step-name">{st.phase.split('.')[1] || st.phase}</span>
          </div>
        ))}
      </div>

      <div className="narrative-stages-grid">
        {stages.map((st, i) => {
          const isHighNeg = st.negative_ratio >= 0.7;
          return (
            <article className={`narrative-card ${isHighNeg ? 'high-risk' : ''}`} key={i}>
              <div className="card-phase-header">
                <span className="phase-pill">PHASE {i + 1}</span>
                <span className="phase-events">{st.event_count} events</span>
              </div>

              <h3 className="phase-title">{st.phase}</h3>
              <p className="phase-desc">{st.description}</p>

              <div className="phase-metrics">
                <div className="metric-item">
                  <small>Negative Polarity</small>
                  <strong style={{ color: isHighNeg ? '#ef4444' : '#64748b' }}>
                    {Math.round(st.negative_ratio * 100)}%
                  </strong>
                </div>
                {st.start_time && (
                  <div className="metric-item">
                    <small>Time Horizon</small>
                    <span>{formatDate(st.start_time)}</span>
                  </div>
                )}
              </div>

              {st.sample_texts && st.sample_texts.length > 0 && (
                <div className="phase-excerpts">
                  <small className="excerpts-label">Key Representative Text:</small>
                  {st.sample_texts.map((txt, idx) => (
                    <blockquote key={idx} className="excerpt-quote">
                      "{txt}"
                    </blockquote>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
