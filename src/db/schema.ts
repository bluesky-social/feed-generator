export type DatabaseSchema = {
  post: Post
  app_user: AppUser
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  indexedAt: string
  authorDid: string
  createdAt: string
  langsJson: string
  isPolitical: number
  status: 'active' | 'deleted'
}

export type AppUser = {
  did: string
  handle: string | null
  pds_url: string | null
  first_seen_at: string | null
  last_seen_at: string | null
}

export type SubState = {
  service: string
  cursor: number
}
