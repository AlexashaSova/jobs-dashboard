-- Схема v2.
-- Скрипт створює базу з нуля, тому спочатку видаляє стару.
-- Для пет-проєкту це нормально: дані завжди можна
-- перезалити скриптом 02_load.sql.
DROP DATABASE IF EXISTS jobs;
CREATE DATABASE jobs;


-- ================= СИРИЙ ШАР =================
-- Дзеркала CSV. Числові типи навмисно "терпимі"
-- (Nullable(Float64)), бо у CSV з pandas числа
-- виглядають як 20.0 або 1.7E12.

-- postings.csv
CREATE TABLE jobs.postings_raw
(
    job_id                      UInt64,
    company_id                  Nullable(Float64),
    company_name                String,
    title                       String,
    description                 Nullable(String),
    skills_desc                 Nullable(String),
    location                    String,
    min_salary                  Nullable(Float64),
    med_salary                  Nullable(Float64),
    max_salary                  Nullable(Float64),
    pay_period                  LowCardinality(String),
    currency                    LowCardinality(String),
    formatted_work_type         LowCardinality(String),
    formatted_experience_level  LowCardinality(String),
    remote_allowed              Nullable(Float64),
    application_type            LowCardinality(String),
    sponsored                   Nullable(Float64),
    views                       Nullable(Float64),
    applies                     Nullable(Float64),
    original_listed_time        Float64,
    expiry                      Nullable(Float64)
)
ENGINE = MergeTree
ORDER BY job_id;

-- jobs/job_skills.csv : вакансія -> код навички
CREATE TABLE jobs.job_skills
(
    job_id     UInt64,
    skill_abr  LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY job_id;

-- mappings/skills.csv : код навички -> назва
CREATE TABLE jobs.skills_map
(
    skill_abr   LowCardinality(String),
    skill_name  String
)
ENGINE = MergeTree
ORDER BY skill_abr;

-- jobs/job_industries.csv : вакансія -> код індустрії
CREATE TABLE jobs.job_industries
(
    job_id       UInt64,
    industry_id  UInt32
)
ENGINE = MergeTree
ORDER BY job_id;

-- mappings/industries.csv : код індустрії -> назва
CREATE TABLE jobs.industries_map
(
    industry_id    UInt32,
    industry_name  String
)
ENGINE = MergeTree
ORDER BY industry_id;

-- jobs/benefits.csv : вакансія -> бенефіт
CREATE TABLE jobs.benefits
(
    job_id    UInt64,
    inferred  Nullable(Float64),
    type      LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY job_id;

-- companies/companies.csv
-- company_size: шкала LinkedIn 0..7 (0 = 1-10 людей, 7 = 10000+)
CREATE TABLE jobs.companies
(
    company_id    UInt64,
    name          String,
    company_size  Nullable(Float64),
    state         String,
    country       String,
    city          String
)
ENGINE = MergeTree
ORDER BY company_id;


-- ================= ВІТРИНА =================
-- Одна вакансія = один рядок. Усе, що потрібно
-- дашборду, вже пораховано тут.
--
-- role_family      : група професій, виведена з назви
-- company_size     : розмір компанії текстом ("51-200")
-- state            : код штату з location
-- salary_year      : зарплата, приведена до річної, USD
-- month            : "2024-04" — ключ для фільтра по місяцях
-- days_active      : скільки днів вакансія була відкрита
-- has_description  : 1, якщо є текст опису
-- desc_len         : довжина опису в символах
-- has_skills_desc  : 1, якщо є опис вимог (skills_desc)
CREATE TABLE jobs.postings
(
    job_id            UInt64,
    title             String,
    role_family       LowCardinality(String),
    company           LowCardinality(String),
    company_size      LowCardinality(String),
    location          String,
    state             LowCardinality(String),
    work_type         LowCardinality(String),
    exp_level         LowCardinality(String),
    remote            UInt8,
    application_type  LowCardinality(String),
    sponsored         UInt8,
    salary_year       Nullable(Float64),
    salary_min_year   Nullable(Float64),
    salary_max_year   Nullable(Float64),
    posted_at         DateTime,
    month             LowCardinality(String),
    days_active       Nullable(UInt16),
    views             UInt32,
    applies           UInt32,
    has_description   UInt8,
    desc_len          UInt32,
    has_skills_desc   UInt8,
    skills            Array(LowCardinality(String)),
    industries        Array(LowCardinality(String)),
    benefits          Array(LowCardinality(String))
)
ENGINE = MergeTree
ORDER BY (posted_at, role_family, company);
