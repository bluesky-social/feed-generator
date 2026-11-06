console.log('Starting...')

import { isValidDid } from '@atproto/syntax'
import { initIngester } from 'atingester'
import { closeSignal } from './cmds/stop.js'
import FeedGenerator from './server.js'
import { setupCmd } from './util/cmd.js'
import { type FeedGeneratorConfig, env } from './util/config.js'
import { createLogger } from './util/logger.js'

const run = async () => {
  const logger = createLogger(['Runner'])
  logger.info(`Running ${process.env.npm_package_name} ${process.env.npm_package_version} (${env.NODE_ENV})`)
  logger.info(`System Info: Node.js ${process.version} / ${process.platform} ${process.arch}`)
  logger.debug('DebugMode is enabled.')

  await initIngester()

  const serviceDid = env.FEEDGEN_SERVICE_DID
  const publisherDid = env.FEEDGEN_PUBLISHER_DID
  if (!isValidDid(serviceDid)) {
    logger.error('Invalid service DID')
    return new Error('Invalid service DID')
  }
  if (!isValidDid(publisherDid)) {
    logger.error('Invalid publisher DID')
    return new Error('Invalid publisher DID')
  }
  const feedGenCfg: FeedGeneratorConfig = {
    service: {
      port: env.FEEDGEN_PORT,
      hostname: env.FEEDGEN_HOSTNAME,
      did: serviceDid,
    },
    db: {
      dbLoc: env.FEEDGEN_SQLITE_LOCATION,
    },
    subscription: {
      mode: env.FEEDGEN_SUBSCRIPTION_MODE,
      firehose: { service: env.FEEDGEN_SUBSCRIPTION_FIREHOSE_ENDPOINT },
      jetstream: { service: env.FEEDGEN_SUBSCRIPTION_JETSTREAM_ENDPOINT },
      turbostream: { service: env.FEEDGEN_SUBSCRIPTION_TURBOSTREAM_ENDPOINT },
      reconnectDelay: env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY,
    },
    publisher: {
      did: publisherDid,
    },
  }

  const server = await FeedGenerator.create(feedGenCfg)

  setupCmd(server, createLogger(['Runner', 'Commander']))

  process.on('SIGHUP', async () => await closeSignal(server, logger))
  process.on('SIGINT', async () => await closeSignal(server, logger))
  process.on('SIGTERM', async () => await closeSignal(server, logger))

  await server.start()

  logger.info(`🤖 running feed generator at http://localhost:${env.FEEDGEN_PORT}`)
}

run()
