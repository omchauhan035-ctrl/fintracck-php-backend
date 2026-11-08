<?php
// controllers/GoalController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class GoalController {
    public static function formatContribution(array $row): array {
        return [
            '_id' => (string)$row['id'],
            'id' => (int)$row['id'],
            'userId' => (string)$row['user_id'],
            'goalId' => (string)$row['goal_id'],
            'amountMinor' => (int)$row['amount_minor'],
            'type' => $row['type'],
            'notes' => $row['notes'] ?? '',
            'date' => date('Y-m-d\TH:i:s.000\Z', strtotime($row['date'] ?? $row['created_at'])),
            'createdAt' => $row['created_at'],
        ];
    }

    public static function formatGoal(array $g, array $recentContributions = []): array {
        $targetMinor = (int)$g['target_amount_minor'];
        $currentMinor = (int)$g['current_amount_minor'];
        $percentage = $targetMinor > 0 ? round(($currentMinor / $targetMinor) * 100, 2) : 0;
        $remaining = $targetMinor - $currentMinor;

        return [
            '_id' => (string)$g['id'],
            'id' => (int)$g['id'],
            'userId' => (string)$g['user_id'],
            'title' => $g['title'],
            'targetAmountMinor' => $targetMinor,
            'currentAmountMinor' => $currentMinor,
            'targetDate' => !empty($g['target_date']) ? date('Y-m-d\TH:i:s.000\Z', strtotime($g['target_date'])) : null,
            'status' => $g['status'] ?? 'active',
            'color' => $g['color'] ?? '#6366f1',
            'icon' => $g['icon'] ?? 'target',
            'percentage' => $percentage,
            'remaining' => $remaining,
            'recentContributions' => $recentContributions,
            'createdAt' => $g['created_at'],
            'updatedAt' => $g['updated_at'],
        ];
    }

    public static function getGoals(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $status = $_GET['status'] ?? null;
        $sql = 'SELECT * FROM savings_goals WHERE user_id = :userId';
        $params = ['userId' => $user['id']];

        if ($status) {
            $sql .= ' AND status = :status';
            $params['status'] = $status;
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $goals = $stmt->fetchAll();

        $contribStmt = $db->prepare('SELECT * FROM goal_contributions WHERE goal_id = :goalId ORDER BY date DESC, id DESC LIMIT 5');

        $result = [];
        foreach ($goals as $g) {
            $contribStmt->execute(['goalId' => $g['id']]);
            $contributions = array_map([self::class, 'formatContribution'], $contribStmt->fetchAll());
            $result[] = self::formatGoal($g, $contributions);
        }

        echo json_encode([
            'success' => true,
            'data' => ['goals' => $result]
        ]);
    }

    public static function createGoal(): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $title = trim($data['title'] ?? '');
        $targetAmount = (float)($data['targetAmount'] ?? 0);
        $targetAmountMinor = isset($data['targetAmountMinor']) ? (int)$data['targetAmountMinor'] : (int)round($targetAmount * 100);
        $targetDate = !empty($data['targetDate']) ? date('Y-m-d H:i:s', strtotime($data['targetDate'])) : null;
        $color = $data['color'] ?? '#6366f1';
        $icon = $data['icon'] ?? 'target';

        if (!$title || $targetAmountMinor <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Title and positive target amount are required.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO savings_goals (user_id, title, target_amount_minor, current_amount_minor, target_date, color, icon, status) VALUES (:user_id, :title, :target_amount_minor, 0, :target_date, :color, :icon, "active")');
        $stmt->execute([
            'user_id' => $user['id'],
            'title' => $title,
            'target_amount_minor' => $targetAmountMinor,
            'target_date' => $targetDate,
            'color' => $color,
            'icon' => $icon,
        ]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM savings_goals WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $goal = self::formatGoal($stmt->fetch(), []);

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => ['goal' => $goal]
        ]);
    }

    public static function updateGoal(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getConnection();
        $fields = [];
        $params = ['id' => $id, 'user_id' => $user['id']];

        if (isset($data['title'])) {
            $fields[] = 'title = :title';
            $params['title'] = trim($data['title']);
        }
        if (isset($data['targetAmount'])) {
            $fields[] = 'target_amount_minor = :target_amount_minor';
            $params['target_amount_minor'] = (int)round((float)$data['targetAmount'] * 100);
        } elseif (isset($data['targetAmountMinor'])) {
            $fields[] = 'target_amount_minor = :target_amount_minor';
            $params['target_amount_minor'] = (int)$data['targetAmountMinor'];
        }
        if (isset($data['targetDate'])) {
            $fields[] = 'target_date = :target_date';
            $params['target_date'] = !empty($data['targetDate']) ? date('Y-m-d H:i:s', strtotime($data['targetDate'])) : null;
        }
        if (isset($data['status'])) {
            $fields[] = 'status = :status';
            $params['status'] = $data['status'];
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
            $sql = 'UPDATE savings_goals SET ' . implode(', ', $fields) . ' WHERE id = :id AND user_id = :user_id';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }

        $stmt = $db->prepare('SELECT * FROM savings_goals WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Savings goal not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => ['goal' => self::formatGoal($row, [])]
        ]);
    }

    public static function deleteGoal(int $id): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM savings_goals WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Savings goal not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Savings goal deleted successfully.'
        ]);
    }

    public static function addContribution(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $amount = (float)($data['amount'] ?? 0);
        $amountMinor = (int)round($amount * 100);
        $notes = $data['notes'] ?? '';

        if ($amountMinor <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Please provide a valid contribution amount.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM savings_goals WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $goalRow = $stmt->fetch();

        if (!$goalRow) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Savings goal not found.'
            ]);
            return;
        }

        if ($goalRow['status'] !== 'active') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Cannot add contributions to a non-active goal.'
            ]);
            return;
        }

        // Insert contribution
        $cStmt = $db->prepare('INSERT INTO goal_contributions (user_id, goal_id, amount_minor, type, notes) VALUES (:user_id, :goal_id, :amount_minor, "contribution", :notes)');
        $cStmt->execute([
            'user_id' => $user['id'],
            'goal_id' => $id,
            'amount_minor' => $amountMinor,
            'notes' => $notes,
        ]);
        $contribId = (int)$db->lastInsertId();

        // Update goal
        $newCurrentMinor = (int)$goalRow['current_amount_minor'] + $amountMinor;
        $newStatus = $newCurrentMinor >= (int)$goalRow['target_amount_minor'] ? 'completed' : 'active';

        $uStmt = $db->prepare('UPDATE savings_goals SET current_amount_minor = :current_amount_minor, status = :status WHERE id = :id');
        $uStmt->execute([
            'current_amount_minor' => $newCurrentMinor,
            'status' => $newStatus,
            'id' => $id,
        ]);

        $goalRow['current_amount_minor'] = $newCurrentMinor;
        $goalRow['status'] = $newStatus;

        $cFetch = $db->prepare('SELECT * FROM goal_contributions WHERE id = :id');
        $cFetch->execute(['id' => $contribId]);
        $contrib = self::formatContribution($cFetch->fetch());

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => [
                'contribution' => $contrib,
                'goal' => self::formatGoal($goalRow, [])
            ]
        ]);
    }

    public static function addWithdrawal(int $id): void {
        $user = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $amount = (float)($data['amount'] ?? 0);
        $amountMinor = (int)round($amount * 100);
        $notes = $data['notes'] ?? '';

        if ($amountMinor <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Please provide a valid withdrawal amount.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM savings_goals WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $id, 'user_id' => $user['id']]);
        $goalRow = $stmt->fetch();

        if (!$goalRow) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Savings goal not found.'
            ]);
            return;
        }

        if ($amountMinor > (int)$goalRow['current_amount_minor']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Withdrawal amount exceeds current savings.'
            ]);
            return;
        }

        // Insert withdrawal
        $cStmt = $db->prepare('INSERT INTO goal_contributions (user_id, goal_id, amount_minor, type, notes) VALUES (:user_id, :goal_id, :amount_minor, "withdrawal", :notes)');
        $cStmt->execute([
            'user_id' => $user['id'],
            'goal_id' => $id,
            'amount_minor' => $amountMinor,
            'notes' => $notes,
        ]);
        $contribId = (int)$db->lastInsertId();

        // Update goal
        $newCurrentMinor = (int)$goalRow['current_amount_minor'] - $amountMinor;
        $newStatus = ($goalRow['status'] === 'completed' && $newCurrentMinor < (int)$goalRow['target_amount_minor']) ? 'active' : $goalRow['status'];

        $uStmt = $db->prepare('UPDATE savings_goals SET current_amount_minor = :current_amount_minor, status = :status WHERE id = :id');
        $uStmt->execute([
            'current_amount_minor' => $newCurrentMinor,
            'status' => $newStatus,
            'id' => $id,
        ]);

        $goalRow['current_amount_minor'] = $newCurrentMinor;
        $goalRow['status'] = $newStatus;

        $cFetch = $db->prepare('SELECT * FROM goal_contributions WHERE id = :id');
        $cFetch->execute(['id' => $contribId]);
        $contrib = self::formatContribution($cFetch->fetch());

        echo json_encode([
            'success' => true,
            'data' => [
                'contribution' => $contrib,
                'goal' => self::formatGoal($goalRow, [])
            ]
        ]);
    }
}
