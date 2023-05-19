import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  const handle = 'bsky.app'
  const password = 'abcd-1234-4321-dcba' // ask emily for app password
  const feedGenDid = ''

  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

  await publishGen(
    agent,
    feedGenDid,
    'whats-hot',
    `What's Hot`,
    'Top trending content from the whole network',
    './whats-hot.jpg',
  )

  await publishGen(
    agent,
    feedGenDid,
    'hot-classic',
    `What's Hot Classic`,
    `The original What's Hot experience`,
    './hot-classic.jpg',
  )

  await publishGen(
    agent,
    feedGenDid,
    'bsky-team',
    `Bluesky Team`,
    'Posts from members of the Bluesky Team',
    './bsky-team.jpg',
  )

  await publishGen(
    agent,
    feedGenDid,
    'with-friends',
    `Popular With Friends`,
    'A mix of popular content from accounts you follow and content that your follows like.',
    './with-friends.jpg',
  )

  console.log('All done 🎉')
}

const publishGen = async (
  agent: AtpAgent,
  feedGenDid: string,
  recordName: string,
  displayName: string,
  description: string,
  avatar: string,
) => {
  let avatarRef: BlobRef | undefined
  if (avatar) {
    const img = await fs.readFile(avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img)
    avatarRef = blobRes.data.blob
  }

  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
    record: {
      did: feedGenDid,
      displayName: displayName,
      description: description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
    },
  })
}

run()
