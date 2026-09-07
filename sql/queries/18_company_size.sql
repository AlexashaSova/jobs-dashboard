-- Хто наймає: маленькі компанії чи корпорації.
-- Віджет: бари в порядку розміру.
SELECT
    company_size,
    count()                              AS postings,
    round(quantile(0.5)(salary_year))    AS median_salary,
    round(avg(remote) * 100, 1)          AS remote_pct,
    round(avg(applies), 1)               AS avg_applies
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY company_size
ORDER BY
    multiIf(
        company_size = '1-10', 1,
        company_size = '11-50', 2,
        company_size = '51-200', 3,
        company_size = '201-500', 4,
        company_size = '501-1000', 5,
        company_size = '1001-5000', 6,
        company_size = '5001-10000', 7,
        company_size = '10000+', 8,
        9
    );
