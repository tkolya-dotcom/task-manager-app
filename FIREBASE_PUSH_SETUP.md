# 🔥 Полная настройка Push-уведомлений через Firebase(FCM)

## Настройка уведомлений при закрытом браузере

---

## 📋 Шаг 1: Создание проекта в Firebase

### 1.1 Зарегистрируйтесь в Firebase
1. Перейдите на https://console.firebase.google.com/
2. Войдите через Google аккаунт
3. Нажмите **"Add project"** или **"Создать проект"**

### 1.2 Настройте проект
```
Название проекта: Task Manager(или любое другое)
Google Analytics: можно отключить (не обязательно)
```

### 1.3 Получите конфигурацию
1. В меню слева: **Project settings** (шестерёнка)
2. Прокрутите вниз до **"Your apps"**
3. Нажмите иконку **Web** (`</>`)
4. Зарегистрируйте приложение:
   ```
   App nickname: Task Manager Web
   ```
5. Скопируйте конфиг:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

## 📋 Шаг 2: Включение Cloud Messaging API

### 2.1 Включите FCM
1. В консоли Firebase перейдите в раздел **Cloud Messaging**
2. Если не включён - нажмите **Enable**

### 2.2 Получите ключи VAPID
1. В настройках проекта (шестерёнка) → **Cloud Messaging**
2. Найдите **"Web Push certificates"**
3. Сгенерируйте ключи, если нет:
   ```
   Key pair: Generate key pair
   ```
4. Скопируйте **VAPID public key**

---

## 📋 Шаг 3: Создание Service Worker для FCM

### 3.1 Создайте файл `firebase-messaging-sw.js`

В корне проекта создайте новый файл:

```javascript
// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data.reference_id,
   requireInteraction: true,
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received');
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/task-manager-app/')
  );
});
```

---

## 📋 Шаг 4: Добавление Firebase SDK в приложение

### 4.1 Обновите `index.html`

Вставьте после строки с Supabase (строка ~1436):

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>
<script>
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
   messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  const messaging = firebase.messaging();
</script>
```

**Замените значения на ваши из Firebase Console!**

---

## 📋 Шаг 5: Создание таблицы в базе данных

### 5.1 Выполните SQL в Supabase

```sql
-- Таблица для FCM токенов
CREATE TABLE IF NOT EXISTS fcm_tokens(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);

-- RLS policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tokens"
  ON fcm_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert tokens"
  ON fcm_tokens FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "System can update tokens"
  ON fcm_tokens FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can delete tokens"
  ON fcm_tokens FOR DELETE
  USING (auth.role() = 'authenticated');
```

---

## 📋 Шаг 6: Установка Firebase Admin SDK на бэкенд

### 6.1 Установите пакет

```bash
cd backend
npm install firebase-admin
```

### 6.2 Скачайте сервисный ключ

1. Firebase Console → Project settings → Service accounts
2. Нажмите **"Generate new private key"**
3. Скачайте JSON файл
4. Сохраните как `backend/firebase-service-account.json`
5. **Не коммитьте этот файл в Git!** (добавьте в .gitignore)

---

## 📋 Шаг 7: Создание endpoint для отправки уведомлений

### 7.1 Создайте файл `backend/src/routes/notifications.js`

```javascript
import express from 'express';
import admin from 'firebase-admin';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (serviceAccount.type) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn('Firebase credentials not configured');
}

const router = express.Router();

/**
 * Send push notification via Firebase
 */
router.post('/send-push/:notificationId', authenticateToken, async (req, res) => {
  try {
   const { notificationId} = req.params;
    
    // Check if Firebase is initialized
   if (!admin.apps.length) {
     console.warn('Firebase Admin not initialized');
     return res.status(503).json({ error: 'Push notifications not configured' });
    }
    
    // Get notification from DB
   const { data: notification, error: notifError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('id', notificationId)
      .single();
    
   if (notifError || !notification) {
     return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Get user's FCM tokens
   const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', notification.user_id);
    
   if (tokenError || !tokens || tokens.length === 0) {
     console.log('No FCM tokens for user:', notification.user_id);
     return res.status(200).json({ message: 'No tokens found' });
    }
    
    // Send to all user's devices
   const tokensList = tokens.map(t => t.token);
    
   const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      },
      data: {
       reference_id: notification.reference_id || '',
        type: notification.type || 'general'
      },
      tokens: tokensList
    };
    
   const response = await admin.messaging().sendEachForMulticast(message);
    
   console.log(
      'Push notifications sent:', 
     response.successCount, 
      'failed:', 
     response.failureCount
    );
    
    // Mark as sent in database
    await supabase
      .from('notification_queue')
      .update({ sent: true })
      .eq('id', notificationId);
    
   res.json({ 
      success: true, 
     count: response.successCount,
      failed: response.failureCount 
    });
  } catch (error) {
   console.error('Error sending push notification:', error);
   res.status(500).json({ 
      error: error.message,
      details: error.errorInfo 
    });
  }
});

