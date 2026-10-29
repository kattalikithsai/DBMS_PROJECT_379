// ====================================================================================================
// DBMS COURSE PROJECT: PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM
// Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41
// Client Application Logic
// ====================================================================================================

let departmentChart = null;
let categoryChart = null;
let allDepartments = [];
let allCitizens = [];

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModalStars();
    loadDashboard();
    loadCitizensAndDepartments();
    loadOfficerQueue();
    loadOfficerRoster();
    loadPredefinedQueries();

    // Event Listeners
    document.getElementById('lodge-grievance-form').addEventListener('submit', handleLodgeGrievance);
    document.getElementById('dept-select').addEventListener('change', handleDeptChange);
    document.getElementById('citizen-select').addEventListener('change', handleCitizenChange);
    document.getElementById('btn-track').addEventListener('click', () => {
        const ticket = document.getElementById('tracker-input').value.trim();
        if (ticket) trackGrievance(ticket);
    });
    document.getElementById('filter-dept').addEventListener('change', loadOfficerQueue);
    document.getElementById('filter-status').addEventListener('change', loadOfficerQueue);
    document.getElementById('btn-run-sql').addEventListener('click', executeCustomQuery);
    document.getElementById('form-update-status').addEventListener('submit', handleStatusSubmit);
    document.getElementById('form-feedback').addEventListener('submit', handleFeedbackSubmit);
    document.getElementById('form-escalate').addEventListener('submit', handleEscalateSubmit);
});

// -----------------------------------------------------------------------------
// TAB MANAGEMENT
// -----------------------------------------------------------------------------
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const panel = document.getElementById(targetId);
            if (panel) panel.classList.add('active');

            if (targetId === 'tab-dashboard') loadDashboard();
            if (targetId === 'tab-officer') { loadOfficerQueue(); loadOfficerRoster(); }
        });
    });
}

function switchTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
}

