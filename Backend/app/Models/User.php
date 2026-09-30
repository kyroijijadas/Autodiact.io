<?php
    declare(strict_types=1);
    namespace App\Models;
    use PDO;
    use App\Models\Database;

    class User {
        private PDO $db;
        private string $table = 'users';

        public function __construct() {
             $db = new Database();
             $this->db = $db->getConnection();
        }
    }

?>