# Крок 1 — репозиторій, база даних і дані

Мета кроку: після нього в тебе є GitHub-репозиторій, у якому одна команда піднімає ClickHouse із завантаженими вакансіями LinkedIn, а в папці `sql/queries/` лежать перевірені запити для майбутніх графіків.

Зроблено воно так, щоб кожну підкроку можна було виконати й перевірити окремо. Якщо щось не виходить — зупинись на цьому місці й напиши мені текст помилки.

---

## 0. Що встановити один раз

| Інструмент | Навіщо | Де взяти |
|---|---|---|
| **Git** | зберігає історію змін коду; без нього немає GitHub | https://git-scm.com/downloads |
| **Акаунт GitHub** | «хмара» для коду, там же живе твоє портфоліо | https://github.com/signup |
| **Docker Desktop** | запускає ClickHouse у контейнері — тобі не треба нічого встановлювати в систему і потім вичищати | https://docs.docker.com/desktop/ |
| **Python 3.11+** | бекенд (крок 2) і Kaggle CLI (зараз) | https://www.python.org/downloads/ |
| **VS Code** (або інший редактор) | редагувати файли; має вбудований термінал і Git | https://code.visualstudio.com/ |
| **Акаунт Kaggle** | звідти скачуємо датасет | https://www.kaggle.com/ |

Перевірка, що все стало (виконати в терміналі; у VS Code: меню *Terminal → New Terminal*):

```bash
git --version
docker --version
docker compose version
python --version      # на Mac/Linux може бути python3
```

Кожна команда має вивести версію, а не «command not found».

> **Windows.** Усі команди нижче написані для bash. На Windows найзручніше поставити **Git Bash** (іде разом із Git) або WSL. У PowerShell більшість команд теж працює, крім `chmod` та `set -e`.

Мінімум термінала, який потрібен: `cd папка` — зайти в папку, `ls` — показати що в ній, `mkdir назва` — створити папку, `cat файл` — показати вміст. Пояснення: https://git-scm.com/book/uk/v2/Вступ-Командний-рядок

---

## 1. Створити репозиторій

### 1.1. Локальна папка та `git init`

```bash
mkdir jobs-dashboard
cd jobs-dashboard
git init
```

`git init` створює приховану папку `.git`, у якій Git тримає всю історію. Відтепер ця папка — «репозиторій».

Одразу налаштуй, ким підписувати коміти (якщо не робила раніше):

```bash
git config --global user.name "Твоє Ім'я"
git config --global user.email "пошта_з_github@example.com"
```

Пошта має збігатися з тією, що на GitHub — тоді коміти прив'язуються до твого профілю й «зеленіють» у контрибуціях.

Документація: https://git-scm.com/book/uk/v2/Основи-Git-Створення-Git-репозиторію

### 1.2. Репозиторій на GitHub

1. Відкрий https://github.com/new
2. Repository name: `jobs-dashboard`
3. Public (це ж портфоліо)
4. **Не** став галочки «Add a README», «Add .gitignore», «Choose a license» — ці файли ми створимо самі, інакше буде конфлікт при першому push.
5. Create repository.

GitHub покаже сторінку з командами. Нам потрібна ця (підстав свій логін):

```bash
git remote add origin https://github.com/ТВІЙ_ЛОГІН/jobs-dashboard.git
git branch -M main
```

`remote` — це «адреса, куди пушити». `origin` — просто загальноприйнята назва для основного remote. `branch -M main` перейменовує гілку на `main` (у старих версіях Git вона за замовчуванням `master`).

Документація: https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories

> Якщо при `git push` GitHub спитає пароль — звичайний пароль не спрацює. Потрібен **Personal Access Token** або SSH-ключ. Найпростіше: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### 1.3. Скелет папок

```bash
mkdir -p sql/queries scripts backend frontend data/raw
```

Навіщо саме така структура: кожна «частина» проєкту живе у своїй папці, і людині, яка відкриє репозиторій, з першого погляду зрозуміло, де база, де бекенд, де фронт.

