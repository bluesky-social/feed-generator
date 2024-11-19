import { RichText } from '@atproto/api'
import workerpool from 'workerpool'

import getActorProfile from '../actorMethods.js'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { BotCommand } from '../tasks/botCommandTask.js'
import { ThreadViewPost } from '../../lexicon/types/app/bsky/feed/defs.js'

interface UserProfileInfo {
  handle: string
  avatar: string | undefined
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
    depth: 1,
    parentHeight: 1,
  })
  const { thread } = threadRes.data

  const rt = new RichText({
    text: `Hi @${handle}! ✨ I just got your ${command.type} command! 🐝`,
  })
  await rt.detectFacets(agent)

  switch (thread?.$type) {
    case 'app.bsky.feed.defs#threadViewPost': {
      const root: ThreadViewPost = thread as ThreadViewPost

      switch (root.parent?.$type) {
        case 'app.bsky.feed.defs#threadViewPost': {
          const parent: ThreadViewPost = root.parent as ThreadViewPost
          await agent.post({
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
            reply: {
              root: {
                uri: parent.post.uri,
                cid: parent.post.cid,
              },
              parent: {
                uri: root.post.uri,
                cid: root.post.cid,
              },
            },
          })

          break
        }
        case 'app.bsky.feed.defs#blockedPost': {
          throw new Error(
            `The bot is blocked from viewing post ${command.uri}.`,
          )
        }
        case 'app.bsky.feed.defs#notFoundPost': {
          throw new Error(`The post ${command.uri} was not found.`)
        }
        default: {
          throw new Error(
            `An unknown error occurred while trying to fetch post ${command.uri}.`,
          )
        }
      }

      break
    }
    case 'app.bsky.feed.defs#blockedPost': {
      throw new Error(`The bot is blocked from viewing post ${command.uri}.`)
    }
    case 'app.bsky.feed.defs#notFoundPost': {
      throw new Error(`The post ${command.uri} was not found.`)
    }
    default: {
      throw new Error(
        `An unknown error occurred while trying to fetch post ${command.uri}.`,
      )
    }
  }
}

// create a worker and register public functions
workerpool.worker({
  processBotCommand,
})
