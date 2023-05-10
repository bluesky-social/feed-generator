import FeedGenerator from './server'

const run = async () => {
  // we'll add .env soon
  const server = FeedGenerator.create()
  await server.start()
  console.log(`🤖 running feed generator at localhost${server.cfg.port}`)
}

run()
