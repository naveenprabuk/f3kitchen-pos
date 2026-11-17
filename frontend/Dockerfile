# =====================================================================
#  F3 Kitchen - Billing Frontend (React)
#  Build:  docker build -t f3-kitchen-billing .
#  Run:    docker run -d -p 3000:80 --name f3-billing f3-kitchen-billing
# =====================================================================

# ---- Stage 1: Build the React application ----
FROM node:20-alpine AS builder
WORKDIR /app

# API base URL baked into the build (Vite reads VITE_*, CRA reads REACT_APP_*)
# Default "/api" = same origin, proxied by Nginx to the Spring Boot backend
ARG API_URL=/api
ENV VITE_API_URL=$API_URL \
    REACT_APP_API_URL=$API_URL

# Install dependencies first (leverages Docker layer cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build \
 && mkdir -p /out \
 && if [ -d dist ]; then cp -r dist/. /out/; \
    elif [ -d build ]; then cp -r build/. /out/; \
    else echo "No dist/ or build/ folder found" && exit 1; fi

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine

LABEL app="f3-kitchen-billing" \
      maintainer="F3 Kitchen, JESEM Food Street, OMR Navalur"

# India time for logs
RUN apk add --no-cache tzdata
ENV TZ=Asia/Kolkata

# Nginx config: React routing + /api proxy to the billing backend
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/f3-billing.conf

# Built assets (works for Vite 'dist' or CRA 'build')
COPY --from=builder /out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
