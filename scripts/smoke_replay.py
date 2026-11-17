"""Real HTTP control plus two separate worker processes demonstrate resumption."""
import json
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys
import time
import urllib.request


def request(path, data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request('http://127.0.0.1:8002'+path,data=body,
                                 headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req,timeout=5) as response:
        return json.load(response)


def main():
    server=subprocess.Popen([sys.executable,'-m','uvicorn','backend.app.main:app',
                              '--host','127.0.0.1','--port','8002'],
                             stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                request('/ready')
                break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('API did not start')
        events=json.loads(Path('data/samples/synthetic_replay.json').read_text())
        job=request('/replays',{'dataset_name':'synthetic replay demonstration','events':events,'immediate':True})
        replay_id=job['replay_id']
        request(f'/replays/{replay_id}/pause',{})
        assert request(f'/replays/{replay_id}')['status']=='paused'
        request(f'/replays/{replay_id}/resume',{})
        subprocess.run([sys.executable,'-m','scripts.replay_worker','--max-events','1',
                        '--idle-timeout','1'],check=True)
        assert request(f'/replays/{replay_id}')['processed']==1
        subprocess.run([sys.executable,'-m','scripts.replay_worker','--idle-timeout','.3'],check=True)
        state=request(f'/replays/{replay_id}')
        assert state['status']=='completed' and state['processed']==len(events)
        assert datetime.fromisoformat(state['virtual_time']) == datetime(2026,1,1,0,2,tzinfo=timezone.utc)
        print('Live API pause/resume and worker-process restart passed:',
              json.dumps({k:state[k] for k in ['status','processed','inserted','duplicates','conflicts']}))
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == '__main__':
    main()
