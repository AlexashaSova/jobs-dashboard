-- Динаміка по місяцях: кількість, частка remote, медіанна зарплата.
-- Віджет: комбінований графік (бари = кількість, лінії = % і зарплата).
SELECT
    month,
    count()                              AS postings,
    round(avg(remote) * 100, 1)          AS remote_pct,
    round(quantile(0.5)(salary_year))    AS median_salary,
    round(avg(applies), 1)               AS avg_applies
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY month
ORDER BY month;
