export type DatabaseSchema = {
  post: Post
}

export type Post = {
  uri: string
  cid: string
  indexedAt: string
  isMedia: 'true' | 'false'
  isVideo: 'true' | 'false'
}
