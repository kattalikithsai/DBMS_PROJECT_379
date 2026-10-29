-- ====================================================================================================
-- DBMS COURSE PROJECT: PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM
-- Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41
-- Database Schema Definition (DDL)
-- ====================================================================================================

PRAGMA foreign_keys = ON;

-- Drop existing views and triggers if present
DROP VIEW IF EXISTS vw_sla_breach_summary;
DROP VIEW IF EXISTS vw_officer_workload;
DROP VIEW IF EXISTS vw_department_performance;
DROP VIEW IF EXISTS vw_active_grievance_board;

DROP TRIGGER IF EXISTS trg_grievance_after_insert;
DROP TRIGGER IF EXISTS trg_grievance_after_update_status;
DROP TRIGGER IF EXISTS trg_validate_feedback_status;

-- Drop existing tables if present (in reverse dependency order)
DROP TABLE IF EXISTS escalations;
DROP TABLE IF EXISTS grievance_feedback;
DROP TABLE IF EXISTS grievance_attachments;
DROP TABLE IF EXISTS grievance_timeline;
DROP TABLE IF EXISTS grievances;
DROP TABLE IF EXISTS officers;
DROP TABLE IF EXISTS citizens;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS departments;

-- ====================================================================================================
-- 1. DEPARTMENTS TABLE
-- Stores government / civic municipal departments handling various public grievances.
-- ====================================================================================================
CREATE TABLE departments (
    dept_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_code VARCHAR(10) NOT NULL UNIQUE,
    dept_name VARCHAR(120) NOT NULL UNIQUE,
    contact_email VARCHAR(120) NOT NULL,
    helpline_number VARCHAR(20) NOT NULL,
    head_officer_name VARCHAR(100) NOT NULL,
    sla_days_default INTEGER NOT NULL DEFAULT 7 CHECK(sla_days_default > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================================================
-- 2. CATEGORIES TABLE
-- Specific complaint categories under each department with individual SLA resolution days.
-- ====================================================================================================
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_id INTEGER NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    sla_days INTEGER NOT NULL CHECK(sla_days > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE CASCADE,
    UNIQUE (dept_id, category_name)
);

-- ====================================================================================================
-- 3. CITIZENS TABLE
-- Stores public citizen accounts submitting grievances.
-- ====================================================================================================
CREATE TABLE citizens (
    citizen_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    ward_no INTEGER NOT NULL CHECK(ward_no > 0),
    pincode VARCHAR(10) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================================================
-- 4. OFFICERS TABLE
-- Government / municipal departmental officers tasked with resolving issues.
-- Includes self-referencing supervisor_id for hierarchical administrative chains.
-- ====================================================================================================
CREATE TABLE officers (
    officer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_id INTEGER NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL,
    supervisor_id INTEGER,
    password_hash VARCHAR(255) NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES officers(officer_id) ON DELETE SET NULL
);

-- ====================================================================================================
-- 5. GRIEVANCES TABLE
-- Core entity storing public complaints lodged by citizens.
-- ====================================================================================================
CREATE TABLE grievances (
    grievance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    citizen_id INTEGER NOT NULL,
    dept_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    assigned_officer_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_address TEXT NOT NULL,
    ward_no INTEGER NOT NULL CHECK(ward_no > 0),
    pincode VARCHAR(10) NOT NULL,
    priority VARCHAR(15) NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'Assigned', 'In Progress', 'Under Review', 'Resolved', 'Rejected', 'Reopened')),
    sla_deadline DATETIME NOT NULL,
    resolved_at DATETIME,
    escalated_flag INTEGER NOT NULL DEFAULT 0 CHECK(escalated_flag IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id) ON DELETE RESTRICT,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_officer_id) REFERENCES officers(officer_id) ON DELETE SET NULL
);

