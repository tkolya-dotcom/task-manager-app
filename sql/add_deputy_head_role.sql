-- Add deputy_head role to users table CHECK constraint

-- First, drop the existing CHECK constraint
ALTER TABLE public.users DROP CONSTRAINT users_role_check;

-- Add the new CHECK constraint with deputy_head role
ALTER TABLE public.users ADD CONSTRAINT users_role_check
CHECK (role = ANY (ARRAY['manager'::text, 'worker'::text, 'deputy_head'::text]));

-- Update the trigger function to handle deputy_head role properly
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    -- Use role from metadata if valid, otherwise default to 'worker'
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('manager', 'worker', 'deputy_head')
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'worker'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
