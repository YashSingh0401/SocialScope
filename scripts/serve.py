"""Run the local API and replay worker together under scripts.run_with_db."""
import argparse
import os
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=os.environ.get("PORT", "8000"))
    parser.add_argument("--strictPort", action="store_true", help="Compatibility with preview launcher; uvicorn always uses the requested port")
    args = parser.parse_args()
    children = []
    try:
        children.append(subprocess.Popen([sys.executable,'-m','scripts.replay_worker']))
        children.append(subprocess.Popen([sys.executable,'-m','scripts.nlp_worker']))
        children.append(subprocess.Popen([sys.executable,'-m','uvicorn','backend.app.main:app',
                                          '--host',args.host,'--port',str(args.port)]))
        while all(child.poll() is None for child in children):
            time.sleep(0.25)
        raise SystemExit('API or worker exited; shutting down the other process')
    except KeyboardInterrupt:
        pass
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == '__main__':
    main()
