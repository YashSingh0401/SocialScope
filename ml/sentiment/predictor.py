import json
import re
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
from ml.sentiment.registry import MODEL_DIR, SUPPORTED_LANGUAGES


class SentimentModel:
    def __init__(self):
        options=ort.SessionOptions()
        options.intra_op_num_threads=2
        self.session=ort.InferenceSession(str(MODEL_DIR/'model_quantized.onnx'),sess_options=options,
                                          providers=['CPUExecutionProvider'])
        self.tokenizer=Tokenizer.from_file(str(MODEL_DIR/'tokenizer.json'))
        self.tokenizer.enable_truncation(max_length=256)
        config=json.loads((MODEL_DIR/'config.json').read_text())
        self.labels={int(k):v.lower() for k,v in config['id2label'].items()}
        if set(self.labels.values())!={'negative','neutral','positive'}:
            raise ValueError('Unexpected sentiment label mapping')

    def predict(self,text,language):
        if language not in SUPPORTED_LANGUAGES:
            return {'sentiment':None,'sentiment_score':None,'probabilities':{},
                    'sentiment_status':'unsupported_language','truncated':False}
        text=re.sub(r'https?://\S+','http',text)
        text=re.sub(r'@\w+','@user',text)
        # Overflow captures whether the 256-token budget omitted any content.
        tokens=self.tokenizer.encode(text)
        values={'input_ids':np.array([tokens.ids],dtype=np.int64),
                'attention_mask':np.array([tokens.attention_mask],dtype=np.int64)}
        logits=self.session.run(None,{i.name:values[i.name] for i in self.session.get_inputs()})[0][0]
        probs=np.exp(logits-logits.max()); probs=probs/probs.sum()
        best=int(np.argmax(probs))
        return {'sentiment':self.labels[best],'sentiment_score':float(probs[best]),
                'probabilities':{self.labels[i]:float(v) for i,v in enumerate(probs)},
                'sentiment_status':'predicted','truncated':bool(tokens.overflowing)}
