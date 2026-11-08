<?php
// controllers/AdminController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AdminController {

    /**
     * @desc    Get system-wide metrics and stats for Admin Dashboard
     * @route   GET /api/admin/stats
     */
    public static function getStats(): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        // 1. User stats
        $uTotal = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $uActive = (int)$db->query("SELECT COUNT(*) FROM users WHERE status = 'active'")->fetchColumn();
        $uBlocked = (int)$db->query("SELECT COUNT(*) FROM users WHERE status = 'blocked'")->fetchColumn();
        $uAdmins = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();

        // 2. Transaction stats
        $txTotal = (int)$db->query('SELECT COUNT(*) FROM transactions')->fetchColumn();
        $txIncome = (int)$db->query("SELECT COALESCE(SUM(amount_minor), 0) FROM transactions WHERE type = 'income'")->fetchColumn();
        $txExpense = (int)$db->query("SELECT COALESCE(SUM(amount_minor), 0) FROM transactions WHERE type = 'expense'")->fetchColumn();

        // 3. Budgets & Goals
        $bTotal = (int)$db->query('SELECT COUNT(*) FROM budgets')->fetchColumn();
        $gTotal = (int)$db->query('SELECT COUNT(*) FROM savings_goals')->fetchColumn();

        // 4. Monthly trends (Income vs Expense grouped by Year, Month, Type)
        $trendsSql = "SELECT 
                        YEAR(date) as yr, 
                        MONTH(date) as mo, 
                        type, 
                        SUM(amount_minor) as total_minor 
                      FROM transactions 
                      WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                      GROUP BY YEAR(date), MONTH(date), type 
                      ORDER BY yr ASC, mo ASC";
        $trendsStmt = $db->query($trendsSql);
        $monthlyTrends = [];
        while ($r = $trendsStmt->fetch()) {
            $monthlyTrends[] = [
                '_id' => [
                    'year' => (int)$r['yr'],
                    'month' => (int)$r['mo'],
                    'type' => $r['type'],
                ],
                'totalMinor' => (int)$r['total_minor'],
            ];
        }

        // 5. Recent registered users (limit 5)
        $usersSql = "SELECT id, name, email, role, status, created_at 
                     FROM users 
                     ORDER BY created_at DESC 
                     LIMIT 5";
        $usersStmt = $db->query($usersSql);
        $recentUsers = [];
        while ($u = $usersStmt->fetch()) {
            $recentUsers[] = [
                '_id' => (string)$u['id'],
                'id' => (int)$u['id'],
                'name' => $u['name'],
                'email' => $u['email'],
                'role' => $u['role'] ?? 'user',
                'status' => $u['status'] ?? 'active',
                'createdAt' => $u['created_at'],
            ];
        }

        // 6. Recent global transactions (limit 8)
        $txSql = "SELECT t.id, t.title, t.amount_minor, t.type, t.category, t.payment_method, t.date,
                         u.id as user_id, u.name as user_name, u.email as user_email
                  FROM transactions t
                  JOIN users u ON t.user_id = u.id
                  ORDER BY t.date DESC
                  LIMIT 8";
        $txStmt = $db->query($txSql);
        $recentTransactions = [];
        while ($t = $txStmt->fetch()) {
            $recentTransactions[] = [
                '_id' => (string)$t['id'],
                'id' => (int)$t['id'],
                'title' => $t['title'],
                'amountMinor' => (int)$t['amount_minor'],
                'type' => $t['type'],
                'category' => $t['category'],
                'paymentMethod' => $t['payment_method'],
                'date' => $t['date'],
                'userId' => [
                    '_id' => (string)$t['user_id'],
                    'id' => (int)$t['user_id'],
                    'name' => $t['user_name'],
                    'email' => $t['user_email'],
                ]
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'users' => [
                    'total' => $uTotal,
                    'active' => $uActive,
                    'blocked' => $uBlocked,
                    'admins' => $uAdmins,
                ],
                'transactions' => [
                    'total' => $txTotal,
                    'totalIncomeMinor' => $txIncome,
                    'totalExpenseMinor' => $txExpense,
                ],
                'budgets' => [
                    'total' => $bTotal,
                ],
                'goals' => [
                    'total' => $gTotal,
                ],
                'monthlyTrends' => $monthlyTrends,
                'recentUsers' => $recentUsers,
                'recentTransactions' => $recentTransactions,
            ]
        ]);
    }

    /**
     * @desc    Get paginated users directory with financial aggregates
     * @route   GET /api/admin/users
     */
    public static function getUsers(): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        $search = trim($_GET['search'] ?? '');
        $role = trim($_GET['role'] ?? 'all');
        $status = trim($_GET['status'] ?? 'all');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(u.name LIKE :search_name OR u.email LIKE :search_email)';
            $params['search_name'] = "%{$search}%";
            $params['search_email'] = "%{$search}%";
        }

        if ($role !== 'all' && in_array($role, ['user', 'admin'], true)) {
            $where[] = 'u.role = :role';
            $params['role'] = $role;
        }

        if ($status !== 'all' && in_array($status, ['active', 'blocked'], true)) {
            $where[] = 'u.status = :status';
            $params['status'] = $status;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Count total
        $countStmt = $db->prepare("SELECT COUNT(*) FROM users u {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Fetch users with subquery sums
        $sql = "SELECT 
                  u.id, u.name, u.email, u.role, u.status, u.created_at, u.updated_at,
                  (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as transaction_count,
                  (SELECT COALESCE(SUM(amount_minor), 0) FROM transactions t WHERE t.user_id = u.id AND t.type = 'income') as total_income_minor,
                  (SELECT COALESCE(SUM(amount_minor), 0) FROM transactions t WHERE t.user_id = u.id AND t.type = 'expense') as total_spent_minor
                FROM users u
                {$whereClause}
                ORDER BY u.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $users = [];
        while ($row = $stmt->fetch()) {
            $users[] = [
                '_id' => (string)$row['id'],
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => $row['role'] ?? 'user',
                'status' => $row['status'] ?? 'active',
                'transactionCount' => (int)$row['transaction_count'],
                'totalIncomeMinor' => (int)$row['total_income_minor'],
                'totalSpentMinor' => (int)$row['total_spent_minor'],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'users' => $users,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit) ?: 1,
                ]
            ]
        ]);
    }

    /**
     * @desc    Update user status (active / blocked)
     * @route   PATCH /api/admin/users/:id/status
     */
    public static function updateUserStatus(int $targetId): void {
        $admin = AuthMiddleware::adminOnly();

        if ($targetId === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'You cannot modify your own administrative account status.'
            ]);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $status = $input['status'] ?? '';

        if (!in_array($status, ['active', 'blocked'], true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Status must be active or blocked.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE users SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $targetId]);

        echo json_encode([
            'success' => true,
            'message' => "User status updated to {$status}."
        ]);
    }

    /**
     * @desc    Update user role (user / admin)
     * @route   PATCH /api/admin/users/:id/role
     */
    public static function updateUserRole(int $targetId): void {
        $admin = AuthMiddleware::adminOnly();

        if ($targetId === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'You cannot change your own administrative role.'
            ]);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $role = $input['role'] ?? '';

        if (!in_array($role, ['user', 'admin'], true)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Role must be user or admin.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE users SET role = :role WHERE id = :id');
        $stmt->execute(['role' => $role, 'id' => $targetId]);

        echo json_encode([
            'success' => true,
            'message' => "User role updated to {$role}."
        ]);
    }

    /**
     * @desc    Delete user and cascade their transactions, categories, budgets, goals
     * @route   DELETE /api/admin/users/:id
     */
    public static function deleteUser(int $targetId): void {
        $admin = AuthMiddleware::adminOnly();

        if ($targetId === (int)$admin['id']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'You cannot delete your own administrative account.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $targetId]);

        echo json_encode([
            'success' => true,
            'message' => 'User and associated data permanently deleted.'
        ]);
    }

    /**
     * @desc    Get paginated global transactions feed
     * @route   GET /api/admin/transactions
     */
    public static function getTransactions(): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        $search = trim($_GET['search'] ?? '');
        $type = trim($_GET['type'] ?? 'all');
        $category = trim($_GET['category'] ?? 'all');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 15)));
        $offset = ($page - 1) * $limit;

        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(t.title LIKE :search_title OR t.notes LIKE :search_notes OR t.payment_method LIKE :search_pm)';
            $params['search_title'] = "%{$search}%";
            $params['search_notes'] = "%{$search}%";
            $params['search_pm'] = "%{$search}%";
        }

        if ($type !== 'all' && in_array($type, ['income', 'expense'], true)) {
            $where[] = 't.type = :type';
            $params['type'] = $type;
        }

        if ($category !== 'all' && $category !== '') {
            $where[] = 't.category = :category';
            $params['category'] = $category;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM transactions t {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "SELECT t.id, t.title, t.amount_minor, t.type, t.category, t.payment_method, t.notes, t.date, t.created_at,
                       u.id as user_id, u.name as user_name, u.email as user_email
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                {$whereClause}
                ORDER BY t.date DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $transactions = [];
        while ($t = $stmt->fetch()) {
            $transactions[] = [
                '_id' => (string)$t['id'],
                'id' => (int)$t['id'],
                'title' => $t['title'],
                'amountMinor' => (int)$t['amount_minor'],
                'type' => $t['type'],
                'category' => $t['category'],
                'paymentMethod' => $t['payment_method'],
                'notes' => $t['notes'],
                'date' => $t['date'],
                'createdAt' => $t['created_at'],
                'userId' => [
                    '_id' => (string)$t['user_id'],
                    'id' => (int)$t['user_id'],
                    'name' => $t['user_name'],
                    'email' => $t['user_email'],
                ]
            ];
        }

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

    /**
     * @desc    Delete any transaction (Admin Audit)
     * @route   DELETE /api/admin/transactions/:id
     */
    public static function deleteTransaction(int $id): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM transactions WHERE id = :id');
        $stmt->execute(['id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Transaction removed successfully by administrator.'
        ]);
    }

    /**
     * @desc    Get category master list and platform-wide usage
     * @route   GET /api/admin/categories
     */
    public static function getCategories(): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        // 1. Distinct default categories
        $defaultCategories = $db->query("SELECT id, name, type, color, icon, is_default, created_at 
                                         FROM categories 
                                         WHERE is_default = 1 
                                         GROUP BY name, type 
                                         ORDER BY name ASC")->fetchAll();

        // Map _id
        $formattedDefaults = array_map(function($cat) {
            return [
                '_id' => (string)$cat['id'],
                'id' => (int)$cat['id'],
                'name' => $cat['name'],
                'type' => $cat['type'],
                'color' => $cat['color'] ?? '#6366f1',
                'icon' => $cat['icon'] ?? 'tag',
                'isDefault' => (bool)$cat['is_default'],
            ];
        }, $defaultCategories);

        // 2. Custom category count
        $customCount = (int)$db->query("SELECT COUNT(*) FROM categories WHERE is_default = 0")->fetchColumn();

        // 3. Category usage counts in transactions
        $usageStmt = $db->query("SELECT category as _id, COUNT(*) as count FROM transactions GROUP BY category");
        $categoryUsage = $usageStmt->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => [
                'defaultCategories' => $formattedDefaults,
                'customCategoriesCount' => $customCount,
                'categoryUsage' => $categoryUsage,
            ]
        ]);
    }

    /**
     * @desc    Create a new global default category
     * @route   POST /api/admin/categories
     */
    public static function createDefaultCategory(): void {
        $admin = AuthMiddleware::adminOnly();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim($input['name'] ?? '');
        $type = trim($input['type'] ?? 'expense');
        $color = trim($input['color'] ?? '#6366f1');
        $icon = trim($input['icon'] ?? 'tag');

        if (!$name) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Category name is required.'
            ]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES (:user_id, :name, :type, :color, :icon, 1)');
        $stmt->execute([
            'user_id' => $admin['id'],
            'name' => $name,
            'type' => $type,
            'color' => $color,
            'icon' => $icon,
        ]);

        $catId = (int)$db->lastInsertId();

        echo json_encode([
            'success' => true,
            'message' => 'Default category created successfully.',
            'data' => [
                'category' => [
                    '_id' => (string)$catId,
                    'id' => $catId,
                    'name' => $name,
                    'type' => $type,
                    'color' => $color,
                    'icon' => $icon,
                    'isDefault' => true,
                ]
            ]
        ]);
    }

    /**
     * @desc    Delete a default category
     * @route   DELETE /api/admin/categories/:id
     */
    public static function deleteDefaultCategory(int $id): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        $stmt = $db->prepare('DELETE FROM categories WHERE id = :id AND is_default = 1');
        $stmt->execute(['id' => $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Default category removed successfully.'
        ]);
    }

    /**
     * @desc    Get runtime telemetry and system health
     * @route   GET /api/admin/system-health
     */
    public static function getSystemHealth(): void {
        AuthMiddleware::adminOnly();
        $db = Database::getConnection();

        $memoryBytes = memory_get_usage(true);
        $memoryMB = round($memoryBytes / 1024 / 1024, 2);
        $peakBytes = memory_get_peak_usage(true);
        $peakMB = round($peakBytes / 1024 / 1024, 2);

        $version = $db->query('SELECT VERSION()')->fetchColumn();

        // Row counts
        $uCount = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $tCount = (int)$db->query('SELECT COUNT(*) FROM transactions')->fetchColumn();
        $bCount = (int)$db->query('SELECT COUNT(*) FROM budgets')->fetchColumn();
        $gCount = (int)$db->query('SELECT COUNT(*) FROM savings_goals')->fetchColumn();

        echo json_encode([
            'success' => true,
            'data' => [
                'status' => 'healthy',
                'uptime' => 'Active (PHP ' . PHP_VERSION . ')',
                'nodeVersion' => 'PHP ' . PHP_VERSION . ' / ' . PHP_OS,
                'timestamp' => date('c'),
                'memory' => [
                    'heapUsedMB' => (string)$memoryMB,
                    'heapTotalMB' => (string)max(128, $peakMB),
                    'rssMB' => (string)$peakMB,
                ],
                'database' => [
                    'status' => 'Connected',
                    'name' => 'finance_tracker (MySQL ' . $version . ')',
                    'tables' => [
                        'users' => $uCount,
                        'transactions' => $tCount,
                        'budgets' => $bCount,
                        'goals' => $gCount,
                    ]
                ]
            ]
        ]);
    }
}

