import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as devs from './planeta-devs'
import * as linux from './planeta-linux'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [devs.shortname]: devs.handler,
  [linux.shortname]: linux.handler,
}
console.log(algos)
export default algos
