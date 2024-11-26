import dotenv from 'dotenv';
import express from 'express';
import makeRouter from './well-known'; // Import your well-known route handler
import FeedGenerator from './server';
import { Kysely, SqliteDialect } from 'kysely'; // Correct Kysely import
import { DidResolver } from '@atproto/identity'; 
import { BskyAgent } from '@atproto/api'; // Add BskyAgent import for Bluesky interactions

// Define the AppContext type to include agent
interface AppContext {
  cfg: {
    hostname: string;
    serviceDid: string;
    port: number;
    listenhost: string;
    sqliteLocation: string;
    subscriptionEndpoint: string;
    publisherDid: string;
    subscriptionReconnectDelay: number;
  };
  db: Kysely<any>; // Kysely database instance
  didResolver: DidResolver;
  agent: BskyAgent; // Bluesky agent
}

const run = async () => {
  dotenv.config();

  // Get configurations from environment variables or fallback to defaults
  const hostname = 'example.com'; // Use your specific hostname
  const serviceDid = 'did:web:example.com'; // Use your specific service DID

  // Initialize Kysely database instance with SqliteDialect
  const db = new Kysely<any>({
    dialect: new SqliteDialect({
      database: process.env.FEEDGEN_SQLITE_LOCATION || ':memory:',
    }),
  });

  // Create instances of DidResolver and BskyAgent
  const didResolver = new DidResolver();
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  // Context for well-known route and FeedGenerator
  const ctx: AppContext = {
    cfg: {
      hostname,
      serviceDid,
      port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
      listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'black-transmen-feed.vercel.app',
      sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':db.sqlite:',
      subscriptionEndpoint: maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ?? 'wss://bsky.network',
      publisherDid: maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:plc:upiws74afv3ixs64dwleecmu',
      subscriptionReconnectDelay: maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    },
    db, // Kysely database instance
    didResolver, // DidResolver instance
    agent, // BskyAgent instance
  };

  // Express server setup
  const app = express();
  app.use(makeRouter(ctx)); // Use the makeRouter to handle '/.well-known/did.json'

  // FeedGenerator configuration
  const server = FeedGenerator.create({
    port: ctx.cfg.port,
    listenhost: ctx.cfg.listenhost,
    sqliteLocation: ctx.cfg.sqliteLocation,
    subscriptionEndpoint: ctx.cfg.subscriptionEndpoint,
    publisherDid: ctx.cfg.publisherDid,
    subscriptionReconnectDelay: ctx.cfg.subscriptionReconnectDelay,
    hostname,
    serviceDid,
  });

  try {
    // Start the FeedGenerator service
    await server.start();

    console.log(
      `🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`
    );

    // Start the Express server to serve the .well-known route
    app.listen(server.cfg.port, () => {
      console.log(`Express server running at http://${hostname}:${server.cfg.port}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
  }
};

// Helper functions for environment variables
const maybeStr = (val?: string) => {
  return val ? val : undefined;
};

const maybeInt = (val?: string) => {
  if (!val) return undefined;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? undefined : parsed;
};

run();

