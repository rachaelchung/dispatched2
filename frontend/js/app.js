/* ========== DISPATCH - Main App Logic ========== */

// Global state
const App = {
  user: null,
  tasks: [],
  chats: [],
  pollInterval: null,
  currentView: 'dashboard', // 'dashboard' | 'calendar'
  activeTagFilter: null,
  lastMessageId: null,
  activeChatId: null,
};

// Theme management
const THEMES = [
  { id: 'dark',         name: 'Dark',         colors: ['#1a1820', '#2a2738', '#8b6fd4', '#e8e4f0'] },
  { id: 'light',        name: 'Light',        colors: ['#f0eef8', '#ffffff', '#7c5cbf', '#1e1a2e'] },
  { id: 'blueberry',    name: 'Blueberry',    colors: ['#0e1117', '#1c2133', '#5b7fe8', '#e0e8ff'] },
  { id: 'pink-lemonade',name: 'Pink Lemonade',colors: ['#fff0f5', '#ffffff', '#e05c8a', '#2d1020'] },
  { id: 'copper',       name: 'Copper',       colors: ['#1a1208', '#2e2010', '#c87840', '#f0e0c8'] },
  { id: 'dev',          name: 'Dev',          colors: ['#000000', '#111111', '#00cc66', '#00ff80'] },
  { id: 'dino',         name: 'Dino',         colors: ['#1a2018', '#2a3528', '#6a9e58', '#d8e8d0'] },
];

function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('dispatch-theme', themeId);
  // Update selected state in grid if open
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('selected', s.dataset.theme === themeId);
  });
}

function initTheme() {
  const saved = localStorage.getItem('dispatch-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
}

function renderThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const current = localStorage.getItem('dispatch-theme') || 'dark';
  grid.innerHTML = '';
  THEMES.forEach(theme => {
    const swatch = document.createElement('div');
    swatch.className = `theme-swatch ${theme.id === current ? 'selected' : ''}`;
    swatch.dataset.theme = theme.id;
    swatch.innerHTML = `
      <div class="theme-swatch-preview" style="background:${theme.colors[0]}">
        <div class="theme-swatch-bar" style="background:${theme.colors[1]}"></div>
        <div class="theme-swatch-bar" style="background:${theme.colors[2]}"></div>
        <div class="theme-swatch-bar" style="background:${theme.colors[3]}"></div>
      </div>
      <div class="theme-swatch-label" style="background:${theme.colors[0]}; color:${theme.colors[3]}">${theme.name}</div>
    `;
    swatch.addEventListener('click', () => applyTheme(theme.id));
    grid.appendChild(swatch);
  });
}

// ============================
// API HELPERS
// ============================
const API_BASE = '';

async function api(method, path, body = null, isFormData = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: body ? (isFormData ? body : JSON.stringify(body)) : null,
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) {
    window.location.href = '/';
    return;
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ============================
// TOAST
// ============================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ============================
// INIT
// ============================
async function initApp() {
  initTheme();
  const r = await api('GET', '/auth/me');
  if (!r || !r.ok) {
    window.location.href = '/';
    return;
  }
  App.user = r.data.user;

  // Set user info in sidebar
  document.getElementById('user-email').textContent = App.user.email;
  document.getElementById('user-avatar').textContent =
    App.user.email.slice(0, 2).toUpperCase();

  // Load initial data
  await loadTasks();
  await loadChats();

  // Start polling
  App.pollInterval = setInterval(async () => {
    await loadTasks();
  }, 2500);

  // Nav listeners
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('logout-btn').addEventListener('click', logout);

  // Render initial view
  switchView('dashboard');

  // Chat listeners
  document.getElementById('add-chat-btn').addEventListener('click', () => {
    document.getElementById('new-chat-modal').classList.add('active');
  });

  document.getElementById('new-chat-submit').addEventListener('click', async () => {
    const name = document.getElementById('new-chat-name').value.trim();
    const color = document.getElementById('new-chat-color').value;
    if (!name) return;
    const tag = name.toLowerCase().replace(/\s+/g, '-');
    const r = await api('POST', '/api/chats', { name, tag, color });
    if (r && r.ok) {
      document.getElementById('new-chat-modal').classList.remove('active');
      document.getElementById('new-chat-name').value = '';
      await loadChats();
    }
  });

  // Theme Settings listeners
  document.getElementById('settings-btn').addEventListener('click', () => {
    renderThemeGrid();
    document.getElementById('settings-modal').classList.add('active');
  });
  document.getElementById('settings-modal-close').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('active');
  });

  document.getElementById('new-chat-modal-close').addEventListener('click', () => {
    document.getElementById('new-chat-modal').classList.remove('active');
  });
  document.getElementById('new-chat-cancel').addEventListener('click', () => {
    document.getElementById('new-chat-modal').classList.remove('active');
  });
}

