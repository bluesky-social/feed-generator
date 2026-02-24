package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                       int
	ListenHost                 string
	Hostname                   string
	SQLiteLocation             string
	SubscriptionEndpoint       string
	ServiceDID                 string
	PublisherDID               string
	SubscriptionReconnectDelay int // milliseconds
}

func LoadConfig() (*Config, error) {
	// Load .env file if present; ignore error if missing.
	godotenv.Load()

	hostname := envOrDefault("FEEDGEN_HOSTNAME", "example.com")
	serviceDID := envOrDefault("FEEDGEN_SERVICE_DID", fmt.Sprintf("did:web:%s", hostname))

	port, err := envIntOrDefault("FEEDGEN_PORT", 3000)
	if err != nil {
		return nil, fmt.Errorf("invalid FEEDGEN_PORT: %w", err)
	}

	reconnectDelay, err := envIntOrDefault("FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY", 3000)
	if err != nil {
		return nil, fmt.Errorf("invalid FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY: %w", err)
	}

	return &Config{
		Port:                       port,
		ListenHost:                 envOrDefault("FEEDGEN_LISTENHOST", "localhost"),
		Hostname:                   hostname,
		SQLiteLocation:             envOrDefault("FEEDGEN_SQLITE_LOCATION", ":memory:"),
		SubscriptionEndpoint:       envOrDefault("FEEDGEN_SUBSCRIPTION_ENDPOINT", "wss://bsky.network"),
		ServiceDID:                 serviceDID,
		PublisherDID:               envOrDefault("FEEDGEN_PUBLISHER_DID", "did:example:alice"),
		SubscriptionReconnectDelay: reconnectDelay,
	}, nil
}

func envOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func envIntOrDefault(key string, defaultVal int) (int, error) {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal, nil
	}
	return strconv.Atoi(val)
}
