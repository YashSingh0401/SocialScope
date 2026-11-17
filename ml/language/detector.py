import re
import unicodedata
from functools import lru_cache
from langid.langid import LanguageIdentifier, model


@lru_cache(maxsize=1)
def identifier():
    return LanguageIdentifier.from_modelstring(model,norm_probs=True)


def detect(text):
    text=unicodedata.normalize('NFC',text)
    text=re.sub(r'https?://\S+|@\w+',' ',text)
    if sum(c.isalpha() for c in text)<10:
        return {'language':'und','language_score':None,'language_status':'insufficient_text'}
    language,score=identifier().classify(text[:10000])
    # These are normalized model scores, not calibrated correctness probabilities.
    return {'language':language if score>=.8 else 'und','language_score':float(score),
            'language_status':'detected' if score>=.8 else 'uncertain'}
