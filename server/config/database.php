<?php
// config/database.php

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '3306';
            $dbName = getenv('DB_NAME') ?: 'finance_tracker';
            $username = getenv('DB_USER') ?: 'root';
            $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                // First attempt direct connection to the database
                $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
                self::$instance = new PDO($dsn, $username, $password, $options);

                // Auto-migrate role & status columns if missing
                try {
                    $cols = self::$instance->query("SHOW COLUMNS FROM users LIKE 'role'")->fetchAll();
                    if (empty($cols)) {
                        self::$instance->exec("ALTER TABLE users ADD COLUMN `role` ENUM('user', 'admin') DEFAULT 'user' AFTER theme");
                    }
                    $colsStatus = self::$instance->query("SHOW COLUMNS FROM users LIKE 'status'")->fetchAll();
                    if (empty($colsStatus)) {
                        self::$instance->exec("ALTER TABLE users ADD COLUMN `status` ENUM('active', 'blocked') DEFAULT 'active' AFTER role");
                    }
                } catch (Throwable $t) {
                    // Table might not exist yet, handled by schema init
                }
            } catch (PDOException $e) {
                // If database does not exist, connect without dbname, create it, and run schema
                if (strpos($e->getMessage(), 'Unknown database') !== false || $e->getCode() == 1049) {
                    try {
                        $initPdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, $options);
                        $initPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                        
                        $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
                        self::$instance = new PDO($dsn, $username, $password, $options);

                        // Auto-run schema
                        $schemaPath = dirname(__DIR__) . '/database/schema.sql';
                        if (file_exists($schemaPath)) {
                            $sql = file_get_contents($schemaPath);
                            self::$instance->exec($sql);
                        }
                    } catch (PDOException $inner) {
                        http_response_code(500);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Database connection and initialization failed: ' . $inner->getMessage()
                        ]);
                        exit;
                    }
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Database connection failed. Please ensure MySQL in XAMPP is started. Error: ' . $e->getMessage()
                    ]);
                    exit;
                }
            }
        }

        return self::$instance;
    }
}
