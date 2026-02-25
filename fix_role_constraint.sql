-- Fix for the users table role CHECK constraint
-- The current constraint is failing because the trigger passes an invalid role value

-- First, drop the existing trigger function if it exists
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with proper role handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    -- Use a safe default role that will pass the CHECK constraint
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
