# Production image for complaint-management-service (ES modules)
FROM node:22-alpine

# Security: run as non-root in production
ENV NODE_ENV=production \
    PORT=5000 \
    AWS_REGION=ap-south-1 \
    DYNAMODB_TABLE=Complaints \
    S3_BUCKET_NAME=complaint-system-files-yaswanth

WORKDIR /usr/src/app

# Layer cache: install deps before copying application source
COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

# Application source (ES module entry: src/server.js)
COPY src ./src

RUN addgroup -g 1001 -S app \
  && adduser -S app -u 1001 -G app \
  && mkdir -p /home/app/.aws \
  && chown -R app:app /usr/src/app /home/app

ENV HOME=/home/app

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
