import unittest
import networkx as nx
from graph.builder import GraphBuilder
from graph.pagerank import compute_pagerank, top_influencers
from graph.centrality import compute_centralities, find_bridge_nodes
from graph.communities import detect_communities
from graph.serializers import serialize_to_cytoscape


class GraphTests(unittest.TestCase):
    def setUp(self):
        self.builder = GraphBuilder()

    def test_builds_interaction_graph_from_events(self):
        events = [
            {
                "platform": "x",
                "source_id": "post-1",
                "actor_ref": "user_alpha",
                "text": "Hello world #ai",
                "hashtags": ["ai"],
                "interactions": [
                    {"kind": "mention", "target_type": "actor", "target_source_id": "user_beta", "target_platform": "x"}
                ]
            },
            {
                "platform": "x",
                "source_id": "post-2",
                "actor_ref": "user_beta",
                "text": "Replying to alpha #ai",
                "hashtags": ["ai"],
                "interactions": [
                    {"kind": "reply", "target_type": "actor", "target_source_id": "user_alpha", "target_platform": "x"}
                ]
            }
        ]

        graph = self.builder.build_interaction_graph(events)
        self.assertIn("actor:x:user_alpha", graph.nodes)
        self.assertIn("actor:x:user_beta", graph.nodes)
        self.assertIn("hashtag:ai", graph.nodes)
        self.assertTrue(graph.has_edge("actor:x:user_alpha", "actor:x:user_beta"))
        self.assertTrue(graph.has_edge("actor:x:user_beta", "actor:x:user_alpha"))

    def test_pagerank_identifies_hub_influencer(self):
        g = nx.DiGraph()
        # Node C is pointed to by A, B, D, E (major hub)
        g.add_edge("A", "C", weight=1)
        g.add_edge("B", "C", weight=1)
        g.add_edge("D", "C", weight=1)
        g.add_edge("E", "C", weight=1)
        g.add_edge("C", "A", weight=1)

        scores = compute_pagerank(g)
        self.assertEqual(max(scores, key=scores.get), "C")
        influencers = top_influencers(g, top_k=2)
        self.assertEqual(influencers[0][0], "C")

    def test_betweenness_identifies_bridge_node(self):
        g = nx.DiGraph()
        # Cluster 1: A <-> B
        g.add_edge("A", "B", weight=1)
        g.add_edge("B", "A", weight=1)
        # Bridge: B <-> Bridge <-> C
        g.add_edge("B", "Bridge", weight=1)
        g.add_edge("Bridge", "B", weight=1)
        g.add_edge("Bridge", "C", weight=1)
        g.add_edge("C", "Bridge", weight=1)
        # Cluster 2: C <-> D
        g.add_edge("C", "D", weight=1)
        g.add_edge("D", "C", weight=1)

        bridges = find_bridge_nodes(g, top_k=1)
        self.assertEqual(len(bridges), 1)
        self.assertEqual(bridges[0][0], "Bridge")

    def test_community_detection_partitions_graph(self):
        g = nx.DiGraph()
        # Clique 1
        g.add_edge("1", "2")
        g.add_edge("2", "3")
        g.add_edge("3", "1")
        # Clique 2
        g.add_edge("A", "B")
        g.add_edge("B", "C")
        g.add_edge("C", "A")

        comm_data = detect_communities(g)
        self.assertEqual(comm_data["community_count"], 2)
        self.assertEqual(
            comm_data["node_community_map"]["1"],
            comm_data["node_community_map"]["2"]
        )
        self.assertNotEqual(
            comm_data["node_community_map"]["1"],
            comm_data["node_community_map"]["A"]
        )

    def test_cytoscape_serialization_format(self):
        g = nx.DiGraph()
        g.add_node("user_1", type="actor", label="User One", platform="x")
        g.add_node("user_2", type="actor", label="User Two", platform="x")
        g.add_edge("user_1", "user_2", weight=2, kinds=["reply"])

        cyto = serialize_to_cytoscape(g)
        self.assertIn("elements", cyto)
        self.assertEqual(len(cyto["elements"]["nodes"]), 2)
        self.assertEqual(len(cyto["elements"]["edges"]), 1)
        self.assertEqual(cyto["metrics"]["total_nodes"], 2)
        self.assertEqual(cyto["metrics"]["total_edges"], 1)


if __name__ == "__main__":
    unittest.main()
