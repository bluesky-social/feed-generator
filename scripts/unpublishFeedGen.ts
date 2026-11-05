import dotenv from 'dotenv'
import { Agent, CredentialSession } from '@atproto/api'
import { app } from '../dist/lexicons/index.js'
import inquirer from 'inquirer'

const run = async () => {
  dotenv.config()

  const answers = await inquirer
    .prompt([
      {
        type: 'input',
        name: 'handle',
        message: 'Enter your Bluesky handle',
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
        message: 'Enter the short name for the record you want to delete:',
        required: true,
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete this record? Any likes that your feed has will be lost:',
        default: false,
      }
    ])

  const { handle, password, recordName, service, confirm } = answers

  if (!confirm) {
    console.log('Aborting...')
    return
  }

  // only update this if in a test environment
  const session = new CredentialSession(new URL(service ?? 'https://bsky.social'))
  await session.login({ identifier: handle, password})
  const agent = new Agent(session)

  await agent.com.atproto.repo.deleteRecord({
    repo: agent.did ?? '',
    collection: app.bsky.feed.generator.$nsid,
    rkey: recordName,
  })

  console.log('All done 🎉')
}

run()
