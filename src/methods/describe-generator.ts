import { Server } from '../lexicon'
import { AppContext } from '../config'
import algos from '../algos'
import { shortname as ttrpgVideoShortname } from '../algos/ttrpg-videos'
import { AtUri } from '@atproto/syntax'

const videoFeeds = [ttrpgVideoShortname]

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.describeFeedGenerator(async () => {
    const feeds = Object.keys(algos).map((shortname) => ({
      uri: AtUri.make(
        ctx.cfg.publisherDid,
        'app.bsky.feed.generator',
        shortname,
      ).toString(),
      contentMode: videoFeeds.includes(shortname)
        ? 'app.bsky.feed.defs#contentModeVideo'
        : undefined,
    }))
    return {
      encoding: 'application/json',
      body: {
        did: ctx.cfg.serviceDid,
        feeds,
      },
    }
  })
}
