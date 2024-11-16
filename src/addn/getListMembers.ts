import { BskyAgent } from '@atproto/api'
import limit from './rateLimit'

export const getListMembers = async (
  list: string,
  agent: BskyAgent,
): Promise<string[]> => {
  let total_retrieved = 1
  let current_cursor: string | undefined = undefined
  let members: string[] = []

  do {
    const list_members = await limit(() =>
      agent.app.bsky.graph.getList({
        list: `${list}`,
        limit: 100,
        cursor: current_cursor,
      }),
    )
    total_retrieved = list_members.data.items.length
    current_cursor = list_members.data.cursor
    list_members.data.items.forEach((member) => {
      members.push(member.subject.did)
    })
  } while (current_cursor !== undefined && current_cursor !== '')

  return members
}

export default getListMembers
