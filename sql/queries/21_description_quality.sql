-- Якість опису вакансій по рівнях: чи є опис, чи є вимоги, довжина.
-- Віджет: grouped bar (% з описом, % з вимогами) + лінія середньої довжини.
SELECT
    if(exp_level = '', 'Not specified', exp_level) AS exp_level,
    count()                                        AS postings,
    round(avg(has_description) * 100, 1)           AS with_description_pct,
    round(avg(has_skills_desc) * 100, 1)           AS with_skills_desc_pct,
    round(avgIf(desc_len, has_description = 1))    AS avg_desc_len,
    round(avg(applies), 1)                         AS avg_applies
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY exp_level
ORDER BY postings DESC;
