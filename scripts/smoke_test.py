"""Check the file importer and real HTTP API against PostgreSQL."""
import json
import subprocess
import sys
import time
import urllib.request

command = [sys.executable, '-m', 'scripts.import_dataset',
           'data/samples/synthetic_events.json', '--dataset-name', 'synthetic-foundation']
first = json.loads(subprocess.check_output(command, text=True))
second = json.loads(subprocess.check_output(command, text=True))
assert second['inserted'] == 0 and second['duplicates'] == second['received']
print('File imports:', first, second)
server = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'backend.app.main:app',
                           '--host', '127.0.0.1', '--port', '8001'],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8001/ready', timeout=2) as r:
                assert r.status == 200
            break
        except OSError:
            time.sleep(0.1)
    else:
        raise RuntimeError('API did not become ready')
    with urllib.request.urlopen('http://127.0.0.1:8001/events/query?platform=dataset') as r:
        payload = json.load(r)
    assert any(item['source_id'] == 'synthetic-001' for item in payload['items'])
    print('Live HTTP readiness and stored event query: passed')
finally:
    server.terminate()
    server.wait(timeout=5)
