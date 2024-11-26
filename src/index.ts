import dotenv from 'dotenv';
import express from 'express';
import makeRouter from './well-known'; // Import your well-known route handler
import FeedGenerator from './server';
import Database from 'better-sqlite3'; // Correct import for Database
import { DidResolver } from '@atproto/identity'; 
import { BskyAgent } from '@atproto/api'; // Add BskyAgent import if you're using this for interaction

// Define the AppContext type if not already defined
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
  db: Database;
  didResolver: DidResolver;
  agent: BskyAgent;
}

const run = async () => {
  dotenv.config();

  // Get configurations from environment variables or fallback to defaults
  const hostname = 'example.com'; // Use your specific hostname
  const serviceDid = 'did:web:example.com'; // Use your specific service DID

  // Create database, DID resolver, and agent instances
  const db = new Database(process.env.FEEDGEN_SQLITE_LOCATION || ':memory:'); // Initialize with the correct DB path
  const didResolver = new DidResolver();
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  // Context for well-known route and FeedGenerator
  const ctx: AppContext = {
    cfg: {
      hostname,
      serviceDid,
      port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000, // Add port
      listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'black-transmen-feed.vercel.app', // Add listenhost
      sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':db.sqlite:', // Add sqliteLocation
      subscriptionEndpoint: maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ?? 'wss://bsky.network', // Add subscriptionEndpoint
      publisherDid: maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:plc:upiws74afv3ixs64dwleecmu', // Add publisherDid
      subscriptionReconnectDelay: maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000, // Add subscriptionReconnectDelay
    },
    db, // Include the database instance
    didResolver, // Include the DID resolver
    agent, // Include the agent instance
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
