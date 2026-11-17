import unittest
from ml.embeddings.embedder import TextEmbedder
from ml.topics.clustering import TopicClusterer
from ml.topics.labeling import TopicLabeler


class TopicTests(unittest.TestCase):
    def setUp(self):
        self.embedder = TextEmbedder(dimension=32)
        self.clusterer = TopicClusterer(embedder=self.embedder, distance_threshold=0.96, min_samples=2)
        self.labeler = TopicLabeler(top_k_keywords=4)

    def test_clusters_semantically_related_posts(self):
        events = [
            # Topic A: Earthquake and rescue operations
            {"event_id": "ev-1", "text": "Earthquake reported near the coast. Search and rescue teams mobilized."},
            {"event_id": "ev-2", "text": "Massive earthquake tremors felt. Emergency rescue workers dispatched."},
            {"event_id": "ev-3", "text": "Coast hit by earthquake. Rescue operations underway for victims."},
            # Topic B: Financial markets / crypto
            {"event_id": "ev-4", "text": "Stock market hits new record highs as inflation drops."},
            {"event_id": "ev-5", "text": "Crypto and stocks rally strongly following market interest rate cuts."}
        ]

        result = self.clusterer.cluster_events(events)
        clusters = result["clusters"]

        # Expect at least one or two distinct clusters formed
        self.assertGreater(len(clusters), 0)
        self.assertEqual(result["total_events"], 5)

        # Verify cluster labeling
        first_cluster_id = list(clusters.keys())[0]
        cluster_events = result["cluster_events"][first_cluster_id]
        centroid = clusters[first_cluster_id]["centroid"]

        label_info = self.labeler.label_cluster(cluster_events, centroid)
        self.assertIn("keywords", label_info)
        self.assertGreater(len(label_info["keywords"]), 0)
        self.assertIn("exemplar_text", label_info)
        self.assertTrue(len(label_info["label"]) > 0)

    def test_handles_insufficient_samples(self):
        events = [{"event_id": "ev-solo", "text": "A lone random post without peers."}]
        result = self.clusterer.cluster_events(events)
        self.assertEqual(len(result["clusters"]), 0)
        self.assertEqual(result["noise_count"], 1)
        self.assertEqual(result["event_cluster_map"]["ev-solo"], -1)


if __name__ == "__main__":
    unittest.main()
