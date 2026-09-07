-- Як подаються: через LinkedIn чи на сайт компанії; частка платних (sponsored).
-- Віджет: два маленькі donut або бари.
SELECT
    application_type,
    count()                              AS postings,
    round(avg(applies), 1)               AS avg_applies,
    round(avg(sponsored) * 100, 1)       AS sponsored_pct
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
GROUP BY application_type
ORDER BY postings DESC;
