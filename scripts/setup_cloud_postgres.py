"""User-local PostgreSQL setup for this Debian 13 amd64 cloud workspace."""
import hashlib
import lzma
from pathlib import Path
import platform
import subprocess
import urllib.request


def main():
    if platform.machine() != 'x86_64' or 'VERSION_CODENAME=trixie' not in Path('/etc/os-release').read_text():
        raise SystemExit('This helper requires Debian 13 amd64; otherwise install PostgreSQL and set PG_BINDIR.')
    target = Path(__file__).resolve().parents[2] / 'pg-runtime'
    target.mkdir(exist_ok=True)
    base = 'https://deb.debian.org/debian/'
    with urllib.request.urlopen(base + 'dists/trixie/main/binary-amd64/Packages.xz', timeout=60) as r:
        index = lzma.decompress(r.read()).decode()
    wanted = {'postgresql-17', 'postgresql-client-17', 'libpq5', 'libllvm19'}
    found = set()
    for block in index.split('\n\n'):
        fields = dict(line.split(': ', 1) for line in block.splitlines()
                      if ': ' in line and not line.startswith(' '))
        name = fields.get('Package')
        if name not in wanted:
            continue
        with urllib.request.urlopen(base + fields['Filename'], timeout=120) as r:
            content = r.read()
        if hashlib.sha256(content).hexdigest() != fields['SHA256']:
            raise RuntimeError('Package checksum mismatch: ' + name)
        package = target / (name + '.deb')
        package.write_bytes(content)
        subprocess.run(['dpkg-deb', '-x', str(package), str(target)], check=True)
        found.add(name)
        print('Installed', name, fields['Version'])
    if found != wanted:
        raise RuntimeError('Incomplete package set')


if __name__ == '__main__':
    main()
