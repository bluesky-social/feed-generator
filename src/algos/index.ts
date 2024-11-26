import { AppContext } from '../config';
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton';
import * as blackTransmanTransmasc from './blacktransman-transmasc'; // Only import your new algorithm

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>;

const algos: Record<string, AlgoHandler> = {
  [blackTransmanTransmasc.shortname]: blackTransmanTransmasc.handler, // Add your algorithm here
};

export default algos;
