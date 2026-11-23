import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';

export default function YouTubeAnalysis({ onNavigate }) {
  const [selectedVideoId, setSelectedVideoId] = useState('yt-01');
  const [selectedTheme, setSelectedTheme] = useState('Cyber Attack Speculation');

  const videos = [
    {
      id: 'yt-01',
      title: 'National Grid Crisis Investigation - Special Report',
      channel: 'Global Watch Network',
      comments: 284,
      replies: 112,
      views: 45200,
      observationTime: '2026-03-05 09:00 UTC',
      commentStatus: 'Available (Full sample)',
      dailyArrivals: [0, 0, 0, 10, 168, 82, 24]
    },
    {
      id: 'yt-02',
      title: 'Official Press Conference: Energy Ministry Refutes Blackout Claims',
      channel: 'State Press Information',
      comments: 168,
      replies: 54,
      views: 31000,
      observationTime: '2026-03-05 10:30 UTC',
      commentStatus: 'Available (Full sample)',
      dailyArrivals: [0, 0, 0, 0, 92, 58, 18]
    },
    {
      id: 'yt-03',
      title: 'Why Is Everyone Talking About A Grid Collapse Today?',
      channel: 'Tech & Policy Explainers',
      comments: 94,
      replies: 32,
      views: 18900,
      observationTime: '2026-03-05 12:00 UTC',
      commentStatus: 'Available (Full sample)',
      dailyArrivals: [0, 0, 0, 0, 48, 36, 10]
    },
    {
      id: 'yt-04',
      title: 'Inside Modern Electrical Substation Safeguards',
      channel: 'Engineering Simplified',
      comments: 66,
      replies: 16,
      views: 12400,
      observationTime: '2026-03-05 14:00 UTC',
      commentStatus: 'Available',
      dailyArrivals: [0, 0, 0, 4, 34, 22, 6]
    }
  ];

  const themes = [
    {
      name: 'Cyber Attack Speculation',
      count: 142,
      tone: '84% Negative',
      sampleComments: [
        { author: 'User_CyberFan', text: 'Multiple independent posts say external hackers infiltrated the SCADA controls!', sentiment: 'Negative', confidence: 0.94 },
        { author: 'ByteHunter', text: 'If the grid goes down for 48 hours, hospitals are in danger.', sentiment: 'Negative', confidence: 0.91 }
      ]
    },
    {
      name: 'Local Ground-Truth & Verification',
      count: 88,
      tone: '82% Positive',
      sampleComments: [
        { author: 'DelhiResident_4', text: 'Power has not fluctuated even once in Sector 4. Complete fake news.', sentiment: 'Positive', confidence: 0.96 },
        { author: 'Rajesh_K', text: 'बिजली बिल्कुल ठीक आ रही है, अफ़वाहों से सावधान रहें।', sentiment: 'Positive', confidence: 0.95 }
      ]
    },
    {
      name: 'Utility Governance Critique',
      count: 54,
      tone: '55% Neutral',
      sampleComments: [
        { author: 'GovWatcher', text: 'The ministry needs to provide real-time dashboard telemetry so rumors cannot spread.', sentiment: 'Neutral', confidence: 0.88 }
      ]
    }
  ];

  const currentVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];
  const currentThemeData = themes.find((t) => t.name === selectedTheme) || themes[0];

  const evidenceRows = videos.map((v) => ({
    cells: [
      <strong key="1" style={{ color: '#142838' }}>{v.title}</strong>,
      <span key="2">{v.channel}</span>,
      <span key="3">
        <strong>{v.comments} comments</strong> ({v.views ? `${v.views.toLocaleString()} views as of ${v.observationTime}` : 'Views uncollected'})
      </span>
    ],
    videoId: v.id
  }));

  const timelineDays = ['03-01', '03-02', '03-03', '03-04', '03-05', '03-06', '03-07'];
  const maxArrival = Math.max(...currentVideo.dailyArrivals, 1);

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Comment arrivals by day</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Selected Video: <strong>{currentVideo.title}</strong> ({currentVideo.channel})
          </span>
        </div>
        <select
          className="scope-select"
          value={selectedVideoId}
          onChange={(e) => setSelectedVideoId(e.target.value)}
          style={{ width: '220px' }}
        >
          {videos.map((v) => (
            <option key={v.id} value={v.id}>{v.title.slice(0, 32)}…</option>
          ))}
        </select>
      </div>

      {/* Daily Arrivals Bar Chart */}
      <div className="chart-container" style={{ height: '140px', minHeight: '140px' }}>
        <div className="bar-chart-series" style={{ height: '110px' }}>
          {currentVideo.dailyArrivals.map((arr, idx) => {
            const hPct = arr > 0 ? Math.round((arr / maxArrival) * 100) : 0;
            return (
              <div key={idx} className="bar-column" title={`${timelineDays[idx]}: ${arr} comments`}>
                <span className="bar-value-tooltip">{arr}</span>
                <div className="bar-fill" style={{ height: `${hPct}%` }} />
                <span className="bar-label">{timelineDays[idx]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comment Themes Grouping Detail */}
      <div style={{ marginTop: '20px' }}>
        <div className="section-headline-row">
          <h4 className="section-headline">Comment themes recurring in this discussion</h4>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {themes.map((th) => (
            <button
              key={th.name}
              className={`btn-toggle-view ${selectedTheme === th.name ? 'active' : ''}`}
              onClick={() => setSelectedTheme(th.name)}
            >
              {th.name} ({th.count})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentThemeData.sampleComments.map((cm, idx) => (
            <div
              key={idx}
              style={{
                padding: '10px 12px',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11.5px' }}>
                <code>{cm.author}</code>
                <span className={`badge-status ${cm.sentiment === 'Positive' ? 'ready' : cm.sentiment === 'Negative' ? 'critical' : 'unassigned'}`}>
                  {cm.sentiment.toUpperCase()} ({(cm.confidence * 100).toFixed(0)}%)
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b' }}>"{cm.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Videos by comment volume</h4>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
        Ranked videos in dataset scope.
      </p>

      <div className="ranking-list">
        {videos.map((v) => (
          <div
            key={v.id}
            className={`ranking-item ${selectedVideoId === v.id ? 'selected' : ''}`}
            onClick={() => setSelectedVideoId(v.id)}
          >
            <div className="ranking-title-row">
              <span className="ranking-name" style={{ fontSize: '12.5px' }}>{v.title}</span>
            </div>
            <div className="ranking-sub">{v.channel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              <span>💬 <strong>{v.comments}</strong> comments</span>
              <span>👁️ {v.views.toLocaleString()} views</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px', background: 'var(--color-bg-subtle)', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '11.5px', color: '#475569' }}>
        <strong>Observation Metadata:</strong> View counts reflect snapshot timestamp at observation time and are not assumed static.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/platforms/youtube</span>
          <span className="section-kicker">Platform Intelligence</span>
        </div>
        <h1 className="screen-title">YouTube analysis</h1>
        <p className="screen-question">Which videos generated discussion, and which themes recur in their comments?</p>
      </header>

      <ScreenCard
        scopeFilters={['Channel: All Channels', `Video: ${currentVideo.title.slice(0, 24)}…`, 'Comment Language: All']}
        metricCards={[
          { label: 'Videos', value: videos.length, sub: 'In topic scope' },
          { label: 'Collected comments', value: 612, sub: 'Analyzed comment texts' },
          { label: 'Reply count', value: 214, sub: 'Discussion depth' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Video title', 'Channel', 'Collected comments']}
        evidenceRows={evidenceRows}
        evidenceTitle="YouTube Video & Comment Evidence"
        onRowClick={(row) => {
          if (row.videoId) setSelectedVideoId(row.videoId);
        }}
      />
    </div>
  );
}
