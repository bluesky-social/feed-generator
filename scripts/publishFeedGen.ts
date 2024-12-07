import { subscribeToFirehose } from './firehose';

export async function indexPosts() {
    const subscription = await subscribeToFirehose();
    subscription.on('post', (post) => {
        const text = post.text.toLowerCase();
        if (
            text.includes('california native plants') ||
            text.includes('ceanothus') ||
            text.includes('manzanita') ||
            text.includes('#californianatives') ||
            text.includes('#nativeplants')
        ) {
            saveToDatabase(post); // Save posts matching criteria
        }
    });
}

import { SkeletonFeedPost } from '../types';
import { getIndexedPosts } from '../database'; // Replace with your actual database utility

export async function californiaNativePlantsFeed(): Promise<SkeletonFeedPost[]> {
    const posts = await getIndexedPosts(); // Fetch posts from the database
    const filteredPosts = posts.filter(post => {
        const text = post.text.toLowerCase();
        return (
            text.includes('california native plants') ||
            text.includes('ceanothus') ||
            text.includes('manzanita') ||
            text.includes('#californianatives') ||
            text.includes('#nativeplants')
        );
    });

    return filteredPosts.map(post => ({ post: post.uri }));
}

import { californiaNativePlantsFeed } from './algos/californiaNativePlants';

feeds['at://did:your-did/app.bsky.feed.generator/California-native-plants'] = CaliforniaNativePlantsFeed;

const feedMetadata = {
    name: 'California Native Plants',
    avatar: 'https://example.com/path-to-avatar.png', // Optional avatar URL
    description: 'A feed featuring posts about California native plants.',
    feedUri: 'at://did:your-did/app.bsky.feed.generator/california-native-plants',
    serviceDid: 'did:web:your-domain.com'
};

const feedMetadata = {
    name: 'California Native Plants',
    avatar: 'https://example.com/path-to-avatar.png', // Optional avatar URL
    description: 'A feed featuring posts about California native plants.',
    feedUri: 'at://did:your-did/app.bsky.feed.generator/california-native-plants',
    serviceDid: 'did:web:your-domain.com'
};



run()
