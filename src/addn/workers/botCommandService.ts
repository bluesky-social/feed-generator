import { AppBskyFeedDefs, RichText } from '@atproto/api'
import workerpool from 'workerpool'
import dotenv from 'dotenv'

import getActorProfile from '../actorMethods.js'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { BotCommand } from '../tasks/botCommandTask.js'
import { ThreadViewPost } from '../../lexicon/types/app/bsky/feed/defs.js'
import { createDb, Database } from '../../db/index.js'
import { TaskSessionData } from '../tasks/task.js'

interface UserProfileInfo {
  handle: string
  avatar: string | undefined
}

function buildAgent(taskSession): BskyAgent {
  const creds = new CredentialSession(new URL('https://bsky.social'))
  const data: AtpSessionData = {
    accessJwt: taskSession.access,
    refreshJwt: taskSession.refresh,
    did: taskSession.did,
    handle: taskSession.handle,
    active: taskSession.active,
  }
  creds.resumeSession(data)

  // Rebuild Agent
  return new BskyAgent(creds)
}

async function getHelpForUser(handle: string, agent: BskyAgent) {
  const rt = new RichText({
    text: `Here are some commands you can send to me! 🐝\n#BeyPoints - to get your current BeyPoints\n#Help - to get a list of commands\n#LeaveBeyHive - to disable membership (points will remain)\n#JoinBeyHive - to become a member`,
  })
  await rt.detectFacets(agent)

  return rt
}

async function getPointsForUser(
  command: BotCommand,
  handle: string,
  agent: BskyAgent,
  db: Database,
): Promise<RichText> {
  const results = await db
    .selectFrom('member_points')
    .selectAll()
    .where('did', '=', command.userDid)
    .execute()

  const points: number = results[0]?.points || 0
  let suffix: string = ''

  switch (points) {
    case 0: {
      suffix = 'Make posts about Beyoncé to earn points.'
      break
    }
    default: {
      suffix = 'Keep it up!'
    }
  }

  const rt = new RichText({
    text: `Hi @${handle}! ✨ You've earned ${points} points! ${suffix} 🐝`,
  })
  await rt.detectFacets(agent)

  return rt
}

async function processBotCommand(
  taskSession: TaskSessionData,
  command: BotCommand | undefined,
) {
  if (!command) return

  console.log('Processing Bot command: ', command.type)

  // Setup Database
  dotenv.config()
  const db: Database = createDb(
    process.env.FEEDGEN_DB_LOCATION || '',
    process.env.CA_CERT || '',
  )

  // Get agent
  const agent: BskyAgent = buildAgent(taskSession)

  // Get the user that sent the request
  const { handle }: UserProfileInfo = await getActorProfile(
    command.userDid,
    agent,
  )

  // Get the thread this post is a part of
  const threadRes = await agent.getPostThread({
    uri: command.uri,
  })
  const { thread } = threadRes.data

  // Build post text
  let richText: RichText | undefined = undefined

  switch (command.type) {
    case 'points': {
      richText = await getPointsForUser(command, handle, agent, db)
      break
    }
    case 'help': {
      richText = await getHelpForUser(handle, agent)
      break
    }
    case 'members_list':
    case 'ban_list':
  }

  await sendPost(agent, thread, richText)
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

async function sendPost(agent, thread, richText) {
  switch (thread?.$type) {
    case 'app.bsky.feed.defs#threadViewPost': {
      let view = fromThreadView(thread as ThreadViewPost)
      let root = getThreadRoot(view)

      await agent.post({
        text: richText?.text,
        facets: richText?.facets,
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
