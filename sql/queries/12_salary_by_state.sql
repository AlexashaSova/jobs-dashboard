-- Де платять найбільше: медіанна зарплата по штатах.
-- Віджет: бари або карта США з кольором по зарплаті.
SELECT
    state,
    count()                              AS postings,
    round(quantile(0.5)(salary_year))    AS median_salary
FROM jobs.postings
WHERE (empty({months:Array(String)}) OR has({months:Array(String)}, month))
  AND (empty({levels:Array(String)}) OR has({levels:Array(String)}, exp_level))
  AND (empty({work_types:Array(String)}) OR has({work_types:Array(String)}, work_type))
  AND ({has_desc:Int8} = -1 OR has_description = {has_desc:Int8})
  AND ({has_skills:Int8} = -1 OR has_skills_desc = {has_skills:Int8})
  AND length(state) = 2
  AND salary_year IS NOT NULL
GROUP BY state
HAVING postings >= 50
ORDER BY median_salary DESC;
