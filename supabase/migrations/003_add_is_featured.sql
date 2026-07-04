-- Add is_featured column to clone_projects table to flag best showcase items
ALTER TABLE clone_projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
