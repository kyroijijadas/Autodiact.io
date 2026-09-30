<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use App\Models\Database;

class Quiz {
    private ?PDO $conn;

    public function __construct() {
        $db = new Database();
        $this->conn = $db->getConnection();
    }

    public function getAllQuizzes(): array {
        $query = "SELECT * FROM quizzes";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

   // 2. Get a single quiz with all its questions and options
    public function getQuizWithQuestions(int $quizId): ?array {
        // Fetch quiz info
        $quizStmt = $this->conn->prepare("SELECT id, title, description FROM quizzes WHERE id = ?");
        $quizStmt->execute([$quizId]);
        $quiz = $quizStmt->fetch();

        if (!$quiz) {
            return null;
        }

        // Fetch questions for this quiz
        $qStmt = $this->conn->prepare("SELECT id, question_text FROM questions WHERE quiz_id = ?");
        $qStmt->execute([$quizId]);
        $questions = $qStmt->fetchAll();

        // For each question, fetch its options (choices)
        foreach ($questions as &$question) {
            $optStmt = $this->conn->prepare("SELECT id, option_text FROM options WHERE question_id = ?");
            // Note: We intentionally omit 'is_correct' here so hackers can't inspect the network tab to cheat!
            $optStmt->execute([$question['id']]);
            $question['options'] = $optStmt->fetchAll();
        }

        $quiz['questions'] = $questions;
        return $quiz;
    }

    // 3. Grade the quiz and save the score
    public function gradeAndSaveScore(int $userId, int $quizId, array $userAnswers): int {
        $score = 0;

        // Loop through user's answers: [question_id => selected_option_id]
        foreach ($userAnswers as $questionId => $selectedOptionId) {
            $stmt = $this->conn->prepare("SELECT is_correct FROM options WHERE id = ? AND question_id = ?");
            $stmt->execute([$selectedOptionId, $questionId]);
            $option = $stmt->fetch();

            // If the option exists and is marked as correct, increase score
            if ($option && (int)$option['is_correct'] === 1) {
                $score++;
            }
        }

        // Save the final result into the results table
        $insertStmt = $this->conn->prepare("INSERT INTO results (user_id, quiz_id, score) VALUES (?, ?, ?)");
        $insertStmt->execute([$userId, $quizId, $score]);

        return $score;
    }



}

?>