```
jobs-dashboard/
├── README.md            ← опис проєкту (пишемо в кінці кроку)
├── .gitignore           ← що НЕ зберігати в git
├── .env.example         ← шаблон налаштувань
├── docker-compose.yml   ← опис контейнера з ClickHouse
├── sql/
│   ├── 01_schema.sql    ← створення таблиць
│   ├── 02_load.sql      ← завантаження даних
│   └── queries/         ← по одному файлу на кожен графік
├── scripts/
│   └── download_data.sh ← скачування датасету
├── data/raw/            ← сирі CSV (НЕ в git)
├── backend/             ← крок 2
└── frontend/            ← крок 3
```

### 1.4. `.gitignore`

Створи файл `.gitignore` у корені з таким вмістом:

```
# дані — великі, їх скачують скриптом
data/

# секрети
.env

# Python
__pycache__/
*.pyc
.venv/

# Node / фронт
node_modules/
frontend/dist/

# ОС/редактор
.DS_Store
.vscode/
```

**Навіщо.** Git запам'ятовує кожен файл навічно. Датасет важить сотні мегабайт, а GitHub має ліміт 100 МБ на файл. Плюс у `.env` будуть паролі — їх не можна публікувати. `.gitignore` каже Git «цих файлів ніби не існує».

Документація: https://git-scm.com/docs/gitignore, готові шаблони: https://github.com/github/gitignore

### 1.5. `.env.example`

Файл `.env.example`:

```
CH_USER=dash
CH_PASSWORD=dash
CH_HOST=localhost
CH_PORT=8123
CH_DATABASE=jobs
```

І зроби з нього робочу копію: `cp .env.example .env`.

**Навіщо два файли.** `.env` з реальними значеннями — у `.gitignore`, у репозиторій не потрапляє. `.env.example` — у репозиторії, показує *які* змінні потрібні. Це стандартна практика: той, хто клонує проєкт, копіює example → .env і підставляє свої значення.

### 1.6. Перший коміт

```bash
git add .
git commit -m "chore: project skeleton"
git push -u origin main
```

- `git add .` — «підготувати всі змінені файли до збереження» (staging);
- `git commit -m "..."` — зафіксувати знімок з повідомленням;
- `git push -u origin main` — відправити на GitHub. `-u` потрібен тільки перший раз: він запам'ятовує зв'язок локальної `main` з `origin/main`, далі досить `git push`.

Відкрий сторінку репозиторію на GitHub — там мають з'явитися папки. (Порожні папки Git не зберігає — це нормально, вони з'являться, коли в них будуть файли.)

Стиль повідомлень `chore:`, `feat:`, `fix:` — це Conventional Commits, дрібниця, яка виглядає професійно: https://www.conventionalcommits.org/

---

## 2. Скачати датасет

Датасет: **LinkedIn Job Postings (2023–2024)** — https://www.kaggle.com/datasets/arshkon/linkedin-job-postings

Ліцензія CC BY-SA: користуватись можна вільно, але треба вказати джерело — зробимо це в README.

### 2.1. Варіант А — руками (простіше для першого разу)

1. Залогінься на Kaggle, відкрий сторінку датасету, натисни **Download** (кнопка зверху праворуч).
2. Розпакуй архів так, щоб вийшла структура:

```
data/raw/
├── postings.csv
├── companies/
│   ├── companies.csv
│   ├── company_industries.csv
│   ├── company_specialities.csv
│   └── employee_counts.csv
├── jobs/
│   ├── benefits.csv
│   ├── job_industries.csv
│   ├── job_skills.csv
│   └── salaries.csv
└── mappings/
    ├── industries.csv
    └── skills.csv
```

Перевір: `ls data/raw` має показати `postings.csv companies jobs mappings`.

### 2.2. Варіант Б — через Kaggle CLI (щоб проєкт відтворювався однією командою)

```bash
pip install kaggle
```

