import FeedGenerator from './server'

const run = async () => {
  // we'll add .env soon
  const server = FeedGenerator.create()
  await server.start()
}

run()
