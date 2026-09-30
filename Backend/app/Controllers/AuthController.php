<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;

class AuthController
{

    private User $user;

    public function register(): void
    {
        // 1. Get the JSON payload sent from React
        $data = json_decode(file_get_contents("php://input"));

        // 2. Validate that the data exists
        if (!isset($data->username) || !isset($data->password)) {
            http_response_code(400); // Bad Request
            echo json_encode(["error" => "Username and password are required"]);
            return;
        }

        // 3. We will call the User model here next!
        // For now, let's just return a success message to test the route
        http_response_code(201); // Created
        echo json_encode([
            "message" => "Auth controller is working! Ready to save user: " . $data->username
        ]);
    }

    public function login(): void
    {
        // 1. Get the JSON payload sent from React
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->username) || !isset($data->password)) {
            http_response_code(400); // Bad Request
            echo json_encode(["error" => "Username and password are required"]);
            return;
        }

        // 2. We will call the User model here next!
        // For now, let's just return a success message to test the route
        http_response_code(200); // OK
        echo json_encode([
            "message" => "Authot controller is working! Ready to log in user: " . $data->username
        ]);
    }
}