Далі токен: Kaggle → аватарка → *Settings* → розділ *API* → **Create New Token**. Скачається `kaggle.json`. Поклади його:

- Mac/Linux: `~/.kaggle/kaggle.json`, потім `chmod 600 ~/.kaggle/kaggle.json`
- Windows: `C:\Users\<логін>\.kaggle\kaggle.json`

Створи `scripts/download_data.sh`:

```bash
#!/usr/bin/env bash
# Скачує датасет LinkedIn Job Postings з Kaggle у data/raw/
set -e                       # зупинитись при першій помилці
mkdir -p data/raw
kaggle datasets download -d arshkon/linkedin-job-postings -p data/raw --unzip
echo "Done. Files in data/raw:"
ls data/raw
```

```bash
chmod +x scripts/download_data.sh    # дозволити запуск
./scripts/download_data.sh
```

Документація Kaggle API: https://www.kaggle.com/docs/api та https://github.com/Kaggle/kaggle-api

У будь-якому разі скрипт варто додати в репозиторій — навіть якщо сама скачала руками. Це те, що покаже читачеві README, як відтворити проєкт.

---

## 3. Підняти ClickHouse у Docker

### 3.1. Що таке Docker, двома словами

Контейнер — це «коробка» з програмою та всім, що їй потрібно. ClickHouse у контейнері не встановлюється в твою систему: видалила контейнер — і сліду не лишилось. `docker-compose.yml` — файл, де ти описуєш, *які* контейнери й *як* запускати, а `docker compose up` це виконує.

Документація: https://docs.docker.com/get-started/ (перша частина), Compose: https://docs.docker.com/compose/

### 3.2. `docker-compose.yml`

Створи в корені файл `docker-compose.yml`:

```yaml
services:
  clickhouse:
    image: clickhouse/clickhouse-server:24.8
    container_name: jobs-clickhouse
    ports:
      - "8123:8123"     # HTTP-інтерфейс: через нього ходить Python
      - "9000:9000"     # native-протокол: через нього ходить clickhouse-client
    environment:
      CLICKHOUSE_USER: ${CH_USER:-dash}
      CLICKHOUSE_PASSWORD: ${CH_PASSWORD:-dash}
    volumes:
      - ch_data:/var/lib/clickhouse                                # дані бази живуть між перезапусками
      - ./data/raw:/var/lib/clickhouse/user_files/raw:ro          # наші CSV видно всередині контейнера
      - ./sql:/sql:ro                                              # наші SQL-файли теж
    ulimits:
      nofile: { soft: 262144, hard: 262144 }

volumes:
  ch_data:
```

Пояснення рядків:

- `image: ...:24.8` — конкретна версія, а не `latest`. Через рік проєкт запуститься так само, як сьогодні.
- `ports: "8123:8123"` — «порт 8123 на моєму комп'ютері → порт 8123 у контейнері». Без цього до бази з-зовні не дістатись.
- `environment` — створює користувача. `${CH_USER:-dash}` означає «взяти з `.env`, а якщо там нема — `dash`». Docker Compose сам читає `.env` з тієї ж папки.
- `volumes` — «прокидання» папок. Без `ch_data` дані зникали б при кожному перезапуску контейнера. `./data/raw → user_files/raw` потрібно тому, що функція `file()` у ClickHouse з міркувань безпеки читає файли **тільки** з папки `user_files`. `:ro` — read-only, контейнер не зможе зіпсувати наші файли.
- `ulimits` — ClickHouse відкриває багато файлів одночасно; це рекомендоване налаштування з його документації.

Образ ClickHouse і його змінні: https://hub.docker.com/r/clickhouse/clickhouse-server

### 3.3. Запуск і перевірка

```bash
docker compose up -d
```

`-d` (detached) — запустити у фоні й повернути термінал. Перший раз скачається образ (~1 ГБ), далі — секунди.

```bash
docker compose ps          # має бути State: running / healthy
docker compose logs -f clickhouse   # живі логи; вийти Ctrl+C
```

