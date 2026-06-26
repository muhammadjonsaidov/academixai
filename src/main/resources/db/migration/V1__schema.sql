-- ─── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── TABLES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'STUDENT',
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    parent_id   BIGINT,
    school_id   BIGINT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id            BIGSERIAL PRIMARY KEY,
    title_uz      VARCHAR(255) NOT NULL,
    title_en      VARCHAR(255),
    subject       VARCHAR(255) NOT NULL,
    grade_level   INTEGER,
    description_uz TEXT,
    cover_emoji   VARCHAR(10) DEFAULT '📚',
    teacher_id    BIGINT REFERENCES users(id),
    school_id     BIGINT,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    title_uz    VARCHAR(255) NOT NULL,
    content_uz  TEXT,
    phet_url    VARCHAR(500),
    video_url   VARCHAR(500),
    order_num   INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT REFERENCES users(id),
    course_id   BIGINT REFERENCES courses(id),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    message     TEXT NOT NULL,
    response    TEXT NOT NULL,
    lesson_id   BIGINT REFERENCES lessons(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_results (
    id           BIGSERIAL PRIMARY KEY,
    student_id   BIGINT REFERENCES users(id),
    lesson_id    BIGINT REFERENCES lessons(id),
    score        INTEGER,
    feedback_uz  TEXT,
    answers_json TEXT,
    taken_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT REFERENCES users(id),
    lesson_id   BIGINT REFERENCES lessons(id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT REFERENCES users(id),
    course_id   BIGINT REFERENCES courses(id),
    date        DATE NOT NULL,
    present     BOOLEAN DEFAULT TRUE,
    UNIQUE(student_id, course_id, date)
);

CREATE TABLE IF NOT EXISTS teacher_documents (
    id          BIGSERIAL PRIMARY KEY,
    teacher_id  BIGINT REFERENCES users(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_type   VARCHAR(50) DEFAULT 'txt',
    tag         VARCHAR(100) DEFAULT 'lesson_plan',
    subject     VARCHAR(255),
    course_id   BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    raw_text    TEXT,
    chunk_count INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id          BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES teacher_documents(id) ON DELETE CASCADE,
    teacher_id  BIGINT NOT NULL,
    content     TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    embedding   vector(768),
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chunks_teacher ON document_chunks(teacher_id);

CREATE TABLE IF NOT EXISTS sentiment_logs (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT REFERENCES users(id),
    chat_message_id BIGINT REFERENCES chat_messages(id),
    sentiment_score DECIMAL(4,3),
    sentiment_label VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_snapshots (
    id               BIGSERIAL PRIMARY KEY,
    student_id       BIGINT REFERENCES users(id),
    snapshot_type    VARCHAR(50) DEFAULT 'weekly',
    avg_score        DECIMAL(5,2),
    chat_count       INTEGER DEFAULT 0,
    top_subject      VARCHAR(255),
    weak_subject     VARCHAR(255),
    engagement_score DECIMAL(5,2),
    sentiment_avg    DECIMAL(4,3),
    ai_narrative     TEXT,
    snapshot_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    type        VARCHAR(100) NOT NULL,
    title       VARCHAR(500),
    body        TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
