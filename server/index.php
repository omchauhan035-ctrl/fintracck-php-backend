<?php
// index.php - Front Controller & REST API Router

// 1. CORS Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// 2. Preflight request handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Load Controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/TransactionController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/BudgetController.php';
require_once __DIR__ . '/controllers/GoalController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/AnalyticsController.php';
require_once __DIR__ . '/controllers/AdminController.php';

// 4. Parse URI Path
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedUrl = parse_url($requestUri);
$path = rtrim($parsedUrl['path'] ?? '/', '/');

// Strip any directory prefix before /api (for Apache / XAMPP subfolder deployments)
$apiPos = strpos($path, '/api');
if ($apiPos !== false) {
    $path = substr($path, $apiPos);
}

// If accessed as root with PHP built-in server or static check
if ($path === '' || $path === '/') {
    echo json_encode([
        'success' => true,
        'message' => 'Finance Tracker PHP REST API is running successfully!',
        'database' => 'MySQL (XAMPP)',
        'endpoints' => [
            '/api/auth',
            '/api/transactions',
            '/api/categories',
            '/api/budgets',
            '/api/goals',
            '/api/dashboard',
            '/api/analytics',
        ]
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// 5. Route Matching
try {
    // Health Check
    if ($method === 'GET' && $path === '/api/health') {
        echo json_encode(['status' => 'ok', 'message' => 'PHP API Server is healthy!']);
        exit;
    }

    // --- AUTH ROUTES ---
    if ($path === '/api/auth/register' && $method === 'POST') {
        AuthController::register();
        exit;
    }
    if ($path === '/api/auth/login' && $method === 'POST') {
        AuthController::login();
        exit;
    }
    if ($path === '/api/auth/logout' && $method === 'POST') {
        AuthController::logout();
        exit;
    }
    if ($path === '/api/auth/me' && $method === 'GET') {
        AuthController::getMe();
        exit;
    }
    if ($path === '/api/auth/profile' && $method === 'PATCH') {
        AuthController::updateProfile();
        exit;
    }
    if ($path === '/api/auth/password' && $method === 'PATCH') {
        AuthController::changePassword();
        exit;
    }

    // --- TRANSACTION ROUTES ---
    if ($path === '/api/transactions' && $method === 'GET') {
        TransactionController::getTransactions();
        exit;
    }
    if ($path === '/api/transactions' && $method === 'POST') {
        TransactionController::createTransaction();
        exit;
    }
    if (preg_match('#^/api/transactions/(\d+)$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'GET') {
            TransactionController::getTransaction($id);
            exit;
        } elseif ($method === 'PATCH') {
            TransactionController::updateTransaction($id);
            exit;
        } elseif ($method === 'DELETE') {
            TransactionController::deleteTransaction($id);
            exit;
        }
    }

    // --- CATEGORY ROUTES ---
    if ($path === '/api/categories' && $method === 'GET') {
        CategoryController::getCategories();
        exit;
    }
    if ($path === '/api/categories' && $method === 'POST') {
        CategoryController::createCategory();
        exit;
    }
    if (preg_match('#^/api/categories/(\d+)$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'PATCH') {
            CategoryController::updateCategory($id);
            exit;
        } elseif ($method === 'DELETE') {
            CategoryController::deleteCategory($id);
            exit;
        }
    }

    // --- BUDGET ROUTES ---
    if ($path === '/api/budgets' && $method === 'GET') {
        BudgetController::getBudgets();
        exit;
    }
    if ($path === '/api/budgets' && $method === 'POST') {
        BudgetController::createBudget();
        exit;
    }
    if (preg_match('#^/api/budgets/(\d+)$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'PATCH') {
            BudgetController::updateBudget($id);
            exit;
        } elseif ($method === 'DELETE') {
            BudgetController::deleteBudget($id);
            exit;
        }
    }

    // --- GOAL ROUTES ---
    if ($path === '/api/goals' && $method === 'GET') {
        GoalController::getGoals();
        exit;
    }
    if ($path === '/api/goals' && $method === 'POST') {
        GoalController::createGoal();
        exit;
    }
    if (preg_match('#^/api/goals/(\d+)/contributions$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'POST') {
            GoalController::addContribution($id);
            exit;
        }
    }
    if (preg_match('#^/api/goals/(\d+)/withdrawals$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'POST') {
            GoalController::addWithdrawal($id);
            exit;
        }
    }
    if (preg_match('#^/api/goals/(\d+)$#', $path, $matches)) {
        $id = (int)$matches[1];
        if ($method === 'PATCH') {
            GoalController::updateGoal($id);
            exit;
        } elseif ($method === 'DELETE') {
            GoalController::deleteGoal($id);
            exit;
        }
    }

    // --- DASHBOARD ROUTE ---
    if ($path === '/api/dashboard/summary' && $method === 'GET') {
        DashboardController::getSummary();
        exit;
    }

    // --- ANALYTICS ROUTES ---
    if ($path === '/api/analytics/income-expenses' && $method === 'GET') {
        AnalyticsController::getIncomeExpenses();
        exit;
    }
    if ($path === '/api/analytics/categories' && $method === 'GET') {
        AnalyticsController::getCategoryAnalytics();
        exit;
    }
    if ($path === '/api/analytics/trends' && $method === 'GET') {
        AnalyticsController::getTrends();
        exit;
    }

    // --- ADMINISTRATOR ROUTES ---
    if ($path === '/api/admin/stats' && $method === 'GET') {
        AdminController::getStats();
        exit;
    }
    if ($path === '/api/admin/users' && $method === 'GET') {
        AdminController::getUsers();
        exit;
    }
    if (preg_match('#^/api/admin/users/(\d+)/status$#', $path, $matches)) {
        if ($method === 'PATCH') {
            AdminController::updateUserStatus((int)$matches[1]);
            exit;
        }
    }
    if (preg_match('#^/api/admin/users/(\d+)/role$#', $path, $matches)) {
        if ($method === 'PATCH') {
            AdminController::updateUserRole((int)$matches[1]);
            exit;
        }
    }
    if (preg_match('#^/api/admin/users/(\d+)$#', $path, $matches)) {
        if ($method === 'DELETE') {
            AdminController::deleteUser((int)$matches[1]);
            exit;
        }
    }
    if ($path === '/api/admin/transactions' && $method === 'GET') {
        AdminController::getTransactions();
        exit;
    }
    if (preg_match('#^/api/admin/transactions/(\d+)$#', $path, $matches)) {
        if ($method === 'DELETE') {
            AdminController::deleteTransaction((int)$matches[1]);
            exit;
        }
    }
    if ($path === '/api/admin/categories' && $method === 'GET') {
        AdminController::getCategories();
        exit;
    }
    if ($path === '/api/admin/categories' && $method === 'POST') {
        AdminController::createDefaultCategory();
        exit;
    }
    if (preg_match('#^/api/admin/categories/(\d+)$#', $path, $matches)) {
        if ($method === 'DELETE') {
            AdminController::deleteDefaultCategory((int)$matches[1]);
            exit;
        }
    }
    if ($path === '/api/admin/system-health' && $method === 'GET') {
        AdminController::getSystemHealth();
        exit;
    }

    // Route not found
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => "API Route [{$method}] {$path} not found."
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal Server Error: ' . $e->getMessage()
    ]);
}