/**
 * Register FCM token
 */
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
   const { token } = req.body;
    
   if (!token) {
     return res.status(400).json({ error: 'Token required' });
    }
    
   const userId = req.user.id;
    
   const { error } = await supabase
      .from('fcm_tokens')
      .upsert({
        user_id: userId,
        token: token,
        last_used_at: new Date().toISOString()
      });
    
   if (error) throw error;
    
   res.json({ success: true });
  } catch (error) {
   console.error('Error registering token:', error);
   res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 7.2 Добавьте роут в `backend/src/index.js`

После строки 14 (импорты):

```javascript
import notificationsRoutes from './routes/notifications.js';
```

После строки 54 (маршруты):

```javascript
app.use('/api/notifications', notificationsRoutes);
```

---

## 📋 Шаг 8: Настройка переменных окружения

### 8.1 Обновите `backend/.env`

Добавьте:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

**Важно:** Вставьте всё содержимое JSON файла одной строкой!

### 8.2 Добавьте в `.gitignore`

```
backend/firebase-service-account.json
```

---

## 📋 Шаг 9: Обновление frontend кода

### 9.1 Обновите функцию `initNotifications()`

В `index.html` (строки ~1487) замените на:

```javascript
async function initNotifications() {
   if (!('Notification' in window)) {
       console.log('This browser does not support notifications');
       return;
    }
    
   console.log('Notification permission:', Notification.permission);
    
    // Request permission
   if (Notification.permission === 'default') {
       const permission= await Notification.requestPermission();
       console.log('Notification permission result:', permission);
       if (permission === 'granted') {
           console.log('Notification permission granted');
            await saveNotificationPermission(permission);
            await subscribeToFcm(); // Subscribe to FCM
        } else if (permission === 'denied') {
           console.log('Notification permission denied');
            showToast('🔔 Уведомления запрещены. Разрешите в настройках браузера.');
        }
    } else if (Notification.permission === 'granted') {
       console.log('Notifications already enabled');
        await saveNotificationPermission('granted');
        await subscribeToFcm(); // Subscribe to FCM
    }
}
```

### 9.2 Добавьте функции для работы с FCM

После функции `initNotifications()` добавьте:

```javascript
// Subscribe to Firebase Cloud Messaging
async function subscribeToFcm() {
   try {
        // Check if messaging is available
       if (!window.messaging) {
           console.log('Firebase Messaging not initialized');
           return;
        }
        
        // Request token
       const token = await messaging.getToken({
            vapidKey: 'YOUR_VAPID_PUBLIC_KEY_HERE' // Ваш VAPID ключ из Firebase Console
        });
        
       console.log('FCM Token:', token);
        
        // Save token to database
       if (token && currentUserProfile?.id) {
            await saveFcmToken(currentUserProfile.id, token);
        }
    } catch (error) {
       console.error('Error getting FCM token:', error);
    }
}

// Save FCM token to database
async function saveFcmToken(userId, token) {
   try {
       const { error } = await supabase
            .from('fcm_tokens')
            .upsert({
                user_id: userId,
                token: token,
                last_used_at: new Date().toISOString()
            });
        
       if (error) throw error;
       console.log('FCM token saved to database');
    } catch (error) {
       console.error('Error saving FCM token:', error);
    }
}

// Update token when user logs in
async function updateFcmTokenOnLogin() {
   if (Notification.permission === 'granted' && window.messaging) {
       try {
           const token = await messaging.getToken({
                vapidKey: 'YOUR_VAPID_PUBLIC_KEY_HERE'
            });
            
           if (token && currentUserProfile?.id) {
                await saveFcmToken(currentUserProfile.id, token);
            }
        } catch (error) {
           console.error('Error updating FCM token on login:', error);
        }
    }
}
```

### 9.3 Обновите функцию входа

В функции `login()` (строки ~1839) после успешного входа добавьте:

```javascript
// После строки с setCurrentUser(...)
await updateFcmTokenOnLogin();
```

### 9.4 Обновите `notifyUserAssignedToTask()`

В `index.html` (строки ~1660) добавьте вызов бэкенда после сохранения в queue:

```javascript
// После сохранения в notification_queue
const notificationId = notifData?.[0]?.id;
if (notificationId) {
   try {
        await fetch('/api/notifications/send-push/' + notificationId, {
           method: 'POST',
           headers: getAuthHeaders()
        });
       console.log('Push notification triggered via Firebase');
    } catch (pushError) {
       console.error('Error triggering push:', pushError);
    }
}
```

---

## 📋 Шаг 10: Регистрация Service Worker

### 10.1 Обновите регистрацию SW

В `index.html` найдите регистрацию service worker (строки ~1552) и обновите:

```javascript
async function registerServiceWorkerAndSubscribe() {
   try {
        // Register main service worker
       const registration = await navigator.serviceWorker.register('/service-worker.js');
       console.log('Service Worker registered:', registration);
        
        // Also register Firebase messaging service worker
       const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope'
        });
       console.log('Firebase messaging SW registered:', swRegistration);
        
        // Request notification permission
       const permission = await Notification.requestPermission();
        
       if (permission === 'granted') {
            // Subscribe to push notifications
           const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY_HERE')
            });
            
            // Save subscription to database
            await savePushSubscription(subscription);
            
           console.log('Push subscription saved:', subscription);
        }
    } catch (error) {
       console.error('Error registering service worker or subscribing:', error);
    }
}
```

---

## 📋 Шаг 11: Тестирование

### 11.1 Проверка работы

1. **Откройте приложение** в браузере
2. **Разрешите уведомления** (появится запрос)
3. **Откройте консоль (F12)** и проверьте:
   ```
   FCM Token: <должен быть токен>
  FCM token saved to database
   ```
4. **Закройте браузер полностью**
5. **Создайте задачу** с назначением исполнителя
6. **Проверьте уведомление** через 5-10 секунд

### 11.2 Проверка базы данных

```sql
-- Проверка токенов
SELECT * FROM fcm_tokens WHERE user_id = '<ID_пользователя>';

-- Проверка уведомлений
SELECT * FROM notification_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

### 11.3 Отладка

**Логи frontend:**
```javascript
console.log('FCM Token:', token);
console.log('Push notification triggered via Firebase');
```

**Логи backend:**
```
Push notifications sent: X failed: Y
```

---

## 🔧 Возможные проблемы и решения

### ❌ Ошибка: "Firebase Admin not initialized"

**Причина:** Неправильно настроен `FIREBASE_SERVICE_ACCOUNT`

**Решение:**
1. Проверьте, что JSON вставлен одной строкой
2. Экранируйте кавычки и переносы строк
3. Перезапустите backend

### ❌ Ошибка: "No FCM tokens for user"

**Причина:** Пользователь не подписался на FCM

**Решение:**
1. Разрешите уведомления в браузере
2. Перезагрузите страницу
3. Проверьте консоль на наличие токена

### ❌ Уведомления не приходят

**Причина:** Блокировка CORS или неправильный URL

**Решение:**
1. Проверьте, что backend доступен по тому же origin
2. Настройте CORS в `backend/src/index.js`:
   ```javascript
   app.use(cors({
     origin: ['http://localhost:3001', 'https://your-domain.com']
   }));
   ```

### ❌ Service Worker не регистрируется

**Причина:** HTTPS требуется для SW

**Решение:**
- Localhost: работает без HTTPS
- Production: настройте HTTPS

---

## ✅ Чеклист готовности

- [ ] Проект создан в Firebase
- [ ] Получен firebaseConfig
- [ ] Создан `firebase-messaging-sw.js`
- [ ] Добавлен Firebase SDK в index.html
- [ ] Создана таблица `fcm_tokens` в Supabase
- [ ] Установлен `firebase-admin`
- [ ] Скачан сервисный ключ
- [ ] Создан endpoint `/api/notifications/send-push`
- [ ] Настроен `FIREBASE_SERVICE_ACCOUNT` в .env
- [ ] Обновлён frontend код
- [ ] Получен и сохранён FCM токен
- [ ] Протестирована отправка уведомлений

---

## 📚 Дополнительные ресурсы

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging/js-client)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)

---

## 🎉 Готово!

Теперь уведомления будут приходить даже при **закрытом браузере** через Firebase Cloud Messaging!
