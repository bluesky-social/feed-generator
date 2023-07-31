FROM node:20-alpine

WORKDIR /app
COPY package.json .

RUN yarn install

# Bare neccesary
COPY src/ ./src
COPY .env .

EXPOSE 3000

# Nu kör vi
CMD ["yarn" , "start"]
