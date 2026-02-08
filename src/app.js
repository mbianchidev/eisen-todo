// === EISEN TODO APPLICATION - UNIQUE IMPLEMENTATION ===

class EisenMatrixController {
    constructor() {
        this.storageKey = 'eisen_matrix_data_v1';
        this.currentTheme = 'light';
        this.activeFilters = new Set(); // multi-tag filter (empty = show all)
        this.editingTaskId = null;
        this.directQuadrant = null; // set when creating from a quadrant's + button
        this.isUrgent = false;
        this.isImportant = false;
        this.draggedTaskId = null;
        this.inlineEditingTaskId = null; // currently inline-editing task
        this.draftsKey = 'eisen_drafts_v1';
        this.pendingDeleteTaskId = null; // task awaiting delete confirmation
        this.collapsedKey = 'eisen_collapsed_v1';
        this.collapsedTasks = new Set(); // ids of collapsed tasks
        this.searchQuery = ''; // text search filter
        this.allCollapsed = false; // toggle state for collapse-all button
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.bindUIElements();
        this.loadCollapsedState();
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
            quadrantPreview: document.getElementById('quadrantPreview'),
            deleteConfirmOverlay: document.getElementById('deleteConfirmOverlay'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            confirmArchiveBtn: document.getElementById('confirmArchiveBtn'),
            confirmCancelBtn: document.getElementById('confirmCancelBtn'),
            searchInput: document.getElementById('searchInput'),
            collapseAllBtn: document.getElementById('collapseAllBtn'),
            collapseAllIcon: document.getElementById('collapseAllIcon')
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

        // Urgency / importance toggle buttons
        this.elements.urgentYes.addEventListener('click', () => this.setUrgent(true));
        this.elements.urgentNo.addEventListener('click', () => this.setUrgent(false));
        this.elements.importantYes.addEventListener('click', () => this.setImportant(true));
        this.elements.importantNo.addEventListener('click', () => this.setImportant(false));

        // Search bar
        this.elements.searchInput.addEventListener('input', () => {
            this.searchQuery = this.elements.searchInput.value.trim().toLowerCase();
            this.renderMatrixTasks();
        });

        // Collapse/Expand all
        this.elements.collapseAllBtn.addEventListener('click', () => this.toggleCollapseAll());

        // Delete confirmation dialog
        this.elements.confirmDeleteBtn.addEventListener('click', () => this.executeDelete());
        this.elements.confirmArchiveBtn.addEventListener('click', () => this.archiveInsteadOfDelete());
        this.elements.confirmCancelBtn.addEventListener('click', () => this.cancelDelete());
        this.elements.deleteConfirmOverlay.addEventListener('click', (evt) => {
            if (evt.target === this.elements.deleteConfirmOverlay) {
                this.cancelDelete();
            }
        });

        // Drag-and-drop on task zones (supports reordering)
        document.querySelectorAll('.task-zone').forEach(zone => {
            zone.addEventListener('dragover', (evt) => {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'move';
                this.showDropIndicator(zone, evt.clientY);
            });
            zone.addEventListener('dragleave', (evt) => {
                // Only remove if actually leaving the zone
                if (!zone.contains(evt.relatedTarget)) {
                    zone.classList.remove('drag-over');
                    this.removeDropIndicators(zone);
                }
            });
            zone.addEventListener('drop', (evt) => {
                evt.preventDefault();
                zone.classList.remove('drag-over');
                const taskId = evt.dataTransfer.getData('text/plain');
                const targetQuadrant = zone.dataset.zone;
                if (taskId && targetQuadrant) {
                    const dropIndex = this.getDropIndex(zone, evt.clientY);
                    this.moveTaskToPosition(taskId, targetQuadrant, dropIndex);
                }
                this.removeDropIndicators(zone);
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

    // --- Drop indicator and reorder helpers ---

    showDropIndicator(zone, clientY) {
        this.removeDropIndicators(zone);
        zone.classList.add('drag-over');

        const cards = Array.from(zone.querySelectorAll('.task-card:not(.dragging)'));
        if (cards.length === 0) return;

        let insertBefore = null;
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) {
                insertBefore = card;
                break;
            }
        }

        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        if (insertBefore) {
            zone.insertBefore(indicator, insertBefore);
        } else {
            zone.appendChild(indicator);
        }
    }

    removeDropIndicators(zone) {
        zone.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }

    getDropIndex(zone, clientY) {
        const cards = Array.from(zone.querySelectorAll('.task-card:not(.dragging)'));
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) {
                return i;
            }
        }
        return cards.length; // drop at end
    }

    moveTaskToPosition(taskId, targetQuadrant, dropIndex) {
        const dataStore = this.retrieveStoredData();
        const taskIndex = dataStore.activeTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const task = dataStore.activeTasks[taskIndex];

        // Remove from current position
        dataStore.activeTasks.splice(taskIndex, 1);

        // Get current tasks in this quadrant (after removal) to find insert position
        const quadrantTasks = dataStore.activeTasks.filter(t => t.quadrant === targetQuadrant);
        
        // Apply filter to match what's visible
        const visibleQuadrantTasks = quadrantTasks.filter(t => {
            return this.activeFilters.size === 0 || t.labels.some(l => this.activeFilters.has(l));
        });

        // Determine the actual index in activeTasks to insert at
        task.quadrant = targetQuadrant;
        
        if (dropIndex >= visibleQuadrantTasks.length) {
            // Insert after the last task in this quadrant
            const lastTask = quadrantTasks[quadrantTasks.length - 1];
            if (lastTask) {
                const lastIdx = dataStore.activeTasks.indexOf(lastTask);
                dataStore.activeTasks.splice(lastIdx + 1, 0, task);
            } else {
                dataStore.activeTasks.push(task);
            }
        } else {
            // Insert before the task at dropIndex in visible list
            const targetTask = visibleQuadrantTasks[dropIndex];
            const targetIdx = dataStore.activeTasks.indexOf(targetTask);
            dataStore.activeTasks.splice(targetIdx, 0, task);
        }

        this.persistDataToStorage(dataStore);
        this.renderApplicationState();
    }

    // --- Quick-add parser ---

    parseQuickInput(rawText) {
        const tagMatches = rawText.match(/#(\w[\w-]*)/g) || [];
        const labels = tagMatches.map(t => t.substring(1));

        const urlMatches = rawText.match(/https?:\/\/[^\s,]+/g) || [];

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

    // --- Collapsed state persistence ---

    loadCollapsedState() {
        const raw = localStorage.getItem(this.collapsedKey);
        if (!raw) return;
        try {
            const arr = JSON.parse(raw);
            this.collapsedTasks = new Set(arr);
        } catch { /* ignore */ }
    }

    saveCollapsedState() {
        localStorage.setItem(this.collapsedKey, JSON.stringify([...this.collapsedTasks]));
    }

    toggleCollapse(taskId) {
        if (this.collapsedTasks.has(taskId)) {
            this.collapsedTasks.delete(taskId);
        } else {
            this.collapsedTasks.add(taskId);
        }
        this.saveCollapsedState();
        this.updateCollapseAllState();

        // Toggle directly in DOM without full re-render (faster)
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.toggle('collapsed');
            const btn = card.querySelector('.task-collapse-btn');
            if (btn) {
                btn.textContent = card.classList.contains('collapsed') ? '▸' : '▾';
            }
        }
    }

    toggleCollapseAll() {
        const dataStore = this.retrieveStoredData();
        const allIds = dataStore.activeTasks.map(t => t.id);

        if (this.allCollapsed) {
            // Expand all
            this.collapsedTasks.clear();
            this.allCollapsed = false;
        } else {
            // Collapse all
            allIds.forEach(id => this.collapsedTasks.add(id));
            this.allCollapsed = true;
        }
        this.saveCollapsedState();
        this.elements.collapseAllIcon.textContent = this.allCollapsed ? '▸' : '▾';
        this.renderApplicationState();
    }

    updateCollapseAllState() {
        const dataStore = this.retrieveStoredData();
        const allIds = dataStore.activeTasks.map(t => t.id);
        this.allCollapsed = allIds.length > 0 && allIds.every(id => this.collapsedTasks.has(id));
        this.elements.collapseAllIcon.textContent = this.allCollapsed ? '▸' : '▾';
    }

    // --- Inline click-to-edit ---

    enterInlineEdit(taskId) {
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

        textEl.contentEditable = 'true';
        textEl.focus();

        const range = document.createRange();
        range.selectNodeContents(textEl);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

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

    // --- Delete confirmation dialog ---

    promptDelete(taskId) {
        this.pendingDeleteTaskId = taskId;
        this.elements.deleteConfirmOverlay.classList.remove('hidden');
    }

    executeDelete() {
        const taskId = this.pendingDeleteTaskId;
        if (!taskId) return;

        const dataStore = this.retrieveStoredData();
        dataStore.activeTasks = dataStore.activeTasks.filter(t => t.id !== taskId);
        dataStore.completedTasks = dataStore.completedTasks.filter(t => t.id !== taskId);
        
        // Clean up collapsed state
        this.collapsedTasks.delete(taskId);
        this.saveCollapsedState();

        this.persistDataToStorage(dataStore);
        this.cancelDelete();
        this.renderApplicationState();
        if (!this.elements.archiveView.classList.contains('hidden')) {
            this.populateArchiveDisplay();
        }
    }

    archiveInsteadOfDelete() {
        const taskId = this.pendingDeleteTaskId;
        if (!taskId) return;
        
        const dataStore = this.retrieveStoredData();
        const task = dataStore.activeTasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'done';
            task.completedAt = new Date().toISOString();
            dataStore.completedTasks.push({ ...task });
            dataStore.activeTasks = dataStore.activeTasks.filter(t => t.id !== taskId);
            this.persistDataToStorage(dataStore);
        }
        
        // Clean up collapsed state
        this.collapsedTasks.delete(taskId);
        this.saveCollapsedState();

        this.cancelDelete();
        this.renderApplicationState();
    }

    cancelDelete() {
        this.pendingDeleteTaskId = null;
        this.elements.deleteConfirmOverlay.classList.add('hidden');
    }

    // --- Tag filter (multi-select) ---

    toggleTagFilter(tag) {
        if (this.activeFilters.has(tag)) {
            this.activeFilters.delete(tag);
        } else {
            this.activeFilters.add(tag);
        }
        this.renderApplicationState();
    }

    clearTagFilters() {
        this.activeFilters.clear();
        this.renderApplicationState();
    }

    // --- Data & storage ---

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

        let taskQuadrant;
        if (this.editingTaskId) {
            taskQuadrant = this.elements.taskQuadrantSelect.value;
        } else if (this.directQuadrant) {
            taskQuadrant = this.directQuadrant;
        } else {
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
        this.promptDelete(taskId);
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
            
            // Clean up collapsed state
            this.collapsedTasks.delete(taskId);
            this.saveCollapsedState();
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

        const isAllActive = this.activeFilters.size === 0;
        const filterHTML = [`<button class="tag-filter ${isAllActive ? 'active' : ''}" data-filter="all">ALL</button>`];
        
        Array.from(allLabels).sort().forEach(label => {
            const isActive = this.activeFilters.has(label);
            filterHTML.push(`<button class="tag-filter ${isActive ? 'active' : ''}" data-filter="${this.escapeHTML(label)}">${this.escapeHTML(label)}</button>`);
        });

        this.elements.tagFilterContainer.innerHTML = filterHTML.join('');

        this.elements.tagFilterContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterValue = btn.dataset.filter;
                if (filterValue === 'all') {
                    this.clearTagFilters();
                } else {
                    this.toggleTagFilter(filterValue);
                }
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
                const matchesFilter = this.activeFilters.size === 0 || task.labels.some(l => this.activeFilters.has(l));
                const matchesSearch = !this.searchQuery || 
                    task.content.toLowerCase().includes(this.searchQuery) ||
                    task.labels.some(l => l.toLowerCase().includes(this.searchQuery));
                return matchesQuadrant && matchesFilter && matchesSearch;
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
                    this.draggedTaskId = taskId;
                    evt.dataTransfer.setData('text/plain', taskId);
                    card.classList.add('dragging');
                });
                card.addEventListener('dragend', () => {
                    this.draggedTaskId = null;
                    card.classList.remove('dragging');
                    // Clean up all indicators
                    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
                    document.querySelectorAll('.task-zone').forEach(z => z.classList.remove('drag-over'));
                });

                // Collapse button
                card.querySelector('.task-collapse-btn')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.toggleCollapse(taskId);
                });

