"""Emotion and stance predictor conditioned on linguistic sentiment."""
import re
from ml.emotion.labels import EMOTION_LABELS, EMOTION_LEXICON, STANCE_LABELS


class EmotionPredictor:
    """Estimates fine-grained emotion vectors and stance from textual content."""

    def __init__(self):
        self._token_re = re.compile(r'[\w]+', re.UNICODE)

    def predict(self, text: str, sentiment: str = None) -> dict:
        """Computes emotion scores and flags high-contagion threats (e.g. panic/anger spikes)."""
        if not text or not isinstance(text, str):
            return {
                'top_emotion': 'neutral',
                'emotion_scores': {e: (1.0 if e == 'neutral' else 0.0) for e in EMOTION_LABELS},
                'stance': 'neutral',
                'is_contagion_risk': False
            }

        tokens = set(self._token_re.findall(text.lower()))

        # Raw counts per emotion
        counts = {e: 0 for e in EMOTION_LABELS}
        counts['neutral'] = 1  # Base smoothing

        for emotion, seed_words in EMOTION_LEXICON.items():
            matches = len(tokens.intersection(seed_words))
            counts[emotion] += matches * 2

        # Prior conditioning based on sentiment
        if sentiment == 'negative':
            counts['anger'] += 2
            counts['fear'] += 2
        elif sentiment == 'positive':
            counts['joy'] += 3
        elif sentiment == 'neutral':
            counts['neutral'] += 2

        total = sum(counts.values()) or 1
        scores = {e: round(counts[e] / total, 3) for e in EMOTION_LABELS}

        # Determine top emotion
        top_emotion = max(scores.items(), key=lambda x: x[1])[0]

        # Determine Stance
        if scores['anger'] >= 0.35 or sentiment == 'negative':
            stance = 'oppose'
        elif scores['joy'] >= 0.35 or sentiment == 'positive':
            stance = 'support'
        else:
            stance = 'neutral'

        # Flag contagion risk (anger + fear >= 0.45 indicates potential viral panic/rage campaign)
        is_contagion = (scores['anger'] + scores['fear']) >= 0.45

        return {
            'top_emotion': top_emotion,
            'emotion_scores': scores,
            'stance': stance,
            'is_contagion_risk': is_contagion
        }
