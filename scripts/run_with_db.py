"""Run a command with a workspace-local PostgreSQL server, then stop it.

Usage: python3 -m scripts.run_with_db python3 -m unittest discover -s tests -v
Set PG_BINDIR/PG_LIBDIR for a non-standard PostgreSQL installation.
"""
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
from urllib.parse import quote

import psycopg


def main():
    root = Path(__file__).resolve().parents[1]
    default = root.parent / "pg-runtime/usr/lib/postgresql/17/bin"
    bindir = Path(os.environ.get("PG_BINDIR", str(default)))
    initdb_name = "initdb.exe" if os.name == "nt" else "initdb"
    pg_ctl_name = "pg_ctl.exe" if os.name == "nt" else "pg_ctl"

    if not (bindir / initdb_name).exists() and not (bindir / "initdb").exists():
        if os.name == "nt":
            for ver in ("17", "16", "15", "14"):
                candidate = Path(rf"C:\Program Files\PostgreSQL\{ver}\bin")
                if (candidate / "initdb.exe").exists():
                    bindir = candidate
                    break
        if not (bindir / initdb_name).exists() and not (bindir / "initdb").exists():
            executable = shutil.which("initdb")
            if not executable:
                raise SystemExit("Install PostgreSQL or set PG_BINDIR to its bin directory.")
            bindir = Path(executable).parent
    initdb_bin = str(bindir / (initdb_name if (bindir / initdb_name).exists() else "initdb"))
    pg_ctl_bin = str(bindir / (pg_ctl_name if (bindir / pg_ctl_name).exists() else "pg_ctl"))
    state = root / ".runtime"
    state.mkdir(mode=0o700, exist_ok=True)
    data = state / "postgres"
    password_file = state / "database-password"
    if not password_file.exists():
        with open(password_file, "x", opener=lambda path, flags: os.open(path, flags, 0o600)) as f:
            f.write(secrets.token_urlsafe(32))
    password = password_file.read_text().strip()
    env = os.environ.copy()
    if os.name != "nt":
        libdir = os.environ.get("PG_LIBDIR", str(root.parent / "pg-runtime/usr/lib/x86_64-linux-gnu"))
        env["LD_LIBRARY_PATH"] = libdir + ":" + env.get("LD_LIBRARY_PATH", "")
    if not (data / "PG_VERSION").exists():
        subprocess.run([initdb_bin, "-D", str(data), "-U", "socialscope",
                        "--auth=scram-sha-256", "--pwfile=" + str(password_file),
                        "--encoding=UTF8", "--locale=C"], env=env, check=True, stdout=subprocess.DEVNULL)
    port = int(os.environ.get("PGPORT", "55432"))
    socket_opt = "" if os.name == "nt" else " -c unix_socket_directories=''"
    subprocess.run([pg_ctl_bin, "-D", str(data), "-l", str(state / "postgres.log"),
                    "-o", f"-h 127.0.0.1 -p {port}{socket_opt}", "-w", "start"], env=env, check=True)
    try:
        base = f"postgresql://socialscope:{quote(password)}@127.0.0.1:{port}/"
        with psycopg.connect(base + "postgres", autocommit=True) as conn:
            if not conn.execute("SELECT 1 FROM pg_database WHERE datname='socialscope'").fetchone():
                conn.execute("CREATE DATABASE socialscope")
        env["DATABASE_URL"] = base + "socialscope"
        subprocess.run([sys.executable,"-m","scripts.migrate"],cwd=root,env=env,check=True)
        command = sys.argv[1:]
        if not command:
            raise SystemExit("Provide a command to run with PostgreSQL.")
        result = subprocess.run(command,cwd=root,env=env)
        return result.returncode
    finally:
        subprocess.run([pg_ctl_bin,"-D",str(data),"-m","fast","-w","stop"],env=env,check=True)


if __name__ == "__main__":
    raise SystemExit(main())
