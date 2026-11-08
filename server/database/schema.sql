-- =======================================================
-- Personal Finance Tracker - MySQL Database Schema
-- Compatible with XAMPP (MariaDB / MySQL 5.7+ / 8.0+)
-- =======================================================

CREATE DATABASE IF NOT EXISTS `finance_tracker` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `finance_tracker`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `preferred_currency` VARCHAR(10) DEFAULT 'INR',
  `theme` ENUM('light', 'dark') DEFAULT 'light',
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `status` ENUM('active', 'blocked') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income', 'expense', 'both') NOT NULL,
  `color` VARCHAR(20) DEFAULT '#6366f1',
  `icon` VARCHAR(50) DEFAULT 'tag',
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `amount_minor` BIGINT NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `date` DATETIME NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'cash',
  `notes` TEXT NULL,
  `tags` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tx_user_date` (`user_id`, `date`),
  INDEX `idx_tx_user_type_date` (`user_id`, `type`, `date`),
  INDEX `idx_tx_user_cat` (`user_id`, `category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount_minor` BIGINT NOT NULL,
  `period` VARCHAR(20) DEFAULT 'monthly',
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_budget_user_cat` (`user_id`, `category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Savings Goals Table
CREATE TABLE IF NOT EXISTS `savings_goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `target_amount_minor` BIGINT NOT NULL,
  `current_amount_minor` BIGINT DEFAULT 0,
  `target_date` DATETIME NULL,
  `status` ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  `color` VARCHAR(20) DEFAULT '#6366f1',
  `icon` VARCHAR(50) DEFAULT 'target',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Goal Contributions Table
CREATE TABLE IF NOT EXISTS `goal_contributions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `goal_id` INT NOT NULL,
  `amount_minor` BIGINT NOT NULL,
  `type` ENUM('contribution', 'withdrawal') DEFAULT 'contribution',
  `notes` TEXT NULL,
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`goal_id`) REFERENCES `savings_goals`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
