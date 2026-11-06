import { app } from '../lexicons/index.js'
import { type AppContext } from '../util/config.js'
import * as jaMedia from './ja-media.js'
import * as jaPosts from './ja-posts.js'
import * as jaVideos from './ja-videos.js'
import * as thinnedJaPosts from './thinned-ja-posts.js'

type AlgoHandler = (ctx: AppContext, params: app.bsky.feed.getFeedSkeleton.$Params) => Promise<app.bsky.feed.getFeedSkeleton.$OutputBody>

const algos: Record<string, AlgoHandler> = {
  [jaMedia.shortname]: jaMedia.handler,
  [jaPosts.shortname]: jaPosts.handler,
  [jaVideos.shortname]: jaVideos.handler,
  [thinnedJaPosts.shortname]: thinnedJaPosts.handler,
}

export default algos
