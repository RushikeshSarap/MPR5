-- MySQL schema for chat and knowledge
CREATE DATABASE IF NOT EXISTS admission_chatbot CHARACTER
SET
    utf8mb4 COLLATE utf8mb4_unicode_ci;

USE admission_chatbot;

CREATE TABLE
    IF NOT EXISTS chat_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME NULL
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS chat_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(64),
        user_message TEXT,
        bot_response TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (session_id)
    ) ENGINE = InnoDB;

CREATE TABLE
    IF NOT EXISTS knowledge_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        content LONGTEXT,
        category VARCHAR(100),
        source VARCHAR(255),
        vector_id VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB;