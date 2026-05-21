FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=5001 \
    AWS_REGION=ap-south-1

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY src ./src

RUN addgroup -g 1001 -S app \
  && adduser -S app -u 1001 -G app \
  && mkdir -p /home/app/.aws \
  && chown -R app:app /usr/src/app /home/app

ENV HOME=/home/app

USER app

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5001) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
