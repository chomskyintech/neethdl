#!/usr/bin/env python3
"""Validate that the executable RTL catalog stays aligned with the problem catalog."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
problems = json.loads((root / "src/data/problems.json").read_text())
source = (root / "src/browserSimulator.js").read_text()

problem_ids = {p["id"] for p in problems}
bench_ids = set(re.findall(r"'([^']+)': `module tb;", source))
expected = {
    "rtl-mux", "rtl-counter", "rtl-priority", "rtl-fifo", "rtl-shift-register",
    "rtl-edge-detector", "rtl-arbiter", "rtl-regfile", "rtl-lfsr", "rtl-clock-divider",
}

if bench_ids != expected:
    missing = sorted(expected - bench_ids)
    unexpected = sorted(bench_ids - expected)
    raise SystemExit(f"Browser simulation catalog mismatch: missing={missing}, unexpected={unexpected}")

if not expected <= problem_ids:
    raise SystemExit(f"Simulation problems missing from src/data/problems.json: {sorted(expected - problem_ids)}")

print(f"Simulation catalog: PASS ({len(expected)}/10 executable problems present)")
print("IDs:")
for problem_id in sorted(expected):
    print(f"  - {problem_id}")
