import { AppContext } from '../config.js'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton.js'
import * as beyhive from './beyhive.js'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [beyhive.shortname]: beyhive.handler,
}

export default algos
