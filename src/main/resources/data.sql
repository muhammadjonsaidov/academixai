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

-- ─── SEED USERS ──────────────────────────────────────────────
-- password for all: AcademiX2026!  (BCrypt)

INSERT INTO users (full_name, email, password, role, subscription_tier) VALUES
('Sardor Xolmatov',   'sardor@academixai.uz',  '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'TEACHER',       'SCHOOL'),
('Dilshod Rahimov',   'dilshod@academixai.uz', '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'SCHOOL_ADMIN',  'SCHOOL'),
('Jasur Toshmatov',   'jasur@academixai.uz',   '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'STUDENT',       'FREE'),
('Malika Yusupova',   'malika@academixai.uz',  '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'STUDENT',       'FREE'),
('Bobur Karimov',     'bobur@academixai.uz',   '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'STUDENT',       'PREMIUM'),
('Nozima Toshmatova', 'nozima@academixai.uz',  '$2b$10$jIoYFttdV4O.TlLPepN/k.SRfA6q6aOxnLyW3VPzs/C.XdfK9QLsS', 'PARENT',        'FREE')
ON CONFLICT (email) DO NOTHING;

-- link parent to student (Nozima → Jasur)
UPDATE users SET parent_id = (SELECT id FROM users WHERE email='nozima@academixai.uz')
WHERE email = 'jasur@academixai.uz';

-- ─── SEED COURSES ────────────────────────────────────────────

INSERT INTO courses (title_uz, title_en, subject, grade_level, description_uz, cover_emoji, teacher_id)
SELECT 'Algebra asoslari',        'Algebra Basics',   'Matematika', 9,
       '9-sinf algebra: tenglamalar, funksiyalar va ko''paytmalar.', '🔢', id
FROM users WHERE email='sardor@academixai.uz'
AND NOT EXISTS (SELECT 1 FROM courses WHERE title_uz='Algebra asoslari');

INSERT INTO courses (title_uz, title_en, subject, grade_level, description_uz, cover_emoji, teacher_id)
SELECT 'Newton mexanikasi',       'Newton Mechanics', 'Fizika',     10,
       'Klassik mexanika: harakat qonunlari, kuch va energiya.', '⚡', id
FROM users WHERE email='sardor@academixai.uz'
AND NOT EXISTS (SELECT 1 FROM courses WHERE title_uz='Newton mexanikasi');

INSERT INTO courses (title_uz, title_en, subject, grade_level, description_uz, cover_emoji, teacher_id)
SELECT 'Biologiya: Hujayra',      'Cell Biology',     'Biologiya',  8,
       'Tirik organizm hujayralari, fotosintez va nafas olish jarayonlari.', '🌿', id
FROM users WHERE email='sardor@academixai.uz'
AND NOT EXISTS (SELECT 1 FROM courses WHERE title_uz='Biologiya: Hujayra');

INSERT INTO courses (title_uz, title_en, subject, grade_level, description_uz, cover_emoji, teacher_id)
SELECT 'O''zbekiston tarixi',     'Uzbekistan History','Tarix',     7,
       'O''zbekiston davlatchiligi tarixi, buyuk ajdodlar va zamonaviy davr.', '🏛️', id
FROM users WHERE email='sardor@academixai.uz'
AND NOT EXISTS (SELECT 1 FROM courses WHERE title_uz='O''zbekiston tarixi');

-- ─── SEED LESSONS ────────────────────────────────────────────

INSERT INTO lessons (course_id, title_uz, content_uz, order_num)
SELECT c.id, 'Chiziqli tenglamalar',
'Chiziqli tenglama — ax + b = 0 ko''rinishidagi tenglama, bu yerda a ≠ 0.
Yechish usuli: noma''lumni bir tomonga, sonlarni ikkinchi tomonga o''tkazamiz.
Misol: 3x - 9 = 0 → 3x = 9 → x = 3.
Tekshirish: 3(3) - 9 = 0 ✓', 1
FROM courses c WHERE c.title_uz='Algebra asoslari'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Chiziqli tenglamalar');

INSERT INTO lessons (course_id, title_uz, content_uz, order_num)
SELECT c.id, 'Kvadrat tenglamalar',
'Kvadrat tenglama — ax² + bx + c = 0 ko''rinishi.
Diskriminant formulasi: D = b² - 4ac
• D > 0: ikki xil haqiqiy ildiz
• D = 0: bitta ildiz (qo''sh ildiz)
• D < 0: haqiqiy ildiz yo''q
Ildizlar: x = (−b ± √D) / 2a', 2
FROM courses c WHERE c.title_uz='Algebra asoslari'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Kvadrat tenglamalar');

INSERT INTO lessons (course_id, title_uz, content_uz, order_num)
SELECT c.id, 'Funksiyalar va grafiklar',
'Funksiya — har bir x qiymatiga yagona y qiymatini moslashtiruvchi qoida.
Chiziqli funksiya: y = kx + b (to''g''ri chiziq)
Kvadratik funksiya: y = ax² + bx + c (parabola)
Grafik chizish: x qiymatlar jadvalini to''ldiring, nuqtalarni belgilang, uling.', 3
FROM courses c WHERE c.title_uz='Algebra asoslari'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Funksiyalar va grafiklar');

INSERT INTO lessons (course_id, title_uz, content_uz, phet_url, order_num)
SELECT c.id, 'Birinchi Newton qonuni',
'Inersiya qonuni: Agar jismga tashqi kuch ta''sir etmasa yoki kuchlar muvozanatlashgan bo''lsa,
jism tinch holatda yoki tekis to''g''ri chiziqli harakatda davom etadi.
Misol: avtobus keskin to''xtaganda, yo''lovchilar oldinga silkinadi — bu inersiyadir.
Interaktiv tajriba quyida:', 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html', 1
FROM courses c WHERE c.title_uz='Newton mexanikasi'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Birinchi Newton qonuni');

INSERT INTO lessons (course_id, title_uz, content_uz, phet_url, order_num)
SELECT c.id, 'Ikkinchi Newton qonuni',
'F = ma — kuch, massa va tezlanish o''rtasidagi bog''liqlik.
• F — kuch (N, nyuton)
• m — massa (kg)
• a — tezlanish (m/s²)
Qancha katta kuch, shuncha katta tezlanish. Qancha katta massa, shuncha kichik tezlanish.', 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html', 2
FROM courses c WHERE c.title_uz='Newton mexanikasi'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Ikkinchi Newton qonuni');

INSERT INTO lessons (course_id, title_uz, content_uz, order_num)
SELECT c.id, 'Fotosintez jarayoni',
'Fotosintez — o''simliklar quyosh nuri yordamida oziq modda hosil qiladi.
Formula: 6CO₂ + 6H₂O + yorug''lik → C₆H₁₂O₆ + 6O₂
Xlorofill — yashil pigment, yorug''likni yutadi.
Fotosintez xloroplastlarda sodir bo''ladi.
Natijada: kislorod ajralib chiqadi, glyukoza hosil bo''ladi.', 1
FROM courses c WHERE c.title_uz='Biologiya: Hujayra'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE course_id=c.id AND title_uz='Fotosintez jarayoni');

-- ─── SEED ENROLLMENTS ────────────────────────────────────────

INSERT INTO enrollments (student_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email IN ('jasur@academixai.uz', 'malika@academixai.uz', 'bobur@academixai.uz')
ON CONFLICT DO NOTHING;

-- ─── SEED EXAM RESULTS (sample) ──────────────────────────────

INSERT INTO exam_results (student_id, lesson_id, score, feedback_uz)
SELECT u.id, l.id, 85,
'Yaxshi natija! Chiziqli tenglamalarni tushundingiz. Tekshirish qismini yanada mustahkamlang.'
FROM users u, lessons l
WHERE u.email='jasur@academixai.uz' AND l.title_uz='Chiziqli tenglamalar'
ON CONFLICT DO NOTHING;

INSERT INTO exam_results (student_id, lesson_id, score, feedback_uz)
SELECT u.id, l.id, 72,
'O''rtacha natija. Diskriminant formulasini takrorlang, ayniqsa D < 0 holati.'
FROM users u, lessons l
WHERE u.email='jasur@academixai.uz' AND l.title_uz='Kvadrat tenglamalar'
ON CONFLICT DO NOTHING;

INSERT INTO exam_results (student_id, lesson_id, score, feedback_uz)
SELECT u.id, l.id, 94,
'A''lo natija! Birinchi Newton qonunini mukammal bilasiz. Davom eting!'
FROM users u, lessons l
WHERE u.email='bobur@academixai.uz' AND l.title_uz='Birinchi Newton qonuni'
ON CONFLICT DO NOTHING;

-- ─── SEED ATTENDANCE (last 5 days) ───────────────────────────

INSERT INTO attendance (student_id, course_id, date, present)
SELECT u.id, c.id, CURRENT_DATE - interval '4 days', true
FROM users u, courses c WHERE u.email='jasur@academixai.uz' AND c.title_uz='Algebra asoslari' ON CONFLICT DO NOTHING;

INSERT INTO attendance (student_id, course_id, date, present)
SELECT u.id, c.id, CURRENT_DATE - interval '3 days', true
FROM users u, courses c WHERE u.email='jasur@academixai.uz' AND c.title_uz='Algebra asoslari' ON CONFLICT DO NOTHING;

INSERT INTO attendance (student_id, course_id, date, present)
SELECT u.id, c.id, CURRENT_DATE - interval '2 days', false
FROM users u, courses c WHERE u.email='jasur@academixai.uz' AND c.title_uz='Algebra asoslari' ON CONFLICT DO NOTHING;

INSERT INTO attendance (student_id, course_id, date, present)
SELECT u.id, c.id, CURRENT_DATE - interval '1 day', true
FROM users u, courses c WHERE u.email='jasur@academixai.uz' AND c.title_uz='Algebra asoslari' ON CONFLICT DO NOTHING;
