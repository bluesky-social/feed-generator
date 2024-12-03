import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { BskyAgent } from '@atproto/api'
import { Database } from '../db'
import axios from 'axios'

// Borrowed the idea for algo base classes from the Marisa Feed Generator by vSLG
// (https://github.com/vSLG/marisa-feed-generator/)
export abstract class AlgoBase {
	public shortname: string
	public feed: number

	public agent : BskyAgent

	constructor(feed: number) {
		this.feed = feed
		this.agent = new BskyAgent({service: "https://api.bsky.app/"})
	}

	public async initFeed(db: Database) {
		console.log("Initializing feed " + this.shortname)

		var posts = await db
			.selectFrom("post")
			.selectAll()
			.execute()

		if (posts.length == 0) {
			
			// Current problem is that search is not supported using
			// BskyAgent, and we need to access the HTTP API directly
			// by querying public.api.bsky.app.
			// example: https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?author=did:plc:wc2nljklaywqr4axivpddo4i&q=anothereden&limit=100&sort=latest
			
			// For now, grabbing the data from the user is done using Axios API
			const response = await axios.get('app.bsky.feed.searchPosts',
				{
					baseURL: 'https://public.api.bsky.app/xrpc/',
					params: {
						author: "did:plc:wc2nljklaywqr4axivpddo4i",
						q: "anothereden",
						limit: 100,
						sort: "latest",
					}
				}
			)
			const oldData = response.data['posts']
				.filter((post) => {
					return !post.record['text'].includes("#clae_ae")
				})
				.filter((post) => {
					return post.embed != undefined
				})
				.map((post) => {
					return {
						uri: post.uri,
						cid: post.cid,
						indexedAt: post.indexedAt,
					}
				})
			
			// console.log(oldData)

			await db
				.insertInto('post')
				.values(oldData)
				.onConflict((oc) => oc.doNothing())
				.execute()
			
		}
	}

	public async applyFeedFilter(include_terms?: Array<String>, exclude_terms?: Array<String>,
		include_authors?: Array<String>, exclude_authors?: Array<String>
	) {
		
	}


	// This handler function is executed when someone attempts to access the feed, not
	// when the subscription catches something or when it's just been instantiated.
	public async handler(ctx: AppContext, params: QueryParams): Promise<any> {
		let builder = ctx.db
			.selectFrom('post')
			.selectAll()
			.orderBy('indexedAt', 'desc')
			.orderBy('cid', 'desc')
			.limit(params.limit)
			

		if (params.cursor) {
			const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
			builder = builder.where('post.indexedAt', '<', timeStr)
		}
		const res = await builder.execute()

		const feed = res.map((row) => ({
			post: row.uri,
		}))

		let cursor: string | undefined
		const last = res.at(-1)
		if (last) {
			cursor = new Date(last.indexedAt).getTime().toString(10)
		}

		return {
			cursor,
			feed,
		}
	}
}