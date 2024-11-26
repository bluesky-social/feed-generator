import dotenv from 'dotenv';
import express from 'express';
import makeRouter from './well-known'; // Import your well-known route handler
import FeedGenerator from './server';
import { Kysely, SqliteDialect } from 'kysely'; // Correct import for Kysely
import { DidResolver } from '@atproto/identity'; 
import { BskyAgent } from '@atproto/api'; // Import BskyAgent

// Ensure your schema is defined for Kysely
import { DatabaseSchema } from './schema'; // Example import for your DB schema

// Configuration loading
dotenv.config();

const run = async () => {
  // Get configurations from environment variables or fallback to defaults
  const hostname = 'example.com'; // Use your specific hostname
  const serviceDid = 'did:web:example.com'; // Use your specific service DID

  // Create database, DID resolver, and agent instances
  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: process.env.FEEDGEN_SQLITE_LOCATION || ':memory:', // SQLite DB file or memory DB
    }),
  });

  const didResolver = new DidResolver();
  const agent = new BskyAgent({
    service: 'https://bsky.social',
  });

  // Context for well-known route and FeedGenerator
  const ctx = {
    cfg: {
      hostname,
      serviceDid,
      port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000, // Add port
      listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost', // Add listenhost
      sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:', // Add sqliteLocation
      subscriptionEndpoint: maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ?? 'wss://bsky.network', // Add subscriptionEndpoint
      publisherDid: maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice', // Add publisherDid
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
    console.log(`🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`);

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

