package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	cfg, err := LoadConfig()
	if err != nil {
		logger.Error("failed to load config", "err", err)
		os.Exit(1)
	}

	db, err := OpenDatabase(cfg.SQLiteLocation)
	if err != nil {
		logger.Error("failed to open database", "err", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.CreateTables(); err != nil {
		logger.Error("failed to create tables", "err", err)
		os.Exit(1)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	sub := NewSubscription(
		db,
		cfg.SubscriptionEndpoint,
		time.Duration(cfg.SubscriptionReconnectDelay)*time.Millisecond,
		logger,
	)
	go sub.Run(ctx)

	handler := NewServer(cfg, db, logger)
	addr := fmt.Sprintf("%s:%d", cfg.ListenHost, cfg.Port)
	srv := &http.Server{Addr: addr, Handler: handler}

	go func() {
		<-ctx.Done()
		logger.Info("shutting down")

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer shutdownCancel()

		srv.SetKeepAlivesEnabled(false)
		srv.Shutdown(shutdownCtx)
	}()

	logger.Info("running feed generator", "addr", fmt.Sprintf("http://%s", addr))
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		logger.Error("server error", "err", err)
		os.Exit(1)
	}
}
