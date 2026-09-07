-- Remote vs on-site у розрізі рівнів досвіду.
-- Віджет: stacked bar (100%).
SELECT
    if(exp_level = '', 'Not specified', exp_level) AS exp_level,
    countIf(remote = 1)                  AS remote_postings,
    countIf(remote = 0)                  AS onsite_postings,
    round(avg(remote) * 100, 1)          AS remote_pct
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY exp_level
ORDER BY remote_pct DESC;
