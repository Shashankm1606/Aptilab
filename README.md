# 🎯 AptiLab - AI-Powered Aptitude Testing Platform

## ⚡ Quick Start (3 Steps)

### 1️⃣ Setup Database
```sql
-- Run in MySQL:
CREATE DATABASE aptitude_db;
USE aptitude_db;

-- Copy and run the contents of database_setup.sql
```

### 2️⃣ Configure Environment
```bash
# Create .env file with:
GEMINI_API_KEY=your_gemini_key_here
DB_PASS=your_mysql_password
```

### 3️⃣ Start Server
```bash
npm install
npm start
```

Then open `login.html` in your browser!

---

## 📁 File Structure

```
your-project/
├── server.js                    # ✅ Backend server (USE THIS)
├── package.json                 # ✅ Dependencies list
├── .env                         # ✅ Your API keys (CREATE THIS)
├── database_setup.sql           # ✅ Database schema
│
├── login.html                   # Frontend pages
├── dashboard.html
├── test.html
├── result.html
│
├── login_updated.js             # ✅ Updated JS with API integration
├── test_js_database_update.js   # ✅ Add this to your test.js
├── result_js_update.js          # ✅ Add this to your result.js
│
└── [your existing CSS/JS files]
```

## 🔧 Integration Steps

### Step 1: Use the updated login.js
Replace your `login.js` content with `login_updated.js`

### Step 2: Update test.js
Add the code from `test_js_database_update.js` to your `test.js`
(Replace the submitTest and prepareResultsData functions)

### Step 3: Update result.js
Add the code from `result_js_update.js` to the top of your `result.js`

## 🎯 What's Been Added

✅ **Backend Server** (`server.js`)
- Express.js server
- MySQL database connection
- Gemini AI integration
- All API routes configured

✅ **API Endpoints**
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/questions` - AI-generated questions
- `POST /api/submit-test` - Save results to database
- `GET /api/user-results/:email` - Get user's past results
- `GET /api/admin/results` - Admin dashboard

✅ **Database Integration**
- User authentication from MySQL
- Test results saved to database
- Persistent data storage

✅ **AI Integration**
- Dynamic question generation with Gemini
- Topic-based questions
- Unique questions every time

## 🚦 Testing Your Setup

### 1. Test Backend Health
Visit: `http://localhost:3000/api/health`

Expected response:
```json
{
  "status": "running",
  "database": "connected",
  "gemini": "configured"
}
```

### 2. Test Login
- Email: `test@aptilab.com`
- Password: `password123`

### 3. Test Question Generation
- Select a topic on dashboard
- Click "Start Test"
- Questions should load from Gemini AI

### 4. Check Database
```sql
-- View saved results:
SELECT * FROM test_results ORDER BY created_at DESC LIMIT 5;
```

## 🎨 NO CHANGES TO YOUR DESIGN

✅ All your HTML structure stays the same
✅ All your CSS styling is preserved
✅ All animations and effects remain
✅ Only JavaScript functionality enhanced

## 📊 Flow Diagram

```
User Login
    ↓
[MySQL Authentication]
    ↓
Dashboard
    ↓
Select Topic → Start Test
    ↓
[Gemini API generates questions]
    ↓
User Takes Test (Timer running)
    ↓
Submit Answers
    ↓
[Calculate Score + Save to MySQL]
    ↓
Results Page
    ↓
[Optional: Email results]
    ↓
Logout
```

## 🆘 Common Issues

### "Cannot connect to server"
- Run `npm start` first
- Check if port 3000 is free

### "Database connection failed"
- Verify MySQL is running
- Check .env credentials

### "Invalid credentials"
- Ensure test user exists in database
- Run database_setup.sql script

### "No questions generated"
- Verify Gemini API key in .env
- Check server console for errors

## 📝 Environment Variables Explained

```env
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Your MySQL configuration
DB_HOST=localhost        # Usually localhost
DB_USER=root            # Your MySQL username
DB_PASS=your_password   # Your MySQL password
DB_NAME=aptitude_db     # Database name (from SQL script)

# Server port (default 3000)
PORT=3000
```

## 🎉 You're All Set!

Your AptiLab platform now has:
- ✅ Secure user authentication
- ✅ AI-powered question generation
- ✅ Real-time test taking experience
- ✅ Persistent result storage
- ✅ Beautiful, unchanged UI

**Need detailed instructions?** See `SETUP_GUIDE.md`

---

Made with ❤️ for AptiLab
