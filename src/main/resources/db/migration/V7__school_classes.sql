CREATE TABLE IF NOT EXISTS school_classes (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    grade_level         INT,
    school_id           BIGINT NOT NULL,
    homeroom_teacher_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES school_classes(id) ON DELETE SET NULL;