function switchView(view) {
  App.currentView = view;
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Toggle panel tabs
  document.querySelectorAll('.tab-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  const dashView = document.getElementById('dashboard-view');
  const calView = document.getElementById('calendar-view');

  if (view === 'dashboard') {
    dashView.style.display = 'flex';
    calView.style.display = 'none';
    renderDashboard();
  } else {
    dashView.style.display = 'none';
    calView.style.display = 'flex';
    renderCalendar();
  }
}

async function logout() {
  await api('POST', '/auth/logout');
  clearInterval(App.pollInterval);
  window.location.href = '/';
}

// ============================
// TASK LOADING
// ============================
async function loadTasks() {
  const r = await api('GET', '/api/tasks?status=all');
  if (r && r.ok) {
    App.tasks = r.data.tasks;
    if (App.currentView === 'dashboard') renderDashboard();
    else renderCalendar();

    // Refresh day detail modal if open
    if (currentDetailDate && document.getElementById('day-detail-modal').classList.contains('active')) {
      renderDayDetail(currentDetailDate);
    }
  }
}

async function loadMessages() {
  const r = await api('GET', '/api/messages');
  if (r && r.ok) {
    const msgs = r.data.messages;
    msgs.forEach(m => renderMessage(m));
    scrollChatToBottom();
  }
}

// ============================
// DIFFERENT CHATS
// ============================
async function loadChats() {
  const r = await api('GET', '/api/chats');
  if (!r || !r.ok) return;

  const chats = r.data.chats || [];
  App.chats = chats;
  const list = document.getElementById('chat-list');
  list.innerHTML = '';

  if (chats.length === 0) {
    // Create a default general chat on first load
    const r2 = await api('POST', '/api/chats', { name: 'General', tag: 'todo' });
    if (r2 && r2.ok) return loadChats();
  }

  const activeChats = chats.filter(c => !c.archived);
  const archivedChats = chats.filter(c => c.archived);

  if (activeChats.length === 0 && archivedChats.length === 0) {
    const r2 = await api('POST', '/api/chats', { name: 'ToDo', tag: 'todo' });
    if (r2 && r2.ok) return loadChats();
  }

  activeChats.forEach(chat => {
    const btn = document.createElement('div');
    btn.className = `nav-item ${App.activeChatId === chat.id ? 'active' : ''}`;
    btn.dataset.chatId = chat.id;
    btn.innerHTML = `
      <span class="nav-icon" style="color:${chat.color}">#</span>
      <span class="chat-name" style="flex:1">${chat.name}</span>
      <button class="chat-archive-btn btn-icon" data-id="${chat.id}" title="Archive">⊖</button>
    `;
    btn.querySelector('.chat-name').addEventListener('click', () => {
      if (App.activeChatId === chat.id) {
        openColorPicker(chat);
      } else {
        selectChat(chat);
      }
    });
    btn.querySelector('.chat-archive-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      await api('POST', `/api/chats/${chat.id}/archive`);
      if (App.activeChatId === chat.id) App.activeChatId = null;
      await loadChats();
    });
    list.appendChild(btn);
  });

  // Archived section
  if (archivedChats.length) {
    const archiveToggle = document.createElement('button');
    archiveToggle.className = 'nav-item';
    archiveToggle.style.cssText = 'color: var(--text-muted); font-size: 0.75rem; margin-top: 0.5rem;';
    archiveToggle.innerHTML = `<span class="nav-icon">📦</span> Archived (${archivedChats.length})`;
    
    const archiveList = document.createElement('div');
    archiveList.style.display = 'none';
    
    archiveToggle.addEventListener('click', () => {
      archiveList.style.display = archiveList.style.display === 'none' ? 'block' : 'none';
    });

    archivedChats.forEach(chat => {
      const btn = document.createElement('div');
      btn.className = 'nav-item';
      btn.style.opacity = '0.5';
      btn.innerHTML = `
        <span class="nav-icon">#</span>
        <span class="chat-name" style="flex:1">${chat.name}</span>
        <button class="chat-archive-btn btn-icon" data-id="${chat.id}" title="Unarchive">⊕</button>
      `;
      btn.querySelector('.chat-name').addEventListener('click', () => selectChat(chat));
      btn.querySelector('.chat-archive-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await api('POST', `/api/chats/${chat.id}/archive`);
        await loadChats();
      });
      archiveList.appendChild(btn);
    });

    list.appendChild(archiveToggle);
    list.appendChild(archiveList);
  }

  // Auto-select first chat if none selected
  if (!App.activeChatId && chats.length > 0) {
    selectChat(chats[0]);
  }
}

