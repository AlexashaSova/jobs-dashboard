# Крок 2 — бекенд на FastAPI

Мета кроку: Python-сервіс, який приймає HTTP-запити від майбутнього фронтенду, виконує потрібний SQL у ClickHouse з урахуванням фільтрів і повертає JSON. Наприкінці кроку ти відкриваєш `http://localhost:8000/docs` і клікаєш по всіх 25 віджетах прямо у браузері.

Передумова: крок 1 завершено — `./scripts/run_query.sh kpi` показує живі цифри.

---

## 0. Як це працює (картинка в голові)

```
браузер / фронтенд
      │  GET /api/widgets/kpi?months=2024-04&levels=Entry level
      ▼
FastAPI (backend/app/main.py)
      │  1. знаходить файл sql/queries/01_kpi.sql
      │  2. підставляє фільтри у {months:Array(String)} і т.д.
      │  3. виконує запит через clickhouse-connect (HTTP, порт 8123)
      ▼
ClickHouse
      │  рядки результату
      ▼
FastAPI → JSON: {"widget": "kpi", "rows": [ {...} ]}
```

Ключова ідея дизайну: **один універсальний ендпоінт на всі віджети.** Бекенд не знає, що таке «KPI» чи «топ навичок» — він просто читає папку `sql/queries/`, і кожен файл `NN_name.sql` автоматично стає адресою `/api/widgets/name`. Хочеш новий графік — додаєш SQL-файл, і API вже його віддає, без жодного рядка Python. Це і компактно, і показує, що ти вмієш проєктувати, а не копіювати код 25 разів.

---

## 1. Що встановлюємо і навіщо

| Бібліотека | Роль | Документація |
|---|---|---|
| **FastAPI** | веб-фреймворк: маршрути, валідація параметрів, автодокументація | https://fastapi.tiangolo.com/ (є українською: https://fastapi.tiangolo.com/uk/) |
| **Uvicorn** | сервер, який запускає FastAPI-застосунок | https://www.uvicorn.org/ |
| **clickhouse-connect** | офіційний Python-драйвер ClickHouse | https://clickhouse.com/docs/integrations/python |
| **pydantic-settings** | читає налаштування з `.env` у типізований об'єкт | https://docs.pydantic.dev/latest/concepts/pydantic_settings/ |
| **pytest** + **httpx** | тести | https://docs.pytest.org/ |

---

## 2. Файли бекенду

Розпакуй архів у корінь проєкту — з'являться:

```
backend/
├── requirements.txt      ← список бібліотек
├── Dockerfile            ← для запуску в Docker (розділ 7)
├── app/
│   ├── __init__.py       ← порожній; каже Python, що app — пакет
│   ├── config.py         ← налаштування з .env
│   ├── db.py             ← підключення до ClickHouse
│   ├── queries.py        ← читає sql/queries/*.sql
│   ├── filters.py        ← фільтри: URL → параметри ClickHouse
│   ├── cache.py          ← кеш результатів
│   └── main.py           ← сам FastAPI-застосунок і ендпоінти
└── tests/
    ├── __init__.py
    └── test_api.py       ← тести без бази
docker-compose.yml        ← оновлений: додано сервіс backend
.env.example              ← оновлений: додано CACHE_TTL_SECONDS, CORS_ORIGINS
```

`docker-compose.yml` і `.env.example` замінять твої. Після заміни зроби ще раз `cp .env.example .env` (значення ті самі, просто два нові рядки).

### Що робить кожен файл

**`config.py`.** Один клас `Settings` з полями `ch_host`, `ch_port`, `ch_user`… pydantic-settings сам читає `.env` (змінна `CH_HOST` → поле `ch_host`) і перевіряє типи. Якщо в `.env` буде `CH_PORT=abc` — застосунок не запуститься з понятною помилкою, а не впаде десь пізніше. Це краще, ніж `os.getenv()` по всьому коду.

**`db.py`.** `get_client()` створює одне з'єднання на весь застосунок (`@lru_cache` — «виклич функцію один раз і запам'ятай результат»). `run_query(sql, parameters)` виконує запит і повертає список словників `[{"colname": value, ...}]` — саме те, що легко віддати як JSON.

