import argparse
import time
from ml.pipeline import Analyzer
from pipelines.nlp_pipeline import process_next


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--once',action='store_true',help='Drain current backlog then exit')
    args=parser.parse_args()
    analyzer=Analyzer()
    count=0
    try:
        while True:
            event_id=process_next(analyzer)
            if event_id:
                count+=1
                print('Annotated',event_id,flush=True)
            elif args.once: break
            else: time.sleep(.5)
    except KeyboardInterrupt: pass
    print('Processed',count,'events')


if __name__=='__main__': main()
