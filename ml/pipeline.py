import time
from ml.language.detector import detect
from ml.sentiment.predictor import SentimentModel
from ml.sentiment.registry import PIPELINE_VERSION, MODEL_ID, REVISION


class Analyzer:
    def __init__(self): self.sentiment=SentimentModel()

    def analyze(self,text):
        start=time.perf_counter()
        language=detect(text)
        sentiment=self.sentiment.predict(text,language['language'])
        return {**language,**sentiment,'pipeline_version':PIPELINE_VERSION,'model_id':MODEL_ID,
                'model_revision':REVISION,'inference_ms':round((time.perf_counter()-start)*1000,2)}
