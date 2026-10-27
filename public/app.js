/**
 * TaskSphere Client Application
 * Author: Y. Mani Sasank Reddy
 * Connects frontend UI to Node.js / Express backend endpoints via RESTful fetch()
 */

const API_BASE = '/api';

// DOM Elements
const tasksList = document.getElementById('tasksList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const storageBadge = document.getElementById('storageBadge');

// Analytics elements
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statInProgress = document.getElementById('statInProgress');
const statCompleted = document.getElementById('statCompleted');

// Controls
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const categoryFilter = document.getElementById('categoryFilter');
const priorityFilter = document.getElementById('priorityFilter');

// Modal Elements
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Form inputs
const taskId = document.getElementById('taskId');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');

// Toast notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// Application State
let currentTasks = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  checkBackendHealth();
  loadStats();
  loadTasks();
  setupEventListeners();
});

// Setup UI Event Listeners
function setupEventListeners() {
  openModalBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close modal when clicking on backdrop
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Handle Form Submit (Create or Update)
  taskForm.addEventListener('submit', handleFormSubmit);

  // Search & Filter event listeners
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTasks, 300);
  });

  statusFilter.addEventListener('change', loadTasks);
  categoryFilter.addEventListener('change', loadTasks);
  priorityFilter.addEventListener('change', loadTasks);
}

// ==================== REST API CALLS ====================

// 1. Health check to display storage engine badge
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    storageBadge.textContent = `Backend: ${data.storageMode}`;
  } catch (err) {
    storageBadge.textContent = 'Backend Offline';
    storageBadge.className = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500 text-white';
  }
}

// 2. Fetch Dashboard Analytics
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const stats = await res.json();
    statTotal.textContent = stats.total;
    statPending.textContent = stats.pending;
    statInProgress.textContent = stats.inProgress;
    statCompleted.textContent = stats.completed;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// 3. Fetch Tasks with search and filters
async function loadTasks() {
  loadingState.classList.remove('hidden');
  tasksList.classList.add('hidden');
  emptyState.classList.add('hidden');

  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.append('search', searchInput.value.trim());
  if (statusFilter.value !== 'all') params.append('status', statusFilter.value);
  if (categoryFilter.value !== 'all') params.append('category', categoryFilter.value);
  if (priorityFilter.value !== 'all') params.append('priority', priorityFilter.value);

  try {
    const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
    currentTasks = await res.json();
    renderTasks(currentTasks);
  } catch (err) {
    showToast('Failed to load tasks from server', 'error');
  } finally {
    loadingState.classList.add('hidden');
  }
}

// 4. Create or Update Task via POST or PUT
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = taskId.value;
  const payload = {
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    category: taskCategory.value,
    priority: taskPriority.value,
    dueDate: taskDueDate.value
  };

  try {
    let res;
    if (id) {
      // Update existing
      res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast('Task updated successfully!', 'success');
    } else {
      // Create new
      res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast('Task created successfully!', 'success');
    }

    if (!res.ok) throw new Error('API request failed');

    closeModal();
    loadTasks();
    loadStats();
  } catch (err) {
    showToast('Error saving task', 'error');
  }
}

// 5. Toggle status (Pending -> In Progress -> Completed)
async function updateTaskStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      showToast(`Status updated to "${newStatus}"`, 'success');
      loadTasks();
      loadStats();
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

// 6. Delete Task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      showToast('Task deleted successfully', 'success');
      loadTasks();
      loadStats();
    }
  } catch (err) {
    showToast('Failed to delete task', 'error');
  }
}

// ==================== UI RENDERING ====================

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tasksList.classList.remove('hidden');
  tasksList.innerHTML = '';

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm';

    // Priority badge styling
    const priorityColors = {
      High: 'bg-rose-50 text-rose-700 border-rose-200',
      Medium: 'bg-amber-50 text-amber-700 border-amber-200',
      Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    // Status styling
    const statusBadges = {
      'pending': '<span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-medium">Pending</span>',
      'in-progress': '<span class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">In Progress</span>',
      'completed': '<span class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Completed</span>'
    };

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityColors[task.priority] || priorityColors.Medium}">
            ${task.priority} Priority
          </span>
          <span class="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            ${task.category}
          </span>
        </div>

        <h4 class="font-bold text-slate-800 text-base leading-snug mb-1 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}">
          ${escapeHtml(task.title)}
        </h4>

        <p class="text-xs text-slate-500 mb-4 line-clamp-2">
          ${task.description ? escapeHtml(task.description) : '<em>No additional details provided.</em>'}
        </p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div class="flex items-center space-x-2">
          <select 
            onchange="updateTaskStatus('${task.id}', this.value)" 
            class="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>

        <div class="flex items-center space-x-1">
          <button 
            onclick="editTask('${task.id}')" 
            title="Edit Task"
            class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
          >
            <i class="ph-bold ph-pencil-simple text-sm"></i>
          </button>
          <button 
            onclick="deleteTask('${task.id}')" 
            title="Delete Task"
            class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
          >
            <i class="ph-bold ph-trash text-sm"></i>
          </button>
        </div>
      </div>
    `;

    tasksList.appendChild(card);
  });
}

// ==================== MODAL & HELPER FUNCTIONS ====================

function openModal(task = null) {
  taskForm.reset();
  if (task) {
    modalTitle.textContent = 'Edit Task';
    taskId.value = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description || '';
    taskCategory.value = task.category || 'General';
    taskPriority.value = task.priority || 'Medium';
    taskDueDate.value = task.dueDate || '';
  } else {
    modalTitle.textContent = 'Add New Task';
    taskId.value = '';
    taskPriority.value = 'Medium';
    taskCategory.value = 'General';
  }
  taskModal.classList.remove('hidden');
  taskTitle.focus();
}

function closeModal() {
  taskModal.classList.add('hidden');
}

function editTask(id) {
  const task = currentTasks.find(t => t.id === id);
  if (task) {
    openModal(task);
  }
}

function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  if (type === 'error') {
    toastIcon.className = 'ph-bold ph-warning-circle text-rose-400';
  } else {
    toastIcon.className = 'ph-bold ph-check-circle text-emerald-400';
  }

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
