-- ============================================================
-- EDT SALES FUNNEL — DATABASE SCHEMA v1.0
-- Run this entire file in Supabase SQL Editor
-- Project: edt-sales-funnel-2026
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  role       text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TABLE: deals
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,
  client_name         text NOT NULL,
  bucket              text NOT NULL CHECK (bucket IN ('small', 'medium', 'large')),
  estimated_value     numeric NOT NULL CHECK (estimated_value > 0),
  probability         integer NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  stage               text NOT NULL DEFAULT 'leads'
                      CHECK (stage IN ('leads', 'negotiation', 'closed_won', 'closed_lost')),
  expected_close_date date,
  month_attribution   date NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  next_action         text,
  next_action_due     date,
  owner_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes               text,
  tags                text[] DEFAULT '{}',
  industry            text,
  source              text,
  last_updated_at     timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Auto-update last_updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_last_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_at();

-- Auto-set month_attribution from expected_close_date on INSERT/UPDATE
CREATE OR REPLACE FUNCTION set_month_attribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expected_close_date IS NOT NULL THEN
    NEW.month_attribution = DATE_TRUNC('month', NEW.expected_close_date);
  ELSIF NEW.month_attribution IS NULL THEN
    NEW.month_attribution = DATE_TRUNC('month', now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_set_month ON deals;
CREATE TRIGGER deals_set_month
  BEFORE INSERT OR UPDATE OF expected_close_date ON deals
  FOR EACH ROW EXECUTE FUNCTION set_month_attribution();

-- ============================================================
-- TABLE: deal_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS deal_notes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id    uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  content    text NOT NULL,
  author_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: targets
-- ============================================================
CREATE TABLE IF NOT EXISTS targets (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  month          date NOT NULL UNIQUE,  -- Always YYYY-MM-01
  baseline       numeric NOT NULL DEFAULT 90000,
  good           numeric NOT NULL DEFAULT 108000,
  excellent      numeric NOT NULL DEFAULT 130000,
  active_target  numeric,               -- NULL = use baseline
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: email_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS email_subscribers (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      text NOT NULL UNIQUE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_deals_stage         ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id      ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_month_attr    ON deals(month_attribution);
CREATE INDEX IF NOT EXISTS idx_deals_bucket        ON deals(bucket);
CREATE INDEX IF NOT EXISTS idx_deals_last_updated  ON deals(last_updated_at);
CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id  ON deal_notes(deal_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── PROFILES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select"       ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ─── DEALS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "deals_select" ON deals;
DROP POLICY IF EXISTS "deals_insert" ON deals;
DROP POLICY IF EXISTS "deals_update" ON deals;
DROP POLICY IF EXISTS "deals_delete" ON deals;

CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (get_my_role() = 'admin' OR owner_id = auth.uid());

CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (get_my_role() = 'admin' OR owner_id = auth.uid());

CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (get_my_role() = 'admin');

-- ─── DEAL NOTES ───────────────────────────────────────────
DROP POLICY IF EXISTS "deal_notes_select" ON deal_notes;
DROP POLICY IF EXISTS "deal_notes_insert" ON deal_notes;
DROP POLICY IF EXISTS "deal_notes_delete" ON deal_notes;

CREATE POLICY "deal_notes_select" ON deal_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = deal_notes.deal_id
      AND (get_my_role() = 'admin' OR d.owner_id = auth.uid())
    )
  );

CREATE POLICY "deal_notes_insert" ON deal_notes
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = deal_notes.deal_id
      AND (get_my_role() = 'admin' OR d.owner_id = auth.uid())
    )
  );

CREATE POLICY "deal_notes_delete" ON deal_notes
  FOR DELETE USING (author_id = auth.uid() OR get_my_role() = 'admin');

-- ─── TARGETS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "targets_select" ON targets;
DROP POLICY IF EXISTS "targets_insert" ON targets;
DROP POLICY IF EXISTS "targets_update" ON targets;
DROP POLICY IF EXISTS "targets_delete" ON targets;

CREATE POLICY "targets_select" ON targets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "targets_insert" ON targets
  FOR INSERT WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "targets_update" ON targets
  FOR UPDATE USING (get_my_role() = 'admin');

CREATE POLICY "targets_delete" ON targets
  FOR DELETE USING (get_my_role() = 'admin');

-- ─── EMAIL SUBSCRIBERS ────────────────────────────────────
DROP POLICY IF EXISTS "subscribers_all" ON email_subscribers;

CREATE POLICY "subscribers_all" ON email_subscribers
  FOR ALL USING (get_my_role() = 'admin');

-- ============================================================
-- DONE
-- ============================================================
-- Next steps:
-- 1. Create two users in Supabase Auth:
--    admin@weareedt.com / Admin2026!
--    sales@weareedt.com / Sales2026!
-- 2. Run POST /api/seed to populate 10 sample deals
-- 3. Update profiles: set admin role for admin@weareedt.com
