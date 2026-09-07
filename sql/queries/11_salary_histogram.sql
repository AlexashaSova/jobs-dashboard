-- Розподіл зарплат: скільки вакансій у кожному діапазоні по 20k.
-- Віджет: гістограма.
SELECT
    toUInt32(floor(salary_year / 20000) * 20000) AS bucket_from,
    bucket_from + 20000                          AS bucket_to,
    count()                                      AS postings
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND salary_year IS NOT NULL
  AND salary_year < 400000
GROUP BY bucket_from
ORDER BY bucket_from;
