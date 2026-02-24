package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
)

func NewServer(cfg *Config, db *Database, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /.well-known/did.json", handleWellKnown(cfg))
	mux.HandleFunc("GET /xrpc/_health", handleHealth)
	mux.HandleFunc("GET /xrpc/app.bsky.feed.describeFeedGenerator", handleDescribeFeedGenerator(cfg))
	mux.HandleFunc("GET /xrpc/app.bsky.feed.getFeedSkeleton", handleGetFeedSkeleton(cfg, db, logger))

	return mux
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}

func handleWellKnown(cfg *Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(cfg.ServiceDID, cfg.Hostname) {
			http.NotFound(w, r)
			return
		}
		writeJSON(w, map[string]any{
			"@context": []string{"https://www.w3.org/ns/did/v1"},
			"id":       cfg.ServiceDID,
			"service": []map[string]any{
				{
					"id":              "#bsky_fg",
					"type":            "BskyFeedGenerator",
					"serviceEndpoint": fmt.Sprintf("https://%s", cfg.Hostname),
				},
			},
		})
	}
}

func handleDescribeFeedGenerator(cfg *Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		feeds := make([]map[string]string, 0, len(Algos))
		for shortname := range Algos {
			feeds = append(feeds, map[string]string{
				"uri": fmt.Sprintf("at://%s/app.bsky.feed.generator/%s", cfg.PublisherDID, shortname),
			})
		}
		writeJSON(w, map[string]any{
			"did":   cfg.ServiceDID,
			"feeds": feeds,
		})
	}
}

func handleGetFeedSkeleton(cfg *Config, db *Database, logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		feedParam := r.URL.Query().Get("feed")
		if feedParam == "" {
			writeError(w, http.StatusBadRequest, "missing feed parameter")
			return
		}

		parts := strings.Split(strings.TrimPrefix(feedParam, "at://"), "/")
		if len(parts) != 3 {
			writeError(w, http.StatusBadRequest, "invalid feed URI")
			return
		}
		did, collection, rkey := parts[0], parts[1], parts[2]

		if did != cfg.PublisherDID || collection != "app.bsky.feed.generator" {
			writeError(w, http.StatusBadRequest, "UnsupportedAlgorithm")
			return
		}

		algo, ok := Algos[rkey]
		if !ok {
			writeError(w, http.StatusBadRequest, "UnsupportedAlgorithm")
			return
		}

		limit := 50
		if l := r.URL.Query().Get("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = min(parsed, 200)
			}
		}
		cursor := r.URL.Query().Get("cursor")

		result, err := algo(r.Context(), db, limit, cursor)
		if err != nil {
			logger.Error("algo error", "algo", rkey, "err", err)
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}

		writeJSON(w, result)
	}
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
