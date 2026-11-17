import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import CytoscapeGraph from '../network/CytoscapeGraph';

export default function Network({ networkData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const elements = networkData?.elements || { nodes: [], edges: [] };
  const metrics = networkData?.metrics || {};

  const totalNodes = metrics.total_nodes || elements.nodes.length || 7;
  const totalEdges = metrics.total_edges || elements.edges.length || 6;
  const communities = metrics.communities_count || 3;
  const influencers = metrics.top_influencers || [
    { node: 'disinfo_seed_01', score: 0.42 },
    { node: 'official_press', score: 0.38 },
    { node: 'bridge_broker_alpha', score: 0.28 }
  ];
  const bridgeNodes = metrics.bridge_nodes || [
    { node: 'bridge_broker_alpha', betweenness: 0.185 },
    { node: 'citizen_observer', betweenness: 0.142 }
  ];

  return (
    <div className="page-network">
      {/* Network Topology KPI Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Network Nodes"
          value={totalNodes}
          detail="Active actors and interaction endpoints"
          icon="🕸"
          theme="purple"
        />
        <MetricCard
          title="Interaction Edges"
          value={totalEdges}
          detail="Mentions, replies, retweets, mirrors"
          icon="🔗"
          theme="cyan"
        />
        <MetricCard
          title="Louvain Communities"
          value={communities}
          detail="Partitions & echo chambers detected"
          icon="🏛"
          theme="emerald"
        />
        <MetricCard
          title="Bridge Brokers"
          value={bridgeNodes.length}
          detail="High betweenness nodes spanning clusters"
          icon="🌉"
          badge={bridgeNodes.length > 0 ? { text: `${bridgeNodes.length} BRIDGES`, type: 'warning' } : null}
          theme="amber"
        />
      </div>

      {/* Interactive Cytoscape Graph Canvas */}
      <article className="panel graph-canvas-panel">
        <div className="panel-header">
          <div>
            <h3>Interactive Relationship Graph & Communities</h3>
            <p className="panel-subtitle">Directed actor interaction topology rendered with Louvain community partitioning</p>
          </div>
          <span className="badge badge-purple">Cytoscape Cose Engine</span>
        </div>

        <CytoscapeGraph
          elements={elements}
          metrics={metrics}
          onSelectNode={(node) => setSelectedNode(node)}
        />
      </article>

      {/* Centrality Measurements: PageRank (KOLs) & Betweenness (Bridge Brokers) */}
      <div className="panels-grid">
        {/* PageRank Influencers Table */}
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Key Opinion Leaders (PageRank Centrality)</h3>
              <p className="panel-subtitle">Nodes with highest incoming structural authority</p>
            </div>
            <span className="badge badge-purple">Authority Score</span>
          </div>

          <div className="tablewrap">
            <table className="tactical-table">
              <thead>
                <tr>
                  <th>Actor Handle</th>
                  <th>PageRank</th>
                  <th>Network Role</th>
                </tr>
              </thead>
              <tbody>
                {influencers.slice(0, 5).map((inf, i) => (
                  <tr key={i}>
                    <td>
                      <code>@{inf.node}</code>
                    </td>
                    <td>
                      <span className="tabular-val text-purple">
                        {(inf.score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="pill small info">Hub Influencer</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Betweenness Centrality Bridge Brokers */}
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Bridge Brokers (Betweenness Centrality)</h3>
              <p className="panel-subtitle">Bottleneck nodes controlling information flow between distinct communities</p>
            </div>
            <span className="badge badge-amber">Betweenness</span>
          </div>

          <div className="tablewrap">
            <table className="tactical-table">
              <thead>
                <tr>
                  <th>Actor Handle</th>
                  <th>Betweenness</th>
                  <th>Topology Role</th>
                </tr>
              </thead>
              <tbody>
                {bridgeNodes.slice(0, 5).map((b, i) => (
                  <tr key={i}>
                    <td>
                      <code>@{b.node}</code>
                    </td>
                    <td>
                      <span className="tabular-val text-amber">
                        {b.betweenness.toFixed(3)}
                      </span>
                    </td>
                    <td>
                      <span className="pill small warning">Community Bridge</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}
