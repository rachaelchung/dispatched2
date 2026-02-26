/* ========== DASHBOARD ========== */

let editingTaskId = null;
let dragSrcId = null;
const openCompletedSections = new Set();

function renderDashboard() {
  renderFilterChips();
  renderTimeline();
}

// ============================
// FILTER CHIPS
// ============================
function renderFilterChips() {
  const container = document.getElementById('filter-chips');
  const active = App.activeTagFilter;

  container.innerHTML = '';

  // All chip
  const allChip = document.createElement('button');
  allChip.className = `filter-chip ${active === null ? 'active' : ''}`;
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => {
    App.activeTagFilter = null;
    renderDashboard();
  });
  container.appendChild(allChip);

  // Tag chips
  App.chats.filter(c => !c.archived).forEach(chat => {
    const hasTag = App.tasks.some(t => t.tag === chat.tag);
    if (!hasTag) return;

    const chip = document.createElement('button');
    chip.className = `filter-chip ${active === chat.tag ? 'active' : ''}`;
    chip.innerHTML = `<span class="tag-dot" style="background: ${chat.color}"></span>${chat.name}`;
    chip.addEventListener('click', () => {
      App.activeTagFilter = App.activeTagFilter === chat.tag ? null : chat.tag;
      renderDashboard();
    });
    container.appendChild(chip);
  });
}

// ============================
// TIMELINE
// ============================
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  container.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allTasks = App.tasks;
  const filteredTasks = App.activeTagFilter
    ? allTasks.filter(t => t.tag === App.activeTagFilter)
    : allTasks;

  const overdue  = filteredTasks.filter(t => t.due_date && new Date(t.due_date + 'T00:00:00') < today && t.status !== 'completed');
  const todayT   = filteredTasks.filter(t => t.due_date && isSameDay(t.due_date, today));
  const thisWeek = filteredTasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date + 'T00:00:00');
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return d > today && !isSameDay(t.due_date, today) && d <= weekEnd;
  });
  const later   = filteredTasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date + 'T00:00:00');
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);
    return d > weekEnd;
  });
  const undated  = filteredTasks.filter(t => !t.due_date);

  if (overdue.length)  container.appendChild(buildSection('Overdue', overdue, 'overdue'));
  if (todayT.length)   container.appendChild(buildSection('Today', todayT, 'today'));
  if (later.length)    container.appendChild(buildSection('Later', later));
  if (undated.length)  container.appendChild(buildSection('Undated', undated));

  // Group this week's tasks by day
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayTasks = thisWeek.filter(t => isSameDay(t.due_date, d));
    if (dayTasks.length) {
      const label = i === 1 ? 'Tomorrow' : dayNames[d.getDay()];
      container.appendChild(buildSection(label, dayTasks));
    }
  } 

  const hasAnything = filteredTasks.some(t => t.status === 'active');
  if (!hasAnything) {
    const empty = document.createElement('div');
    empty.className = 'timeline-empty';
    empty.textContent = 'No tasks yet — type something in the chat!';
    container.appendChild(empty);
  }
}

