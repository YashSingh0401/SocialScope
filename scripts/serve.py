"""Run the local API and replay worker together under scripts.run_with_db."""
import subprocess
import sys
import time


def main():
    children = []
    try:
        children.append(subprocess.Popen([sys.executable,'-m','scripts.replay_worker']))
        children.append(subprocess.Popen([sys.executable,'-m','uvicorn','backend.app.main:app',
                                          '--host','127.0.0.1','--port','8000']))
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
