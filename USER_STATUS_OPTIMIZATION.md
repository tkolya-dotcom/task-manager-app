# Улучшение отображения статуса пользователей (Онлайн/Офлайн)

## Выполненные оптимизации:

### 1. ✅ Ускорение обновления heartbeat
**Было:** 30 секунд  
**Стало:** 10 секунд

Файл: `index.html`, строка ~1765
```javascript
heartbeatInterval = setInterval(async () => {
   if (currentUserProfile?.id) {
        await updateUserStatus(true);
    }
}, 10000); // 10 seconds instead of 30 for faster updates
```

### 2. ✅ Ускорение обновления статусов пользователей
**Было:** 30 секунд  
**Стало:** 15 секунд

Файл: `index.html`, строка ~1791
```javascript
userStatusInterval = setInterval(() => {
   if (currentView === 'dashboard') {
        loadUserStatus();
    }
}, 15000); // 15 seconds instead of 30 for faster updates
```

### 3. ⏳ Рекомендуемая оптимизация определения Online/Offline

**Текущий код (строка ~5888-5890):**
```javascript
const lastSeen = user.last_seen_at ? new Date(user.last_seen_at) : null;
const isRecentlyActive = lastSeen && (now - lastSeen) < 120000; // 2 minutes
```

**Рекомендуется изменить на:**
```javascript
const lastSeen = user.last_seen_at ? new Date(user.last_seen_at) : null;
const isRecentlyActive = lastSeen && (now - lastSeen) < 30000; // 30 seconds instead of 2 minutes
```

Это сделает определение online более чувствительным и быстрым.

## Результат оптимизации:

| Параметр | Было | Стало | Улучшение |
|----------|------|-------|-----------|
| Heartbeat интервал | 30 сек | 10 сек | **в 3 раза быстрее** |
| Обновление статусов | 30 сек | 15 сек | **в 2 раза быстрее** |
| Определение online | 2 мин | 30 сек* | **в 4 раза точнее** |

*при применении рекомендации №3

## Как это работает:

1. **Heartbeat (10 сек)** - каждые 10 секунд обновляется `last_seen_at` текущего пользователя
2. **Status Polling (15 сек)** - каждые 15 секунд загружаются статусы всех пользователей
3. **Online Detection (30 сек)** - пользователь считается online, если был активен в последние 30 секунд

## Дополнительные улучшения:

### Мгновенное обновление при переключении вкладок
При возврате на вкладку приложения статус мгновенно обновляется:
```javascript
document.addEventListener('visibilitychange', async () => {
   if (document.visibilityState === 'visible') {
        await updateUserStatus(true);
        startHeartbeat();
    }
});
```

### Корректный уход в offline
При закрытии вкладки или браузера:
```javascript
window.addEventListener('beforeunload', async () => {
    await updateUserStatus(false);
});
```

## Тестирование:

1. Откройте приложение в двух разных браузерах
2. Залогиньтесь под разными пользователями
3. Проверьте, что статусы обновляются в течение 15-30 секунд
4. Закройте одну вкладку - статус должен измениться на offline через ~30 секунд

## Примечание:

Чем чаще обновления, тем больше нагрузка на базу данных. 
Данные оптимизации находят баланс между скоростью отклика и производительностью.
