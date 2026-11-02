import { createClient } from '@supabase/supabase-js'

export type AppUser = {
	did: string
	handle: string | null
	pds_url: string | null
	first_seen_at: string | null
	last_seen_at: string | null
}

export const createSupabaseClient = () => {
	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

	if (!supabaseUrl || !supabaseSecretKey) {
		throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be configured')
	}

	return createClient(supabaseUrl, supabaseSecretKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	})
}

export const fetchAppUsers = async (
	supabase = createSupabaseClient(),
): Promise<AppUser[]> => {
	const pageSize = 500
	const users: AppUser[] = []

	for (let from = 0; ; from += pageSize) {
		const { data, error } = await supabase
			.from('app_users')
			.select('did, handle, pds_url, first_seen_at, last_seen_at')
			.order('did')
			.range(from, from + pageSize - 1)

		if (error) {
			throw new Error(`Could not read public.app_users: ${error.message}`)
		}

		users.push(...(data as AppUser[]))
		if (data.length < pageSize) break
	}

	return users
}
