<?php
// database/seed_admin.php

require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getConnection();

    // Ensure columns exist
    try {
        $cols = $db->query("SHOW COLUMNS FROM users LIKE 'role'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE users ADD COLUMN `role` ENUM('user', 'admin') DEFAULT 'user' AFTER theme");
        }
        $colsStatus = $db->query("SHOW COLUMNS FROM users LIKE 'status'")->fetchAll();
        if (empty($colsStatus)) {
            $db->exec("ALTER TABLE users ADD COLUMN `status` ENUM('active', 'blocked') DEFAULT 'active' AFTER role");
        }
    } catch (Throwable $e) {
        echo "Column check warning: " . $e->getMessage() . "\n";
    }

    $omEmail = 'om40@gmail.com';
    $omPassword = 'om@123';
    $omHash = password_hash($omPassword, PASSWORD_BCRYPT);

    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $omEmail]);
    $existing = $stmt->fetch();

    if ($existing) {
        $update = $db->prepare('UPDATE users SET role = "admin", status = "active", password_hash = :hash WHERE id = :id');
        $update->execute(['hash' => $omHash, 'id' => $existing['id']]);
        echo "Updated administrator account: {$omEmail} (Role: admin, Password: {$omPassword})\n";
    } else {
        $insert = $db->prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES ("Om Chauhan", :email, :hash, "admin", "active")');
        $insert->execute(['email' => $omEmail, 'hash' => $omHash]);
        echo "Created administrator account: {$omEmail} (Role: admin, Password: {$omPassword})\n";
    }

    // Secondary Admin User: admin@fintrack.com
    $adminEmail = 'admin@fintrack.com';
    $aStmt = $db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $aStmt->execute(['email' => $adminEmail]);
    $aExisting = $aStmt->fetch();
    if ($aExisting) {
        $aUpdate = $db->prepare('UPDATE users SET role = "admin", status = "active" WHERE id = :id');
        $aUpdate->execute(['id' => $aExisting['id']]);
        echo "Ensured admin role for: {$adminEmail}\n";
    }

    echo "Admin seed completed successfully!\n";
} catch (Throwable $e) {
    echo "Seed Error: " . $e->getMessage() . "\n";
}

