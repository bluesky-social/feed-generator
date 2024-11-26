import { InvalidRequestError } from '@atproto/xrpc-server';
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton';
import { AppContext } from '../config'; // Make sure AppContext is imported

// max 15 chars
export const shortname = 'blacktransmen';

export const handler = async (ctx: AppContext, params: QueryParams) => {
  // TypeScript now knows that ctx has 'agent'
  console.log('looking up posts for ', params.feed);
  
  // Accessing 'agent' from the context
  let records = await ctx.agent.com.atproto.repo.listRecords({
    repo: params.feed,
    cursor: params.cursor,
    limit: params.limit,
    collection: 'app.bsky.feed.post',
  });
  let posts = await ctx.agent.api.app.bsky.feed.getPosts({ uris: records.data.records.map(r => r.uri) });
  
  if (!posts) throw new InvalidRequestError('failed to get feed');

  // Filter posts that contain the hashtags #blacktransman or #blacktransmasc
  let filteredPosts = posts.data.posts.filter(post => {
    const postText = post.text.toLowerCase();
    return postText.includes('#blacktransman') || postText.includes('#blacktransmasc');
  });

  // Sort the filtered posts by likeCount (descending order)
  filteredPosts.sort((a, b) => {
    if (!a.likeCount) return 1;
    if (!b.likeCount) return -1;
    if (a.likeCount < b.likeCount) return 1;
    if (a.likeCount > b.likeCount) return -1;
    return 0;
  });
  console.log('sorted posts with hashtags', filteredPosts);

  // Return the posts
  const feed = filteredPosts.map(post => ({ post: post.uri }));
  const cursor = records.data.cursor; // For pagination support
  return { cursor, feed };
};
