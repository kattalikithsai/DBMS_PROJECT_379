-- ====================================================================================================
-- DBMS COURSE PROJECT: PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM
-- Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41
-- SQL Queries Showcase (Demonstrating Core & Advanced Relational DBMS Concepts)
-- ====================================================================================================

-- ----------------------------------------------------------------------------------------------------
-- QUERY 1: Basic Retrieval with Filtering and Pattern Matching
-- Problem: List all urgent grievances that contain 'water' or 'pipe' in their title or description.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    ticket_number,
    title,
    priority,
    status,
    ward_no,
    created_at
FROM grievances
WHERE priority = 'Urgent' 
  AND (title LIKE '%water%' OR description LIKE '%pipe%')
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 2: Multi-table INNER JOIN
-- Problem: Retrieve complete grievance tracking card including citizen name, department name, 
-- category name, and assigned officer name.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    g.ticket_number,
    c.full_name AS citizen_name,
    c.phone AS citizen_phone,
    d.dept_name,
    cat.category_name,
    g.title,
    g.priority,
    g.status,
    COALESCE(o.full_name, 'Yet to be Assigned') AS assigned_officer
FROM grievances g
INNER JOIN citizens c ON g.citizen_id = c.citizen_id
INNER JOIN departments d ON g.dept_id = d.dept_id
INNER JOIN categories cat ON g.category_id = cat.category_id
LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
ORDER BY g.created_at DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 3: Aggregation with GROUP BY and HAVING Clause
-- Problem: Identify departments that have received more than 2 complaints, along with total count 
-- and percentage of complaints resolved.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    d.dept_name,
    COUNT(g.grievance_id) AS total_complaints,
    SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count,
    SUM(CASE WHEN g.status <> 'Resolved' THEN 1 ELSE 0 END) AS open_count,
    ROUND((CAST(SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(g.grievance_id)) * 100, 2) AS resolution_rate_pct
FROM departments d
INNER JOIN grievances g ON d.dept_id = g.dept_id
GROUP BY d.dept_id, d.dept_name
HAVING COUNT(g.grievance_id) >= 2
ORDER BY total_complaints DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 4: Self Join (Hierarchical Reporting Structure)
-- Problem: Display each municipal officer alongside the name and designation of their reporting supervisor.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    emp.officer_id,
    emp.full_name AS officer_name,
    emp.designation AS officer_designation,
    d.dept_name,
    COALESCE(mgr.full_name, 'HEAD OF DEPARTMENT') AS supervisor_name,
    COALESCE(mgr.designation, 'Executive Authority') AS supervisor_designation
FROM officers emp
INNER JOIN departments d ON emp.dept_id = d.dept_id
LEFT JOIN officers mgr ON emp.supervisor_id = mgr.officer_id
ORDER BY d.dept_name, emp.full_name;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 5: Left Outer Join with Null Handling
-- Problem: List all registered officers and the count of grievances currently assigned to them, 
-- including officers who currently have zero assignments.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    o.officer_id,
    o.full_name,
    o.designation,
    d.dept_code,
    COUNT(g.grievance_id) AS total_grievances_assigned,
    SUM(CASE WHEN g.status IN ('Assigned', 'In Progress') THEN 1 ELSE 0 END) AS active_caseload
FROM officers o
INNER JOIN departments d ON o.dept_id = d.dept_id
LEFT JOIN grievances g ON o.officer_id = g.assigned_officer_id
GROUP BY o.officer_id, o.full_name, o.designation, d.dept_code
ORDER BY active_caseload DESC, total_grievances_assigned DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 6: Subquery in WHERE Clause (Scalar Subquery)
-- Problem: Find grievances whose SLA deadline is shorter than the average SLA duration across all categories.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    cat.category_name,
    d.dept_name,
    cat.sla_days,
    (SELECT ROUND(AVG(sla_days), 2) FROM categories) AS overall_average_sla
FROM categories cat
INNER JOIN departments d ON cat.dept_id = d.dept_id
WHERE cat.sla_days < (SELECT AVG(sla_days) FROM categories)
ORDER BY cat.sla_days ASC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 7: Correlated Subquery with EXISTS
-- Problem: Find all citizens who have lodged at least one complaint that has already been resolved.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    c.citizen_id,
    c.full_name,
    c.email,
    c.phone,
    c.ward_no
FROM citizens c
WHERE EXISTS (
    SELECT 1 
    FROM grievances g 
    WHERE g.citizen_id = c.citizen_id 
      AND g.status = 'Resolved'
);

-- ----------------------------------------------------------------------------------------------------
-- QUERY 8: Subquery with NOT IN (Set Difference)
-- Problem: Identify citizens who have registered in the portal but have never lodged any grievance yet.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    c.citizen_id,
    c.full_name,
    c.email,
    c.phone,
    c.registered_at
FROM citizens c
WHERE c.citizen_id NOT IN (
    SELECT DISTINCT citizen_id 
    FROM grievances 
    WHERE citizen_id IS NOT NULL
);

-- ----------------------------------------------------------------------------------------------------
-- QUERY 9: SLA Breach and Overdue Calculation Query
-- Problem: Calculate the number of days each unresolved grievance has exceeded its committed SLA deadline.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    g.ticket_number,
    g.title,
    d.dept_name,
    g.priority,
    g.sla_deadline,
    ROUND(julianday('now') - julianday(g.sla_deadline), 1) AS days_breached,
    COALESCE(o.full_name, 'Unassigned') AS accountable_officer
FROM grievances g
INNER JOIN departments d ON g.dept_id = d.dept_id
LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
WHERE g.status NOT IN ('Resolved', 'Rejected')
  AND datetime('now') > datetime(g.sla_deadline)
ORDER BY days_breached DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 10: Window Function: RANK() and ROW_NUMBER()
-- Problem: Rank grievances within each department according to priority (Urgent > High > Medium > Low) 
-- and submission timestamp.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    g.ticket_number,
    d.dept_code,
    g.title,
    g.priority,
    g.status,
    g.created_at,
    ROW_NUMBER() OVER (
        PARTITION BY g.dept_id 
        ORDER BY 
            CASE g.priority 
                WHEN 'Urgent' THEN 1 
                WHEN 'High' THEN 2 
                WHEN 'Medium' THEN 3 
                WHEN 'Low' THEN 4 
            END ASC, 
            g.created_at ASC
    ) AS department_priority_rank
FROM grievances g
INNER JOIN departments d ON g.dept_id = d.dept_id;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 11: Common Table Expression (CTE) for Customer Satisfaction (CSAT) Index
-- Problem: Calculate average rating and feedback count by department using a modular CTE.
-- ----------------------------------------------------------------------------------------------------
WITH DepartmentFeedbackCTE AS (
    SELECT 
        g.dept_id,
        COUNT(f.feedback_id) AS total_feedback_given,
        AVG(f.rating) AS raw_avg_rating,
        SUM(CASE WHEN f.rating >= 4 THEN 1 ELSE 0 END) AS positive_ratings_count
    FROM grievances g
    INNER JOIN grievance_feedback f ON g.grievance_id = f.grievance_id
    GROUP BY g.dept_id
)
SELECT 
    d.dept_name,
    d.head_officer_name,
    COALESCE(cte.total_feedback_given, 0) AS feedback_count,
    ROUND(COALESCE(cte.raw_avg_rating, 0), 2) AS avg_citizen_rating,
    ROUND((CAST(COALESCE(cte.positive_ratings_count, 0) AS FLOAT) / NULLIF(cte.total_feedback_given, 0)) * 100, 1) AS satisfaction_score_pct
FROM departments d
LEFT JOIN DepartmentFeedbackCTE cte ON d.dept_id = cte.dept_id
ORDER BY avg_citizen_rating DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 12: Ward-wise Grievance Distribution (Heatmap Analytics)
-- Problem: Determine which municipal ward has registered the highest volume of grievances and their distribution.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    ward_no,
    pincode,
    COUNT(grievance_id) AS total_complaints,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count,
    SUM(CASE WHEN status <> 'Resolved' THEN 1 ELSE 0 END) AS active_count
FROM grievances
GROUP BY ward_no, pincode
ORDER BY total_complaints DESC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 13: Audit Trail Log of Grievance Lifecycle
-- Problem: Fetch full chronological progression of a given ticket (e.g., 'PGR-2026-1001')
-- ----------------------------------------------------------------------------------------------------
SELECT 
    gt.log_id,
    g.ticket_number,
    gt.changed_by_type,
    gt.changed_by_name,
    COALESCE(gt.old_status, 'INITIAL SUBMISSION') AS previous_status,
    gt.new_status AS current_status,
    gt.remarks,
    gt.timestamp
FROM grievance_timeline gt
INNER JOIN grievances g ON gt.grievance_id = g.grievance_id
WHERE g.ticket_number = 'PGR-2026-1001'
ORDER BY gt.timestamp ASC;

-- ----------------------------------------------------------------------------------------------------
-- QUERY 14: Union of High Priority and Breached Grievances
-- Problem: Combine urgent grievances with grievances that have breached SLA using UNION.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    ticket_number,
    title,
    priority,
    'Flagged as Urgent Priority' AS attention_reason
FROM grievances
WHERE priority = 'Urgent'
UNION
SELECT 
    ticket_number,
    title,
    priority,
    'SLA Deadline Breached' AS attention_reason
FROM grievances
WHERE status NOT IN ('Resolved', 'Rejected') 
  AND datetime('now') > datetime(sla_deadline);

-- ----------------------------------------------------------------------------------------------------
-- QUERY 15: Resolution Turnaround Time (in Days) for Closed Grievances
-- Problem: Compute the resolution duration in fractional days for all resolved complaints.
-- ----------------------------------------------------------------------------------------------------
SELECT 
    g.ticket_number,
    d.dept_name,
    cat.category_name,
    g.created_at,
    g.resolved_at,
    ROUND((julianday(g.resolved_at) - julianday(g.created_at)), 2) AS turnaround_days,
    cat.sla_days AS target_sla_days,
    CASE 
        WHEN julianday(g.resolved_at) <= julianday(g.sla_deadline) THEN 'Met SLA Target'
        ELSE 'Exceeded SLA Target'
    END AS sla_performance
FROM grievances g
INNER JOIN departments d ON g.dept_id = d.dept_id
INNER JOIN categories cat ON g.category_id = cat.category_id
WHERE g.status = 'Resolved' AND g.resolved_at IS NOT NULL
ORDER BY turnaround_days ASC;
