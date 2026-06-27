-- ─────────────────────────────────────────────────────────────────────────────
-- V3: Add JSONB i18n columns to courses and lessons
-- Pattern: {"uz": "...", "en": "...", "ru": "..."}
-- Existing title_uz / title_en columns are kept for backward compatibility.
-- ─────────────────────────────────────────────────────────────────────────────

-- courses: add jsonb title + description columns
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS title_i18n        JSONB,
    ADD COLUMN IF NOT EXISTS description_i18n  JSONB;

-- Back-fill: migrate existing uz/en values into the JSONB columns
UPDATE courses
SET title_i18n = jsonb_build_object(
    'uz', COALESCE(title_uz, ''),
    'en', COALESCE(title_en, title_uz, ''),
    'ru', COALESCE(title_uz, '')   -- ru falls back to uz until provided
)
WHERE title_i18n IS NULL;

UPDATE courses
SET description_i18n = jsonb_build_object(
    'uz', COALESCE(description_uz, ''),
    'en', COALESCE(description_uz, ''),
    'ru', COALESCE(description_uz, '')
)
WHERE description_i18n IS NULL;

-- lessons: add jsonb title + content columns
ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS title_i18n    JSONB,
    ADD COLUMN IF NOT EXISTS content_i18n  JSONB;

UPDATE lessons
SET title_i18n = jsonb_build_object(
    'uz', COALESCE(title_uz, ''),
    'en', COALESCE(title_uz, ''),
    'ru', COALESCE(title_uz, '')
)
WHERE title_i18n IS NULL;

UPDATE lessons
SET content_i18n = jsonb_build_object(
    'uz', COALESCE(content_uz, ''),
    'en', COALESCE(content_uz, ''),
    'ru', COALESCE(content_uz, '')
)
WHERE content_i18n IS NULL;

-- GIN index for fast JSONB key lookup
CREATE INDEX IF NOT EXISTS idx_courses_title_i18n       ON courses USING GIN (title_i18n);
CREATE INDEX IF NOT EXISTS idx_lessons_title_i18n       ON lessons  USING GIN (title_i18n);
