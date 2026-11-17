from pathlib import Path
import os

MODEL_ID = 'onnx-community/twitter-xlm-roberta-base-sentiment-ONNX'
REVISION = '3112e85dea04f0019bf01282916588e3c9dd9bc8'
PIPELINE_VERSION = 'langid-1.1.6_xlmt-int8-' + REVISION[:12] + '_v1'
MODEL_DIR = Path(os.environ.get('SOCIALSCOPE_MODEL_DIR', str(Path(__file__).resolve().parents[2] / '.runtime/models/sentiment')))
SUPPORTED_LANGUAGES = {'ar','en','fr','de','hi','it','es','pt'}
