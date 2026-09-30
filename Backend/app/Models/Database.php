<?php
declare(strict_types=1);

namespace App\Models;

use PDO;
use PDOException;

class Database {
    private string $host = "localhost";
    private string $db_name = "AutodidactIo";
    private string $username = "root";
    private string $password = "";
    private ?PDO $conn = null;

    /**
     * Establishes a secure PDO database connection.
     * Returns a PDO instance or null on failure.
     */
    public function getConnection(): ?PDO {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            // Initialize PDO with strict error handling and default associative array fetches
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $exception) {
            // Cleanly catch connection issues and return as JSON
            http_response_code(500);
            echo json_encode([
                "error" => "Database Connection Failed",
                "message" => $exception->getMessage()
            ]);
            exit();
        }

        return $this->conn;
    }
}