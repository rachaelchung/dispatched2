/* ========== CHAT ========== */

let pendingFiles = [];
let pendingDuplicate = null;

function initChat() {
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const attachBtn = document.getElementById('attach-btn');
  const fileInput = document.getElementById('file-input');

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    sendBtn.disabled = input.value.trim() === '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Duplicate modal buttons
  document.getElementById('dup-add-new').addEventListener('click', () => {
    resolveDuplicate('add_new');
  });
  document.getElementById('dup-update').addEventListener('click', () => {
    resolveDuplicate('update_existing');
  });
  document.getElementById('dup-modal-close').addEventListener('click', () => {
    closeDupModal();
  });
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  files.forEach(f => {
    if (!pendingFiles.find(pf => pf.name === f.name)) {
      pendingFiles.push(f);
    }
  });
  renderFilePreviews();
  e.target.value = '';
}

function renderFilePreviews() {
  const container = document.getElementById('file-preview');
  container.innerHTML = '';
  pendingFiles.forEach((f, i) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';
    chip.innerHTML = `📎 ${f.name} <button class="file-chip-remove" onclick="removeFile(${i})">✕</button>`;
    container.appendChild(chip);
  });
}

function removeFile(idx) {
  pendingFiles.splice(idx, 1);
  renderFilePreviews();
}

async function sendMessage() {
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content) return;

  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;

  // Optimistic UI: show message immediately
  const optimisticMsg = {
    id: 'temp-' + Date.now(),
    content,
    created_at: new Date().toISOString(),
  };
  renderMessage(optimisticMsg, true);
  scrollChatToBottom();

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Build form data
  const fd = new FormData();
  fd.append('content', content);
  if (App.activeChatId) fd.append('chat_id', App.activeChatId);
  pendingFiles.forEach(f => fd.append('files', f));
  pendingFiles = [];
  renderFilePreviews();

  const r = await api('POST', '/api/messages', fd, true);

  if (!r || !r.ok) {
    // Remove optimistic message
    document.getElementById(optimisticMsg.id)?.remove();
    showToast('Failed to send message', 'error');
    sendBtn.disabled = false;
    return;
  }

  // Replace optimistic message with real one
  const realMsg = r.data.message;
  const existing = document.getElementById(optimisticMsg.id);
  if (existing) existing.remove();
  const newEl = renderMessage(realMsg);

  // Show created tasks as pills
  if (r.data.new_tasks && r.data.new_tasks.length > 0) {
    appendTaskPills(newEl, r.data.new_tasks);
    await loadTasks();
  }

  if (r.data.edited_task) {
    showToast('Task updated ✓', 'success');
    await loadTasks();
  }

  if (r.data.duplicate_check_required) {
    pendingDuplicate = {
      parsed: r.data.parsed,
      existing_task_id: r.data.possible_duplicate_id,
      message_id: realMsg.id,
    };
    showDupModal(r.data.possible_duplicate_id, r.data.parsed);
  }

  sendBtn.disabled = false;
  scrollChatToBottom();
}

function renderMessage(msg, isOptimistic = false) {
  const container = document.getElementById('chat-messages');

  // Remove empty state
  const empty = container.querySelector('.chat-empty');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = 'message-row';
  row.id = msg.id;

  const initials = App.user?.email?.slice(0, 2).toUpperCase() || 'ME';
  const msgDate = new Date(msg.created_at + 'Z'); // 'Z' forces UTC interpretation
  const now = new Date();
  const isToday = msgDate.toDateString() === now.toDateString();

  const time = isToday
    ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  row.innerHTML = `
    <div class="message-avatar">${initials}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">you</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${escapeHtml(msg.content)}</div>
      <div class="message-tasks-created"></div>
    </div>
  `;

  if (isOptimistic) {
    row.style.opacity = '0.6';
  }

  container.appendChild(row);
  return row;
}

function appendTaskPills(msgEl, tasks) {
  const pillsContainer = msgEl?.querySelector('.message-tasks-created');
  if (!pillsContainer) return;
  tasks.forEach(t => {
    const pill = document.createElement('span');
    pill.className = 'task-pill';
    pill.innerHTML = `✓ ${escapeHtml(t.title)}`;
    pillsContainer.appendChild(pill);
  });
}

function scrollChatToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

// ============================
// DUPLICATE MODAL
// ============================
function showDupModal(existingTaskId, parsed) {
  const existingTask = App.tasks.find(t => t.id === existingTaskId);
  const modal = document.getElementById('dup-modal');
  const titleEl = document.getElementById('dup-task-title');
  if (existingTask) {
    titleEl.textContent = existingTask.title;
  }
  modal.classList.add('active');
}

function closeDupModal() {
  document.getElementById('dup-modal').classList.remove('active');
  pendingDuplicate = null;
}

async function resolveDuplicate(action) {
  if (!pendingDuplicate) return;

  const r = await api('POST', '/api/messages/confirm-duplicate', {
    action,
    existing_task_id: pendingDuplicate.existing_task_id,
    parsed: pendingDuplicate.parsed,
    message_id: pendingDuplicate.message_id,
    chat_id: App.activeChatId,
  });

  closeDupModal();

  if (r && r.ok) {
    showToast(action === 'add_new' ? 'New task added ✓' : 'Task updated ✓', 'success');
    await loadTasks();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initChat);
