import React, { useState } from 'react';
import ScreenCard from '../components/ScreenCard';
import CytoscapeGraph from '../network/CytoscapeGraph';

export default function Network({ networkData, onNavigate }) {
  const [selectedNode, setSelectedNode] = useState({
    id: 'disinfo_seed_01',
    label: 'disinfo_seed_01',
    community: 1,
    pagerank: 0.42,
    degree: 9,
    inDegree: 1,
    outDegree: 8,
    isInfluencer: true,
    platform: 'X (Twitter)',
    recordedLinks: [
      { target: 'amplifier_bot_99', type: 'mention', weight: 5 },
      { target: 'bot_relay_44', type: 'share', weight: 4 },
      { target: 'citizen_observer', type: 'reply', weight: 2 }
    ]
  });

  const [showTableAlt, setShowTableAlt] = useState(false);
  const [centralityMetric, setCentralityMetric] = useState('pagerank');

  const totalNodes = networkData?.metrics?.total_nodes || 7;
  const totalEdges = networkData?.metrics?.total_edges || 6;
  const communitiesCount = networkData?.metrics?.communities_count || 3;

  const relationshipRows = [
    { source: 'disinfo_seed_01', target: 'amplifier_bot_99', kind: 'mention', weight: 5, time: '2026-03-05 08:00 UTC', excerpt: 'Seed mention: @amplifier_bot_99 verify this blackout claim' },
    { source: 'disinfo_seed_01', target: 'bot_relay_44', kind: 'share', weight: 4, time: '2026-03-05 08:01 UTC', excerpt: 'Rapid retweet relay without comment' },
    { source: 'amplifier_bot_99', target: 'bridge_broker_alpha', kind: 'reply', weight: 3, time: '2026-03-05 08:05 UTC', excerpt: 'Forwarding to Telegram group @bridge_broker_alpha' },
    { source: 'bridge_broker_alpha', target: 'citizen_observer', kind: 'mention', weight: 2, time: '2026-03-05 08:15 UTC', excerpt: 'Cross-posting rumor to Reddit r/infrastructure' },
    { source: 'official_press', target: 'citizen_observer', kind: 'reply', weight: 4, time: '2026-03-05 08:30 UTC', excerpt: 'Official clarification confirming grid status is nominal' }
  ];

  const evidenceRows = relationshipRows.map((r, idx) => ({
    cells: [
      <span key="1">
        <code>{r.source}</code> ➔ <code>{r.target}</code> <span className="platform-pill" style={{ marginLeft: '4px' }}>{r.kind.toUpperCase()}</span>
      </span>,
      <span key="2">{r.time}</span>,
      <span key="3">"{r.excerpt}"</span>
    ]
  }));

  const primaryContent = (
    <div>
      <div className="section-headline-row">
        <div>
          <h4 className="section-headline">Interaction graph</h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Node size: {centralityMetric === 'pagerank' ? 'PageRank Centrality' : 'Degree Centrality'}. Edge arrows indicate interaction direction.
          </span>
        </div>
        <div className="view-controls">
          <select
            className="scope-select"
            value={centralityMetric}
            onChange={(e) => setCentralityMetric(e.target.value)}
            style={{ fontSize: '11.5px', padding: '3px 6px' }}
          >
            <option value="pagerank">Metric: PageRank</option>
            <option value="degree">Metric: Degree</option>
          </select>
          <button
            type="button"
            className={`btn-toggle-view ${!showTableAlt ? 'active' : ''}`}
            onClick={() => setShowTableAlt(false)}
          >
            Graph view
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${showTableAlt ? 'active' : ''}`}
            onClick={() => setShowTableAlt(true)}
          >
            Relationships table
          </button>
        </div>
      </div>

      {!showTableAlt ? (
        <div style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Bounded subset:</span> 7 key actors shown (3 communities)
          </div>
          <CytoscapeGraph
            elements={networkData?.elements}
            metrics={networkData?.metrics}
            onSelectNode={(nodeData) => {
              if (nodeData) {
                setSelectedNode({
                  id: nodeData.id,
                  label: nodeData.label || nodeData.id,
                  community: nodeData.community ?? 1,
                  pagerank: nodeData.pagerank ?? 0.25,
                  degree: nodeData.degree ?? 6,
                  inDegree: nodeData.in_degree ?? 2,
                  outDegree: nodeData.out_degree ?? 4,
                  isInfluencer: nodeData.is_influencer,
                  platform: 'X (Twitter)',
                  recordedLinks: relationshipRows
                    .filter((r) => r.source === nodeData.id || r.target === nodeData.id)
                    .map((r) => ({ target: r.source === nodeData.id ? r.target : r.source, type: r.kind, weight: r.weight }))
                });
              }
            }}
          />
        </div>
      ) : (
        <table className="accessible-chart-table">
          <thead>
            <tr>
              <th>Source Actor</th>
              <th>Target Actor</th>
              <th>Interaction Type</th>
              <th>Weight</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {relationshipRows.map((r, idx) => (
              <tr key={idx}>
                <td><code>{r.source}</code></td>
                <td><code>{r.target}</code></td>
                <td><span className="platform-pill">{r.kind}</span></td>
                <td>{r.weight}</td>
                <td>{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Graph Legend */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '12px', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7' }} />
          <span>Community 1 (Disinfo Cluster)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
          <span>Community 2 (Bridge Brokers)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
          <span>Community 3 (Official & Press)</span>
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <div className="inspector-panel">
      <div className="section-headline-row">
        <h4 className="section-headline">Selected node</h4>
      </div>

      {selectedNode ? (
        <div style={{ padding: '14px', background: 'var(--color-bg-subtle)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <h5 style={{ margin: 0, fontSize: '14px', color: '#142838' }}>
              <code>{selectedNode.label}</code>
            </h5>
            {selectedNode.isInfluencer && (
              <span className="badge-status critical">Key Seed / Influencer</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
            <div>
              <span style={{ color: '#64748b' }}>Community:</span>
              <div style={{ fontWeight: 600 }}>Cluster #{selectedNode.community}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>PageRank:</span>
              <div style={{ fontWeight: 600, color: 'var(--color-teal)' }}>{selectedNode.pagerank?.toFixed(3)}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>In-Degree (Replies/RTs):</span>
              <div style={{ fontWeight: 600 }}>{selectedNode.inDegree}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Out-Degree (Targets):</span>
              <div style={{ fontWeight: 600 }}>{selectedNode.outDegree}</div>
            </div>
          </div>

          <strong style={{ fontSize: '11.5px', color: '#142838', textTransform: 'uppercase' }}>Recorded Links ({selectedNode.recordedLinks?.length || 0})</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            {selectedNode.recordedLinks?.map((lnk, idx) => (
              <div key={idx} style={{ padding: '6px 8px', background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '11.5px' }}>
                <code>{lnk.target}</code> ({lnk.type}, weight {lnk.weight})
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ color: '#64748b', fontSize: '12px' }}>Click any node or edge in the graph to inspect.</p>
      )}

      <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11.5px', color: '#475569' }}>
        <strong>Graph Bound Note:</strong> Displaying 7 highest betweenness nodes out of active topic scope. Full graph contains 48 peripheral mentions.
      </div>
    </div>
  );

  return (
    <div className="screen-container">
      <header className="screen-header">
        <div className="screen-route-meta">
          <span className="route-pill">/network</span>
          <span className="section-kicker">Core Intelligence</span>
        </div>
        <h1 className="screen-title">Network</h1>
        <p className="screen-question">Which groups interact, and which recorded links connect them?</p>
      </header>

      <ScreenCard
        scopeFilters={['Critical Grid Blackout Claims', 'All edge types (mention, reply, share)', 'Bursts window']}
        metricCards={[
          { label: 'Nodes', value: totalNodes, sub: 'Distinct interacting actors' },
          { label: 'Recorded edges', value: totalEdges, sub: 'Verified interaction links' },
          { label: 'Communities', value: communitiesCount, sub: 'Louvain modularity groups' }
        ]}
        primaryContent={primaryContent}
        inspectorContent={inspectorContent}
        evidenceColumns={['Relationship', 'Time', 'Evidence']}
        evidenceRows={evidenceRows}
        evidenceTitle="Network Relationship & Interaction Evidence"
      />
    </div>
  );
}