-- ====================================================================================================
-- 6. GRIEVANCE_TIMELINE TABLE
-- Complete historical audit trail of each status update, remark, and action taken.
-- ====================================================================================================
CREATE TABLE grievance_timeline (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL,
    changed_by_type VARCHAR(20) NOT NULL CHECK(changed_by_type IN ('Citizen', 'Officer', 'Admin', 'System')),
    changed_by_name VARCHAR(120) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    remarks TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grievance_id) REFERENCES grievances(grievance_id) ON DELETE CASCADE
);

-- ====================================================================================================
-- 7. GRIEVANCE_ATTACHMENTS TABLE
-- Stores uploaded supporting documents / photo evidence records for complaints.
-- ====================================================================================================
CREATE TABLE grievance_attachments (
    attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INTEGER DEFAULT 128,
    file_type VARCHAR(50) DEFAULT 'image/jpeg',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grievance_id) REFERENCES grievances(grievance_id) ON DELETE CASCADE
);

-- ====================================================================================================
-- 8. GRIEVANCE_FEEDBACK TABLE
-- Citizen satisfaction ratings and comments upon grievance resolution.
-- Enforces 1 feedback per grievance via UNIQUE constraint.
-- ====================================================================================================
CREATE TABLE grievance_feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL UNIQUE,
    citizen_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    satisfaction_level VARCHAR(30) NOT NULL CHECK(satisfaction_level IN ('Highly Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Highly Dissatisfied')),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (grievance_id) REFERENCES grievances(grievance_id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id) ON DELETE RESTRICT
);

-- ====================================================================================================
-- 9. ESCALATIONS TABLE
-- Tracks grievances escalated to higher authorities due to SLA breach or citizen appeal.
-- ====================================================================================================
CREATE TABLE escalations (
    escalation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL,
    escalated_to_officer_id INTEGER NOT NULL,
    escalation_level INTEGER NOT NULL DEFAULT 1 CHECK(escalation_level BETWEEN 1 AND 3),
    escalation_reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Acknowledged', 'Closed')),
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (grievance_id) REFERENCES grievances(grievance_id) ON DELETE CASCADE,
    FOREIGN KEY (escalated_to_officer_id) REFERENCES officers(officer_id) ON DELETE RESTRICT
);

-- ====================================================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ====================================================================================================
CREATE INDEX idx_grievances_ticket ON grievances(ticket_number);
CREATE INDEX idx_grievances_citizen ON grievances(citizen_id);
CREATE INDEX idx_grievances_dept ON grievances(dept_id);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_officer ON grievances(assigned_officer_id);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_created ON grievances(created_at);
CREATE INDEX idx_timeline_grievance ON grievance_timeline(grievance_id);
CREATE INDEX idx_feedback_rating ON grievance_feedback(rating);

-- ====================================================================================================
-- DATABASE TRIGGERS
-- ====================================================================================================

-- Trigger 1: Automatically add an initial audit trail entry when a new grievance is lodged
CREATE TRIGGER trg_grievance_after_insert
AFTER INSERT ON grievances
FOR EACH ROW
BEGIN
    INSERT INTO grievance_timeline (
        grievance_id,
        changed_by_type,
        changed_by_name,
        old_status,
        new_status,
        remarks,
        timestamp
    )
    VALUES (
        NEW.grievance_id,
        'Citizen',
        (SELECT full_name FROM citizens WHERE citizen_id = NEW.citizen_id),
        NULL,
        NEW.status,
        'Grievance registered in system with ticket ' || NEW.ticket_number || '. Assigned SLA deadline: ' || NEW.sla_deadline,
        CURRENT_TIMESTAMP
    );
END;

-- Trigger 2: Automatically update updated_at timestamp and log status transitions
CREATE TRIGGER trg_grievance_after_update_status
AFTER UPDATE OF status, assigned_officer_id ON grievances
FOR EACH ROW
WHEN OLD.status <> NEW.status OR (OLD.assigned_officer_id IS NULL AND NEW.assigned_officer_id IS NOT NULL)
BEGIN
    UPDATE grievances SET updated_at = CURRENT_TIMESTAMP WHERE grievance_id = NEW.grievance_id;
END;

-- ====================================================================================================
-- DATABASE VIEWS
-- ====================================================================================================

