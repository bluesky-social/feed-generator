import dotenv from 'dotenv'
import FeedGenerator from './server.js'

const run = async () => {
  dotenv.config()

  const publisherDid = process.env.FEEDGEN_PUBLISHER_DID
  const hostname = process.env.FEEDGEN_HOSTNAME
  if (!publisherDid || publisherDid === 'did:example:alice') {
    throw new Error('FEEDGEN_PUBLISHER_DID must be set to your Bluesky DID')
  }
  if (!hostname || hostname === 'example.com') {
    throw new Error('FEEDGEN_HOSTNAME must be set to your public domain')
  }

  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`

  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
    listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
    sqliteLocation:
      maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? 'db.sqlite',
    subscriptionEndpoint:
      maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ??
      'wss://bsky.network',
    publisherDid,
    subscriptionReconnectDelay:
      maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    hostname,
    serviceDid,
  })

  await server.start()
  console.log(
    `running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`,
  )

  const shutdown = async () => {
    server.server?.close()
    server.db.destroy()
    process.exit(0)
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
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
