# 🔔 Настройка уведомлений о назначениях

## Проблема:
Уведомления не приходят исполнителю при создании задачи или монтажа.

## Решение:

### 1. Проверка работы уведомлений в браузере

**Текущая реализация:**
- Уведомления сохраняются в таблицу `notification_queue`
- Показываются только если у пользователя есть разрешение браузера
- OneSignal НЕ используется (требуется дополнительная настройка бэкенда)

### 2. Как проверить работу:

#### Шаг 1: Разрешите уведомления в браузере
```javascript
// При загрузке приложения появляется запрос
Notification.requestPermission()
```

Если запретили - разрешите в настройках браузера:
- Chrome: `chrome://settings/content/notifications`
- Firefox: `about:preferences#privacy` → Уведомления

#### Шаг 2: Проверьте сохранение уведомлений в БД

После создания задачи/монтажа проверьте таблицу `notification_queue`:

```sql
SELECT * FROM notification_queue 
ORDER BY created_at DESC 
LIMIT 5;
```

Должна появиться запись:
- `user_id`: ID назначенного исполнителя
- `title`: "📋 Новое назначение"
- `body`: "Вам назначена задача/монтаж от: ..."
- `sent`: false

#### Шаг 3: Проверка получения уведомлений

При загрузке приложения функция `checkAndShowPendingNotifications()`:
1. Загружает последние 5 несохранённых уведомлений
2. Показывает браузерное уведомление
3. Помечает как `sent: true`

### 3. Тестирование:

1. **Откройте два браузера**
2. **Браузер 1**: Залогиньтесь как Manager
3. **Браузер 2**: Залогиньтесь как Worker
4. **Браузер 1**: Создайте задачу/монтаж на Worker
5. **Браузер 2**: Должен получить уведомление (если открыто окно)

ИЛИ:

6. **Браузер 2**: Закройте вкладку
7. **Браузер 1**: Создайте задачу на Worker
8. **Браузер 2**: Откройте заново - должно прийти уведомление из базы

### 4. Добавлена функция проверки:

В коде теперь есть отладочная информация:
```javascript
console.log('Sending notification:', resourceId, 'to', assigneeId);
console.log('Notification saved to queue for assignee:', assigneeId);
console.log('Browser notification shown to assignee');
```

**Проверьте консоль браузера (F12)** после создания задачи - должны быть эти логи.

### 5. Возможные проблемы и решения:

#### ❌ Уведомления не показываются
**Причина:** Нет разрешения браузера  
**Решение:** Разрешить в настройках браузера

#### ❌ Уведомления не сохраняются в БД
**Причина:** Ошибка Supabase или нет таблицы `notification_queue`  
**Решение:** Проверить наличие таблицы:

```sql
-- Создать таблицу если нет
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task_assigned', 'status_changed', 'comment_added', 'general')),
   reference_id UUID,
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_sent ON notification_queue(sent);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notification_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notification_queue FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update notifications"
  ON notification_queue FOR UPDATE
  USING (auth.role() = 'authenticated');
```

#### ❌ Уведомления приходят только при перезагрузке
**Причина:** Не работает realtime-обновление  
**Решение:** Добавить периодическую проверку каждые 30 секунд:

```javascript
setInterval(() => {
  if (currentUserProfile?.id) {
        checkAndShowPendingNotifications();
    }
}, 30000);
```

### 6. Push-уведомления через OneSignal (опционально):

Для настоящих push-уведомлений (даже при закрытом браузере) нужна доработка бэкенда:

1. Установить OneSignal SDK на бэкенд
2. Создать endpoint `/api/notifications/send-push/:id`
3. Отправлять уведомление через OneSignal API при сохранении в `notification_queue`

**Документация:** https://documentation.onesignal.com/reference/rest-api-overview

### 7. Файлы для проверки:

- `index.html` (строки ~1660-1716): Функция `notifyUserAssignedToTask()`
- `index.html` (строки ~2109-2153): Функция `checkAndShowPendingNotifications()`
- `index.html` (строки ~2082, 2094-2100): Инициализация уведомлений

## Готово!
