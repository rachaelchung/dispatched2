/* ========== CALENDAR ========== */

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function renderCalendar() {
  document.getElementById('cal-month-label').textContent =
    `${MONTH_NAMES[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-weeks');
  grid.innerHTML = '';

  const today = new Date();
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startOffset = firstDay.getDay();

  // Build days array (fill start + end with prev/next month days)
  const days = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(calYear, calMonth, -startOffset + i + 1);
    days.push({ date: d, isOtherMonth: true });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(calYear, calMonth, d), isOtherMonth: false });
  }
  const remainder = 7 - (days.length % 7);
  if (remainder < 7) {
    for (let i = 1; i <= remainder; i++) {
      days.push({ date: new Date(calYear, calMonth + 1, i), isOtherMonth: true });
    }
  }

  // Group into weeks
  for (let w = 0; w < days.length / 7; w++) {
    const week = document.createElement('div');
    week.className = 'cal-week';
    for (let d = 0; d < 7; d++) {
      const { date, isOtherMonth } = days[w * 7 + d];
      week.appendChild(buildDayCell(date, isOtherMonth, today));
    }
    grid.appendChild(week);
  }
}

function buildDayCell(date, isOtherMonth, today) {
  const cell = document.createElement('div');
  cell.className = 'cal-day';
  if (isOtherMonth) cell.classList.add('other-month');

  const isToday = date.toDateString() === today.toDateString();
  if (isToday) cell.classList.add('today');

  const dateStr = formatDateStr(date);
  const dayTasks = App.tasks.filter(t => t.due_date === dateStr);

  if (dayTasks.length) cell.classList.add('has-tasks');

  cell.innerHTML = `<div class="cal-day-number">${date.getDate()}</div>`;

  // Show up to 2 task pills, then "+N more"
  const taskList = document.createElement('div');
  taskList.className = 'cal-task-list';

  const maxVisible = 4;
  dayTasks.slice(0, maxVisible).forEach(t => {
    const item = document.createElement('div');
    item.className = 'cal-task-item';

    const color = App.chats?.find(c => c.tag === t.tag)?.color || '#8b6fd4';
    item.style.background = color;
    
    item.textContent = t.title;
    taskList.appendChild(item);
  });

  if (dayTasks.length > maxVisible) {
    const more = document.createElement('div');
    more.className = 'cal-task-overflow';
    more.textContent = `+${dayTasks.length - maxVisible} more`;
    taskList.appendChild(more);
  }

  cell.appendChild(taskList);

  // Click to open day detail
  cell.addEventListener('click', () => openDayDetail(date, dayTasks));

  return cell;
}

var currentDetailDate = null;

function openDayDetail(date, tasks) {
  currentDetailDate = date;
  renderDayDetail(date);
  document.getElementById('day-detail-modal').classList.add('active');
}

function renderDayDetail(date) {
  const dateStr = formatDateStr(date);
  const tasks = App.tasks.filter(t => t.due_date === dateStr);
  
  const dateEl = document.getElementById('day-detail-date');
  const tasksEl = document.getElementById('day-detail-tasks');

  dateEl.textContent = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  tasksEl.innerHTML = '';

  if (!tasks.length) {
    tasksEl.innerHTML = '<div class="day-detail-empty">No tasks on this day</div>';
  } else {
    tasks.forEach(t => tasksEl.appendChild(buildTaskCard(t)));
  }
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });

  document.getElementById('cal-today').addEventListener('click', () => {
    calYear = new Date().getFullYear();
    calMonth = new Date().getMonth();
    renderCalendar();
  });

  document.getElementById('day-detail-close').addEventListener('click', () => {
    document.getElementById('day-detail-modal').classList.remove('active');
  });
});
