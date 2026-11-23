import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function InstagramAnalysis({ onNavigate }) {
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState('ig-01');

  const mediaItemsCount = 38;
  const collectedCommentsCount = 490;
  const taggedItemsCount = 24;

  const formats = [
    { format: 'Carousel', commentVolume: 240, mediaCount: 14, share: '49%' },
    { format: 'Reel (Video)', commentVolume: 190, mediaCount: 16, share: '39%' },
    { format: 'Single Image', commentVolume: 60, mediaCount: 8, share: '12%' }
  ];

  const captionHashtags = [
    { tag: '#breakingnews', count: 28, sentiment: '74% Negative' },
    { tag: '#cityblackout', count: 22, sentiment: '80% Negative' },
    { tag: '#safetyfirst', count: 18, sentiment: '65% Neutral' },
    { tag: '#verified', count: 15, sentiment: '88% Positive' },
    { tag: '#powergrid', count: 12, sentiment: '70% Negative' }
  ];

  const mediaPosts = [
    {
      id: 'ig-01',
      format: 'Carousel',
      account: '@daily_city_brief',
      caption: '🚨 Is the power grid safe today? Swipe through for emergency hotline numbers and reports from Sector 4.',
      captionSentiment: 'Neutral (Informative)',
      commentsCount: 142,
      commentSentiment: '78% Negative',
      hasThumbnail: false,
      sampleComments: [
        { author: 'ananya_m', text: 'Lights were out in my colony for 10 mins, is it connected?', sentiment: 'Negative' },
        { author: 'vikram_singh', text: 'Official handles posted that power is 100% fine. Check facts!', sentiment: 'Positive' }
      ]
    },
    {
      id: 'ig-02',
      format: 'Reel (Video)',
      account: '@citizen_reporter_v',
      caption: 'Live outside the Sector 4 substation! Lights are fully on, transformers humming normally. Stop spreading copypasta.',
      captionSentiment: 'Positive (Debunking)',
      commentsCount: 118,
      commentSentiment: '82% Positive',
      hasThumbnail: false,
      sampleComments: [
        { author: 'ground_truth_india', text: 'Thank you for showing the real ground reality!', sentiment: 'Positive' }
      ]
    },
    {
      id: 'ig-03',
      format: 'Single Image',
      account: '@state_disaster_update',
      caption: 'Emergency helpline directory for all power transmission inquiries. Available 24x7.',
      captionSentiment: 'Neutral (Official Directory)',
      commentsCount: 42,
      commentSentiment: '60% Neutral',
      hasThumbnail: false,
      sampleComments: [
        { author: 'rohit_kumar', text: 'Called the number, they confirmed power is stable.', sentiment: 'Neutral' }
      ]
    }
  ];

  const filteredMedia = mediaPosts.filter((m) => {
    if (selectedFormat === 'all') return true;
    return m.format.toLowerCase().includes(selectedFormat.toLowerCase());
  });

  const currentItem = mediaPosts.find((m) => m.id === selectedItemId) || mediaPosts[0];

  const evidenceRows = filteredMedia.map((m) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{m.caption.slice(0, 60)}…</strong>,
      <span key="2" className="platform-pill instagram">{m.format}</span>,
      <span key="3">
        <strong>{m.commentSentiment}</strong> ({m.commentsCount} comments) · Caption: <em>{m.captionSentiment}</em>
      </span>
    ],
    id: m.id
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Comments by media format</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Carousel posts drive 49% of all discussion comments in this topic.
          </span>
        </div>
        <div className="view-controls">
          {['all', 'Carousel', 'Reel (Video)', 'Single Image'].map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={`btn-toggle-view ${selectedFormat === fmt ? 'active' : ''}`}
              onClick={() => setSelectedFormat(fmt)}
            >
              {fmt === 'all' ? 'All Formats' : fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Format Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {formats.map((f, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px',
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: '6px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#64748b' }}>{f.format}</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#142838', margin: '4px 0' }}>
              {f.commentVolume} comments
            </div>
            <small style={{ color: '#007a78', fontWeight: 600 }}>{f.share} of discussion ({f.mediaCount} items)</small>
          </div>
        ))}
      </div>

      {/* Media Item Detail & Text Card Fallback */}
      <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="platform-pill instagram">{currentItem.format}</span>
            <strong style={{ fontSize: '13.5px', color: '#142838' }}>{currentItem.account}</strong>
          </div>
          <span className="badge-status ready">{currentItem.commentsCount} comments</span>
        </div>

        {/* Text card fallback for missing thumbnail (per design spec) */}
        <div style={{ padding: '12px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px dashed #cbd5e1', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            [Text Card Fallback — Media Asset Not Cached]
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', fontStyle: 'italic' }}>
            "{currentItem.caption}"
          </p>
        </div>

        {/* Caption vs Comment Sentiment Separation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '12px' }}>
          <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '4px' }}>
            <span style={{ color: '#64748b' }}>Caption Sentiment:</span>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{currentItem.captionSentiment}</div>
          </div>
          <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '4px' }}>
            <span style={{ color: '#64748b' }}>Comment Sentiment Distribution:</span>
            <div style={{ fontWeight: 600, color: '#b91c1c' }}>{currentItem.commentSentiment}</div>
          </div>
        </div>

        {/* Sample Comments */}
        <strong style={{ fontSize: '11.5px', color: '#142838', textTransform: 'uppercase' }}>Sample Comments in Selection</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          {currentItem.sampleComments.map((cm, idx) => (
            <div key={idx} style={{ padding: '6px 10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}>
              <code>{cm.author}</code>: "{cm.text}"
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Caption hashtags</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Extracted hashtags from post captions.
      </p>

      <div className="ranking-list">
        {captionHashtags.map((h, idx) => (
          <div key={idx} className="ranking-item" style={{ cursor: 'default' }}>
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ color: 'var(--color-teal)' }}>{h.tag}</span>
              <span className="ranking-metric">{h.count} posts</span>
            </div>
            <div className="ranking-sub">
              Audience Sentiment Correlation: <strong>{h.sentiment}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Compliance Notice:</strong> Account-only private insights (impressions/saves) are hidden unless explicitly authenticated via Graph API.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/instagram</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">Instagram analysis</h1>
        <p className="screen-question">Which media formats and captions are associated with changes in comment sentiment?</p>
      </header>

      <ScreenCard
        scopeFilters={['Account: All Monitored Handles', `Format: ${selectedFormat.toUpperCase()}`, 'Hashtag: #breakingnews']}
        metricCards={[
          { label: 'Media items', value: mediaItemsCount, sub: 'Carousels, Reels, Images' },
          { label: 'Collected comments', value: collectedCommentsCount, sub: 'Extracted comment texts' },
          { label: 'Tagged items', value: taggedItemsCount, sub: 'Entity-tagged posts' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Media item', 'Format', 'Comment sentiment']}
        evidenceRows={evidenceRows}
        evidenceTitle="Instagram Media & Sentiment Evidence"
        onRowClick={(row) => {
          if (row.id) setSelectedItemId(row.id);
        }}
      />
    </div>
  );
}
