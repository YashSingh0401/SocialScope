import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import CytoscapeGraph from '../network/CytoscapeGraph';

export default function Network({ networkData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const elements = networkData?.elements || { nodes: [], edges: [] };
  const metrics = networkData?.metrics || {};

  const totalNodes = metrics.total_nodes || elements.nodes.length || 0;
  const totalEdges = metrics.total_edges || elements.edges.length || 0;
  const communities = metrics.communities_count || 1;
  const influencers = metrics.top_influencers || [];
  const bridgeNodes = metrics.bridge_nodes || [];

  return (
    <div className="page-network">
      <div className="metrics-grid">
        <MetricCard
          title="Network Nodes"
          value={totalNodes}
          detail="Active actors and mention targets"
          icon="🕸"
        />
        <MetricCard
          title="Interactions"
          value={totalEdges}
          detail="Replies, shares, mentions"
          icon="🔗"
        />
        <MetricCard
          title="Louvain Communities"
          value={communities}
          detail="Echo chambers detected"
          icon="🏛"
        />
        <MetricCard
          title="Bridge Brokers"
          value={bridgeNodes.length}
          detail="High betweenness nodes"
          icon="🌉"
          badge={bridgeNodes.length > 0 ? { text: 'MONITORED', type: 'warning' } : null}
        />
      </div>

      <article className="panel graph-canvas-panel">
        <div className="panel-header">
          <div>
            <h3>Interaction Graph & Community Clusters</h3>
            <p className="panel-subtitle">Directed actor relationships rendered via Cytoscape engine</p>
          </div>
          <span className="badge">FORCE-DIRECTED CYTOSCAPE</span>
        </div>

        <CytoscapeGraph
          elements={elements}
          metrics={metrics}
          onSelectNode={(node) => setSelectedNode(node)}
        />
      </article>

      <div className="panels-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Key Opinion Leaders (KOLs)</h3>
              <p className="panel-subtitle">Ranked by PageRank network authority</p>
            </div>
            <span className="badge">PAGERANK</span>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Actor Node</th>
                  <th>PageRank Score</th>
                  <th>Network Role</th>
                </tr>
              </thead>
              <tbody>
                {influencers.slice(0, 10).map((inf, i) => (
                  <tr key={i}>
                    <td><code>{inf.node}</code></td>
                    <td>
                      <span className="pill info small">
                        {(inf.score * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td><small>Hub Influencer</small></td>
                  </tr>
                ))}
                {!influencers.length && (
                  <tr>
                    <td colSpan="3" className="muted" style={{ textAlign: 'center' }}>
                      No PageRank calculations available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3>Information Bridge Brokers</h3>
              <p className="panel-subtitle">Connecting otherwise isolated communities</p>
            </div>
            <span className="badge">BETWEENNESS</span>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Bridge Node</th>
                  <th>Betweenness Centrality</th>
                  <th>Propagation Risk</th>
                </tr>
              </thead>
              <tbody>
                {bridgeNodes.slice(0, 10).map((br, i) => (
                  <tr key={i}>
                    <td><code>{br.node}</code></td>
                    <td><b>{typeof br.betweenness === 'number' ? br.betweenness.toFixed(4) : br.betweenness}</b></td>
                    <td>
                      <span className="pill warning small">Cross-Chamber Vector</span>
                    </td>
                  </tr>
                ))}
                {!bridgeNodes.length && (
                  <tr>
                    <td colSpan="3" className="muted" style={{ textAlign: 'center' }}>
                      No bridge nodes detected in current graph.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h3>Interaction Edges Ledger</h3>
            <p className="panel-subtitle">Directed interactions between actors</p>
          </div>
          <span className="badge">{elements.edges.length} EDGES</span>
        </div>

        <div className="tablewrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Source Actor</th>
                <th>Interaction Kinds</th>
                <th>Target Actor</th>
                <th>Edge Weight</th>
              </tr>
            </thead>
            <tbody>
              {elements.edges.slice(0, 50).map((e, idx) => (
                <tr key={idx}>
                  <td><code>{e.data?.source}</code></td>
                  <td>
                    <span className="pill small neutral">
                      {(e.data?.kinds || [e.data?.label || 'interaction']).join(', ')}
                    </span>
                  </td>
                  <td><code>{e.data?.target}</code></td>
                  <td><b>{e.data?.weight || 1}</b></td>
                </tr>
              ))}
              {!elements.edges.length && (
                <tr>
                  <td colSpan="4" className="muted" style={{ textAlign: 'center' }}>
                    No edge connections recorded.
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
