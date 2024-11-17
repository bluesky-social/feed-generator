export type DatabaseSchema = {
  post: Post
  sub_state: SubState
  author: Author
  member_points: MemberPoints
}

export type Post = {
  uri: string
  cid: string
  replyParent: string | null
  replyRoot: string | null
  indexedAt: string
}

export type Author = {
  did: string
}

export type SubState = {
  service: string
  cursor: bigint
}

export type MemberPoints = {
  did: string
  points: number
}
