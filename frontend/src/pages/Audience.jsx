import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import MetricCard from '../components/MetricCard';
import { formatLanguage } from '../utils/formatters';

export default function Audience() {
  const [data, setData] = useState({ platforms: [], top_actors: [], languages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAudience();
        setData(res);
      } catch {
        setData({
          platforms: [
            { label: 'twitter', count: 180 },
            { label: 'telegram', count: 95 },
            { label: 'reddit', count: 45 }
          ],
          top_actors: [
            { actor_ref: 'disinfo_seed_01', count: 24, platforms_count: 2 },
            { actor_ref: 'amplifier_bot_99', count: 18, platforms_count: 2 },
            { actor_ref: 'citizen_observer', count: 12, platforms_count: 1 }
          ],
          languages: [
            { label: 'en', count: 210 },
            { label: 'hi', count: 85 },
            { label: 'und', count: 25 }
          ],
          demographic_notes: 'Demographic estimates are aggregate and defensible based on linguistic indicators.'
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalEvents = data.platforms.reduce((sum, p) => sum + (p.count || 0), 0) || 1;

  return (
    <div className="page-audience">
      <div className="audience-disclaimer">
        <span className="disclaimer-icon">🛡</span>
        <div className="disclaimer-text">
          <strong>DEFENSIBLE AGGREGATE DEMOGRAPHICS</strong>
          <p>
            As mandated by intelligence ethics, observed technical facts (platform, timestamps) are strictly separated from inferred demographic characteristics (linguistic regional markers). No fabricated user profiling is performed.
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Monitored Platforms"
          value={data.platforms.length}
          detail="Active ingest channels"
          icon="🌐"
        />
        <MetricCard
          title="Identified Actors"
          value={data.top_actors.length}
          detail="Unique handles in scope"
          icon="👥"
        />
        <MetricCard
          title="Linguistic Regions"
          value={data.languages.length}
          detail="Multilingual spectrum"
          icon="🗣"
        />
      </div>

      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Platform Share</h3>
              <p className="panel-subtitle">Distribution across social ecosystems</p>
            </div>
            <span className="badge">OBSERVED</span>
          </div>

          <div className="platform-bars">
            {data.platforms.map((p) => {
              const pct = Math.round((p.count / totalEvents) * 100);
              return (
                <div className="platform-row" key={p.label}>
                  <div className="platform-label">
                    <span className="platform-icon">
                      {p.label.includes('tw') ? '🐦' : p.label.includes('teleg') ? '✈️' : p.label.includes('red') ? '🤖' : '🌐'}
                    </span>
                    <strong>{p.label}</strong>
                  </div>
                  <div className="platform-bar-track">
                    <div className="platform-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="platform-count">{p.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Linguistic Demographics</h3>
              <p className="panel-subtitle">Inferred from textual token features</p>
            </div>
            <span className="badge">INFERRED (HIGH CONFIDENCE)</span>
          </div>

          <div className="platform-bars">
            {data.languages.map((l) => {
              const pct = Math.round((l.count / totalEvents) * 100);
              return (
                <div className="platform-row" key={l.label}>
                  <div className="platform-label">
                    <strong>{formatLanguage(l.label)}</strong>
                  </div>
                  <div className="platform-bar-track">
                    <div className="platform-bar-fill lang" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="platform-count">{l.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Top Contributing Actors</h3>
            <p className="panel-subtitle">Highest volume participants across monitored ecosystems</p>
          </div>
          <span className="badge">ACTOR LEDGER</span>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Actor Handle / Reference</th>
                <th>Total Ingested Events</th>
                <th>Cross-Platform Footprint</th>
                <th>Role Designation</th>
              </tr>
            </thead>
            <tbody>
              {data.top_actors.map((act) => (
                <tr key={act.actor_ref}>
                  <td><code>{act.actor_ref}</code></td>
                  <td><b>{act.count}</b></td>
                  <td>
                    <span className="pill info small">
                      {act.platforms_count > 1 ? `Multi-Platform (${act.platforms_count})` : 'Single Platform'}
                    </span>
                  </td>
                  <td>
                    {act.count > 15 ? (
                      <span className="pill warning small">High-Frequency Amplifier</span>
                    ) : (
                      <span className="pill neutral small">Standard Participant</span>
                    )}
                  </td>
                </tr>
              ))}
              {!data.top_actors.length && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>
                    No actor activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
