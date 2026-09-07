-- Які бенефіти пропонують найчастіше.
-- Віджет: горизонтальні бари.
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
    arrayJoin(benefits)                  AS benefit,
    count()                              AS postings,
    round(count() / total * 100, 1)      AS share_pct
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY benefit
ORDER BY postings DESC
LIMIT 12;
