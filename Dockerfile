FROM node:22-alpine
WORKDIR /app
COPY . .
ENV NODE_ENV=production PORT=3000 PURZA_DB=/data/purza.db
VOLUME ["/data"]
EXPOSE 3000
USER node
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
