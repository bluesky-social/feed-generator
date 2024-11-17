FROM node:20 AS build
RUN apt-get update && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev g++ software-properties-common
WORKDIR /app
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install
COPY . .
RUN yarn build

FROM node:20 AS deps
RUN apt-get update && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev g++ software-properties-common
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/yarn.lock .
RUN yarn install --production

FROM node:20
RUN apt-get update && apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev g++ software-properties-common
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=deps /app/package.json .
COPY --from=deps /app/yarn.lock .
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["yarn","start"]