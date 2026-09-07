-- Значення для випадаючих списків фільтрів.
-- Віджет: панель фільтрів (dropdown / multi-select).
SELECT filter, value, postings
FROM
(
    SELECT 'month' AS filter, month AS value, count() AS postings
    FROM jobs.postings
    GROUP BY value
    UNION ALL
    SELECT 'exp_level', exp_level, count()
    FROM jobs.postings
    WHERE exp_level != ''
    GROUP BY exp_level
    UNION ALL
    SELECT 'work_type', work_type, count()
    FROM jobs.postings
    WHERE work_type != ''
    GROUP BY work_type
)
ORDER BY filter, value;
