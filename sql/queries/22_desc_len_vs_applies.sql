-- Чи довший опис привертає більше відгуків.
-- Віджет: лінійний графік (довжина опису -> середня кількість відгуків).
SELECT
    toUInt32(least(floor(desc_len / 500) * 500, 6000)) AS desc_len_from,
    count()                                             AS postings,
    round(avg(applies), 2)                              AS avg_applies,
    round(avg(views), 1)                                AS avg_views
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND has_description = 1
GROUP BY desc_len_from
ORDER BY desc_len_from;
