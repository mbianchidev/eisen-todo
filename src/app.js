// === EISEN TODO APPLICATION - UNIQUE IMPLEMENTATION ===

class EisenMatrixController {
    constructor() {
        this.storageKey = 'eisen_matrix_data_v1';
        this.themePreference = 'light'; // 'light', 'dark', or 'system'
        this.currentTheme = 'light';
        this.systemDarkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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
        this.backlogKey = 'eisen_backlog_v1';
        this.backlogSortOrder = 'fifo'; // 'fifo' or 'lifo'
        this.tourKey = 'eisen_tour_seen_v1';
        this.inlineEditingBacklogId = null; // currently inline-editing backlog task
        this.backlogSearchQuery = '';
        this.backlogActiveFilters = new Set();
        this.archiveSearchQuery = '';
        this.archiveActiveFilters = new Set();
        this.collapsedQuadrantsKey = 'eisen_collapsed_quadrants_v1';
        this.collapsedQuadrants = new Set(); // ids of collapsed quadrants
        
        this.initializeApplication();
    }

    initializeApplication() {
        this.bindUIElements();
        this.loadCollapsedState();
        this.loadCollapsedQuadrantsState();
        this.attachEventHandlers();
        this.loadApplicationTheme();
        this.loadDrafts();
        this.applyURLParams();
        this.renderApplicationState();
        this.showTourIfFirstVisit();
    }

    bindUIElements() {
        this.elements = {
            themeBtn: document.getElementById('themeToggleBtn'),
            logoLink: document.getElementById('logoLink'),
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
            collapseAllIcon: document.getElementById('collapseAllIcon'),
            backlogView: document.getElementById('backlogView'),
            backlogBtn: document.getElementById('showBacklogBtn'),
            closeBacklogBtn: document.getElementById('closeBacklogBtn'),
            backlogList: document.getElementById('backlogList'),
            backlogAddInput: document.getElementById('backlogAddInput'),
            backlogFifoBtn: document.getElementById('backlogFifoBtn'),
            backlogLifoBtn: document.getElementById('backlogLifoBtn'),
            tourOverlay: document.getElementById('tourOverlay'),
            tourDismissBtn: document.getElementById('tourDismissBtn'),
            // Profile / Settings
            profileBtn: document.getElementById('showProfileBtn'),
            profileView: document.getElementById('profileView'),
            closeProfileBtn: document.getElementById('closeProfileBtn'),
            exportDataBtn: document.getElementById('exportDataBtn'),
            importDataBtn: document.getElementById('importDataBtn'),
            importFileInput: document.getElementById('importFileInput'),
            deleteAllDataBtn: document.getElementById('deleteAllDataBtn'),
            deleteAllConfirmOverlay: document.getElementById('deleteAllConfirmOverlay'),
            confirmDeleteAllBtn: document.getElementById('confirmDeleteAllBtn'),
            cancelDeleteAllBtn: document.getElementById('cancelDeleteAllBtn'),
            loadDemoDataBtn: document.getElementById('loadDemoDataBtn'),
            demoDataConfirmOverlay: document.getElementById('demoDataConfirmOverlay'),
            confirmDemoDataBtn: document.getElementById('confirmDemoDataBtn'),
            cancelDemoDataBtn: document.getElementById('cancelDemoDataBtn'),
            // Task counters
            mainTaskCounter: document.getElementById('mainTaskCounter'),
            // Backlog search/filter
            backlogSearchInput: document.getElementById('backlogSearchInput'),
            backlogTagFilterContainer: document.getElementById('backlogTagFilterContainer'),
            backlogTaskCounter: document.getElementById('backlogTaskCounter'),
            // Archive search/filter
            archiveSearchInput: document.getElementById('archiveSearchInput'),
            archiveTagFilterContainer: document.getElementById('archiveTagFilterContainer'),
            archiveTaskCounter: document.getElementById('archiveTaskCounter'),
            appFooter: document.getElementById('appFooter')
        };
    }

