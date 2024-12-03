import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AlgoBase } from './algo-base'
import { ClaeAnadenArtAlgo as claeAndn } from './clae-andn'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

export const algoClasses : Array<AlgoBase> = [
  new claeAndn(0),
]

// thanks to this SO answer:
// https://stackoverflow.com/questions/26264956/convert-object-array-to-hash-
// map-indexed-by-an-attribute-value-of-the-object#comment102651246_54932079
const algos: Record<string, AlgoHandler> = Object.assign(
  {},
  ...algoClasses.map(
    algo => (
      {[algo.shortname]: algo.handler}
    )
  )
);

export default algos
