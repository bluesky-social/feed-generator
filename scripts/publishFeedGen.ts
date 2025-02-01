import dotenv from 'dotenv'
import inquirer from 'inquirer'
import { AtpAgent, BlobRef, AppBskyFeedDefs } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  dotenv.config()

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }

  const answers = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'handle',
        message: 'Enter your Bluesky handle:',
        required: true,
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your Bluesky password (preferably an App Password):',
      },
      {
        type: 'input',
        name: 'service',
        message: 'Optionally, enter a custom PDS service to sign in with:',
        default: 'https://bsky.social',
        required: false,
      },
      {
        type: 'input',
        name: 'recordName',
        message: 'Enter a short name or the record. This will be shown in the feed\'s URL:',
        required: true,
      },
      {
        type: 'input',
        name: 'displayName',
        message: 'Enter a display name for your feed:',
        required: true,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Optionally, enter a brief description of your feed:',
        required: false,
      },
      {
        type: 'input',
        name: 'avatar',
        message: 'Optionally, enter a local path to an avatar that will be used for the feed:',
        required: false,
      },
      {
        type: 'confirm',
        name: 'videoOnly',
        message: 'Is this a video-only feed? If so, do you want to set the content mode to video? This will allow for an "immersive" video experience within the app.',
        default: false,
      }
    ])

  const { handle, password, recordName, displayName, description, avatar, service, videoOnly } = answers

  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`

  // only update this if in a test environment
  const agent = new AtpAgent({ service: service ? service : 'https://bsky.social' })
  await agent.login({ identifier: handle, password})

  let avatarRef: BlobRef | undefined
  if (avatar) {
    let encoding: string
    if (avatar.endsWith('png')) {
      encoding = 'image/png'
    } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg'
    } else {
      throw new Error('expected png or jpeg')
    }
    const img = await fs.readFile(avatar)
    const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
      encoding,
    })
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
      contentMode: videoOnly ? AppBskyFeedDefs.CONTENTMODEVIDEO : AppBskyFeedDefs.CONTENTMODEUNSPECIFIED,
    },
  })

  console.log('All done 🎉')
}

run()
