CREATE DATABASE IF NOT EXISTS AutodidactIo;
USE AutodidactIo;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'professor', 'admin') NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    user_id INT PRIMARY KEY,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_profiles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS professor_profiles (
    user_id INT PRIMARY KEY,
    approved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_professor_profiles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_profiles (
    user_id INT PRIMARY KEY,
    provisioned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_profiles_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS professor_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_professor_applications_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_professor_applications_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS professor_subjects (
    user_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, subject),
    CONSTRAINT fk_professor_subjects_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_professor_subjects_approver FOREIGN KEY (approved_by)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL DEFAULT 'General',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    time_limit_seconds INT NULL,
    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quiz_access_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    UNIQUE KEY uq_quiz_access_request_student (quiz_id, student_id),
    KEY idx_quiz_access_requests_student (student_id),
    CONSTRAINT fk_quiz_access_requests_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_access_requests_student FOREIGN KEY (student_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_access_requests_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_options_question FOREIGN KEY (question_id)
        REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempt_questions (
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    PRIMARY KEY (attempt_id, question_id),
    CONSTRAINT fk_attempt_questions_attempt FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempt_options (
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    PRIMARY KEY (attempt_id, question_id, option_id),
    CONSTRAINT fk_attempt_options_question FOREIGN KEY (attempt_id, question_id)
        REFERENCES quiz_attempt_questions(attempt_id, question_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT NOT NULL,
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attempt_id, question_id),
    CONSTRAINT fk_attempt_answers_option FOREIGN KEY (attempt_id, question_id, option_id)
        REFERENCES quiz_attempt_options(attempt_id, question_id, option_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    attempt_id INT NULL UNIQUE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    timed_out BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_results_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_results_attempt FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(id) ON DELETE SET NULL
);

INSERT INTO quizzes (id, title, description, subject, is_active)
VALUES (1, 'PHP & SQL Fundamentals', 'Test your knowledge of PHP and SQL.', 'General', TRUE)
ON DUPLICATE KEY UPDATE id = VALUES(id);

UPDATE quizzes SET time_limit_seconds = 300 WHERE id = 1 AND time_limit_seconds IS NULL;

INSERT INTO questions (id, quiz_id, question_text)
VALUES
    (1, 1, 'Which PHP extension provides a consistent interface for database access?'),
    (2, 1, 'What does PDO stand for?')
ON DUPLICATE KEY UPDATE id = VALUES(id);

INSERT INTO options (id, question_id, option_text, is_correct)
VALUES
    (1, 1, 'PDO', TRUE),
    (2, 1, 'db_connect', FALSE),
    (3, 1, 'SQL Runner', FALSE),
    (4, 2, 'PHP Data Objects', TRUE),
    (5, 2, 'Personal Database Output', FALSE),
    (6, 2, 'Programming Data Operations', FALSE)
ON DUPLICATE KEY UPDATE id = VALUES(id);
