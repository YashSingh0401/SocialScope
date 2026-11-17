import time
from ml.language.detector import detect
from ml.sentiment.predictor import SentimentModel
from ml.ner.extractor import EntityExtractor
from ml.emotion.predictor import EmotionPredictor
from ml.sentiment.registry import PIPELINE_VERSION, MODEL_ID, REVISION


class Analyzer:
    def __init__(self):
        self.sentiment = SentimentModel()
        self.ner = EntityExtractor()
        self.emotion = EmotionPredictor()

    def analyze(self, text: str) -> dict:
        """Enriches raw text with language detection, sentiment, entities, and emotion."""
        start = time.perf_counter()
        lang_res = detect(text)
        lang = lang_res.get('language')
        sent_res = self.sentiment.predict(text, lang)
        entities = self.ner.extract_entities(text)
        emotion_res = self.emotion.predict(text, sent_res.get('sentiment'))

        return {
            **lang_res,
            **sent_res,
            'entities': entities,
            'emotion': emotion_res['top_emotion'],
            'emotion_scores': emotion_res['emotion_scores'],
            'stance': emotion_res['stance'],
            'is_contagion_risk': emotion_res['is_contagion_risk'],
            'pipeline_version': PIPELINE_VERSION,
            'model_id': MODEL_ID,
            'model_revision': REVISION,
            'inference_ms': round((time.perf_counter() - start) * 1000, 2)
        }
