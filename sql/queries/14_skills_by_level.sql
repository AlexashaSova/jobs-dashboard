-- Навички у розрізі рівнів досвіду (топ-12 навичок).
-- Віджет: heatmap (навичка x рівень).
WITH top_skills AS
(
    SELECT arrayJoin(skills) AS skill
    FROM jobs.postings
    WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
    GROUP BY skill
    ORDER BY count() DESC
    LIMIT 12
)
SELECT
    arrayJoin(skills)                              AS skill,
    if(exp_level = '', 'Not specified', exp_level) AS exp_level,
    count()                                        AS postings
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY skill, exp_level
HAVING skill IN (SELECT skill FROM top_skills)
ORDER BY skill, exp_level;
