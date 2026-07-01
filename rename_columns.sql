-- ============================================================
-- Migration: Rename columns in products table
--   price -> sell_price
--   cost  -> unit_cost
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE products RENAME COLUMN price TO sell_price;
ALTER TABLE products RENAME COLUMN cost  TO unit_cost;
