export type DatabaseSchema = {
  post: Post
  like: Like
  following: Following
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

export type Following = {
  did: string
}

export type SubState = {
  service: string
  cursor: number
}