Перевірка, що база відповідає:

```bash
docker compose exec clickhouse clickhouse-client -u dash --password dash -q "SELECT version()"
```

Розбір команди: `docker compose exec clickhouse` — «виконай усередині контейнера clickhouse»; `clickhouse-client` — консольний клієнт бази; `-q "..."` — один запит і вийти. Має надрукувати `24.8.x.x`.

Ще одна перевірка — HTTP, саме так до бази ходитиме Python:

```bash
curl "http://localhost:8123/?user=dash&password=dash&query=SELECT%201"
```

Має повернути `1`.

Інтерактивний режим (для експериментів; вихід — `exit` або Ctrl+D):

```bash
docker compose exec clickhouse clickhouse-client -u dash --password dash
```

Документація клієнта: https://clickhouse.com/docs/interfaces/cli

Корисні команди на потім:

```bash
docker compose stop      # зупинити (дані лишаються)
docker compose start     # запустити знову
docker compose down      # зупинити і видалити контейнер (дані у volume лишаються)
docker compose down -v   # ...і видалити дані. Повний «з нуля».
```

---

## 4. Створити таблиці

### 4.1. Трохи про ClickHouse

ClickHouse — колонкова аналітична база. Вона створена саме для того, що робить дашборд: порахувати щось по мільйонах рядків за мілісекунди. Ключові речі, які треба знати зараз:

- **Engine `MergeTree`** — основний тип таблиці. Треба вказувати завжди.
- **`ORDER BY`** — не сортування виводу, а *як дані фізично лежать на диску*. Запити, які фільтрують по цих колонках, дуже швидкі. Ми впорядкуємо по даті — бо дашборд майже завжди фільтрує «за період».
- **`LowCardinality(String)`** — для колонок з невеликою кількістю різних значень (тип зайнятості, рівень). База зберігає словник замість рядків — менше місця, швидше групування.
- **`Nullable(...)`** — колонка може бути порожньою. У CSV половина зарплат порожні — без `Nullable` завантаження впаде.
- **`Array(String)`** — масив прямо в комірці. Навички однієї вакансії — це список, і в ClickHouse його зручно зберігати саме так.

Документація: MergeTree https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree · LowCardinality https://clickhouse.com/docs/sql-reference/data-types/lowcardinality · Nullable https://clickhouse.com/docs/sql-reference/data-types/nullable · Array https://clickhouse.com/docs/sql-reference/data-types/array

### 4.2. Спочатку подивись, що у файлі

Перед тим як писати схему, спитай базу, що вона бачить у CSV (у інтерактивному клієнті або через `-q`):

```sql
DESCRIBE file('raw/postings.csv', 'CSVWithNames');
```

`CSVWithNames` — формат «CSV, перший рядок — заголовки». `DESCRIBE` виведе список колонок і типи, які ClickHouse *вгадав*. Звір цей список зі схемою нижче: якщо в датасеті якоїсь колонки нема або називається інакше — виправ у своїй схемі. Датасет на Kaggle періодично оновлюється.

Те саме для інших файлів:

```sql
DESCRIBE file('raw/jobs/job_skills.csv', 'CSVWithNames');
DESCRIBE file('raw/mappings/skills.csv', 'CSVWithNames');
```

І перші рядки, щоб побачити реальні значення:

```sql
SELECT * FROM file('raw/postings.csv', 'CSVWithNames') LIMIT 3 FORMAT Vertical;
```

Функція `file()`: https://clickhouse.com/docs/sql-reference/table-functions/file

### 4.3. Ідея схеми: «сирий шар» і «вітрина»

Ми зробимо два рівні таблиць:

