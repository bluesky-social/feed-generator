import dotenv from 'dotenv'
import FeedGenerator from './server'

const run = async () => {
  dotenv.config()
  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT),
    sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION),
    subscriptionEndpoint: maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT),
    serviceDid: maybeStr(process.env.FEEDGEN_SERVICE_DID),
  })
  await server.start()
  console.log(
    `🤖 running feed generator at http://localhost:${server.cfg.port}`,
  )
}

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

run()
