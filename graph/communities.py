from typing import Dict, List, Set, Any
import networkx as nx
from networkx.algorithms.community import louvain_communities, greedy_modularity_communities


def detect_communities(graph: nx.DiGraph) -> Dict[str, Any]:
    """
    Detects modular communities in the network using Louvain or greedy modularity.
    Returns community assignments and cluster sizes.
    """
    if len(graph) == 0:
        return {"node_community_map": {}, "communities": {}, "community_count": 0}

    # Convert to undirected graph for community detection
    undirected = graph.to_undirected()

    if len(undirected.edges()) == 0:
        # Every node is in its own cluster if no edges exist
        node_map = {n: idx for idx, n in enumerate(graph.nodes())}
        return {
            "node_community_map": node_map,
            "communities": {idx: [n] for n, idx in node_map.items()},
            "community_count": len(node_map)
        }

    try:
        # Louvain community detection (fast and standard in modern NetworkX)
        comm_sets: List[Set[str]] = list(louvain_communities(undirected, weight="weight", seed=42))
    except Exception:
        try:
            comm_sets = list(greedy_modularity_communities(undirected, weight="weight"))
        except Exception:
            # Fallback connected components
            comm_sets = list(nx.connected_components(undirected))

    node_community_map = {}
    communities_dict = {}

    for cid, members in enumerate(comm_sets):
        member_list = sorted(list(members))
        communities_dict[cid] = member_list
        for m in member_list:
            node_community_map[m] = cid

    return {
        "node_community_map": node_community_map,
        "communities": communities_dict,
        "community_count": len(comm_sets)
    }
