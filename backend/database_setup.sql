-- ===========================
-- APTILAB DATABASE SETUP
-- ===========================

-- Create database
CREATE DATABASE IF NOT EXISTS aptitude_db;
USE aptitude_db;

-- ===========================
-- TABLE 1: USERS
-- ===========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- TABLE 2: TEST RESULTS
-- ===========================
CREATE TABLE IF NOT EXISTS test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    percentage DECIMAL(5,2),
    topic VARCHAR(100),
    time_spent INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- ===========================
-- TABLE 3: QUESTION BANK
-- ===========================
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_questions_topic (topic)
);

-- ===========================
-- TABLE 4: QUESTION USAGE (per user + topic)
-- ===========================
CREATE TABLE IF NOT EXISTS question_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    question_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_topic_question (user_email, topic, question_id),
    INDEX idx_usage_user_topic (user_email, topic),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ===========================
-- SAMPLE DATA (Optional)
-- ===========================
-- Insert a test user
INSERT INTO users (name, email, password) VALUES 
('Test lowdi', 'terimakichut@aptilab.com', 'password123');

-- ===========================
-- USEFUL QUERIES
-- ===========================

-- View all users
-- SELECT * FROM users;

-- View all test results
-- SELECT * FROM test_results;

-- View results for a specific user
-- SELECT * FROM test_results WHERE user_email = 'test@aptilab.com';

-- Get average score by topic
-- SELECT topic, AVG(percentage) as avg_score 
-- FROM test_results 
-- GROUP BY topic;

-- Get user statistics
-- SELECT 
--     user_email,
--     COUNT(*) as total_tests,
--     AVG(percentage) as avg_score,
--     MAX(percentage) as best_score
-- FROM test_results
-- GROUP BY user_email;