                // Delete button
                card.querySelector('.btn-delete')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.removeTaskPermanently(taskId);
                });

                // Advance and revert buttons
                card.querySelector('.btn-advance')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.advanceTaskStatus(taskId);
                });
                card.querySelector('.btn-revert')?.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    this.revertTaskStatus(taskId);
                });

                // Tag click handlers (filter by tag)
                card.querySelectorAll('.task-tag').forEach(tagEl => {
                    tagEl.addEventListener('click', (evt) => {
                        evt.stopPropagation();
                        const tagName = tagEl.textContent.trim();
                        this.toggleTagFilter(tagName);
                    });
                });

                // Link click: just stop propagation so it doesn't trigger edit
                card.querySelectorAll('.task-link').forEach(linkEl => {
                    linkEl.addEventListener('click', (evt) => {
                        evt.stopPropagation();
                    });
                });

                // Click anywhere on the card to enter edit mode
                // (except buttons, tags, links, and collapse which have stopPropagation)
                card.addEventListener('click', (evt) => {
                    // Don't trigger edit if clicking on interactive elements
                    if (evt.target.closest('.task-action-btn') || 
                        evt.target.closest('.task-control-btn') || 
                        evt.target.closest('.task-tag') || 
                        evt.target.closest('.task-link') || 
                        evt.target.closest('.task-collapse-btn')) {
                        return;
                    }
                    this.enterInlineEdit(taskId);
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

        const isCollapsed = this.collapsedTasks.has(task.id);
        const collapseIcon = isCollapsed ? '▸' : '▾';

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

        // Collapsed summary: show truncated content when collapsed
        const collapsedSummary = isCollapsed 
            ? `<span class="collapsed-summary">${this.escapeHTML(task.content)}</span>` 
            : '';

        return `
            <div class="task-card ${isCollapsed ? 'collapsed' : ''}" data-task-id="${task.id}" draggable="true">
                <div class="task-header">
                    <div class="task-header-left">
                        <button class="task-collapse-btn" title="Collapse/Expand">${collapseIcon}</button>
                        <span class="task-status-badge ${statusClasses[task.status]}">${statusLabel}</span>
                        ${collapsedSummary}
                    </div>
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
