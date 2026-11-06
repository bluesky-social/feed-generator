import { type DidString } from '@atproto/syntax'
import dotenv from 'dotenv'
import { cleanEnv, host, num, port, str, testOnly, url } from 'envalid'
import { DidResolver } from '@atproto/identity'
import { type Database } from '../db/index.js'

export type AppContext = {
  cfg: FeedGeneratorConfig
  db: Database
  didResolver: DidResolver
  logger: Logger
}

export type FeedGeneratorConfig = {
  service: ServiceConfig
  db: DatabaseConfig
  subscription: SubscriptionConfig
  publisher: PublisherConfig
}

export interface ServiceConfig {
  port: number
  hostname: string
  did: DidString
}

export interface DatabaseConfig {
  dbLoc: string
}

export interface SubscriptionConfig {
  mode: 'Firehose' | 'Jetstream' | 'Turbostream'
  firehose: { service: string }
  jetstream: { service: string }
  turbostream: { service: string }
  reconnectDelay: number
}

export interface PublisherConfig {
  did: DidString
}

type Logger = {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

console.log(`Reading environment variables...`)
dotenv.config()
export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly('test'),
    choices: ['development', 'test', 'production'],
  }),
  FEEDGEN_PORT: port({
    devDefault: testOnly(3000),
  }),
  FEEDGEN_SQLITE_LOCATION: str({
    devDefault: ':memory:',
  }),
  FEEDGEN_SUBSCRIPTION_MODE: str({
    devDefault: testOnly('Firehose'),
    choices: ['Firehose', 'Jetstream', 'Turbostream'],
  }),
  FEEDGEN_SUBSCRIPTION_FIREHOSE_ENDPOINT: url({
    default: 'wss://bsky.network',
  }),
  FEEDGEN_SUBSCRIPTION_JETSTREAM_ENDPOINT: url({
    default: 'wss://jetstream1.us-east.bsky.network',
  }),
  FEEDGEN_SUBSCRIPTION_TURBOSTREAM_ENDPOINT: url({
    default: 'wss://api.graze.social',
  }),
  FEEDGEN_HOSTNAME: host({
    devDefault: testOnly('example.com'),
  }),
  FEEDGEN_PUBLISHER_DID: str({
    devDefault: testOnly('did:example:alice')
  }),
  FEEDGEN_SERVICE_DID: str({
    default: `did:web:${process.env.FEEDGEN_HOSTNAME ? process.env.FEEDGEN_HOSTNAME : 'example.com'}`,
  }),
  FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY: num({
    default: 3000
  }),
  LOG_PATH: str({
    default: './logs'
  }),
})
