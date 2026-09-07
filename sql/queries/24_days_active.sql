-- Як довго вакансії залишаються відкритими, по групах професій.
-- Віджет: бари (медіана днів) або boxplot.
SELECT
    role_family,
    count()                              AS postings,
    round(quantile(0.25)(days_active))   AS p25_days,
    round(quantile(0.50)(days_active))   AS median_days,
    round(quantile(0.75)(days_active))   AS p75_days
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND days_active IS NOT NULL
GROUP BY role_family
HAVING postings >= 30
ORDER BY median_days DESC;