function selectChat(chat) {
  App.activeChatId = chat.id;
  App.activeChatTag = chat.tag;

  // Update active state in sidebar
  document.querySelectorAll('#chat-list .nav-item').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.chatId) === chat.id);
  });

  // Update chat panel header
  document.querySelector('#chat-panel .panel-title').textContent = `# ${chat.name}`;
  document.querySelector('#chat-panel .panel-title').style.color = chat.color;

  // Clear and reload messages for this chat
  const msgContainer = document.getElementById('chat-messages');
  msgContainer.innerHTML = `
    <div class="chat-empty">
      <div class="chat-empty-icon">✦</div>
      <div class="chat-empty-title">Start chatting in ${chat.name}</div>
      <div class="chat-empty-hint">Tasks sent here will be tagged as "${chat.tag}"</div>
    </div>`;

  loadMessagesForChat(chat.id);
}

function openColorPicker(chat) {
  const modal = document.getElementById('color-picker-modal');
  document.getElementById('color-picker-chat-name').textContent = chat.name;
  document.getElementById('color-picker-input').value = chat.color || '#8b6fd4';

  const saveBtn = document.getElementById('color-picker-save');
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.replaceWith(newSaveBtn);

  const updatedChat = App.chats.find(c => c.id === chat.id);
  if (updatedChat) {
    document.querySelector('#chat-panel .panel-title').style.color = updatedChat.color;
  }

  newSaveBtn.addEventListener('click', async () => {
    const color = document.getElementById('color-picker-input').value;
    const r = await api('PUT', `/api/chats/${chat.id}`, { color });
    if (r && r.ok) {
      modal.classList.remove('active');
      await loadChats();
      await loadTasks();
    }
  });

  modal.classList.add('active');
}

async function loadMessagesForChat(chatId) {
  const r = await api('GET', `/api/messages?chat_id=${chatId}`);
  if (r && r.ok) {
    const msgs = r.data.messages;
    if (msgs.length) {
      document.getElementById('chat-messages').innerHTML = '';
      msgs.forEach(m => renderMessage(m));
      scrollChatToBottom();
    }
  }
}

// ============================
// BOOTSTRAP
// ============================
document.addEventListener('DOMContentLoaded', initApp);


// Apply theme immediately before full init
(function() {
  const saved = localStorage.getItem('dispatch-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();
