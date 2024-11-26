import dotenv from 'dotenv';
import express from 'express';
import makeRouter from './well-known'; // Import your well-known route handler
import FeedGenerator from './server';
import { Database } from 'better-sqlite3';
import { DidResolver } from '@atproto/identity';

const run = async () => {
  dotenv.config();

  // Get configurations from environment variables or fallback to defaults
  const hostname = maybeStr(process.env.FEEDGEN_HOSTNAME) ?? 'example.com';
  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`;

  // Create database and DID resolver instances
  const db = new Database(process.env.FEEDGEN_SQLITE_LOCATION || ':memory:');
  const didResolver = new DidResolver();

  // Context for well-known route
  const ctx = {
    cfg: {
      hostname,
      serviceDid,
    },
    db, // Include the database instance
    didResolver, // Include the DID resolver
  };

  // Express server setup
  const app = express();
  app.use(makeRouter(ctx)); // Use the makeRouter to handle '/.well-known/did.json'

  // FeedGenerator configuration
  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
    listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
    sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:',
    subscriptionEndpoint:
      maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ?? 'wss://bsky.network',
    publisherDid:
      maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice',
    subscriptionReconnectDelay:
      maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
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