Зверни увагу на `parameters=`: значення фільтрів **не вклеюються в текст SQL**. Драйвер відправляє їх окремо, а ClickHouse підставляє у `{months:Array(String)}` на своєму боці. Тому ніякий хитрий рядок у фільтрі не зламає запит — це захист від SQL-ін'єкцій «з коробки». Документація: https://clickhouse.com/docs/integrations/python#parameterized-queries

**`queries.py`.** Проходить по `sql/queries/*.sql`, з назви файлу `04_role_family.sql` бере порядок (`4`) і назву (`role_family`), з коментарів у шапці — опис і підказку «Віджет: treemap». Так фронтенд зможе спитати `/api/widgets` і дізнатись, що взагалі є і чим це малювати. Ще прибирає `;` у кінці — HTTP-інтерфейс ClickHouse його не любить.

**`filters.py`.** Модель `Filters` з п'ятьма полями — точна копія параметрів у SQL. Функція `filters_from_query` описує, як вони приходять в URL: `?months=2024-03&months=2024-04` FastAPI збирає у список `["2024-03", "2024-04"]`; `has_desc` обмежено значеннями від −1 до 1 (`ge=-1, le=1`) — усе інше отримає помилку 422 ще до звернення до бази. Документація про списки в параметрах: https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#query-parameter-list-multiple-values

**`cache.py`.** Словник «ключ → (коли протухне, значення)». Ключ — назва віджета плюс фільтри. Дані в базі не змінюються, а фронтенд буде питати одне й те саме при кожному оновленні сторінки; тримати результат 5 хвилин у пам'яті — дешево і чесно. У README це окремий пункт.

**`main.py`.** Чотири ендпоінти:

| Адреса | Що віддає |
|---|---|
| `GET /api/health` | версія ClickHouse і кількість вакансій — для перевірки «чи все живе» |
| `GET /api/widgets` | список усіх віджетів: назва, опис, тип графіка, чи підтримує фільтри |
| `GET /api/filters` | значення для випадаючих списків (місяці, рівні, типи) |
| `GET /api/widgets/{name}` | дані віджета `name` з урахуванням фільтрів з URL |

Плюс `CORSMiddleware`: браузер за замовчуванням забороняє сторінці з `localhost:5173` (де житиме React) ходити на `localhost:8000` (інший порт = інше «походження»). Цей middleware каже браузеру «цим адресам можна». Документація: https://fastapi.tiangolo.com/tutorial/cors/

---

## 3. Віртуальне середовище Python

Бібліотеки ставимо не «в систему», а в окрему папку проєкту — щоб різні проєкти не заважали один одному. Це називається virtual environment.

У корені проєкту:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Після `source` промпт термінала отримає префікс `(.venv)` — це означає, що `python` і `pip` тепер «твої», з цієї папки. Активувати треба **в кожному новому вікні термінала**. Вийти — команда `deactivate`.

```bash
pip install -r backend/requirements.txt
```

Хвилина-дві. Папка `.venv/` уже в `.gitignore` — у репозиторій вона не піде, а `requirements.txt` дозволить будь-кому відтворити середовище.

Документація: https://docs.python.org/3/library/venv.html

---

## 4. Запуск

База має бути запущена (`docker compose up -d clickhouse` — зверни увагу, тепер вказуємо назву сервісу, бо в compose їх два, а backend через Docker ми поки не запускаємо).

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Розбір: `app.main:app` — «у пакеті `app`, файлі `main.py`, змінна `app`». `--reload` — перезапускати при зміні коду (тільки для розробки). Побачиш:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Термінал лишається зайнятим сервером — для інших команд відкрий друге вікно/вкладку. Зупинити — Ctrl+C.

---

## 5. Перевірка у браузері

Відкрий **http://localhost:8000/docs** — це автодокументація, яку FastAPI згенерував із коду. Кожен ендпоінт можна розгорнути, натиснути **Try it out**, заповнити фільтри й натиснути **Execute** — унизу з'явиться запит і відповідь. Це твій основний інструмент для тестування API, і те, що приємно показати у README (скріншот!).

Що перевірити:

