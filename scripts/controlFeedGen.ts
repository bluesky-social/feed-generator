import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'
import * as yargs from "yargs";

const argv = yargs
  .option("operation", {
    description: "Specify an operation for the feed generators",
    demandOption: true,
  }).help().argv;

const run = async () => {
  dotenv.config()

  // YOUR bluesky handle
  // Ex: user.bsky.social
  const handle = maybeStr(process.env.YOUR_HANDLE) ?? ''

  // YOUR bluesky password, or preferably an App Password (found in your client settings)
  // Ex: abcd-1234-efgh-5678
  const password = maybeStr(process.env.YOUR_PASSWORD) ?? ''

  // A short name for the record that will show in urls
  // Lowercase with no spaces.
  // Ex: whats-hot
  const recordName = maybeStr(process.env.FEED_RECORD_NAME) ?? ''

  // A display name for your feed
  // Ex: What's Hot
  const displayName = maybeStr(process.env.FEED_DISPLAY_NAME) ?? ''

  // (Optional) A description of your feed
  // Ex: Top trending content from the whole network
  const description = maybeStr(process.env.FEED_DESCRIPTION) ?? ''

  // (Optional) The path to an image to be used as your feed's avatar
  // Ex: ~/path/to/avatar.jpeg
  const avatar: string = maybeStr(process.env.FEED_AVATAR_PATH) ?? ''

  // -------------------------------------
  // NO NEED TO TOUCH ANYTHING BELOW HERE
  // -------------------------------------

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }
  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`

  // only update this if in a test environment
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

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

  if (argv.operation === 'publish') {
    console.log(`publishing the feed "${recordName}"`)
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
  } else if (argv.operation === 'list'){
    console.log(`List feed generators registered in the handle "${handle}"`)
    const gottenRecord = await agent.api.com.atproto.repo.listRecords({
      repo: agent.session?.did ?? '',
      collection: ids.AppBskyFeedGenerator,
    })
  
    let num=0
    for(const record of gottenRecord.data.records){
      console.log("Record " + num)
      console.log(record)
      num++
    }
  } else if (argv.operation === 'unpublish'){
    console.log(`unpublishing the feed "${recordName}"`)
    await agent.api.com.atproto.repo.deleteRecord({
      repo: agent.session?.did ?? '',
      collection: ids.AppBskyFeedGenerator,
      rkey: recordName
    })
  } else {
    console.log(`The specified operation "${argv.operation}" is not supported.`)
  }

  console.log('All done 🎉')
}

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

run()
