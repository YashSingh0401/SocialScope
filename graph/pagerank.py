from typing import Dict, Any, List, Tuple
import networkx as nx


def compute_pagerank(graph: nx.DiGraph, alpha: float = 0.85, max_iter: int = 100) -> Dict[str, float]:
    """
    Computes PageRank influence scores for nodes in the directed network.
    Gracefully handles empty or disconnected graphs.
    """
    if len(graph) == 0:
        return {}
    if len(graph) == 1:
        node = next(iter(graph.nodes()))
        return {node: 1.0}

    try:
        scores = nx.pagerank(graph, alpha=alpha, weight="weight", max_iter=max_iter)
    except Exception:
        # Fallback to unweighted or uniform distribution if convergence fails
        try:
            scores = nx.pagerank(graph, alpha=alpha, max_iter=200)
        except Exception:
            scores = {n: 1.0 / len(graph) for n in graph.nodes()}

    return {k: round(v, 6) for k, v in scores.items()}


def top_influencers(graph: nx.DiGraph, top_k: int = 10) -> List[Tuple[str, float]]:
    """
    Returns the top K highest-scoring influencer nodes by PageRank.
    """
    scores = compute_pagerank(graph)
    sorted_nodes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_nodes[:top_k]
