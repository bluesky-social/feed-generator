import dotenv from 'dotenv'
import FeedGenerator from './server'
import FeedIndexer from './indexer'
import * as yargs from "yargs";

const argv = yargs
  .option('operation', {
    description: 'Specify an operation for the feed generators',
    demandOption: true,
  })
  .help().argv

let runfeed = false
let runindex = false

if (argv.operation === 'feed' || argv.operation === 'all') {
  runfeed = true
}
if (argv.operation === 'index' || argv.operation === 'all') {
  runindex = true
}
if ( !(runfeed || runindex)) {
  console.log(`Operation "${argv.operation}" is not supported.`)
  process.exit
}

const run = async () => {
  dotenv.config()

  const hostname = maybeStr(process.env.FEEDGEN_HOSTNAME) ?? 'example.com'
  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`

  if (runindex) {
    const indexer = FeedIndexer.create({
      sqliteLocation:
        maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:',
      subscriptionEndpoint:
        maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ??
        'wss://bsky.network',
      subscriptionReconnectDelay:
        maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    })

    await indexer.start()
    console.log(
      `🤖 running feed indexer for ${indexer.cfg.subscriptionEndpoint}`,
    )
  }

  if (runfeed) {
    const server = FeedGenerator.create({
      port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
      listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
      sqliteLocation:
        maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:',
      publisherDid:
        maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice',
      hostname,
      serviceDid,
      ownHandleDid:
        maybeStr(process.env.OWN_HANDLE_DID) ?? 'did:example:alice'
    })

    await server.start()
    console.log(
      `🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`,
    )
  }
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
