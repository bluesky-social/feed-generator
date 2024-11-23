import { Generated } from 'kysely'

export type DatabaseSchema = {
  post: Post
  post_tag: PostTag
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
  tag: string
}

export type PostTag = {
  id: number
  post_uri: string
  tag: string
}

export type SubState = {
  service: string
  cursor: number
}
