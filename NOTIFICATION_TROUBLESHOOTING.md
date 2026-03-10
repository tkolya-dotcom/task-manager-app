# Проверка и включение уведомлений

## Быстрая проверка

1. **Откройте консоль** (F12)
2. **Введите команду:**
   ```javascript
   Notification.permission
   ```
3. **Результат:**
   - `"granted"` ✅ - уведомления разрешены
   - `"default"` ⚠️ - нужно запросить разрешение
   - `"denied"` ❌ - уведомления запрещены

---

## Включение уведомлений

### Вариант 1: Разрешить в браузере

**Chrome/Edge:**
1. Нажмите на иконку 🔒 слева от URL
2. Найдите "Уведомления" → переключите в "Разрешить"
3. Обновите страницу (Ctrl+F5)

**Firefox:**
1. Кликните на иконку 🔒 слева от URL  
2. Нажмите "Заблокировано" рядом с "Уведомления"
3. Выберите "Разрешить"
4. Обновите страницу

**Safari:**
1. Safari → Настройки → Веб-сайты → Уведомления
2. Найдите сайт в списке
3. Выберите "Разрешить"

---

## Тестирование

### Метод 1: Через консоль
```javascript
// Проверить разрешение
Notification.permission

// Запросить разрешение
Notification.requestPermission()

// Тестовое уведомление
new Notification('Тест!', {
    body: 'Проверка работы уведомлений',
    icon: '/icon-192.png'
});
```

### Метод 2: Через интерфейс
1. Откройте консоль (F12)
2. Введите:
   ```javascript
   window.testNotification()
   ```
3. Должно появиться уведомление

---

## Решение проблем

### Уведомления не работают

**Шаг 1: Проверьте поддержку браузером**
```javascript
'Notification' in window  // должно быть true
```

**Шаг 2: Проверьте логи**
```javascript
// В консоли должно быть:
console.log('Notification permission:', Notification.permission);
```

**Шаг 3: Принудительный запрос**
```javascript
await Notification.requestPermission();
```

### Уведомления заблокированы

Если `Notification.permission === 'denied'`:

**Chrome:**
1. chrome://settings/content/notifications
2. Найдите сайт в списке "Запрещено"
3. Удалите или измените на "Разрешено"

**Firefox:**
1. about:preferences#privacy
2. Прокрутите до "Разрешения" → "Уведомления" → "Параметры"
3. Найдите сайт и удалите блокировку

### Уведомления не приходят при назначении

**Проверьте код:**
```javascript
// Логи должны показать:
console.log('Sending notification:', resourceId, 'to', assigneeId);
console.log('Browser notification shown to assignee');
```

**Проблема:** Уведомление показывается только если вы назначены исполнителем!

**Решение:** Назначьте задачу себе для теста.

---

## Автоматическое включение при загрузке

При запуске приложения:
1. Проверяется разрешение
2. Если не "granted" → запрашивается
3. Если "denied" → показывается toast с инструкцией

---

## Логирование

Для диагностики добавьте в код:

```javascript
console.log('Permission:', Notification.permission);
console.log('Notification created:', notification);
console.log('Notification clicked');
```
