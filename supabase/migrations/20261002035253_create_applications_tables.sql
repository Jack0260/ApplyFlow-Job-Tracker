/*
# Create applications, timeline_events, and reminders tables

1. New Tables
- `applications`: Tracks job applications. Columns: id, user_id, company, position, location, salary_range, status (wishlist/applied/interview/offer/rejected), job_description, resume_text, match_score (computed keyword match percentage), job_url, application_date, last_activity_at, created_at, updated_at.
- `timeline_events`: Tracks events per application. Columns: id, application_id, user_id, event_type, title, description, event_date, created_at.
- `reminders`: Follow-up reminders per application. Columns: id, application_id, user_id, reminder_date, title, completed, created_at.

2. Security
- Enable RLS on all three tables.
- Owner-scoped CRUD via auth.uid() = user_id.
- user_id columns default to auth.uid() so client inserts that omit user_id succeed.
- Child tables (timeline_events, reminders) also carry user_id for direct ownership checks.

3. Indexes
- applications(user_id) for filtering a user's apps.
- applications(status) for board column queries.
- timeline_events(application_id) for fetching a timeline.
- reminders(application_id) and reminders(user_id, reminder_date) for reminder queries.
*/

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  location text DEFAULT '',
  salary_range text DEFAULT '',
  status text NOT NULL DEFAULT 'wishlist'
    CHECK (status IN ('wishlist','applied','interview','offer','rejected')),
  job_description text DEFAULT '',
  resume_text text DEFAULT '',
  match_score integer DEFAULT 0,
  job_url text DEFAULT '',
  application_date date,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_applications" ON applications;
CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_applications" ON applications;
CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'note'
    CHECK (event_type IN ('status_change','note','interview','offer','rejection','application','follow_up')),
  title text NOT NULL,
  description text DEFAULT '',
  event_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_timeline_events" ON timeline_events;
CREATE POLICY "select_own_timeline_events" ON timeline_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_timeline_events" ON timeline_events;
CREATE POLICY "insert_own_timeline_events" ON timeline_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_timeline_events" ON timeline_events;
CREATE POLICY "update_own_timeline_events" ON timeline_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_timeline_events" ON timeline_events;
CREATE POLICY "delete_own_timeline_events" ON timeline_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timeline_events_application_id ON timeline_events(application_id);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_application_id ON reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_date ON reminders(user_id, reminder_date);
