CREATE TABLE IF NOT EXISTS homework_submissions (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL DEFAULT 'Matematika',
    image_data TEXT NOT NULL,
    ocr_text TEXT,
    ai_feedback TEXT,
    score INTEGER,
    resubmit_required BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_homework_student ON homework_submissions(student_id);
