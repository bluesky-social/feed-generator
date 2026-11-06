import type { AtUriString, CidString, DatetimeString } from "@atproto/lex"

export type DatabaseSchema = {
  post: Post
}

export type Post = {
  uri: AtUriString
  cid: CidString
  indexedAt: DatetimeString
  isMedia: 'true' | 'false'
  isVideo: 'true' | 'false'
}