function buildSection(label, tasks, labelClass = '') {
  const section = document.createElement('div');
  section.className = 'timeline-section';

  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  section.innerHTML = `
    <div class="section-header">
      <span class="section-label ${labelClass}">${label}</span>
      <span class="section-count">${activeTasks.length}</span>
      <div class="section-line"></div>
    </div>
  `;

  const list = document.createElement('div');
  list.className = 'task-list';
  activeTasks.forEach(t => list.appendChild(buildTaskCard(t)));

  // Completed collapse
  if (completedTasks.length) {
    const toggle = document.createElement('button');
    toggle.className = 'completed-toggle';

    const completedList = document.createElement('div');
    completedTasks.forEach(t => completedList.appendChild(buildTaskCard(t)));

    const isAlreadyOpen = openCompletedSections.has(label);
    completedList.style.display = isAlreadyOpen ? 'flex' : 'none';
    if (isAlreadyOpen) {
      completedList.style.flexDirection = 'column';
      completedList.style.gap = '0.4rem';
      toggle.innerHTML = `▾ ${completedTasks.length} completed`;
    } else {
      toggle.innerHTML = `▸ ${completedTasks.length} completed`;
    }

    toggle.addEventListener('click', () => {
      const isOpen = completedList.style.display !== 'none';
      if (isOpen) {
        completedList.style.display = 'none';
        toggle.innerHTML = `▸ ${completedTasks.length} completed`;
        openCompletedSections.delete(label);
      } else {
        completedList.style.display = 'flex';
        completedList.style.flexDirection = 'column';
        completedList.style.gap = '0.4rem';
        toggle.innerHTML = `▾ ${completedTasks.length} completed`;
        openCompletedSections.add(label);
      }
    });

    list.appendChild(toggle);
    list.appendChild(completedList);
  }

  section.appendChild(list);
  return section;
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card ${task.status === 'completed' ? 'completed' : ''}`;
  card.dataset.tag = task.tag;
  card.dataset.id = task.id;
  card.draggable = true;

  const chatColor = App.chats?.find(c => c.tag === task.tag)?.color || '#8b6fd4';
  card.style.borderLeftColor = chatColor;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = task.due_date && new Date(task.due_date + 'T00:00:00') < today && task.status !== 'completed';

  const dateStr = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';
  const timeStr = task.due_time ? ` · ${task.due_time}` : '';
  const dateDisplay = dateStr ? `<span class="task-date ${isOverdue ? 'overdue' : ''}">📅 ${dateStr}${timeStr}</span>` : '';

  const descDisplay = task.description
    ? `<div class="task-description">${escapeHtml(task.description)}</div>`
    : '';

  const filesHtml = task.files && task.files.length
    ? `<div class="task-files">${task.files.map(f =>
        `<a class="task-file-chip" href="/api/tasks/${task.id}/files/${f.id}" target="_blank">📎 ${escapeHtml(f.filename)}</a>`
      ).join('')}</div>`
    : '';

  card.innerHTML = `
    <div class="task-drag-handle" title="Drag to reorder"><span></span><span></span><span></span></div>
    <div class="task-check" title="Mark complete">
      <span class="task-check-icon">✓</span>
    </div>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="task-tag" style="background: ${chatColor}22; color: ${chatColor};"">${task.tag}</span>
        ${dateDisplay}
      </div>
      ${descDisplay}
      ${filesHtml}
    </div>
    <div class="task-actions">
      <button class="btn-icon" title="Edit" onclick="openEditModal(${task.id})">✏️</button>
      <button class="btn-icon" title="Delete" onclick="deleteTask(${task.id})">🗑</button>
    </div>
  `;

  // Complete toggle
  card.querySelector('.task-check').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleComplete(task.id, task.status);
  });

  // Drag events
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragover', onDragOver);
  card.addEventListener('drop', onDrop);
  card.addEventListener('dragend', onDragEnd);

  return card;
}

// ============================
// DRAG & DROP
// ============================
function onDragStart(e) {
  dragSrcId = parseInt(this.dataset.id);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const targetId = parseInt(this.dataset.id);
  if (dragSrcId === targetId) return;

  // Reorder in local state
  const srcIdx = App.tasks.findIndex(t => t.id === dragSrcId);
  const tgtIdx = App.tasks.findIndex(t => t.id === targetId);
  const [moved] = App.tasks.splice(srcIdx, 1);
  App.tasks.splice(tgtIdx, 0, moved);

  // Assign new sort orders
  App.tasks.forEach((t, i) => { t.sort_order = i; });

  renderDashboard();

  // Persist
  api('POST', '/api/tasks/reorder', {
    order: App.tasks.map((t, i) => ({ id: t.id, sort_order: i }))
  });
}

function onDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
}

// ============================
// TASK ACTIONS
// ============================
async function toggleComplete(taskId, currentStatus) {
  const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
  const r = await api('PUT', `/api/tasks/${taskId}`, { status: newStatus });
  if (r && r.ok) await loadTasks();
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  const r = await api('DELETE', `/api/tasks/${taskId}`);
  if (r && r.ok) {
    showToast('Task deleted', 'success');
    await loadTasks();
  }
}

// ============================
// EDIT MODAL
// ============================
function openEditModal(taskId) {
  editingTaskId = taskId;

  // Populate tag dropdown from current chats
  const tagSelect = document.getElementById('edit-tag');
  tagSelect.innerHTML = '';
  App.chats.filter(c => !c.archived).forEach(chat => {
    const option = document.createElement('option');
    option.value = chat.tag;
    option.textContent = chat.name;
    tagSelect.appendChild(option);
  });

  const task = App.tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description || '';
  document.getElementById('edit-date').value = task.due_date || '';
  document.getElementById('edit-time').value = task.due_time || '';
  tagSelect.value = task.tag;

  document.getElementById('edit-modal-title').textContent = 'Edit Task';
  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  editingTaskId = null;
}

async function saveEditModal() {
  const payload = {
    title: document.getElementById('edit-title').value.trim(),
    description: document.getElementById('edit-description').value.trim() || null,
    due_date: document.getElementById('edit-date').value || null,
    due_time: document.getElementById('edit-time').value || null,
    tag: document.getElementById('edit-tag').value,
  };

  if (!payload.title) { showToast('Title is required', 'error'); return; }

  if (editingTaskId) {
    // Editing existing task
    const r = await api('PUT', `/api/tasks/${editingTaskId}`, payload);
    if (r && r.ok) {
      showToast('Task saved ✓', 'success');
      closeEditModal();
      await loadTasks();
    }
  } else {
    // Creating new task
    const r = await api('POST', '/api/tasks', payload);
    if (r && r.ok) {
      showToast('Task added ✓', 'success');
      closeEditModal();
      await loadTasks();
    }
  }
}

// New manual task
async function addManualTask() {
  editingTaskId = null;

  const tagSelect = document.getElementById('edit-tag');
  tagSelect.innerHTML = '';
  App.chats.filter(c => !c.archived).forEach(chat => {
    const option = document.createElement('option');
    option.value = chat.tag;
    option.textContent = chat.name;
    tagSelect.appendChild(option);
  });

  document.getElementById('edit-title').value = '';
  document.getElementById('edit-description').value = '';
  document.getElementById('edit-date').value = '';
  document.getElementById('edit-time').value = '';
  tagSelect.value = tagSelect.options[0].value || '';

  document.getElementById('edit-modal-title').textContent = 'New Task';
  document.getElementById('edit-modal').classList.add('active');
}

// ============================
// HELPERS
// ============================
function isSameDay(dateStr, dateObj) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toDateString() === dateObj.toDateString();
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
  document.getElementById('edit-save').addEventListener('click', saveEditModal);
  document.getElementById('edit-cancel').addEventListener('click', closeEditModal);
  document.getElementById('add-task-manual').addEventListener('click', addManualTask);
});
