# Task Manager Application - Приложение для управления задачами

## Быстрый старт

### Запуск приложения

```bash
# Установка зависимостей (если нужно)
cd backend && npm install

# Запуск сервера
node start.js
# или
npm start
```

### Использование index.html

После запуска сервера откройте `index.html` в вашем браузере.

## Тестовые аккаунты

- **Менеджер**: Tkolya@gmail.com
- **Работник**: worker@test.com  
- **Пароль**: любой

## Требования

1. **Supabase** - примените схему из `sql/schema.sql`
2. **Node.js** - версия 18+
3. **Переменные окружения** - настройте Supabase в `backend/.env`

## Структура проекта

```
.
├── index.html              # Главный фронтенд (единый файл)
├── start.js                # Скрипт запуска
├── package.json            # package.json корня
├── backend/                # Бэкенд
│   ├── src/
│   │   ├── index.js        # Входная точка сервера
│   │   └── routes/         # API маршруты
│   ├── config/             # Конфигурация
│   └── .env                # Переменные окружения
├── frontend/               # React фронтенд (альтернатива)
└── sql/
    └── schema.sql          # Схема базы данных
```

## Настройка .env

Создайте `backend/.env` или `backend/.env.example`:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key  
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=3001
```

## API Endpoints

- `GET /health` - Проверка работоспособности
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `GET /api/projects` - Список проектов
- `GET /api/tasks` - Список задач
- `GET /api/installations` - Список монтажей
- `GET /api/purchase-requests` - Список заявок на закупку

## Порт

Сервер по умолчанию работает на порту 3001.
Фронтенд в `index.html` подключается к `http://localhost:3001/api`
