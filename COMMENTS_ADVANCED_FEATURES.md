# Расширенные функции комментариев

## Реализованные улучшения

### 1. ✅ Редактирование комментариев

**Возможности:**
- Редактирование своих комментариев
- Индикатор "изменено" (is_edited = true)
- Сохранение истории изменений через updated_at

**Использование:**
```javascript
// Обновление комментария
await supabase
  .from('comments')
  .update({ 
    message: 'Новый текст',
    is_edited: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', commentId);
```

**UI:**
- Кнопка "✏️ Редактировать" рядом со своими комментариями
- При редактировании поле ввода заполняется текущим текстом
- После сохранения добавляется пометка "(изменено)"

---

### 2. ✅ Упоминания пользователей (@username)

**Возможности:**
- Автодополнение при вводе @
- Клик по упоминанию открывает профиль
- Уведомление упомянутому пользователю

**Формат:**
```
@Иван Иванов проверишь материалы?
```

**Логика:**
1. Пользователь вводит `@`
2. Появляется выпадающий список пользователей
3. Выбор пользователя → вставка `@user_id` в текст
4. При отправке:
   - Извлекаем user_id из текста
   - Создаем запись в notification_queue
   - Отображаем в UI как ссылку

**Пример обработки:**
```javascript
// Извлечение упоминаний из текста
const mentions = message.match(/@([a-f0-9-]+)/g);

// Создание уведомлений
if (mentions) {
  const userIds = mentions.map(m => m.substring(1)); // убираем @
  
  await supabase
    .from('notification_queue')
    .insert(userIds.map(uid => ({
      user_id: uid,
      title: '🔔 Вас упомянули',
      body: comment.message,
      type: 'comment_mention',
      reference_id: comment.id
    })));
}
```

---

### 3. ✅ Вложение файлов к комментариям

**Возможности:**
- Загрузка изображений (PNG, JPG, GIF)
- Загрузка документов (PDF, DOC, XLS)
- Предпросмотр изображений
- Скачивание файлов

**Структура:**
```sql
ALTER TABLE comments ADD COLUMN file_url TEXT;
ALTER TABLE comments ADD COLUMN file_name TEXT;
```

**Загрузка файла:**
```javascript
async function uploadCommentFile(file, commentId) {
  // 1. Загружаем файл в Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${commentId}-${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('comment-files')
    .upload(fileName, file);
  
  if (uploadError) throw uploadError;
  
  // 2. Получаем публичную ссылку
  const { data: urlData } = supabase.storage
    .from('comment-files')
    .getPublicUrl(fileName);
  
  // 3. Сохраняем в комментарий
  await supabase
    .from('comments')
    .update({
      file_url: urlData.publicUrl,
      file_name: file.name
    })
    .eq('id', commentId);
}
```

**UI отображения:**
```html
<!-- Изображение -->
<div class="comment-file">
  <img src="${file_url}" alt="${file_name}" style="max-width:300px;border-radius:8px"/>
  <a href="${file_url}" download>⬇ Скачать</a>
</div>

<!-- Документ -->
<div class="comment-file">
  📎 ${file_name}
  <a href="${file_url}" download>⬇ Скачать</a>
</div>
```

**Хранилище:**
```sql
-- Создать бакет в Supabase Storage
-- Bucket name: comment-files
-- Public: true
-- File size limit: 10MB
```

---

### 4. ✅ Уведомления об ответах

**Возможности:**
- Уведомление автору родительского комментария
- Уведомление при ответе (parent_comment_id)
- Отслеживание прочтения

**Логика работы:**
```javascript
// При создании комментария с parent_comment_id
if (parentCommentId) {
  // Находим автора родительского комментария
  const { data: parentComment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', parentCommentId)
    .single();
  
  // Создаем уведомление
  await supabase
    .from('notification_queue')
    .insert({
      user_id: parentComment.user_id,
      title: '💬 Ответ на ваш комментарий',
      body: comment.message,
      type: 'comment_reply',
      reference_id: comment.id,
      read: false
    });
}
```

**UI ответов:**
```html
<!-- Родительский комментарий -->
<div class="comment">
  Текст родителя...
</div>

<!-- Ответ (с отступом) -->
<div class="comment comment-reply" style="margin-left:40px;border-left:3px solid var(--accent)">
  👤 Иван ответил:
  <div>Текст ответа...</div>
</div>
```

---

### 5. ✅ Смайлики и форматирование текста

**Возможности:**
- Эмодзи picker
- Жирный текст (**текст**)
- Курсив (*текст*)
- Списки (- элемент)
- Код (`код`)
- Цитаты (> текст)

**Реализация:**

#### A. Эмодзи Picker
```html
<button onclick="toggleEmojiPicker()">😀</button>
<div id="emojiPicker" style="display:none;position:absolute;">
  <!-- Популярные эмодзи -->
  <span onclick="insertEmoji('👍')">👍</span>
  <span onclick="insertEmoji('❤️')">❤️</span>
  <span onclick="insertEmoji('😊')">😊</span>
  ...
</div>
```

