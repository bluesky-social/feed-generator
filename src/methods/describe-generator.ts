import { AtUri } from '@atproto/syntax'
import * as xrpc from '@atproto/xrpc-server'
import algos from '../algos/index.js'
import { app } from '../lexicons/index.js'
import { type AppContext } from '../util/config.js'


export default function (server: xrpc.Server, ctx: AppContext) {
  server.method(app.bsky.feed.describeFeedGenerator.$nsid, async (hCtx: any): Promise<app.bsky.feed.describeFeedGenerator.$Output> => {
    const feeds = Object.keys(algos).map((shortname) => ({
      uri: AtUri.make(
        ctx.cfg.publisher.did,
        app.bsky.feed.generator.$nsid,
        shortname,
      ).toString(),
    }))
    return {
      encoding: 'application/json',
      body: {
        did: ctx.cfg.service.did,
        feeds,
      },
    }
  })
}
