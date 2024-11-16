import { AtUri, BskyAgent } from '@atproto/api'
import limit from './rateLimit.js'

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

export const addListMembers = async (
  listUri: string,
  agent: BskyAgent,
  userDid: string,
): Promise<void> => {
  await limit(() =>
    agent.com.atproto.repo.createRecord({
      repo: agent.session?.did || '',
      collection: 'app.bsky.graph.listitem',
      record: {
        $type: 'app.bsky.graph.listitem',
        subject: userDid,
        list: listUri,
        createdAt: new Date().toISOString(),
      },
    }),
  )
}

export const removeListMembers = async (
  listItemUri: string,
  agent: BskyAgent,
): Promise<void> => {
  const repo = agent.session?.did || ''
  const { collection, rkey } = new AtUri(listItemUri)
  await limit(() =>
    agent.com.atproto.repo.deleteRecord({ repo, collection, rkey }),
  )
}
