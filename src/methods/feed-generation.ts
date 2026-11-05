import algos from '../algos/index.js'
//import { validateAuth } from '../auth.js'
import { app } from '../lexicons/index.js'
import { type AppContext } from '../util/config.js'
import { AtUri } from '@atproto/syntax'
import * as xrpc from '@atproto/xrpc-server'

export default function (server: xrpc.Server, ctx: AppContext) {
  server.method(app.bsky.feed.getFeedSkeleton.$nsid, async (hCtx: any): Promise<app.bsky.feed.getFeedSkeleton.$Output> => {
    const feedUri = new AtUri(hCtx.params.feed)
    const algo = algos[feedUri.rkey]
    if (
      feedUri.hostname !== ctx.cfg.publisher.did ||
      feedUri.collection !== app.bsky.feed.generator.$nsid ||
      !algo
    ) {
      throw new xrpc.InvalidRequestError(
        'Unsupported algorithm',
        'UnsupportedAlgorithm',
      )
    }
    /**
     * Example of how to check auth if giving user-specific results:
     *
     * const requesterDid = await validateAuth(
     *   req,
     *   ctx.cfg.service.did,
     *   ctx.didResolver,
     * )
     */

    const body = await algo(ctx, hCtx.params)
    return {
      encoding: 'application/json',
      body: body,
    }
  })
}
