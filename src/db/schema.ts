export type DatabaseSchema = {
  post: Post
  sub_state: SubState
  author: Author
  member_points: MemberPoints
  feed_task: FeedTask
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

export type FeedTask = {
  type: string
  lastRun: string
}

export type MemberPoints = {
  did: string
  points: number
  dailyPoints: number
}
