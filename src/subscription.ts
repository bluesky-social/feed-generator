import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import fs from 'fs'

const excludedText: string[] = [
  'intropost',
  'trump',
  'for each like',
  'elon',
  '1 like',
  'get to know me',
  'TTRPGRising',
  'introduce yourself',
  '5 faves',
  'self-promo',
  'get to know my',
  'nft',
  'critical role',
  'hottake',
  'hot take',
  'pathfinder',
  'osréalacha', 
]

const matchPatterns: RegExp[] = [
  /(^|\s)#?cairn(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?cairnrpg(\s|\W|$)/im,
  /(^|\s)#?old school rpg(\s|\W|$)(?!.*(computer|video game|pc|console))/im, 
  /(^|\s)#?osr(\s|\W|$)(?!.*(computer|video game|pc|console|osréalacha))/im,
  /(^|\s)#?bx(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?whitebox(\s|\W|$)/im,
  /(^|\s)#?BECMI(\s|\W|$)/im,
  /(^|\s)#?DCCRPG(\s|\W|$)/im,
  /(^|\s)#?MCCRPG(\s|\W|$)/im,
  /(^|\s)#?Swords & Wizardry(\s|\W|$)/im,
  /(^|\s)#?Index Card RPG(\s|\W|$)/im,
  /(^|\s)#?ICRPG(\s|\W|$)/im,
  /(^|\s)#?odnd(\s|\W|$)/im,
  /(^|\s)#?ad&d(\s|\W|$)(?!.*(computer|video game|pc|console))/im,
  /(^|\s)#?bfrpg(\s|\W|$)/im,
  /(^|\s)#?old school roleplaying(\s|\W|$)/im,
  /(^|\s)#?beyond the wall(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?old school essentials(\s|\W|$)/im,
  /(^|\s)#?mausritter(\s|\W|$)/im,
  /(^|\s)#?dungeon crawl classics(\s|\W|$)/im,
  /(^|\s)#?bastionland(\s|\W|$)/im,
  /(^|\s)#?into the odd(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?Dolmenwood(\s|\W|$)/im,
  /(^|\s)#?Mothership(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?Classic Traveller(\s|\W|$)/im,
  /(^|\s)#?Between Two Cairns(\s|\W|$)/im,
  /(^|\s)#?Knave(\s*:)?(\s*the)?\s*RPG(\s|\W|$)/im,
  /(^|\s)#?Tunnel Goons(\s|\W|$)/im,
  /(^|\s)#?The Black Hack(\s|\W|$)/im,
]

const prohibitedUrls: string[] = [
  'https://osr.statisticsauthority.gov.uk',
  'osr.statisticsauthority.gov.uk', 
]

// Load banned DIDs 
const bannedUsersFile = './bannedUsers.json'
let bannedUsers: string[] = []
try {
  bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFile, 'utf8'))
} catch (err) {
  console.error(`Failed to load banned users from ${bannedUsersFile}:`, err)
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const txt = create.record.text.toLowerCase()
        return (
      	  matchPatterns.some((pattern) => pattern.test(txt)) && // Include posts matching matchPatterns
	  !excludedText.some((term) => txt.includes(term)) && // Exclude posts containing excludedText terms
          !bannedUsers.includes(create.author) && // Exclude posts by banned users
          !prohibitedUrls.some((url) => txt.includes(url)) // Exclude posts containing prohibited URLs
        )
      })
      .map((create) => {
        console.log(`Found post by ${create.author}: ${create.record.text}`)

        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
