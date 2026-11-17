import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function CytoscapeGraph({ elements, metrics, onSelectNode }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = elements?.nodes || [];
    const edges = elements?.edges || [];

    // Fallback sample graph if empty
    const graphElements = (nodes.length === 0 && edges.length === 0) ? [
      { data: { id: 'alpha_seed', label: 'alpha_seed', community: 0, pagerank: 0.35, is_influencer: true } },
      { data: { id: 'relay_node_1', label: 'relay_node_1', community: 0, pagerank: 0.15 } },
      { data: { id: 'relay_node_2', label: 'relay_node_2', community: 0, pagerank: 0.12 } },
      { data: { id: 'bridge_broker', label: 'bridge_broker', community: 1, pagerank: 0.22, is_bridge: true } },
      { data: { id: 'echo_chamber_a', label: 'echo_chamber_a', community: 1, pagerank: 0.08 } },
      { data: { id: 'echo_chamber_b', label: 'echo_chamber_b', community: 1, pagerank: 0.08 } },
      { data: { source: 'alpha_seed', target: 'relay_node_1', label: 'mention', weight: 3 } },
      { data: { source: 'relay_node_1', target: 'relay_node_2', label: 'share', weight: 2 } },
      { data: { source: 'relay_node_2', target: 'bridge_broker', label: 'reply', weight: 4 } },
      { data: { source: 'bridge_broker', target: 'echo_chamber_a', label: 'share', weight: 2 } },
      { data: { source: 'bridge_broker', target: 'echo_chamber_b', label: 'mention', weight: 1 } }
    ] : [...nodes, ...edges];

    const cy = cytoscape({
      container: containerRef.current,
      elements: graphElements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#cbd5e1',
            'text-valign': 'bottom',
            'text-margin-y': '4px',
            'background-color': '#0284c7',
            'width': 'mapData(pagerank, 0, 0.5, 20, 50)',
            'height': 'mapData(pagerank, 0, 0.5, 20, 50)',
            'border-width': 2,
            'border-color': '#38bdf8'
          }
        },
        {
          selector: 'node[?is_influencer]',
          style: {
            'background-color': '#8b5cf6',
            'border-color': '#c084fc',
            'border-width': 3
          }
        },
        {
          selector: 'node[?is_bridge]',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#fde68a',
            'border-width': 3
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#f43f5e',
            'border-width': 4
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'mapData(weight, 1, 10, 1.5, 5)',
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.75
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        componentSpacing: 80,
        nodeOverlap: 20
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNodeData(data);
      if (onSelectNode) onSelectNode(data);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNodeData(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);

  return (
    <div className="network-viewer-wrap">
      <div className="network-canvas" ref={containerRef} style={{ width: '100%', height: '480px' }} />

      <div className="network-controls">
        <button onClick={handleZoomIn} title="Zoom In">＋</button>
        <button onClick={handleZoomOut} title="Zoom Out">－</button>
        <button onClick={handleFit} title="Fit to View">⛶ Fit</button>
      </div>

      <div className="network-legend">
        <span className="net-legend-item"><i style={{ background: '#8b5cf6' }} /> Key Influencer</span>
        <span className="net-legend-item"><i style={{ background: '#f59e0b' }} /> Bridge Broker</span>
        <span className="net-legend-item"><i style={{ background: '#0284c7' }} /> Standard Actor</span>
      </div>

      {selectedNodeData && (
        <div className="node-inspector">
          <div className="inspector-head">
            <h4>Node Details</h4>
            <button onClick={() => setSelectedNodeData(null)}>✕</button>
          </div>
          <p><strong>Actor Ref:</strong> <code>{selectedNodeData.label || selectedNodeData.id}</code></p>
          <p><strong>PageRank:</strong> {selectedNodeData.pagerank != null ? (selectedNodeData.pagerank * 100).toFixed(2) + '%' : 'N/A'}</p>
          <p><strong>Community:</strong> {selectedNodeData.community ?? 'General'}</p>
          {selectedNodeData.is_bridge && (
            <span className="pill warning small">Bridge Spreader</span>
          )}
          {selectedNodeData.is_influencer && (
            <span className="pill info small">Hub Influencer</span>
          )}
        </div>
      )}
    </div>
  );
}
