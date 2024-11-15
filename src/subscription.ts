import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { AuthorTask } from './addn/periodicTask'
import { Database } from './db'

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  private authorTask = new AuthorTask()

  constructor(db: Database, service: string) {
    super(db, service)
    // Run Tasks
    this.authorTask.run(db)
  }

  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // This logs the text of every post off the firehose.
    // Just for fun :)
    // Delete before actually using
    /*for (const post of ops.posts.creates) {
      console.log(post)
    }*/
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        // Check for author to add
        // Filter for posts that include the #joinbeyhive hashtag
        let hashtags: any[] = []
        create?.record?.text
          ?.toLowerCase()
          ?.match(/#[^\s#\.\;]*/gim)
          ?.map((hashtag) => {
            hashtags.push(hashtag)
          })

        // Add the Author
        if (hashtags.includes('#joinbeyhive')) {
          console.log('Author: adding author = ', create?.author)
          this.authorTask.addAuthor(create?.author)
        }

        // Check if this is a reply (if it is, don't process)
        if (create?.record?.hasOwnProperty('reply')) {
          if (create.record.reply?.root !== null) return false
        }

        if (this.authorTask.Authors?.length > 0) {
          if (!this.authorTask.Authors.includes(create.author)) {
            //TODO: make this false when we are ready to guard the posts
            //return true
          }
          //console.log('Author access granted: ', create.author)
        } else {
          return false
        }
        // only alf-related posts
        const re =
          /^(?!.*(#beyboons|#haghive|haghive|hasbeyn)).*\b(beyonce|beyhive|beyoncé|sasha fierce|bey|yonce|yoncé|#beyonce)\b.*$/imu

        let match = false

        let matchString = create.record.text.toLowerCase()

        const normalizedString = removeAccents(matchString)

        if (normalizedString.match(re) !== null) {
          match = true
        }

        return match
      })
      .map((create) => {
        // map alf-related posts to a db row
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