1. **Сирі таблиці** (`postings_raw`, `job_skills`, `skills_map`) — дзеркало CSV, майже без перетворень. Типи навмисно «терпимі» (`Nullable(Float64)` для чисел), бо у CSV, збережених із pandas, числа часто виглядають як `20.0` або `1.7E12`, і суворий `UInt32` на них впаде.
2. **Вітрина** `postings` — одна чиста, широка таблиця, у якій уже пораховано все, що потрібно графікам: нормалізована зарплата, дата, штат, навички масивом. Бекенд читає **тільки** її.

Це стандартний підхід у data-інженерії (raw → mart), і його варто описати в README — це те, що відрізняє «завантажила CSV» від «спроєктувала».

### 4.4. `sql/01_schema.sql`

```sql
-- База даних проєкту
CREATE DATABASE IF NOT EXISTS jobs;

-- ================= СИРИЙ ШАР =================

-- Дзеркало postings.csv. Тільки потрібні нам колонки.
CREATE TABLE IF NOT EXISTS jobs.postings_raw
(
    job_id                      UInt64,
    company_id                  Nullable(Float64),
    company_name                String,
    title                       String,
    location                    String,
    min_salary                  Nullable(Float64),
    med_salary                  Nullable(Float64),
    max_salary                  Nullable(Float64),
    pay_period                  LowCardinality(String),
    currency                    LowCardinality(String),
    formatted_work_type         LowCardinality(String),
    formatted_experience_level  LowCardinality(String),
    remote_allowed              Nullable(Float64),
    views                       Nullable(Float64),
    applies                     Nullable(Float64),
    original_listed_time        Float64,            -- unix time у мілісекундах
    expiry                      Nullable(Float64)
)
ENGINE = MergeTree
ORDER BY job_id;

-- Зв'язок вакансія → код навички (job_skills.csv)
CREATE TABLE IF NOT EXISTS jobs.job_skills
(
    job_id     UInt64,
    skill_abr  LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY job_id;

-- Розшифровка кодів навичок (mappings/skills.csv), напр. IT → Information Technology
CREATE TABLE IF NOT EXISTS jobs.skills_map
(
    skill_abr   LowCardinality(String),
    skill_name  String
)
ENGINE = MergeTree
ORDER BY skill_abr;

-- ================= ВІТРИНА =================

-- Те, що читає дашборд. Одна вакансія = один рядок.
CREATE TABLE IF NOT EXISTS jobs.postings
(
    job_id       UInt64,
    title        String,
    company      LowCardinality(String),
    location     String,
    state        LowCardinality(String),        -- напр. "TX", витягнуто з location
    work_type    LowCardinality(String),        -- Full-time / Contract / ...
    exp_level    LowCardinality(String),        -- Entry level / Mid-Senior level / ...
    remote       UInt8,                          -- 0/1
    salary_year  Nullable(Float64),              -- зарплата, приведена до річної в USD
    posted_at    DateTime,
    views        UInt32,
    applies      UInt32,
    skills       Array(LowCardinality(String))
)
ENGINE = MergeTree
ORDER BY (posted_at, company);
```

`IF NOT EXISTS` — щоб скрипт можна було запускати повторно без помилки «таблиця вже існує».

Виконати файл:

```bash
docker compose exec clickhouse clickhouse-client -u dash --password dash --queries-file /sql/01_schema.sql
```

`/sql/...` — шлях *усередині контейнера*, туди ми змонтували папку `./sql` у compose-файлі.

Перевірка:

```sql
SHOW TABLES FROM jobs;
```

Має вивести чотири таблиці.

Документація `CREATE TABLE`: https://clickhouse.com/docs/sql-reference/statements/create/table

---

## 5. Завантажити дані

### 5.1. `sql/02_load.sql`

