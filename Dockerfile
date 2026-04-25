FROM node:24.15.0

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
