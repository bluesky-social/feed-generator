import { AppContext } from '../config.js'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton.js'
import * as mediaFeed from './media-feed.js'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [mediaFeed.shortname]: mediaFeed.handler,
}

export default algos
