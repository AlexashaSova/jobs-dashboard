-- Завантаження v2.
-- Повторний запуск безпечний: таблиці очищуються на початку.

TRUNCATE TABLE jobs.postings_raw;
TRUNCATE TABLE jobs.job_skills;
TRUNCATE TABLE jobs.skills_map;
TRUNCATE TABLE jobs.job_industries;
TRUNCATE TABLE jobs.industries_map;
TRUNCATE TABLE jobs.benefits;
TRUNCATE TABLE jobs.companies;
TRUNCATE TABLE jobs.postings;


-- ================= СИРИЙ ШАР =================

INSERT INTO jobs.postings_raw
SELECT
    job_id,
    company_id,
    company_name,
    title,
    description,
    skills_desc,
    location,
    min_salary,
    med_salary,
    max_salary,
    pay_period,
    currency,
    formatted_work_type,
    formatted_experience_level,
    remote_allowed,
    application_type,
    sponsored,
    views,
    applies,
    original_listed_time,
    expiry
FROM file('raw/postings.csv', 'CSVWithNames');

INSERT INTO jobs.job_skills
SELECT job_id, skill_abr
FROM file('raw/jobs/job_skills.csv', 'CSVWithNames');

INSERT INTO jobs.skills_map
SELECT skill_abr, skill_name
FROM file('raw/mappings/skills.csv', 'CSVWithNames');

INSERT INTO jobs.job_industries
SELECT job_id, industry_id
FROM file('raw/jobs/job_industries.csv', 'CSVWithNames');

INSERT INTO jobs.industries_map
SELECT industry_id, industry_name
FROM file('raw/mappings/industries.csv', 'CSVWithNames');

INSERT INTO jobs.benefits
SELECT job_id, inferred, type
FROM file('raw/jobs/benefits.csv', 'CSVWithNames');

INSERT INTO jobs.companies
SELECT company_id, name, company_size, state, country, city
FROM file('raw/companies/companies.csv', 'CSVWithNames');


-- ================= ВІТРИНА =================
-- Навички, індустрії та бенефіти спочатку згортаємо
-- в масиви по job_id окремими підзапитами (1 рядок на
-- вакансію) і лише потім приєднуємо. Якби ми робили
-- три JOIN одразу, рядки перемножувались би.

INSERT INTO jobs.postings
WITH
    -- базова зарплата: медіана, або середина вилки,
    -- або хоча б одна межа
    coalesce(
        p.med_salary,
        (p.min_salary + p.max_salary) / 2,
        p.min_salary,
        p.max_salary
    ) AS base_salary,
    -- множник для приведення до року
    multiIf(
        p.pay_period = 'YEARLY',   1,
        p.pay_period = 'MONTHLY',  12,
        p.pay_period = 'BIWEEKLY', 26,
        p.pay_period = 'WEEKLY',   52,
        p.pay_period = 'HOURLY',   2080,
        NULL
    ) AS k,
    -- відсікаємо сміття: не USD, менше 10k або більше 1M
    if(
        p.currency = 'USD'
        AND base_salary * k BETWEEN 10000 AND 1000000,
        base_salary * k,
        NULL
    ) AS salary_year_clean,
    lower(p.title) AS t
