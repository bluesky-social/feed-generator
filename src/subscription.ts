import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import { CompiledQuery } from 'kysely';

let counter = 0;

/** Filter devs **/
const planeta_dev_dids=[
  'did:plc:sstpuq6znd5andvs3y2f4pkv', //levhita.net
  'did:plc:tx3nypw2flmcan75hsoqt5jg', //maho.dev
  'did:plc:ed2rvjjmac7fwrqrk7uhfbny', //feregri.no
  'did:plc:dp2sajg2scxjxdrskgken5ln', //hmier.bsky.social
  'did:plc:wmzynryvf7dhxeimg3l6lr2c', //migueldeicaza.bsky.social
  'did:plc:nhzgkwxixgbonakqza23aljh', //pablasso.com
  'did:plc:f7t7cq6jmnsa7uzfwncz53vh', //cesarpalafox.bsky.social
]

/** Filter linux **/
const planeta_linux_dids=[
  'did:plc:sstpuq6znd5andvs3y2f4pkv', //levhita.net
  'did:plc:tx3nypw2flmcan75hsoqt5jg', //maho.dev
  'did:plc:ed2rvjjmac7fwrqrk7uhfbny', //feregri.no
  'did:plc:dp2sajg2scxjxdrskgken5ln', //hmier.bsky.social
  'did:plc:wmzynryvf7dhxeimg3l6lr2c', //migueldeicaza.bsky.social
  'did:plc:nhzgkwxixgbonakqza23aljh', //pablasso.com
]

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    
    const ops = await getOpsByType(evt)
    
    
    /** Filter 1 Devs **/
    const planeta_dev_posts = ops.posts.creates.filter((create) => {
      if (create.record.text.toLowerCase().includes('#dev') ){
        if (planeta_dev_dids.includes(create.author)){
          return true;
        }
      }
      return false;
    })

    const postsToCreateDev = planeta_dev_posts.map((create) => {
      return {
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
        filter: "dev"
      }
    })
    
    if (postsToCreateDev.length > 0) {
      console.log(planeta_dev_posts);
      await this.db
      .insertInto('post')
      .values(postsToCreateDev)
      .onConflict((oc) => oc.doNothing())
      .execute()
    }


    /** Filter 2 Linux **/
    const planeta_linux_posts = ops.posts.creates.filter((create) => {
      if (create.record.text.toLowerCase().includes('#linux') ){
        if (planeta_linux_dids.includes(create.author)){
          return true;
        }
      }
      return false;
    })

    const postsToCreateLinux = planeta_linux_posts.map((create) => {
      return {
        uri: create.uri,
        cid: create.cid,
        indexedAt: new Date().toISOString(),
        filter: "linux"
      }
    })

    if (postsToCreateLinux.length > 0) {
      console.log(postsToCreateLinux);
      await this.db
      .insertInto('post')
      .values(postsToCreateLinux)
      .onConflict((oc) => oc.doNothing())
      .execute()
    }
    
    /** Clean Up **/
    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    
    if (postsToDelete.length > 0) {
      await this.db
      .deleteFrom('post')
      .where('uri', 'in', postsToDelete)
      .execute()
    }

    counter--;
    if( counter<=0 ){
      console.log('Doing Clean Up');
      /*
      //Clean Up Filter 1 Dev 
      await this.db.executeQuery<any>(
        CompiledQuery.raw(`delete
          from post
          where uri not in (
              select uri
              from post
              where filter = 'dev'
              order by indexedAt desc
              limit 1000
          )
          AND filter = 'dev'`,
        []),
      );

      // Clean Up Filter 2 Linux
      await this.db.executeQuery<any>(
        CompiledQuery.raw(`delete
          from post
          where uri not in (
              select uri
              from post
              where filter = 'linux'
              order by indexedAt desc
              limit 1000
          )
          AND filter = 'linux'`,
        []),
      );*/
      counter = 1000000;
    }
  }
}
