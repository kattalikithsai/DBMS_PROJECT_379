# Public Grievance Registration and Resolution System
### Database Management Systems (DBMS) Course Project

**Student:** KATTA LIKITH SAI  
**Roll Number:** 251FA18379  
**Serial Number:** 41  
**Project Folder:** `DBMS-379`  

---

## 🚀 Quick Start Instructions

You can run this project instantly with zero external package installation (`node_modules` or `npm install` are **not** needed because the server utilizes Node.js v24's native `node:sqlite` and native `node:http` modules).

### Option 1: Double-Click (Windows)
Double-click **`run_project.bat`** in this folder.  
It will automatically start the server and open `http://localhost:3000` in your default browser.

### Option 2: Terminal / Command Line
```powershell
node server.js
```
Then open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Repository Structure

```
DBMS-379/
│
├── database/
│   ├── schema.sql            # Complete DDL script (tables, keys, checks, triggers, views, indexes)
│   ├── seed_data.sql          # Realistic DML dataset (departments, categories, citizens, officers, grievances, timeline, feedback)
│   ├── queries.sql            # 15+ Advanced DBMS queries (Joins, Aggregations, Having, Subqueries, CTEs, Window Functions)
│   └── grievance.db           # Pre-compiled active SQLite database
│
├── public/
│   ├── index.html             # Single Page Application (Dashboard, Citizen Form, Tracker, Officer Console, SQL Viva)
│   ├── styles.css             # Modern government-tech responsive styling
│   └── app.js                 # Frontend application logic, Chart.js integrations & API handlers
│
├── server.js                  # Full-stack Node.js server with REST API & interactive SQL engine
├── run_project.bat            # One-click Windows launch script
├── PROJECT_REPORT.md          # 12-section university-grade academic project report
├── VIVA_QUESTIONS_AND_ANSWERS.md # 16 comprehensive examiner Q&A for DBMS viva examination
└── README.md                  # This file
```

---

## 🌟 Key Features

1. **Dashboard & Analytics:** Real-time KPI summary cards, departmental resolution velocity bar charts, and category breakdown charts.
2. **Citizen Services:** Form to lodge grievances with auto-calculated SLA deadlines based on selected category, plus citizen history.
3. **Live Grievance Tracker:** Visual timeline stepper displaying all state transitions, officer notes, and citizen star ratings.
4. **Officer Console:** Manage assigned grievances, update statuses, submit Action Taken Reports (ATR), and escalate overdue issues.
5. **Interactive SQL Viva Console:** Built-in SQL test environment where examiners can execute pre-loaded DBMS queries or custom ANSI SQL `SELECT` statements against `grievance.db` with live tabular results and execution timing.
6. **ER Model & Normalization Documentation:** Detailed breakdown of entities, cardinalities, 1NF -> 3NF / BCNF proofs, and data dictionary.

---

## 🎓 Academic Candidate Details
- **Candidate Name:** KATTA LIKITH SAI
- **Roll Number:** 251FA18379
- **Serial Number:** 41
- **Course:** Database Management Systems (DBMS Lab)
- **Database Engine:** SQLite 3.50+ (ANSI SQL Compliant)
