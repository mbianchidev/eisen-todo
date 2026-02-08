// === EISEN TODO APPLICATION - UNIQUE IMPLEMENTATION ===

class EisenMatrixController {
    constructor() {
        this.storageKey = 'eisen_matrix_data_v1';
        this.currentTheme = 'light';
        this.activeFilter = 'all';
        this.editingTaskId = null;
        this.directQuadrant = null; // set when creating from a quadrant's + button
        this.isUrgent = false;
        this.isImportant = false;
        this.draggedTaskId = null;
        this.inlineEditingTaskId = null; // currently inline-editing task
        this.draftsKey = 'eisen_drafts_v1';
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.bindUIElements();
        this.attachEventHandlers();
        this.loadApplicationTheme();
        this.loadDrafts();
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
            taskLinksInput: document.getElementById('taskLinks'),
            quadrantSelectGroup: document.getElementById('quadrantSelectGroup'),
            urgencyToggleGroup: document.getElementById('urgencyToggleGroup'),
            urgentYes: document.getElementById('urgentYes'),
            urgentNo: document.getElementById('urgentNo'),
            importantYes: document.getElementById('importantYes'),
            importantNo: document.getElementById('importantNo'),
            quadrantPreview: document.getElementById('quadrantPreview')
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

        // Per-quadrant add buttons (removed — quick-add input is sufficient)

        // Urgency / importance toggle buttons
        this.elements.urgentYes.addEventListener('click', () => this.setUrgent(true));
        this.elements.urgentNo.addEventListener('click', () => this.setUrgent(false));
        this.elements.importantYes.addEventListener('click', () => this.setImportant(true));
        this.elements.importantNo.addEventListener('click', () => this.setImportant(false));

        // Drag-and-drop on task zones
        document.querySelectorAll('.task-zone').forEach(zone => {
            zone.addEventListener('dragover', (evt) => {
                evt.preventDefault();
                zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            zone.addEventListener('drop', (evt) => {
                evt.preventDefault();
                zone.classList.remove('drag-over');
                const taskId = evt.dataTransfer.getData('text/plain');
                const targetQuadrant = zone.dataset.zone;
                if (taskId && targetQuadrant) {
                    this.moveTaskToQuadrant(taskId, targetQuadrant);
                }
            });
        });

        // Inline quick-add inputs
        document.querySelectorAll('.quick-add-input').forEach(input => {
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    this.handleQuickAdd(input);
                }
            });
            // Save drafts on every keystroke
            input.addEventListener('input', () => {
                this.saveDrafts();
            });
        });

