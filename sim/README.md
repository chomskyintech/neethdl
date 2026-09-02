# HDLForge RTL regression

This directory contains the first end-to-end regression layer for the 10 executable RTL problems in HDLForge.

## Covered problems

1. `rtl-mux`
2. `rtl-counter`
3. `rtl-priority`
4. `rtl-fifo`
5. `rtl-shift-register`
6. `rtl-edge-detector`
7. `rtl-arbiter`
8. `rtl-regfile`
9. `rtl-lfsr`
10. `rtl-clock-divider`

The suite uses SystemVerilog and Icarus Verilog (`iverilog -g2012`). It checks reset behaviour, combinational behaviour, sequential timing, state updates, protocol-like flags, priority rules and representative corner cases.

GitHub Actions runs the regression on every push to `main` and every pull request targeting `main`.

The current suite contains self-contained reference DUTs so the behavioural contracts can be validated independently of the browser UI. The next verification layer can replace those DUT instances with submitted candidate RTL and keep the test intent private from the candidate.
