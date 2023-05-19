# ATProto Feed Generator

🚧 Work in Progress 🚧 

We are actively developing Feed Generator integration into the Bluesky PDS. Though we are reasonably confident about the general shape and interfaces laid out here, these interfaces and implementation details _are_ subject to change. 

In the meantime, we've put together this starter kit for devs. It doesn't do everything, but it should be enough to get you familiar with the system & started building!

## Overview

Feed Generators are services that provide custom algorithms to users through the AT Protocol.

They work very simply: the server receives a request from a user's server and returns a list of [post URIs](https://atproto.com/specs/at-uri-scheme) with some optional metadata attached. Those posts are then hydrated into full views by the requesting server and sent back to the client. This route is described in the [`app.bsky.feed.getFeedSkeleton` lexicon](https://atproto.com/lexicons/app-bsky-feed#appbskyfeedgetfeedskeleton).

A Feed Generator service can host one or more algorithms. The service itself is identified by DID, while each algorithm that it hosts is declared by a record in the repo of the account that created it. For instance, feeds offered by Bluesky will likely be declared in `@bsky.app`'s repo. Therefore, a given algorithm is identified by the at-uri of the declaration record. This declaration record includes a pointer to the service's DID along with some profile information for the feed.

The general flow of providing a custom algorithm to a user is as follows:
- A user requests a feed from their server (PDS) using the at-uri of the declared feed
- The PDS resolves the at-uri and finds the DID doc of the Feed Generator
- The PDS sends a `getFeedSkeleton` request to the service endpoint declared in the Feed Generator's DID doc
  - This request is authenticated by a JWT signed by the user's repo signing key
- The Feed Generator returns a skeleton of the feed to the user's PDS
- The PDS hydrates the feed (user info, post contents, aggregates, etc)
  - In the future, the PDS will hydrate the feed with the help of an App View, but for now the PDS handles hydration itself
- The PDS returns the hydrated feed to the user

For users, this should feel like visiting a page in the app. Once they subscribe to a custom algorithm, it will appear in their home interface as one of their available feeds.

## Getting Started

We've set up this simple server with SQLite to store & query data. Feel free to switch this out for whichever database you prefer.

Next you will need to do two things:

1. Implement indexing logic in `src/subscription.ts`. 
   
   This will subscribe to the repo subscription stream on startup, parse events & index them according to your provided logic.

2. Implement feed generation logic in `src/algos`

   For inspiration, we've provided a very simple feed algorithm (`whats-alf`) that returns all posts related to the titular character of the TV show ALF. 

   You can either edit it or add another algorithm alongside it. The types are in place an dyou will just need to return something that satisfies the `SkeletonFeedPost[]` type.

We've taken care of setting this server up with a did:web. However, you're free to switch this out for did:plc if you like - you may want to if you expect this Feed Generator to be long-standing and possibly migrating domains.

### Publishing your feed

To publish your feed, go to the script at `scripts/publishFeedGen.ts` & fill in the variables at the top. Examples are included and some are optional. To publish your feed generator, simply run `yarn publishFeed`.

To update your feed's display data (name, avatar, description, etc), just update the relevant variables & re-run the script.

After successfully running the script, you should be able to see your feed from within the app, as well as share it by embedding a link in a post (similar to a quote post).

## Running the Server

Install dependencies with `yarn` and then run the server with `yarn start`. This will start the server on port 3000, or what's defined in `.env`. You can then watch the firehose output in the console and access the output of the default custom ALF feed at [http://localhost:3000/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:example:alice/app.bsky.feed.generator/whats-alf](http://localhost:3000/xrpc/app.bsky.feed.getFeedSkeleton?feed=at://did:example:alice/app.bsky.feed.generator/whats-alf).

## Some Details

### Skeleton Metadata

The skeleton that a Feed Generator puts together is, in its simplest form, a list of post URIs.

```ts
[
  {post: 'at://did:example:1234/app.bsky.feed.post/1'},
  {post: 'at://did:example:1234/app.bsky.feed.post/2'},
  {post: 'at://did:example:1234/app.bsky.feed.post/3'}
]
```

However, we include an additionl location to attach some context. Here is the full schema:

```ts
type SkeletonItem = {
  post: string // post URI

  // optional reason for inclusion in the feed
  // (generally to be displayed in client)
  reason?: Reason
}

// for now, the only defined reason is a repost, but this is open to extension
type Reason = ReasonRepost

type ReasonRepost = {
  $type: 'app.bsky.feed.defs#skeletonReasonRepost'
  repost: string // repost URI
}
```

This metadata serves two purposes:

1. To aid the PDS in hydrating all relevant post information
2. To give a cue to the client in terms of context to display when rendering a post

### Authentication

If you are creating a generic feed that does not differ for different users, you do not need to check auth. But if a user's state (such as follows or likes) is taken into account, we _strongly_ encourage you to validate their auth token.

Users are authenticated with a simple JWT signed by the user's repo signing key.

This JWT header/payload takes the format:
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

We provide utilities for verifying user JWTs in the `@atproto/xrpc-server` package, and you can see them in action in `src/auth.ts`.

### Pagination
You'll notice that the `getFeedSkeleton` method returns a `cursor` in its response & takes a `cursor` param as input.

This cursor is treated as an opaque value & fully at the Feed Generator's discretion. It is simply pased through the PDS directly to & from the client.

We strongly encourage that the cursor be _unique per feed item_ to prevent unexpected behavior in pagination.

We recommend, for instance, a compound cursor with a timestamp + a CID:
`1683654690921::bafyreia3tbsfxe3cc75xrxyyn6qc42oupi73fxiox76prlyi5bpx7hr72u`

## Suggestions for Implementation

How a feed generator fulfills the `getFeedSkeleton` request is completely at their discretion. At the simplest end, a Feed Generator could supply a "feed" that only contains some hardcoded posts.

For most use cases, we recommend subscribing to the firehose at `com.atproto.sync.subscribeRepos`. This websocket will send you every record that is published on the network. Since Feed Generators do not need to provide hydrated posts, you can index as much or as little of the firehose as necessary.

Depending on your algorithm, you likely do not need to keep posts around for long. Unless your algorithm is intended to provide "posts you missed" or something similar, you can likely garbage collect any data that is older than 48 hours.

Some examples:

### Reimplementing What's Hot
To reimplement "What's Hot", you may subscribe to the firehose & filter for all posts & likes (ignoring profiles/reposts/follows/etc). You would keep a running tally of likes per post & when a PDS requests a feed, you would send the most recent posts that pass some threshold of likes.

### A Community Feed
You might create a feed for a given community by compiling a list of DIDs within that community & filtering the firehose for all posts from users within that list.

### A Topical Feed
To implement a topical feed, you might filter the algorithm for posts and pass the post text through some filtering mechanism (an LLM, a keyword matcher, etc.) that filters for the topic of your choice.
