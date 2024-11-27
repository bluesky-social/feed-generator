import { Database } from './db';
import { DidResolver } from '@atproto/identity';
import { BskyAgent } from '@atproto/api';  // Import BskyAgent

export type AppContext = {
  db: Database;  // Your database type (Kysely or SQLite)
  didResolver: DidResolver;  // DID resolver
  agent: BskyAgent;  // Add BskyAgent instance here
  cfg: Config;  // Config settings
};

export type Config = {
  port: number;
  listenhost: string;
  hostname: string;
  sqliteLocation: string;
  subscriptionEndpoint: string;
  serviceDid: string;
  publisherDid: string;
  subscriptionReconnectDelay: number;
};
