import re
from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


class TopicLabeler:
    """
    Extracts representative keywords and exemplar posts for topic clusters.
    Produces human-readable labels for intelligence analysts.
    """

    def __init__(self, top_k_keywords: int = 5):
        self.top_k_keywords = top_k_keywords

    def label_cluster(self, cluster_events: List[Dict[str, Any]], centroid: List[float] = None) -> Dict[str, Any]:
        """
        Generates topic keywords and exemplar post for a cluster of events.
        """
        if not cluster_events:
            return {
                "label": "Unassigned Topic",
                "keywords": [],
                "exemplar_text": "",
                "exemplar_id": None
            }

        texts = [e.get("text", "") for e in cluster_events]

        # Extract top keywords using TF-IDF
        try:
            vectorizer = TfidfVectorizer(
                max_features=20,
                ngram_range=(1, 2),
                stop_words="english",
                token_pattern=r"(?u)\b[a-zA-Z0-9_\u0900-\u097F]{3,}\b"  # Supports English and Devanagari/Hindi script!
            )
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            scores = np.asarray(tfidf_matrix.sum(axis=0)).ravel()

            top_indices = scores.argsort()[::-1][:self.top_k_keywords]
            keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
        except Exception:
            # Fallback simple frequency extraction
            words = []
            for t in texts:
                words.extend(re.findall(r"\b[a-zA-Z]{4,}\b", t.lower()))
            freq = {}
            for w in words:
                freq[w] = freq.get(w, 0) + 1
            sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
            keywords = [w for w, _ in sorted_words[:self.top_k_keywords]]

        # Find exemplar post closest to centroid (or longest informative text as fallback)
        exemplar_event = cluster_events[0]
        if centroid is not None and "_embedding" in cluster_events[0]:
            centroid_arr = np.array(centroid)
            best_sim = -1.0
            for ev in cluster_events:
                emb = np.array(ev["_embedding"])
                sim = float(np.dot(emb, centroid_arr))
                if sim > best_sim:
                    best_sim = sim
                    exemplar_event = ev
        else:
            # Pick the most substantial text
            exemplar_event = max(cluster_events, key=lambda e: len(e.get("text", "")))

        exemplar_text = exemplar_event.get("text", "")
        exemplar_id = str(exemplar_event.get("event_id"))

        # Build clean label
        primary_keywords = ", ".join(k.capitalize() for k in keywords[:3])
        snippet = exemplar_text[:60] + "..." if len(exemplar_text) > 60 else exemplar_text
        label = f"{primary_keywords} — \"{snippet}\"" if primary_keywords else f"Topic ({len(cluster_events)} events)"

        return {
            "label": label,
            "keywords": keywords,
            "exemplar_text": exemplar_text,
            "exemplar_id": exemplar_id
        }
