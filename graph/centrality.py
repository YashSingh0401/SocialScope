from typing import Dict, Any, List, Tuple
import networkx as nx


def compute_centralities(graph: nx.DiGraph) -> Dict[str, Dict[str, float]]:
    """
    Computes degree centrality, betweenness centrality, in-degree, and out-degree.
    High betweenness nodes act as bridge brokers between disjoint communities.
    """
    if len(graph) == 0:
        return {}

    num_nodes = len(graph)
    if num_nodes == 1:
        node = next(iter(graph.nodes()))
        return {
            node: {
                "degree_centrality": 0.0,
                "betweenness_centrality": 0.0,
                "in_degree": 0,
                "out_degree": 0
            }
        }

    deg = nx.degree_centrality(graph)
    try:
        # For larger graphs, betweenness can be computed exactly or sampled
        betw = nx.betweenness_centrality(graph, weight="weight", normalized=True)
    except Exception:
        betw = {n: 0.0 for n in graph.nodes()}

    results = {}
    for node in graph.nodes():
        results[node] = {
            "degree_centrality": round(deg.get(node, 0.0), 4),
            "betweenness_centrality": round(betw.get(node, 0.0), 4),
            "in_degree": int(graph.in_degree(node)),
            "out_degree": int(graph.out_degree(node))
        }

    return results


def find_bridge_nodes(graph: nx.DiGraph, top_k: int = 5) -> List[Tuple[str, float]]:
    """
    Identifies the top information bridge nodes (highest betweenness centrality).
    """
    if len(graph) < 3:
        return []

    try:
        betw = nx.betweenness_centrality(graph, weight="weight", normalized=True)
        sorted_nodes = sorted(betw.items(), key=lambda x: x[1], reverse=True)
        # Filter for nodes that have non-zero bridging value
        bridges = [(n, round(score, 4)) for n, score in sorted_nodes if score > 0.001]
        return bridges[:top_k]
    except Exception:
        return []
