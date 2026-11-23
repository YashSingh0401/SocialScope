import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function XAnalysis({ onNavigate }) {
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedTag, setSelectedTag] = useState('#BlackoutAlert');

  const originalPostsCount = 124;
  const repliesCount = 348;
  const repostsCount = 710;

  const hashtags = [
    { tag: '#BlackoutAlert', matchedPosts: 312, growth: '+480%', sentiment: '88% Negative' },
    { tag: '#GridCollapse', matchedPosts: 240, growth: '+350%', sentiment: '82% Negative' },
    { tag: '#FactCheck', matchedPosts: 184, growth: '+210%', sentiment: '76% Positive' },
    { tag: '#Sector4Power', matchedPosts: 142, growth: '+160%', sentiment: '64% Neutral' },
    { tag: '#PressRelease', matchedPosts: 98, growth: '+95%', sentiment: '85% Neutral' }
  ];

  const timelineDays = ['03-01', '03-02', '03-03', '03-04', '03-05', '03-06', '03-07'];
  const stackedData = [
    { day: '03-01', original: 8, reply: 12, repost: 18, quote: 2 },
    { day: '03-02', original: 10, reply: 14, repost: 22, quote: 4 },
    { day: '03-03', original: 9, reply: 15, repost: 20, quote: 3 },
    { day: '03-04', original: 14, reply: 28, repost: 46, quote: 8 },
    { day: '03-05', original: 54, reply: 168, repost: 420, quote: 68 }, // Major Spike
    { day: '03-06', original: 22, reply: 88, repost: 148, quote: 28 },
    { day: '03-07', original: 7, reply: 23, repost: 36, quote: 6 }
  ];

  const maxTotalDay = 54 + 168 + 420 + 68; // 710

  const evidenceRecords = [
    {
      excerpt: 'BREAKING: Critical security breach reported in central communications grid. Do not trust updates.',
      postType: 'Original Post',
      referencedPost: 'None (Root Seed)',
      actor: 'disinfo_seed_01',
      id: 'tw-101'
    },
    {
      excerpt: 'RT @disinfo_seed_01: BREAKING: Critical security breach reported in central communications grid.',
      postType: 'Repost (Retweet)',
      referencedPost: 'tw-101 (disinfo_seed_01)',
      actor: 'bot_relay_44',
      id: 'tw-103'
    },
    {
      excerpt: 'Notice: All operational networks and grid stations are operating under standard protocols without interruption.',
      postType: 'Original Post',
      referencedPost: 'None (Official Desk)',
      actor: 'official_press',
      id: 'tw-105'
    },
    {
      excerpt: 'This is completely fabricated copypasta. Look at the generator status meters.',
      postType: 'Quote Post',
      referencedPost: 'tw-101 (disinfo_seed_01)',
      actor: 'citizen_observer',
      id: 'tw-107'
    },
    {
      excerpt: 'Are backup batteries working? Lights just flickered here.',
      postType: 'Reply',
      referencedPost: 'tw-101 (disinfo_seed_01)',
      actor: 'local_user_99',
      id: 'tw-109'
    }
  ];

  const filteredEvidence = evidenceRecords.filter((ev) => {
    if (selectedPostType === 'all') return true;
    return ev.postType.toLowerCase().includes(selectedPostType.toLowerCase());
  });

  const evidenceRows = filteredEvidence.map((ev) => ({
    cells: [
      <span key="1">
        <strong style={{ color: '#0f172a', display: 'block', fontSize: '11px' }}><code>{ev.id}</code> by <code>{ev.actor}</code></strong>
        "{ev.excerpt}"
      </span>,
      <span key="2" className="platform-pill x">{ev.postType}</span>,
      <span key="3">
        <code>{ev.referencedPost}</code>
      </span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Post types over time (Stacked Segments)</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Spike on 03-05 driven by 420 Reposts (60%) and 168 Replies (24%).
          </span>
        </div>
        <div className="view-controls">
          {['all', 'original', 'reply', 'repost', 'quote'].map((t) => (
            <button
              key={t}
              type="button"
              className={`btn-toggle-view ${selectedPostType === t ? 'active' : ''}`}
              onClick={() => setSelectedPostType(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Legend for Stacked Bars */}
      <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', marginBottom: '8px', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#007a78', borderRadius: '2px' }} />
          <span>Original Posts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#0ea5e9', borderRadius: '2px' }} />
          <span>Replies</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px' }} />
          <span>Reposts / RTs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }} />
          <span>Quote Posts</span>
        </div>
      </div>

      {/* Stacked Bars Chart */}
      <div className="chart-container" style={{ height: '160px', minHeight: '160px' }}>
        <div className="bar-chart-series" style={{ height: '130px' }}>
          {stackedData.map((pt, idx) => {
            const dayTotal = pt.original + pt.reply + pt.repost + pt.quote;
            const origH = Math.round((pt.original / dayTotal) * 100);
            const replyH = Math.round((pt.reply / dayTotal) * 100);
            const repostH = Math.round((pt.repost / dayTotal) * 100);
            const quoteH = Math.round((pt.quote / dayTotal) * 100);
            const totalH = Math.round((dayTotal / maxTotalDay) * 100);

            return (
              <div key={idx} className="bar-column" title={`${pt.day}: ${dayTotal} posts total`}>
                <span className="bar-value-tooltip">{dayTotal}</span>
                <div className="stacked-bar-fill" style={{ height: `${Math.max(totalH, 8)}%` }}>
                  <div className="stack-segment-original" style={{ height: `${origH}%` }} />
                  <div className="stack-segment-reply" style={{ height: `${replyH}%` }} />
                  <div className="stack-segment-repost" style={{ height: `${repostH}%` }} />
                  <div className="stack-segment-quote" style={{ height: `${quoteH}%` }} />
                </div>
                <span className="bar-label">{pt.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          className="btn-primary btn-small"
          onClick={() => onNavigate('/network')}
        >
          Open Network for recorded quote, repost or reply links →
        </button>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Hashtag activity</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Ranked by distinct matched posts.
      </p>

      <div className="ranking-list">
        {hashtags.map((h, idx) => (
          <div
            key={idx}
            className={`ranking-item ${selectedTag === h.tag ? 'selected' : ''}`}
            onClick={() => setSelectedTag(h.tag)}
          >
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ color: 'var(--color-teal)' }}>{h.tag}</span>
              <span className="ranking-metric">{h.matchedPosts} posts</span>
            </div>
            <div className="ranking-sub">
              Growth velocity: <strong>{h.growth}</strong>
            </div>
            <div style={{ fontSize: '11px', color: h.sentiment.includes('Negative') ? '#b91c1c' : '#15803d', marginTop: '2px' }}>
              Sentiment: {h.sentiment}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Reference Invariant:</strong> If a retweeted or quoted post is deleted, the row labels <em>"Reference unavailable"</em> and maintains total engagement counts.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/x</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">X (Twitter) analysis</h1>
        <p className="screen-question">Was a spike driven by original posts, replies, quotes or reposts?</p>
      </header>

      <ScreenCard
        scopeFilters={['Post Type: All Segments', `Hashtag: ${selectedTag}`, 'Language: en, hi']}
        metricCards={[
          { label: 'Original posts', value: originalPostsCount, sub: 'Root seeds & updates' },
          { label: 'Replies', value: repliesCount, sub: 'Community reactions' },
          { label: 'Reposts', value: repostsCount, sub: 'Amplification velocity' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Post excerpt', 'Post type', 'Referenced post']}
        evidenceRows={evidenceRows}
        evidenceTitle="X (Twitter) Activity & Reference Evidence"
      />
    </div>
  );
}
