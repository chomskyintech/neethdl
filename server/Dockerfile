FROM node:22-bookworm-slim

ARG VERIBLE_VERSION=v0.0-4283-ga1b0580b

RUN apt-get update \
  && apt-get install -y --no-install-recommends verilator ghdl ca-certificates curl tar \
  && arch="$(dpkg --print-architecture)" \
  && case "$arch" in \
       amd64) verible_arch="x86_64"; verible_sha="f4feb4d099dfeee2553ead2e42617dd63bf60fe7f722108c3e85dee2b02c45b7" ;; \
       arm64) verible_arch="arm64"; verible_sha="9524c01ffc0812fefa097014d51b649c067c3ad1dac6fa72d4075a7e12033722" ;; \
       *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
     esac \
  && verible_asset="verible-${VERIBLE_VERSION}-linux-static-${verible_arch}.tar.gz" \
  && curl -fsSL "https://github.com/chipsalliance/verible/releases/download/${VERIBLE_VERSION}/${verible_asset}" -o /tmp/verible.tar.gz \
  && echo "${verible_sha}  /tmp/verible.tar.gz" | sha256sum -c - \
  && mkdir -p /tmp/verible \
  && tar -xzf /tmp/verible.tar.gz -C /tmp/verible \
  && formatter="$(find /tmp/verible -type f -name verible-verilog-format | head -n 1)" \
  && test -n "$formatter" \
  && install -m 0755 "$formatter" /usr/local/bin/verible-verilog-format \
  && verible-verilog-format --version \
  && rm -rf /tmp/verible /tmp/verible.tar.gz /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY ghdl-proxy.js ./
COPY standalone-benches.js ./
COPY vendor ./vendor

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["node", "ghdl-proxy.js"]
