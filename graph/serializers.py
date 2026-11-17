from typing import Dict, Any, List
import networkx as nx
from graph.pagerank import compute_pagerank, top_influencers
from graph.centrality import compute_centralities, find_bridge_nodes
from graph.communities import detect_communities


def serialize_to_cytoscape(graph: nx.DiGraph, max_nodes: int = 150) -> Dict[str, Any]:
    """
    Serializes a NetworkX DiGraph and its analytical metrics into Cytoscape-compatible JSON.
    Includes PageRank, Betweenness Centrality, and Louvain Communities.
    """
    if len(graph) == 0:
        return {
            "elements": {"nodes": [], "edges": []},
            "metrics": {
                "total_nodes": 0,
                "total_edges": 0,
                "communities_count": 0,
                "top_influencers": [],
                "bridge_nodes": []
            }
        }

    # Compute graph metrics
    pr_scores = compute_pagerank(graph)
    centralities = compute_centralities(graph)
    comm_data = detect_communities(graph)
    bridges = dict(find_bridge_nodes(graph, top_k=10))
    influencers = top_influencers(graph, top_k=10)

    # If graph is too large, select top nodes by PageRank and degree to prevent browser lag
    if len(graph) > max_nodes:
        top_node_ids = set([n for n, _ in sorted(pr_scores.items(), key=lambda x: x[1], reverse=True)[:max_nodes]])
        active_subgraph = graph.subgraph(top_node_ids)
    else:
        active_subgraph = graph

    nodes_json = []
    for node_id, data in active_subgraph.nodes(data=True):
        cents = centralities.get(node_id, {})
        nodes_json.append({
            "data": {
                "id": str(node_id),
                "label": str(data.get("label", node_id)),
                "type": str(data.get("type", "actor")),
                "platform": str(data.get("platform", "unknown")),
                "pagerank": pr_scores.get(node_id, 0.0),
                "betweenness": cents.get("betweenness_centrality", 0.0),
                "in_degree": cents.get("in_degree", 0),
                "out_degree": cents.get("out_degree", 0),
                "community": comm_data["node_community_map"].get(node_id, 0),
                "is_bridge": node_id in bridges
            }
        })

    edges_json = []
    edge_idx = 0
    for u, v, data in active_subgraph.edges(data=True):
        edges_json.append({
            "data": {
                "id": f"e_{edge_idx}",
                "source": str(u),
                "target": str(v),
                "weight": int(data.get("weight", 1)),
                "kinds": data.get("kinds", ["interaction"])
            }
        })
        edge_idx += 1

    return {
        "elements": {
            "nodes": nodes_json,
            "edges": edges_json
        },
        "metrics": {
            "total_nodes": len(active_subgraph),
            "total_edges": len(edges_json),
            "communities_count": comm_data["community_count"],
            "top_influencers": [{"node": n, "score": s} for n, s in influencers],
            "bridge_nodes": [{"node": n, "betweenness": s} for n, s in bridges.items()]
        }
    }
