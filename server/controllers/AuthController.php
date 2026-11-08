<?php
// controllers/AuthController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AuthController {
    private static function setAuthCookie(string $token): void {
        setcookie('token', $token, [
            'expires' => time() + (7 * 24 * 60 * 60),
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => false // set to true in production over HTTPS
        ]);
    }

    private static function clearAuthCookie(): void {
        setcookie('token', '', [
            'expires' => 1,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => false
        ]);
    }

    private static function formatUser(array $row): array {
        return [
            '_id' => (string)$row['id'],
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'preferredCurrency' => $row['preferred_currency'] ?? 'INR',
            'theme' => $row['theme'] ?? 'light',
            'role' => $row['role'] ?? 'user',
            'status' => $row['status'] ?? 'active',
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    public static function register(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!$name || !$email || strlen($password) < 6) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Please provide a valid name, email, and password (at least 6 characters).'
            ]);
            return;
        }

        $db = Database::getConnection();

        // Check existing
        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'An account with this email already exists.'
            ]);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $insert = $db->prepare('INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)');
        $insert->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
        ]);

        $userId = (int)$db->lastInsertId();

        // Seed default categories
        $defaultCategories = [
            ['name' => 'Salary', 'type' => 'income', 'color' => '#22c55e', 'icon' => 'briefcase'],
            ['name' => 'Freelance', 'type' => 'income', 'color' => '#3b82f6', 'icon' => 'laptop'],
            ['name' => 'Investments', 'type' => 'income', 'color' => '#8b5cf6', 'icon' => 'trending-up'],
            ['name' => 'Other Income', 'type' => 'income', 'color' => '#06b6d4', 'icon' => 'plus-circle'],
            ['name' => 'Food & Dining', 'type' => 'expense', 'color' => '#f97316', 'icon' => 'utensils'],
            ['name' => 'Transportation', 'type' => 'expense', 'color' => '#eab308', 'icon' => 'car'],
            ['name' => 'Shopping', 'type' => 'expense', 'color' => '#ec4899', 'icon' => 'shopping-bag'],
            ['name' => 'Bills & Utilities', 'type' => 'expense', 'color' => '#ef4444', 'icon' => 'zap'],
            ['name' => 'Healthcare', 'type' => 'expense', 'color' => '#14b8a6', 'icon' => 'heart'],
            ['name' => 'Entertainment', 'type' => 'expense', 'color' => '#a855f7', 'icon' => 'film'],
            ['name' => 'Education', 'type' => 'expense', 'color' => '#6366f1', 'icon' => 'book-open'],
            ['name' => 'Other', 'type' => 'both', 'color' => '#64748b', 'icon' => 'tag'],
        ];

        $catStmt = $db->prepare('INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES (:user_id, :name, :type, :color, :icon, 1)');
        foreach ($defaultCategories as $cat) {
            $catStmt->execute([
                'user_id' => $userId,
                'name' => $cat['name'],
                'type' => $cat['type'],
                'color' => $cat['color'],
                'icon' => $cat['icon'],
            ]);
        }

        // Fetch user
        $uStmt = $db->prepare('SELECT id, name, email, preferred_currency, theme, created_at, updated_at FROM users WHERE id = :id');
        $uStmt->execute(['id' => $userId]);
        $userRow = $uStmt->fetch();
        $user = self::formatUser($userRow);

        $token = JWT::sign(['userId' => $userId], AuthMiddleware::getSecret());
        self::setAuthCookie($token);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => ['user' => $user, 'token' => $token]
        ]);
    }

    public static function login(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Please provide both email and password.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, email, password_hash, preferred_currency, theme, role, status, created_at, updated_at FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $userRow = $stmt->fetch();

        if (!$userRow || !password_verify($password, $userRow['password_hash'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email or password.'
            ]);
            return;
        }

        if (($userRow['status'] ?? 'active') === 'blocked') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Your account has been suspended by an administrator.'
            ]);
            return;
        }

        $user = self::formatUser($userRow);
        $token = JWT::sign(['userId' => $user['id']], AuthMiddleware::getSecret());
        self::setAuthCookie($token);

        echo json_encode([
            'success' => true,
            'data' => ['user' => $user, 'token' => $token]
        ]);
    }

    public static function logout(): void {
        self::clearAuthCookie();
        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    public static function getMe(): void {
        $user = AuthMiddleware::authenticate();
        echo json_encode([
            'success' => true,
            'data' => ['user' => $user]
        ]);
    }

    public static function updateProfile(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $user['id']];

        if (isset($data['name']) && trim($data['name']) !== '') {
            $fields[] = 'name = :name';
            $params['name'] = trim($data['name']);
        }
        if (isset($data['preferredCurrency'])) {
            $fields[] = 'preferred_currency = :currency';
            $params['currency'] = $data['preferredCurrency'];
        }
        if (isset($data['theme'])) {
            $fields[] = 'theme = :theme';
            $params['theme'] = $data['theme'];
        }

        if (!empty($fields)) {
            $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $db->prepare('SELECT id, name, email, preferred_currency, theme, created_at, updated_at FROM users WHERE id = :id');
        $stmt->execute(['id' => $user['id']]);
        $updatedUser = self::formatUser($stmt->fetch());

        echo json_encode([
            'success' => true,
            'data' => ['user' => $updatedUser]
        ]);
    }

    public static function changePassword(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (!$currentPassword || strlen($newPassword) < 6) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'New password must be at least 6 characters.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id');
        $stmt->execute(['id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Current password is incorrect.'
            ]);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $update = $db->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $update->execute(['hash' => $newHash, 'id' => $user['id']]);

        $token = JWT::sign(['userId' => $user['id']], AuthMiddleware::getSecret());
        self::setAuthCookie($token);

        echo json_encode([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
}
