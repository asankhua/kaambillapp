# KaamBill in one container (Hugging Face Space, Docker SDK): builds the front end and serves it
# together with the /api functions on port 7860. Secrets come from the host's environment
# (Space secrets), never from the image: .env is excluded by .dockerignore.
FROM node:22-slim

WORKDIR /app

# Install first (dev dependencies too: vite and tsx are needed at build and run time).
COPY . .
RUN npm ci && npx vite build --config app/vite.config.ts

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=7860 \
    ALLOWED_ORIGINS=https://ashishsankhua-kaambill.hf.space

USER node
EXPOSE 7860
CMD ["node", "--import", "tsx", "phase-0-setup/scripts/serve.ts"]
