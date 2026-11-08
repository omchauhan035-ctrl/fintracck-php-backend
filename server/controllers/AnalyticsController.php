<?php
// controllers/AnalyticsController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AnalyticsController {
    public static function getIncomeExpenses(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        $months = max(1, (int)($_GET['months'] ?? 12));

        $where = ['user_id = :userId'];
        $params = ['userId' => $user['id']];

        if ($startDate && $endDate) {
            $where[] = 'date >= :startDate AND date <= :endDate';
            $params['startDate'] = date('Y-m-d 00:00:00', strtotime($startDate));
            $params['endDate'] = date('Y-m-d 23:59:59', strtotime($endDate));
        } else {
            $start = date('Y-m-01 00:00:00', strtotime('-' . ($months - 1) . ' months'));
            $where[] = 'date >= :startDate';
            $params['startDate'] = $start;
        }

        $whereSql = implode(' AND ', $where);

        $stmt = $db->prepare("
            SELECT 
                YEAR(date) AS yr,
                MONTH(date) AS mo,
                type,
                SUM(amount_minor) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE {$whereSql}
            GROUP BY YEAR(date), MONTH(date), type
            ORDER BY YEAR(date) ASC, MONTH(date) ASC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $data = [];
        foreach ($rows as $r) {
            $data[] = [
                '_id' => [
                    'year' => (int)$r['yr'],
                    'month' => (int)$r['mo'],
                    'type' => $r['type'],
                ],
                'total' => (int)$r['total'],
                'count' => (int)$r['count'],
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }

    public static function getCategoryAnalytics(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;
        $type = $_GET['type'] ?? 'expense';

        $where = ['user_id = :userId', 'type = :type'];
        $params = ['userId' => $user['id'], 'type' => $type];

        if ($startDate) {
            $where[] = 'date >= :startDate';
            $params['startDate'] = date('Y-m-d 00:00:00', strtotime($startDate));
        }
        if ($endDate) {
            $where[] = 'date <= :endDate';
            $params['endDate'] = date('Y-m-d 23:59:59', strtotime($endDate));
        }

        $whereSql = implode(' AND ', $where);

        $stmt = $db->prepare("
            SELECT 
                category,
                SUM(amount_minor) AS total,
                COUNT(*) AS count,
                AVG(amount_minor) AS avgAmount
            FROM transactions
            WHERE {$whereSql}
            GROUP BY category
            ORDER BY total DESC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $grandTotal = 0;
        foreach ($rows as $r) {
            $grandTotal += (int)$r['total'];
        }

        $enriched = [];
        foreach ($rows as $r) {
            $tot = (int)$r['total'];
            $pct = $grandTotal > 0 ? round(($tot / $grandTotal) * 100, 2) : 0;
            $enriched[] = [
                '_id' => $r['category'],
                'category' => $r['category'],
                'total' => $tot,
                'count' => (int)$r['count'],
                'avgAmount' => (int)round((float)$r['avgAmount']),
                'percentage' => $pct,
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $enriched
        ]);
    }

    public static function getTrends(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $months = max(1, (int)($_GET['months'] ?? 12));
        $start = date('Y-m-01 00:00:00', strtotime('-' . ($months - 1) . ' months'));

        $stmt = $db->prepare('
            SELECT 
                YEAR(date) AS yr,
                MONTH(date) AS mo,
                SUM(CASE WHEN type = "income" THEN amount_minor ELSE 0 END) AS income,
                SUM(CASE WHEN type = "expense" THEN amount_minor ELSE 0 END) AS expenses
            FROM transactions
            WHERE user_id = :userId AND date >= :startDate
            GROUP BY YEAR(date), MONTH(date)
            ORDER BY YEAR(date) ASC, MONTH(date) ASC
        ');
        $stmt->execute(['userId' => $user['id'], 'startDate' => $start]);
        $rows = $stmt->fetchAll();

        $data = [];
        foreach ($rows as $r) {
            $yr = (int)$r['yr'];
            $mo = (int)$r['mo'];
            $inc = (int)$r['income'];
            $exp = (int)$r['expenses'];
            $savings = $inc - $exp;
            $savingsRate = $inc > 0 ? round(($savings / $inc) * 100, 2) : 0;

            $data[] = [
                '_id' => ['year' => $yr, 'month' => $mo],
                'year' => $yr,
                'month' => $mo,
                'income' => $inc,
                'expenses' => $exp,
                'savings' => $savings,
                'savingsRate' => $savingsRate,
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
    }
}
