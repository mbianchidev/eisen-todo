// === EISEN TODO APPLICATION - UNIQUE IMPLEMENTATION ===

class EisenMatrixController {
    constructor() {
        this.storageKey = 'eisen_matrix_data_v1';
        this.currentTheme = 'light';
        this.activeFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.bindUIElements();
        this.attachEventHandlers();
        this.loadApplicationTheme();
        this.renderApplicationState();
    }

    bindUIElements() {
        this.elements = {
            themeBtn: document.getElementById('themeToggleBtn'),
            createBtn: document.getElementById('createTaskBtn'),
            archiveBtn: document.getElementById('showArchiveBtn'),
            closeArchiveBtn: document.getElementById('closeArchiveBtn'),
            modalOverlay: document.getElementById('taskModal'),
            modalCloseBtn: document.getElementById('closeModalBtn'),
            modalCancelBtn: document.getElementById('cancelTaskBtn'),
            taskForm: document.getElementById('taskForm'),
            mainMatrix: document.getElementById('mainMatrix'),
            archiveView: document.getElementById('archiveView'),
            archiveList: document.getElementById('archiveList'),
            tagFilterContainer: document.getElementById('tagFilterContainer'),
            modalTitle: document.getElementById('modalTitle'),
            taskTextInput: document.getElementById('taskText'),
            taskQuadrantSelect: document.getElementById('taskQuadrant'),
            taskTagsInput: document.getElementById('taskTags'),
            taskLinksInput: document.getElementById('taskLinks')
        };
    }

    attachEventHandlers() {
        this.elements.themeBtn.addEventListener('click', () => this.toggleApplicationTheme());
        this.elements.createBtn.addEventListener('click', () => this.openTaskCreationModal());
        this.elements.archiveBtn.addEventListener('click', () => this.displayArchiveView());
        this.elements.closeArchiveBtn.addEventListener('click', () => this.hideArchiveView());
        this.elements.modalCloseBtn.addEventListener('click', () => this.closeTaskModal());
        this.elements.modalCancelBtn.addEventListener('click', () => this.closeTaskModal());
        this.elements.taskForm.addEventListener('submit', (evt) => this.handleTaskSubmission(evt));
        
        this.elements.modalOverlay.addEventListener('click', (evt) => {
            if (evt.target === this.elements.modalOverlay) {
                this.closeTaskModal();
            }
        });
    }

    retrieveStoredData() {
        const rawData = localStorage.getItem(this.storageKey);
        if (!rawData) {
            return { activeTasks: [], completedTasks: [] };
        }
        try {
            return JSON.parse(rawData);
        } catch {
            return { activeTasks: [], completedTasks: [] };
        }
    }

    persistDataToStorage(dataObject) {
        localStorage.setItem(this.storageKey, JSON.stringify(dataObject));
    }

