FROM node:20

WORKDIR /app

COPY . .

RUN yarn install

EXPOSE 3000

ENV NODE_ENV production

# Use yarn to start the application
CMD ["yarn", "start"]
