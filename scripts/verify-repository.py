#!/usr/bin/env python3
"""Check staged/tracked export contents without printing credential values."""
from pathlib import Path
import hashlib, json, re, subprocess
root = Path(__file__).resolve().parents[1]
files = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
patterns = [rb"(?:sk-or-v1-|sk-proj-|ghp_|gho_|github_pat_)[A-Za-z0-9_-]{20,}", rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", rb"AKIA[0-9A-Z]{16}"]
errors = []
for name in filter(None, files):
    p = root / name
    if p.is_symlink(): errors.append(name + ": symlink")
    if any(part.startswith(".env") or part.endswith(".env") for part in p.relative_to(root).parts): errors.append(name + ": environment file")
    if any(part in {"node_modules", ".next", ".next-production", "dist", ".wrangler"} for part in p.relative_to(root).parts): errors.append(name + ": generated directory")
    b = p.read_bytes()
    if len(b) > 95 * 1024 * 1024: errors.append(name + ": oversized Git blob")
    if any(re.search(pattern, b) for pattern in patterns): errors.append(name + ": credential pattern")
for item in json.loads((root / "RESOURCE-INVENTORY.json").read_text()):
    p = root / item["path"]
    if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != item["sha256"]: errors.append(item["path"] + ": asset missing or hash mismatch")
    if item["path"] not in files: errors.append(item["path"] + ": resource not tracked")
if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"PASS: {len(list(filter(None, files)))} tracked files; no environment files, known credential patterns, symlinks or oversized blobs; asset hashes verified.")
