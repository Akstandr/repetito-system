CREATE TABLE IF NOT EXISTS subjects (
    code VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO subjects (code, title, sort_order) VALUES
    ('math', 'Математика', 1),
    ('russian', 'Русский язык', 2),
    ('english', 'Английский язык', 3),
    ('physics', 'Физика', 4),
    ('chemistry', 'Химия', 5),
    ('biology', 'Биология', 6),
    ('informatics', 'Информатика', 7),
    ('history', 'История', 8),
    ('social-studies', 'Обществознание', 9),
    ('literature', 'Литература', 10)
ON CONFLICT (code) DO UPDATE
SET title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;
