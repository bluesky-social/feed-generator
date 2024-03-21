export type DatabaseSchema = {
  post: Post
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
  hidden: boolean
  moderationHistory: string | null
}

export type SubState = {
  service: string
  cursor: number
}