SELECT
    p.job_id,
    p.title,
    multiIf(
        match(t, 'nurse|\\brn\\b|physician|medical|clinical|therap|pharmac|dental|health|caregiver|patient'),
            'Healthcare',
        match(t, 'data (scientist|analyst|engineer)|machine learning|analytics|statistic|\\bbi\\b'),
            'Data & Analytics',
        match(t, 'software|developer|engineer|devops|programmer|architect|\\bsre\\b|\\bqa\\b|cloud|\\bit\\b|cyber|network'),
            'Engineering & IT',
        match(t, 'sales|account executive|business development|account manager'),
            'Sales',
        match(t, 'marketing|\\bseo\\b|content|brand|social media|communications|growth'),
            'Marketing',
        match(t, 'accountant|accounting|financ|controller|auditor|\\btax\\b|bookkeep|payroll|treasury|banker'),
            'Finance & Accounting',
        match(t, 'recruit|talent|human resources|\\bhr\\b|people operations'),
            'HR & Recruiting',
        match(t, 'driver|warehouse|logistic|supply chain|forklift|delivery|dispatcher|shipping'),
            'Logistics & Warehouse',
        match(t, 'customer|support|call center|service representative|help desk'),
            'Customer Support',
        match(t, 'teacher|instructor|professor|tutor|education|faculty'),
            'Education',
        match(t, 'attorney|lawyer|legal|paralegal|counsel|compliance'),
            'Legal & Compliance',
        match(t, 'design|\\bux\\b|\\bui\\b|creative|graphic|product manager'),
            'Design & Product',
        match(t, 'retail|cashier|store|barista|cook|chef|server|hospitality|hotel|restaurant|housekeep'),
            'Retail & Hospitality',
        match(t, 'construction|electrician|plumber|technician|mechanic|maintenance|welder|hvac|operator'),
            'Trades & Maintenance',
        match(t, 'administrative|assistant|receptionist|office|coordinator|clerk|secretary'),
            'Admin & Office',
        match(t, 'manager|director|vice president|\\bvp\\b|chief|head of|supervisor|\\blead\\b'),
            'Management',
        'Other'
    ) AS role_family,
    p.company_name AS company,
    multiIf(
        c.company_size = 0, '1-10',
        c.company_size = 1, '11-50',
        c.company_size = 2, '51-200',
        c.company_size = 3, '201-500',
        c.company_size = 4, '501-1000',
        c.company_size = 5, '1001-5000',
        c.company_size = 6, '5001-10000',
        c.company_size = 7, '10000+',
        'Unknown'
    ) AS company_size,
    p.location,
    trimBoth(arrayElement(splitByChar(',', p.location), -1)) AS state,
    p.formatted_work_type AS work_type,
    p.formatted_experience_level AS exp_level,
    toUInt8(coalesce(p.remote_allowed, 0)) AS remote,
    p.application_type,
    toUInt8(coalesce(p.sponsored, 0)) AS sponsored,
    salary_year_clean AS salary_year,
    if(salary_year_clean IS NULL, NULL, p.min_salary * k) AS salary_min_year,
    if(salary_year_clean IS NULL, NULL, p.max_salary * k) AS salary_max_year,
    toDateTime(toUInt64(p.original_listed_time / 1000)) AS posted_at,
    formatDateTime(posted_at, '%Y-%m') AS month,
    if(
        p.expiry IS NULL,
        NULL,
        toUInt16(greatest(0, least(3650,
            round((p.expiry - p.original_listed_time) / 86400000)
        )))
    ) AS days_active,
    toUInt32(coalesce(p.views, 0)) AS views,
    toUInt32(coalesce(p.applies, 0)) AS applies,
    toUInt8(length(coalesce(p.description, '')) > 0) AS has_description,
    toUInt32(length(coalesce(p.description, ''))) AS desc_len,
    toUInt8(length(trimBoth(coalesce(p.skills_desc, ''))) > 0) AS has_skills_desc,
    sk.skills,
    ind.industries,
    bn.benefits
FROM jobs.postings_raw AS p
LEFT JOIN jobs.companies AS c
    ON c.company_id = toUInt64(coalesce(p.company_id, 0))
LEFT JOIN
(
    SELECT s.job_id, groupUniqArray(m.skill_name) AS skills
    FROM jobs.job_skills AS s
    INNER JOIN jobs.skills_map AS m ON m.skill_abr = s.skill_abr
    GROUP BY s.job_id
) AS sk ON sk.job_id = p.job_id
LEFT JOIN
(
    SELECT ji.job_id, groupUniqArray(im.industry_name) AS industries
    FROM jobs.job_industries AS ji
    INNER JOIN jobs.industries_map AS im ON im.industry_id = ji.industry_id
    GROUP BY ji.job_id
) AS ind ON ind.job_id = p.job_id
LEFT JOIN
(
    SELECT job_id, groupUniqArray(type) AS benefits
    FROM jobs.benefits
    GROUP BY job_id
) AS bn ON bn.job_id = p.job_id;
