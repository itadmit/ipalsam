-- הוספת עמודות וטבלאות שחסרות במסד הנתונים
-- הרצה: psql $DATABASE_URL -f drizzle/add-barcode-and-departments.sql

-- 1. הוספת barcode ל-users (אם לא קיים)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE users ADD COLUMN barcode text UNIQUE;
  END IF;
END $$;

-- 2. הוספת auto_approve_requests ל-departments (אם לא קיים)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'auto_approve_requests'
  ) THEN
    ALTER TABLE departments ADD COLUMN auto_approve_requests boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- 3. יצירת soldier_departments (אם לא קיים)
CREATE TABLE IF NOT EXISTS soldier_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now() NOT NULL
);
