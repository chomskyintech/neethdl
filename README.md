# HDLForge

**HDLForge** is a hardware design interview practice platform for **RTL, Verilog, SystemVerilog, SVA, UVM, computer architecture, protocols and FPGA** topics.

**Live site:** https://hdlforge.netlify.app/

HDLForge is designed for students, graduate engineers, RTL design candidates, design verification engineers, FPGA engineers, and anyone preparing for hardware design interviews. It provides focused interview-style problems, explanations, reference solutions, progress tracking, and practical HDL practice.

## Why HDLForge

HDLForge focuses specifically on hardware engineering interview preparation rather than general software coding interview practice. Its resources cover both design and verification concepts commonly encountered in RTL, FPGA, ASIC, and hardware verification interviews.

## Topics

HDLForge currently covers:

- RTL design
- Verilog
- SystemVerilog
- SystemVerilog Assertions (SVA)
- UVM and functional verification
- Computer architecture
- Digital design
- UART and SPI protocols
- FPGA design

## Practice problems

The platform includes practice covering multiplexers, counters, priority logic, FIFOs, shift registers, edge detectors, arbiters, register files, LFSRs, clock dividers, SystemVerilog constructs and interfaces, SVA handshakes and reset properties, UVM drivers and scoreboards, architecture hazards and caches, UART and SPI, FPGA debouncing, and FSM design.

## Main resources

- **Homepage:** https://hdlforge.netlify.app/
- **Practice problems:** https://hdlforge.netlify.app/problems/
- **Hardware design interview guide:** https://hdlforge.netlify.app/learn/hardware-design-interview/
- **Machine-readable site summary:** https://hdlforge.netlify.app/llms.txt

## Architecture

```text
HDLForge frontend (Netlify)
        |
        | HTTPS
        v
Cloudflare Quick Tunnel (free)
        |
        v
Your local HDLForge runner
        |
        v
Verilator + hidden-style testbench
        |
        v
PASS / FAIL + simulator output
```

- `src/` — React/Vite frontend, problem database, editor and progress tracking.
- `server/` — HDL execution service using Node.js + Verilator.
- Netlify hosts the frontend.
- For development/testing, the runner can stay on your own PC and be exposed through a free Cloudflare Quick Tunnel.

## Local frontend development

```bash
npm install
npm run dev
```

## Run the Verilator runner

### Option A — Docker (recommended)

From the repository root:

```bash
docker build -t hdlforge-runner ./server
docker run --rm -p 8787:8787 -e ALLOWED_ORIGIN=https://hdlforge.netlify.app hdlforge-runner
```

The runner should then respond at `http://localhost:8787/health`.

### Option B — Run Node directly

Install Verilator separately and make sure `verilator` is on `PATH`, then:

```bash
cd server
npm install
node server.js
```

The runner exposes `GET /health` and `POST /run`.

## Expose the runner with Cloudflare Quick Tunnel

Install `cloudflared`, then leave the runner running and open a second terminal:

```bash
cloudflared tunnel --url http://localhost:8787
```

Cloudflare will print a temporary URL similar to:

```text
https://some-random-name.trycloudflare.com
```

Set that URL as the Netlify environment variable:

```text
VITE_RUNNER_URL=https://some-random-name.trycloudflare.com
```

Then trigger a new Netlify deploy. HDLForge will use the Verilator runner for the four currently simulated problems: `rtl-mux`, `rtl-counter`, `rtl-priority` and `rtl-fifo`.

The Quick Tunnel URL changes when the tunnel process is restarted, so the Netlify environment variable must be updated when that happens. Cloudflare documents Quick Tunnels as free and intended for testing/development rather than production. They also have a 200 in-flight request limit.

## Security

The runner executes HDL submitted by users and must be treated as an untrusted-code execution service. The current implementation uses an allowlist, source-size limit, timeout and basic blocking of system/file operations. These are **not sufficient for production-grade public execution**.

Before exposing HDLForge to a large public audience, add stronger isolation: dedicated containers or sandboxes per job, no network access from simulation jobs, restricted filesystem permissions, non-root execution, CPU/memory/process limits, rate limiting and stronger SystemVerilog restrictions.

Never commit a real `.env` file or a runner URL containing credentials to GitHub.