```sql
-- Очищаємо перед завантаженням, щоб скрипт можна було запускати повторно
TRUNCATE TABLE jobs.postings_raw;
TRUNCATE TABLE jobs.job_skills;
TRUNCATE TABLE jobs.skills_map;
TRUNCATE TABLE jobs.postings;

-- ---------- сирий шар ----------

INSERT INTO jobs.postings_raw
SELECT
    job_id, company_id, company_name, title, location,
    min_salary, med_salary, max_salary, pay_period, currency,
    formatted_work_type, formatted_experience_level,
    remote_allowed, views, applies, original_listed_time, expiry
FROM file('raw/postings.csv', 'CSVWithNames');

INSERT INTO jobs.job_skills
SELECT job_id, skill_abr
FROM file('raw/jobs/job_skills.csv', 'CSVWithNames');

INSERT INTO jobs.skills_map
SELECT skill_abr, skill_name
FROM file('raw/mappings/skills.csv', 'CSVWithNames');

-- ---------- вітрина ----------

INSERT INTO jobs.postings
SELECT
    p.job_id,
    p.title,
    p.company_name                                              AS company,
    p.location,
    -- location виглядає як "Austin, TX" → беремо останній шматок після коми
    trimBoth(arrayElement(splitByChar(',', p.location), -1))   AS state,
    p.formatted_work_type                                       AS work_type,
    p.formatted_experience_level                                AS exp_level,
    toUInt8(coalesce(p.remote_allowed, 0))                      AS remote,
    -- приводимо зарплату до річної. 2080 = 40 год × 52 тижні
    multiIf(
        p.pay_period = 'YEARLY',  coalesce(p.med_salary, (p.min_salary + p.max_salary) / 2),
        p.pay_period = 'MONTHLY', coalesce(p.med_salary, (p.min_salary + p.max_salary) / 2) * 12,
        p.pay_period = 'HOURLY',  coalesce(p.med_salary, (p.min_salary + p.max_salary) / 2) * 2080,
        NULL
    )                                                           AS salary_year,
    -- мілісекунди → секунди → DateTime
    toDateTime(toUInt64(p.original_listed_time / 1000))         AS posted_at,
    toUInt32(coalesce(p.views, 0))                              AS views,
    toUInt32(coalesce(p.applies, 0))                            AS applies,
    -- усі навички вакансії згортаємо в масив
    groupArray(m.skill_name)                                    AS skills
FROM jobs.postings_raw AS p
LEFT JOIN jobs.job_skills AS s ON s.job_id = p.job_id
LEFT JOIN jobs.skills_map AS m ON m.skill_abr = s.skill_abr
GROUP BY ALL;
```

Що тут відбувається:

- `TRUNCATE` — очистити таблицю. Завдяки цьому файл можна прогнати ще раз після виправлень, не отримавши дублікатів.
- `INSERT INTO ... SELECT ... FROM file(...)` — читає CSV прямо в таблицю. Порядок колонок у `SELECT` має відповідати порядку в `CREATE TABLE`.
- `splitByChar(',', location)` розбиває `"Austin, TX"` на `['Austin', ' TX']`; `arrayElement(..., -1)` бере останній елемент; `trimBoth` прибирає пробіли.
- `coalesce(a, b)` — «a, а якщо воно NULL — b».
- `multiIf` — це `if / else if / else` в один вираз.
- `groupArray` — агрегатна функція: збирає значення групи в масив. Разом із `GROUP BY ALL` (групувати по всіх неагрегатних колонках) вона «складає» кілька рядків «вакансія–навичка» в один рядок «вакансія + масив навичок».

Документація: `INSERT ... SELECT` https://clickhouse.com/docs/sql-reference/statements/insert-into · рядкові функції https://clickhouse.com/docs/sql-reference/functions/splitting-merging-functions · `multiIf` https://clickhouse.com/docs/sql-reference/functions/conditional-functions · `groupArray` https://clickhouse.com/docs/sql-reference/aggregate-functions/reference/grouparray · JOIN https://clickhouse.com/docs/sql-reference/statements/select/join

### 5.2. Запуск

```bash
docker compose exec clickhouse clickhouse-client -u dash --password dash --queries-file /sql/02_load.sql
```

На 124 тис. рядків — кілька секунд.

### 5.3. Перевірка (обов'язково)

