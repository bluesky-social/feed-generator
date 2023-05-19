import { Server } from '../lexicon'
import { AppContext } from '../config'
import algos from '../algos'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.describeFeedGenerator(async () => {
    const feeds = Object.keys(algos).map((uri) => ({ uri }))
    return {
      encoding: 'application/json',
      body: {
        did: ctx.cfg.serviceDid,
        feeds,
      },
    }
  })
}
