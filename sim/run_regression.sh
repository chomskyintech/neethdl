#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p sim/results
rm -f sim/results/rtl-regression.log sim/results/rtl-regression-report.txt sim/results/rtl_regression.out

printf '%s\n' 'HDLForge Phase 3 RTL simulation regression' | tee sim/results/rtl-regression.log
printf '%s\n' '==========================================' | tee -a sim/results/rtl-regression.log
printf 'Simulator: ' | tee -a sim/results/rtl-regression.log
iverilog -V 2>&1 | head -n 1 | tee -a sim/results/rtl-regression.log
printf 'Date: %s\n\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a sim/results/rtl-regression.log

iverilog -g2012 -Wall -o sim/results/rtl_regression.out sim/rtl_regression.sv 2>&1 | tee -a sim/results/rtl-regression.log
vvp sim/results/rtl_regression.out 2>&1 | tee -a sim/results/rtl-regression.log

if ! grep -q 'HDLForge RTL REGRESSION: PASS (10/10 problems exercised)' sim/results/rtl-regression.log; then
  echo 'Regression did not exercise all 10 problems successfully.' >&2
  exit 1
fi

grep -E '^(PASS|FAIL):' sim/results/rtl-regression.log > sim/results/rtl-regression-report.txt
printf '\nRegression result: PASS — all 10 simulation problems exercised.\n' | tee -a sim/results/rtl-regression.log
