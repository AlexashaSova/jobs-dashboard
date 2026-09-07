-- Індустрії, у яких найбільше вакансій.
-- Віджет: горизонтальні бари.
SELECT
    arrayJoin(industries)                AS industry,
    count()                              AS postings,
    round(quantile(0.5)(salary_year))    AS median_salary,
    round(avg(remote) * 100, 1)          AS remote_pct
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY industry
ORDER BY postings DESC
LIMIT 15;
