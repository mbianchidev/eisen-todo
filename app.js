// Priority Matrix Application - Original Implementation
// Data persistence manager with custom encoding
const StorageVault = {
    encodeKey: (base) => `pm_${base}_v2`,
    
    persist(collection, items) {
        const encoded = JSON.stringify(items);
        localStorage.setItem(this.encodeKey(collection), encoded);
    },
    
    retrieve(collection) {
        const data = localStorage.getItem(this.encodeKey(collection));
        return data ? JSON.parse(data) : null;
    },
    
    wipe(collection) {
        localStorage.removeItem(this.encodeKey(collection));
    }
};

// Work item factory with unique ID generation
const WorkItemFactory = {
    generateUniqueId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 9);
        return `${timestamp}-${randomPart}`;
    },
    
    manufacture(specifications) {
        return {
            identifier: this.generateUniqueId(),
            content: specifications.content,
            categoryLabels: specifications.categoryLabels || [],
            urlReferences: specifications.urlReferences || [],
            priorityZone: specifications.priorityZone,
            workflowStage: 'pending',
            birthTimestamp: Date.now()
        };
    }
};

// Application state manager with observer pattern
class ApplicationState {
    constructor() {
        this.workRegistry = new Map();
        this.completedRegistry = new Map();
        this.observers = [];
        this.activeFilter = 'all';
        this.initializeFromStorage();
    }
    
    initializeFromStorage() {
        const savedWork = StorageVault.retrieve('active_work');
        const savedCompleted = StorageVault.retrieve('completed_work');
        
        if (savedWork) {
            savedWork.forEach(item => {
                this.workRegistry.set(item.identifier, item);
            });
        }
        
        if (savedCompleted) {
            savedCompleted.forEach(item => {
                this.completedRegistry.set(item.identifier, item);
            });
        }
    }
    
    saveToStorage() {
        StorageVault.persist('active_work', Array.from(this.workRegistry.values()));
        StorageVault.persist('completed_work', Array.from(this.completedRegistry.values()));
    }
    
    registerObserver(callback) {
        this.observers.push(callback);
    }
    
    notifyObservers() {
        this.observers.forEach(callback => callback());
    }
    
    insertWorkItem(item) {
        this.workRegistry.set(item.identifier, item);
        this.saveToStorage();
        this.notifyObservers();
    }
    
    updateWorkItem(identifier, updates) {
        const item = this.workRegistry.get(identifier);
        if (item) {
            Object.assign(item, updates);
            this.saveToStorage();
            this.notifyObservers();
        }
    }
    
    removeWorkItem(identifier) {
        this.workRegistry.delete(identifier);
        this.saveToStorage();
        this.notifyObservers();
    }
    
    archiveWorkItem(identifier) {
        const item = this.workRegistry.get(identifier);
        if (item) {
            item.completionTimestamp = Date.now();
            this.completedRegistry.set(identifier, item);
            this.workRegistry.delete(identifier);
            this.saveToStorage();
            this.notifyObservers();
        }
    }
    
    retrieveWorkByZone(zone) {
        return Array.from(this.workRegistry.values())
            .filter(item => item.priorityZone === zone);
    }
    
    retrieveAllWork() {
        return Array.from(this.workRegistry.values());
    }
    
    retrieveCompletedWork() {
        return Array.from(this.completedRegistry.values());
    }
    
    extractAllLabels() {
        const labelSet = new Set();
        this.workRegistry.forEach(item => {
            item.categoryLabels.forEach(label => labelSet.add(label));
        });
        return Array.from(labelSet);
    }
    
    extractArchivedLabels() {
        const labelSet = new Set();
        this.completedRegistry.forEach(item => {
            item.categoryLabels.forEach(label => labelSet.add(label));
        });
        return Array.from(labelSet);
    }
    
    applyFilter(filterValue) {
        this.activeFilter = filterValue;
        this.notifyObservers();
    }
}

// UI Component Renderer
class ComponentRenderer {
    constructor(appState) {
        this.appState = appState;
        this.draggedElement = null;
        this.labelColorMap = new Map();
    }
    
    assignLabelColor(label) {
        if (!this.labelColorMap.has(label)) {
            // Cycle through 4 color variants (label-color-0 through label-color-3 in CSS)
            const colorIndex = this.labelColorMap.size % 4;
            this.labelColorMap.set(label, colorIndex);
        }
        return this.labelColorMap.get(label);
    }
    