1. `/api/health` → `{"status": "ok", "clickhouse": "24.8...", "postings": 123849}` (число — твоє). Якщо тут помилка 503 — бекенд не дістався бази: перевір, що контейнер запущений і `.env` правильний.
2. `/api/widgets` → список із 25 віджетів.
3. `/api/filters` → місяці, рівні, типи.
4. `/api/widgets/kpi` без фільтрів, потім з `months = 2024-04`, `levels = Entry level`, `has_desc = 1` — цифри мають зменшитись.
5. `/api/widgets/role_family`, `/api/widgets/top_skills` — просто подивитись на дані очима.

Те саме з термінала:

```bash
curl "http://localhost:8000/api/widgets/kpi"
curl "http://localhost:8000/api/widgets/kpi?months=2024-04&levels=Entry%20level&has_desc=1"
```

(`%20` — це пробіл в URL.)

Другий виклик того самого запиту з тими самими фільтрами відповість миттєво — спрацював кеш. Коли перезаливаєш дані в базу, кеш скидається перезапуском бекенду (або за 5 хвилин сам).

---

## 6. Тести

```bash
cd backend
pytest
```

Три тести, які не потребують бази: що SQL-файли знайдено й розібрано, що `/api/widgets` їх віддає, що невідомий віджет дає 404. Має бути `3 passed`. Наявність `tests/` і зелений `pytest` — те, на що дивляться в портфоліо.

Щоб тести знаходили пакет `app`, їх треба запускати саме з папки `backend/`.

---

## 7. Бекенд у Docker (опційно, але красиво)

Тепер `docker-compose.yml` описує два сервіси, і весь проєкт (база + API) піднімається однією командою:

```bash
docker compose up -d --build
```

`--build` збирає образ бекенду з `backend/Dockerfile`: бере легкий Python, ставить `requirements.txt`, копіює код і папку `sql/queries`. Зверни увагу на `CH_HOST: clickhouse` у compose — усередині docker-мережі контейнери бачать один одного за назвами сервісів, а не як `localhost`.

Перевірка та сама: http://localhost:8000/docs. Логи: `docker compose logs -f backend`.

Для щоденної розробки зручніше все ж запускати `uvicorn --reload` локально (миттєво підхоплює зміни), а Docker-варіант — для «клонував і запустив». Обидва способи опиши в README.

Документація Dockerfile: https://docs.docker.com/reference/dockerfile/

---

## 8. Коміт

Перевір `git status`: у списку не має бути `.venv/`, `.env`, `__pycache__/`, `.pytest_cache/`. Якщо `.pytest_cache/` з'явився — додай у `.gitignore`.

```bash
git add .
git commit -m "feat: FastAPI backend with generic widget endpoint, filters, cache and tests"
git push
```

І доповни README: розділ «API» з таблицею ендпоінтів із розділу 2 та командою запуску.

---

## Типові помилки

| Повідомлення | Причина | Що робити |
|---|---|---|
| `ModuleNotFoundError: No module named 'app'` | uvicorn або pytest запущено не з папки `backend/` | `cd backend` |
| `ModuleNotFoundError: No module named 'fastapi'` | не активовано venv або не встановлено залежності | `source .venv/bin/activate`, потім `pip install -r backend/requirements.txt` |
| `/api/health` → 503 `Connection refused` | ClickHouse не запущений або не той порт | `docker compose ps`, `.env` має `CH_PORT=8123` |
| `/api/health` → 503 `Authentication failed` | не той користувач/пароль | звір `.env` з `docker-compose.yml` |
| `502 ClickHouse error: Unknown identifier` | у SQL-файлі помилка | запусти той самий файл через `./scripts/run_query.sh` — покаже точну помилку |
| `Address already in use` | порт 8000 зайнятий іншим процесом | `uvicorn ... --port 8001` або закрий попередній uvicorn |

---

## Критерій готовності кроку 2

- [ ] `pytest` у `backend/` → `3 passed`
- [ ] `uvicorn` запускається, `/api/health` показує `status: ok` і реальну кількість вакансій
- [ ] У `/docs` всі 25 віджетів віддають дані, фільтри змінюють результат
- [ ] `docker compose up -d --build` піднімає базу і API разом
- [ ] Закомічено, README доповнено

Далі — крок 3: React-фронтенд, який ходить на ці ендпоінти й малює графіки ECharts. Готуючись, збережи собі відповідь `/api/widgets` — вона стане технічним завданням для генерації інтерфейсу.
