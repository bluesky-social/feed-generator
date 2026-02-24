# AT Protocol Feed Generator (Go)

Go implementation of the AT Protocol Feed Generator starter kit, using the [indigo](https://github.com/bluesky-social/indigo) library.

## Quickstart

```bash
cp .env.example .env
# Edit .env with your values

go run .
```

## Configuration

All configuration is via environment variables (see `.env.example`).

## Adding Custom Feeds

Edit `algos.go` to register new feed algorithms. Each algo is a function with signature:

```go
func(ctx context.Context, db *Database, limit int, cursor string) (*bsky.FeedGetFeedSkeleton_Output, error)
```

Add your handler to the `Algos` map with the feed's rkey as the map key.
