-- Shorts Uploader – Supabase Database Schema
-- Run this in your Supabase project's SQL editor (Dashboard → SQL Editor → New Query).

-- ============================================================
-- users
-- Created by Google OAuth login; extended with platform tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             TEXT        PRIMARY KEY,   -- Google subject ID
  email          TEXT        NOT NULL UNIQUE,
  display_name   TEXT,
  avatar_url     TEXT,
  youtube_token  TEXT,                      -- AES-256-GCM encrypted JSON
  tiktok_token   TEXT,                      -- AES-256-GCM encrypted JSON
  instagram_token TEXT,                     -- AES-256-GCM encrypted JSON
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- upload_jobs
-- One row per upload job; statuses updated as uploads progress
-- ============================================================
CREATE TABLE IF NOT EXISTS upload_jobs (
  job_id      UUID        PRIMARY KEY,
  user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  platforms   TEXT[]      NOT NULL,
  file_path   TEXT        NOT NULL,
  -- JSONB map: { youtube?: PlatformStatus, tiktok?: PlatformStatus, instagram?: PlatformStatus }
  statuses    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS upload_jobs_user_id_idx ON upload_jobs (user_id);
