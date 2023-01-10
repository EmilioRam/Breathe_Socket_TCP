FROM node:16.18.1-alpine3.16

WORKDIR /app
COPY . .
RUN npm install --production

CMD ["node", "/app/index.js"]
