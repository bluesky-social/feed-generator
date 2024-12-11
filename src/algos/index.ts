import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as survivor from './survivor'
import * as survivordelay from './survivordelay'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [survivor.shortname]: survivor.handler,
  [survivordelay.shortname]: survivordelay.handler,
}

export default algos
