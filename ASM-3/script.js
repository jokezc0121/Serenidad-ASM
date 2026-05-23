class TaskManager {

    constructor() {
        this.tasks = this.loadFromLocalStorage();
        this.currentFilter = 'all';
        this.editingTaskId = null;

        this.init();
    }

    init() {
        this.renderTasks();
        this.updateStats();
        this.attachEventListeners();
    }

    attachEventListeners() {

        document.getElementById('addTaskBtn')
            .addEventListener('click', () => this.addTask());

        document.getElementById('taskInput')
            .addEventListener('keypress', (e) => {

                if (e.key === 'Enter') {
                    this.addTask();
                }

            });

        document.querySelectorAll('.filter-btn').forEach(btn => {

            btn.addEventListener('click', (e) => {

                document.querySelectorAll('.filter-btn')
                    .forEach(b => b.classList.remove('active'));

                e.target.classList.add('active');

                this.currentFilter = e.target.dataset.filter;

                this.renderTasks();
            });

        });

        document.getElementById('exportBtn')
            .addEventListener('click', () => this.exportToJSON());

        document.getElementById('importFile')
            .addEventListener('change', (e) => this.importFromJSON(e));
    }

    addTask() {

        const input = document.getElementById('taskInput');
        const dateInput = document.getElementById('taskDate');

        const taskText = input.value.trim();
        const dueDate = dateInput.value;

        if (!taskText) {
            this.showMessage('Por favor escribe una tarea', 'error');
            return;
        }

        if (this.editingTaskId) {

            const task = this.tasks.find(t => t.id === this.editingTaskId);

            if (task) {

                task.text = taskText;
                task.dueDate = dueDate || null;
                task.updatedAt = new Date().toISOString();

                this.showMessage('Tarea actualizada exitosamente');
            }

            this.editingTaskId = null;

            document.getElementById('addTaskBtn').textContent =
                'Agregar Tarea';

        } else {

            const newTask = {
                id: Date.now(),
                text: taskText,
                dueDate: dueDate || null,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.tasks.unshift(newTask);

            this.showMessage('Tarea agregada exitosamente');
        }

        input.value = '';
        dateInput.value = '';

        this.saveToLocalStorage();

        this.renderTasks();

        this.updateStats();
    }

    editTask(id) {

        const task = this.tasks.find(t => t.id === id);

        if (task) {

            document.getElementById('taskInput').value = task.text;

            document.getElementById('taskDate').value =
                task.dueDate || '';

            document.getElementById('taskInput').focus();

            this.editingTaskId = id;

            document.getElementById('addTaskBtn').textContent =
                'Actualizar Tarea';
        }
    }

    deleteTask(id) {

        if (confirm('¿Eliminar tarea?')) {

            this.tasks = this.tasks.filter(t => t.id !== id);

            this.saveToLocalStorage();

            this.renderTasks();

            this.updateStats();

            this.showMessage('Tarea eliminada');
        }
    }

    toggleTask(id) {

        const task = this.tasks.find(t => t.id === id);

        if (task) {

            task.completed = !task.completed;

            task.updatedAt = new Date().toISOString();

            this.saveToLocalStorage();

            this.renderTasks();

            this.updateStats();
        }
    }

    isOverdue(task) {

        if (!task.dueDate || task.completed) return false;

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const [year, month, day] = task.dueDate.split('-');

        const dueDate = new Date(year, month - 1, day);

        dueDate.setHours(0, 0, 0, 0);

        return dueDate < today;
    }

    isToday(task) {

        if (!task.dueDate) return false;

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const [year, month, day] = task.dueDate.split('-');

        const dueDate = new Date(year, month - 1, day);

        dueDate.setHours(0, 0, 0, 0);

        return dueDate.getTime() === today.getTime();
    }

    formatDate(dateString) {

        if (!dateString) return '';

        const [year, month, day] = dateString.split('-');

        const date = new Date(year, month - 1, day);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const taskDate = new Date(year, month - 1, day);

        taskDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
            (taskDate - today) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays === -1) return 'Ayer';

        if (diffDays < 0) {
            return `Hace ${Math.abs(diffDays)} días`;
        }

        if (diffDays <= 7) {
            return `En ${diffDays} días`;
        }

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== today.getFullYear()
                ? 'numeric'
                : undefined
        });
    }

    renderTasks() {

        const taskList = document.getElementById('taskList');

        let filteredTasks = this.tasks;

        if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        }

        else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        }

        else if (this.currentFilter === 'today') {
            filteredTasks = this.tasks.filter(t => this.isToday(t));
        }

        else if (this.currentFilter === 'overdue') {
            filteredTasks = this.tasks.filter(t => this.isOverdue(t));
        }

        if (filteredTasks.length === 0) {

            taskList.innerHTML = `
                <div class="empty-state">
                    <h3>No hay tareas aquí</h3>
                </div>
            `;

            return;
        }

        taskList.innerHTML = filteredTasks.map(task => {

            const isOverdue = this.isOverdue(task);

            const dateDisplay = task.dueDate
                ? this.formatDate(task.dueDate)
                : '';

            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">

                    <div
                        class="task-checkbox ${task.completed ? 'checked' : ''}"
                        data-task-id="${task.id}"
                        role="checkbox"
                        tabindex="0"
                    ></div>

                    <div class="task-content">

                        <div class="task-text">
                            ${this.escapeHtml(task.text)}
                        </div>

                        ${task.dueDate ? `
                            <div class="task-date ${isOverdue ? 'overdue-text' : ''}">
                                📅 ${dateDisplay}
                            </div>
                        ` : ''}

                    </div>

                    <div class="task-actions">

                        <button
                            class="task-btn task-btn-edit"
                            onclick="taskManager.editTask(${task.id})"
                        >
                            Editar
                        </button>

                        <button
                            class="task-btn task-btn-delete"
                            onclick="taskManager.deleteTask(${task.id})"
                        >
                            Eliminar
                        </button>

                    </div>

                </div>
            `;

        }).join('');

        document.querySelectorAll('.task-checkbox')
            .forEach(checkbox => {

                checkbox.addEventListener('click', () => {

                    const id = Number(checkbox.dataset.taskId);

                    this.toggleTask(id);
                });

                checkbox.addEventListener('keypress', (event) => {

                    if (
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {

                        const id = Number(checkbox.dataset.taskId);

                        this.toggleTask(id);
                    }

                });

            });
    }

    updateStats() {

        const total = this.tasks.length;

        const completed =
            this.tasks.filter(t => t.completed).length;

        const pending = total - completed;

        const progress =
            total > 0
                ? Math.round((completed / total) * 100)
                : 0;

        document.getElementById('totalTasks').textContent =
            total;

        document.getElementById('pendingTasks').textContent =
            pending;

        document.getElementById('completedTasks').textContent =
            completed;

        document.getElementById('progressPercent').textContent =
            `${progress}%`;
    }

    saveToLocalStorage() {

        localStorage.setItem(
            'serenidad_tasks',
            JSON.stringify(this.tasks)
        );
    }

    loadFromLocalStorage() {

        const saved =
            localStorage.getItem('serenidad_tasks');

        return saved ? JSON.parse(saved) : [];
    }

    exportToJSON() {

        const dataStr =
            JSON.stringify(this.tasks, null, 2);

        const dataBlob =
            new Blob([dataStr], {
                type: 'application/json'
            });

        const url =
            URL.createObjectURL(dataBlob);

        const link =
            document.createElement('a');

        link.href = url;

        link.download = 'tareas.json';

        link.click();

        URL.revokeObjectURL(url);
    }

    importFromJSON(event) {

        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            try {

                const imported =
                    JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    throw new Error();
                }

                this.tasks = imported;

                this.saveToLocalStorage();

                this.renderTasks();

                this.updateStats();

                this.showMessage('Importadas');

            } catch {

                this.showMessage(
                    'Archivo inválido',
                    'error'
                );
            }
        };

        reader.readAsText(file);
    }

    showMessage(message, type = 'success') {

        const messageEl =
            document.createElement('div');

        messageEl.className = 'success-message';

        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    escapeHtml(text) {

        const div = document.createElement('div');

        div.textContent = text;

        return div.innerHTML;
    }
}

class ThemeManager {

    constructor() {

        this.theme =
            localStorage.getItem('serenidad_theme')
            || 'light';

        this.init();
    }

    init() {

        this.applyTheme();

        document.getElementById('themeToggle')
            .addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {

        this.theme =
            this.theme === 'light'
                ? 'dark'
                : 'light';

        this.applyTheme();

        localStorage.setItem(
            'serenidad_theme',
            this.theme
        );
    }

    applyTheme() {

        document.documentElement
            .setAttribute('data-theme', this.theme);

        const toggle =
            document.getElementById('themeToggle');

        toggle.textContent =
            this.theme === 'light'
                ? '🌙'
                : '☀️';
    }
}

class MobileMenuManager {

    constructor() {

        this.menuToggle =
            document.getElementById('menuToggle');

        this.navLinks =
            document.getElementById('navLinks');

        this.links =
            document.querySelectorAll('.nav-links a');

        this.init();
    }

    init() {

        if (!this.menuToggle || !this.navLinks) return;

        this.menuToggle.addEventListener(
            'click',
            () => this.toggleMenu()
        );

        this.links.forEach(link => {

            link.addEventListener(
                'click',
                () => this.closeMenu()
            );

        });
    }

    toggleMenu() {

        this.menuToggle.classList.toggle('open');

        this.navLinks.classList.toggle('open');
    }

    closeMenu() {

        this.menuToggle.classList.remove('open');

        this.navLinks.classList.remove('open');
    }
}

let taskManager;
let themeManager;

document.addEventListener('DOMContentLoaded', () => {

    taskManager = new TaskManager();

    themeManager = new ThemeManager();

    new MobileMenuManager();
});