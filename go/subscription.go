package main

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	bsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/events"
	"github.com/bluesky-social/indigo/events/schedulers/parallel"
	"github.com/bluesky-social/indigo/repo"
	"github.com/gorilla/websocket"
)

type Subscription struct {
	db             *Database
	service        string
	logger         *slog.Logger
	reconnectDelay time.Duration
}

func NewSubscription(db *Database, service string, reconnectDelay time.Duration, logger *slog.Logger) *Subscription {
	return &Subscription{
		db:             db,
		service:        service,
		logger:         logger,
		reconnectDelay: reconnectDelay,
	}
}

// Run starts the firehose subscription with automatic reconnection.
func (s *Subscription) Run(ctx context.Context) {
	for {
		if err := s.subscribe(ctx); err != nil {
			if ctx.Err() != nil {
				return
			}
			s.logger.Error("subscription error, reconnecting", "err", err, "delay", s.reconnectDelay)
			select {
			case <-time.After(s.reconnectDelay):
			case <-ctx.Done():
				return
			}
		}
	}
}

func (s *Subscription) subscribe(ctx context.Context) error {
	cursor, err := s.db.GetCursor(s.service)
	if err != nil {
		return fmt.Errorf("getting cursor: %w", err)
	}

	u, err := url.Parse(s.service)
	if err != nil {
		return fmt.Errorf("parsing service URL: %w", err)
	}
	u.Path = "xrpc/com.atproto.sync.subscribeRepos"
	if cursor > 0 {
		q := u.Query()
		q.Set("cursor", fmt.Sprintf("%d", cursor))
		u.RawQuery = q.Encode()
	}

	s.logger.Info("connecting to firehose", "url", u.String())

	con, _, err := websocket.DefaultDialer.DialContext(ctx, u.String(), http.Header{
		"User-Agent": []string{"feed-generator/0.1"},
	})
	if err != nil {
		return fmt.Errorf("dialing firehose: %w", err)
	}
	defer con.Close()

	rsc := &events.RepoStreamCallbacks{
		RepoCommit: func(evt *comatproto.SyncSubscribeRepos_Commit) error {
			return s.handleCommit(ctx, evt)
		},
	}

	sched := parallel.NewScheduler(
		4,    // workers
		1000, // max queue
		s.service,
		rsc.EventHandler,
	)

	s.logger.Info("firehose connected, consuming events")
	return events.HandleRepoStream(ctx, con, sched, s.logger)
}

func (s *Subscription) handleCommit(ctx context.Context, evt *comatproto.SyncSubscribeRepos_Commit) error {
	if evt.TooBig {
		return nil
	}

	rr, err := repo.ReadRepoFromCar(ctx, bytes.NewReader(evt.Blocks))
	if err != nil {
		s.logger.Error("failed to read repo from car", "err", err)
		return nil
	}

	var postsToDelete []string
	for _, op := range evt.Ops {
		collection := strings.Split(op.Path, "/")[0]

		switch op.Action {
		case "create":
			if collection != "app.bsky.feed.post" || op.Cid == nil {
				continue
			}

			_, recordCBOR, err := rr.GetRecordBytes(ctx, op.Path)
			if err != nil {
				s.logger.Error("reading record from car", "err", err)
				continue
			}

			var post bsky.FeedPost
			if err := post.UnmarshalCBOR(bytes.NewReader(*recordCBOR)); err != nil {
				s.logger.Error("failed to parse post record", "err", err)
				continue
			}
			fmt.Println(post.Text)
			if strings.Contains(strings.ToLower(post.Text), "alf") {
				uri := fmt.Sprintf("at://%s/%s", evt.Repo, op.Path)
				indexedAt := time.Now().UTC().Format(time.RFC3339Nano)
				if err := s.db.InsertPost(uri, op.Cid.String(), indexedAt); err != nil {
					s.logger.Error("inserting post", "err", err)
				}
			}

		case "delete":
			if collection == "app.bsky.feed.post" {
				uri := fmt.Sprintf("at://%s/%s", evt.Repo, op.Path)
				postsToDelete = append(postsToDelete, uri)
			}
		}
	}

	if err := s.db.DeletePosts(postsToDelete); err != nil {
		s.logger.Error("deleting posts", "err", err)
	}

	// Update cursor every 20 events.
	if evt.Seq%20 == 0 {
		if err := s.db.UpdateCursor(s.service, evt.Seq); err != nil {
			s.logger.Error("updating cursor", "err", err)
		}
	}

	return nil
}
