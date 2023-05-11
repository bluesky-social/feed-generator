import { Database } from './db'
import { DidResolver } from '@atproto/did-resolver'

export type AppContext = {
  db: Database
  didResolver: DidResolver
  cfg: Config
}

export type Config = {
  port: number
  hostname: string
  sqliteLocation: string
  subscriptionEndpoint: string
  serviceDid: string
}
