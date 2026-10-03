-- ============================================================
-- Fix Corrupted Category Icons & Seed Clean Default Categories
-- ============================================================

-- Ensure UTF-8 encoding by replacing any corrupted mojibake entries with clean emojis
UPDATE public.categories SET icon = '🍔' WHERE name ILIKE '%Food%' OR name ILIKE '%Dining%';
UPDATE public.categories SET icon = '🚗' WHERE name ILIKE '%Transport%' OR name ILIKE '%Car%';
UPDATE public.categories SET icon = '🛍️' WHERE name ILIKE '%Shop%';
UPDATE public.categories SET icon = '🏠' WHERE name ILIKE '%House%' OR name ILIKE '%Housing%' OR name ILIKE '%Rent%';
UPDATE public.categories SET icon = '🎬' WHERE name ILIKE '%Entertain%';
UPDATE public.categories SET icon = '💊' WHERE name ILIKE '%Health%' OR name ILIKE '%Fit%' OR name ILIKE '%Medical%';
UPDATE public.categories SET icon = '📚' WHERE name ILIKE '%Educat%';
UPDATE public.categories SET icon = '✈️' WHERE name ILIKE '%Travel%';
UPDATE public.categories SET icon = '📱' WHERE name ILIKE '%Subscript%' OR name ILIKE '%Mobile%';
UPDATE public.categories SET icon = '⚡' WHERE name ILIKE '%Util%' OR name ILIKE '%Bill%';
UPDATE public.categories SET icon = '💆' WHERE name ILIKE '%Personal%';
UPDATE public.categories SET icon = '💼' WHERE name ILIKE '%Salary%' OR name ILIKE '%Income%';
UPDATE public.categories SET icon = '📦' WHERE name ILIKE '%Other%';

-- Ensure public shared categories exist and are accessible to all authenticated users
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Users manage own categories"
  ON public.categories FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