-- View 1: Active Grievance Board (Full details of complaints for dashboard display)
CREATE VIEW vw_active_grievance_board AS
SELECT 
    g.grievance_id,
    g.ticket_number,
    g.title,
    g.priority,
    g.status,
    g.ward_no,
    g.pincode,
    g.created_at,
    g.sla_deadline,
    g.escalated_flag,
    c.full_name AS citizen_name,
    c.phone AS citizen_phone,
    d.dept_code,
    d.dept_name,
    cat.category_name,
    COALESCE(o.full_name, 'Unassigned') AS assigned_officer_name,
    COALESCE(o.designation, 'N/A') AS officer_designation,
    CASE 
        WHEN g.status = 'Resolved' THEN 'Resolved'
        WHEN datetime('now') > datetime(g.sla_deadline) THEN 'SLA Breached'
        ELSE 'Within SLA'
    END AS sla_status
FROM grievances g
JOIN citizens c ON g.citizen_id = c.citizen_id
JOIN departments d ON g.dept_id = d.dept_id
JOIN categories cat ON g.category_id = cat.category_id
LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id;

-- View 2: Department Performance Summary (Key analytics for administration)
CREATE VIEW vw_department_performance AS
SELECT 
    d.dept_id,
    d.dept_code,
    d.dept_name,
    d.head_officer_name,
    COUNT(g.grievance_id) AS total_complaints,
    SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_complaints,
    SUM(CASE WHEN g.status IN ('Submitted', 'Assigned', 'In Progress', 'Under Review', 'Reopened') THEN 1 ELSE 0 END) AS pending_complaints,
    SUM(CASE WHEN g.status <> 'Resolved' AND datetime('now') > datetime(g.sla_deadline) THEN 1 ELSE 0 END) AS overdue_complaints,
    ROUND(
        CASE 
            WHEN COUNT(g.grievance_id) > 0 
            THEN (CAST(SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(g.grievance_id)) * 100 
            ELSE 0 
        END, 2
    ) AS resolution_percentage,
    ROUND(AVG(fb.rating), 2) AS avg_citizen_rating
FROM departments d
LEFT JOIN grievances g ON d.dept_id = g.dept_id
LEFT JOIN grievance_feedback fb ON g.grievance_id = fb.grievance_id
GROUP BY d.dept_id, d.dept_code, d.dept_name, d.head_officer_name;

-- View 3: Officer Workload & Productivity View
CREATE VIEW vw_officer_workload AS
SELECT 
    o.officer_id,
    o.full_name AS officer_name,
    o.designation,
    d.dept_name,
    COUNT(g.grievance_id) AS total_assigned,
    SUM(CASE WHEN g.status IN ('Assigned', 'In Progress', 'Under Review') THEN 1 ELSE 0 END) AS active_cases,
    SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_cases,
    SUM(CASE WHEN g.status NOT IN ('Resolved', 'Rejected') AND datetime('now') > datetime(g.sla_deadline) THEN 1 ELSE 0 END) AS sla_breached_cases
FROM officers o
JOIN departments d ON o.dept_id = d.dept_id
LEFT JOIN grievances g ON o.officer_id = g.assigned_officer_id
GROUP BY o.officer_id, o.full_name, o.designation, d.dept_name;

-- View 4: SLA Breach Summary (Immediate escalation monitoring)
CREATE VIEW vw_sla_breach_summary AS
SELECT 
    g.grievance_id,
    g.ticket_number,
    g.title,
    g.priority,
    d.dept_name,
    cat.category_name,
    COALESCE(o.full_name, 'Unassigned') AS current_officer,
    g.created_at,
    g.sla_deadline,
    ROUND((julianday('now') - julianday(g.sla_deadline)), 1) AS days_overdue
FROM grievances g
JOIN departments d ON g.dept_id = d.dept_id
JOIN categories cat ON g.category_id = cat.category_id
LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
WHERE g.status NOT IN ('Resolved', 'Rejected') 
  AND datetime('now') > datetime(g.sla_deadline);
