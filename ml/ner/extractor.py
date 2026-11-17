"""Lightweight, deterministic multilingual Named Entity Recognition (NER) extractor."""
import re
from ml.ner.entity_types import (
    ORGANIZATION_KEYWORDS,
    LOCATION_KEYWORDS,
    INFRASTRUCTURE_KEYWORDS,
    SECURITY_THREAT_KEYWORDS
)


class EntityExtractor:
    """Extracts critical intelligence entities (Organizations, Locations, Infrastructure, Threats)."""

    def __init__(self):
        # Precompile lookup patterns for gazetteers
        self._org_patterns = self._build_patterns(ORGANIZATION_KEYWORDS)
        self._loc_patterns = self._build_patterns(LOCATION_KEYWORDS)
        self._infra_patterns = self._build_patterns(INFRASTRUCTURE_KEYWORDS)
        self._threat_patterns = self._build_patterns(SECURITY_THREAT_KEYWORDS)

        self._handle_re = re.compile(r'@(\w+)', re.UNICODE)
        self._hashtag_re = re.compile(r'#(\w+)', re.UNICODE)

    def _build_patterns(self, keywords):
        sorted_kw = sorted(keywords, key=len, reverse=True)
        escaped = [re.escape(k) for k in sorted_kw]
        # Use boundary lookarounds that correctly respect Devanagari and Latin token edges
        return re.compile(r'(?<![a-zA-Z0-9\u0900-\u097F])(' + '|'.join(escaped) + r')(?![a-zA-Z0-9\u0900-\u097F])', re.IGNORECASE)

    def extract_entities(self, text: str) -> list[dict]:
        """Extracts tagged entities with offsets from text."""
        if not text or not isinstance(text, str):
            return []

        entities = []
        occupied_spans = set()

        def add_entity(match, label):
            start, end = match.span()
            # Prevent overlapping duplicate entity spans
            if any(s in occupied_spans for s in range(start, end)):
                return
            for s in range(start, end):
                occupied_spans.add(s)
            entities.append({
                'text': match.group(0),
                'label': label,
                'start': start,
                'end': end
            })

        # 1. Mention handles (@actor)
        for m in self._handle_re.finditer(text):
            add_entity(m, 'PERSON')

        # 2. Hashtags (#tag)
        for m in self._hashtag_re.finditer(text):
            add_entity(m, 'HASHTAG')

        # 3. Security Threats
        for m in self._threat_patterns.finditer(text):
            add_entity(m, 'SECURITY_THREAT')

        # 4. Critical Infrastructure
        for m in self._infra_patterns.finditer(text):
            add_entity(m, 'INFRASTRUCTURE')

        # 5. Organizations
        for m in self._org_patterns.finditer(text):
            add_entity(m, 'ORGANIZATION')

        # 6. Locations / Geopolitics
        for m in self._loc_patterns.finditer(text):
            add_entity(m, 'LOCATION')

        # Sort entities by appearance in text
        entities.sort(key=lambda x: x['start'])
        return entities
