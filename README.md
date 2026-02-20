# Планировщик - Task Manager Application

PWA приложение для управления задачами, проектами и монтажами.

## Быстрый старт / Quick Start

Приложение работает как PWA (Progressive Web App) без необходимости запуска сервера.

### Запуск / Running

1. Откройте [GitHub Pages](https://tkolya-dotcom.github.io/task-manager-app/) в браузере
2. Или откройте `index.html` локально

## Тестовые аккаунты / Test Accounts

- **Менеджер / Manager:** Tkolya@gmail.com
- **Работник / Worker:** worker@test.com
- **Пароль / Password:** любой / any

## Требования / Requirements

1. **Supabase** - База данных должна быть настроена с использованием схемы из `sql/schema.sql`
2. Supabase URL и Anon Key прописаны в `index.html`

## Структура проекта / Project Structure

```
├── index.html          # Основной фронтенд (один файл) / Main frontend (single file)
├── service-worker.js   # Service Worker для PWA
├── manifest.json       # PWA манифест
└── sql/
    └── schema.sql      # Схема базы данных / Database schema
```

## Технологии / Tech Stack

- **Frontend:** Vanilla JS, HTML5, CSS3
- **Backend:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Magic Link / OTP)
- **PWA:** Service Worker, Web App Manifest
- **Деплой:** GitHub Pages

## API / Supabase Tables

- `projects` - Проекты
- `tasks` - Задачи
- `installations` - Монтажи
- `purchase_requests` - Заявки на закупку
- `profiles` - Профили пользователей
