# 🚀 AptiLab Setup Guide - Complete Instructions

## 📋 STEP 1: Install Required Software

### 1.1 Install Node.js
1. Go to https://nodejs.org/
2. Download and install the LTS version (recommended)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 1.2 Install MySQL
1. Download MySQL from: https://dev.mysql.com/downloads/mysql/
2. Install and remember your root password
3. Start MySQL server

## 🗄️ STEP 2: Setup MySQL Database

### 2.1 Open MySQL Command Line or MySQL Workbench

### 2.2 Run the Database Setup Script
```sql
-- Run this in MySQL:
CREATE DATABASE IF NOT EXISTS aptitude_db;
USE aptitude_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_results table
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

-- Insert a test user (optional)
INSERT INTO users (name, email, password) VALUES 
('Test User', 'test@aptilab.com', 'password123');
```

### 2.3 Verify Tables Were Created
```sql
SHOW TABLES;
SELECT * FROM users;
```

## 🔑 STEP 3: Get Your Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated key
4. Keep it safe - you'll need it in the next step

## ⚙️ STEP 4: Configure the Backend

### 4.1 Create .env File
In your project folder, create a file named `.env` (no file extension)

Add this content (replace with your actual values):
```env
# Gemini API Key (from Step 3)
GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=aptitude_db

# Server Port
PORT=3000
```

### 4.2 Important Notes:
- Replace `YOUR_ACTUAL_GEMINI_API_KEY_HERE` with your actual Gemini API key
- Replace `your_mysql_password` with your MySQL root password
- **NEVER commit the .env file to Git or share it publicly**

## 📦 STEP 5: Install Dependencies

Open terminal/command prompt in your project folder and run:

```bash
npm install
```

This will install:
- express (web server)
- mysql2 (database connection)
- @google/generative-ai (Gemini AI)
- cors (cross-origin requests)
- dotenv (environment variables)

## 🚀 STEP 6: Start the Backend Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   🚀 AptiLab Server Running!          ║
║                                        ║
║   📍 Port: 3000                        ║
║   🌐 URL: http://localhost:3000       ║
║   📊 Database: MySQL                   ║
║   🤖 AI: Gemini 1.5 Flash             ║
╚════════════════════════════════════════╝
✅ Database connected successfully
```

## 🌐 STEP 7: Test the Application

### 7.1 Test API Health
Open your browser and visit:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "running",
  "database": "connected",
  "gemini": "configured"
}
```

### 7.2 Test the Frontend
Open `login.html` in your browser
- You can either:
  - Double-click the `login.html` file, OR
  - Visit `http://localhost:3000/login.html` (if running through server)

### 7.3 Login with Test User
- Email: `test@aptilab.com`
- Password: `password123`

## 🔄 WORKFLOW EXPLANATION

Here's how your application works:

1. **Login** → User enters credentials
   - Frontend sends POST to `/api/login`
   - Backend checks MySQL `users` table
   - Returns user data if valid

2. **Dashboard** → User sees their dashboard
   - Displays user name from localStorage
   - Shows topic selection

3. **Start Test** → User clicks "Start Test"
   - Frontend sends GET to `/api/questions?topic=Maths&count=10`
   - Backend calls Gemini API
   - Gemini generates 10 unique questions
   - Frontend displays questions with timer

4. **Submit Test** → User submits answers
   - Frontend calculates score
   - Sends POST to `/api/submit-test` with results
   - Backend saves to MySQL `test_results` table

5. **Results Page** → Shows score
   - Data retrieved from sessionStorage
   - Can send email with results

6. **Logout** → User logs out
   - Clears localStorage
   - Redirects to login

## 🐛 TROUBLESHOOTING

### Problem: "Cannot connect to server"
**Solution:** 
- Make sure backend is running (`npm start`)
- Check if port 3000 is available
- Verify .env file is configured correctly

### Problem: "Database connection failed"
**Solution:**
- Verify MySQL is running
- Check DB_USER and DB_PASS in .env file
- Ensure database `aptitude_db` exists

### Problem: "AI Error" or no questions generated
**Solution:**
- Verify GEMINI_API_KEY in .env file
- Check if key is valid at https://aistudio.google.com/app/apikey
- Look at server logs for detailed error

### Problem: "Invalid credentials" on login
**Solution:**
- Make sure you ran the database setup script
- Verify test user exists:
  ```sql
  SELECT * FROM users WHERE email = 'test@aptilab.com';
  ```

## 📊 TESTING THE DATABASE

### View all test results:
```sql
SELECT * FROM test_results;
```

### View results for specific user:
```sql
SELECT * FROM test_results WHERE user_email = 'test@aptilab.com';
```

### Get average scores by topic:
```sql
SELECT topic, AVG(percentage) as avg_score 
FROM test_results 
GROUP BY topic;
```

## 🎉 SUCCESS CHECKLIST

- [ ] Node.js installed
- [ ] MySQL installed and running
- [ ] Database `aptitude_db` created
- [ ] Tables `users` and `test_results` created
- [ ] Gemini API key obtained
- [ ] .env file configured
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server running (`npm start`)
- [ ] Can access http://localhost:3000/api/health
- [ ] Can login with test@aptilab.com
- [ ] Can generate questions and take test
- [ ] Test results saved to database

## 💡 NEXT STEPS

1. **Add More Users**: Register new users through the registration form
2. **Try Different Topics**: Select different subjects on the dashboard
3. **View Results**: Check your scores in the results table
4. **Customize Questions**: The Gemini API generates unique questions each time

## 🔒 SECURITY REMINDER

- Never commit your `.env` file to Git
- Never share your Gemini API key
- In production, hash passwords using bcrypt
- Use HTTPS in production
- Add rate limiting to prevent abuse

## 📞 NEED HELP?

If you encounter any issues:
1. Check the server console logs for error messages
2. Verify all installation steps were completed
3. Ensure all files are in the correct location
4. Test the database connection separately

---

**Congratulations! Your AI-powered aptitude platform is now ready! 🎉**
