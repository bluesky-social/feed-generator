# ATProto Feed Generator

## Overview

Feed Generators are services that provide custom algorithms to users through the AT Protocool.

They work very simply: the server receives a request from a user's server and returns a list of post uris with some optional metadata attached. Those posts are then "hydrated" into full objects by the requesting server and sent back to the client. This route is described in the `com.atproto.feed.getFeedSkeleton` lexicon. (@TODO insert link)

Think of Feed Generators like a user with an API attached. Like Atproto users, a Feed Generator is identified by a DID/handle and use a data repository which holds information like its profile. However a Feed Generator's DID Document also declares a `#bsky_fg` service endpoint that fulfills the interface for a Feed Generator.

The general flow of providing a custom algorithm to a user is as follows:
- A user requests a feed from their server (PDS). Let's say the feed is identified by `@custom-algo.xyz`
- The PDS resolves `@custom-algo.xyz` to it's corresponding DID document
- The PDS sends a `getFeedSkeleton` request to the service endpoint with ID `#bsky_fg`
  - This request is authenticated by a JWT signed by the user's repo signing key
- The Feed Generator returns a skeleton of the feed to the user's PDS
- The PDS hydrates the feed (user info, post contents, aggregates, etc)
  - In the future, the PDS will hydrate the feed with the help of an AppView, but for now the PDS handles hydration itself
- The PDS returns the hydrated feed to the user

To the user this should feel like visiting a page in the app. Once they subscribe, it will appear in their home interface as one of their available feeds.

## Getting started
For now, your algorithm will need to have an account & repository on the `bsky.social` PDS. 

@TODO


## Some Details

### Skeleton metadata

The skeleton that a Feed Generator puts together is, in its simplest form, a list or post uris.

```ts
[
  {post: 'at://did:example:1234/app.bsky.feed.post/1'},
  {post: 'at://did:example:1234/app.bsky.feed.post/2'},
  {post: 'at://did:example:1234/app.bsky.feed.post/3'}
]
```

However we include two locations to attach some additional context. Here is the full schema:

```ts
type SkeletonItem = {
  post: string // post uri
  
  // optional metadata about the thread that this post is in reply to
  replyTo?: {
    root: string, // reply root uri
    parent: string, // reply parent uri
  }
  
  // optional reason for inclusion in the feed
  // (generally to be displayed in client)
  reason?: Reason
}

// for now, the only defined reason is a repost, but this is open to extension
type Reason = ReasonRepost

type ReasonRepost = {
  $type: @TODO
  by: string // the did of the reposting user
  indexedAt: string // the time that the repost took place
}
```

This metadata serves two purposes:

1. To aid the PDS in hydrating all relevant post information
2. To give a cue to the client in terms of context to display when rendering a post


### Authentication

If you are creating a generic feed that does not differ for different users, you do not need to check auth. But if a user's state (such as follows or likes) is taken into account, we _strongly_ encourage you to validate their auth token.

Users are authenticated with a simple JWT signed by the user's repo signing key.

This jwt header/payload takes the format:
```ts
const header = {
  type: "JWT",
  alg: "ES256K" // (key algorithm) - in this case secp256k1
}
const payload = {
  iss: "did:example:alice", // (issuer) the requesting user's DID
  aud: "did:example:feedGenerator", // (audience) the DID of the Feed Generator
  exp: 1683643619 // (expiration) unix timestamp in seconds
}
```

We provide utilities for verifying user JWTs in `@TODO_PACKAGE`

## Suggestions for implementation

How a feed generator fulfills the `getFeedSkeleton` request is completely at their discretion. At the simplest end, a Feed Generator could supply a "feed" that only contains some hardcoded posts.

For most usecases, we recommend subscribing to the firehose at `com.atproto.sync.subscribeRepos`. This websocket will send you every record that is published on the network. Since Feed Generators do not need to provide hydrated posts, you can index as much or as little of the firehose as necessary.

Depending on your algorithm, you likely do not need to keep posts around for long. Unless your algorithm is intended to provide "posts you missed" or something similar, you can likely garbage collect any data that is older tahn 48 hours.

Some examples:

### Reimplementing what's hot
To reimplement "What's Hot", you may subscribe to the firehose & filter for all posts & likes (ignoring profiles/reposts/follows/etc). You would keep a running tally of likes per post & when a PDS requests a feed, you would send the most recent posts that pass some threshold of likes.

### A community feed
You might create a feed for a given community by compiling a list of DIDs within that community & filtering the firehose for all posts from users within that list.

### A topical feed
To implement a topical feed, you might filter the algorithm for posts and pass the post text through some filtering mechanism (an LLM, a keyword matcher, etc) that filters for the topic of your choice.
