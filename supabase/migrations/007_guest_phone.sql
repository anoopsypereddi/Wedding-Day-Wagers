-- ============================================================
-- Migration 007: Guest phone as unique identifier
-- ============================================================
-- Phone replaces case-insensitive name as the uniqueness key so
-- two guests can share the same display name. Uniqueness is
-- enforced on the digits-only form of the phone so "(555) 123-4567"
-- and "555-123-4567" collapse to the same person.
-- ============================================================

ALTER TABLE guests
    ADD COLUMN phone TEXT;

-- Backfill any pre-existing rows with a synthetic value derived from
-- the guest id so the NOT NULL + UNIQUE constraints can be applied.
UPDATE guests SET phone = 'legacy-' || id::TEXT WHERE phone IS NULL;

ALTER TABLE guests
    ALTER COLUMN phone SET NOT NULL;

-- Drop the old case-insensitive name uniqueness — names are no longer unique.
DROP INDEX IF EXISTS guests_name_ci_idx;

-- Uniqueness on digits-only phone.
CREATE UNIQUE INDEX guests_phone_norm_idx
    ON guests (regexp_replace(phone, '[^0-9]', '', 'g'));

COMMENT ON COLUMN guests.phone IS 'Display phone; uniqueness is enforced on the digits-only form.';
