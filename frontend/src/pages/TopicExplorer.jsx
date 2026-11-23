import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function TopicExplorer({ topics, onNavigate }) {
  const [selectedTopicId, setSelectedTopicId] = useState('top-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');

  const topicList = [
    {
      topic_id: 'top-01',
      label: 'Critical Grid Blackout Claims',
      size: 184,
      keywords: ['securityalert', 'blackout', 'grid', 'विद्युत', 'हमला'],
      entities: ['Sector 4 Substation', 'Central Power Grid', 'National Distribution Board'],
      excerpts: [
        { id: 'tw-101', platform: 'x', time: '2026-03-05 08:00 UTC', text: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.', sentiment: 'negative', confidence: 0.96, lang: 'en' },
        { id: 'tg-102', platform: 'telegram', time: '2026-03-05 08:01 UTC', text: 'EMERGENCY: Total grid collapse confirmed across Sector 4. Generators failing.', sentiment: 'negative', confidence: 0.94, lang: 'en' },
        { id: 'hi-106', platform: 'dataset', time: '2026-03-05 08:35 UTC', text: 'अधिकारिक सूचना: विद्युत एवं संचार व्यवस्था पूरी तरह से सुरक्षित है। अफ़वाह पर ध्यान न दें।', sentiment: 'positive', confidence: 0.91, lang: 'hi' }
      ]
    },
    {
      topic_id: 'top-02',
      label: 'Official Infrastructure Status Bulletin',
      size: 96,
      keywords: ['pressrelease', 'status', 'सुरक्षित', 'प्रशासन', 'ग्रिड'],
      entities: ['Ministry of Power', 'Grid Operations Desk'],
      excerpts: [
        { id: 'tw-105', platform: 'x', time: '2026-03-05 08:30 UTC', text: 'Notice: All operational networks and grid stations are operating under standard protocols without interruption.', sentiment: 'positive', confidence: 0.98, lang: 'en' },
        { id: 'fb-201', platform: 'facebook', time: '2026-03-05 09:15 UTC', text: 'Public Utility Board: Standard Operations Press Release #2026-08 confirms no disruption.', sentiment: 'neutral', confidence: 0.89, lang: 'en' }
      ]
    },
    {
      topic_id: 'top-03',
      label: 'Citizen Fact-Check & Verification',
      size: 68,
      keywords: ['factcheck', 'local', 'सत्यापन', 'अफवाह'],
      entities: ['Civic Truth Watch', 'Community Watch'],
      excerpts: [
        { id: 'rd-104', platform: 'reddit', time: '2026-03-05 08:15 UTC', text: 'Seeing viral copypasta regarding power outages. Power is 100% fine in central zone.', sentiment: 'positive', confidence: 0.95, lang: 'en' }
      ]
    },
    {
      topic_id: 'unassigned',
      label: 'Unassigned & Noise Cluster',
      size: 12,
      keywords: ['general', 'miscellaneous'],
      entities: [],
      excerpts: [
        { id: 'misc-01', platform: 'reddit', time: '2026-03-05 11:00 UTC', text: 'Off-topic discussion regarding weather forecast.', sentiment: 'Pending', confidence: 0.0, lang: 'en' }
      ]
    }
  ];

  const currentTopic = topicList.find((t) => t.topic_id === selectedTopicId) || topicList[0];

  const filteredExcerpts = currentTopic.excerpts.filter((ex) => {
    const matchesLang = selectedLang === 'all' || ex.lang === selectedLang;
    const matchesQuery = !searchQuery || ex.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesQuery;
  });

  const evidenceRows = filteredExcerpts.map((ex) => ({
    cells: [
      <div key="1" style={{ maxWidth: '440px' }}>
        <p style={{ margin: 0, fontWeight: 500, color: '#1e293b' }}>"{ex.text}"</p>
        <small style={{ color: '#64748b' }}>{ex.time} · <span className={`platform-pill ${ex.platform}`}>{ex.platform.toUpperCase()}</span></small>
      </div>,
      <span key="2" className="platform-pill">{ex.lang.toUpperCase()}</span>,
      <div key="3" className="confidence-meter">
        <div className="confidence-bar-bg">
          <div className="confidence-bar-fill" style={{ width: `${Math.round(ex.confidence * 100)}%` }} />
        </div>
        <span>{ex.sentiment === 'Pending' ? 'Pending Analysis' : `${Math.round(ex.confidence * 100)}% (${ex.sentiment})`}</span>
      </div>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <h4 className="section-headline">Representative records</h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="scope-input"
            placeholder="Search records in topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px' }}
          />
          <select
            className="scope-select"
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            <option value="all">All Languages</option>
            <option value="en">English (en)</option>
            <option value="hi">Hindi (hi)</option>
          </select>
        </div>
      </div>

      {/* Topic Selection Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {topicList.map((t) => (
          <button
            key={t.topic_id}
            className={`btn-toggle-view ${selectedTopicId === t.topic_id ? 'active' : ''}`}
            onClick={() => setSelectedTopicId(t.topic_id)}
          >
            {t.label} ({t.size})
          </button>
        ))}
      </div>

      {/* Record Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredExcerpts.map((ex) => (
          <div
            key={ex.id}
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`platform-pill ${ex.platform}`}>{ex.platform.toUpperCase()}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{ex.time}</span>
              </div>
              <span className={`badge-status ${ex.sentiment === 'negative' ? 'critical' : ex.sentiment === 'positive' ? 'ready' : 'pending'}`}>
                {ex.sentiment.toUpperCase()} · {(ex.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', lineHeight: 1.45 }}>
              "{ex.text}"
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/narratives')}
        >
          View Timeline (carry topic into Narrative Timeline) →
        </button>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Keywords and entities</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Recurring semantic indicators extracted via multilingual NER.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <strong style={{ fontSize: '12px', color: '#142838', textTransform: 'uppercase' }}>Key Keywords</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
          {currentTopic.keywords.map((kw, idx) => (
            <span key={idx} className="platform-pill" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              #{kw}
            </span>
          ))}
        </div>
      </div>

      <div>
        <strong style={{ fontSize: '12px', color: '#142838', textTransform: 'uppercase' }}>Named Entities</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {currentTopic.entities.length > 0 ? (
            currentTopic.entities.map((ent, idx) => (
              <div key={idx} style={{ padding: '6px 10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', fontSize: '12px' }}>
                🏢 <strong>{ent}</strong>
              </div>
            ))
          ) : (
            <small style={{ color: '#94a3b8' }}>No high-confidence entities recognized in unassigned cluster.</small>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/topics</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Topic Explorer</h1>
        <p className="screen-question">Which records explain a topic label, and how consistently do they fit?</p>
      </header>

      <ScreenCard
        scopeFilters={[currentTopic.label, `Lang: ${selectedLang}`, 'All Sentiments']}
        metricCards={[
          { label: 'Matched events', value: currentTopic.size, sub: 'Excerpts in topic cluster' },
          { label: 'Annotated text', value: `${Math.round(currentTopic.size * 0.94)}`, sub: '94% coverage' },
          { label: 'Languages', value: '2 (en, hi)', sub: 'Multilingual corpus' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Excerpt', 'Language', 'Confidence']}
        evidenceRows={evidenceRows}
        evidenceTitle="Topic Excerpt Evidence"
      />
    </div>
  );
}
