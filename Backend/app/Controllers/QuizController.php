<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Quiz;
use App\Models\Database;

class QuizController {

    private Quiz $quiz;

    public function __construct() {
        $this->quiz = new Quiz();
    }

    // GET /api/quizzes
    public function getAllQuizzes(): void {
        // 1. Fetch all quizzes from the Quiz model
        $quizzes = $this->quiz->getAllQuizzes();

        // 2. Return the quizzes as JSON
        http_response_code(200); // OK
        echo json_encode($quizzes);
    }

    // GET /api/quiz?id=1
    public function getQuizDetails(): void {
        $quizId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($quizId <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid or missing quiz ID"]);
            return;
        }

       
        $quizzes = $this->quiz->getQuizWithQuestions($quizId);

        if (!$quizzes) {
            http_response_code(404);
            echo json_encode(["error" => "Quiz not found"]);
            return;
        }

        http_response_code(200);
        echo json_encode($quizzes);
    }

    // POST /api/quiz/submit
    public function submitQuiz(): void {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['user_id'], $data['quiz_id'], $data['answers'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing user_id, quiz_id, or answers"]);
            return;
        }

        $score = $this->quiz->gradeAndSaveScore(
            (int)$data['user_id'], 
            (int)$data['quiz_id'], 
            $data['answers']
        );

        http_response_code(200);
        echo json_encode([
            "message" => "Quiz graded successfully",
            "score" => $score
        ]);
    }
    
}

?>