-- ====================================================================================================
-- DBMS COURSE PROJECT: PUBLIC GRIEVANCE REGISTRATION AND RESOLUTION SYSTEM
-- Student: KATTA LIKITH SAI | Roll No: 251FA18379 | S.No: 41
-- Sample Seed Data (DML)
-- ====================================================================================================

-- 1. Insert Municipal & Civic Departments
INSERT INTO departments (dept_id, dept_code, dept_name, contact_email, helpline_number, head_officer_name, sla_days_default) VALUES
(1, 'PWD',  'Public Works Department (Roads & Bridges)', 'pwd.grievance@citygov.in', '1800-111-2001', 'Er. Rajesh Varma', 5),
(2, 'WSB',  'Water Supply & Sewerage Board',              'water.board@citygov.in',   '1800-111-2002', 'Er. M. Srinivas Rao', 3),
(3, 'ELEC', 'City Electricity Supply Corporation',       'electricity@citygov.in',   '1800-111-2003', 'Dr. Sunita Sharma', 2),
(4, 'SWM',  'Solid Waste Management & Sanitation',        'waste.sanitation@citygov.in','1800-111-2004', 'Sri. Anand Kulkarni', 2),
(5, 'HLTH', 'Public Health & Disease Prevention',         'health.dept@citygov.in',   '1800-111-2005', 'Dr. Ramesh Babu', 4),
(6, 'TRN',  'Urban Transport & Traffic Infrastructure',   'transport@citygov.in',     '1800-111-2006', 'Smt. Kavitha Reddy', 7);

-- 2. Insert Categories
INSERT INTO categories (category_id, dept_id, category_name, sla_days, description) VALUES
-- PWD
(1,  1, 'Potholes & Broken Asphalt', 3, 'Deep road craters, broken road surfaces creating road hazards'),
(2,  1, 'Unfinished Footpath & Manhole Cover Missing', 2, 'Hazardous open manholes or broken pavement pedestrian paths'),
(3,  1, 'Storm Water Drain Wall Collapse', 5, 'Damaged structural walls of roadside storm water drainage'),
-- WSB
(4,  2, 'Drinking Water Contamination / Murky Water', 1, 'Brown, foul-smelling, or sedimented municipal tap water'),
(5,  2, 'Pipeline Leakage / Burst Main Line', 2, 'Severe clean water loss or road flooding due to broken supply pipes'),
(6,  2, 'Low Water Pressure / Irregular Supply Timing', 4, 'Insufficient water pressure during morning municipal supply hours'),
-- ELEC
(7,  3, 'Streetlight Non-functional', 2, 'Dark residential or main streets due to faulty sodium/LED fixtures'),
(8,  3, 'Distribution Transformer Sparking / Fault', 1, 'Frequent power cut, transformer overheating or sparking wires'),
(9,  3, 'Dangling Overhead Power Cables', 1, 'Hazardous loose high/low tension cables within pedestrian reach'),
-- SWM
(10, 4, 'Garbage Dump Overflow & Foul Odor', 2, 'Uncleared dumper bins attracting stray animals and pests'),
(11, 4, 'Door-to-Door Waste Collection Skipped', 3, 'Municipal waste collection vehicle missed route for 2+ days'),
(12, 4, 'Illegal Debris / Construction Waste Dumping', 4, 'Dumping of demolition debris in vacant plots or roadsides'),
-- HLTH
(13, 5, 'Mosquito Fogging & Dengue Larva Prevention', 3, 'Stagnant water pools requiring anti-larval chemical spray'),
(14, 5, 'Stray Animal Menace & Animal Control', 5, 'Aggressive packs of stray dogs or cattle blocking roadways'),
-- TRN
(15, 6, 'Traffic Signal Malfunction at Junction', 1, 'Stuck or non-blinking red/green signal lamps causing gridlock'),
(16, 6, 'Missing Bus Shelter & Signboard', 7, 'Damaged or missing commuter sheds at designated city bus stops');