    generateUniqueIdentifier() {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    loadApplicationTheme() {
        const savedTheme = localStorage.getItem('eisen_theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.currentTheme = 'dark';
        }
    }

    toggleApplicationTheme() {
        if (this.currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.currentTheme = 'dark';
        } else {
            document.documentElement.removeAttribute('data-theme');
            this.currentTheme = 'light';
        }
        localStorage.setItem('eisen_theme', this.currentTheme);
    }

    openTaskCreationModal() {
        this.editingTaskId = null;
        this.elements.modalTitle.textContent = 'CREATE NEW TASK';
        this.elements.taskForm.reset();
        this.elements.modalOverlay.classList.remove('hidden');
    }

    openTaskEditModal(taskId) {
        const dataStore = this.retrieveStoredData();
        const taskToEdit = dataStore.activeTasks.find(t => t.id === taskId);
        
        if (!taskToEdit) return;

        this.editingTaskId = taskId;
        this.elements.modalTitle.textContent = 'EDIT TASK';
        this.elements.taskTextInput.value = taskToEdit.content;
        this.elements.taskQuadrantSelect.value = taskToEdit.quadrant;
        this.elements.taskTagsInput.value = taskToEdit.labels.join(', ');
        this.elements.taskLinksInput.value = taskToEdit.urls.join(', ');
        
        this.elements.modalOverlay.classList.remove('hidden');
    }

    closeTaskModal() {
        this.elements.modalOverlay.classList.add('hidden');
        this.elements.taskForm.reset();
        this.editingTaskId = null;
    }

    handleTaskSubmission(evt) {
        evt.preventDefault();
        
        const taskContent = this.elements.taskTextInput.value.trim();
        const taskQuadrant = this.elements.taskQuadrantSelect.value;
        const taskLabels = this.elements.taskTagsInput.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        const taskUrls = this.elements.taskLinksInput.value
            .split(',')
            .map(url => url.trim())
            .filter(url => url.length > 0);

        if (!taskContent) return;

        const dataStore = this.retrieveStoredData();

        if (this.editingTaskId) {
            const taskIndex = dataStore.activeTasks.findIndex(t => t.id === this.editingTaskId);
            if (taskIndex !== -1) {
                dataStore.activeTasks[taskIndex] = {
                    ...dataStore.activeTasks[taskIndex],
                    content: taskContent,
                    quadrant: taskQuadrant,
                    labels: taskLabels,
                    urls: taskUrls
                };
            }
        } else {
            const newTask = {
                id: this.generateUniqueIdentifier(),
                content: taskContent,
                quadrant: taskQuadrant,
                labels: taskLabels,
                urls: taskUrls,
                status: 'todo',
                createdAt: new Date().toISOString()
            };
            dataStore.activeTasks.push(newTask);
        }

        this.persistDataToStorage(dataStore);
        this.closeTaskModal();
        this.renderApplicationState();
    }

    removeTaskPermanently(taskId) {
        if (!confirm('Delete this task permanently?')) return;

        const dataStore = this.retrieveStoredData();
        dataStore.activeTasks = dataStore.activeTasks.filter(t => t.id !== taskId);
        dataStore.completedTasks = dataStore.completedTasks.filter(t => t.id !== taskId);
        
        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
    }

    advanceTaskStatus(taskId) {
        const dataStore = this.retrieveStoredData();
        const taskToUpdate = dataStore.activeTasks.find(t => t.id === taskId);
        
        if (!taskToUpdate) return;

        const statusProgression = {
            'todo': 'in-progress',
            'in-progress': 'done'
        };

        const nextStatus = statusProgression[taskToUpdate.status];
        
        if (nextStatus === 'done') {
            taskToUpdate.status = 'done';
            taskToUpdate.completedAt = new Date().toISOString();
            dataStore.completedTasks.push(taskToUpdate);
            dataStore.activeTasks = dataStore.activeTasks.filter(t => t.id !== taskId);
        } else {
            taskToUpdate.status = nextStatus;
        }

        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
    }

    revertTaskStatus(taskId) {
        const dataStore = this.retrieveStoredData();
        const taskToUpdate = dataStore.activeTasks.find(t => t.id === taskId);
        
        if (!taskToUpdate) return;

        const statusRegression = {
            'in-progress': 'todo',
            'todo': 'todo'
        };

        taskToUpdate.status = statusRegression[taskToUpdate.status];
        
        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
    }

    restoreCompletedTask(taskId) {
        const dataStore = this.retrieveStoredData();
        const taskToRestore = dataStore.completedTasks.find(t => t.id === taskId);
        
        if (!taskToRestore) return;

        taskToRestore.status = 'todo';
        delete taskToRestore.completedAt;
        
        dataStore.activeTasks.push(taskToRestore);
        dataStore.completedTasks = dataStore.completedTasks.filter(t => t.id !== taskId);
        
        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
    }

    displayArchiveView() {
        this.elements.mainMatrix.classList.add('hidden');
        this.elements.archiveView.classList.remove('hidden');
        this.populateArchiveDisplay();
    }

    hideArchiveView() {
        this.elements.archiveView.classList.add('hidden');
        this.elements.mainMatrix.classList.remove('hidden');
    }

    updateTagFilterDisplay() {
        const dataStore = this.retrieveStoredData();
        const allLabels = new Set();
        
        dataStore.activeTasks.forEach(task => {
            task.labels.forEach(label => allLabels.add(label));
        });

        const filterHTML = ['<button class="tag-filter active" data-filter="all">ALL</button>'];
        
        Array.from(allLabels).sort().forEach(label => {
            filterHTML.push(`<button class="tag-filter" data-filter="${this.escapeHTML(label)}">${this.escapeHTML(label)}</button>`);
        });

        this.elements.tagFilterContainer.innerHTML = filterHTML.join('');

        this.elements.tagFilterContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.tagFilterContainer.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.filter;
                this.renderMatrixTasks();
            });
        });
    }

    renderApplicationState() {
        this.updateTagFilterDisplay();
        this.renderMatrixTasks();
    }

    renderMatrixTasks() {
        const dataStore = this.retrieveStoredData();
        const quadrants = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];

        quadrants.forEach(quadrantId => {
            const zone = document.querySelector(`.task-zone[data-zone="${quadrantId}"]`);
            if (!zone) return;

            const quadrantTasks = dataStore.activeTasks.filter(task => {
                const matchesQuadrant = task.quadrant === quadrantId;
                const matchesFilter = this.activeFilter === 'all' || task.labels.includes(this.activeFilter);
                return matchesQuadrant && matchesFilter;
            });

            zone.innerHTML = quadrantTasks.map(task => this.generateTaskCardHTML(task)).join('');

            zone.querySelectorAll('.task-card').forEach(card => {
                const taskId = card.dataset.taskId;
                
                card.querySelector('.btn-edit')?.addEventListener('click', () => this.openTaskEditModal(taskId));
                card.querySelector('.btn-delete')?.addEventListener('click', () => this.removeTaskPermanently(taskId));
                card.querySelector('.btn-advance')?.addEventListener('click', () => this.advanceTaskStatus(taskId));
                card.querySelector('.btn-revert')?.addEventListener('click', () => this.revertTaskStatus(taskId));
            });
        });
    }

    generateTaskCardHTML(task) {
        const statusLabels = {
            'todo': 'TODO',
            'in-progress': 'IN PROGRESS',
            'done': 'DONE'
        };

        const statusClasses = {
            'todo': 'status-todo',
            'in-progress': 'status-in-progress',
            'done': 'status-done'
        };

        const tagsHTML = task.labels.length > 0
            ? `<div class="task-tags">${task.labels.map(label => `<span class="task-tag">${this.escapeHTML(label)}</span>`).join('')}</div>`
            : '';

        const linksHTML = task.urls.length > 0
            ? `<div class="task-links">${task.urls.map(url => `<a href="${this.escapeHTML(url)}" class="task-link" target="_blank" rel="noopener noreferrer">${this.escapeHTML(url)}</a>`).join('')}</div>`
            : '';

        const advanceButtonText = task.status === 'todo' ? 'START' : 'COMPLETE';
        const showRevert = task.status === 'in-progress';

        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <span class="task-status-badge ${statusClasses[task.status]}">${statusLabels[task.status]}</span>
                    <div class="task-actions">
                        <button class="task-action-btn btn-edit" title="Edit">✎</button>
                        <button class="task-action-btn btn-delete" title="Delete">✕</button>
                    </div>
                </div>
                <p class="task-text">${this.escapeHTML(task.content)}</p>
                ${tagsHTML}
                ${linksHTML}
                <div class="task-controls">
                    <button class="task-control-btn btn-advance">${advanceButtonText}</button>
                    ${showRevert ? '<button class="task-control-btn btn-revert">← REVERT</button>' : ''}
                </div>
            </div>
        `;
    }

    populateArchiveDisplay() {
        const dataStore = this.retrieveStoredData();
        
        if (dataStore.completedTasks.length === 0) {
            this.elements.archiveList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No completed tasks yet.</p>';
            return;
        }

        const sortedCompleted = [...dataStore.completedTasks].sort((a, b) => {
            return new Date(b.completedAt) - new Date(a.completedAt);
        });

        this.elements.archiveList.innerHTML = sortedCompleted.map(task => this.generateArchivedTaskHTML(task)).join('');

        this.elements.archiveList.querySelectorAll('.task-card').forEach(card => {
            const taskId = card.dataset.taskId;
            card.querySelector('.btn-restore')?.addEventListener('click', () => this.restoreCompletedTask(taskId));
            card.querySelector('.btn-delete')?.addEventListener('click', () => this.removeTaskPermanently(taskId));
        });
    }

    generateArchivedTaskHTML(task) {
        const quadrantNames = {
            'urgent-important': '🔥 DO FIRST',
            'not-urgent-important': '📅 SCHEDULE',
            'urgent-not-important': '👥 DELEGATE',
            'not-urgent-not-important': '🗑️ ELIMINATE'
        };

        const tagsHTML = task.labels.length > 0
            ? `<div class="task-tags">${task.labels.map(label => `<span class="task-tag">${this.escapeHTML(label)}</span>`).join('')}</div>`
            : '';

        const linksHTML = task.urls.length > 0
            ? `<div class="task-links">${task.urls.map(url => `<a href="${this.escapeHTML(url)}" class="task-link" target="_blank" rel="noopener noreferrer">${this.escapeHTML(url)}</a>`).join('')}</div>`
            : '';

        const completedDate = new Date(task.completedAt).toLocaleDateString();

        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <span class="task-status-badge status-done">COMPLETED</span>
                    <div class="task-actions">
                        <button class="task-action-btn btn-delete" title="Delete">✕</button>
                    </div>
                </div>
                <p class="task-text">${this.escapeHTML(task.content)}</p>
                ${tagsHTML}
                ${linksHTML}
                <div class="task-controls">
                    <button class="task-control-btn btn-restore">↻ RESTORE</button>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: auto;">${completedDate}</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">From: ${quadrantNames[task.quadrant]}</p>
            </div>
        `;
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new EisenMatrixController();
    });
} else {
    new EisenMatrixController();
}
