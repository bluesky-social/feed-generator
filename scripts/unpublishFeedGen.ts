import dotenv from 'dotenv'
import { AtpAgent } from '@atproto/api'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  dotenv.config()

  // YOUR bluesky handle
  // Ex: user.bsky.social
  const handle = ''

  // YOUR bluesky password, or preferably an App Password (found in your client settings)
  // Ex: abcd-1234-efgh-5678
  const password = ''

  // A short name for the record that will show in urls
  // Lowercase with no spaces.
  // Ex: whats-hot
  const recordName = ''

  // -------------------------------------
  // NO NEED TO TOUCH ANYTHING BELOW HERE
  // -------------------------------------

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    throw new Error('Please provide a hostname in the .env file')
  }
  
  // only update this if in a test environment
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

  await agent.api.com.atproto.repo.deleteRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
  })

  console.log('All done 🎉')
}

run()
