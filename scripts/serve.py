"""Run the SocialScope API and dashboard with optional background workers."""
import argparse
import os
import subprocess
import sys
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=os.environ.get("PORT", "8000"))
    parser.add_argument("--strictPort", action="store_true", help="Compatibility with preview launcher")
    args = parser.parse_args()
    port = str(args.port)

    print("\n" + "=" * 72)
    print("  SocialScope — Real-Time Social Intelligence & Operations Platform")
    print(f"  Dashboard & API: http://{args.host}:{port}")
    print(f"  Health Check:    http://{args.host}:{port}/health")
    print("=" * 72)

    children = []
    has_db = bool(os.environ.get("DATABASE_URL"))
    if has_db:
        print("[INFO] DATABASE_URL detected: starting replay and NLP background workers...")
        children.append(subprocess.Popen([sys.executable, '-m', 'scripts.replay_worker']))
        children.append(subprocess.Popen([sys.executable, '-m', 'scripts.nlp_worker']))
    else:
        print("[INFO] Running in Standalone / Demo Intelligence mode.")
        print("[INFO] To enable live PostgreSQL streaming: install PostgreSQL or set DATABASE_URL.\n")

    try:
        uvicorn_proc = subprocess.Popen([
            sys.executable, '-m', 'uvicorn', 'backend.app.main:app',
            '--host', args.host, '--port', port
        ])
        children.append(uvicorn_proc)

        # Keep server alive as long as uvicorn process is running
        while uvicorn_proc.poll() is None:
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down SocialScope...")
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
        for child in children:
            try:
                child.wait(timeout=3)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()


if __name__ == '__main__':
    main()
