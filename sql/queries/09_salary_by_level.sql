-- Зарплатні вилки по рівнях досвіду.
-- Віджет: boxplot (p10 / p25 / медіана / p75 / p90).
SELECT
    if(exp_level = '', 'Not specified', exp_level) AS exp_level,
    count()                              AS postings,
    round(quantile(0.10)(salary_year))   AS p10,
    round(quantile(0.25)(salary_year))   AS p25,
    round(quantile(0.50)(salary_year))   AS median,
    round(quantile(0.75)(salary_year))   AS p75,
    round(quantile(0.90)(salary_year))   AS p90
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND salary_year IS NOT NULL
GROUP BY exp_level
ORDER BY median DESC;
