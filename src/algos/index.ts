import { AppContext } from '../config'
import { AppBskyFeedGetFeedSkeleton } from '@atproto/api'
import * as whatsAlf from './whats-alf'

type AlgoHandler = (
  ctx: AppContext,
  params: AppBskyFeedGetFeedSkeleton.QueryParams,
) => Promise<AppBskyFeedGetFeedSkeleton.OutputSchema>

const algos: Record<string, AlgoHandler> = {
  [whatsAlf.shortname]: whatsAlf.handler,
}

export default algos
