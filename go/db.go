package main

import (
	"database/sql"
	"fmt"
	"strings"

	_ "modernc.org/sqlite"
)

type Database struct {
	db *sql.DB
}

func OpenDatabase(path string) (*Database, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	// Enable WAL mode for better concurrent read/write performance.
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		db.Close()
		return nil, fmt.Errorf("setting WAL mode: %w", err)
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) CreateTables() error {
	_, err := d.db.Exec(`
		CREATE TABLE IF NOT EXISTS post (
			uri TEXT PRIMARY KEY,
			cid TEXT NOT NULL,
			indexed_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sub_state (
			service TEXT PRIMARY KEY,
			cursor INTEGER NOT NULL
		);
	`)
	return err
}

func (d *Database) InsertPost(uri, cid, indexedAt string) error {
	_, err := d.db.Exec(
		"INSERT OR IGNORE INTO post (uri, cid, indexed_at) VALUES (?, ?, ?)",
		uri, cid, indexedAt,
	)
	return err
}

func (d *Database) DeletePost(uri string) error {
	_, err := d.db.Exec("DELETE FROM post WHERE uri = ?", uri)
	return err
}

func (d *Database) DeletePosts(uris []string) error {
	if len(uris) == 0 {
		return nil
	}
	// Build a parameterized query for batch delete.
	query := "DELETE FROM post WHERE uri IN (?" + strings.Repeat(",?", len(uris)-1) + ")"
	args := make([]any, len(uris))
	for i, u := range uris {
		args[i] = u
	}
	_, err := d.db.Exec(query, args...)
	return err
}

func (d *Database) GetCursor(service string) (int64, error) {
	var cursor int64
	err := d.db.QueryRow("SELECT cursor FROM sub_state WHERE service = ?", service).Scan(&cursor)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return cursor, err
}

func (d *Database) UpdateCursor(service string, cursor int64) error {
	_, err := d.db.Exec(`
		INSERT INTO sub_state (service, cursor) VALUES (?, ?)
		ON CONFLICT(service) DO UPDATE SET cursor = excluded.cursor
	`, service, cursor)
	return err
}

type Post struct {
	URI       string
	CID       string
	IndexedAt string
}

func (d *Database) GetRecentPosts(limit int, cursor string) ([]Post, error) {
	var rows *sql.Rows
	var err error
	if cursor != "" {
		rows, err = d.db.Query(
			"SELECT uri, cid, indexed_at FROM post WHERE indexed_at < ? ORDER BY indexed_at DESC, cid DESC LIMIT ?",
			cursor, limit,
		)
	} else {
		rows, err = d.db.Query(
			"SELECT uri, cid, indexed_at FROM post ORDER BY indexed_at DESC, cid DESC LIMIT ?",
			limit,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.URI, &p.CID, &p.IndexedAt); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}
