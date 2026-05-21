# Stage 1: build React app (Vite bakes env vars into the static files)
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time args (set in docker-compose or: docker build --build-arg VITE_API_URL=...)
ARG VITE_API_URL=http://localhost:5000
ARG VITE_APP_URL=http://localhost:5173
ARG VITE_AWS_REGION=ap-south-1
ARG VITE_COGNITO_USER_POOL_ID
ARG VITE_COGNITO_CLIENT_ID
ARG VITE_COGNITO_DOMAIN
ARG VITE_ADMIN_EMAIL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_URL=$VITE_APP_URL \
    VITE_AWS_REGION=$VITE_AWS_REGION \
    VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID \
    VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID \
    VITE_COGNITO_DOMAIN=$VITE_COGNITO_DOMAIN \
    VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL

RUN npm run build

# Stage 2: serve static files with nginx (small, stable)
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD test -f /usr/share/nginx/html/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