    constructWorkCard(workItem) {
        const cardElement = document.createElement('article');
        cardElement.className = 'task-card';
        cardElement.setAttribute('data-item-id', workItem.identifier);
        cardElement.setAttribute('draggable', 'true');
        
        // Apply filter visibility
        if (this.appState.activeFilter !== 'all') {
            const matchesFilter = workItem.categoryLabels.includes(this.appState.activeFilter);
            if (!matchesFilter) {
                cardElement.classList.add('is-hidden');
            }
        }
        
        // Header section
        const headerDiv = document.createElement('div');
        headerDiv.className = 'card-header';
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `card-status status-${workItem.workflowStage}`;
        statusBadge.textContent = workItem.workflowStage === 'pending' ? 'To Do' : 
                                  workItem.workflowStage === 'active' ? 'In Progress' : 'Done';
        headerDiv.appendChild(statusBadge);
        
        // Actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        
        // Cycle status button
        const cycleBtn = this.createActionButton('cycle', this.getCycleIcon());
        cycleBtn.addEventListener('click', () => this.cycleWorkflowStage(workItem));
        actionsDiv.appendChild(cycleBtn);
        
        // Delete button
        const deleteBtn = this.createActionButton('delete', this.getDeleteIcon());
        deleteBtn.addEventListener('click', () => this.deleteWorkItem(workItem.identifier));
        actionsDiv.appendChild(deleteBtn);
        
        headerDiv.appendChild(actionsDiv);
        cardElement.appendChild(headerDiv);
        
        // Description
        const descriptionPara = document.createElement('p');
        descriptionPara.className = 'card-description';
        descriptionPara.textContent = workItem.content;
        cardElement.appendChild(descriptionPara);
        
        // Labels
        if (workItem.categoryLabels.length > 0) {
            const labelsDiv = document.createElement('div');
            labelsDiv.className = 'card-labels';
            
            workItem.categoryLabels.forEach(label => {
                const labelSpan = document.createElement('span');
                labelSpan.className = `label-tag label-color-${this.assignLabelColor(label)}`;
                labelSpan.textContent = label;
                labelsDiv.appendChild(labelSpan);
            });
            
            cardElement.appendChild(labelsDiv);
        }
        
        // Links
        if (workItem.urlReferences.length > 0) {
            const linksDiv = document.createElement('div');
            linksDiv.className = 'card-links';
            
            workItem.urlReferences.forEach(url => {
                const linkAnchor = document.createElement('a');
                linkAnchor.className = 'link-item';
                linkAnchor.href = url;
                linkAnchor.target = '_blank';
                linkAnchor.rel = 'noopener noreferrer';
                linkAnchor.textContent = this.shortenUrl(url);
                linksDiv.appendChild(linkAnchor);
            });
            
            cardElement.appendChild(linksDiv);
        }
        
        this.attachDragHandlers(cardElement);
        
        return cardElement;
    }
    
    createActionButton(action, iconSvg) {
        const button = document.createElement('button');
        button.className = 'action-icon';
        button.setAttribute('aria-label', action);
        button.innerHTML = iconSvg;
        return button;
    }
    
    getCycleIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>`;
    }
    
    getDeleteIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;
    }
    
    shortenUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname.substring(0, 20) + (urlObj.pathname.length > 20 ? '...' : '');
        } catch {
            return url.substring(0, 30) + (url.length > 30 ? '...' : '');
        }
    }
    
    cycleWorkflowStage(workItem) {
        const stages = ['pending', 'active', 'done'];
        const currentIndex = stages.indexOf(workItem.workflowStage);
        const nextIndex = (currentIndex + 1) % stages.length;
        const nextStage = stages[nextIndex];
        
        if (nextStage === 'done') {
            this.appState.archiveWorkItem(workItem.identifier);
        } else {
            this.appState.updateWorkItem(workItem.identifier, { workflowStage: nextStage });
        }
    }
    
    deleteWorkItem(identifier) {
        if (confirm('Remove this task permanently?')) {
            this.appState.removeWorkItem(identifier);
        }
    }
    
    attachDragHandlers(element) {
        element.addEventListener('dragstart', (evt) => {
            this.draggedElement = element;
            element.classList.add('is-dragging');
            evt.dataTransfer.effectAllowed = 'move';
            evt.dataTransfer.setData('text/plain', element.getAttribute('data-item-id'));
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('is-dragging');
            this.draggedElement = null;
        });
    }
    
    constructArchivedCard(workItem) {
        const cardElement = document.createElement('article');
        cardElement.className = 'archived-card';
        
        // Apply filter
        if (this.appState.activeFilter !== 'all') {
            const matchesFilter = workItem.categoryLabels.includes(this.appState.activeFilter);
            if (!matchesFilter) {
                cardElement.style.display = 'none';
            }
        }
        
        const descriptionPara = document.createElement('p');
        descriptionPara.className = 'card-description';
        descriptionPara.textContent = workItem.content;
        cardElement.appendChild(descriptionPara);
        
        // Labels
        if (workItem.categoryLabels.length > 0) {
            const labelsDiv = document.createElement('div');
            labelsDiv.className = 'card-labels';
            
            workItem.categoryLabels.forEach(label => {
                const labelSpan = document.createElement('span');
                labelSpan.className = `label-tag label-color-${this.assignLabelColor(label)}`;
                labelSpan.textContent = label;
                labelsDiv.appendChild(labelSpan);
            });
            
            cardElement.appendChild(labelsDiv);
        }
        
        // Meta info
        const metaDiv = document.createElement('div');
        metaDiv.className = 'archived-meta';
        const completedDate = new Date(workItem.completionTimestamp);
        metaDiv.textContent = `Completed: ${completedDate.toLocaleDateString()}`;
        cardElement.appendChild(metaDiv);
        
        return cardElement;
    }
}

// Main application controller
class MatrixController {
    constructor() {
        this.appState = new ApplicationState();
        this.renderer = new ComponentRenderer(this.appState);
        this.zoneMapping = {
            'urgentImportant': 'urgentImportantZone',
            'notUrgentImportant': 'notUrgentImportantZone',
            'urgentNotImportant': 'urgentNotImportantZone',
            'notUrgentNotImportant': 'notUrgentNotImportantZone'
        };
        
        this.appState.registerObserver(() => this.refreshDisplay());
        this.setupEventListeners();
        this.refreshDisplay();
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Add task button
        const addBtn = document.getElementById('addTaskBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showCreationPanel());
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelCreationBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreationPanel());
        }
        
        // Form submission
        const form = document.getElementById('taskCreationForm');
        if (form) {
            form.addEventListener('submit', (evt) => this.handleFormSubmission(evt));
        }
        
        // Setup drop zones
        Object.keys(this.zoneMapping).forEach(zone => {
            const element = document.getElementById(this.zoneMapping[zone]);
            if (element) {
                this.setupDropZone(element, zone);
            }
        });
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        StorageVault.persist('theme_preference', newTheme);
    }
    
    showCreationPanel() {
        const panel = document.getElementById('creationPanel');
        if (panel) {
            panel.classList.add('is-visible');
        }
    }
    
    hideCreationPanel() {
        const panel = document.getElementById('creationPanel');
        if (panel) {
            panel.classList.remove('is-visible');
        }
        document.getElementById('taskCreationForm').reset();
    }
    
    handleFormSubmission(evt) {
        evt.preventDefault();
        
        const contentInput = document.getElementById('taskDescription');
        const labelsInput = document.getElementById('taskLabels');
        const linksInput = document.getElementById('taskLinks');
        const zoneSelect = document.getElementById('taskQuadrant');
        
        const content = contentInput.value.trim();
        const labels = labelsInput.value.split(',').map(l => l.trim()).filter(l => l.length > 0);
        const links = linksInput.value.split(',').map(l => l.trim()).filter(l => l.length > 0);
        const zone = zoneSelect.value;
        
        if (content) {
            const newItem = WorkItemFactory.manufacture({
                content,
                categoryLabels: labels,
                urlReferences: links,
                priorityZone: zone
            });
            
            this.appState.insertWorkItem(newItem);
            this.hideCreationPanel();
        }
    }
    
    setupDropZone(zoneElement, zoneName) {
        zoneElement.addEventListener('dragover', (evt) => {
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'move';
            const quadrant = zoneElement.closest('.matrix-quadrant');
            if (quadrant) {
                quadrant.classList.add('drag-over');
            }
        });
        
        zoneElement.addEventListener('dragleave', (evt) => {
            if (evt.target === zoneElement) {
                const quadrant = zoneElement.closest('.matrix-quadrant');
                if (quadrant) {
                    quadrant.classList.remove('drag-over');
                }
            }
        });
        
        zoneElement.addEventListener('drop', (evt) => {
            evt.preventDefault();
            const quadrant = zoneElement.closest('.matrix-quadrant');
            if (quadrant) {
                quadrant.classList.remove('drag-over');
            }
            
            const itemId = evt.dataTransfer.getData('text/plain');
            if (itemId) {
                this.appState.updateWorkItem(itemId, { priorityZone: zoneName });
            }
        });
    }
    
    refreshDisplay() {
        // Update all zones
        Object.keys(this.zoneMapping).forEach(zone => {
            const zoneElement = document.getElementById(this.zoneMapping[zone]);
            if (zoneElement) {
                this.populateZone(zoneElement, zone);
            }
        });
        
        // Update filter chips
        this.updateFilterChips();
    }
    
    populateZone(zoneElement, zoneName) {
        zoneElement.innerHTML = '';
        const items = this.appState.retrieveWorkByZone(zoneName);
        
        items.forEach(item => {
            const card = this.renderer.constructWorkCard(item);
            zoneElement.appendChild(card);
        });
    }
    
    updateFilterChips() {
        const container = document.getElementById('labelFilterContainer');
        if (!container) return;
        
        const labels = this.appState.extractAllLabels();
        container.innerHTML = '';
        
        // All filter
        const allChip = this.createFilterChip('all', 'All');
        container.appendChild(allChip);
        
        // Individual label filters
        labels.forEach(label => {
            const chip = this.createFilterChip(label, label);
            container.appendChild(chip);
        });
    }
    
    createFilterChip(value, displayText) {
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.textContent = displayText;
        chip.setAttribute('data-label', value);
        
        if (value === this.appState.activeFilter) {
            chip.classList.add('active');
        }
        
        chip.addEventListener('click', () => {
            this.appState.applyFilter(value);
        });
        
        return chip;
    }
}

// Archive page controller
class ArchiveController {
    constructor() {
        this.appState = new ApplicationState();
        this.renderer = new ComponentRenderer(this.appState);
        
        this.appState.registerObserver(() => this.refreshArchiveDisplay());
        this.setupEventListeners();
        this.refreshArchiveDisplay();
    }
    
    setupEventListeners() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        StorageVault.persist('theme_preference', newTheme);
    }
    
    refreshArchiveDisplay() {
        const container = document.getElementById('archivedTasksList');
        const emptyMessage = document.getElementById('emptyArchiveMessage');
        const totalCount = document.getElementById('totalCount');
        
        if (!container) return;
        
        const completedItems = this.appState.retrieveCompletedWork();
        container.innerHTML = '';
        
        if (completedItems.length === 0) {
            if (emptyMessage) emptyMessage.classList.remove('is-hidden');
        } else {
            if (emptyMessage) emptyMessage.classList.add('is-hidden');
            
            completedItems.forEach(item => {
                const card = this.renderer.constructArchivedCard(item);
                container.appendChild(card);
            });
        }
        
        if (totalCount) {
            totalCount.textContent = completedItems.length;
        }
        
        this.updateArchiveFilterChips();
    }
    
    updateArchiveFilterChips() {
        const container = document.getElementById('labelFilterContainer');
        if (!container) return;
        
        const labels = this.appState.extractArchivedLabels();
        container.innerHTML = '';
        
        const allChip = this.createFilterChip('all', 'All');
        container.appendChild(allChip);
        
        labels.forEach(label => {
            const chip = this.createFilterChip(label, label);
            container.appendChild(chip);
        });
    }
    
    createFilterChip(value, displayText) {
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.textContent = displayText;
        chip.setAttribute('data-label', value);
        
        if (value === this.appState.activeFilter) {
            chip.classList.add('active');
        }
        
        chip.addEventListener('click', () => {
            this.appState.applyFilter(value);
        });
        
        return chip;
    }
}

// Initialize application based on current page
document.addEventListener('DOMContentLoaded', () => {
    // Restore theme preference
    const savedTheme = StorageVault.retrieve('theme_preference');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Determine page and initialize appropriate controller
    const isArchivePage = window.location.pathname.includes('archive.html');
    
    if (isArchivePage) {
        new ArchiveController();
    } else {
        new MatrixController();
    }
});
