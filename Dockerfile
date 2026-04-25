FROM node:24.15.0-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++
RUN npm ci
RUN apk del python3 make g++

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/index.ts"]
