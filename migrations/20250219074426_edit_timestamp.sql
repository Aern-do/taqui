ALTER TABLE messages 
ADD COLUMN updated_at timestamp;

CREATE OR REPLACE FUNCTION update_messages_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS DISTINCT FROM OLD.content THEN
        NEW.updated_at = now() AT TIME ZONE 'UTC';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_modified_column();