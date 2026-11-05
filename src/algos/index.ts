import { app } from '../lexicons/index.js'
import type { AppContext } from '../util/config.js'
import * as whatsAlf from './whats-alf.js'

type AlgoHandler = (ctx: AppContext, params: app.bsky.feed.getFeedSkeleton.$Params) => Promise<app.bsky.feed.getFeedSkeleton.$OutputBody>

const algos: Record<string, AlgoHandler> = {
  [whatsAlf.shortname]: whatsAlf.handler,
}

export default algos
