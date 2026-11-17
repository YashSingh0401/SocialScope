"""Synthetic smoke evaluation only: not an independent accuracy benchmark."""
import json
from pathlib import Path
from statistics import mean
from ml.pipeline import Analyzer
from ml.sentiment.registry import PIPELINE_VERSION


def main():
    samples=json.loads(Path('data/samples/nlp_synthetic_checks.json').read_text())
    analyzer=Analyzer();results=[]
    for row in samples:
        result=analyzer.analyze(row['text'])
        results.append({'expected':row,'actual':result})
    labels=['negative','neutral','positive']; f1=[];matrix=[]
    for label in labels:
        tp=sum(r['expected']['sentiment']==label and r['actual']['sentiment']==label for r in results)
        fp=sum(r['expected']['sentiment']!=label and r['actual']['sentiment']==label for r in results)
        fn=sum(r['expected']['sentiment']==label and r['actual']['sentiment']!=label for r in results)
        f1.append(2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else 0)
        matrix.append([sum(r['expected']['sentiment']==label and r['actual']['sentiment']==pred for r in results) for pred in [*labels,None]])
    report={'evaluation_type':'synthetic_smoke_check_not_generalization_benchmark','sample_count':len(results),
            'pipeline_version':PIPELINE_VERSION,'language_correct':sum(r['expected']['language']==r['actual']['language'] for r in results),
            'sentiment_correct':sum(r['expected']['sentiment']==r['actual']['sentiment'] for r in results),
            'sentiment_macro_f1':mean(f1),'confusion_true_labels':labels,'confusion_predicted_labels':[*labels,'unavailable'],'confusion_matrix':matrix,
            'warm_mean_inference_ms':mean(r['actual']['inference_ms'] for r in results[1:]),'results':results,
            'limitations':['Tiny authored examples; not independent or representative.','No calibration measurement.','Hinglish, sarcasm and other languages not evaluated.','Quantized conversion not compared numerically with original model.']}
    Path('docs/experiments/nlp_smoke_results.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    print({k:v for k,v in report.items() if k!='results'})


if __name__=='__main__': main()
