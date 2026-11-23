import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function TelegramAnalysis({ onNavigate }) {
  const [selectedChannel, setSelectedChannel] = useState('@intel_alert_east');
  const [forwardFilter, setForwardFilter] = useState('all'); // 'all', 'original', 'forward'

  const channels = [
    { name: '@intel_alert_east', messages: 94, forwardsOut: 68, subscribers: 42000, tone: 'Panic / Breaking' },
    { name: '@regional_bulletin', messages: 88, forwardsOut: 42, subscribers: 68500, tone: 'News aggregate' },
    { name: '@sector4_citizens', messages: 64, forwardsOut: 24, subscribers: 18200, tone: 'Local inquiries' },
    { name: '@rumor_vector_07', messages: 52, forwardsOut: 18, subscribers: 9400, tone: 'Seed vector' },
    { name: '@state_press_official', messages: 120, forwardsOut: 12, subscribers: 145000, tone: 'Official debunk' }
  ];

  const forwardOrigins = [
    { origin: '@intel_alert_east', receiving: '@regional_bulletin', count: 48, lag: '35 seconds', verified: true },
    { origin: '@intel_alert_east', receiving: '@sector4_citizens', count: 36, lag: '1 min 12s', verified: true },
    { origin: '@rumor_vector_07', receiving: '@daily_dispatch_hindi', count: 28, lag: '2 mins 05s', verified: true },
    { origin: 'Origin unavailable', receiving: '@sector4_citizens', count: 14, lag: 'Unknown', verified: false }
  ];

  const messages = [
    {
      id: 'tg-01',
      channel: '@regional_bulletin',
      time: '2026-03-05 08:02:15 UTC',
      isForward: true,
      origin: '@intel_alert_east',
      text: 'Forwarded from @intel_alert_east: EMERGENCY - complete grid disruption reported across central zone. Authorities have cut comms.'
    },
    {
      id: 'tg-02',
      channel: '@sector4_citizens',
      time: '2026-03-05 08:08:40 UTC',
      isForward: true,
      origin: '@intel_alert_east',
      text: 'Forwarded from @intel_alert_east: Substation generators failing. Backup batteries down.'
    },
    {
      id: 'tg-03',
      channel: '@state_press_official',
      time: '2026-03-05 08:45:00 UTC',
      isForward: false,
      origin: null,
      text: 'Confirmed fake news: Power transmission lines operating without impedance. Standard operating voltage maintained.'
    },
    {
      id: 'tg-04',
      channel: '@rumor_vector_07',
      time: '2026-03-05 08:00:10 UTC',
      isForward: false,
      origin: null,
      text: 'Breaking: Watch for major communications blackout beginning in northern sector.'
    }
  ];

  const filteredMessages = messages.filter((m) => {
    if (forwardFilter === 'original') return !m.isForward;
    if (forwardFilter === 'forward') return m.isForward;
    return true;
  });

  const evidenceRows = filteredMessages.map((m) => ({
    cells: [
      <span key="1">
        {m.isForward ? (
          <span className="badge-status pending" style={{ marginRight: '6px' }}>
            Forward from {m.origin || 'Origin unavailable'}
          </span>
        ) : (
          <span className="badge-status ready" style={{ marginRight: '6px' }}>Original Message</span>
        )}
        "{m.text}"
      </span>,
      <span key="2" className="platform-pill telegram">{m.channel}</span>,
      <span key="3">{m.time}</span>
    ]
  }));

  const timelineData = [
    { time: '08:00', intel: 18, bulletin: 4, sector4: 2 },
    { time: '08:15', intel: 34, bulletin: 28, sector4: 14 },
    { time: '08:30', intel: 22, bulletin: 32, sector4: 26 },
    { time: '08:45', intel: 12, bulletin: 16, sector4: 18 },
    { time: '09:00', intel: 8, bulletin: 8, sector4: 4 }
  ];

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Message volume by channel (Burst Timeline)</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Aligning channels on synchronized event timestamps.
          </span>
        </div>
        <div className="view-controls">
          {['all', 'original', 'forward'].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn-toggle-view ${forwardFilter === f ? 'active' : ''}`}
              onClick={() => setForwardFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Hourly Burst Distribution Bars */}
      <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', marginBottom: '10px', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#0284c7', borderRadius: '2px' }} />
            <span>@intel_alert_east</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px' }} />
            <span>@regional_bulletin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', background: '#0d9488', borderRadius: '2px' }} />
            <span>@sector4_citizens</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '120px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
          {timelineData.map((t, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', gap: '4px', height: '100%', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, height: `${(t.intel / 35) * 100}%`, background: '#0284c7', borderRadius: '2px 2px 0 0' }} title={`@intel: ${t.intel}`} />
              <div style={{ flex: 1, height: `${(t.bulletin / 35) * 100}%`, background: '#6366f1', borderRadius: '2px 2px 0 0' }} title={`@bulletin: ${t.bulletin}`} />
              <div style={{ flex: 1, height: `${(t.sector4 / 35) * 100}%`, background: '#0d9488', borderRadius: '2px 2px 0 0' }} title={`@sector4: ${t.sector4}`} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
          {timelineData.map((t, idx) => (
            <span key={idx}>{t.time} UTC</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/network')}
        >
          Follow forward reference into Network →
        </button>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Forward origins</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Recorded origin and receiving channels.
      </p>

      <div className="ranking-list">
        {forwardOrigins.map((fo, idx) => (
          <div key={idx} className="ranking-item" style={{ cursor: 'default' }}>
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ fontSize: '12.5px' }}>
                <code>{fo.origin}</code> ➔ <code>{fo.receiving}</code>
              </span>
              <span className="ranking-metric">{fo.count} forwards</span>
            </div>
            <div className="ranking-sub">
              Propagation lag: <strong>{fo.lag}</strong>
              {!fo.verified && <span style={{ color: '#b45309', marginLeft: '6px' }}>(Origin metadata missing)</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Forward Provenance Invariant:</strong> Forward links are recognized strictly when Telegram MTProto <code>fwd_from</code> metadata exists. Text similarity is never conflated with verified forwarding.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/telegram</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">Telegram analysis</h1>
        <p className="screen-question">When did a message cluster spread between the channels covered by this dataset?</p>
      </header>

      <ScreenCard
        scopeFilters={['Channel: All 5 Channels', `Forward Filter: ${forwardFilter.toUpperCase()}`, 'Topic: Blackout Claims']}
        metricCards={[
          { label: 'Channels', value: channels.length, sub: 'Public channels monitored' },
          { label: 'Messages', value: 418, sub: 'Total messages collected' },
          { label: 'Recorded forwards', value: 164, sub: 'Explicit fwd_from chains' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Message excerpt', 'Channel', 'Observed time']}
        evidenceRows={evidenceRows}
        evidenceTitle="Telegram Broadcast & Forward Evidence"
      />
    </div>
  );
}