-- 3. Insert Officers
-- Notice self-referencing supervisor hierarchy:
-- Er. Rajesh Varma (Chief PWD - id 1) oversees Assistant Engineer Arjun (id 2)
-- Dr. Sunita Sharma (Chief ELEC - id 5) oversees Line Inspector Venkat (id 6)
INSERT INTO officers (officer_id, dept_id, full_name, email, phone, designation, supervisor_id, password_hash, is_active) VALUES
(1,  1, 'Er. Rajesh Varma',       'rajesh.varma@citygov.in',   '9848011001', 'Superintending Engineer', NULL, 'hash_pass123', 1),
(2,  1, 'Arjun Reddy',            'arjun.reddy@citygov.in',    '9848011002', 'Assistant Executive Engineer', 1, 'hash_pass123', 1),
(3,  2, 'Er. M. Srinivas Rao',    'srinivas.rao@citygov.in',   '9848011003', 'Chief Water Works Engineer', NULL, 'hash_pass123', 1),
(4,  2, 'P. Divya',               'divya.p@citygov.in',        '9848011004', 'Water Distribution Inspector', 3, 'hash_pass123', 1),
(5,  3, 'Dr. Sunita Sharma',      'sunita.sharma@citygov.in',  '9848011005', 'Chief Electrical Inspector', NULL, 'hash_pass123', 1),
(6,  3, 'K. Venkat Ramana',       'venkat.ramana@citygov.in',  '9848011006', 'Assistant Line Inspector', 5, 'hash_pass123', 1),
(7,  4, 'Sri. Anand Kulkarni',    'anand.kulkarni@citygov.in', '9848011007', 'Sanitary Superintendent', NULL, 'hash_pass123', 1),
(8,  4, 'B. Suresh Kumar',        'suresh.kumar@citygov.in',   '9848011008', 'Ward Sanitary Inspector', 7, 'hash_pass123', 1),
(9,  5, 'Dr. Ramesh Babu',        'ramesh.babu@citygov.in',    '9848011009', 'District Medical & Health Officer', NULL, 'hash_pass123', 1),
(10, 6, 'Smt. Kavitha Reddy',     'kavitha.reddy@citygov.in',  '9848011010', 'Regional Transport Manager', NULL, 'hash_pass123', 1);

-- 4. Insert Citizens
INSERT INTO citizens (citizen_id, full_name, email, phone, password_hash, address, ward_no, pincode) VALUES
(1,  'Katta Likith Sai',     'likith.sai@gmail.com',       '9849012345', 'hash_likith123', 'Flat 402, Sai Residency, Main Road', 12, '522002'),
(2,  'Pranathi V.',          'pranathi.v@gmail.com',       '9849012346', 'hash_pass123',   'H.No 3-45/1, Temple Street', 12, '522002'),
(3,  'Venkatesh Naidu',      'venkatesh.n@gmail.com',      '9849012347', 'hash_pass123',   'Plot 88, Green Meadows Colony', 14, '522006'),
(4,  'Ananya Mohan',         'ananya.m@gmail.com',         '9849012348', 'hash_pass123',   'Door 12-1-4, Bus Stand Road', 7, '522001'),
(5,  'Rohit Verma',          'rohit.verma@gmail.com',      '9849012349', 'hash_pass123',   'Block C-12, Rajiv Nagar', 18, '522019'),
(6,  'Deepika Sundaram',     'deepika.s@gmail.com',        '9849012350', 'hash_pass123',   '8-3-228, Ashok Nagar', 5, '522003'),
(7,  'Mohammed Tariq',       'tariq.m@gmail.com',          '9849012351', 'hash_pass123',   'Old Market Street, Near Clock Tower', 3, '522001'),
(8,  'Sneha Bhattacharya',   'sneha.b@gmail.com',          '9849012352', 'hash_pass123',   'Villa 19, Lotus Enclave', 14, '522006'),
(9,  'Narasimha Murthy',     'nmurthy@gmail.com',          '9849012353', 'hash_pass123',   'B-40, Housing Board Colony', 9, '522004'),
(10, 'Pooja Agarwal',        'pooja.a@gmail.com',          '9849012354', 'hash_pass123',   'Flat 101, Krishna Towers, Station Road', 7, '522001');

-- 5. Insert Grievances
INSERT INTO grievances (grievance_id, ticket_number, citizen_id, dept_id, category_id, assigned_officer_id, title, description, location_address, ward_no, pincode, priority, status, sla_deadline, resolved_at, escalated_flag, created_at) VALUES
(1, 'PGR-2026-1001', 1, 1, 1, 2, 'Hazardous deep pothole opposite SBI Branch', 
    'A huge crater developed after the rain opposite State Bank. Two two-wheelers skidded yesterday. Immediate asphalt repair requested.', 
    'Opposite SBI, Main Road, Ward 12', 12, '522002', 'High', 'Resolved', 
    datetime('now', '-5 days'), datetime('now', '-3 days'), 0, datetime('now', '-8 days')),

