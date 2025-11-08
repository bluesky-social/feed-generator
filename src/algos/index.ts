import {
  type QueryParams,
  type OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { type AppContext } from '../util/config'
import * as jaMedia from './ja-media'
import * as jaPosts from './ja-posts'
import * as jaVideos from './ja-videos'
import * as thinnedJaPosts from './thinned-ja-posts'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [jaMedia.shortname]: jaMedia.handler,
  [jaPosts.shortname]: jaPosts.handler,
  [jaVideos.shortname]: jaVideos.handler,
  [thinnedJaPosts.shortname]: thinnedJaPosts.handler,
}

export default algos