    attachEventHandlers() {
        this.elements.themeBtn.addEventListener('click', () => this.toggleApplicationTheme());

        // Theme selector in settings
        document.getElementById('themeSelector').addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-option');
            if (btn && btn.dataset.theme) {
                this.setThemePreference(btn.dataset.theme);
            }
        });
        this.elements.logoLink.addEventListener('click', (evt) => {
            evt.preventDefault();
            this.navigateHome();
        });
        this.elements.archiveBtn.addEventListener('click', () => this.displayArchiveView());
        this.elements.closeArchiveBtn.addEventListener('click', () => this.hideArchiveView());
        this.elements.backlogBtn.addEventListener('click', () => this.displayBacklogView());
        this.elements.closeBacklogBtn.addEventListener('click', () => this.hideBacklogView());
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
            this.updateURLParams();
        });

        // Collapse/Expand all
        this.elements.collapseAllBtn.addEventListener('click', () => this.toggleCollapseAll());

        // Quadrant collapse buttons
        document.querySelectorAll('.quadrant-collapse-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleQuadrantCollapse(btn.dataset.collapseQuadrant);
            });
        });

        // Tour dismiss
        this.elements.tourDismissBtn.addEventListener('click', () => this.dismissTour());
        this.elements.tourOverlay.addEventListener('click', (evt) => {
            if (evt.target === this.elements.tourOverlay) this.dismissTour();
        });

        // Profile / Settings
        this.elements.profileBtn.addEventListener('click', () => this.displayProfileView());
        this.elements.closeProfileBtn.addEventListener('click', () => this.hideProfileView());
        this.elements.exportDataBtn.addEventListener('click', () => this.exportAllData());
        this.elements.importDataBtn.addEventListener('click', () => this.elements.importFileInput.click());
        this.elements.importFileInput.addEventListener('change', (evt) => this.importData(evt));
        this.elements.deleteAllDataBtn.addEventListener('click', () => this.promptDeleteAll());
        this.elements.confirmDeleteAllBtn.addEventListener('click', () => this.executeDeleteAll());
        this.elements.cancelDeleteAllBtn.addEventListener('click', () => this.cancelDeleteAll());
        this.elements.deleteAllConfirmOverlay.addEventListener('click', (evt) => {
            if (evt.target === this.elements.deleteAllConfirmOverlay) this.cancelDeleteAll();
        });
        this.elements.loadDemoDataBtn.addEventListener('click', () => this.promptDemoData());
        this.elements.confirmDemoDataBtn.addEventListener('click', () => this.executeDemoDataLoad());
        this.elements.cancelDemoDataBtn.addEventListener('click', () => this.cancelDemoData());
        this.elements.demoDataConfirmOverlay.addEventListener('click', (evt) => {
            if (evt.target === this.elements.demoDataConfirmOverlay) this.cancelDemoData();
        });

        // Backlog search
        this.elements.backlogSearchInput.addEventListener('input', () => {
            this.backlogSearchQuery = this.elements.backlogSearchInput.value.trim().toLowerCase();
            this.renderBacklogList();
            this.updateURLParams();
        });

        // Archive search
        this.elements.archiveSearchInput.addEventListener('input', () => {
            this.archiveSearchQuery = this.elements.archiveSearchInput.value.trim().toLowerCase();
            this.populateArchiveDisplay();
            this.updateURLParams();
        });

        // Browser back/forward navigation
        window.addEventListener('popstate', () => this.applyURLParams(true));

        // Backlog sort buttons
        this.elements.backlogFifoBtn.addEventListener('click', () => this.setBacklogSort('fifo'));
        this.elements.backlogLifoBtn.addEventListener('click', () => this.setBacklogSort('lifo'));

        // Backlog add input
        this.elements.backlogAddInput.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') {
                evt.preventDefault();
                this.handleBacklogAdd();
            }
        });

        // Backlog bucket drop zones
        document.querySelectorAll('.backlog-bucket').forEach(bucket => {
            bucket.addEventListener('dragover', (evt) => {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'move';
                bucket.classList.add('drag-over');
            });
            bucket.addEventListener('dragleave', (evt) => {
                if (!bucket.contains(evt.relatedTarget)) {
                    bucket.classList.remove('drag-over');
                }
            });
            bucket.addEventListener('drop', (evt) => {
                evt.preventDefault();
                bucket.classList.remove('drag-over');
                const taskId = evt.dataTransfer.getData('text/plain');
                const targetQuadrant = bucket.dataset.bucket;
                if (taskId && targetQuadrant) {
                    this.moveBacklogTaskToQuadrant(taskId, targetQuadrant);
                }
            });
        });

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
            if (this.inlineEditingBacklogId) {
                const editingEl = document.querySelector(`.backlog-task[data-backlog-id="${this.inlineEditingBacklogId}"]`);
                if (editingEl && !editingEl.contains(evt.target)) {
                    this.saveBacklogInlineEdit(this.inlineEditingBacklogId);
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

    // --- Quadrant collapse ---

    loadCollapsedQuadrantsState() {
        const raw = localStorage.getItem(this.collapsedQuadrantsKey);
        if (raw) {
            try {
                this.collapsedQuadrants = new Set(JSON.parse(raw));
            } catch (e) { /* ignore */ }
        }
        this.applyCollapsedQuadrants();
    }

    saveCollapsedQuadrantsState() {
        localStorage.setItem(this.collapsedQuadrantsKey, JSON.stringify([...this.collapsedQuadrants]));
    }

    toggleQuadrantCollapse(quadrantId) {
        if (this.collapsedQuadrants.has(quadrantId)) {
            this.collapsedQuadrants.delete(quadrantId);
        } else {
            this.collapsedQuadrants.add(quadrantId);
        }
        this.saveCollapsedQuadrantsState();
        this.applyCollapsedQuadrants();
    }

    applyCollapsedQuadrants() {
        document.querySelectorAll('.quadrant[data-quadrant]').forEach(section => {
            const qId = section.dataset.quadrant;
            const isCollapsed = this.collapsedQuadrants.has(qId);
            section.classList.toggle('quadrant-collapsed', isCollapsed);
            const btn = section.querySelector('.quadrant-collapse-btn');
            if (btn) btn.textContent = isCollapsed ? '▸' : '▾';
        });
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
        this.pendingDeleteSource = 'main';
        this.elements.confirmArchiveBtn.style.display = '';
        this.elements.deleteConfirmOverlay.classList.remove('hidden');
    }

    executeDelete() {
        const taskId = this.pendingDeleteTaskId;
        if (!taskId) return;

        if (this.pendingDeleteSource === 'backlog') {
            this.deleteBacklogTask(taskId);
            this.cancelDelete();
            return;
        }

        if (this.pendingDeleteSource === 'archive') {
            const dataStore = this.retrieveStoredData();
            dataStore.completedTasks = dataStore.completedTasks.filter(t => t.id !== taskId);
            this.persistDataToStorage(dataStore);
            this.cancelDelete();
            this.populateArchiveDisplay();
            return;
        }

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
        this.pendingDeleteSource = null;
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
        this.updateURLParams();
    }

    clearTagFilters() {
        this.activeFilters.clear();
        this.renderApplicationState();
        this.updateURLParams();
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
        const saved = localStorage.getItem('eisen_theme') || 'light';
        this.themePreference = saved;
        this.applyThemePreference();

        // Listen for OS theme changes when in system mode
        this.systemDarkMediaQuery.addEventListener('change', () => {
            if (this.themePreference === 'system') {
                this.applyThemePreference();
            }
        });
    }

    applyThemePreference() {
        let effective;
        if (this.themePreference === 'system') {
            effective = this.systemDarkMediaQuery.matches ? 'dark' : 'light';
        } else {
            effective = this.themePreference;
        }

        if (effective === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        this.currentTheme = effective;
        this.updateThemeToggleIcon();
        this.updateThemeSelectorUI();
    }

    setThemePreference(pref) {
        this.themePreference = pref;
        localStorage.setItem('eisen_theme', pref);
        this.applyThemePreference();
    }

    toggleApplicationTheme() {
        const cycle = ['light', 'dark', 'system'];
        const idx = cycle.indexOf(this.themePreference);
        const next = cycle[(idx + 1) % cycle.length];
        this.setThemePreference(next);
    }

    updateThemeToggleIcon() {
        const iconEl = this.elements.themeBtn.querySelector('.icon-theme');
        if (!iconEl) return;
        const icons = { light: '☀', dark: '☾', system: '◐' };
        iconEl.textContent = icons[this.themePreference] || '◐';
    }

    updateThemeSelectorUI() {
        const selector = document.getElementById('themeSelector');
        if (!selector) return;
        selector.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.themePreference);
        });
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
        this.elements.backlogView.classList.add('hidden');
        this.elements.profileView.classList.add('hidden');
        this.elements.archiveView.classList.remove('hidden');
        this.elements.appFooter.classList.add('hidden');
        document.getElementById('filterStrip').classList.add('hidden');
        this.populateArchiveDisplay();
        this.updateURLParams();
    }

    hideArchiveView() {
        this.elements.archiveView.classList.add('hidden');
        this.elements.mainMatrix.classList.remove('hidden');
        this.elements.appFooter.classList.remove('hidden');
        document.getElementById('filterStrip').classList.remove('hidden');
        this.updateURLParams();
    }

    // --- Navigation ---

    navigateHome() {
        this.elements.archiveView.classList.add('hidden');
        this.elements.backlogView.classList.add('hidden');
        this.elements.profileView.classList.add('hidden');
        this.elements.mainMatrix.classList.remove('hidden');
        this.elements.appFooter.classList.remove('hidden');
        document.getElementById('filterStrip').classList.remove('hidden');
        this.renderApplicationState();
        this.updateURLParams();
    }

    // --- Onboarding Tour ---

    showTourIfFirstVisit() {
        if (!localStorage.getItem(this.tourKey)) {
            this.elements.tourOverlay.classList.remove('hidden');
        }
    }

    dismissTour() {
        this.elements.tourOverlay.classList.add('hidden');
        localStorage.setItem(this.tourKey, '1');
    }

    // --- Profile / Settings ---

    displayProfileView() {
        this.elements.mainMatrix.classList.add('hidden');
        this.elements.archiveView.classList.add('hidden');
        this.elements.backlogView.classList.add('hidden');
        this.elements.profileView.classList.remove('hidden');
        this.elements.appFooter.classList.add('hidden');
        document.getElementById('filterStrip').classList.add('hidden');
        this.updateThemeSelectorUI();
        this.updateURLParams();
    }

    hideProfileView() {
        this.elements.profileView.classList.add('hidden');
        this.elements.mainMatrix.classList.remove('hidden');
        this.elements.appFooter.classList.remove('hidden');
        document.getElementById('filterStrip').classList.remove('hidden');
        this.renderApplicationState();
        this.updateURLParams();
    }

    exportAllData() {
        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: this.retrieveStoredData(),
            backlog: this.retrieveBacklogData(),
            theme: localStorage.getItem('eisen_theme') || 'light',
            collapsed: [...this.collapsedTasks],
            collapsedQuadrants: [...this.collapsedQuadrants],
            drafts: localStorage.getItem(this.draftsKey) || '{}'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eisentodo-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(evt) {
        const file = evt.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks) {
                    this.persistDataToStorage(data.tasks);
                }
                if (data.backlog) {
                    this.persistBacklogData(data.backlog);
                }
                if (data.theme) {
                    this.setThemePreference(data.theme);
                }
                if (data.collapsed) {
                    this.collapsedTasks = new Set(data.collapsed);
                    this.saveCollapsedState();
                }
                if (data.collapsedQuadrants) {
                    this.collapsedQuadrants = new Set(data.collapsedQuadrants);
                    this.saveCollapsedQuadrantsState();
                    this.applyCollapsedQuadrants();
                }
                if (data.drafts) {
                    localStorage.setItem(this.draftsKey, data.drafts);
                }

                alert('Data imported successfully!');
                this.renderApplicationState();
            } catch (err) {
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be imported again
        evt.target.value = '';
    }

    promptDeleteAll() {
        this.elements.deleteAllConfirmOverlay.classList.remove('hidden');
    }

    executeDeleteAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.backlogKey);
        localStorage.removeItem(this.collapsedKey);
        localStorage.removeItem(this.collapsedQuadrantsKey);
        localStorage.removeItem(this.draftsKey);
        localStorage.removeItem(this.tourKey);
        localStorage.removeItem('eisen_theme');

        // Reset in-memory state
        this.collapsedTasks.clear();
        this.collapsedQuadrants.clear();
        this.activeFilters.clear();
        this.searchQuery = '';
        this.backlogSearchQuery = '';
        this.backlogActiveFilters.clear();
        this.archiveSearchQuery = '';
        this.archiveActiveFilters.clear();
        document.documentElement.removeAttribute('data-theme');
        this.currentTheme = 'light';

        this.cancelDeleteAll();
        this.hideProfileView();
        this.applyCollapsedQuadrants();
        this.renderApplicationState();
    }

    cancelDeleteAll() {
        this.elements.deleteAllConfirmOverlay.classList.add('hidden');
    }

    // --- Demo Data ---

    promptDemoData() {
        this.elements.demoDataConfirmOverlay.classList.remove('hidden');
    }

    cancelDemoData() {
        this.elements.demoDataConfirmOverlay.classList.add('hidden');
    }

    executeDemoDataLoad() {
        const now = new Date();
        const demoTasks = {
            activeTasks: [
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Fix critical production bug in payment service',
                    quadrant: 'urgent-important',
                    labels: ['work', 'bug'],
                    urls: [],
                    status: 'in-progress',
                    createdAt: new Date(now - 86400000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Prepare slides for tomorrow\'s board meeting',
                    quadrant: 'urgent-important',
                    labels: ['work', 'meeting'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 43200000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Plan Q3 product roadmap',
                    quadrant: 'not-urgent-important',
                    labels: ['work', 'planning'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 172800000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Read "Deep Work" by Cal Newport',
                    quadrant: 'not-urgent-important',
                    labels: ['personal', 'learning'],
                    urls: [],
                    status: 'in-progress',
                    createdAt: new Date(now - 604800000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Start daily 20-minute exercise routine',
                    quadrant: 'not-urgent-important',
                    labels: ['personal', 'health'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 259200000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Reply to vendor emails about license renewal',
                    quadrant: 'urgent-not-important',
                    labels: ['work', 'admin'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 86400000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Schedule dentist appointment',
                    quadrant: 'urgent-not-important',
                    labels: ['personal', 'health'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 43200000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Clean up browser bookmarks',
                    quadrant: 'not-urgent-not-important',
                    labels: ['personal'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 432000000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Reorganize desktop icons',
                    quadrant: 'not-urgent-not-important',
                    labels: ['personal'],
                    urls: [],
                    status: 'todo',
                    createdAt: new Date(now - 345600000).toISOString()
                }
            ],
            completedTasks: [
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Set up project repository',
                    quadrant: 'urgent-important',
                    labels: ['work'],
                    urls: [],
                    status: 'done',
                    createdAt: new Date(now - 604800000).toISOString(),
                    completedAt: new Date(now - 518400000).toISOString()
                },
                {
                    id: this.generateUniqueIdentifier(),
                    content: 'Complete onboarding paperwork',
                    quadrant: 'urgent-not-important',
                    labels: ['work', 'admin'],
                    urls: [],
                    status: 'done',
                    createdAt: new Date(now - 864000000).toISOString(),
                    completedAt: new Date(now - 777600000).toISOString()
                }
            ]
        };

        const demoBacklog = [
            {
                id: this.generateUniqueIdentifier(),
                content: 'Research new project management tools',
                labels: ['work', 'learning'],
                urls: [],
                createdAt: new Date(now - 172800000).toISOString()
            },
            {
                id: this.generateUniqueIdentifier(),
                content: 'Write blog post about productivity tips',
                labels: ['personal', 'writing'],
                urls: [],
                createdAt: new Date(now - 259200000).toISOString()
            }
        ];

        this.persistDataToStorage(demoTasks);
        this.persistBacklogData(demoBacklog);

        // Reset in-memory filter/search state
        this.collapsedTasks.clear();
        this.saveCollapsedState();
        this.collapsedQuadrants.clear();
        this.saveCollapsedQuadrantsState();
        this.applyCollapsedQuadrants();
        this.activeFilters.clear();
        this.searchQuery = '';
        this.backlogSearchQuery = '';
        this.backlogActiveFilters.clear();
        this.archiveSearchQuery = '';
        this.archiveActiveFilters.clear();

        this.cancelDemoData();
        this.hideProfileView();
        this.renderApplicationState();
    }

    // --- Backlog ---

    retrieveBacklogData() {
        const raw = localStorage.getItem(this.backlogKey);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch { return []; }
    }

    persistBacklogData(tasks) {
        localStorage.setItem(this.backlogKey, JSON.stringify(tasks));
    }

    displayBacklogView() {
        this.elements.mainMatrix.classList.add('hidden');
        this.elements.archiveView.classList.add('hidden');
        this.elements.profileView.classList.add('hidden');
        this.elements.backlogView.classList.remove('hidden');
        this.elements.appFooter.classList.add('hidden');
        document.getElementById('filterStrip').classList.add('hidden');
        this.renderBacklogList();
        this.updateURLParams();
    }

    hideBacklogView() {
        this.elements.backlogView.classList.add('hidden');
        this.elements.mainMatrix.classList.remove('hidden');
        this.elements.appFooter.classList.remove('hidden');
        document.getElementById('filterStrip').classList.remove('hidden');
        this.renderApplicationState();
        this.updateURLParams();
    }

    setBacklogSort(order) {
        this.backlogSortOrder = order;
        this.elements.backlogFifoBtn.classList.toggle('active', order === 'fifo');
        this.elements.backlogLifoBtn.classList.toggle('active', order === 'lifo');
        this.renderBacklogList();
    }

    handleBacklogAdd() {
        const raw = this.elements.backlogAddInput.value.trim();
        if (!raw) return;

        const { content, labels, urls } = this.parseQuickInput(raw);
        if (!content) return;

        const backlog = this.retrieveBacklogData();
        backlog.push({
            id: this.generateUniqueIdentifier(),
            content,
            labels,
            urls,
            createdAt: new Date().toISOString()
        });
        this.persistBacklogData(backlog);
        this.elements.backlogAddInput.value = '';
        this.renderBacklogList();
    }

    moveBacklogTaskToQuadrant(taskId, quadrant) {
        const backlog = this.retrieveBacklogData();
        const taskIndex = backlog.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const task = backlog[taskIndex];
        backlog.splice(taskIndex, 1);
        this.persistBacklogData(backlog);

        // Add to main task store
        const dataStore = this.retrieveStoredData();
        dataStore.activeTasks.push({
            id: task.id,
            content: task.content,
            quadrant,
            labels: task.labels,
            urls: task.urls,
            status: 'todo',
            createdAt: task.createdAt
        });
        this.persistDataToStorage(dataStore);
        this.renderBacklogList();
    }

    deleteBacklogTask(taskId) {
        const backlog = this.retrieveBacklogData();
        this.persistBacklogData(backlog.filter(t => t.id !== taskId));
        this.collapsedTasks.delete(taskId);
        this.saveCollapsedState();
        this.renderBacklogList();
    }

    toggleBacklogCollapse(taskId) {
        if (this.collapsedTasks.has(taskId)) {
            this.collapsedTasks.delete(taskId);
        } else {
            this.collapsedTasks.add(taskId);
        }
        this.saveCollapsedState();
        const card = document.querySelector(`.backlog-task-card[data-backlog-id="${taskId}"]`);
        if (card) {
            card.classList.toggle('collapsed', this.collapsedTasks.has(taskId));
            const btn = card.querySelector('.task-collapse-btn');
            if (btn) btn.textContent = this.collapsedTasks.has(taskId) ? '▸' : '▾';
        }
    }

    enterBacklogInlineEdit(taskId) {
        if (this.inlineEditingBacklogId) {
            this.saveBacklogInlineEdit(this.inlineEditingBacklogId);
        }
        this.inlineEditingBacklogId = taskId;
        const backlog = this.retrieveBacklogData();
        const task = backlog.find(t => t.id === taskId);
        if (!task) return;

        const card = document.querySelector(`.backlog-task-card[data-backlog-id="${taskId}"]`);
        if (!card) return;

        // Uncollapse if collapsed
        if (this.collapsedTasks.has(taskId)) {
            this.toggleBacklogCollapse(taskId);
        }

        // Build raw text with tags & urls
        let raw = task.content;
        if (task.labels && task.labels.length) raw += ' ' + task.labels.map(l => '#' + l).join(' ');
        if (task.urls && task.urls.length) raw += ' ' + task.urls.join(' ');

        const textEl = card.querySelector('.backlog-card-text');
        if (!textEl) return;
        textEl.setAttribute('contenteditable', 'true');
        textEl.classList.add('editing');
        textEl.textContent = raw;
        textEl.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        textEl.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') {
                evt.preventDefault();
                this.saveBacklogInlineEdit(taskId);
            }
            if (evt.key === 'Escape') {
                evt.preventDefault();
                this.inlineEditingBacklogId = null;
                this.renderBacklogList();
            }
        });
    }

    saveBacklogInlineEdit(taskId) {
        if (this.inlineEditingBacklogId !== taskId) return;
        this.inlineEditingBacklogId = null;

        const card = document.querySelector(`.backlog-task-card[data-backlog-id="${taskId}"]`);
        if (!card) return;
        const textEl = card.querySelector('.backlog-card-text');
        if (!textEl) return;

        const rawText = textEl.textContent.trim();
        if (!rawText) return;

        const { content, labels, urls } = this.parseQuickInput(rawText);
        const backlog = this.retrieveBacklogData();
        const task = backlog.find(t => t.id === taskId);
        if (task) {
            task.content = content;
            task.labels = labels;
            task.urls = urls;
            this.persistBacklogData(backlog);
        }
        this.renderBacklogList();
    }

    promptDeleteBacklog(taskId) {
        this.pendingDeleteTaskId = taskId;
        this.pendingDeleteSource = 'backlog';
        // Hide archive option for backlog tasks (not applicable)
        this.elements.confirmArchiveBtn.style.display = 'none';
        this.elements.deleteConfirmOverlay.classList.remove('hidden');
    }

    renderBacklogList() {
        const backlog = this.retrieveBacklogData();

        // Build tag filter
        this.updateBacklogTagFilterDisplay(backlog);

        // Sort according to current order
        const sorted = [...backlog];
        if (this.backlogSortOrder === 'lifo') {
            sorted.reverse();
        }

        // Apply search and filter
        const filtered = sorted.filter(task => {
            let matchesFilter;
            if (this.backlogActiveFilters.has('__no_tags__')) {
                matchesFilter = !task.labels || task.labels.length === 0;
            } else {
                matchesFilter = this.backlogActiveFilters.size === 0 || 
                    (task.labels && task.labels.some(l => this.backlogActiveFilters.has(l)));
            }
            const matchesSearch = !this.backlogSearchQuery || 
                task.content.toLowerCase().includes(this.backlogSearchQuery) ||
                (task.labels && task.labels.some(l => l.toLowerCase().includes(this.backlogSearchQuery)));
            return matchesFilter && matchesSearch;
        });

        // Update counter
        const total = backlog.length;
        const showing = filtered.length;
        const isFiltering = this.backlogActiveFilters.size > 0 || this.backlogSearchQuery;
        this.elements.backlogTaskCounter.textContent = isFiltering
            ? `${showing} of ${total} tasks`
            : `${total} task${total !== 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            this.elements.backlogList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 2rem; font-family: Space Mono, monospace;">${total === 0 ? 'No backlog tasks. Add one above!' : 'No matching tasks.'}</p>`;
            return;
        }

        this.elements.backlogList.innerHTML = filtered.map(task => {
            const isCollapsed = this.collapsedTasks.has(task.id);
            const collapseIcon = isCollapsed ? '▸' : '▾';
            const collapsedClass = isCollapsed ? ' collapsed' : '';

            const tagsHTML = task.labels && task.labels.length > 0
                ? `<div class="task-tags">${task.labels.map(l => `<span class="task-tag">${this.escapeHTML(l)}</span>`).join('')}</div>`
                : '';

            const linksHTML = task.urls && task.urls.length > 0
                ? `<div class="task-links">${task.urls.map(u => `<a href="${this.escapeHTML(u)}" target="_blank" rel="noopener" class="task-link-pill">${this.escapeHTML(new URL(u).hostname)}</a>`).join('')}</div>`
                : '';

            const date = new Date(task.createdAt).toLocaleDateString();
            const collapsedSummary = `<span class="collapsed-summary">${this.escapeHTML(task.content)}</span>`;

            return `
                <div class="backlog-task-card task-card${collapsedClass}" data-backlog-id="${task.id}" draggable="true">
                    <div class="task-header">
                        <div class="task-header-left">
                            <button class="task-collapse-btn" title="Collapse/Expand">${collapseIcon}</button>
                            <span class="backlog-task-date">${date}</span>
                            ${collapsedSummary}
                        </div>
                        <div class="task-actions">
                            <button class="task-action-btn btn-delete" title="Delete">✕</button>
                        </div>
                    </div>
                    <div class="backlog-card-text task-text">${this.escapeHTML(task.content)}</div>
                    ${tagsHTML}
                    ${linksHTML}
                </div>
            `;
        }).join('');

        // Wire up events
        this.elements.backlogList.querySelectorAll('.backlog-task-card').forEach(el => {
            const taskId = el.dataset.backlogId;

            // Drag
            el.addEventListener('dragstart', (evt) => {
                evt.dataTransfer.setData('text/plain', taskId);
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                document.querySelectorAll('.backlog-bucket').forEach(b => b.classList.remove('drag-over'));
            });

            // Collapse
            el.querySelector('.task-collapse-btn')?.addEventListener('click', (evt) => {
                evt.stopPropagation();
                this.toggleBacklogCollapse(taskId);
            });

            // Click to edit
            const textEl = el.querySelector('.backlog-card-text');
            textEl?.addEventListener('click', (evt) => {
                evt.stopPropagation();
                this.enterBacklogInlineEdit(taskId);
            });

            // Delete
            el.querySelector('.btn-delete')?.addEventListener('click', (evt) => {
                evt.stopPropagation();
                this.promptDeleteBacklog(taskId);
            });
        });
    }

    updateBacklogTagFilterDisplay(backlog) {
        const allLabels = new Set();
        backlog.forEach(task => {
            if (task.labels) task.labels.forEach(label => allLabels.add(label));
        });

        const isAllActive = this.backlogActiveFilters.size === 0;
        const isNoTagsActive = this.backlogActiveFilters.has('__no_tags__');
        const filterHTML = [`<button class="tag-filter ${isAllActive ? 'active' : ''}" data-filter="all">ALL</button>`];
        filterHTML.push(`<button class="tag-filter ${isNoTagsActive ? 'active' : ''}" data-filter="__no_tags__">NO TAGS</button>`);
        
        Array.from(allLabels).sort().forEach(label => {
            const isActive = this.backlogActiveFilters.has(label);
            filterHTML.push(`<button class="tag-filter ${isActive ? 'active' : ''}" data-filter="${this.escapeHTML(label)}">${this.escapeHTML(label)}</button>`);
        });

        this.elements.backlogTagFilterContainer.innerHTML = filterHTML.join('');

        this.elements.backlogTagFilterContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterValue = btn.dataset.filter;
                if (filterValue === 'all') {
                    this.backlogActiveFilters.clear();
                } else if (filterValue === '__no_tags__') {
                    if (this.backlogActiveFilters.has('__no_tags__')) {
                        this.backlogActiveFilters.delete('__no_tags__');
                    } else {
                        this.backlogActiveFilters.clear();
                        this.backlogActiveFilters.add('__no_tags__');
                    }
                } else {
                    this.backlogActiveFilters.delete('__no_tags__');
                    if (this.backlogActiveFilters.has(filterValue)) {
                        this.backlogActiveFilters.delete(filterValue);
                    } else {
                        this.backlogActiveFilters.add(filterValue);
                    }
                }
                this.renderBacklogList();
                this.updateURLParams();
            });
        });
    }    updateTagFilterDisplay() {
        const dataStore = this.retrieveStoredData();
        const allLabels = new Set();
        
        dataStore.activeTasks.forEach(task => {
            task.labels.forEach(label => allLabels.add(label));
        });

        const isAllActive = this.activeFilters.size === 0;
        const isNoTagsActive = this.activeFilters.has('__no_tags__');
        const filterHTML = [`<button class="tag-filter ${isAllActive ? 'active' : ''}" data-filter="all">ALL</button>`];
        filterHTML.push(`<button class="tag-filter ${isNoTagsActive ? 'active' : ''}" data-filter="__no_tags__">NO TAGS</button>`);
        
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
                } else if (filterValue === '__no_tags__') {
                    // Toggle no-tags filter (exclusive — clears other tag filters)
                    if (this.activeFilters.has('__no_tags__')) {
                        this.activeFilters.delete('__no_tags__');
                    } else {
                        this.activeFilters.clear();
                        this.activeFilters.add('__no_tags__');
                    }
                    this.renderApplicationState();
                    this.updateURLParams();
                } else {
                    // Clear no-tags if selecting a specific tag
                    this.activeFilters.delete('__no_tags__');
                    this.toggleTagFilter(filterValue);
                }
            });
        });
    }

    // --- URL params (bookmarkable state) ---

    getCurrentView() {
        if (!this.elements.archiveView.classList.contains('hidden')) return 'archive';
        if (!this.elements.backlogView.classList.contains('hidden')) return 'backlog';
        if (!this.elements.profileView.classList.contains('hidden')) return 'settings';
        return 'matrix';
    }

    updateURLParams() {
        const params = new URLSearchParams();
        const view = this.getCurrentView();
        if (view !== 'matrix') params.set('view', view);

        if (view === 'matrix') {
            if (this.searchQuery) params.set('search', this.searchQuery);
            if (this.activeFilters.size > 0) params.set('tags', Array.from(this.activeFilters).join(','));
        } else if (view === 'backlog') {
            if (this.backlogSearchQuery) params.set('search', this.backlogSearchQuery);
            if (this.backlogActiveFilters.size > 0) params.set('tags', Array.from(this.backlogActiveFilters).join(','));
        } else if (view === 'archive') {
            if (this.archiveSearchQuery) params.set('search', this.archiveSearchQuery);
            if (this.archiveActiveFilters.size > 0) params.set('tags', Array.from(this.archiveActiveFilters).join(','));
        }

        const qs = params.toString();
        const newURL = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        if (newURL !== `${window.location.pathname}${window.location.search}`) {
            history.pushState(null, '', newURL);
        }
    }

    applyURLParams(isPopstate) {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'matrix';
        const search = params.get('search') || '';
        const tags = params.get('tags');
        const tagSet = tags ? new Set(tags.split(',')) : new Set();

        // Reset all view-specific search/filter state
        this.searchQuery = '';
        this.activeFilters.clear();
        this.backlogSearchQuery = '';
        this.backlogActiveFilters.clear();
        this.archiveSearchQuery = '';
        this.archiveActiveFilters.clear();

        // Show the correct view
        this.elements.mainMatrix.classList.add('hidden');
        this.elements.archiveView.classList.add('hidden');
        this.elements.backlogView.classList.add('hidden');
        this.elements.profileView.classList.add('hidden');

        if (view === 'archive') {
            this.elements.archiveView.classList.remove('hidden');
            document.getElementById('filterStrip').classList.add('hidden');
            this.archiveSearchQuery = search;
            this.archiveActiveFilters = tagSet;
            this.elements.archiveSearchInput.value = search;
            this.populateArchiveDisplay();
        } else if (view === 'backlog') {
            this.elements.backlogView.classList.remove('hidden');
            document.getElementById('filterStrip').classList.add('hidden');
            this.backlogSearchQuery = search;
            this.backlogActiveFilters = tagSet;
            this.elements.backlogSearchInput.value = search;
            this.renderBacklogList();
        } else if (view === 'settings') {
            this.elements.profileView.classList.remove('hidden');
            document.getElementById('filterStrip').classList.add('hidden');
            this.updateThemeSelectorUI();
        } else {
            this.elements.mainMatrix.classList.remove('hidden');
            document.getElementById('filterStrip').classList.remove('hidden');
            this.searchQuery = search;
            this.activeFilters = tagSet;
            this.elements.searchInput.value = search;
        }

        if (isPopstate) {
            this.renderApplicationState();
        }
    }

    renderApplicationState() {
        this.updateTagFilterDisplay();
        this.renderMatrixTasks();
    }

    renderMatrixTasks() {
        const dataStore = this.retrieveStoredData();
        const quadrants = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];

        let totalActive = dataStore.activeTasks.length;
        let totalVisible = 0;

        quadrants.forEach(quadrantId => {
            const zone = document.querySelector(`.task-zone[data-zone="${quadrantId}"]`);
            if (!zone) return;

            const allQuadrantTasks = dataStore.activeTasks.filter(t => t.quadrant === quadrantId);
            const quadrantTasks = allQuadrantTasks.filter(task => {
                let matchesFilter;
                if (this.activeFilters.has('__no_tags__')) {
                    matchesFilter = task.labels.length === 0;
                } else {
                    matchesFilter = this.activeFilters.size === 0 || task.labels.some(l => this.activeFilters.has(l));
                }
                const matchesSearch = !this.searchQuery || 
                    task.content.toLowerCase().includes(this.searchQuery) ||
                    task.labels.some(l => l.toLowerCase().includes(this.searchQuery));
                return matchesFilter && matchesSearch;
            });

            totalVisible += quadrantTasks.length;

            // Update quadrant count badge
            const countEl = document.querySelector(`.quadrant-count[data-count-quadrant="${quadrantId}"]`);
            if (countEl) {
                const isFiltering = this.activeFilters.size > 0 || this.searchQuery;
                countEl.textContent = isFiltering
                    ? `${quadrantTasks.length}/${allQuadrantTasks.length}`
                    : allQuadrantTasks.length;
            }

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

        // Update main task counter
        const isFiltering = this.activeFilters.size > 0 || this.searchQuery;
        this.elements.mainTaskCounter.textContent = isFiltering
            ? `${totalVisible} of ${totalActive} tasks`
            : `${totalActive} task${totalActive !== 1 ? 's' : ''}`;
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

        // Collapsed summary: always rendered, visibility controlled via CSS
        const collapsedSummary = `<span class="collapsed-summary">${this.escapeHTML(task.content)}</span>`;

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
        
        // Build tag filter
        this.updateArchiveTagFilterDisplay(dataStore);
        
        // Filter tasks
        let filteredTasks = dataStore.completedTasks;
        
        if (this.archiveActiveFilters.has('__no_tags__')) {
            filteredTasks = filteredTasks.filter(t => t.labels.length === 0);
        } else if (this.archiveActiveFilters.size > 0) {
            filteredTasks = filteredTasks.filter(t => t.labels.some(l => this.archiveActiveFilters.has(l)));
        }
        if (this.archiveSearchQuery) {
            filteredTasks = filteredTasks.filter(t =>
                t.content.toLowerCase().includes(this.archiveSearchQuery) ||
                t.labels.some(l => l.toLowerCase().includes(this.archiveSearchQuery))
            );
        }

        // Update counter
        const total = dataStore.completedTasks.length;
        const showing = filteredTasks.length;
        this.elements.archiveTaskCounter.textContent = showing === total 
            ? `${total} task${total !== 1 ? 's' : ''}` 
            : `${showing} of ${total} tasks`;

        if (filteredTasks.length === 0) {
            this.elements.archiveList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">${total === 0 ? 'No completed tasks yet.' : 'No matching tasks.'}</p>`;
            return;
        }

        const sortedCompleted = [...filteredTasks].sort((a, b) => {
            return new Date(b.completedAt) - new Date(a.completedAt);
        });

        this.elements.archiveList.innerHTML = sortedCompleted.map(task => this.generateArchivedTaskHTML(task)).join('');

        this.elements.archiveList.querySelectorAll('.task-card').forEach(card => {
            const taskId = card.dataset.taskId;
            card.querySelector('.btn-restore')?.addEventListener('click', () => this.restoreCompletedTask(taskId));
            card.querySelector('.btn-delete')?.addEventListener('click', () => this.promptDeleteArchive(taskId));
        });
    }

    promptDeleteArchive(taskId) {
        this.pendingDeleteTaskId = taskId;
        this.pendingDeleteSource = 'archive';
        // In archive: only show yes/no (no "archive" option since we're already in archive)
        this.elements.confirmArchiveBtn.style.display = 'none';
        this.elements.deleteConfirmOverlay.classList.remove('hidden');
    }

    updateArchiveTagFilterDisplay(dataStore) {
        const allLabels = new Set();
        dataStore.completedTasks.forEach(task => {
            task.labels.forEach(label => allLabels.add(label));
        });

        const isAllActive = this.archiveActiveFilters.size === 0;
        const isNoTagsActive = this.archiveActiveFilters.has('__no_tags__');
        const filterHTML = [`<button class="tag-filter ${isAllActive ? 'active' : ''}" data-filter="all">ALL</button>`];
        filterHTML.push(`<button class="tag-filter ${isNoTagsActive ? 'active' : ''}" data-filter="__no_tags__">NO TAGS</button>`);
        
        Array.from(allLabels).sort().forEach(label => {
            const isActive = this.archiveActiveFilters.has(label);
            filterHTML.push(`<button class="tag-filter ${isActive ? 'active' : ''}" data-filter="${this.escapeHTML(label)}">${this.escapeHTML(label)}</button>`);
        });

        this.elements.archiveTagFilterContainer.innerHTML = filterHTML.join('');

        this.elements.archiveTagFilterContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterValue = btn.dataset.filter;
                if (filterValue === 'all') {
                    this.archiveActiveFilters.clear();
                } else if (filterValue === '__no_tags__') {
                    if (this.archiveActiveFilters.has('__no_tags__')) {
                        this.archiveActiveFilters.delete('__no_tags__');
                    } else {
                        this.archiveActiveFilters.clear();
                        this.archiveActiveFilters.add('__no_tags__');
                    }
                } else {
                    this.archiveActiveFilters.delete('__no_tags__');
                    if (this.archiveActiveFilters.has(filterValue)) {
                        this.archiveActiveFilters.delete(filterValue);
                    } else {
                        this.archiveActiveFilters.add(filterValue);
                    }
                }
                this.populateArchiveDisplay();
                this.updateURLParams();
            });        });
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
