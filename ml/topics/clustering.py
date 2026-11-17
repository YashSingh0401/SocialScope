from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics.pairwise import cosine_distances
from ml.embeddings.embedder import TextEmbedder


class TopicClusterer:
    """
    Semantic topic clustering for social media posts.
    Groups semantically related posts into coherent topic clusters.
    """

    def __init__(
        self,
        embedder: TextEmbedder = None,
        distance_threshold: float = 0.95,
        eps: float = None,
        min_samples: int = 2
    ):
        self.embedder = embedder or TextEmbedder(dimension=64)
        self.distance_threshold = eps if eps is not None else distance_threshold
        self.min_samples = min_samples

    def cluster_events(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Clusters a list of event dicts (must have 'event_id' and 'text').
        Returns cluster assignments, centroids, and cluster metadata.
        """
        if not events:
            return {"clusters": {}, "noise_count": 0, "total_events": 0, "event_cluster_map": {}}

        if len(events) < self.min_samples:
            return {
                "clusters": {},
                "noise_count": len(events),
                "total_events": len(events),
                "event_cluster_map": {str(e["event_id"]): -1 for e in events}
            }

        texts = [e.get("text", "") for e in events]
        embeddings = self.embedder.fit_transform(texts)
        dist_matrix = cosine_distances(embeddings)

        # Clip negative rounding errors
        np.clip(dist_matrix, 0.0, 2.0, out=dist_matrix)

        clustering = AgglomerativeClustering(
            metric='precomputed',
            linkage='average',
            distance_threshold=self.distance_threshold,
            n_clusters=None
        )
        raw_labels = clustering.fit_predict(dist_matrix)

        # Count cluster sizes to filter out singleton outliers (noise)
        label_counts: Dict[int, int] = {}
        for l in raw_labels:
            label_counts[l] = label_counts.get(l, 0) + 1

        clusters: Dict[int, List[Dict[str, Any]]] = {}
        event_cluster_map: Dict[str, int] = {}
        noise_count = 0

        # Renumber valid clusters (>= min_samples) starting from 0, singletons as -1
        valid_cluster_mapping: Dict[int, int] = {}
        next_cid = 0

        for raw_cid, count in label_counts.items():
            if count >= self.min_samples:
                valid_cluster_mapping[raw_cid] = next_cid
                next_cid += 1

        for idx, (event, raw_cid) in enumerate(zip(events, raw_labels)):
            event_id = str(event["event_id"])
            if raw_cid in valid_cluster_mapping:
                cid = valid_cluster_mapping[raw_cid]
                event_cluster_map[event_id] = cid
                if cid not in clusters:
                    clusters[cid] = []
                event_with_vector = dict(event)
                event_with_vector["_embedding"] = embeddings[idx]
                clusters[cid].append(event_with_vector)
            else:
                event_cluster_map[event_id] = -1
                noise_count += 1

        # Calculate centroids for each cluster
        cluster_summaries = {}
        for cid, items in clusters.items():
            cluster_vectors = np.array([item["_embedding"] for item in items])
            centroid = np.mean(cluster_vectors, axis=0)
            norm = np.linalg.norm(centroid)
            if norm > 0:
                centroid = centroid / norm

            cluster_summaries[cid] = {
                "cluster_id": cid,
                "size": len(items),
                "event_ids": [str(item["event_id"]) for item in items],
                "centroid": centroid.tolist()
            }

        return {
            "clusters": cluster_summaries,
            "cluster_events": clusters,
            "noise_count": noise_count,
            "total_events": len(events),
            "event_cluster_map": event_cluster_map
        }