        // Click outside to save inline editing
        document.addEventListener('click', (evt) => {
            if (this.inlineEditingTaskId) {
                const editingCard = document.querySelector(`.task-card[data-task-id="${this.inlineEditingTaskId}"]`);
                if (editingCard && !editingCard.contains(evt.target)) {
                    this.saveInlineEdit(this.inlineEditingTaskId);
                }
            }
        });
    }

    // --- Quick-add parser ---

    parseQuickInput(rawText) {
        // Extract #tags
        const tagMatches = rawText.match(/#(\w[\w-]*)/g) || [];
        const labels = tagMatches.map(t => t.substring(1));

        // Extract https:// URLs
        const urlMatches = rawText.match(/https?:\/\/[^\s,]+/g) || [];

        // Remove tags and URLs to get the task content
        let content = rawText;
        tagMatches.forEach(t => { content = content.replace(t, ''); });
        urlMatches.forEach(u => { content = content.replace(u, ''); });
        content = content.replace(/\s+/g, ' ').trim();

        return { content, labels, urls: urlMatches };
    }

    handleQuickAdd(inputElement) {
        const raw = inputElement.value.trim();
        if (!raw) return;

        const { content, labels, urls } = this.parseQuickInput(raw);
        if (!content) return;

        const quadrant = inputElement.dataset.quadrant;
        const dataStore = this.retrieveStoredData();

        const newTask = {
            id: this.generateUniqueIdentifier(),
            content,
            quadrant,
            labels,
            urls,
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        dataStore.activeTasks.push(newTask);
        this.persistDataToStorage(dataStore);

        inputElement.value = '';
        this.saveDrafts();
        this.renderApplicationState();
    }

    // --- Draft persistence ---

    saveDrafts() {
        const drafts = {};
        document.querySelectorAll('.quick-add-input').forEach(input => {
            const q = input.dataset.quadrant;
            if (input.value) {
                drafts[q] = input.value;
            }
        });
        localStorage.setItem(this.draftsKey, JSON.stringify(drafts));
    }

    loadDrafts() {
        const raw = localStorage.getItem(this.draftsKey);
        if (!raw) return;
        try {
            const drafts = JSON.parse(raw);
            document.querySelectorAll('.quick-add-input').forEach(input => {
                const q = input.dataset.quadrant;
                if (drafts[q]) {
                    input.value = drafts[q];
                }
            });
        } catch { /* ignore */ }
    }

    // --- Inline click-to-edit ---

    enterInlineEdit(taskId) {
        // Save any previous inline edit first
        if (this.inlineEditingTaskId && this.inlineEditingTaskId !== taskId) {
            this.saveInlineEdit(this.inlineEditingTaskId);
        }

        this.inlineEditingTaskId = taskId;

        const dataStore = this.retrieveStoredData();
        const task = dataStore.activeTasks.find(t => t.id === taskId);
        if (!task) return;

        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!card) return;

        const textEl = card.querySelector('.task-text');
        if (!textEl || textEl.contentEditable === 'true') return;

        card.classList.add('inline-editing');
        card.setAttribute('draggable', 'false');

        // Show editable raw text with tags and links inline
        const rawParts = [task.content];
        if (task.labels.length > 0) {
            rawParts.push(task.labels.map(l => `#${l}`).join(' '));
        }
        if (task.urls.length > 0) {
            rawParts.push(task.urls.join(' '));
        }
        textEl.textContent = rawParts.join(' ');

        // Make text editable
        textEl.contentEditable = 'true';
        textEl.focus();

        // Place cursor at end
        const range = document.createRange();
        range.selectNodeContents(textEl);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        // Save on Enter (without Shift)
        textEl.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' && !evt.shiftKey) {
                evt.preventDefault();
                this.saveInlineEdit(taskId);
            }
            if (evt.key === 'Escape') {
                evt.preventDefault();
                this.cancelInlineEdit(taskId);
            }
        });
    }

    saveInlineEdit(taskId) {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!card) {
            this.inlineEditingTaskId = null;
            return;
        }

        const textEl = card.querySelector('.task-text');
        if (!textEl || textEl.contentEditable !== 'true') {
            this.inlineEditingTaskId = null;
            return;
        }

        const newContent = textEl.textContent.trim();
        if (newContent) {
            const { content, labels, urls } = this.parseQuickInput(newContent);
            const dataStore = this.retrieveStoredData();
            const task = dataStore.activeTasks.find(t => t.id === taskId);
            if (task && content) {
                task.content = content;
                task.labels = labels;
                task.urls = urls;
                this.persistDataToStorage(dataStore);
            }
        }

        this.inlineEditingTaskId = null;
        this.renderApplicationState();
    }

    cancelInlineEdit(taskId) {
        this.inlineEditingTaskId = null;
        this.renderApplicationState();
    }

    // --- Urgent / Important toggle helpers ---

    setUrgent(value) {
        this.isUrgent = value;
        this.elements.urgentYes.classList.toggle('active', value);
        this.elements.urgentNo.classList.toggle('active', !value);
        this.updateQuadrantPreview();
    }

    setImportant(value) {
        this.isImportant = value;
        this.elements.importantYes.classList.toggle('active', value);
        this.elements.importantNo.classList.toggle('active', !value);
        this.updateQuadrantPreview();
    }

    deriveQuadrant(urgent, important) {
        if (urgent && important) return 'urgent-important';
        if (!urgent && important) return 'not-urgent-important';
        if (urgent && !important) return 'urgent-not-important';
        return 'not-urgent-not-important';
    }

    updateQuadrantPreview() {
        const q = this.deriveQuadrant(this.isUrgent, this.isImportant);
        const meta = {
            'urgent-important': { icon: '🔥', label: '→ DO FIRST' },
            'not-urgent-important': { icon: '📅', label: '→ SCHEDULE' },
            'urgent-not-important': { icon: '👥', label: '→ DELEGATE' },
            'not-urgent-not-important': { icon: '🗑️', label: '→ ELIMINATE' }
        };
        this.elements.quadrantPreview.querySelector('.preview-icon').textContent = meta[q].icon;
        this.elements.quadrantPreview.querySelector('.preview-label').textContent = meta[q].label;
    }

    // --- Drag-and-drop ---

    moveTaskToQuadrant(taskId, targetQuadrant) {
        const dataStore = this.retrieveStoredData();
        const task = dataStore.activeTasks.find(t => t.id === taskId);
        if (!task || task.quadrant === targetQuadrant) return;
        task.quadrant = targetQuadrant;
        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
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
        this.directQuadrant = null;
        this.elements.modalTitle.textContent = 'CREATE NEW TASK';
        this.elements.taskForm.reset();
        // Show urgency toggles, hide quadrant select
        this.elements.quadrantSelectGroup.classList.add('hidden');
        this.elements.urgencyToggleGroup.classList.remove('hidden');
        this.setUrgent(false);
        this.setImportant(false);
        this.elements.modalOverlay.classList.remove('hidden');
    }

    openTaskCreationModalForQuadrant(quadrant) {
        this.editingTaskId = null;
        this.directQuadrant = quadrant;
        this.elements.modalTitle.textContent = 'ADD TASK';
        this.elements.taskForm.reset();
        // Hide both quadrant choosers – quadrant is predetermined
        this.elements.quadrantSelectGroup.classList.add('hidden');
        this.elements.urgencyToggleGroup.classList.add('hidden');
        this.elements.modalOverlay.classList.remove('hidden');
    }

    openTaskEditModal(taskId) {
        const dataStore = this.retrieveStoredData();
        const taskToEdit = dataStore.activeTasks.find(t => t.id === taskId);
        
        if (!taskToEdit) return;

        this.editingTaskId = taskId;
        this.directQuadrant = null;
        this.elements.modalTitle.textContent = 'EDIT TASK';
        this.elements.taskTextInput.value = taskToEdit.content;
        this.elements.taskQuadrantSelect.value = taskToEdit.quadrant;
        this.elements.taskTagsInput.value = taskToEdit.labels.join(', ');
        this.elements.taskLinksInput.value = taskToEdit.urls.join(', ');
        // When editing, show the quadrant dropdown, hide toggles
        this.elements.quadrantSelectGroup.classList.remove('hidden');
        this.elements.urgencyToggleGroup.classList.add('hidden');
        
        this.elements.modalOverlay.classList.remove('hidden');
    }

    closeTaskModal() {
        this.elements.modalOverlay.classList.add('hidden');
        this.elements.taskForm.reset();
        this.editingTaskId = null;
        this.directQuadrant = null;
    }

    handleTaskSubmission(evt) {
        evt.preventDefault();
        
        const taskContent = this.elements.taskTextInput.value.trim();

        // Determine quadrant based on context
        let taskQuadrant;
        if (this.editingTaskId) {
            // Editing: use dropdown
            taskQuadrant = this.elements.taskQuadrantSelect.value;
        } else if (this.directQuadrant) {
            // Created from quadrant + button
            taskQuadrant = this.directQuadrant;
        } else {
            // Created from NEW TASK button: derive from toggles
            taskQuadrant = this.deriveQuadrant(this.isUrgent, this.isImportant);
        }

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
        if (!this.elements.archiveView.classList.contains('hidden')) {
            this.populateArchiveDisplay();
        }
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

        // Enforce max 1 in-progress in the urgent-important quadrant
        if (nextStatus === 'in-progress' && taskToUpdate.quadrant === 'urgent-important') {
            const alreadyInProgress = dataStore.activeTasks.some(
                t => t.id !== taskId && t.quadrant === 'urgent-important' && t.status === 'in-progress'
            );
            if (alreadyInProgress) {
                alert('Only one task can be in progress in the "Do First" quadrant. Complete or revert the current one first.');
                return;
            }
        }
        
        if (nextStatus === 'done') {
            taskToUpdate.status = 'done';
            taskToUpdate.completedAt = new Date().toISOString();
            dataStore.completedTasks.push({ ...taskToUpdate });
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
        if (!this.elements.archiveView.classList.contains('hidden')) {
            this.populateArchiveDisplay();
        }
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
                
                // Drag events
                card.addEventListener('dragstart', (evt) => {
                    if (this.inlineEditingTaskId === taskId) {
                        evt.preventDefault();
                        return;
                    }
                    evt.dataTransfer.setData('text/plain', taskId);
                    card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                });

                // Click on task text to enter inline edit
                const taskTextEl = card.querySelector('.task-text');
                taskTextEl?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.enterInlineEdit(taskId);
                });

                card.querySelector('.btn-delete')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.removeTaskPermanently(taskId);
                });
                card.querySelector('.btn-advance')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.advanceTaskStatus(taskId);
                });
                card.querySelector('.btn-revert')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.revertTaskStatus(taskId);
                });
            });
        });
    }

    generateTaskCardHTML(task) {
        const statusConfig = this.getStatusConfig(task.quadrant);
        const statusLabel = statusConfig[task.status] || task.status.toUpperCase();

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

        const advanceButtonText = task.status === 'todo'
            ? statusConfig.startAction
            : statusConfig.completeAction;
        const showRevert = task.status === 'in-progress';

        return `
            <div class="task-card" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <span class="task-status-badge ${statusClasses[task.status]}">${statusLabel}</span>
                    <div class="task-actions">
                        <button class="task-action-btn btn-delete" title="Delete">✕</button>
                    </div>
                </div>
                <p class="task-text" title="Click to edit">${this.escapeHTML(task.content)}</p>
                ${tagsHTML}
                ${linksHTML}
                <div class="task-controls">
                    <button class="task-control-btn btn-advance">${advanceButtonText}</button>
                    ${showRevert ? '<button class="task-control-btn btn-revert">← REVERT</button>' : ''}
                </div>
            </div>
        `;
    }

    getStatusConfig(quadrant) {
        const configs = {
            'urgent-important': {
                'todo': 'TODO',
                'in-progress': 'IN PROGRESS',
                'done': 'DONE',
                startAction: 'START',
                completeAction: 'COMPLETE'
            },
            'not-urgent-important': {
                'todo': 'TODO',
                'in-progress': 'SCHEDULING',
                'done': 'SCHEDULED',
                startAction: 'SCHEDULE',
                completeAction: 'SCHEDULED'
            },
            'urgent-not-important': {
                'todo': 'TODO',
                'in-progress': 'DELEGATING',
                'done': 'DELEGATED',
                startAction: 'DELEGATE',
                completeAction: 'DELEGATED'
            },
            'not-urgent-not-important': {
                'todo': 'TODO',
                'in-progress': 'ARCHIVING',
                'done': 'ARCHIVED',
                startAction: 'ARCHIVE',
                completeAction: 'ARCHIVED'
            }
        };
        return configs[quadrant] || configs['urgent-important'];
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

        const statusConfig = this.getStatusConfig(task.quadrant);
        const completedLabel = statusConfig['done'] || 'COMPLETED';

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
                    <span class="task-status-badge status-done">${completedLabel}</span>
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
