/**
 * Расширенная система комментариев с форматированием, файлами и эмодзи
 * Добавьте этот код в index.html перед закрывающим тегом </body>
 */

// === Глобальные переменные для редактора комментариев ===
let currentReplyToId = null;
let currentEditingCommentId = null;
let selectedFile = null;

// === Функции загрузки и отображения комментариев ===
window.loadAndRenderTaskComments = async function(taskId) {
  const commentsList = document.getElementById('taskCommentsList');
  if (!commentsList) return;
  
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users(name, email),
        parent_comment (
          id,
          user_id,
          message,
          users(name)
        )
      `)
      .eq('resource_id', taskId)
      .eq('resource_type', 'task')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    if (!comments || comments.length === 0) {
      commentsList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Нет комментариев. Будьте первыми! 💬</p>';
      return;
    }
    
    let html = '';
    comments.forEach(comment => {
      const isOwnComment = String(comment.user_id) === String(currentUserProfile?.id);
      const dateStr = new Date(comment.created_at).toLocaleString('ru-RU');
      const isEdited = comment.is_edited || false;
      
      // Обработка форматирования текста
      const formattedMessage = formatCommentText(comment.message);
      
      // Ответ на комментарий (вложенность)
      const isReply = !!comment.parent_comment_id;
      const replyStyle = isReply ? 'margin-left:40px;border-left:3px solid var(--accent);padding-left:12px;' : '';
      
      html += `
        <div style="background:#f9f9f9;padding:12px;margin-bottom:10px;border-radius:6px;${replyStyle}">
          ${isReply ? `<div style="font-size:11px;color:var(--accent);margin-bottom:6px;">↪ Ответ на комментарий</div>` : ''}
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:28px;height:28px;background:linear-gradient(135deg,var(--accent),var(--success));border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px">
                ${(comment.users?.name || 'А')[0].toUpperCase()}
              </div>
              <strong style="color:var(--accent)">${comment.users?.name || 'Аноним'}</strong>
              ${isEdited ? '<span style="font-size:10px;color:var(--text-muted);font-style:normal">(изменено)</span>' : ''}
            </div>
            <span style="font-size:11px;color:var(--text-muted)">${dateStr}</span>
          </div>
          
          <div style="color:var(--text);line-height:1.6;margin-bottom:8px">${formattedMessage}</div>
          
          ${comment.file_url ? `
            <div style="margin-top:8px;padding:8px;background:white;border-radius:4px">
              ${comment.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? `
                <img src="${comment.file_url}" alt="${comment.file_name}" style="max-width:300px;border-radius:4px;cursor:pointer" onclick="window.open('${comment.file_url}', '_blank')">
                <div style="margin-top:4px">
                  <a href="${comment.file_url}" download="${comment.file_name}" style="color:var(--accent);text-decoration:none;font-size:12px">📎 Скачать ${comment.file_name}</a>
                </div>
              ` : `
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:20px">📎</span>
                  <a href="${comment.file_url}" download="${comment.file_name}" style="color:var(--accent);text-decoration:none;font-size:13px">${comment.file_name}</a>
                </div>
              `}
            </div>
          ` : ''}
          
          <div style="display:flex;gap:8px;margin-top:8px">
            ${!isReply ? `
              <button class="btn btn-sm" style="padding:4px 8px;font-size:11px;background:transparent;color:var(--accent);border:1px solid var(--accent)" onclick="showReplyForm('${comment.id}')">💬 Ответить</button>
            ` : ''}
            ${isOwnComment ? `
              <button class="btn btn-sm" style="padding:4px 8px;font-size:11px;background:transparent;color:var(--text-muted);border:1px solid var(--text-muted)" onclick="editComment('${comment.id}', '${taskId}')">✏️ Редактировать</button>
              <button class="btn btn-sm btn-danger" style="padding:4px 8px;font-size:11px;background:#ef4444;border:none;color:white" onclick="deleteComment('${comment.id}', '${taskId}')">🗑 Удалить</button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    commentsList.innerHTML = html;
    commentsList.scrollTop = commentsList.scrollHeight;
    
  } catch (error) {
    console.error('Error loading comments:', error);
    commentsList.innerHTML = '<p style="color:var(--danger);text-align:center;padding:20px;">Ошибка загрузки комментариев</p>';
  }
};

// === Форматирование текста (Markdown-подобный синтаксис) ===
function formatCommentText(text) {
  if (!text) return '';
  
  // Экранирование HTML
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Жирный текст **текст**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Курсив *текст*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Код `код`
  formatted = formatted.replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-family:monospace">$1</code>');
  
  // Цитаты > текст
  formatted = formatted.replace(/^&gt; (.*$)/gm, '<blockquote style="border-left:3px solid #ddd;margin:10px 0;padding-left:10px;color:#666">$1</blockquote>');
  
  // Списки - элемент
  formatted = formatted.replace(/^- (.*$)/gm, '<li style="margin-left:20px;list-style-type:disc">$1</li>');
  
  // Упоминания @user_id
  formatted = formatted.replace(/@([a-f0-9-]{36})/g, (match, userId) => {
    return `<span style="color:var(--accent);background:rgba(0,217,255,0.1);padding:2px 6px;border-radius:3px;font-weight:500">@Пользователь</span>`;
  });
  
 return formatted;
}

// === Отправка комментария ===
window.sendTaskComment = async function(taskId) {
  const input = document.getElementById('commentInput');
  const message = input?.value.trim();
  
  if (!message && !selectedFile) {
    showToast('⚠️ Введите текст или выберите файл');
    return;
  }
  
  try {
    let file_url = null;
    let file_name = null;
    
    // Загрузка файла если выбран
    if (selectedFile) {
      const uploadResult = await uploadCommentFile(selectedFile, taskId);
      file_url = uploadResult.url;
      file_name = uploadResult.name;
    }
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        resource_id: taskId,
        resource_type: 'task',
        user_id: currentUserProfile?.id,
        message: message,
        file_url: file_url,
        file_name: file_name,
        parent_comment_id: currentReplyToId,
        is_edited: currentEditingCommentId ? true : false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Очистка формы
    input.value = '';
    selectedFile= null;
    currentReplyToId = null;
    currentEditingCommentId = null;
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('replyCancelBtn')?.remove();
    
    // Обновление списка
    loadAndRenderTaskComments(taskId);
    showToast('✅ Комментарий отправлен');
    
  } catch (error) {
    console.error('Error sending comment:', error);
    showToast('❌ Ошибка отправки комментария');
  }
};

// === Загрузка файла в Storage ===
async function uploadCommentFile(file, resourceId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${resourceId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Загрузка в Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('comment-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    // Получение публичной ссылки
    const { data: urlData } = supabase.storage
      .from('comment-files')
      .getPublicUrl(fileName);
    
    return {
      url: urlData.publicUrl,
      name: file.name
    };
    
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// === Удаление комментария ===
window.deleteComment = async function(commentId, taskId) {
  if (!confirm('Удалить комментарий?')) return;
  
  try {
    const { error } = await supabase.rpc('delete_comment_with_file', {
      comment_id: commentId
    });
    
    if (error) throw error;
    
    loadAndRenderTaskComments(taskId);
    showToast('✅ Комментарий удален');
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    showToast('❌ Ошибка удаления комментария');
  }
};

// === Редактирование комментария ===
window.editComment = async function(commentId, taskId) {
  try {
    const { data: comment } = await supabase
      .from('comments')
      .select('message')
      .eq('id', commentId)
      .single();
    
    if (!comment) throw new Error('Комментарий не найден');
    
    const input = document.getElementById('commentInput');
    input.value = comment.message;
    input.focus();
    
    currentEditingCommentId = commentId;
    
    // Добавляем кнопку отмены
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'replyCancelBtn';
    cancelBtn.className = 'btn btn-outline';
    cancelBtn.textContent = 'Отмена редактирования';
    cancelBtn.onclick = () => {
      input.value = '';
      currentEditingCommentId = null;
      cancelBtn.remove();
    };
    
    input.parentNode.appendChild(cancelBtn);
    showToast('✏️ Редактируйте комментарий и нажмите "Отправить"');
    
  } catch (error) {
    console.error('Error loading comment for edit:', error);
    showToast('❌ Ошибка загрузки комментария');
  }
};

// === Показать форму ответа ===
window.showReplyForm = function(parentCommentId) {
  currentReplyToId = parentCommentId;
  const input = document.getElementById('commentInput');
  input.focus();
  
  // Добавляем кнопку отмены
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'replyCancelBtn';
  cancelBtn.className = 'btn btn-outline btn-sm';
  cancelBtn.textContent = '↩ Отмена ответа';
  cancelBtn.style.cssText = 'margin-left:8px;font-size:11px;padding:4px 8px;';
  cancelBtn.onclick = () => {
    currentReplyToId = null;
    cancelBtn.remove();
  };
  
  input.parentNode.appendChild(cancelBtn);
  showToast('💬 Ответ на комментарий (нажмите "Отправить" или Enter)');
};

// === Форматирование текста ===
window.formatComment = function(format) {
  const input = document.getElementById('commentInput');
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const selectedText = input.value.substring(start, end);
  
  let before = input.value.substring(0, start);
  let after= input.value.substring(end);
  let newText = '';
  
  switch(format) {
    case 'bold':
      newText = `**${selectedText || 'жирный текст'}**`;
      break;
    case 'italic':
      newText = `*${selectedText || 'курсив'}*`;
      break;
    case 'code':
      newText = `\`${selectedText || 'код'}\``;
      break;
    case 'quote':
      newText = `> ${selectedText || 'цитата'}`;
      break;
  }
  
  input.value = before + newText + after;
  input.focus();
  input.selectionStart = start + newText.indexOf(selectedText || newText.replace(/[\*\`>]/g, ''));
  input.selectionEnd = start + newText.indexOf(selectedText || newText.replace(/[\*\`>]/g, '')) + (selectedText.length || newText.length - 4);
};

// === Эмодзи picker ===
const emojiList = ['👍', '❤️', '😊', '🎉', '🔥', '👀', '✅', '❌', '💡', '📌', '⭐', '🚀', '💬', '📎', '🔔'];

window.toggleEmojiPicker = function() {
  const picker = document.getElementById('emojiPicker');
  if (!picker) return;
  
  if (picker.style.display === 'none') {
    picker.style.display = 'flex';
    picker.innerHTML = emojiList.map(emoji => 
      `<span onclick="insertEmoji('${emoji}')" style="cursor:pointer;padding:4px;font-size:18px:hover{transform:scale(1.2)}">${emoji}</span>`
    ).join('');
  } else {
    picker.style.display = 'none';
  }
};

window.insertEmoji = function(emoji) {
  const input = document.getElementById('commentInput');
  input.value += emoji;
  input.focus();
  document.getElementById('emojiPicker').style.display = 'none';
};

// === Выбор файла ===
window.attachFile = function() {
  document.getElementById('fileInput').click();
};

window.handleFileSelect = function(event) {
  const file= event.target.files[0];
  if (!file) return;
  
  // Проверка размера (10MB)
  if (file.size > 10485760) {
    showToast('❌ Файл слишком большой (максимум 10MB)');
    event.target.value = '';
    return;
  }
  
  selectedFile = file;
  
  // Предпросмотр
  const preview = document.getElementById('filePreview');
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px;background:#f9f9f9;border-radius:4px">
          <img src="${e.target.result}" style="width:50px;height:50px;object-fit:cover;border-radius:4px">
          <span style="font-size:12px;color:var(--text-muted)">${file.name}</span>
          <button onclick="removeSelectedFile()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--danger)">✕</button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px;background:#f9f9f9;border-radius:4px">
        <span style="font-size:20px">📎</span>
        <span style="font-size:12px;color:var(--text-muted)">${file.name}</span>
        <button onclick="removeSelectedFile()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--danger)">✕</button>
      </div>
    `;
  }
};

window.removeSelectedFile = function() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').innerHTML = '';
};

// === Инициализация при загрузке страницы ===
document.addEventListener('DOMContentLoaded', function() {
  console.log('Comment system initialized');
});