```sql
SELECT count() FROM jobs.postings_raw;   -- ~124 000
SELECT count() FROM jobs.postings;       -- стільки ж (один рядок = одна вакансія)

SELECT * FROM jobs.postings LIMIT 3 FORMAT Vertical;

-- зарплата має бути в осмисленому діапазоні (десятки–сотні тисяч), не 5 і не 5 000 000
SELECT quantiles(0.1, 0.5, 0.9)(salary_year) FROM jobs.postings WHERE salary_year IS NOT NULL;

-- дати мають бути в 2023–2024
SELECT min(posted_at), max(posted_at) FROM jobs.postings;

-- категорії мають бути «чистими», без сміття
SELECT work_type, count() FROM jobs.postings GROUP BY work_type ORDER BY 2 DESC;
SELECT exp_level, count() FROM jobs.postings GROUP BY exp_level ORDER BY 2 DESC;
```

Якщо медіанна зарплата виглядає як `80 000–120 000` — усе гаразд. Якщо `50` — десь не спрацював `pay_period`; якщо дати `1970` — час не в мілісекундах. Це саме ті перевірки, які роблять у реальній роботі, і про них теж можна написати рядок у README.

### 5.4. Типові помилки

| Повідомлення | Причина | Що робити |
|---|---|---|
| `File ... doesn't exist` | ClickHouse не бачить CSV | перевір `ls data/raw`, і що volume у compose вказує на `user_files/raw`; після зміни compose — `docker compose up -d` ще раз |
| `Cannot parse input: expected ...` | тип у схемі суворіший за дані | зміни колонку на `Nullable(Float64)` або `String` у raw-таблиці |
| `Unknown identifier ...` / `Missing columns` | у CSV колонка називається інакше | подивись `DESCRIBE file(...)` і виправ назву |
| `Authentication failed` | не той користувач/пароль | звір `.env` і `docker compose config` (показує підставлені значення) |
| порт 8123 зайнятий | інша програма на цьому порту | зміни ліву частину `"8124:8123"` і `CH_PORT` у `.env` |

---

## 6. Запити для майбутніх графіків

Тепер найцікавіше: подумати, *що* буде на дашборді, і написати під кожен віджет SQL. Кожен запит — окремий файл у `sql/queries/`. На кроці 2 бекенд читатиме ці файли, тож назви колонок у результаті стануть «контрактом» між базою й фронтом.

Пропоную такий набір (це і є майбутній дашборд):

### `sql/queries/kpi.sql` — картки з цифрами зверху

```sql
SELECT
    count()                                   AS total_postings,
    uniq(company)                             AS companies,
    round(avg(remote) * 100, 1)               AS remote_pct,
    round(quantile(0.5)(salary_year))         AS median_salary
FROM jobs.postings;
```

### `sql/queries/timeseries.sql` — лінійний графік по тижнях

```sql
SELECT
    toStartOfWeek(posted_at)                  AS week,
    count()                                   AS postings,
    round(avg(remote) * 100, 1)               AS remote_pct
FROM jobs.postings
GROUP BY week
ORDER BY week;
```

### `sql/queries/top_skills.sql` — горизонтальні бари

```sql
SELECT
    arrayJoin(skills)                         AS skill,
    count()                                   AS postings
FROM jobs.postings
GROUP BY skill
ORDER BY postings DESC
LIMIT 15;
```

`arrayJoin` «розгортає» масив: рядок із 3 навичками стає 3 рядками. Документація: https://clickhouse.com/docs/sql-reference/functions/array-join

### `sql/queries/salary_by_level.sql` — зарплатні вилки по рівнях

```sql
SELECT
    exp_level,
    count()                                   AS postings,
    round(quantile(0.25)(salary_year))        AS p25,
    round(quantile(0.5)(salary_year))         AS median,
    round(quantile(0.75)(salary_year))        AS p75
FROM jobs.postings
WHERE salary_year IS NOT NULL AND exp_level != ''
GROUP BY exp_level
ORDER BY median DESC;
```

### `sql/queries/top_companies.sql`

