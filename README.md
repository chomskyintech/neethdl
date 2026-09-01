# HDLForge

HDLForge is a NeetCode-style hardware interview practice platform for RTL, SystemVerilog, SVA, UVM, computer architecture, protocols and FPGA topics.

## Architecture

- `src/` — React/Vite frontend, problem database, editor and progress tracking.
- `server/` — optional HDL execution service using Verilator.
- Netlify can host the frontend; the Verilator runner must be deployed separately on a container-capable service.

## Local development

```bash
npm install
npm run dev
```

For the simulator service:

```bash
cd server
npm install
node server.js
```

The runner expects `verilator` on `PATH` and exposes `POST /run` and `GET /health`.

Set `VITE_RUNNER_URL` in the frontend environment to the deployed runner URL. If it is empty, problems without an execution backend use browser-side structural checks instead.

## Security requirements before public deployment

The runner is an execution service and must be isolated. Deploy it in a dedicated container with no network access from simulation jobs, a non-root user, CPU/memory/process limits and a short timeout. Keep the problem/testbench allowlist server-side. Never pass user input to a shell command, and reject dangerous SystemVerilog constructs such as `$system`, arbitrary file access and source includes.

The included Dockerfile provides Verilator and Node, but production hardening and platform-specific sandbox limits still need to be configured by the deployment environment.
