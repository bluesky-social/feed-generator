import {
  type QueryParams,
  type OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { type AppContext } from '../util/config'
import * as jaPosts from './ja-posts'
import * as jaVideos from './ja-videos'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [jaPosts.shortname]: jaPosts.handler,
  [jaVideos.shortname]: jaVideos.handler,
}

export default algos
