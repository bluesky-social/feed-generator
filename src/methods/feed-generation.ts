import { InvalidRequestError, AuthRequiredError } from '@atproto/xrpc-server'
import { Server } from '../lexicon'
import { AppContext } from '../config'
import algos from '../algos'
import { validateAuth } from '../auth'
import { AtUri } from '@atproto/syntax'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.getFeedSkeleton(async ({ params, req }) => {
    const feedUri = new AtUri(params.feed)
    const algo = algos[feedUri.rkey]
    if (
      feedUri.hostname !== ctx.cfg.publisherDid ||
      feedUri.collection !== 'app.bsky.feed.generator' ||
      !algo
    ) {
      throw new InvalidRequestError(
        'Unsupported algorithm',
        'UnsupportedAlgorithm',
      )
    }

    // Private feed: only serve to the publisher
    let requesterDid: string
    try {
      requesterDid = await validateAuth(req, ctx.cfg.serviceDid, ctx.didResolver)
    } catch {
      throw new AuthRequiredError()
    }
    if (requesterDid !== ctx.cfg.publisherDid) {
      return { encoding: 'application/json', body: { feed: [] } }
    }

    const body = await algo(ctx, params)
    return {
      encoding: 'application/json',
      body: body,
    }
  })
}
