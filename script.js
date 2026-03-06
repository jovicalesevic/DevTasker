// DevTasker - To-Do aplikacija sa localStorage

const STORAGE_KEY = 'devtasker_tasks';
const taskList = document.getElementById('taskList');
const addTaskForm = document.getElementById('addTaskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const emptyState = document.getElementById('emptyState');

// Učitaj zadatke iz localStorage
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Inicijalizacija
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateProgress();
});

// Dodavanje zadatka
addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now().toString(),
        text,
        priority: prioritySelect.value,
        completed: false
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateProgress();

    taskInput.value = '';
    taskInput.focus();
});

// Čuvanje u localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Završi/Znači zadatak
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateProgress();
    }
}

// Obriši zadatak sa animacijom
function deleteTask(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (!item) return;

    item.classList.add('deleting');

    setTimeout(() => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateProgress();
    }, 400);
}

// Prikaz zadataka
function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    const priorityLabels = {
        hitno: 'Hitno',
        bitno: 'Bitno',
        moze: 'Može da čeka'
    };

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item${task.completed ? ' completed' : ''}`;
        li.setAttribute('data-id', task.id);

        li.innerHTML = `
            <button class="task-checkbox" data-action="toggle" data-id="${task.id}" aria-label="${task.completed ? 'Poništi završeno' : 'Završi zadatak'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
            <div class="task-content">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-priority ${task.priority}">${priorityLabels[task.priority]}</span>
            </div>
            <button class="task-delete" data-action="delete" data-id="${task.id}" aria-label="Obriši zadatak">🗑️</button>
        `;

        taskList.appendChild(li);
    });

    // Event delegation
    taskList.querySelectorAll('[data-action="toggle"]').forEach(btn => {
        btn.addEventListener('click', () => toggleComplete(btn.dataset.id));
    });
    taskList.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => deleteTask(btn.dataset.id));
    });
}

// Bezbedan HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Ažuriraj progress bar
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${completed}/${total} završeno`;
}
