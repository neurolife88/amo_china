-- Add notes field to deals table
ALTER TABLE deals 
ADD COLUMN notes TEXT;

-- Add comment for the new column
COMMENT ON COLUMN deals.notes IS 'Notes and comments for the deal (Примечание)';
