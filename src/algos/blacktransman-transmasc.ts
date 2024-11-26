import { InvalidRequestError } from '@atproto/xrpc-server'; 
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'; 
import { AppContext } from '../config'; 
import { Post } from '@atproto/api';  // Import the correct type for the post

// max 15 chars
export const shortname = 'blacktransmen'; 

export const handler = async (ctx: AppContext, params: QueryParams) => {
    console.log('looking up posts for ', params.feed);
    
    // Fetch records
    let records = await ctx.agent.com.atproto.repo.listRecords({
        repo: params.feed, 
        cursor: params.cursor, 
        limit: params.limit, 
        collection: 'app.bsky.feed.post', 
    });

    // Fetch posts
    let posts = await ctx.agent.api.app.bsky.feed.getPosts({ uris: records.data.records.map(r => r.uri) });
    if (!posts) throw new InvalidRequestError('failed to get feed');

    // Type assertion to make sure posts are of the correct type
    let filteredPosts = posts.data.posts.filter(post => {
        const postText = (post as Post).text.toLowerCase();  // Assert that 'post' is of type 'Post'
        
        // Check if either hashtag is present
        return postText.includes('#blacktransman') || postText.includes('#blacktransmasc');
    });

    // Sort the filtered posts by likeCount (descending order)
    filteredPosts.sort((a, b) => {
        if (!a.likeCount) return 1; // If a has no likeCount, put it at the end
        if (!b.likeCount) return -1; // If b has no likeCount, put it at the end
        if (a.likeCount < b.likeCount) return 1; // Sort descending by likeCount
        if (a.likeCount > b.likeCount) return -1; // Sort descending by likeCount
        return 0;
    });

    console.log('sorted posts with hashtags', filteredPosts);
    const feed = filteredPosts.map(post => ({ post: post.uri }));
    const cursor = records.data.cursor; // For pagination support
    return { cursor, feed };
};
