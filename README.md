# Сайт-визитка — Александр Долгошеев (Python)

FastAPI + SQLite. Тот же сайт, что и Java-версия: бэкенд отдаёт профиль через REST и принимает
сообщения из формы обратной связи, фронтенд — статические HTML/CSS/JS без сборки.

## Запуск

Нужен [uv](https://docs.astral.sh/uv/) (Python он поставит сам, если нужно).

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

Откройте http://localhost:8080. Документация API (Swagger) — http://localhost:8080/docs.

Тесты и линтер:

```bash
uv run pytest
uv run ruff check .
```

## Как поменять содержимое

Все тексты лежат в [`app/profile.yml`](app/profile.yml): имя, «обо мне», контакты, стек, проекты, обучение.
Пустые поля (`location`, `period`) на странице скрываются. Иконки контактов есть для `email`, `github`,
`telegram`, `linkedin`, для остальных — общая «ссылка».

## API

| Метод | Путь | Что делает |
|-------|------|------------|
| GET | `/api/profile` | данные визитки |
| POST | `/api/contact` | сохранить сообщение `{name, email, message}`; ошибки валидации — `400` с полями `detail` и `errors` |
| GET | `/api/health` | проверка живости |

## Сообщения из формы

Сохраняются в SQLite (`data/business-card.db`, путь меняется переменной `DB_PATH`) и пишутся в лог:

```bash
sqlite3 data/business-card.db "SELECT * FROM contact_messages ORDER BY created_at DESC;"
```

## Структура

```
app/
├── main.py       приложение FastAPI, роуты, обработка ошибок валидации
├── contact.py    модель запроса с валидацией и сохранение сообщения
├── db.py         подключение к SQLite и схема
├── profile.py    чтение profile.yml
├── profile.yml
└── static/       index.html, styles.css, app.js
tests/test_app.py
```
