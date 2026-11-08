<?php
// controllers/TransactionController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class TransactionController {
    public static function formatTransaction(array $row): array {
        $tags = [];
        if (!empty($row['tags'])) {
            $decoded = json_decode($row['tags'], true);
            if (is_array($decoded)) {
                $tags = $decoded;
            } else {
                $tags = array_map('trim', explode(',', $row['tags']));
            }
        }

        return [
            '_id' => (string)$row['id'],
            'id' => (int)$row['id'],
            'userId' => (string)$row['user_id'],
            'title' => $row['title'],
            'amountMinor' => (int)$row['amount_minor'],
            'type' => $row['type'],
            'category' => $row['category'],
            'date' => date('Y-m-d\TH:i:s.000\Z', strtotime($row['date'])),
            'paymentMethod' => $row['payment_method'] ?? 'cash',
            'notes' => $row['notes'] ?? '',
            'tags' => $tags,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    public static function getTransactions(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, (int)($_GET['limit'] ?? 20));
        $type = $_GET['type'] ?? null;
        $category = $_GET['category'] ?? null;
        $paymentMethod = $_GET['paymentMethod'] ?? null;
        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        $search = $_GET['search'] ?? null;
        $sortBy = $_GET['sortBy'] ?? 'date';
        $sortOrder = strtolower($_GET['sortOrder'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

        // Allowed sort columns
        $sortColumns = [
            'date' => 'date',
            'amount' => 'amount_minor',
            'amountMinor' => 'amount_minor',
            'title' => 'title',
            'createdAt' => 'created_at',
        ];
        $orderColumn = $sortColumns[$sortBy] ?? 'date';

        $where = ['user_id = :userId'];
        $params = ['userId' => $user['id']];

        if ($type) {
            $where[] = 'type = :type';
            $params['type'] = $type;
        }
        if ($category) {
            $where[] = 'category = :category';
            $params['category'] = $category;
        }
        if ($paymentMethod) {
            $where[] = 'payment_method = :paymentMethod';
            $params['paymentMethod'] = $paymentMethod;
        }
        if ($startDate) {
            $where[] = 'date >= :startDate';
            $params['startDate'] = date('Y-m-d 00:00:00', strtotime($startDate));
        }
        if ($endDate) {
            $where[] = 'date <= :endDate';
            $params['endDate'] = date('Y-m-d 23:59:59', strtotime($endDate));
        }
        if ($search) {
            $where[] = '(title LIKE :search OR notes LIKE :search OR category LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $whereSql = implode(' AND ', $where);

        // Count total
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM transactions WHERE {$whereSql}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch()['total'];

        // Pagination
        $offset = ($page - 1) * $limit;
        $querySql = "SELECT * FROM transactions WHERE {$whereSql} ORDER BY {$orderColumn} {$sortOrder} LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($querySql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $transactions = array_map([self::class, 'formatTransaction'], $rows);

        echo json_encode([
            'success' => true,
            'data' => [
                'transactions' => $transactions,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit) ?: 1,
                ]
            ]
        ]);
    }

    public static function getTransaction(int $id): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM transactions WHERE id = :id AND user_id = :userId LIMIT 1');
        $stmt->execute(['id' => $id, 'userId' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Transaction not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => ['transaction' => self::formatTransaction($row)]
        ]);
    }

    public static function createTransaction(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($data['title'] ?? '');
        $amount = (float)($data['amount'] ?? 0);
        $amountMinor = isset($data['amountMinor']) ? (int)$data['amountMinor'] : (int)round($amount * 100);
        $type = $data['type'] ?? 'expense';
        $category = trim($data['category'] ?? '');
        $date = !empty($data['date']) ? date('Y-m-d H:i:s', strtotime($data['date'])) : date('Y-m-d H:i:s');
        $paymentMethod = $data['paymentMethod'] ?? 'cash';
        $notes = $data['notes'] ?? '';
        $tags = isset($data['tags']) && is_array($data['tags']) ? json_encode($data['tags']) : null;

        if (!$title || $amountMinor <= 0 || !$category) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Title, category, and positive amount are required.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO transactions (user_id, title, amount_minor, type, category, date, payment_method, notes, tags) VALUES (:user_id, :title, :amount_minor, :type, :category, :date, :payment_method, :notes, :tags)');
        $stmt->execute([
            'user_id' => $user['id'],
            'title' => $title,
            'amount_minor' => $amountMinor,
            'type' => $type,
            'category' => $category,
            'date' => $date,
            'payment_method' => $paymentMethod,
            'notes' => $notes,
            'tags' => $tags,
        ]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM transactions WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $tx = self::formatTransaction($stmt->fetch());

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => ['transaction' => $tx]
        ]);
    }

    public static function updateTransaction(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $id, 'user_id' => $user['id']];

        if (isset($data['title'])) {
            $fields[] = 'title = :title';
            $params['title'] = trim($data['title']);
        }
        if (isset($data['amount'])) {
            $fields[] = 'amount_minor = :amount_minor';
            $params['amount_minor'] = (int)round((float)$data['amount'] * 100);
        } elseif (isset($data['amountMinor'])) {
            $fields[] = 'amount_minor = :amount_minor';
            $params['amount_minor'] = (int)$data['amountMinor'];
        }
        if (isset($data['type'])) {
            $fields[] = 'type = :type';
            $params['type'] = $data['type'];
        }
        if (isset($data['category'])) {
            $fields[] = 'category = :category';
            $params['category'] = $data['category'];
        }
        if (isset($data['date'])) {
            $fields[] = 'date = :date';
            $params['date'] = date('Y-m-d H:i:s', strtotime($data['date']));
        }
        if (isset($data['paymentMethod'])) {
            $fields[] = 'payment_method = :payment_method';
            $params['payment_method'] = $data['paymentMethod'];
        }
        if (isset($data['notes'])) {
            $fields[] = 'notes = :notes';
            $params['notes'] = $data['notes'];
        }
        if (isset($data['tags'])) {
            $fields[] = 'tags = :tags';
            $params['tags'] = is_array($data['tags']) ? json_encode($data['tags']) : $data['tags'];
        }

        if (!empty($fields)) {
            $sql = 'UPDATE transactions SET ' . implode(', ', $fields) . ' WHERE id = :id AND user_id = :user_id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $db->prepare('SELECT * FROM transactions WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Transaction not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => ['transaction' => self::formatTransaction($row)]
        ]);
    }

    public static function deleteTransaction(int $id): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM transactions WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Transaction not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Transaction deleted successfully.'
        ]);
    }
}
