import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function RedditAnalysis({ onNavigate }) {
  const [selectedSubreddit, setSelectedSubreddit] = useState('r/infrastructure');
  const [selectedThreadId, setSelectedThreadId] = useState('t1');
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  const postsCount = 48;
  const commentsCount = 286;
  const activeSubredditsCount = 5;

  const subreddits = [
    { name: 'r/infrastructure', posts: 18, comments: 142, score: 420, tone: '64% Negative', activity: 'High' },
    { name: 'r/nationalnews', posts: 12, comments: 84, score: 310, tone: '78% Negative', activity: 'High' },
    { name: 'r/factcheck', posts: 8, comments: 36, score: 180, tone: '82% Positive', activity: 'Medium' },
    { name: 'r/regionaltalk', posts: 6, comments: 18, score: 95, tone: '55% Neutral', activity: 'Low' },
    { name: 'r/technews', posts: 4, comments: 6, score: 45, tone: '50% Neutral', activity: 'Low' }
  ];

  const threads = [
    {
      id: 't1',
      subreddit: 'r/infrastructure',
      title: 'Unconfirmed reports of substation failures in Sector 4',
      author: 'u/grid_watcher_88',
      score: 185,
      commentsSample: 42,
      lastReply: '2026-03-05 11:45 UTC',
      created: '2026-03-05 08:20 UTC',
      selfText: 'Seeing multiple posts on other platforms about total blackout in Sector 4. Anyone have telemetry on substation relays?',
      comments: [
        {
          id: 'c1',
          author: 'u/power_engineer_v',
          parentId: null,
          time: '08:24 UTC',
          sentiment: 'positive',
          confidence: 0.94,
          score: 64,
          text: 'I am monitoring SCADA telemetry from the regional load dispatch center. Operating voltages are within nominal limits across all nodes. This looks fabricated.',
          replies: [
            {
              id: 'c1_1',
              author: 'u/citizen_observer',
              parentId: 'c1',
              time: '08:35 UTC',
              sentiment: 'positive',
              confidence: 0.96,
              score: 28,
              text: 'Can confirm, power is 100% fine in central zone. The tweets were identical copypasta.'
            }
          ]
        },
        {
          id: 'c2',
          author: 'u/alarmist_user_1',
          parentId: null,
          time: '08:29 UTC',
          sentiment: 'negative',
          confidence: 0.89,
          score: -8,
          text: 'They always hide failures until it is too late! My lights flickered twice!',
          replies: []
        }
      ]
    },
    {
      id: 't2',
      subreddit: 'r/nationalnews',
      title: 'Megathread: Regional power outage debunked by central ministry',
      author: 'u/mod_bulletin',
      score: 240,
      commentsSample: 56,
      lastReply: '2026-03-05 13:10 UTC',
      created: '2026-03-05 10:00 UTC',
      selfText: 'Official statement released. All grid substations are operating under normal procedures.',
      comments: [
        {
          id: 'c3',
          author: 'u/factcheck_lead',
          parentId: null,
          time: '10:15 UTC',
          sentiment: 'positive',
          confidence: 0.95,
          score: 92,
          text: 'Forensic origin traced back to coordinated Twitter seed account disinfo_seed_01.',
          replies: []
        }
      ]
    }
  ];

  const currentThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const evidenceRows = threads.map((t) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{t.title}</strong>,
      <span key="2">
        <strong>{t.commentsSample} comments</strong> (Score: {t.score})
      </span>,
      <span key="3">{t.lastReply}</span>
    ],
    threadId: t.id
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Thread activity over time & hierarchy</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Subreddit: <strong>{selectedSubreddit}</strong> · Post score: {currentThread.score} (distinct from {currentThread.commentsSample} comments collected)
          </span>
        </div>
        <button
          className="btn-secondary btn-small"
          onClick={() => onNavigate('/topics')}
        >
          Open Topic Explorer →
        </button>
      </div>

      {/* Thread Details Container */}
      <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '6px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h5 style={{ margin: 0, fontSize: '15px', color: '#142838' }}>{currentThread.title}</h5>
          <span className="platform-pill reddit">Reddit</span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
          Posted by <code>{currentThread.author}</code> · {currentThread.created} · Post Score: <strong>+{currentThread.score}</strong>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#334155', lineHeight: 1.5, background: 'var(--color-bg-subtle)', padding: '10px', borderRadius: '4px' }}>
          {currentThread.selfText}
        </p>

        {/* Indented Hierarchical Comments */}
        <strong style={{ fontSize: '12px', color: '#142838', textTransform: 'uppercase' }}>
          Thread Comments ({currentThread.comments.length} top-level + nested replies)
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {currentThread.comments.map((c) => (
            <div key={c.id}>
              <div
                style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '5px',
                  borderLeft: `3px solid ${c.sentiment === 'positive' ? '#15803d' : c.sentiment === 'negative' ? '#b91c1c' : '#64748b'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                  <span>
                    <code>{c.author}</code> · {c.time} · Score: {c.score}
                  </span>
                  <span className={`badge-status ${c.sentiment === 'positive' ? 'ready' : c.sentiment === 'negative' ? 'critical' : 'unassigned'}`}>
                    {c.sentiment.toUpperCase()} ({(c.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>{c.text}</p>
              </div>

              {/* Indented Replies */}
              {c.replies?.map((r) => (
                <div
                  key={r.id}
                  style={{
                    marginLeft: '28px',
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${r.sentiment === 'positive' ? '#15803d' : '#64748b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>
                      ↳ <code>{r.author}</code> (reply to {c.author}) · {r.time}
                    </span>
                    <span className="badge-status ready">{r.sentiment.toUpperCase()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>{r.text}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Subreddit ranking</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Ranked by collected events and community score.
      </p>

      <div className="ranking-list">
        {subreddits.map((sub, idx) => (
          <div
            key={idx}
            className={`ranking-item ${selectedSubreddit === sub.name ? 'selected' : ''}`}
            onClick={() => setSelectedSubreddit(sub.name)}
          >
            <div className="ranking-title-row">
              <span className="ranking-name">{sub.name}</span>
              <span className="ranking-metric">{sub.comments} comments</span>
            </div>
            <div className="ranking-sub">
              {sub.posts} posts · Community Score: {sub.score}
            </div>
            <div style={{ fontSize: '11px', color: sub.tone.includes('Negative') ? '#b91c1c' : '#15803d', marginTop: '2px' }}>
              Dominant tone: {sub.tone}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Parent Hierarchy Invariant:</strong> If a parent comment is deleted or missing, the node retains label <em>"Parent unavailable"</em> rather than collapsing the branch.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/reddit</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">Reddit analysis</h1>
        <p className="screen-question">Which subreddit discussions drove a topic, and where did replies change tone?</p>
      </header>

      <ScreenCard
        scopeFilters={[`Subreddit: ${selectedSubreddit}`, 'Posts & Comments', 'Topic: Blackout Claims']}
        metricCards={[
          { label: 'Posts', value: postsCount, sub: 'Root threads collected' },
          { label: 'Comments', value: commentsCount, sub: 'Nested tree replies' },
          { label: 'Active subreddits', value: activeSubredditsCount, sub: 'Monitored communities' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Thread title', 'Comments in sample', 'Last reply']}
        evidenceRows={evidenceRows}
        evidenceTitle="Reddit Thread Activity Evidence"
        onRowClick={(row) => {
          if (row.threadId) setSelectedThreadId(row.threadId);
        }}
      />
    </div>
  );
}
