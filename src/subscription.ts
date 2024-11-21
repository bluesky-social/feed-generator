import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos.js'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription.js'
import { Database } from './db/index.js'
import dotenv from 'dotenv'
import { BskyAgent } from '@atproto/api'
import getListFeed from './addn/getListFeed.js'
import { AuthorTask } from './addn/tasks/authorTask.js'
import { BannedTask } from './addn/tasks/bannedTask.js'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  private authorTask = new AuthorTask()
  private bannedTask = new BannedTask()

  constructor(db: Database, service: string) {
    super(db, service)
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
  }
}