// -----------------------------------------------------------------------------
// DASHBOARD & ANALYTICS
// -----------------------------------------------------------------------------
async function loadDashboard() {
    try {
        const [overviewRes, analyticsRes] = await Promise.all([
            fetch('/api/overview'),
            fetch('/api/analytics')
        ]);
        const overview = await overviewRes.json();
        const analytics = await analyticsRes.json();

        // Update KPI Cards
        document.getElementById('kpi-total').textContent = overview.totalGrievances;
        document.getElementById('kpi-pending').textContent = overview.pendingGrievances;
        document.getElementById('kpi-resolved').textContent = overview.resolvedGrievances;
        document.getElementById('kpi-rate').textContent = `${overview.resolutionRate}% Resolution Rate`;
        document.getElementById('kpi-overdue').textContent = overview.overdueGrievances;
        document.getElementById('kpi-rating').textContent = `${overview.avgRating || 0.0} / 5.0`;

        // Render Department Performance Table
        const deptTbody = document.getElementById('dept-table-body');
        deptTbody.innerHTML = '';
        analytics.departmentPerformance.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${d.dept_code}</strong></td>
                <td>${d.dept_name}</td>
                <td>${d.head_officer_name}</td>
                <td><strong>${d.total_complaints}</strong></td>
                <td><span class="badge badge-resolved">${d.resolved_complaints}</span></td>
                <td><span class="badge badge-inprogress">${d.pending_complaints}</span></td>
                <td>${d.overdue_complaints > 0 ? `<span class="badge badge-urgent">${d.overdue_complaints} Breached</span>` : '<span class="badge badge-ontrack">0</span>'}</td>
                <td><strong>${d.resolution_percentage}%</strong></td>
                <td>⭐ ${d.avg_citizen_rating ? d.avg_citizen_rating : 'N/A'}</td>
            `;
            deptTbody.appendChild(tr);
        });

        // Render Charts
        renderDepartmentChart(analytics.departmentPerformance);
        renderCategoryChart(analytics.categoryBreakdown);
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

function renderDepartmentChart(depts) {
    const ctx = document.getElementById('chart-department').getContext('2d');
    if (departmentChart) departmentChart.destroy();

    departmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depts.map(d => d.dept_code),
            datasets: [
                {
                    label: 'Resolved',
                    data: depts.map(d => d.resolved_complaints),
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Pending',
                    data: depts.map(d => d.pending_complaints),
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Overdue (SLA Breached)',
                    data: depts.map(d => d.overdue_complaints),
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        }
    });
}

function renderCategoryChart(categories) {
    const ctx = document.getElementById('chart-category').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.category_name),
            datasets: [{
                data: categories.map(c => c.count),
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                    '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });
}

// -----------------------------------------------------------------------------
// CITIZEN SERVICES & LODGE GRIEVANCE
// -----------------------------------------------------------------------------
async function loadCitizensAndDepartments() {
    try {
        const [citizensRes, deptsRes] = await Promise.all([
            fetch('/api/citizens'),
            fetch('/api/departments')
        ]);
        allCitizens = await citizensRes.json();
        allDepartments = await deptsRes.json();

        // Populate citizen select
        const citizenSelect = document.getElementById('citizen-select');
        citizenSelect.innerHTML = '';
        allCitizens.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.citizen_id;
            opt.textContent = `${c.full_name} (${c.email}) - Ward ${c.ward_no}`;
            citizenSelect.appendChild(opt);
        });

        // Populate department select for form & filter
        const deptSelect = document.getElementById('dept-select');
        const filterDept = document.getElementById('filter-dept');
        deptSelect.innerHTML = '<option value="">-- Choose Department --</option>';
        filterDept.innerHTML = '<option value="">All Departments</option>';

        allDepartments.forEach(d => {
            const opt1 = document.createElement('option');
            opt1.value = d.dept_id;
            opt1.textContent = `${d.dept_name} (${d.dept_code})`;
            deptSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = d.dept_id;
            opt2.textContent = d.dept_name;
            filterDept.appendChild(opt2);
        });

        // Trigger citizen load
        handleCitizenChange();
    } catch (err) {
        console.error('Error loading citizens or departments:', err);
    }
}

function handleDeptChange() {
    const deptId = parseInt(document.getElementById('dept-select').value);
    const catSelect = document.getElementById('category-select');
    catSelect.innerHTML = '<option value="">-- Choose Category --</option>';

    if (!deptId) {
        catSelect.disabled = true;
        return;
    }

    const dept = allDepartments.find(d => d.dept_id === deptId);
    if (dept && dept.categories) {
        dept.categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.category_id;
            opt.textContent = `${c.category_name} (SLA: ${c.sla_days} Days)`;
            catSelect.appendChild(opt);
        });
        catSelect.disabled = false;
    }
}

async function handleCitizenChange() {
    const citizenId = document.getElementById('citizen-select').value;
    if (!citizenId) return;

    const citizen = allCitizens.find(c => c.citizen_id == citizenId);
    if (citizen) {
        document.getElementById('ward-input').value = citizen.ward_no;
        document.getElementById('location-input').value = citizen.address;
        document.getElementById('pincode-input').value = citizen.pincode;
        document.getElementById('citizen-active-badge').textContent = `Ward ${citizen.ward_no} • ${citizen.full_name}`;
    }

    try {
        const res = await fetch(`/api/grievances?citizen_id=${citizenId}`);
        const grievances = await res.json();
        const listDiv = document.getElementById('citizen-grievances-list');
        listDiv.innerHTML = '';

        if (grievances.length === 0) {
            listDiv.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:1.5rem;">No grievances registered by this citizen yet.</p>';
            return;
        }

        grievances.forEach(g => {
            const item = document.createElement('div');
            item.style.border = '1px solid var(--border)';
            item.style.borderRadius = 'var(--radius)';
            item.style.padding = '0.85rem';
            item.style.background = '#ffffff';

            const statusClass = `badge-${g.status.toLowerCase().replace(' ', '')}`;
            const slaBadge = g.sla_status === 'Breached' ? '<span class="badge badge-urgent">SLA Breached</span>' : '';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <strong>${g.ticket_number}</strong>
                    <div>
                        <span class="badge ${statusClass}">${g.status}</span>
                        ${slaBadge}
                    </div>
                </div>
                <div style="font-weight:600; font-size:0.92rem; color:var(--text-main);">${g.title}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
                    Dept: ${g.dept_name} • Filed on: ${new Date(g.created_at).toLocaleDateString()}
                </div>
                <div style="margin-top:0.6rem; display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="trackGrievance('${g.ticket_number}')">
                        🔍 Track Live Status
                    </button>
                    ${g.status === 'Resolved' && !g.citizen_rating ? `
                        <button class="btn btn-accent btn-sm" onclick="openFeedbackModal(${g.grievance_id}, '${g.ticket_number}')">
                            ⭐ Rate Resolution
                        </button>
                    ` : ''}
                </div>
            `;
            listDiv.appendChild(item);
        });
    } catch (err) {
        console.error('Error fetching citizen grievances:', err);
    }
}

