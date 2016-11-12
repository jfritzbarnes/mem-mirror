-- Up
CREATE TABLE config (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at REAL NOT NULL
);

-- Down
DROP TABLE config;
