-- Розподіл по типу зайнятості.
-- Віджет: donut.
SELECT
    if(work_type = '', 'Not specified', work_type) AS work_type,
    count()                              AS postings,
    round(quantile(0.5)(salary_year))    AS median_salary
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY work_type
ORDER BY postings DESC;