async function handleLodgeGrievance(e) {
    e.preventDefault();
    const citizen_id = parseInt(document.getElementById('citizen-select').value);
    const dept_id = parseInt(document.getElementById('dept-select').value);
    const category_id = parseInt(document.getElementById('category-select').value);
    const priority = document.getElementById('priority-select').value;
    const ward_no = parseInt(document.getElementById('ward-input').value);
    const title = document.getElementById('title-input').value.trim();
    const description = document.getElementById('desc-input').value.trim();
    const location_address = document.getElementById('location-input').value.trim();
    const pincode = document.getElementById('pincode-input').value.trim();
    const has_attachment = document.getElementById('attachment-check').checked;

    try {
        const res = await fetch('/api/grievances', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                citizen_id,
                dept_id,
                category_id,
                priority,
                ward_no,
                title,
                description,
                location_address,
                pincode,
                has_attachment
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(`✅ Grievance registered successfully!\nYour Tracking Ticket Number is: ${data.ticket_number}`);
            document.getElementById('title-input').value = '';
            document.getElementById('desc-input').value = '';
            handleCitizenChange();
            trackGrievance(data.ticket_number);
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (err) {
        alert('Server communication error: ' + err.message);
    }
}

// -----------------------------------------------------------------------------
// LIVE TRACKER
// -----------------------------------------------------------------------------
async function trackGrievance(ticketNumber) {
    switchTab('tab-tracker');
    document.getElementById('tracker-input').value = ticketNumber;

    try {
        const res = await fetch(`/api/grievances/${ticketNumber}`);
        const g = await res.json();

        if (!res.ok) {
            alert(g.error || 'Ticket not found');
            return;
        }

        document.getElementById('tracker-result').style.display = 'block';
        document.getElementById('track-ticket-no').textContent = g.ticket_number;
        document.getElementById('track-title').textContent = g.title;
        document.getElementById('track-desc').textContent = `${g.description} — Location: ${g.location_address}, Ward ${g.ward_no}`;
        document.getElementById('track-officer').textContent = g.assigned_officer_name;
        document.getElementById('track-dept').textContent = `${g.dept_name} (${g.dept_code})`;
        document.getElementById('track-deadline').textContent = `Target SLA: ${new Date(g.sla_deadline).toLocaleString()}`;

        // Badges
        const statusBadge = document.getElementById('track-status-badge');
        statusBadge.className = `badge badge-${g.status.toLowerCase().replace(' ', '')}`;
        statusBadge.textContent = g.status;

        const priorityBadge = document.getElementById('track-priority-badge');
        priorityBadge.className = `badge badge-${g.priority.toLowerCase()}`;
        priorityBadge.textContent = `${g.priority} Priority`;

        const slaBadge = document.getElementById('track-sla-badge');
        if (g.sla_status === 'Breached') {
            slaBadge.className = 'badge badge-urgent';
            slaBadge.textContent = '🚨 SLA Overdue';
        } else {
            slaBadge.className = 'badge badge-ontrack';
            slaBadge.textContent = '⏱️ On Track';
        }

        // Stepper Timeline
        const timelineDiv = document.getElementById('track-timeline');
        timelineDiv.innerHTML = '';

        if (g.timeline && g.timeline.length > 0) {
            g.timeline.forEach((step, idx) => {
                const isLast = idx === g.timeline.length - 1;
                const stepEl = document.createElement('div');
                stepEl.className = 'step-item';

                let dotClass = 'step-dot';
                if (step.new_status === 'Resolved') dotClass += ' resolved';
                else if (isLast) dotClass += ' active';

                stepEl.innerHTML = `
                    <div class="${dotClass}"></div>
                    <div class="step-content">
                        <div class="step-header">
                            <div>
                                <span class="step-actor">${step.changed_by_name} (${step.changed_by_type})</span>
                                <span class="badge badge-${step.new_status.toLowerCase().replace(' ', '')}" style="margin-left:0.5rem;">
                                    ${step.new_status}
                                </span>
                            </div>
                            <div>${new Date(step.timestamp).toLocaleString()}</div>
                        </div>
                        <div class="step-remarks">${step.remarks}</div>
                    </div>
                `;
                timelineDiv.appendChild(stepEl);
            });
        }

        // Action Buttons
        const actionsDiv = document.getElementById('tracker-actions');
        actionsDiv.innerHTML = '';

        if (g.status === 'Resolved') {
            if (g.citizen_rating) {
                actionsDiv.innerHTML = `
                    <div style="background:#fef3c7; padding:0.75rem 1rem; border-radius:var(--radius); border:1px solid #fde68a; width:100%;">
                        <strong>⭐ Citizen Feedback on Record:</strong> ${g.citizen_rating} / 5 Stars (${g.satisfaction_level})
                        ${g.feedback_comments ? `<div style="font-style:italic; font-size:0.88rem; margin-top:0.25rem;">"${g.feedback_comments}"</div>` : ''}
                    </div>
                `;
            } else {
                actionsDiv.innerHTML = `
                    <button class="btn btn-accent" onclick="openFeedbackModal(${g.grievance_id}, '${g.ticket_number}')">
                        ⭐ Rate & Submit Feedback for Resolution
                    </button>
                `;
            }
        } else {
            actionsDiv.innerHTML = `
                <button class="btn btn-primary" onclick="openUpdateStatusModal(${g.grievance_id}, '${g.ticket_number}', '${g.status}', '${g.assigned_officer_name}')">
                    ✏️ Officer Action / Update Status
                </button>
                <button class="btn" style="background:#ef4444; color:#ffffff;" onclick="openEscalateModal(${g.grievance_id}, '${g.ticket_number}', '${g.citizen_name}')">
                    ⚠️ Escalate to Senior Municipal Authority
                </button>
            `;
        }
    } catch (err) {
        console.error('Error tracking grievance:', err);
    }
}

// -----------------------------------------------------------------------------
// OFFICER & DEPARTMENT CONSOLE
// -----------------------------------------------------------------------------
async function loadOfficerQueue() {
    const deptId = document.getElementById('filter-dept').value;
    const status = document.getElementById('filter-status').value;

    let url = '/api/grievances?';
    if (deptId) url += `dept_id=${deptId}&`;
    if (status) url += `status=${status}&`;

    try {
        const res = await fetch(url);
        const grievances = await res.json();
        const tbody = document.getElementById('officer-queue-body');
        tbody.innerHTML = '';

        if (grievances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No grievances match this filter criteria.</td></tr>';
            return;
        }

        grievances.forEach(g => {
            const tr = document.createElement('tr');
            const statusClass = `badge-${g.status.toLowerCase().replace(' ', '')}`;
            const prioClass = `badge-${g.priority.toLowerCase()}`;
            const slaBadge = g.sla_status === 'Breached' ? '<span class="badge badge-urgent">Breached</span>' : '<span class="badge badge-ontrack">OK</span>';

            tr.innerHTML = `
                <td><strong>${g.ticket_number}</strong></td>
                <td>${g.citizen_name}<br><small style="color:var(--text-muted)">Ward ${g.ward_no}</small></td>
                <td>${dCodeBadge(g.dept_code)}</td>
                <td>${g.category_name}</td>
                <td><span class="badge ${prioClass}">${g.priority}</span></td>
                <td><span class="badge ${statusClass}">${g.status}</span></td>
                <td>${slaBadge}</td>
                <td>${g.assigned_officer_name}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="trackGrievance('${g.ticket_number}')">View</button>
                    ${g.status !== 'Resolved' ? `
                        <button class="btn btn-primary btn-sm" onclick="openUpdateStatusModal(${g.grievance_id}, '${g.ticket_number}', '${g.status}', '${g.assigned_officer_name}')">
                            Action
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading officer queue:', err);
    }
}

function dCodeBadge(code) {
    return `<span style="font-weight:700; color:var(--primary);">${code}</span>`;
}

async function loadOfficerRoster() {
    try {
        const res = await fetch('/api/officers');
        const officers = await res.json();
        const tbody = document.getElementById('officers-table-body');
        tbody.innerHTML = '';

        officers.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${o.officer_id}</td>
                <td><strong>${o.officer_name}</strong></td>
                <td>${o.designation}</td>
                <td>${o.dept_name}</td>
                <td>${o.total_assigned}</td>
                <td><span class="badge badge-inprogress">${o.active_cases}</span></td>
                <td><span class="badge badge-resolved">${o.resolved_cases}</span></td>
                <td>${o.sla_breached_cases > 0 ? `<span class="badge badge-urgent">${o.sla_breached_cases}</span>` : '<span class="badge badge-ontrack">0</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading officer roster:', err);
    }
}

// -----------------------------------------------------------------------------
// MODALS MANAGEMENT
// -----------------------------------------------------------------------------
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function openUpdateStatusModal(id, ticket, currentStatus, officerName) {
    document.getElementById('modal-status-id').value = id;
    document.getElementById('modal-status-ticket').textContent = ticket;
    document.getElementById('modal-status-select').value = currentStatus === 'Submitted' ? 'In Progress' : currentStatus;
    if (officerName && officerName !== 'Unassigned') {
        document.getElementById('modal-officer-name').value = officerName;
    }
    openModal('modal-update-status');
}

async function handleStatusSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('modal-status-id').value;
    const status = document.getElementById('modal-status-select').value;
    const changed_by_name = document.getElementById('modal-officer-name').value;
    const remarks = document.getElementById('modal-status-remarks').value;

    try {
        const res = await fetch(`/api/grievances/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, remarks, changed_by_name, changed_by_type: 'Officer' })
        });
        const data = await res.json();
        if (res.ok) {
            closeModal('modal-update-status');
            alert(data.message);
            const ticket = document.getElementById('modal-status-ticket').textContent;
            trackGrievance(ticket);
            loadOfficerQueue();
            loadOfficerRoster();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Server communication error: ' + err.message);
    }
}

function initModalStars() {
    const stars = document.querySelectorAll('#modal-stars .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-star'));
            document.getElementById('modal-rating-val').value = val;
            stars.forEach((s, idx) => {
                if (idx < val) s.classList.add('filled');
                else s.classList.remove('filled');
            });
            const labels = {
                5: 'Highly Satisfied (5 Stars)',
                4: 'Satisfied (4 Stars)',
                3: 'Neutral (3 Stars)',
                2: 'Dissatisfied (2 Stars)',
                1: 'Highly Dissatisfied (1 Star)'
            };
            document.getElementById('modal-rating-label').textContent = labels[val];
        });
    });
}

function openFeedbackModal(id, ticket) {
    document.getElementById('modal-feedback-id').value = id;
    document.getElementById('modal-feedback-ticket').textContent = ticket;
    openModal('modal-feedback');
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('modal-feedback-id').value;
    const rating = parseInt(document.getElementById('modal-rating-val').value);
    const comments = document.getElementById('modal-feedback-comments').value;

    const satisfaction_level = rating >= 4 ? 'Highly Satisfied' : (rating === 3 ? 'Neutral' : 'Dissatisfied');

    try {
        const res = await fetch(`/api/grievances/${id}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comments, satisfaction_level })
        });
        const data = await res.json();
        if (res.ok) {
            closeModal('modal-feedback');
            alert(data.message);
            const ticket = document.getElementById('modal-feedback-ticket').textContent;
            trackGrievance(ticket);
            loadDashboard();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Server error: ' + err.message);
    }
}

function openEscalateModal(id, ticket, citizenName) {
    document.getElementById('modal-escalate-id').value = id;
    document.getElementById('modal-escalate-ticket').textContent = ticket;
    if (citizenName) document.getElementById('modal-escalate-name').value = citizenName;
    openModal('modal-escalate');
}

async function handleEscalateSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('modal-escalate-id').value;
    const reason = document.getElementById('modal-escalate-reason').value;
    const escalated_by_name = document.getElementById('modal-escalate-name').value;

    try {
        const res = await fetch(`/api/grievances/${id}/escalate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, escalated_by_name })
        });
        const data = await res.json();
        if (res.ok) {
            closeModal('modal-escalate');
            alert(data.message);
            const ticket = document.getElementById('modal-escalate-ticket').textContent;
            trackGrievance(ticket);
            loadOfficerQueue();
            loadOfficerRoster();
            loadDashboard();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Server error: ' + err.message);
    }
}

// -----------------------------------------------------------------------------
// SQL VIVA CONSOLE
// -----------------------------------------------------------------------------
async function loadPredefinedQueries() {
    try {
        const res = await fetch('/api/queries');
        const queries = await res.json();
        const chipsContainer = document.getElementById('query-chips');
        chipsContainer.innerHTML = '';

        queries.forEach((q, idx) => {
            const chip = document.createElement('button');
            chip.className = 'preset-chip' + (idx === 0 ? ' active' : '');
            chip.textContent = `${q.id}. ${q.title}`;
            chip.title = q.description;
            chip.addEventListener('click', () => {
                document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                document.getElementById('sql-editor').value = q.sql;
                document.getElementById('query-cat-label').textContent = `${q.category} — ${q.description}`;
                executeCustomQuery();
            });
            chipsContainer.appendChild(chip);
        });

        // Run default query
        if (queries.length > 0) {
            document.getElementById('sql-editor').value = queries[0].sql;
            document.getElementById('query-cat-label').textContent = `${queries[0].category} — ${queries[0].description}`;
            executeCustomQuery();
        }
    } catch (err) {
        console.error('Error loading queries:', err);
    }
}

async function executeCustomQuery() {
    const sql = document.getElementById('sql-editor').value.trim();
    const statusInfo = document.getElementById('query-status-info');
    statusInfo.textContent = 'Executing...';
    statusInfo.style.color = '#38bdf8';

    try {
        const res = await fetch('/api/run-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql })
        });
        const data = await res.json();

        if (!res.ok) {
            statusInfo.textContent = `Error: ${data.error}`;
            statusInfo.style.color = '#ef4444';
            return;
        }

        statusInfo.textContent = `Returned ${data.rowCount} rows in ${data.durationMs}ms`;
        statusInfo.style.color = '#10b981';

        // Render Head
        const thead = document.getElementById('sql-result-head');
        thead.innerHTML = '';
        const trHead = document.createElement('tr');
        data.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Render Body
        const tbody = document.getElementById('sql-result-body');
        tbody.innerHTML = '';

        if (data.rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${data.columns.length || 1}" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Query executed successfully. 0 rows returned.</td></tr>`;
            return;
        }

        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            data.columns.forEach(col => {
                const td = document.createElement('td');
                const val = row[col];
                td.textContent = (val === null || val === undefined) ? 'NULL' : val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (err) {
        statusInfo.textContent = 'Execution failed: ' + err.message;
        statusInfo.style.color = '#ef4444';
    }
}
