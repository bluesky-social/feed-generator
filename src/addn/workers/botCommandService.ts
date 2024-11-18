import { RichText } from '@atproto/api'
import workerpool from 'workerpool'

import getActorProfile from '../actorMethods.js'
import { AtpSessionData, BskyAgent, CredentialSession } from '@atproto/api'
import { BotCommand } from '../tasks/botCommandTask.js'

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

  const { handle }: UserProfileInfo = await getActorProfile(
    command.userDid,
    agent,
  )

  const rt = new RichText({
    text: `Hi @${handle}! ✨ I just got your ${command.type} command! 🐝`,
  })
  await rt.detectFacets(agent)

  await agent.post({
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  })
}

// create a worker and register public functions
workerpool.worker({
  processBotCommand,
})
