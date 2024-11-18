import { BskyAgent } from '@atproto/api'
import limit from './rateLimit.js'

export const getActorProfile = async (
  userDid: string,
  agent: BskyAgent,
): Promise<{ handle: string; avatar: string | undefined }> => {
  const userProfile = await agent.app.bsky.actor.getProfile({
    actor: userDid,
  })

  return { handle: userProfile.data.handle, avatar: userProfile.data.avatar }
}

export default getActorProfile