(2, 'PGR-2026-1002', 1, 2, 4, 4, 'Muddy drinking water supply in Sai Residency', 
    'Since yesterday morning, tap water is turbid with dirt smell. Contaminated water cannot be used for cooking or drinking.', 
    'Flat 402, Sai Residency, Ward 12', 12, '522002', 'Urgent', 'In Progress', 
    datetime('now', '+1 day'), NULL, 0, datetime('now', '-1 day')),

(3, 'PGR-2026-1003', 2, 4, 10, 8, 'Garbage bin overflowing for three days near Temple', 
    'Municipal dumper bin has not been cleared since Tuesday. Stray animals are scattering plastic waste on road.', 
    'Near Ganapathi Temple, Ward 12', 12, '522002', 'Medium', 'Resolved', 
    datetime('now', '-2 days'), datetime('now', '-1 day'), 0, datetime('now', '-4 days')),

(4, 'PGR-2026-1004', 3, 3, 7, 6, 'Streetlights out in entire Lane 4 Green Meadows', 
    'All five poles on lane 4 are off. Total darkness makes night walking unsafe for elderly residents and women.', 
    'Lane 4, Green Meadows Colony, Ward 14', 14, '522006', 'Medium', 'Assigned', 
    datetime('now', '+2 days'), NULL, 0, datetime('now', '-1 day')),

(5, 'PGR-2026-1005', 4, 1, 2, 2, 'Uncovered deep manhole near Primary School', 
    'Iron grating missing from storm manhole right next to the municipal primary school gate. Very dangerous for children.', 
    'Opposite Govt Primary School, Bus Stand Road', 7, '522001', 'Urgent', 'In Progress', 
    datetime('now', '-1 day'), NULL, 1, datetime('now', '-3 days')), -- SLA breached / escalated

(6, 'PGR-2026-1006', 5, 2, 5, 4, 'Major water pipeline rupture on Rajiv Nagar 60ft Road', 
    'High pressure underground line fractured, water gushing onto the road causing localized flooding and water loss.', 
    'Near Water Tank, Rajiv Nagar', 18, '522019', 'Urgent', 'Resolved', 
    datetime('now', '-4 days'), datetime('now', '-4 days', '+6 hours'), 0, datetime('now', '-5 days')),

(7, 'PGR-2026-1007', 6, 5, 13, 9, 'Heavy mosquito swarm, stagnant pond fogging needed', 
    'Vacant plot contains accumulated rainwater. Dengue cases reported in neighbor house. Immediate chemical fogging needed.', 
    'Ashok Nagar 3rd Cross', 5, '522003', 'High', 'Submitted', 
    datetime('now', '+3 days'), NULL, 0, datetime('now', '-4 hours')),

(8, 'PGR-2026-1008', 7, 6, 15, 10, 'Clock Tower junction traffic signal stuck on Yellow', 
    'Automatic timer failed at key 4-way intersection. Heavy traffic jam during peak morning hours.', 
    'Clock Tower Circle, Ward 3', 3, '522001', 'High', 'Resolved', 
    datetime('now', '-6 days'), datetime('now', '-6 days', '+4 hours'), 0, datetime('now', '-7 days')),

(9, 'PGR-2026-1009', 8, 3, 8, 6, 'Distribution Transformer sparking with sparks falling on cars', 
    'Pole-mounted transformer on Lotus Enclave Gate 2 making loud buzzing noises and intermittent fireworks sparks.', 
    'Gate 2, Lotus Enclave, Ward 14', 14, '522006', 'Urgent', 'In Progress', 
    datetime('now', '+1 day'), NULL, 0, datetime('now', '-6 hours')),

(10, 'PGR-2026-1010', 9, 4, 12, 8, 'Illegal dumping of demolition concrete debris on road shoulder', 
    'Tractor dumped building concrete waste blocking half the motorable lane.', 
    'Opposite Community Hall, Housing Board', 9, '522004', 'Low', 'Assigned', 
    datetime('now', '+4 days'), NULL, 0, datetime('now', '-12 hours')),

(11, 'PGR-2026-1011', 10, 6, 16, 10, 'Broken tin roof on Station Road City Bus stop', 
    'Monsoon winds blew away sheet roofing of bus shelter. Commuters getting drenched in rain.', 
    'Railway Station Bus Stop, Ward 7', 7, '522001', 'Medium', 'Under Review', 
    datetime('now', '+6 days'), NULL, 0, datetime('now', '-1 day')),

