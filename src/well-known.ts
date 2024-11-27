import express from 'express';
import { AppContext } from './config';

const makeRouter = (ctx: AppContext) => {
  const router = express.Router();

  // Handle the .well-known/did.json route
  router.get('/.well-known/did.json', (_req, res) => {
    // Ensure that the service DID ends with the hostname
    if (!ctx.cfg.serviceDid.endsWith(ctx.cfg.hostname)) {
      return res.sendStatus(404);
    }

    // Return the DID document for the service
    res.json({
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: ctx.cfg.serviceDid,
      service: [
        {
          id: '#bsky_fg',
          type: 'BskyFeedGenerator',
          serviceEndpoint: `https://${ctx.cfg.hostname}/xrpc/app.bsky.feed.getFeedSkeleton`, // Ensure this endpoint is correct for your feed service
        },
      ],
    });
  });

  return router;
};

export default makeRouter;
