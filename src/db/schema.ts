import type { AtUriString, CidString, DatetimeString } from "@atproto/lex"

export type DatabaseSchema = {
  post: Post
  sub_state: SubState
}

export type Post = {
  uri: AtUriString
  cid: CidString
  indexedAt: DatetimeString
}

export type SubState = {
  service: string
  cursor: number
}
