-- ============================================================
-- Add per-user Gemini API key column to profiles
-- Ensures each user has their own private AI API key synced across devices
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gemini_api_key text;
