<?php
// controllers/BudgetController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class BudgetController {
    public static function formatBudget(array $b, int $spentAmount = 0): array {
        $amountMinor = (int)$b['amount_minor'];
        $remaining = $amountMinor - $spentAmount;
        $percentage = $amountMinor > 0 ? round(($spentAmount / $amountMinor) * 100, 2) : 0;
        $status = $percentage >= 100 ? 'exceeded' : ($percentage >= 80 ? 'warning' : 'normal');

        return [
            '_id' => (string)$b['id'],
            'id' => (int)$b['id'],
            'userId' => (string)$b['user_id'],
            'category' => $b['category'],
            'amountMinor' => $amountMinor,
            'period' => $b['period'] ?? 'monthly',
            'startDate' => date('Y-m-d\TH:i:s.000\Z', strtotime($b['start_date'])),
            'endDate' => date('Y-m-d\TH:i:s.000\Z', strtotime($b['end_date'])),
            'spentAmount' => $spentAmount,
            'remaining' => $remaining,
            'percentage' => $percentage,
            'status' => $status,
            'createdAt' => $b['created_at'],
            'updatedAt' => $b['updated_at'],
        ];
    }

    public static function getBudgets(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM budgets WHERE user_id = :userId ORDER BY start_date DESC');
        $stmt->execute(['userId' => $user['id']]);
        $budgets = $stmt->fetchAll();

        $spentStmt = $db->prepare('
            SELECT COALESCE(SUM(amount_minor), 0) as total 
            FROM transactions 
            WHERE user_id = :userId 
              AND type = "expense" 
              AND category = :category 
              AND date >= :startDate 
              AND date <= :endDate
        ');

        $budgetsWithSpending = [];
        foreach ($budgets as $b) {
            $spentStmt->execute([
                'userId' => $user['id'],
                'category' => $b['category'],
                'startDate' => $b['start_date'],
                'endDate' => $b['end_date'],
            ]);
            $spent = (int)$spentStmt->fetch()['total'];
            $budgetsWithSpending[] = self::formatBudget($b, $spent);
        }

        echo json_encode([
            'success' => true,
            'data' => ['budgets' => $budgetsWithSpending]
        ]);
    }

    public static function createBudget(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $category = trim($data['category'] ?? '');
        $amount = (float)($data['amount'] ?? 0);
        $amountMinor = isset($data['amountMinor']) ? (int)$data['amountMinor'] : (int)round($amount * 100);
        $period = $data['period'] ?? 'monthly';
        $startDate = !empty($data['startDate']) ? date('Y-m-d 00:00:00', strtotime($data['startDate'])) : date('Y-m-01 00:00:00');
        $endDate = !empty($data['endDate']) ? date('Y-m-d 23:59:59', strtotime($data['endDate'])) : date('Y-m-t 23:59:59');

        if (!$category || $amountMinor <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Category and positive budget amount are required.'
            ]);
            return;
        }

        $db = Database::getConnection();

        // Check overlapping budget
        $chk = $db->prepare('SELECT id FROM budgets WHERE user_id = :userId AND category = :category AND (start_date <= :endDate AND end_date >= :startDate) LIMIT 1');
        $chk->execute([
            'userId' => $user['id'],
            'category' => $category,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);

        if ($chk->fetch()) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'A budget for this category already exists in the selected period.'
            ]);
            return;
        }

        $stmt = $db->prepare('INSERT INTO budgets (user_id, category, amount_minor, period, start_date, end_date) VALUES (:user_id, :category, :amount_minor, :period, :start_date, :end_date)');
        $stmt->execute([
            'user_id' => $user['id'],
            'category' => $category,
            'amount_minor' => $amountMinor,
            'period' => $period,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM budgets WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $budget = self::formatBudget($stmt->fetch(), 0);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => ['budget' => $budget]
        ]);
    }

    public static function updateBudget(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $id, 'user_id' => $user['id']];

        if (isset($data['category'])) {
            $fields[] = 'category = :category';
            $params['category'] = trim($data['category']);
        }
        if (isset($data['amount'])) {
            $fields[] = 'amount_minor = :amount_minor';
            $params['amount_minor'] = (int)round((float)$data['amount'] * 100);
        } elseif (isset($data['amountMinor'])) {
            $fields[] = 'amount_minor = :amount_minor';
            $params['amount_minor'] = (int)$data['amountMinor'];
        }
        if (isset($data['period'])) {
            $fields[] = 'period = :period';
            $params['period'] = $data['period'];
        }
        if (isset($data['startDate'])) {
            $fields[] = 'start_date = :start_date';
            $params['start_date'] = date('Y-m-d 00:00:00', strtotime($data['startDate']));
        }
        if (isset($data['endDate'])) {
            $fields[] = 'end_date = :end_date';
            $params['end_date'] = date('Y-m-d 23:59:59', strtotime($data['endDate']));
        }

        if (!empty($fields)) {
            $sql = 'UPDATE budgets SET ' . implode(', ', $fields) . ' WHERE id = :id AND user_id = :user_id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $db->prepare('SELECT * FROM budgets WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Budget not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => ['budget' => self::formatBudget($row)]
        ]);
    }

    public static function deleteBudget(int $id): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM budgets WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Budget not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Budget deleted successfully.'
        ]);
    }
}
