# KaamBill: one container serves the landing page (/), the app (/app/) and the API (/api/) on port 3000.
# Build and run with:  docker compose up --build   (no .env and no secret key needed to start)
FROM node:22-slim

WORKDIR /app
ENV HUSKY=0 \
    PORT=3000

# The repo is an npm workspace (one package.json per phase), so install from the whole tree.
COPY . .
RUN npm ci --no-audit --no-fund \
 && npx vite build --config app/vite.config.ts

EXPOSE 3000
USER node
CMD ["npm", "start"]
