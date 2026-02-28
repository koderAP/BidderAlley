-- Enable RLS on all tables
ALTER TABLE "Bidder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wildcard" ENABLE ROW LEVEL SECURITY;

-- Allow full access only for the postgres role (used by Prisma/server-side)
CREATE POLICY "Allow postgres full access" ON "Bidder"
  FOR ALL USING (current_user = 'postgres') WITH CHECK (current_user = 'postgres');

CREATE POLICY "Allow postgres full access" ON "Item"
  FOR ALL USING (current_user = 'postgres') WITH CHECK (current_user = 'postgres');

CREATE POLICY "Allow postgres full access" ON "Wildcard"
  FOR ALL USING (current_user = 'postgres') WITH CHECK (current_user = 'postgres');
