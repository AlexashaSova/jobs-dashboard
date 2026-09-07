-- Зарплатні вилки по групах професій.
-- Віджет: boxplot або бари з діапазоном.
SELECT
    role_family,
    count()                              AS postings,
    round(quantile(0.25)(salary_year))   AS p25,
    round(quantile(0.50)(salary_year))   AS median,
    round(quantile(0.75)(salary_year))   AS p75
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND salary_year IS NOT NULL
GROUP BY role_family
HAVING postings >= 30
ORDER BY median DESC;
