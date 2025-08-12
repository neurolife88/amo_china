-- Add patient_chinese_name field to contacts table
ALTER TABLE contacts 
ADD COLUMN patient_chinese_name TEXT;

-- Add comment for the new column
COMMENT ON COLUMN contacts.patient_chinese_name IS 'Patient name in Chinese characters (中文名字)';
