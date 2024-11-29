FROM node:20 AS build
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:20 AS deps
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .
RUN npm install --production

FROM node:20
RUN apt-get update && apt-get install -y -q --no-install-recommends libfontconfig1
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/images ./images
COPY --from=deps /app/package.json .
COPY --from=deps /app/package-lock.json .
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm","start"]