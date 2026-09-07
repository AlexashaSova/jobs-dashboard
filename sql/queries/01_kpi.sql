-- Картки з ключовими цифрами зверху дашборду.
-- Віджет: KPI-картки.
SELECT
    count()                                        AS total_postings,
    uniq(company)                                  AS companies,
    round(avg(remote) * 100, 1)                    AS remote_pct,
    round(quantile(0.5)(salary_year))              AS median_salary,
    round(countIf(salary_year IS NOT NULL) / count() * 100, 1) AS with_salary_pct,
    round(avg(has_description) * 100, 1)           AS with_description_pct,
    round(avg(has_skills_desc) * 100, 1)           AS with_skills_desc_pct,
    round(avg(applies), 1)                         AS avg_applies,
    round(quantile(0.5)(days_active))              AS median_days_active
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8});