```sql
SELECT company, count() AS postings
FROM jobs.postings
GROUP BY company
ORDER BY postings DESC
LIMIT 15;
```

### `sql/queries/by_state.sql` — для карти або барів по штатах

```sql
SELECT state, count() AS postings
FROM jobs.postings
WHERE length(state) = 2          -- залишаємо тільки коди штатів
GROUP BY state
ORDER BY postings DESC;
```

### `sql/queries/work_type_split.sql` — кругова діаграма

```sql
SELECT work_type, count() AS postings
FROM jobs.postings
WHERE work_type != ''
GROUP BY work_type
ORDER BY postings DESC;
```

Прогнати кожен можна так (шлях усередині контейнера):

```bash
docker compose exec clickhouse clickhouse-client -u dash --password dash --queries-file /sql/queries/kpi.sql
```

Подивись на кожен результат очима: чи цифри правдоподібні, чи нема порожніх категорій, чи топ-навички схожі на правду. Це і є «перевірка даних», яку варто вміти пояснити на співбесіді.

Агрегатні функції: https://clickhouse.com/docs/sql-reference/aggregate-functions/reference · функції дат: https://clickhouse.com/docs/sql-reference/functions/date-time-functions

---

## 7. README і фінальний коміт

### 7.1. Мінімальний `README.md`

```markdown
# Jobs Market Dashboard

Дашборд ринку вакансій на основі відкритого датасету
[LinkedIn Job Postings (2023–2024)](https://www.kaggle.com/datasets/arshkon/linkedin-job-postings) (CC BY-SA).

**Стек:** ClickHouse (Docker) · Python / FastAPI · React + ECharts (UI згенеровано за допомогою AI).

## Запуск бази

1. `./scripts/download_data.sh` (потрібен Kaggle API token) або скачати датасет вручну в `data/raw/`
2. `cp .env.example .env`
3. `docker compose up -d`
4. `docker compose exec clickhouse clickhouse-client -u dash --password dash --queries-file /sql/01_schema.sql`
5. `docker compose exec clickhouse clickhouse-client -u dash --password dash --queries-file /sql/02_load.sql`

## Архітектура даних

- `postings_raw`, `job_skills`, `skills_map` — сирий шар, дзеркало CSV
- `postings` — вітрина: зарплата приведена до річної, навички згорнуті в масив, дата розпарсена

## Статус

- [x] Крок 1 — база даних і дані
- [ ] Крок 2 — FastAPI
- [ ] Крок 3 — фронтенд
```

README дописуватимеш після кожного кроку. Синтаксис Markdown: https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax

### 7.2. Коміт

Перед комітом подивись, що саме потрапить у git:

```bash
git status
```

У списку **не має бути** `data/` і `.env`. Якщо є — перевір `.gitignore`.

```bash
git add .
git commit -m "feat: clickhouse schema, data load and dashboard queries"
git push
```

Порада на майбутнє: комітити маленькими порціями після кожного робочого шматка («додала схему», «додала завантаження»), а не одним великим комітом у кінці дня. Історія в GitHub — теж частина портфоліо.

---

## Критерій готовності кроку 1

- [ ] Репозиторій на GitHub, у ньому: `README.md`, `.gitignore`, `.env.example`, `docker-compose.yml`, `sql/`, `scripts/`
- [ ] `git status` чистий, `data/` і `.env` не в репозиторії
- [ ] `docker compose up -d` → база відповідає на `SELECT version()`
- [ ] `02_load.sql` виконується без помилок, `count()` у `postings` ≈ 124 000
- [ ] Медіанна зарплата, дати й категорії виглядають правдоподібно
- [ ] 7 файлів у `sql/queries/` повертають осмислені результати

Коли все відмічено — надішли мені вивід `DESCRIBE file('raw/postings.csv', 'CSVWithNames')` і результат `kpi.sql`, і я розпишу крок 2 (FastAPI) так само детально, уже під твої реальні дані.
