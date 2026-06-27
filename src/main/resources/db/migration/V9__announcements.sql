CREATE TABLE announcements (
    id         BIGSERIAL PRIMARY KEY,
    school_id  BIGINT NOT NULL,
    author_id  BIGINT REFERENCES users(id),
    title      VARCHAR(255) NOT NULL,
    body       TEXT NOT NULL,
    target     VARCHAR(50) DEFAULT 'ALL',
    created_at TIMESTAMP DEFAULT now()
);
