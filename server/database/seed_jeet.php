<?php
// database/seed_jeet.php

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();
    echo "MySQL Database connected successfully\n";

    // 1. Find or create jeet@gmail.com
    $stmt = $db->prepare('SELECT id, name, email FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => 'jeet@gmail.com']);
    $user = $stmt->fetch();

    if (!$user) {
        echo "Creating user jeet@gmail.com in MySQL...\n";
        $hash = password_hash('jeet@123', PASSWORD_BCRYPT);
        $insert = $db->prepare('INSERT INTO users (name, email, password_hash, role, status, preferred_currency, theme) VALUES ("Jeet Patel", "jeet@gmail.com", :hash, "user", "active", "INR", "light")');
        $insert->execute(['hash' => $hash]);
        $userId = (int)$db->lastInsertId();
    } else {
        $userId = (int)$user['id'];
    }

    echo "Seeding data for Jeet (User ID: {$userId})...\n";

    // 2. Ensure default categories exist for jeet
    $cStmt = $db->prepare('SELECT COUNT(*) FROM categories WHERE user_id = :uid');
    $cStmt->execute(['uid' => $userId]);
    if ((int)$cStmt->fetchColumn() === 0) {
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
        $insertCat = $db->prepare('INSERT INTO categories (user_id, name, type, color, icon, is_default) VALUES (:user_id, :name, :type, :color, :icon, 1)');
        foreach ($defaultCategories as $cat) {
            $insertCat->execute([
                'user_id' => $userId,
                'name' => $cat['name'],
                'type' => $cat['type'],
                'color' => $cat['color'],
                'icon' => $cat['icon'],
            ]);
        }
        echo "Seeded default categories for Jeet\n";
    }

    // 3. Clear existing transactions, budgets, goals for Jeet to prevent duplicate clutter
    $db->prepare('DELETE FROM transactions WHERE user_id = :uid')->execute(['uid' => $userId]);
    $db->prepare('DELETE FROM budgets WHERE user_id = :uid')->execute(['uid' => $userId]);
    $db->prepare('DELETE FROM savings_goals WHERE user_id = :uid')->execute(['uid' => $userId]);
    echo "Cleared old transactions, budgets, and goals\n";

    // 4. Insert Transactions
    $transactions = [
        // September Income
        ['title' => 'Monthly Software Engineer Salary', 'amount_minor' => 6500000, 'type' => 'income', 'category' => 'Salary', 'date' => '2026-09-01 10:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly payroll deposit'],
        ['title' => 'Freelance React Dashboard Project', 'amount_minor' => 2200000, 'type' => 'income', 'category' => 'Freelance', 'date' => '2026-09-18 15:30:00', 'pm' => 'upi', 'notes' => 'Client milestone 2 payment'],
        ['title' => 'Stock Market Dividend Payout', 'amount_minor' => 350000, 'type' => 'income', 'category' => 'Investments', 'date' => '2026-09-25 11:00:00', 'pm' => 'bank_transfer', 'notes' => 'TCS quarterly dividend'],

        // September Expenses
        ['title' => 'Apartment Rent - Sept', 'amount_minor' => 1600000, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-09-02 09:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly house rent'],
        ['title' => 'Whole Foods & Supermarket Haul', 'amount_minor' => 425000, 'type' => 'expense', 'category' => 'Food & Dining', 'date' => '2026-09-05 18:30:00', 'pm' => 'debit_card', 'notes' => 'Monthly groceries and household items'],
        ['title' => 'Petrol / Fuel Refill', 'amount_minor' => 180000, 'type' => 'expense', 'category' => 'Transportation', 'date' => '2026-09-08 08:45:00', 'pm' => 'upi', 'notes' => 'Full tank fuel'],
        ['title' => 'Netflix & Spotify Premium', 'amount_minor' => 99900, 'type' => 'expense', 'category' => 'Entertainment', 'date' => '2026-09-10 12:00:00', 'pm' => 'credit_card', 'notes' => 'Digital entertainment subscriptions'],
        ['title' => 'Weekend Dining with Friends', 'amount_minor' => 280000, 'type' => 'expense', 'category' => 'Food & Dining', 'date' => '2026-09-14 20:15:00', 'pm' => 'upi', 'notes' => 'Dinner at Barbeque Nation'],
        ['title' => 'Electricity & Water Utility Bill', 'amount_minor' => 215000, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-09-16 14:20:00', 'pm' => 'upi', 'notes' => 'Sept power bill'],
        ['title' => 'Amazon Electronics & Accessories', 'amount_minor' => 540000, 'type' => 'expense', 'category' => 'Shopping', 'date' => '2026-09-20 17:10:00', 'pm' => 'credit_card', 'notes' => 'Mechanical keyboard and mouse'],
        ['title' => 'Pharmacy & Wellness Vitamins', 'amount_minor' => 120000, 'type' => 'expense', 'category' => 'Healthcare', 'date' => '2026-09-22 16:00:00', 'pm' => 'cash', 'notes' => 'Supplements and medicines'],
        ['title' => 'Metro Smart Card Recharge', 'amount_minor' => 110000, 'type' => 'expense', 'category' => 'Transportation', 'date' => '2026-09-26 09:15:00', 'pm' => 'upi', 'notes' => 'Commute metro card balance'],

        // October Income
        ['title' => 'Monthly Software Engineer Salary', 'amount_minor' => 6500000, 'type' => 'income', 'category' => 'Salary', 'date' => '2026-10-01 10:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly payroll deposit'],
        ['title' => 'API Integration Consulting', 'amount_minor' => 1800000, 'type' => 'income', 'category' => 'Freelance', 'date' => '2026-10-15 16:45:00', 'pm' => 'upi', 'notes' => 'Backend Node.js consulting'],
        ['title' => 'Mutual Fund Capital Gains', 'amount_minor' => 420000, 'type' => 'income', 'category' => 'Investments', 'date' => '2026-10-28 11:30:00', 'pm' => 'bank_transfer', 'notes' => 'Quarterly mutual fund SIP redemption'],

        // October Expenses
        ['title' => 'Apartment Rent - Oct', 'amount_minor' => 1600000, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-10-02 09:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly house rent'],
        ['title' => 'Monthly Grocery Superstore', 'amount_minor' => 510000, 'type' => 'expense', 'category' => 'Food & Dining', 'date' => '2026-10-04 19:00:00', 'pm' => 'debit_card', 'notes' => 'Groceries, dairy, and veggies'],
        ['title' => 'Car Servicing & Synthetic Oil', 'amount_minor' => 380000, 'type' => 'expense', 'category' => 'Transportation', 'date' => '2026-10-09 11:20:00', 'pm' => 'credit_card', 'notes' => 'Annual vehicle maintenance'],
        ['title' => 'IMAX Cinema Tickets & Popcorn', 'amount_minor' => 145000, 'type' => 'expense', 'category' => 'Entertainment', 'date' => '2026-10-12 18:40:00', 'pm' => 'upi', 'notes' => 'Weekend movie with family'],
        ['title' => 'WiFi Fiber Broadband Bill', 'amount_minor' => 109900, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-10-16 13:10:00', 'pm' => 'upi', 'notes' => 'Airtel Xstream 200Mbps'],
        ['title' => 'Autumn Festival Festive Clothes', 'amount_minor' => 680000, 'type' => 'expense', 'category' => 'Shopping', 'date' => '2026-10-22 16:30:00', 'pm' => 'credit_card', 'notes' => 'Diwali shopping at lifestyle store'],
        ['title' => 'Cafe Coffee Day Work Session', 'amount_minor' => 165000, 'type' => 'expense', 'category' => 'Food & Dining', 'date' => '2026-10-25 15:00:00', 'pm' => 'upi', 'notes' => 'Coffee and snacks while working'],
        ['title' => 'Annual Gym Membership Renewal', 'amount_minor' => 250000, 'type' => 'expense', 'category' => 'Healthcare', 'date' => '2026-10-27 10:30:00', 'pm' => 'debit_card', 'notes' => 'Cult.fit fitness pass'],

        // November Income
        ['title' => 'Monthly Software Engineer Salary', 'amount_minor' => 6500000, 'type' => 'income', 'category' => 'Salary', 'date' => '2026-11-01 10:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly payroll deposit'],
        ['title' => 'Freelance Code Review Session', 'amount_minor' => 850000, 'type' => 'income', 'category' => 'Freelance', 'date' => '2026-11-02 14:15:00', 'pm' => 'upi', 'notes' => 'Code audit for fintech startup'],

        // November Expenses (Current Month)
        ['title' => 'Apartment Rent - Nov', 'amount_minor' => 1600000, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-11-02 09:00:00', 'pm' => 'bank_transfer', 'notes' => 'Monthly house rent'],
        ['title' => 'Weekly Organic Grocery Basket', 'amount_minor' => 185000, 'type' => 'expense', 'category' => 'Food & Dining', 'date' => '2026-11-03 11:00:00', 'pm' => 'cash', 'notes' => 'Fresh fruits and organic vegetables'],
        ['title' => 'Mobile Postpaid & DTH Recharges', 'amount_minor' => 79900, 'type' => 'expense', 'category' => 'Bills & Utilities', 'date' => '2026-11-03 13:45:00', 'pm' => 'upi', 'notes' => 'Airtel postpaid family plan'],
        ['title' => 'Uber Commute to Client Office', 'amount_minor' => 48000, 'type' => 'expense', 'category' => 'Transportation', 'date' => '2026-11-03 16:20:00', 'pm' => 'upi', 'notes' => 'Cab fare'],
    ];

    $txInsert = $db->prepare('INSERT INTO transactions (user_id, title, amount_minor, type, category, date, payment_method, notes) VALUES (:user_id, :title, :amount_minor, :type, :category, :date, :pm, :notes)');
    foreach ($transactions as $t) {
        $txInsert->execute([
            'user_id' => $userId,
            'title' => $t['title'],
            'amount_minor' => $t['amount_minor'],
            'type' => $t['type'],
            'category' => $t['category'],
            'date' => $t['date'],
            'pm' => $t['pm'],
            'notes' => $t['notes'],
        ]);
    }
    echo "Inserted " . count($transactions) . " transactions for Jeet in MySQL\n";

    // 5. Insert Budgets for Current Month (November 2026)
    $budgets = [
        ['category' => 'Food & Dining', 'amount_minor' => 1500000, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-30 23:59:59'],
        ['category' => 'Bills & Utilities', 'amount_minor' => 2200000, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-30 23:59:59'],
        ['category' => 'Transportation', 'amount_minor' => 600000, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-30 23:59:59'],
        ['category' => 'Shopping', 'amount_minor' => 1000000, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-30 23:59:59'],
        ['category' => 'Entertainment', 'amount_minor' => 400000, 'start' => '2026-11-01 00:00:00', 'end' => '2026-11-30 23:59:59'],
    ];

    $bgInsert = $db->prepare('INSERT INTO budgets (user_id, category, amount_minor, period, start_date, end_date) VALUES (:user_id, :category, :amount_minor, "monthly", :start, :end)');
    foreach ($budgets as $b) {
        $bgInsert->execute([
            'user_id' => $userId,
            'category' => $b['category'],
            'amount_minor' => $b['amount_minor'],
            'start' => $b['start'],
            'end' => $b['end'],
        ]);
    }
    echo "Inserted " . count($budgets) . " budgets for Jeet in MySQL\n";

    // 6. Insert Savings Goals & Contributions
    $goals = [
        [
            'title' => 'Emergency Rainy Day Fund',
            'target' => 15000000,
            'current' => 9500000,
            'target_date' => '2027-03-31 00:00:00',
            'color' => '#10b981',
            'icon' => 'shield',
            'contributions' => [
                ['amount' => 4000000, 'date' => '2026-09-03 10:00:00', 'notes' => 'Initial emergency fund transfer'],
                ['amount' => 3000000, 'date' => '2026-10-05 10:00:00', 'notes' => 'October savings contribution'],
                ['amount' => 2500000, 'date' => '2026-11-02 10:00:00', 'notes' => 'November salary savings'],
            ]
        ],
        [
            'title' => 'MacBook Pro M3 Max',
            'target' => 18000000,
            'current' => 12000000,
            'target_date' => '2027-01-15 00:00:00',
            'color' => '#6366f1',
            'icon' => 'laptop',
            'contributions' => [
                ['amount' => 5000000, 'date' => '2026-09-19 16:00:00', 'notes' => 'Freelance project 1 savings'],
                ['amount' => 4000000, 'date' => '2026-10-16 18:00:00', 'notes' => 'Consulting gig allocation'],
                ['amount' => 3000000, 'date' => '2026-11-02 17:00:00', 'notes' => 'Code review earnings allocation'],
            ]
        ],
        [
            'title' => 'Goa Holiday with Family',
            'target' => 4500000,
            'current' => 3500000,
            'target_date' => '2026-12-25 00:00:00',
            'color' => '#f59e0b',
            'icon' => 'plane',
            'contributions' => [
                ['amount' => 2000000, 'date' => '2026-09-28 12:00:00', 'notes' => 'Advance hotel booking fund'],
                ['amount' => 1500000, 'date' => '2026-10-29 14:00:00', 'notes' => 'Flight ticket savings'],
            ]
        ],
        [
            'title' => 'New Electric Scooter',
            'target' => 12000000,
            'current' => 4500000,
            'target_date' => '2027-06-30 00:00:00',
            'color' => '#06b6d4',
            'icon' => 'car',
            'contributions' => [
                ['amount' => 2500000, 'date' => '2026-09-15 11:00:00', 'notes' => 'Initial vehicle deposit'],
                ['amount' => 2000000, 'date' => '2026-10-20 11:00:00', 'notes' => 'Monthly scooter fund installment'],
            ]
        ],
    ];

    $glInsert = $db->prepare('INSERT INTO savings_goals (user_id, title, target_amount_minor, current_amount_minor, target_date, status, color, icon) VALUES (:user_id, :title, :target, :current, :target_date, "active", :color, :icon)');
    $cbInsert = $db->prepare('INSERT INTO goal_contributions (goal_id, user_id, amount_minor, type, notes, date) VALUES (:goal_id, :user_id, :amount, "contribution", :notes, :date)');

    foreach ($goals as $g) {
        $glInsert->execute([
            'user_id' => $userId,
            'title' => $g['title'],
            'target' => $g['target'],
            'current' => $g['current'],
            'target_date' => $g['target_date'],
            'color' => $g['color'],
            'icon' => $g['icon'],
        ]);
        $goalId = (int)$db->lastInsertId();

        foreach ($g['contributions'] as $cb) {
            $cbInsert->execute([
                'goal_id' => $goalId,
                'user_id' => $userId,
                'amount' => $cb['amount'],
                'notes' => $cb['notes'],
                'date' => $cb['date'],
            ]);
        }
    }
    echo "Inserted " . count($goals) . " savings goals with contribution records in MySQL\n";

    echo "\n======================================================\n";
    echo "JEET PATEL ACCOUNT SEED SUMMARY (MySQL):\n";
    echo "  Email:        jeet@gmail.com\n";
    echo "  Transactions: " . count($transactions) . "\n";
    echo "  Budgets:      " . count($budgets) . "\n";
    echo "  Goals:        " . count($goals) . "\n";
    echo "======================================================\n\n";

} catch (Throwable $e) {
    echo "Seed Error: " . $e->getMessage() . "\n";
    exit(1);
}

