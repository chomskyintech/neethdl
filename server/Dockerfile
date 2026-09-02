FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends verilator ghdl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY ghdl-proxy.js ./

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["node", "ghdl-proxy.js"]