```javascript
function insertEmoji(emoji) {
  const input = document.getElementById('commentInput');
  input.value += emoji;
  input.focus();
  toggleEmojiPicker();
}
```

#### B. Форматирование текста
```javascript
// Простой парсер Markdown-подобного синтаксиса
function formatCommentText(text) {
 return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **жирный**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // *курсив*
    .replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px">$1</code>') // `код`
    .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid #ddd;margin:10px 0;padding-left:10px;color:#666">$1</blockquote>') // > цитата
    .replace(/^- (.*$)/gm, '<li style="margin-left:20px">$1</li>'); // - списки
}
```

**UI с кнопками форматирования:**
```html
<div class="comment-editor">
  <div class="editor-toolbar">
    <button onclick="formatText('bold')" title="Жирный"><b>B</b></button>
    <button onclick="formatText('italic')" title="Курсив"><i>I</i></button>
    <button onclick="formatText('code')" title="Код">&lt;/&gt;</button>
    <button onclick="toggleEmojiPicker()" title="Эмодзи">😀</button>
    <button onclick="attachFile()" title="Прикрепить файл">📎</button>
  </div>
  <textarea id="commentInput" placeholder="Введите комментарий..."></textarea>
  <input type="file" id="fileInput" style="display:none" onchange="handleFileSelect(event)"/>
</div>
```

---

## Полный пример интеграции

### HTML
```html
<div class="comment-section">
  <div class="comment-editor">
    <div class="editor-toolbar">
      <button onclick="formatText('bold')"><b>B</b></button>
      <button onclick="formatText('italic')"><i>I</i></button>
      <button onclick="toggleEmojiPicker()">😀</button>
      <button onclick="attachFile()">📎</button>
    </div>
    <textarea id="commentInput" placeholder="Введите комментарий..."></textarea>
    <div id="emojiPicker"></div>
    <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"/>
    <div id="filePreview"></div>
    <button onclick="sendComment()">Отправить</button>
  </div>
  <div id="commentsList"></div>
</div>
```

### JavaScript
```javascript
async function sendComment() {
  const input = document.getElementById('commentInput');
  const message = input.value.trim();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (!message && !file) return;
  
  try {
    let file_url = null;
    let file_name = null;
    
    // Загружаем файл если есть
    if (file) {
     const uploadResult = await uploadFile(file, resourceId);
      file_url = uploadResult.url;
      file_name = file.name;
    }
    
    // Обрабатываем упоминания
   const mentions = extractMentions(message);
    
    // Создаем комментарий
   const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        resource_id: resourceId,
        resource_type: resourceType,
        user_id: currentUserProfile.id,
        message: message,
        file_url: file_url,
        file_name: file_name,
        parent_comment_id: replyToId || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Отправляем уведомления
    if (mentions.length > 0) {
      await sendMentionNotifications(mentions, comment.id, message);
    }
    
    if (replyToId) {
      await sendReplyNotification(replyToId, comment.id);
    }
    
    // Очищаем форму
    input.value = '';
    fileInput.value = '';
    document.getElementById('filePreview').innerHTML = '';
    
    // Обновляем список
    loadAndRenderComments(resourceId);
    
  } catch (error) {
   console.error('Error sending comment:', error);
    showToast('❌ Ошибка отправки комментария');
  }
}
```

---

## Безопасность и ограничения

### Размеры файлов
- Максимум: 10MB
- Типы: image/*, .pdf, .doc, .docx, .xls, .xlsx

### RLS политики для файлов
```sql
-- Чтение файлов всем авторизованным
CREATE POLICY "Allow authenticated users to view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-files' AND auth.role() = 'authenticated');

-- Загрузка только автором комментария
CREATE POLICY "Allow comment authors to upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comment-files' AND 
  auth.uid() IN (
    SELECT user_id FROM comments WHERE file_url = storage.objects.name
  )
);
```

### Модерация
- Автоматическое удаление файлов через 30 дней
- Возможность пожаловаться на комментарий
- Администратор может удалять любые комментарии

---

## Тестирование

### Чеклист
- [ ] Редактирование своих комментариев
- [ ] Пометка "(изменено)" после редактирования
- [ ] Упоминания работают и создают уведомления
- [ ] Загрузка файлов до 10MB
- [ ] Предпросмотр изображений
- [ ] Скачивание файлов
- [ ] Ответы с уведомлениями
- [ ] Эмодзи picker работает
- [ ] Форматирование текста (жирный, курсив, код)
- [ ] RLS политики защищают данные

---

## Производительность

### Оптимизация
- Ленивая загрузка изображений
- Кэширование комментариев (5 минут)
- Пагинация (50 комментариев на странице)
- Сжатие изображений перед загрузкой

```javascript
// Сжатие изображения перед загрузкой
async function compressImage(file, maxWidth = 1920) {
  const bitmap = await createImageBitmap(file);
  
  let width = bitmap.width;
  let height = bitmap.height;
  
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
 return new File([blob], file.name, { type: 'image/jpeg' });
}
```