(12, 'PGR-2026-1012', 3, 2, 6, 4, 'No municipal water supply for two consecutive days', 
    'Water supply was shut off with no prior announcement. Overhead community tanks are empty.', 
    'Green Meadows Sector 2', 14, '522006', 'High', 'Resolved', 
    datetime('now', '-10 days'), datetime('now', '-9 days'), 0, datetime('now', '-12 days')),

(13, 'PGR-2026-1013', 2, 5, 14, 9, 'Pack of stray dogs attacking delivery cyclists', 
    'Five aggressive stray dogs chasing pedestrians and two-wheelers in evening hours.', 
    'Ward 12, Temple Backstreet', 12, '522002', 'Medium', 'In Progress', 
    datetime('now', '-2 days'), NULL, 1, datetime('now', '-6 days')), -- Overdue

(14, 'PGR-2026-1014', 4, 4, 11, 8, 'Sanitation truck skipped door-to-door pickup for 4 days', 
    'Green waste collection e-rickshaw has not visited Ward 7 lane 3.', 
    'Door 12-1-4, Ward 7', 7, '522001', 'Medium', 'Resolved', 
    datetime('now', '-7 days'), datetime('now', '-6 days'), 0, datetime('now', '-9 days')),

(15, 'PGR-2026-1015', 1, 3, 9, 6, 'Sagging electricity cable hanging at 7 feet height', 
    'Power line slipped from insulator clamp and hangs right across residential street.', 
    'Sai Residency Crossroad, Ward 12', 12, '522002', 'Urgent', 'Resolved', 
    datetime('now', '-15 days'), datetime('now', '-15 days', '+3 hours'), 0, datetime('now', '-16 days'));

-- 6. Insert Timeline History
INSERT INTO grievance_timeline (grievance_id, changed_by_type, changed_by_name, old_status, new_status, remarks, timestamp) VALUES
-- Timeline for PGR-2026-1001 (Pothole - Resolved)
(1, 'System',  'Automated Dispatch', 'Submitted', 'Assigned', 'Assigned to Assistant Executive Engineer Arjun Reddy based on Ward 12 jurisdiction.', datetime('now', '-8 days', '+1 hour')),
(1, 'Officer', 'Arjun Reddy',         'Assigned', 'In Progress', 'Site inspected. Road patch crew with cold mix asphalt dispatched.', datetime('now', '-7 days')),
(1, 'Officer', 'Arjun Reddy',         'In Progress', 'Resolved', 'Pothole filled and compacted. Road leveled. Reopened for traffic.', datetime('now', '-3 days')),

-- Timeline for PGR-2026-1002 (Muddy water - In Progress)
(2, 'System',  'Automated Dispatch', 'Submitted', 'Assigned', 'Assigned to Water Distribution Inspector P. Divya.', datetime('now', '-1 day', '+30 minutes')),
(2, 'Officer', 'P. Divya',           'Assigned', 'In Progress', 'Water sample collected for turbidity & chlorine test. Flushing pipeline from distribution valve #4.', datetime('now', '-8 hours')),

-- Timeline for PGR-2026-1003 (Garbage - Resolved)
(3, 'System',  'Automated Dispatch', 'Submitted', 'Assigned', 'Assigned to Ward Sanitary Inspector B. Suresh Kumar.', datetime('now', '-4 days', '+1 hour')),
(3, 'Officer', 'B. Suresh Kumar',    'Assigned', 'In Progress', 'Compactor vehicle #AP07-TY-102 dispatched for bulk lift.', datetime('now', '-3 days')),
(3, 'Officer', 'B. Suresh Kumar',    'In Progress', 'Resolved', 'Bin cleared, lime powder sprayed around location to kill foul odor.', datetime('now', '-1 day')),

-- Timeline for PGR-2026-1005 (Manhole - Escalated)
(5, 'System',  'Automated Dispatch', 'Submitted', 'Assigned', 'Assigned to Arjun Reddy.', datetime('now', '-3 days', '+30 minutes')),
(5, 'Officer', 'Arjun Reddy',         'Assigned', 'In Progress', 'Barricade placed around open manhole. Procurement of concrete circular slab initiated.', datetime('now', '-2 days')),
(5, 'System',  'SLA Monitor Daemon',  'In Progress', 'In Progress', 'WARNING: SLA deadline exceeded. Escalation alert dispatched to Superintending Engineer Er. Rajesh Varma.', datetime('now', '-1 day')),

