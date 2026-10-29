// ====================================================================================================
// DBMS COURSE PROJECT: PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM
// Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41
// Full-Stack Node.js Web Server (Zero external dependencies - powered by native node:sqlite & node:http)
// ====================================================================================================

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database', 'grievance.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Initialize SQLite Database Connection
let db;
function initDatabase() {
    const isNew = !fs.existsSync(DB_PATH);
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    
    // Check if tables exist, if not initialize from schema and seed
    try {
        const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='grievances'").get();
        if (!check) {
            console.log('Database tables not found. Initializing schema & seed data...');
            const schemaSql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
            db.exec(schemaSql);
            const seedSql = fs.readFileSync(path.join(__dirname, 'database', 'seed_data.sql'), 'utf8');
            db.exec(seedSql);
            console.log('Database schema and seed data loaded successfully!');
        }
    } catch (err) {
        console.error('Error during database initialization:', err);
    }
}

initDatabase();

// MIME Types for Static File Serving
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Helper to parse JSON request bodies
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON format'));
            }
        });
        req.on('error', reject);
    });
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// Request Handler
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // -------------------------------------------------------------------------
    // API ROUTES
    // -------------------------------------------------------------------------

    // 1. GET /api/overview - Dashboard KPI metrics
    if (method === 'GET' && pathname === '/api/overview') {
        try {
            const totalGrievances = db.prepare('SELECT COUNT(*) as count FROM grievances').get().count;
            const pendingGrievances = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE status IN ('Submitted', 'Assigned', 'In Progress', 'Under Review', 'Reopened')").get().count;
            const resolvedGrievances = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE status = 'Resolved'").get().count;
            const overdueGrievances = db.prepare("SELECT COUNT(*) as count FROM grievances WHERE status NOT IN ('Resolved', 'Rejected') AND datetime('now') > datetime(sla_deadline)").get().count;
            const totalCitizens = db.prepare('SELECT COUNT(*) as count FROM citizens').get().count;
            const totalOfficers = db.prepare('SELECT COUNT(*) as count FROM officers').get().count;
            const totalDepartments = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
            const avgRatingRow = db.prepare('SELECT ROUND(AVG(rating), 2) as avg_rating FROM grievance_feedback').get();
            const avgRating = avgRatingRow ? avgRatingRow.avg_rating : 0;

            const resolutionRate = totalGrievances > 0 ? ((resolvedGrievances / totalGrievances) * 100).toFixed(1) : 0;

            return sendJson(res, 200, {
                totalGrievances,
                pendingGrievances,
                resolvedGrievances,
                overdueGrievances,
                totalCitizens,
                totalOfficers,
                totalDepartments,
                avgRating: avgRating || 0,
                resolutionRate: Number(resolutionRate)
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 2. GET /api/departments - All departments with their complaint categories
    if (method === 'GET' && pathname === '/api/departments') {
        try {
            const depts = db.prepare('SELECT * FROM departments ORDER BY dept_name').all();
            const categories = db.prepare('SELECT * FROM categories ORDER BY dept_id, category_name').all();
            
            const deptMap = depts.map(d => ({
                ...d,
                categories: categories.filter(c => c.dept_id === d.dept_id)
            }));
            
            return sendJson(res, 200, deptMap);
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 3. GET /api/citizens - List citizens for quick-switcher/demo
    if (method === 'GET' && pathname === '/api/citizens') {
        try {
            const citizens = db.prepare('SELECT citizen_id, full_name, email, phone, ward_no, pincode, address FROM citizens ORDER BY citizen_id').all();
            return sendJson(res, 200, citizens);
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 4. GET /api/grievances - List grievances with filters
    if (method === 'GET' && pathname === '/api/grievances') {
        try {
            const citizenId = parsedUrl.searchParams.get('citizen_id');
            const deptId = parsedUrl.searchParams.get('dept_id');
            const status = parsedUrl.searchParams.get('status');
            const search = parsedUrl.searchParams.get('search');

            let query = `
                SELECT 
                    g.grievance_id,
                    g.ticket_number,
                    g.title,
                    g.description,
                    g.priority,
                    g.status,
                    g.ward_no,
                    g.pincode,
                    g.location_address,
                    g.created_at,
                    g.sla_deadline,
                    g.resolved_at,
                    g.escalated_flag,
                    c.citizen_id,
                    c.full_name AS citizen_name,
                    c.phone AS citizen_phone,
                    d.dept_id,
                    d.dept_name,
                    d.dept_code,
                    cat.category_id,
                    cat.category_name,
                    COALESCE(o.officer_id, 0) AS assigned_officer_id,
                    COALESCE(o.full_name, 'Unassigned') AS assigned_officer_name,
                    COALESCE(o.designation, '') AS officer_designation,
                    fb.rating AS citizen_rating,
                    fb.satisfaction_level,
                    fb.comments AS feedback_comments,
                    CASE 
                        WHEN g.status = 'Resolved' THEN 'Resolved'
                        WHEN datetime('now') > datetime(g.sla_deadline) THEN 'Breached'
                        ELSE 'On Track'
                    END AS sla_status
                FROM grievances g
                JOIN citizens c ON g.citizen_id = c.citizen_id
                JOIN departments d ON g.dept_id = d.dept_id
                JOIN categories cat ON g.category_id = cat.category_id
                LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
                LEFT JOIN grievance_feedback fb ON g.grievance_id = fb.grievance_id
                WHERE 1=1
            `;
            const params = [];

            if (citizenId) {
                query += ' AND g.citizen_id = ?';
                params.push(citizenId);
            }
            if (deptId) {
                query += ' AND g.dept_id = ?';
                params.push(deptId);
            }
            if (status && status !== 'ALL') {
                if (status === 'OVERDUE') {
                    query += " AND g.status NOT IN ('Resolved', 'Rejected') AND datetime('now') > datetime(g.sla_deadline)";
                } else {
                    query += ' AND g.status = ?';
                    params.push(status);
                }
            }
            if (search) {
                query += ' AND (g.ticket_number LIKE ? OR g.title LIKE ? OR g.description LIKE ? OR c.full_name LIKE ?)';
                const term = `%${search}%`;
                params.push(term, term, term, term);
            }

            query += ' ORDER BY g.created_at DESC';

            const stmt = db.prepare(query);
            const grievances = stmt.all(...params);
            return sendJson(res, 200, grievances);
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 5. GET /api/grievances/:ticket - Detailed grievance with timeline & attachments
    if (method === 'GET' && pathname.startsWith('/api/grievances/')) {
        const ticketOrId = pathname.replace('/api/grievances/', '');
        try {
            const isTicket = ticketOrId.startsWith('PGR-');
            const whereClause = isTicket ? 'g.ticket_number = ?' : 'g.grievance_id = ?';

            const query = `
                SELECT 
                    g.*,
                    c.full_name AS citizen_name,
                    c.email AS citizen_email,
                    c.phone AS citizen_phone,
                    c.address AS citizen_address,
                    d.dept_name,
                    d.dept_code,
                    d.helpline_number,
                    cat.category_name,
                    cat.sla_days,
                    COALESCE(o.full_name, 'Unassigned') AS assigned_officer_name,
                    COALESCE(o.designation, '') AS officer_designation,
                    COALESCE(o.phone, '') AS officer_phone,
                    fb.rating AS citizen_rating,
                    fb.satisfaction_level,
                    fb.comments AS feedback_comments,
                    CASE 
                        WHEN g.status = 'Resolved' THEN 'Resolved'
                        WHEN datetime('now') > datetime(g.sla_deadline) THEN 'Breached'
                        ELSE 'On Track'
                    END AS sla_status
                FROM grievances g
                JOIN citizens c ON g.citizen_id = c.citizen_id
                JOIN departments d ON g.dept_id = d.dept_id
                JOIN categories cat ON g.category_id = cat.category_id
                LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
                LEFT JOIN grievance_feedback fb ON g.grievance_id = fb.grievance_id
                WHERE ${whereClause}
            `;
            const grievance = db.prepare(query).get(ticketOrId);
            if (!grievance) {
                return sendJson(res, 404, { error: 'Grievance ticket not found' });
            }

            const timeline = db.prepare(`
                SELECT log_id, grievance_id, changed_by_type, changed_by_name, old_status, new_status, remarks, timestamp
                FROM grievance_timeline
                WHERE grievance_id = ?
                ORDER BY timestamp ASC, log_id ASC
            `).all(grievance.grievance_id);

            const attachments = db.prepare(`
                SELECT * FROM grievance_attachments WHERE grievance_id = ? ORDER BY uploaded_at ASC
            `).all(grievance.grievance_id);

            return sendJson(res, 200, {
                ...grievance,
                timeline,
                attachments
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 6. POST /api/grievances - Lodge new grievance
    if (method === 'POST' && pathname === '/api/grievances') {
        try {
            const body = await parseBody(req);
            const { citizen_id, dept_id, category_id, title, description, location_address, ward_no, pincode, priority } = body;

            if (!citizen_id || !dept_id || !category_id || !title || !description || !location_address) {
                return sendJson(res, 400, { error: 'Please provide all required grievance fields' });
            }

            // Get category SLA days
            const category = db.prepare('SELECT sla_days FROM categories WHERE category_id = ?').get(category_id);
            const slaDays = category ? category.sla_days : 5;

            // Generate ticket number: PGR-2026-XXXX
            const countRow = db.prepare('SELECT COUNT(*) as count FROM grievances').get();
            const nextSeq = 1001 + countRow.count + Math.floor(Math.random() * 10);
            const ticketNumber = `PGR-2026-${nextSeq}`;

            // Auto-assign available active officer in that department
            const officer = db.prepare(`
                SELECT officer_id FROM officers 
                WHERE dept_id = ? AND is_active = 1 
                ORDER BY RANDOM() LIMIT 1
            `).get(dept_id);
            const assignedOfficerId = officer ? officer.officer_id : null;

            // Calculate SLA deadline
            const insertStmt = db.prepare(`
                INSERT INTO grievances (
                    ticket_number, citizen_id, dept_id, category_id, assigned_officer_id,
                    title, description, location_address, ward_no, pincode, priority,
                    status, sla_deadline
                )
                VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    'Submitted',
                    datetime('now', '+' || ? || ' days')
                )
            `);

            const insertResult = insertStmt.run(
                ticketNumber,
                citizen_id,
                dept_id,
                category_id,
                assignedOfficerId,
                title,
                description,
                location_address,
                ward_no || 12,
                pincode || '522002',
                priority || 'Medium',
                slaDays
            );

            const grievanceId = insertResult.lastInsertRowid;

            // If auto-assigned, record officer assignment timeline
            if (assignedOfficerId) {
                const offDetails = db.prepare('SELECT full_name, designation FROM officers WHERE officer_id = ?').get(assignedOfficerId);
                db.prepare(`
                    INSERT INTO grievance_timeline (
                        grievance_id, changed_by_type, changed_by_name, old_status, new_status, remarks
                    )
                    VALUES (?, 'System', 'Municipal Workflow Engine', 'Submitted', 'Assigned', ?)
                `).run(
                    grievanceId,
                    `Ticket auto-routed to ${offDetails.full_name} (${offDetails.designation}) based on category SLA and jurisdictional queue.`
                );

                db.prepare("UPDATE grievances SET status = 'Assigned' WHERE grievance_id = ?").run(grievanceId);
            }

            // Optional dummy attachment creation if user indicated an image
            if (body.has_attachment) {
                db.prepare(`
                    INSERT INTO grievance_attachments (grievance_id, file_name, file_path, file_size_kb, file_type)
                    VALUES (?, 'evidence_photo.jpg', '/uploads/evidence_upload.jpg', 340, 'image/jpeg')
                `).run(grievanceId);
            }

            return sendJson(res, 201, {
                message: 'Grievance registered successfully!',
                ticket_number: ticketNumber,
                grievance_id: grievanceId
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 7. POST /api/grievances/:id/status - Update grievance status (Officer / Admin)
    if (method === 'POST' && pathname.match(/^\/api\/grievances\/\d+\/status$/)) {
        const grievanceId = pathname.split('/')[3];
        try {
            const body = await parseBody(req);
            const { status, remarks, changed_by_name, changed_by_type } = body;

            if (!status || !remarks) {
                return sendJson(res, 400, { error: 'Status and remarks are required' });
            }

            const current = db.prepare('SELECT status FROM grievances WHERE grievance_id = ?').get(grievanceId);
            if (!current) {
                return sendJson(res, 404, { error: 'Grievance not found' });
            }

            const oldStatus = current.status;
            let resolvedAtClause = '';
            if (status === 'Resolved') {
                db.prepare("UPDATE grievances SET status = ?, resolved_at = datetime('now'), updated_at = CURRENT_TIMESTAMP WHERE grievance_id = ?").run(status, grievanceId);
            } else {
                db.prepare("UPDATE grievances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE grievance_id = ?").run(status, grievanceId);
            }

            // Insert timeline audit log
            db.prepare(`
                INSERT INTO grievance_timeline (
                    grievance_id, changed_by_type, changed_by_name, old_status, new_status, remarks
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                grievanceId,
                changed_by_type || 'Officer',
                changed_by_name || 'Department Officer',
                oldStatus,
                status,
                remarks
            );

            return sendJson(res, 200, { message: `Grievance status updated to '${status}' successfully.` });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 8. POST /api/grievances/:id/feedback - Submit citizen rating & feedback
    if (method === 'POST' && pathname.match(/^\/api\/grievances\/\d+\/feedback$/)) {
        const grievanceId = pathname.split('/')[3];
        try {
            const body = await parseBody(req);
            const { citizen_id, rating, satisfaction_level, comments } = body;

            if (!rating || rating < 1 || rating > 5) {
                return sendJson(res, 400, { error: 'Rating must be an integer between 1 and 5' });
            }

            // Verify grievance is resolved
            const grv = db.prepare('SELECT status, citizen_id FROM grievances WHERE grievance_id = ?').get(grievanceId);
            if (!grv) {
                return sendJson(res, 404, { error: 'Grievance not found' });
            }
            if (grv.status !== 'Resolved') {
                return sendJson(res, 400, { error: 'Feedback can only be submitted for Resolved grievances' });
            }

            // Upsert feedback
            db.prepare(`
                INSERT INTO grievance_feedback (grievance_id, citizen_id, rating, satisfaction_level, comments)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(grievance_id) DO UPDATE SET
                    rating = excluded.rating,
                    satisfaction_level = excluded.satisfaction_level,
                    comments = excluded.comments,
                    submitted_at = CURRENT_TIMESTAMP
            `).run(
                grievanceId,
                citizen_id || grv.citizen_id,
                rating,
                satisfaction_level || (rating >= 4 ? 'Highly Satisfied' : rating === 3 ? 'Neutral' : 'Dissatisfied'),
                comments || ''
            );

            return sendJson(res, 200, { message: 'Thank you for your valuable feedback!' });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 9. POST /api/grievances/:id/escalate - Escalate grievance
    if (method === 'POST' && pathname.match(/^\/api\/grievances\/\d+\/escalate$/)) {
        const grievanceId = pathname.split('/')[3];
        try {
            const body = await parseBody(req);
            const { reason, escalated_by_name } = body;

            const grv = db.prepare(`
                SELECT g.*, o.supervisor_id, d.dept_id 
                FROM grievances g
                JOIN departments d ON g.dept_id = d.dept_id
                LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id
                WHERE g.grievance_id = ?
            `).get(grievanceId);

            if (!grv) {
                return sendJson(res, 404, { error: 'Grievance not found' });
            }

            // Pick supervisor or department head
            let superiorId = grv.supervisor_id;
            if (!superiorId) {
                const deptHead = db.prepare('SELECT officer_id FROM officers WHERE dept_id = ? AND supervisor_id IS NULL LIMIT 1').get(grv.dept_id);
                superiorId = deptHead ? deptHead.officer_id : 1;
            }

            // Insert escalation record
            db.prepare(`
                INSERT INTO escalations (grievance_id, escalated_to_officer_id, escalation_level, escalation_reason)
                VALUES (?, ?, 1, ?)
            `).run(grievanceId, superiorId, reason || 'Escalated by Citizen due to delay in resolution');

            // Update grievance
            db.prepare("UPDATE grievances SET escalated_flag = 1, priority = 'Urgent', updated_at = CURRENT_TIMESTAMP WHERE grievance_id = ?").run(grievanceId);

            // Log timeline
            db.prepare(`
                INSERT INTO grievance_timeline (grievance_id, changed_by_type, changed_by_name, old_status, new_status, remarks)
                VALUES (?, 'Citizen', ?, ?, ?, ?)
            `).run(
                grievanceId,
                escalated_by_name || 'Citizen',
                grv.status,
                grv.status,
                `ESCALATION FILED: ${reason || 'Resolution overdue'}. Flagged as Urgent for Superintending Authority review.`
            );

            return sendJson(res, 200, { message: 'Grievance successfully escalated to higher supervisory authority.' });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 10. GET /api/analytics - Summary charts data
    if (method === 'GET' && pathname === '/api/analytics') {
        try {
            const deptStats = db.prepare('SELECT * FROM vw_department_performance').all();
            
            const categoryBreakdown = db.prepare(`
                SELECT cat.category_name, COUNT(g.grievance_id) as count
                FROM grievances g
                JOIN categories cat ON g.category_id = cat.category_id
                GROUP BY cat.category_id, cat.category_name
                ORDER BY count DESC
                LIMIT 8
            `).all();

            const priorityBreakdown = db.prepare(`
                SELECT priority, COUNT(*) as count 
                FROM grievances 
                GROUP BY priority
            `).all();

            const statusBreakdown = db.prepare(`
                SELECT status, COUNT(*) as count 
                FROM grievances 
                GROUP BY status
            `).all();

            const wardHeatmap = db.prepare(`
                SELECT ward_no, COUNT(*) as complaint_count, 
                       SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
                FROM grievances
                GROUP BY ward_no
                ORDER BY complaint_count DESC
            `).all();

            return sendJson(res, 200, {
                departmentPerformance: deptStats,
                categoryBreakdown,
                priorityBreakdown,
                statusBreakdown,
                wardHeatmap
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 11. GET /api/officers - Roster with workload
    if (method === 'GET' && pathname === '/api/officers') {
        try {
            const officers = db.prepare('SELECT * FROM vw_officer_workload ORDER BY active_cases DESC, total_assigned DESC').all();
            return sendJson(res, 200, officers);
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 12. GET /api/queries - Pre-packaged DBMS Course queries
    if (method === 'GET' && pathname === '/api/queries') {
        const catalog = [
            {
                id: 1,
                title: "Urgent Water Supply Grievances",
                category: "Basic Filtering & String Matching",
                description: "List all urgent complaints containing 'water' or 'pipe' in title or description.",
                sql: "SELECT ticket_number, title, priority, status, ward_no, created_at FROM grievances WHERE priority = 'Urgent' AND (title LIKE '%water%' OR description LIKE '%pipe%') ORDER BY created_at DESC;"
            },
            {
                id: 2,
                title: "Comprehensive 4-Table INNER JOIN",
                category: "Relational Joins",
                description: "Grievance tracking card joining citizen, department, category, and officer tables.",
                sql: "SELECT g.ticket_number, c.full_name AS citizen_name, d.dept_name, cat.category_name, g.priority, g.status, COALESCE(o.full_name, 'Unassigned') AS assigned_officer FROM grievances g INNER JOIN citizens c ON g.citizen_id = c.citizen_id INNER JOIN departments d ON g.dept_id = d.dept_id INNER JOIN categories cat ON g.category_id = cat.category_id LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id ORDER BY g.created_at DESC;"
            },
            {
                id: 3,
                title: "Department Resolution Rates (HAVING Clause)",
                category: "Aggregation & Grouping",
                description: "Departments with >= 2 complaints, showing resolved count and resolution percentage.",
                sql: "SELECT d.dept_name, COUNT(g.grievance_id) AS total_complaints, SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count, ROUND((CAST(SUM(CASE WHEN g.status = 'Resolved' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(g.grievance_id)) * 100, 2) AS resolution_rate_pct FROM departments d INNER JOIN grievances g ON d.dept_id = g.dept_id GROUP BY d.dept_id, d.dept_name HAVING COUNT(g.grievance_id) >= 2 ORDER BY total_complaints DESC;"
            },
            {
                id: 4,
                title: "Officer & Supervisor Hierarchy (Self-Join)",
                category: "Self-Referencing Joins",
                description: "Municipal officer hierarchy showing each employee and their direct supervisor.",
                sql: "SELECT emp.officer_id, emp.full_name AS officer_name, emp.designation, d.dept_name, COALESCE(mgr.full_name, 'HEAD OF DEPT') AS supervisor_name FROM officers emp INNER JOIN departments d ON emp.dept_id = d.dept_id LEFT JOIN officers mgr ON emp.supervisor_id = mgr.officer_id ORDER BY d.dept_name, emp.full_name;"
            },
            {
                id: 5,
                title: "SLA Overdue & Breach Detection",
                category: "Date/Time Arithmetic & SLA Analysis",
                description: "Find active complaints past their SLA deadline with days overdue calculation.",
                sql: "SELECT g.ticket_number, g.title, d.dept_name, g.priority, g.sla_deadline, ROUND(julianday('now') - julianday(g.sla_deadline), 1) AS days_breached, COALESCE(o.full_name, 'Unassigned') AS accountable_officer FROM grievances g INNER JOIN departments d ON g.dept_id = d.dept_id LEFT JOIN officers o ON g.assigned_officer_id = o.officer_id WHERE g.status NOT IN ('Resolved', 'Rejected') AND datetime('now') > datetime(g.sla_deadline) ORDER BY days_breached DESC;"
            },
            {
                id: 6,
                title: "Department Customer Satisfaction (CTE)",
                category: "Common Table Expressions (CTE)",
                description: "Compute average citizen star ratings and percentage of positive ratings per department.",
                sql: "WITH DeptFeedbackCTE AS (SELECT g.dept_id, COUNT(f.feedback_id) AS total_feedback, AVG(f.rating) AS avg_rating FROM grievances g INNER JOIN grievance_feedback f ON g.grievance_id = f.grievance_id GROUP BY g.dept_id) SELECT d.dept_name, d.head_officer_name, COALESCE(cte.total_feedback, 0) AS feedback_count, ROUND(COALESCE(cte.avg_rating, 0), 2) AS avg_citizen_rating FROM departments d LEFT JOIN DeptFeedbackCTE cte ON d.dept_id = cte.dept_id ORDER BY avg_citizen_rating DESC;"
            },
            {
                id: 7,
                title: "Grievances Below Overall Average SLA",
                category: "Nested Subqueries",
                description: "Categories with committed SLA days strictly below the city-wide average.",
                sql: "SELECT cat.category_name, d.dept_name, cat.sla_days, (SELECT ROUND(AVG(sla_days), 2) FROM categories) AS overall_avg_sla FROM categories cat INNER JOIN departments d ON cat.dept_id = d.dept_id WHERE cat.sla_days < (SELECT AVG(sla_days) FROM categories) ORDER BY cat.sla_days ASC;"
            },
            {
                id: 8,
                title: "Grievance Priority Ranking per Department",
                category: "Window Functions (ROW_NUMBER)",
                description: "Assign priority ranking (1, 2, 3...) to grievances partitioned by department.",
                sql: "SELECT g.ticket_number, d.dept_code, g.title, g.priority, g.status, ROW_NUMBER() OVER (PARTITION BY g.dept_id ORDER BY CASE g.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END, g.created_at) AS dept_priority_rank FROM grievances g INNER JOIN departments d ON g.dept_id = d.dept_id;"
            },
            {
                id: 9,
                title: "Ward-wise Grievance Distribution",
                category: "Demographic Analytics",
                description: "Geographic density of grievances by municipal ward number and postal pincode.",
                sql: "SELECT ward_no, pincode, COUNT(grievance_id) AS total_complaints, SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count FROM grievances GROUP BY ward_no, pincode ORDER BY total_complaints DESC;"
            },
            {
                id: 10,
                title: "Resolved Grievances Turnaround Time",
                category: "Business Intelligence & SLA Audit",
                description: "Compute turnaround duration in days vs committed SLA for all resolved cases.",
                sql: "SELECT g.ticket_number, d.dept_name, cat.category_name, ROUND((julianday(g.resolved_at) - julianday(g.created_at)), 2) AS turnaround_days, cat.sla_days AS target_sla_days, CASE WHEN julianday(g.resolved_at) <= julianday(g.sla_deadline) THEN 'Met SLA' ELSE 'Exceeded SLA' END AS sla_compliance FROM grievances g INNER JOIN departments d ON g.dept_id = d.dept_id INNER JOIN categories cat ON g.category_id = cat.category_id WHERE g.status = 'Resolved' AND g.resolved_at IS NOT NULL ORDER BY turnaround_days ASC;"
            }
        ];
        return sendJson(res, 200, catalog);
    }

    // 13. POST /api/run-query - Execute SELECT query for DBMS viva evaluation
    if (method === 'POST' && pathname === '/api/run-query') {
        try {
            const body = await parseBody(req);
            let { query } = body;

            if (!query || typeof query !== 'string') {
                return sendJson(res, 400, { error: 'Please provide a SQL query string' });
            }

            query = query.trim();

            // Security guard for interactive viva console: only permit safe read-only queries (SELECT, WITH, PRAGMA)
            const lower = query.toLowerCase();
            const allowedKeywords = ['select', 'with', 'pragma table_info', 'explain'];
            const isAllowed = allowedKeywords.some(kw => lower.startsWith(kw));

            if (!isAllowed) {
                return sendJson(res, 403, { 
                    error: 'For safety, only SELECT queries and CTEs (WITH) can be executed in this interactive viva console.' 
                });
            }

            const startTime = Date.now();
            const stmt = db.prepare(query);
            const rows = stmt.all();
            const durationMs = Date.now() - startTime;

            let columns = [];
            if (rows.length > 0) {
                columns = Object.keys(rows[0]);
            }

            return sendJson(res, 200, {
                columns,
                rows,
                rowCount: rows.length,
                durationMs
            });
        } catch (err) {
            return sendJson(res, 400, { error: err.message });
        }
    }

    // -------------------------------------------------------------------------
    // STATIC FILE SERVING
    // -------------------------------------------------------------------------
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

    // Normalize and prevent directory traversal
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Access Denied');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback to index.html for SPA-like navigation
            const indexPath = path.join(PUBLIC_DIR, 'index.html');
            fs.readFile(indexPath, (readErr, content) => {
                if (readErr) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    return res.end('404 Not Found');
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                res.end(content);
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Server Error loading asset');
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

// Start Web Server
server.listen(PORT, () => {
    console.log('================================================================');
    console.log('PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM');
    console.log('Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41');
    console.log(`Server actively running at: http://localhost:${PORT}`);
    console.log('Press Ctrl+C to terminate.');
    console.log('================================================================');
});
