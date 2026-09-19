# Third-party formatter notices

HDLForge uses the following open-source formatter components in its runner.

## Verible

Verilog and SystemVerilog formatting is provided by CHIPS Alliance Verible's `verible-verilog-format`.

- Project: https://github.com/chipsalliance/verible
- License: Apache License 2.0
- Pinned runner version: v0.0-4283-ga1b0580b
- License copy: `server/vendor/VERIBLE-LICENSE`

## VHDLFormatter

VHDL formatting uses VHDLFormatter by g2384.

- Project: https://github.com/g2384/VHDLFormatter
- License: MIT
- Vendored source: `server/vendor/VHDLFormatter.cjs`
- License copy: `server/vendor/VHDLFormatter-LICENSE`

The vendored VHDL formatter source is kept unmodified apart from its file extension so it can be loaded as CommonJS by the runner.
