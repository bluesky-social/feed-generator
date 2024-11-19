import { AppBskyFeedDefs, RichText } from '@atproto/api'
import workerpool from 'workerpool'

import getActorProfile from '../actorMethods.js'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { BotCommand } from '../tasks/botCommandTask.js'
import { ThreadViewPost } from '../../lexicon/types/app/bsky/feed/defs.js'

interface UserProfileInfo {
  handle: string
  avatar: string | undefined
}

/**
 * Constructs an instance from a ThreadViewPost.
 */
function fromThreadView(view: AppBskyFeedDefs.ThreadViewPost): any {
  if (!is('app.bsky.feed.post', view.post.record)) {
    throw new Error('Invalid post view record')
  }

  const parent =
    view.parent?.$type === 'app.bsky.feed.defs#threadViewPost'
      ? fromThreadView(view.parent as ThreadViewPost)
      : undefined
  const children = view.replies
    ?.map((reply) =>
      reply.$type === 'app.bsky.feed.defs#threadViewPost'
        ? fromThreadView(reply as ThreadViewPost)
        : undefined,
    )
    ?.filter((reply) => reply !== undefined)

  return { post: view.post, parent, children }
}

function getThreadRoot(view: ThreadViewPost): any {
  if (view.parent) {
    return getThreadRoot(view.parent as ThreadViewPost)
  } else {
    return view
  }
}

function is(lexicon, obj) {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$type' in obj &&
    (obj.$type === lexicon || obj.$type === lexicon + '#main')
  )
}

async function processBotCommand(
  access: string,
  refresh: string,
  did: string,
  session_handle: string,
  active: boolean,
  command: BotCommand | undefined,
) {
  console.log('Running: processBotCommand')
  if (!command) return

  const creds = new CredentialSession(new URL('https://bsky.social'))
  const data: AtpSessionData = {
    accessJwt: access,
    refreshJwt: refresh,
    did: did,
    handle: session_handle,
    active: active,
  }
  creds.resumeSession(data)

  // Rebuild Agent
  const agent = new BskyAgent(creds)

  // Get the user that sent the request
  const { handle }: UserProfileInfo = await getActorProfile(
    command.userDid,
    agent,
  )

  const threadRes = await agent.getPostThread({
    uri: command.uri,
  })
  const { thread } = threadRes.data

  const rt = new RichText({
    text: `Hi @${handle}! ✨ I just got your ${command.type} command! 🐝`,
  })
  await rt.detectFacets(agent)

  switch (thread?.$type) {
    case 'app.bsky.feed.defs#threadViewPost': {
      let view = fromThreadView(thread as ThreadViewPost)
      let root = getThreadRoot(view)

      await agent.post({
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        reply: {
          root: {
            uri: root.post.uri,
            cid: root.post.cid,
          },
          parent: {
            uri: view.post.uri,
            cid: view.post.cid,
          },
        },
      })

      break
    }
  }
}

// create a worker and register public functions
workerpool.worker({
  processBotCommand,
})
