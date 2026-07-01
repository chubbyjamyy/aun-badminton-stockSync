-- ============================================================
-- Badminton Stock Sync — Supabase Schema
-- Run this in the Supabase SQL Editor to create tables
-- ============================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text    NOT NULL,
  category    text    NOT NULL,
  unit        text    NOT NULL,
  quantity    numeric NOT NULL DEFAULT 0,
  min_stock   numeric NOT NULL DEFAULT 0,
  sell_price  numeric NOT NULL DEFAULT 0,
  unit_cost   numeric NOT NULL DEFAULT 0,
  profit      numeric GENERATED ALWAYS AS (sell_price - unit_cost) STORED,
  color_name  text,
  color_hex   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name  text        NOT NULL,
  type          text        NOT NULL CHECK (type IN ('in', 'out')),
  quantity      numeric     NOT NULL,
  note          text        NOT NULL DEFAULT '',
  date          timestamptz NOT NULL DEFAULT now(),
  stock_before  numeric     NOT NULL,
  stock_after   numeric     NOT NULL,
  purchase_cost numeric,
  cost_before   numeric,
  cost_after    numeric,
  sell_price    numeric
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at     ON products(created_at);
