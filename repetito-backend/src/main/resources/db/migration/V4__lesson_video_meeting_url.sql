ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS video_meeting_url VARCHAR(512);