-- Timeline for PGR-2026-1006 (Burst main - Resolved)
(6, 'Officer', 'P. Divya',           'Submitted', 'In Progress', 'Emergency crew shut off feeder valve. Earthmover deployed for excavation.', datetime('now', '-5 days', '+1 hour')),
(6, 'Officer', 'P. Divya',           'In Progress', 'Resolved', 'Broken 8-inch cast iron pipe replaced with ductile iron section. Pressure restored.', datetime('now', '-4 days', '+6 hours')),

-- Timeline for PGR-2026-1008 (Traffic Signal - Resolved)
(8, 'Officer', 'Smt. Kavitha Reddy', 'Assigned', 'Resolved', 'Signal motherboard reset and optical sensor replaced by technical maintenance team.', datetime('now', '-6 days', '+4 hours')),

-- Timeline for PGR-2026-1013 (Stray dogs - Breached)
(13, 'System', 'SLA Monitor Daemon', 'In Progress', 'In Progress', 'SLA Breached by 48 hours. Ticket escalated to District Medical Officer.', datetime('now', '-1 day')),

-- Timeline for PGR-2026-1015 (Sagging Cable - Resolved)
(15, 'Officer', 'K. Venkat Ramana',   'Assigned', 'In Progress', 'Power supply isolated on feeder 2.', datetime('now', '-16 days', '+1 hour')),
(15, 'Officer', 'K. Venkat Ramana',   'In Progress', 'Resolved', 'Cable re-tensioned and new insulator clamp installed. Power restored safely.', datetime('now', '-15 days', '+3 hours'));

-- 7. Insert Attachments
INSERT INTO grievance_attachments (grievance_id, file_name, file_path, file_size_kb, file_type, uploaded_at) VALUES
(1, 'pothole_photo_ward12.jpg', '/uploads/evidence_pgr1001_1.jpg', 245, 'image/jpeg', datetime('now', '-8 days')),
(2, 'murky_tap_water_sample.png', '/uploads/evidence_pgr1002_1.png', 512, 'image/png', datetime('now', '-1 day')),
(5, 'open_manhole_near_school.jpg', '/uploads/evidence_pgr1005_1.jpg', 320, 'image/jpeg', datetime('now', '-3 days')),
(6, 'pipeline_burst_flooding.jpg', '/uploads/evidence_pgr1006_1.jpg', 840, 'image/jpeg', datetime('now', '-5 days')),
(9, 'transformer_sparking.mp4', '/uploads/evidence_pgr1009_1.mp4', 2400, 'video/mp4', datetime('now', '-6 hours'));

-- 8. Insert Feedback & Ratings (for resolved grievances)
INSERT INTO grievance_feedback (grievance_id, citizen_id, rating, satisfaction_level, comments, submitted_at) VALUES
(1, 1, 5, 'Highly Satisfied', 'Prompt action by PWD team! Pothole was repaired within 48 hours. Good asphalt finish.', datetime('now', '-2 days')),
(3, 2, 4, 'Satisfied', 'Garbage was cleared and lime powder was sprinkled. Please ensure daily pickup.', datetime('now', '-1 day')),
(6, 5, 5, 'Highly Satisfied', 'Extremely quick emergency response. Repaired the pipe within 6 hours. Appreciate the diligence.', datetime('now', '-3 days')),
(8, 7, 5, 'Highly Satisfied', 'Traffic signal was fixed the same day. Morning jam relieved.', datetime('now', '-5 days')),
(12, 3, 3, 'Neutral', 'Water supply restored after delay, but prior alert SMS should have been sent to residents.', datetime('now', '-8 days')),
(14, 4, 4, 'Satisfied', 'Sanitation truck restarted routine pickup from next morning. Thank you.', datetime('now', '-5 days')),
(15, 1, 5, 'Highly Satisfied', 'Dangerous live wire was rectified within 3 hours. Exemplary work by Electricity Corporation.', datetime('now', '-14 days'));

-- 9. Insert Escalations
INSERT INTO escalations (grievance_id, escalated_to_officer_id, escalation_level, escalation_reason, status, escalated_at) VALUES
(5, 1, 1, 'SLA Breached: Critical hazard (uncovered manhole near school) pending over 48 hours without closure.', 'Active', datetime('now', '-1 day')),
(13, 9, 2, 'SLA Breached: Animal control unit failed to capture aggressive pack within 5-day window.', 'Active', datetime('now', '-12 hours'));
