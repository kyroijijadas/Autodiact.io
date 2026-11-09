USE AutodidactIo;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role') = 0,
    "ALTER TABLE users ADD COLUMN role ENUM('student', 'professor', 'admin') NOT NULL DEFAULT 'student' AFTER password_hash",
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

ALTER TABLE users
    MODIFY COLUMN role ENUM('student', 'professor', 'admin') NOT NULL DEFAULT 'student';

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_active') = 0,
    'ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

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

INSERT IGNORE INTO student_profiles (user_id)
SELECT id FROM users WHERE role = 'student';

INSERT IGNORE INTO professor_profiles (user_id)
SELECT id FROM users WHERE role = 'professor';

INSERT IGNORE INTO admin_profiles (user_id)
SELECT id FROM users WHERE role = 'admin';

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

INSERT IGNORE INTO professor_subjects (user_id, subject)
SELECT id, 'General' FROM users WHERE role = 'professor';

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quizzes' AND column_name = 'subject') = 0,
    "ALTER TABLE quizzes ADD COLUMN subject VARCHAR(100) NOT NULL DEFAULT 'General' AFTER description",
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

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

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quizzes' AND column_name = 'time_limit_seconds') = 0,
    'ALTER TABLE quizzes ADD COLUMN time_limit_seconds INT NULL AFTER is_active',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

UPDATE quizzes
SET time_limit_seconds = 1800
WHERE id > 0 AND time_limit_seconds IS NULL;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'quizzes' AND column_name = 'created_by') = 0,
    'ALTER TABLE quizzes ADD COLUMN created_by INT NULL AFTER is_active',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE() AND table_name = 'quizzes'
       AND constraint_name = 'fk_quizzes_created_by') = 0,
    'ALTER TABLE quizzes ADD CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

UPDATE quizzes
SET is_active = TRUE
WHERE id > 0
  AND is_active = FALSE
  AND created_by IN (
      SELECT id
      FROM users
      WHERE role = 'professor' AND is_active = TRUE
  )
  AND EXISTS (
      SELECT 1
      FROM questions question
      WHERE question.quiz_id = quizzes.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM questions question
      WHERE question.quiz_id = quizzes.id
        AND (
            (SELECT COUNT(*) FROM options WHERE question_id = question.id) < 2
            OR (SELECT COUNT(*) FROM options WHERE question_id = question.id) > 10
            OR (SELECT COUNT(*) FROM options WHERE question_id = question.id AND is_correct = TRUE) <> 1
        )
  );

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'results' AND column_name = 'total_questions') = 0,
    'ALTER TABLE results ADD COLUMN total_questions INT NOT NULL DEFAULT 0 AFTER score',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

UPDATE results r
SET total_questions = (
    SELECT COUNT(*)
    FROM questions q
    WHERE q.quiz_id = r.quiz_id
)
WHERE r.id > 0
  AND r.total_questions = 0
  AND EXISTS (
      SELECT 1
      FROM questions q
      WHERE q.quiz_id = r.quiz_id
  );

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'results' AND column_name = 'completed_at') = 0,
    'ALTER TABLE results ADD COLUMN completed_at TIMESTAMP NULL AFTER total_questions',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'results' AND column_name = 'date_taken') > 0,
    'UPDATE results SET completed_at = COALESCE(completed_at, date_taken, CURRENT_TIMESTAMP) WHERE id > 0 AND completed_at IS NULL',
    'UPDATE results SET completed_at = CURRENT_TIMESTAMP WHERE id > 0 AND completed_at IS NULL'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

ALTER TABLE results
    MODIFY COLUMN completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

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

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'results' AND column_name = 'attempt_id') = 0,
    'ALTER TABLE results ADD COLUMN attempt_id INT NULL UNIQUE AFTER quiz_id',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'results' AND column_name = 'timed_out') = 0,
    'ALTER TABLE results ADD COLUMN timed_out BOOLEAN NOT NULL DEFAULT FALSE AFTER total_questions',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

SET @ddl = IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE constraint_schema = DATABASE() AND table_name = 'results'
       AND constraint_name = 'fk_results_attempt') = 0,
    'ALTER TABLE results ADD CONSTRAINT fk_results_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;
