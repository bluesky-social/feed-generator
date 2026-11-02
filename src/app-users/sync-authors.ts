import dotenv from 'dotenv'
import { Database } from '../db'
import {
	AppUser,
	createSupabaseClient,
	fetchAppUsers,
} from './supabase'
import { isPoliticalPost } from '../util/political'

dotenv.config()

const reconcileAppUsers = async (
	db: Database,
	dids: Set<string>,
	users: AppUser[],
) => {
	await db.transaction().execute(async (transaction) => {
		await transaction.deleteFrom('app_user').execute()
		if (users.length > 0) {
			await transaction.insertInto('app_user').values(users).execute()
		}
	})

	dids.clear()
	for (const user of users) dids.add(user.did)
}

type AuthorFeedPost = {
	post: {
		uri: string
		cid: string
		author: { did: string }
		record: { createdAt?: unknown; langs?: unknown; text?: unknown }
	}
}

const backfillAuthor = async (db: Database, did: string) => {
	const appViewUrl = (process.env.APPVIEW_URL ?? 'https://public.api.bsky.app')
		.replace(/\/$/, '')
	const configuredMaxPages = Number(process.env.APP_USER_BACKFILL_MAX_PAGES)
	const maxPages = Number.isFinite(configuredMaxPages)
		? Math.max(1, configuredMaxPages)
		: 5
	let cursor: string | undefined

	for (let pageNumber = 0; pageNumber < maxPages; pageNumber++) {
		const url = new URL(`${appViewUrl}/xrpc/app.bsky.feed.getAuthorFeed`)
		url.searchParams.set('actor', did)
		url.searchParams.set('limit', '100')
		url.searchParams.set('filter', 'posts_with_replies')
		if (cursor) url.searchParams.set('cursor', cursor)

		let response: Response | undefined
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				response = await fetch(url)
				if (response.ok) break
				throw new Error(`AppView returned HTTP ${response.status}`)
			} catch (error) {
				if (attempt === 2) throw error
				await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
			}
		}

		if (!response?.ok) throw new Error('AppView request failed')
		const result = (await response.json()) as {
			feed?: AuthorFeedPost[]
			cursor?: string
		}
		const posts = (result.feed ?? [])
			.filter((item) => item.post.author.did === did)
			.flatMap((item) => {
				const record = item.post.record
				if (typeof record.createdAt !== 'string') return []
				const text = typeof record.text === 'string' ? record.text : ''
				return [
					{
						uri: item.post.uri,
						cid: item.post.cid,
						indexedAt: new Date().toISOString(),
						authorDid: did,
						createdAt: record.createdAt,
						langsJson: JSON.stringify(
							Array.isArray(record.langs) ? record.langs : [],
						),
						isPolitical: isPoliticalPost(text) ? 1 : 0,
						status: 'active' as const,
					},
				]
			})

		if (posts.length > 0) {
			await db
				.insertInto('post')
				.values(posts)
				.onConflict((conflict) =>
					conflict.column('uri').doUpdateSet((expression) => ({
						cid: expression.ref('excluded.cid'),
						indexedAt: expression.ref('excluded.indexedAt'),
						authorDid: expression.ref('excluded.authorDid'),
						createdAt: expression.ref('excluded.createdAt'),
						langsJson: expression.ref('excluded.langsJson'),
						isPolitical: expression.ref('excluded.isPolitical'),
						status: expression.ref('excluded.status'),
					})),
				)
				.execute()
		}

		cursor = result.cursor
		if (!cursor || !result.feed?.length) break
	}

	console.log(`Backfilled public posts for ${did}`)
}

export const startAuthorSync = async (
	db: Database,
	dids: Set<string>,
): Promise<void> => {
	const supabase = createSupabaseClient()
	let queuedWork = Promise.resolve()
	let queuedBackfills = Promise.resolve()
	const backfillsInProgress = new Set<string>()

	const scheduleBackfill = (did: string) => {
		if (backfillsInProgress.has(did)) return
		backfillsInProgress.add(did)
		queuedBackfills = queuedBackfills
			.then(() => backfillAuthor(db, did))
			.catch((error: unknown) => {
				console.error(
					`Could not backfill public posts for ${did}`,
					error instanceof Error ? error.message : error,
				)
			})
			.finally(() => backfillsInProgress.delete(did))
	}

	const enqueue = (work: () => Promise<void>) => {
		queuedWork = queuedWork
			.then(work)
			.catch((error: unknown) => {
				console.error(
					'App user synchronization failed',
					error instanceof Error ? error.message : error,
				)
			})
		return queuedWork
	}

	const channel = supabase
		.channel('feed-generator-app-users')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'app_users' },
			(payload) => {
				const row = (payload.eventType === 'DELETE'
					? payload.old
					: payload.new) as Partial<AppUser>
				if (!row.did) return

				void enqueue(async () => {
					if (payload.eventType === 'DELETE') {
						await db.deleteFrom('app_user').where('did', '=', row.did!).execute()
						dids.delete(row.did!)
						return
					}

					const user: AppUser = {
						did: row.did!,
						handle: row.handle ?? null,
						pds_url: row.pds_url ?? null,
						first_seen_at: row.first_seen_at ?? null,
						last_seen_at: row.last_seen_at ?? null,
					}
					await db
						.insertInto('app_user')
						.values(user)
						.onConflict((conflict) =>
							conflict.column('did').doUpdateSet({
								handle: user.handle,
								pds_url: user.pds_url,
								first_seen_at: user.first_seen_at,
								last_seen_at: user.last_seen_at,
							}),
						)
						.execute()
					const isNewUser = !dids.has(user.did)
					dids.add(user.did)
					if (isNewUser) scheduleBackfill(user.did)
					console.log(`App user added/updated: ${user.did}`)
				})
			},
		)
		.subscribe((status, error) => {
			if (status === 'SUBSCRIBED') {
				console.log('Listening to Supabase public.app_users changes')
			} else if (
				status === 'CHANNEL_ERROR' ||
				status === 'TIMED_OUT' ||
				status === 'CLOSED'
			) {
				console.error('Supabase Realtime channel status:', status, error?.message)
			}
		})

	const reconcile = async () => {
		const users = await fetchAppUsers(supabase)
		const newUsers = users.filter((user) => !dids.has(user.did))
		await reconcileAppUsers(db, dids, users)
		console.log(`Synchronized ${users.length} app users`)
		for (const user of newUsers) scheduleBackfill(user.did)
	}

	await enqueue(reconcile)
	const reconciliationTimer = setInterval(() => {
		void enqueue(reconcile)
	}, 60_000)
	reconciliationTimer.unref()
	void channel
}

const printAppUsers = async () => {
	const users = await fetchAppUsers()
	console.table(users)
	console.log(`Total app users: ${users.length}`)
}

if (require.main === module) {
	printAppUsers().catch((error: unknown) => {
		console.error(
			error instanceof Error ? error.message : 'Failed to read app users',
		)
		process.exitCode = 1
	})
}
