<?php
// controllers/CategoryController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class CategoryController {
    public static function formatCategory(array $row): array {
        return [
            '_id' => (string)$row['id'],
            'id' => (int)$row['id'],
            'userId' => (string)$row['user_id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'color' => $row['color'] ?? '#6366f1',
            'icon' => $row['icon'] ?? 'tag',
            'isDefault' => (bool)$row['is_default'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    public static function getCategories(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $type = $_GET['type'] ?? null;
        $sql = 'SELECT * FROM categories WHERE user_id = :userId';
        $params = ['userId' => $user['id']];

        if ($type && $type !== 'all') {
            $sql .= ' AND (type = :type OR type = "both")';
            $params['type'] = $type;
        }

        $sql .= ' ORDER BY is_default DESC, name ASC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $categories = array_map([self::class, 'formatCategory'], $rows);

        echo json_encode([
            'success' => true,
            'data' => ['categories' => $categories]
        ]);
    }

    public static function createCategory(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($data['name'] ?? '');
        $type = $data['type'] ?? 'expense';
        $color = $data['color'] ?? '#6366f1';
        $icon = $data['icon'] ?? 'tag';

        if (!$name) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Category name is required.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES (:user_id, :name, :type, :color, :icon, 0)');
        $stmt->execute([
            'user_id' => $user['id'],
            'name' => $name,
            'type' => $type,
            'color' => $color,
            'icon' => $icon,
        ]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $cat = self::formatCategory($stmt->fetch());

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => ['category' => $cat]
        ]);
    }

    public static function updateCategory(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $id, 'user_id' => $user['id']];

        if (isset($data['name'])) {
            $fields[] = 'name = :name';
            $params['name'] = trim($data['name']);
        }
        if (isset($data['type'])) {
            $fields[] = 'type = :type';
            $params['type'] = $data['type'];
        }
        if (isset($data['color'])) {
            $fields[] = 'color = :color';
            $params['color'] = $data['color'];
        }
        if (isset($data['icon'])) {
            $fields[] = 'icon = :icon';
            $params['icon'] = $data['icon'];
        }

        if (!empty($fields)) {
            $sql = 'UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = :id AND user_id = :user_id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $db->prepare('SELECT * FROM categories WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Category not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => ['category' => self::formatCategory($row)]
        ]);
    }

    public static function deleteCategory(int $id): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM categories WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Category not found.'
            ]);
            return;
        }

        if (!empty($row['is_default'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Cannot delete default categories.'
            ]);
            return;
        }

        $del = $db->prepare('DELETE FROM categories WHERE id = :id AND user_id = :user_id');
        $del->execute(['id' => $id, 'user_id' => $user['id']]);

        echo json_encode([
            'success' => true,
            'message' => 'Category deleted successfully.'
        ]);
    }
}
