-- ============================================================
-- Migration: Add generated column profit = sell_price - unit_cost
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE products
  ADD COLUMN profit numeric GENERATED ALWAYS AS (sell_price - unit_cost) STORED;
