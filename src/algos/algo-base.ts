import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { BskyAgent } from '@atproto/api'
import { Database } from '../db'
import axios from 'axios'

export type Filter = (queryTerm : string | undefined) => boolean
export type PostFilterQuery = {
	post: string,
	authorInclude? : string | undefined,
	authorExclude? : string | undefined
}

// Borrowed the idea for algo base classes from the Marisa Feed Generator by vSLG
// (https://github.com/vSLG/marisa-feed-generator/)
export abstract class AlgoBase {
	public shortname: string
	public feed: number

	public agent : BskyAgent

	includedAuthors : String[]
	excludedAuthors : String[]
	includedKeywords : String[]
	excludedKeywords : String[]

	constructor(feed: number) {
		this.feed = feed
		this.agent = new BskyAgent({service: "https://api.bsky.app/"})
	}

	public async initFeed(db: Database) {
		console.log("Initializing feed " + this.shortname)
		// var stringify = require('qs-stringify')

		// var posts = await db
		// 	.selectFrom("post")
		// 	.selectAll()
		// 	.execute()

		// Current problem is that search is not supported using
		// BskyAgent, and we need to access the HTTP API directly.
		// example: https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?author=did:plc:wc2nljklaywqr4axivpddo4i&q=anothereden&limit=100&sort=latest
		
		// For now, grabbing the data from the user is done using Axios API
		const response = await axios.get('app.bsky.feed.searchPosts',
			{
				baseURL: 'https://public.api.bsky.app/xrpc/',
				params: {
					author: this.includedAuthors[0], // TODO search multiple users
					q: this.includedKeywords[0], // TODO query using or
					limit: 100,
					sort: "latest",
				},
				// paramsSerializer: {
				// 	encode: (param) => {
				// 		console.log(param + " + ")
				// 		return param
				// 	},
				// 	serialize: (params, options?) => {
				// 		var stri = ""
				// 		for (const key in params) {
				// 			const val = params[key]
				// 			stri += key + "="
				// 			stri += val + "&"
				// 		}
				// 		stri = stri.replace("#", "%23")
				// 		console.log(stri)
				// 		return stri
				// 	}
				// }
			}
		)
		// console.log(response.data)
		// response.data.posts.forEach((post) => {console.log(post.record)})
		const oldData = response.data['posts']
			.filter((post) => {
				return this.applyFeedFilter({
					post: post.record['text'],
					authorInclude: post.author['did']
				})
			})
			.filter((post) => {
				return post.embed != undefined
			})
			.map((post) => {
				return {
					uri: post.uri,
					cid: post.cid,
					indexedAt: post.indexedAt
				}
			})
		
		console.log(oldData)

		if (oldData.length > 0) {	
			const stat = await db
				.insertInto('post')
				.values(oldData)
				.onConflict((oc) => oc.doNothing())
				.execute()
		}
	}

	isAuthorIncluded: Filter = (queryTerm? : string) : boolean => {
		return this.includedAuthors.some((author : string) => {
				return queryTerm?.includes(author)
			})
	}
	
	isAuthorExcluded: Filter = (queryTerm? : string) : boolean => {
		return !this.excludedAuthors.some((author : string) => {
				return queryTerm?.includes(author)
			})
	}

	isKeywordIncluded: Filter = (queryTerm : string) : boolean => {
		return this.includedKeywords.some((keyword : string) => {
				return queryTerm.includes(keyword)
			})
	}
	
	isKeywordExcluded: Filter = (queryTerm : string) : boolean => {
		return !this.excludedKeywords.some((keyword : string) => {
				return queryTerm.includes(keyword)
			})
	}

	public async applyFeedFilter(postToFilter : PostFilterQuery) : Promise<boolean> {
		return this.isAuthorIncluded(postToFilter.authorInclude)
			&& this.isAuthorExcluded(postToFilter.authorExclude)
			&& this.isKeywordIncluded(postToFilter.post)
			&& this.isKeywordExcluded(postToFilter.post)
	}

	// This handler function is executed when someone attempts to access the feed, not
	// when the subscription catches something or when it's just been instantiated.
	public async handler(ctx: AppContext, params: QueryParams): Promise<any> {
		let builder = ctx.db
			.selectFrom('post')
			.selectAll()
			.orderBy('indexedAt', 'desc')
			.orderBy('cid', 'desc')
			

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