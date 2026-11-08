<?php
// controllers/DashboardController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/TransactionController.php';

class DashboardController {
    public static function getSummary(): void {
        $user = AuthMiddleware::authenticate();
        $db = Database::getConnection();

        $startDate = $_GET['startDate'] ?? null;
        $endDate = $_GET['endDate'] ?? null;

        $where = ['user_id = :userId'];
        $params = ['userId' => $user['id']];

        if ($startDate) {
            $where[] = 'date >= :startDate';
            $params['startDate'] = date('Y-m-d 00:00:00', strtotime($startDate));
        }
        if ($endDate) {
            $where[] = 'date <= :endDate';
            $params['endDate'] = date('Y-m-d 23:59:59', strtotime($endDate));
        }

        $whereSql = implode(' AND ', $where);

        // 1. Total Income & Expenses
        $summaryStmt = $db->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0) AS totalIncome,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0) AS totalExpenses,
                COUNT(*) AS transactionCount
            FROM transactions 
            WHERE {$whereSql}
        ");
        $summaryStmt->execute($params);
        $summary = $summaryStmt->fetch();

        $totalIncome = (int)$summary['totalIncome'];
        $totalExpenses = (int)$summary['totalExpenses'];
        $transactionCount = (int)$summary['transactionCount'];
        $balance = $totalIncome - $totalExpenses;
        $savingsRate = $totalIncome > 0 ? round(($balance / $totalIncome) * 100, 2) : 0;

        // 2. Recent Transactions (last 5)
        $recentStmt = $db->prepare('SELECT * FROM transactions WHERE user_id = :userId ORDER BY date DESC LIMIT 5');
        $recentStmt->execute(['userId' => $user['id']]);
        $recentTransactions = array_map([TransactionController::class, 'formatTransaction'], $recentStmt->fetchAll());

        // 3. Monthly data for charts (last 6 months)
        $sixMonthsAgo = date('Y-m-01 00:00:00', strtotime('-5 months'));
        $monthlyStmt = $db->prepare('
            SELECT 
                YEAR(date) AS yr,
                MONTH(date) AS mo,
                type,
                SUM(amount_minor) AS total
            FROM transactions
            WHERE user_id = :userId AND date >= :sixMonthsAgo
            GROUP BY YEAR(date), MONTH(date), type
            ORDER BY YEAR(date) ASC, MONTH(date) ASC
        ');
        $monthlyStmt->execute(['userId' => $user['id'], 'sixMonthsAgo' => $sixMonthsAgo]);
        $monthlyRows = $monthlyStmt->fetchAll();

        $monthlyData = [];
        foreach ($monthlyRows as $row) {
            $monthlyData[] = [
                '_id' => [
                    'year' => (int)$row['yr'],
                    'month' => (int)$row['mo'],
                    'type' => $row['type'],
                ],
                'total' => (int)$row['total'],
            ];
        }

        // 4. Category breakdown for expenses
        $catStmt = $db->prepare("
            SELECT 
                category,
                SUM(amount_minor) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE {$whereSql} AND type = 'expense'
            GROUP BY category
            ORDER BY total DESC
            LIMIT 8
        ");
        $catStmt->execute($params);
        $catRows = $catStmt->fetchAll();

        $categoryBreakdown = [];
        foreach ($catRows as $c) {
            $categoryBreakdown[] = [
                '_id' => $c['category'],
                'total' => (int)$c['total'],
                'count' => (int)$c['count'],
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'totalIncome' => $totalIncome,
                'totalExpenses' => $totalExpenses,
                'balance' => $balance,
                'savingsRate' => $savingsRate,
                'transactionCount' => $transactionCount,
                'recentTransactions' => $recentTransactions,
                'monthlyData' => $monthlyData,
                'categoryBreakdown' => $categoryBreakdown,
            ]
        ]);
    }
}
