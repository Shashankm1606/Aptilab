# AptiLab - AI-Powered Aptitude Testing Platform

AptiLab is a web app for running aptitude tests with AI-generated questions, user authentication, and result tracking.

## Features
- User registration and login
- Topic-based aptitude tests
- AI-generated questions via Gemini
- Result storage in MySQL
- Admin results endpoint

## Prerequisites
- Node.js 18+ recommended
- MySQL 8+

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Create the database and schema:
```sql
CREATE DATABASE aptitude_db;
USE aptitude_db;

-- Run the contents of backend/database_setup.sql
```

3. Create a `.env` file in `backend/`:
```env
GEMINI_API_KEY=your_gemini_key_here
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=aptitude_db
PORT=3000
```

4. Start the server:
```bash
npm start
```

5. Open the frontend:
Open `frontend/login.html` in your browser.

## Project Structure
```
backend/
  server.js
  database_setup.sql
  package.json
frontend/
  login.html
  dashboard.html
  test.html
  result.html
frontend js/
  login.js
  dashboard.js
  test.js
  result.js
frontend css/
  login.css
  dashboard.css
  test.css
  result.css
```

## API Endpoints
- `POST /api/register`
- `POST /api/login`
- `GET /api/questions`
- `POST /api/submit-test`
- `GET /api/user-results/:email`
- `GET /api/admin/results`

## Notes
- Do not commit `backend/.env`.
- `node_modules/` is ignored in this repo.

## Troubleshooting
- If the server won’t start, check that port 3000 is free.
- If DB connection fails, confirm MySQL is running and `.env` values are correct.
- If no questions are generated, verify `GEMINI_API_KEY`.
