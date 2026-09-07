-- Які взагалі є вакансії: групи професій.
-- Віджет: treemap або горизонтальні бари.
WITH
(
    SELECT count()
    FROM jobs.postings
    WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
      AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
      AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
      AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
      AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
) AS total
SELECT
    role_family,
    count()                              AS postings,
    round(count() / total * 100, 1)      AS share_pct,
    round(avg(remote) * 100, 1)          AS remote_pct,
    round(quantile(0.5)(salary_year))    AS median_salary,
    round(avg(applies), 1)               AS avg_applies
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY role_family
ORDER BY postings DESC;
