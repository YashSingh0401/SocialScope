from typing import List, Dict, Any, Tuple
import networkx as nx


class GraphBuilder:
    """
    Constructs interaction and entity graphs from CanonicalEvent records.
    Maps actors, posts, hashtags, and their interaction paths.
    """

    def build_interaction_graph(self, events: List[Dict[str, Any]]) -> nx.DiGraph:
        """
        Builds a directed actor-interaction graph.
        Edges represent communication flows: shares, replies, and mentions.
        """
        graph = nx.DiGraph()

        for event in events:
            platform = event.get("platform", "unknown")
            author = event.get("actor_ref")
            source_id = event.get("source_id")
            timestamp = event.get("timestamp")

            if not author:
                # If author reference is missing, use source_id as fallback actor node
                author = f"anon_{source_id[:8]}" if source_id else "anonymous"

            author_node = f"actor:{platform}:{author}"
            if not graph.has_node(author_node):
                graph.add_node(author_node, type="actor", label=author, platform=platform)

            # Process explicit interactions (replies, shares, mentions)
            interactions = event.get("interactions", []) or []
            if isinstance(event.get("payload"), dict):
                interactions = interactions or event["payload"].get("interactions", [])

            for inter in interactions:
                target_platform = inter.get("target_platform", platform)
                target_id = inter.get("target_source_id")
                target_type = inter.get("target_type", "actor")
                kind = inter.get("kind", "mention")

                if not target_id:
                    continue

                target_node = f"{target_type}:{target_platform}:{target_id}"
                if not graph.has_node(target_node):
                    graph.add_node(target_node, type=target_type, label=target_id, platform=target_platform)

                # Add or update directed edge (Author -> Target)
                if graph.has_edge(author_node, target_node):
                    graph[author_node][target_node]["weight"] += 1
                    if kind not in graph[author_node][target_node]["kinds"]:
                        graph[author_node][target_node]["kinds"].append(kind)
                else:
                    graph.add_edge(
                        author_node,
                        target_node,
                        weight=1,
                        kinds=[kind],
                        last_timestamp=timestamp
                    )

            # Process text hashtags as co-occurrence entity nodes
            hashtags = event.get("hashtags", [])
            if isinstance(event.get("payload"), dict):
                hashtags = hashtags or event["payload"].get("hashtags", [])

            for tag in hashtags:
                clean_tag = tag.lstrip("#").lower()
                tag_node = f"hashtag:{clean_tag}"
                if not graph.has_node(tag_node):
                    graph.add_node(tag_node, type="hashtag", label=f"#{clean_tag}", platform=platform)

                if graph.has_edge(author_node, tag_node):
                    graph[author_node][tag_node]["weight"] += 1
                else:
                    graph.add_edge(author_node, tag_node, weight=1, kinds=["tagged"])

        return graph

    def extract_actor_subgraph(self, graph: nx.DiGraph) -> nx.DiGraph:
        """
        Projects full heterogeneous graph into an Actor-only network.
        """
        actor_nodes = [n for n, d in graph.nodes(data=True) if d.get("type") == "actor"]
        return graph.subgraph(actor_nodes).copy()
