-- =============================================================================
-- Fix existing users in database
-- Execute this in Supabase SQL Editor
-- =============================================================================

-- 1. Update users without role (set default to 'worker')
UPDATE users
SET role = 'worker'
WHERE role IS NULL OR role = '';

-- 2. Update users with invalid roles (set to 'worker')
UPDATE users
SET role = 'worker'
WHERE role NOT IN ('manager', 'worker', 'deputy_head');

-- 3. Update users without name (use email prefix)
UPDATE users
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '';

-- 4. Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verify the fixes
SELECT id, email, name, role, created_at
FROM users
WHERE role IS NULL OR role = '' OR name IS NULL OR name = ''
ORDER BY created_at DESC;

-- 7. Show current user count by role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
