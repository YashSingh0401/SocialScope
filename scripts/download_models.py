"""Download immutable model artifacts; no remote Python code is executed."""
import hashlib
import json
import urllib.request
from ml.sentiment.registry import MODEL_DIR, MODEL_ID, REVISION


def main():
    MODEL_DIR.mkdir(parents=True,exist_ok=True)
    manifest={'model_id':MODEL_ID,'revision':REVISION,'files':{}}
    for name in ['config.json','tokenizer.json','onnx/model_quantized.onnx']:
        target=MODEL_DIR/name.split('/')[-1]
        temp=target.with_suffix(target.suffix+'.download')
        urllib.request.urlretrieve(f'https://huggingface.co/{MODEL_ID}/resolve/{REVISION}/{name}',temp)
        temp.replace(target)
        manifest['files'][target.name]=hashlib.sha256(target.read_bytes()).hexdigest()
        print('Downloaded',target.name,flush=True)
    (MODEL_DIR/'manifest.json').write_text(json.dumps(manifest,indent=2))


if __name__=='__main__': main()
