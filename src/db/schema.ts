export type DatabaseSchema = {
  post: Post
  like: Like
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  indexedAt: string
  likeCount: number
}

export type Like = {
  uri: string
  subjectUri: string
}

export type SubState = {
  service: string
  cursor: number
}
