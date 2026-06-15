# --- Stage 1: Build the frontend static assets ---
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app

# Copy frontend configuration files and install dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install --no-audit --no-fund --legacy-peer-deps

# Copy frontend source files and compile the production build
COPY frontend/ ./frontend/
ENV VITE_API_URL=
ARG VITE_TEXT_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN cd frontend && npm run build


# --- Stage 2: Build the API bundle ---
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app

# Copy backend configuration files and install dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --no-audit --no-fund

# Copy backend source files and run the cross-platform build script
COPY backend/ ./backend/
RUN cd backend && npm run build


# --- Stage 3: Runtime image (production only) ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies for the backend
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy the compiled backend build from Stage 2
COPY --from=backend-build /app/backend/dist ./dist

# Copy the compiled frontend static assets from Stage 1 into the public folder
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3001
USER node

CMD ["node", "dist/server.js"]