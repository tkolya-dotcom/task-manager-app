-- Add missing DELETE policies for swipe-to-delete functionality

-- Tasks DELETE policy
DROP POLICY IF EXISTS "Tasks can delete" ON tasks;
CREATE POLICY "Tasks can delete"
  ON tasks
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Installations DELETE policy
DROP POLICY IF EXISTS "Installations can delete" ON installations;
CREATE POLICY "Installations can delete"
  ON installations
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Purchase Requests DELETE policy
DROP POLICY IF EXISTS "PR can delete" ON purchase_requests;
CREATE POLICY "PR can delete"
  ON purchase_requests
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Purchase Request Items DELETE policy
DROP POLICY IF EXISTS "PRI can delete" ON purchase_request_items;
CREATE POLICY "PRI can delete"
  ON purchase_request_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Materials DELETE policy
DROP POLICY IF EXISTS "Materials can delete" ON materials;
CREATE POLICY "Materials can delete"
  ON materials
  FOR DELETE
  USING (auth.role() = 'authenticated');
