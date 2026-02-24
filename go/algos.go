package main

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/bluesky-social/indigo/api/bsky"
)

// AlgoHandler is the function signature for feed algorithm implementations.
type AlgoHandler func(ctx context.Context, db *Database, limit int, cursor string) (*bsky.FeedGetFeedSkeleton_Output, error)

// Algos maps feed rkeys to their handler implementations.
var Algos = map[string]AlgoHandler{
	"whats-alf": whatsAlf,
}

func whatsAlf(ctx context.Context, db *Database, limit int, cursor string) (*bsky.FeedGetFeedSkeleton_Output, error) {
	var indexedAtCursor string
	if cursor != "" {
		// Cursor is a Unix timestamp in milliseconds (same as TS version).
		ms, err := strconv.ParseInt(cursor, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid cursor: %w", err)
		}
		indexedAtCursor = time.UnixMilli(ms).UTC().Format(time.RFC3339Nano)
	}

	posts, err := db.GetRecentPosts(limit, indexedAtCursor)
	if err != nil {
		return nil, fmt.Errorf("querying posts: %w", err)
	}

	feed := make([]*bsky.FeedDefs_SkeletonFeedPost, len(posts))
	for i, p := range posts {
		feed[i] = &bsky.FeedDefs_SkeletonFeedPost{
			Post: p.URI,
		}
	}

	var newCursor *string
	if len(posts) > 0 {
		last := posts[len(posts)-1]
		t, err := time.Parse(time.RFC3339Nano, last.IndexedAt)
		if err == nil {
			c := strconv.FormatInt(t.UnixMilli(), 10)
			newCursor = &c
		}
	}

	return &bsky.FeedGetFeedSkeleton_Output{
		Cursor: newCursor,
		Feed:   feed,
	}, nil
}
