-- Add tracking for when a report is downloaded as PDF or DOCX
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_downloaded_at TIMESTAMP WITH TIME ZONE;
