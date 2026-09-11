"""Resumable bounded range downloads, followed by the published checksum."""
import concurrent.futures
import hashlib
import os
from pathlib import Path
import subprocess
import urllib.request

root = Path(__file__).resolve().parents[1]
target = root / 'data/raw/somalia-latest.osm.pbf'
target.parent.mkdir(parents=True, exist_ok=True)
base = 'https://download.geofabrik.de/africa/somalia-latest.osm.pbf'
with urllib.request.urlopen(base + '.md5') as response:
    checksum_text = response.read().decode()
expected = checksum_text.split()[0]
target.with_suffix(target.suffix + '.md5').write_text(checksum_text)
if target.exists() and hashlib.file_digest(target.open('rb'), 'md5').hexdigest() == expected:
    print('Existing Geofabrik extract checksum verified', flush=True)
    raise SystemExit(0)
with urllib.request.urlopen(urllib.request.Request(base, method='HEAD')) as response:
    url = response.url
    size = int(response.headers['Content-Length'])
parts = target.parent / ('parts-' + expected)
parts.mkdir(exist_ok=True)
count = int(os.environ.get('DOWNLOAD_CONNECTIONS', '8'))
chunk = (size + count - 1) // count

def download(i):
    start, end = i * chunk, min(size, (i + 1) * chunk) - 1
    part = parts / str(i)
    have = part.stat().st_size if part.exists() else 0
    if have != end - start + 1:
        temp = parts / f'{i}.partial'
        subprocess.run(['curl', '-fsSL', '--retry', '3', '--range', f'{start}-{end}', url, '-o', str(temp)], check=True)
        if temp.stat().st_size != end - start + 1:
            raise RuntimeError(f'Unexpected length for range {i}')
        temp.replace(part)
    print(f'Range {i + 1}/{count} ready', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=count) as pool:
    list(pool.map(download, range(count)))
staged = target.with_suffix('.staged')
with staged.open('wb') as output:
    for i in range(count):
        with (parts / str(i)).open('rb') as part:
            while data := part.read(1024 * 1024):
                output.write(data)
actual = hashlib.file_digest(staged.open('rb'), 'md5').hexdigest()
if actual != expected:
    raise RuntimeError(f'Geofabrik checksum mismatch: {actual} != {expected}')
staged.replace(target)
for part in parts.iterdir():
    part.unlink()
parts.rmdir()
print(f'Geofabrik checksum verified: {actual}, {size} bytes', flush=True)
