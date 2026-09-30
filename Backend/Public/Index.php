<?php

declare(strict_types=1);
// 1. CORS Headers (Allows your Vite/React frontend on port 5173 to talk to PHP)
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle browser preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../app/autoloader.php';

use App\Controllers\AuthController;
use App\Controllers\QuizController;

// 4. Parse Request Details and strip the local XAMPP folder path
$basePath = '/Autodidact.io/Backend/Public';
$fullUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// This removes the base path so $requestUri becomes just "/api/register"
$requestUri = str_replace($basePath, '', $fullUri);
$method = $_SERVER['REQUEST_METHOD'];

try {
    match ([$method, $requestUri]) {
        ['POST', '/api/register']         => (new AuthController())->register(),
        ['POST', '/api/login']            => (new AuthController())->login(),
        ['GET',  '/api/quizzes']          => (new QuizController())->getAllQuizzes(),
        ['GET',  '/api/quiz']             => (new QuizController())->getQuizDetails(),
        ['POST', '/api/quiz/submit']      => (new QuizController())->submitQuiz(),
        default => throw new Exception("Endpoint not found", 404),
    };
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        "error" => "Internal Server Error",
        "message" => $e->getMessage()
    ]);
}
