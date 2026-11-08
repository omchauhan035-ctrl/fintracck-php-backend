<?php
// middleware/AuthMiddleware.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

class AuthMiddleware {
    public static function getSecret(): string {
        return getenv('JWT_SECRET') ?: 'finance_tracker_jwt_secret_key_123456';
    }

    public static function authenticate(): array {
        $token = null;

        // 1. Check HTTP-only cookie
        if (!empty($_COOKIE['token'])) {
            $token = $_COOKIE['token'];
        }

        // 2. Check Authorization header
        if (!$token) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            if (preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }

        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. No token provided.',
            ]);
            exit;
        }

        $decoded = JWT::verify($token, self::getSecret());
        if (!$decoded || empty($decoded['userId'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid or expired token.',
            ]);
            exit;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, preferred_currency, theme, role, status, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $decoded['userId']]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'User not found.',
            ]);
            exit;
        }

        if (($user['status'] ?? 'active') === 'blocked') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Your account has been suspended by an administrator.',
            ]);
            exit;
        }

        return [
            '_id' => (string)$user['id'],
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'preferredCurrency' => $user['preferred_currency'],
            'theme' => $user['theme'],
            'role' => $user['role'] ?? 'user',
            'status' => $user['status'] ?? 'active',
            'createdAt' => $user['created_at'],
            'updatedAt' => $user['updated_at'],
        ];
    }

    public static function adminOnly(): array {
        $user = self::authenticate();
        if (($user['role'] ?? 'user') !== 'admin') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Access denied. Administrator privileges required.',
            ]);
            exit;
        }
        return $user;
    }
}
