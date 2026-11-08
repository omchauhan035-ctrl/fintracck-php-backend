-- ==========================================================
-- Dummy Seed Data for Finance Tracker (MySQL / XAMPP)
-- Inserts realistic transactions, budgets, and savings goals
-- ==========================================================

USE `finance_tracker`;

-- Helper procedure to seed data for all registered users
DELIMITER $$

DROP PROCEDURE IF EXISTS SeedUserData$$
CREATE PROCEDURE SeedUserData(IN target_user_id INT)
BEGIN
    -- 1. Budgets for Current Month (November 2026)
    DELETE FROM budgets WHERE user_id = target_user_id;

    INSERT INTO budgets (user_id, category, amount_minor, period, start_date, end_date) VALUES
    (target_user_id, 'Food & Dining', 2500000, 'monthly', '2026-11-01 00:00:00', '2026-11-30 23:59:59'),
    (target_user_id, 'Transportation', 1000000, 'monthly', '2026-11-01 00:00:00', '2026-11-30 23:59:59'),
    (target_user_id, 'Shopping', 1500000, 'monthly', '2026-11-01 00:00:00', '2026-11-30 23:59:59'),
    (target_user_id, 'Bills & Utilities', 1200000, 'monthly', '2026-11-01 00:00:00', '2026-11-30 23:59:59'),
    (target_user_id, 'Entertainment', 800000, 'monthly', '2026-11-01 00:00:00', '2026-11-30 23:59:59');

    -- 2. Savings Goals
    DELETE FROM goal_contributions WHERE user_id = target_user_id;
    DELETE FROM savings_goals WHERE user_id = target_user_id;

    INSERT INTO savings_goals (id, user_id, title, target_amount_minor, current_amount_minor, target_date, status, color, icon) VALUES
    (target_user_id * 100 + 1, target_user_id, 'Emergency Fund', 15000000, 10500000, '2026-12-31 00:00:00', 'active', '#10b981', 'shield'),
    (target_user_id * 100 + 2, target_user_id, 'New MacBook Pro', 22000000, 16000000, '2027-03-31 00:00:00', 'active', '#6366f1', 'laptop'),
    (target_user_id * 100 + 3, target_user_id, 'Goa Holiday Trip', 4500000, 4500000, '2026-11-25 00:00:00', 'completed', '#f59e0b', 'plane');

    INSERT INTO goal_contributions (user_id, goal_id, amount_minor, type, notes, date) VALUES
    (target_user_id, target_user_id * 100 + 1, 5000000, 'contribution', 'Initial emergency fund allocation', '2026-08-10 10:00:00'),
    (target_user_id, target_user_id * 100 + 1, 3000000, 'contribution', 'Monthly savings addition', '2026-09-12 11:30:00'),
    (target_user_id, target_user_id * 100 + 1, 2500000, 'contribution', 'October savings boost', '2026-10-15 14:00:00'),
    (target_user_id, target_user_id * 100 + 2, 8000000, 'contribution', 'Freelance gig payout savings', '2026-09-20 16:45:00'),
    (target_user_id, target_user_id * 100 + 2, 8000000, 'contribution', 'Diwali bonus contribution', '2026-10-28 12:00:00'),
    (target_user_id, target_user_id * 100 + 3, 2500000, 'contribution', 'Flight booking fund', '2026-10-05 09:15:00'),
    (target_user_id, target_user_id * 100 + 3, 2000000, 'contribution', 'Resort advance savings', '2026-10-25 18:20:00');

    -- 3. Transactions across multiple months (June - November 2026)
    DELETE FROM transactions WHERE user_id = target_user_id;

    INSERT INTO transactions (user_id, title, amount_minor, type, category, date, payment_method, notes, tags) VALUES
    -- November 2026 (Current Month)
    (target_user_id, 'Monthly Salary Credit', 8500000, 'income', 'Salary', '2026-11-01 09:30:00', 'bank_transfer', 'Base salary for November', '["salary","corporate"]'),
    (target_user_id, 'Gourmet Dinner & Drinks', 385000, 'expense', 'Food & Dining', '2026-11-01 20:15:00', 'credit_card', 'Celebration with friends', '["dinner","weekend"]'),
    (target_user_id, 'Apartment Maintenance & Electricity', 640000, 'expense', 'Bills & Utilities', '2026-11-02 11:00:00', 'upi', 'Society and power bill payment', '["utilities","home"]'),
    (target_user_id, 'Weekly Supermarket Grocery', 520000, 'expense', 'Food & Dining', '2026-11-02 17:45:00', 'upi', 'Vegetables, fruits and dairy', '["groceries"]'),
    (target_user_id, 'Metro Smart Card Recharge', 100000, 'expense', 'Transportation', '2026-11-02 08:30:00', 'wallet', 'Monthly transit pass', '["commute"]'),

    -- October 2026
    (target_user_id, 'Monthly Salary Credit', 8500000, 'income', 'Salary', '2026-10-01 09:30:00', 'bank_transfer', 'October salary', '["salary"]'),
    (target_user_id, 'UI/UX Design Consultation', 2500000, 'income', 'Freelance', '2026-10-18 15:00:00', 'bank_transfer', 'Client website redesign milestone', '["client","freelance"]'),
    (target_user_id, 'Stock Dividend Payout', 650000, 'income', 'Investments', '2026-10-24 10:15:00', 'bank_transfer', 'Quarterly index fund dividend', '["dividend","passive"]'),
    (target_user_id, 'Whole Foods & Grocery Run', 1420000, 'expense', 'Food & Dining', '2026-10-08 19:00:00', 'debit_card', 'Monthly household food supplies', '["groceries"]'),
    (target_user_id, 'Fiber Broadband & Mobile Bill', 320000, 'expense', 'Bills & Utilities', '2026-10-05 12:00:00', 'upi', 'Internet and phone plans', '["internet"]'),
    (target_user_id, 'Festive Shopping & Clothes', 980000, 'expense', 'Shopping', '2026-10-22 16:30:00', 'credit_card', 'New festival attire and gifts', '["shopping","clothes"]'),
    (target_user_id, 'IMAX Movie & Dinner', 215000, 'expense', 'Entertainment', '2026-10-15 21:00:00', 'upi', 'Weekend movie outing', '["cinema"]'),
    (target_user_id, 'Fuel & Car Service', 450000, 'expense', 'Transportation', '2026-10-12 14:20:00', 'credit_card', 'Full tank petrol & inspection', '["car","fuel"]'),
    (target_user_id, 'Dental Cleaning & Checkup', 250000, 'expense', 'Healthcare', '2026-10-29 11:00:00', 'upi', 'Bi-annual checkup', '["health"]'),

    -- September 2026
    (target_user_id, 'Monthly Salary Credit', 8500000, 'income', 'Salary', '2026-09-01 09:30:00', 'bank_transfer', 'September salary', '["salary"]'),
    (target_user_id, 'Mobile App Dev Project', 3200000, 'income', 'Freelance', '2026-09-22 17:00:00', 'bank_transfer', 'React Native MVP delivery', '["freelance"]'),
    (target_user_id, 'Groceries & Provisions', 1350000, 'expense', 'Food & Dining', '2026-09-09 18:00:00', 'upi', 'Monthly grocery restocking', '["groceries"]'),
    (target_user_id, 'Electricity & Water Bill', 410000, 'expense', 'Bills & Utilities', '2026-09-06 10:45:00', 'upi', 'Utility bill', '["bills"]'),
    (target_user_id, 'Cab Rides & Uber', 310000, 'expense', 'Transportation', '2026-09-18 22:15:00', 'wallet', 'Office commute cabs', '["uber"]'),
    (target_user_id, 'Online Course: Advanced Fullstack', 499900, 'expense', 'Education', '2026-09-14 16:00:00', 'credit_card', 'Skill certification program', '["learning"]'),
    (target_user_id, 'Nike Running Shoes', 680000, 'expense', 'Shopping', '2026-09-25 15:30:00', 'credit_card', 'Athletic gear replacement', '["sports"]'),

    -- August 2026
    (target_user_id, 'Monthly Salary Credit', 8500000, 'income', 'Salary', '2026-08-01 09:30:00', 'bank_transfer', 'August salary', '["salary"]'),
    (target_user_id, 'Mutual Fund Profit Booking', 1500000, 'income', 'Investments', '2026-08-16 11:30:00', 'bank_transfer', 'Partial profit booking in midcap', '["stocks"]'),
    (target_user_id, 'Cafes & Dining Out', 780000, 'expense', 'Food & Dining', '2026-08-11 20:30:00', 'upi', 'Evening coffee and dinners', '["dining"]'),
    (target_user_id, 'Monthly Groceries', 1280000, 'expense', 'Food & Dining', '2026-08-07 17:30:00', 'debit_card', 'Supermarket bill', '["food"]'),
    (target_user_id, 'Noise Cancelling Headphones', 899000, 'expense', 'Shopping', '2026-08-19 14:00:00', 'credit_card', 'Work from home equipment', '["electronics"]'),
    (target_user_id, 'Gas & Home Electricity', 390000, 'expense', 'Bills & Utilities', '2026-08-04 10:15:00', 'upi', 'Power bills', '["bills"]'),
    (target_user_id, 'Streaming Services (Netflix & Spotify)', 119900, 'expense', 'Entertainment', '2026-08-15 12:00:00', 'credit_card', 'Digital subscriptions', '["subscriptions"]'),

    -- July 2026
    (target_user_id, 'Monthly Salary Credit', 8200000, 'income', 'Salary', '2026-07-01 09:30:00', 'bank_transfer', 'July salary credit', '["salary"]'),
    (target_user_id, 'Freelance Consulting Hour Pack', 1800000, 'income', 'Freelance', '2026-07-20 18:00:00', 'bank_transfer', 'Architecture advisory call', '["freelance"]'),
    (target_user_id, 'Groceries & Farmers Market', 1190000, 'expense', 'Food & Dining', '2026-07-10 16:30:00', 'upi', 'Organic vegetables and staples', '["groceries"]'),
    (target_user_id, 'Summer Concert Tickets', 450000, 'expense', 'Entertainment', '2026-07-18 21:00:00', 'credit_card', 'Live music event', '["music"]'),
    (target_user_id, 'Routine Health Lab Tests', 340000, 'expense', 'Healthcare', '2026-07-26 09:00:00', 'upi', 'Annual health screening', '["health"]'),

    -- June 2026
    (target_user_id, 'Monthly Salary Credit', 8200000, 'income', 'Salary', '2026-06-01 09:30:00', 'bank_transfer', 'June salary credit', '["salary"]'),
    (target_user_id, 'Annual Performance Bonus', 4500000, 'income', 'Salary', '2026-06-15 12:00:00', 'bank_transfer', 'Yearly review performance reward', '["bonus"]'),
    (target_user_id, 'Groceries & Household Supplies', 1240000, 'expense', 'Food & Dining', '2026-06-08 17:00:00', 'upi', 'General store shopping', '["groceries"]'),
    (target_user_id, 'Air Conditioner Service & Repair', 280000, 'expense', 'Bills & Utilities', '2026-06-12 11:30:00', 'cash', 'Pre-summer maintenance', '["home"]'),
    (target_user_id, 'Weekend Road Trip Fuel & Tolls', 420000, 'expense', 'Transportation', '2026-06-21 19:30:00', 'wallet', 'Highway tolls & fuel', '["trip"]');

END$$

DELIMITER ;

-- Execute procedure for User 1 (demo@example.com) and User 2 (abc@gmail.com)
CALL SeedUserData(1);
CALL SeedUserData(2);
