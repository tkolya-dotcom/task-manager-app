# Планировщик - Task Manager Application

## Быстрый старт / Quick Start

### Запуск приложения / Running the Application

```
bash
# Установить зависимости (если нужно) / Install dependencies (if needed)
cd backend && npm install

# Запустить сервер / Start the server
node start.js
# или / or
npm start
```

После запуска откройте файл `index.html` в браузере.

After starting the server, open `index.html` in your browser.

## Тестовые аккаунты / Test Accounts

- **Менеджер / Manager:** Tkolya@gmail.com
- **Работник / Worker:** worker@test.com
- **Пароль / Password:** любой / any

## Требования / Requirements

1. **Supabase** - База данных должна быть настроена с использованием схемы из `sql/schema.sql`
2. **Node.js** - Версия 18 или выше
3. **.env файл** - Должен содержать настройки Supabase в `backend/.env`

## Структура проекта / Project Structure

```
├── index.html          # Основной фронтенд (один файл) / Main frontend (single file)
├── start.js           # Скрипт запуска / Start script
├── package.json       # Корневой package.json / Root package.json
├── backend/           # Серверная часть / Backend
│   ├── src/
│   │   ├── index.js   # Точка входа сервера / Server entry point
│   │   ├── routes/   # API маршруты / API routes
│   │   └── config/   # Конфигурация / Configuration
│   └── .env          # Переменные окружения / Environment variables
├── frontend/         # React фронтенд (альтернативный) / React frontend (alternative)
└── sql/
    └── schema.sql    # Схема базы данных / Database schema
```

## Настройка .env / .env Setup

Создайте файл `backend/.env` на основе `backend/.env.example`:

```
env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

## API Endpoints

- `GET /health` - Проверка здоровья сервера / Health check
- `POST /api/auth/login` - Вход / Login
- `POST /api/auth/register` - Регистрация / Registration
- `GET /api/projects` - Список проектов / List projects
- `GET /api/tasks` - Список задач / List tasks
- `GET /api/installations` - Список монтажей / List installations
- `GET /api/purchase-requests` - Список заявок / List purchase requests

## Порт / Port

Сервер запускается на порту 3001 по умолчанию.
The server runs on port 3001 by default.

Фронтенд (index.html) подключается к `http://localhost:3001/api`
Frontend connects to `http://localhost:3001/api`
