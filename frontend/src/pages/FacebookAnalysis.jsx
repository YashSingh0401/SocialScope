import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function FacebookAnalysis({ onNavigate }) {
  const [selectedPostId, setSelectedPostId] = useState('fb-01');
  const [selectedReaction, setSelectedReaction] = useState('all');

  const pagePostsCount = 26;
  const collectedCommentsCount = 530;
  const reportedReactionsCount = 2840;

  const posts = [
    {
      id: 'fb-01',
      page: 'National Power Distribution Board',
      title: 'Public Utility Board: Standard Operations Press Release #2026-08',
      text: 'The Ministry and Regional Power Transmission Hub confirm that all power lines in Sector 4 and adjacent districts are functioning with full stability. Disregard unauthorized rumors.',
      time: '2026-03-05 09:15 UTC',
      commentsCount: 184,
      totalReactions: 1420,
      reactionMix: [
        { type: 'Like', count: 1020, share: '71.8%', color: '#2563eb' },
        { type: 'Love', count: 180, share: '12.7%', color: '#e11d48' },
        { type: 'Care', count: 90, share: '6.3%', color: '#f59e0b' },
        { type: 'Angry', count: 80, share: '5.6%', color: '#dc2626' },
        { type: 'Haha', count: 50, share: '3.5%', color: '#f97316' }
      ]
    },
    {
      id: 'fb-02',
      page: 'Sector 4 Residents Union',
      title: 'Sector 4 Community Bulletin: Inquiries regarding evening load shedding',
      text: 'Hearing reports of potential maintenance cuts today. Does anyone have an update from local linemen?',
      time: '2026-03-05 08:40 UTC',
      commentsCount: 210,
      totalReactions: 840,
      reactionMix: [
        { type: 'Angry', count: 480, share: '57.1%', color: '#dc2626' },
        { type: 'Sad', count: 210, share: '25.0%', color: '#7c3aed' },
        { type: 'Like', count: 110, share: '13.1%', color: '#2563eb' },
        { type: 'Haha', count: 40, share: '4.8%', color: '#f97316' }
      ]
    },
    {
      id: 'fb-03',
      page: 'Civic Truth Watch',
      title: 'Daily Fact-Check: No grid breach in state transmission lines',
      text: 'Viral audio messages and duplicate copypasta claimed a statewide power collapse. Fact-checked: completely false.',
      time: '2026-03-05 11:20 UTC',
      commentsCount: 136,
      totalReactions: 580,
      reactionMix: [
        { type: 'Like', count: 490, share: '84.5%', color: '#2563eb' },
        { type: 'Love', count: 60, share: '10.3%', color: '#e11d48' },
        { type: 'Angry', count: 30, share: '5.2%', color: '#dc2626' }
      ]
    }
  ];

  const commentTopics = [
    {
      name: 'Emergency preparedness questions',
      comments: 164,
      sentiment: 'Negative',
      excerpt: 'Do we need emergency fuel for generators? Please provide clear guidance.'
    },
    {
      name: 'Official notification clarifications',
      comments: 142,
      sentiment: 'Neutral',
      excerpt: 'Sharing official helpline phone number 1912 for direct verification.'
    },
    {
      name: 'Calling out viral rumors and copypasta',
      comments: 128,
      sentiment: 'Positive',
      excerpt: 'Verified directly with substation engineers. Power is normal.'
    }
  ];

  const currentPost = posts.find((p) => p.id === selectedPostId) || posts[0];

  const evidenceRows = posts.map((p) => ({
    cells: [
      <span key="1">
        <strong style={{ display: 'block', color: '#142838' }}>{p.title}</strong>
        <small style={{ color: '#64748b' }}>Page: {p.page} · {p.time}</small>
      </span>,
      <span key="2">
        <strong>{p.totalReactions.toLocaleString()} reactions</strong> ({p.reactionMix[0]?.type}: {p.reactionMix[0]?.share})
      </span>,
      <span key="3">
        <strong>{p.commentsCount} comments</strong>
      </span>
    ],
    id: p.id
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Reaction mix by post</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Selected Post: <strong>{currentPost.title}</strong>
          </span>
        </div>
        <select
          className="scope-select"
          value={selectedPostId}
          onChange={(e) => setSelectedPostId(e.target.value)}
          style={{ width: '220px' }}
        >
          {posts.map((p) => (
            <option key={p.id} value={p.id}>{p.page}: {p.title.slice(0, 28)}…</option>
          ))}
        </select>
      </div>

      {/* Selected Post Overview */}
      <div style={{ padding: '14px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="platform-pill facebook">{currentPost.page}</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{currentPost.time}</span>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
          "{currentPost.text}"
        </p>

        {/* Reaction Breakdown Horizontal Bars */}
        <strong style={{ fontSize: '12px', color: '#142838', textTransform: 'uppercase' }}>
          Reaction Mix Breakdown ({currentPost.totalReactions.toLocaleString()} total reported)
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {currentPost.reactionMix.map((rm, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{ width: '55px', fontWeight: 600, color: '#334155' }}>{rm.type}</span>
              <div style={{ flex: 1, height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: rm.share, background: rm.color, borderRadius: '7px' }} />
              </div>
              <span style={{ width: '90px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                {rm.count} ({rm.share})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Comment topics</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Recurring discussion clusters in Facebook comments.
      </p>

      <div className="ranking-list">
        {commentTopics.map((ct, idx) => (
          <div key={idx} className="ranking-item" style={{ cursor: 'default' }}>
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ fontSize: '12.5px' }}>{ct.name}</span>
              <span className="ranking-metric">{ct.comments} comments</span>
            </div>
            <div className="ranking-sub">
              Sentiment: <strong style={{ color: ct.sentiment === 'Positive' ? '#15803d' : ct.sentiment === 'Negative' ? '#b91c1c' : '#64748b' }}>{ct.sentiment}</strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#475569', fontStyle: 'italic' }}>
              "{ct.excerpt}"
            </p>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Parent Post Linkage:</strong> Every comment retains an immutable link back to its parent Page post ID to maintain provenance.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/facebook</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">Facebook analysis</h1>
        <p className="screen-question">Which Page posts generated reactions, and what are people saying in the discussion?</p>
      </header>

      <ScreenCard
        scopeFilters={[`Page: ${currentPost.page}`, 'Post Format: Status Update', 'Reaction Type: All']}
        metricCards={[
          { label: 'Page posts', value: pagePostsCount, sub: 'Public verified pages' },
          { label: 'Collected comments', value: collectedCommentsCount, sub: 'Extracted audience text' },
          { label: 'Reported reactions', value: reportedReactionsCount.toLocaleString(), sub: 'API reaction metrics' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Page post', 'Reactions', 'Collected comments']}
        evidenceRows={evidenceRows}
        evidenceTitle="Facebook Page Post & Reaction Evidence"
        onRowClick={(row) => {
          if (row.id) setSelectedPostId(row.id);
        }}
      />
    </div>
  );
}
