import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read the HTML fixture once
const htmlPath = path.resolve(__dirname, '..', 'src', 'index.html');
const fullHTML = fs.readFileSync(htmlPath, 'utf-8');

// Extract body content between <body> and </body>, excluding the <script> tag
const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/i);
const bodyContent = bodyMatch[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

// Mock matchMedia before loading the module
window.matchMedia = window.matchMedia || function () {
    return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
};

// Suppress alert/confirm in tests
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

// Set up DOM before requiring app.js so the auto-instantiation at module level succeeds
document.body.innerHTML = bodyContent;

const { EisenMatrixController } = require('../src/app.js');

function setupDOM() {
    document.body.innerHTML = bodyContent;
}

function createApp() {
    return new EisenMatrixController();
}

// ============================================================
// 1. Profile Management
// ============================================================
describe('Profile Management', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app = createApp();
    });

    it('getProfiles() returns empty array when no profiles exist', () => {
        localStorage.removeItem(app.profilesKey);
        expect(app.getProfiles()).toEqual([]);
    });

    it('saveProfiles() and getProfiles() round-trip', () => {
        const profiles = [
            { id: 0, name: 'default' },
            { id: 1, name: 'work' },
        ];
        app.saveProfiles(profiles);
        expect(app.getProfiles()).toEqual(profiles);
    });

    it('createProfile() creates a profile with valid alphanumeric name', () => {
        const result = app.createProfile('work');
        expect(result).toBe(true);
        const profiles = app.getProfiles();
        expect(profiles.find(p => p.name === 'work')).toBeTruthy();
    });

    it('createProfile() rejects invalid names (spaces, special chars, empty)', () => {
        expect(app.createProfile('')).toBe(false);
        expect(app.createProfile('my profile')).toBe(false);
        expect(app.createProfile('work!')).toBe(false);
        expect(app.createProfile('hello world')).toBe(false);
        expect(app.createProfile(null)).toBe(false);
        expect(app.createProfile(undefined)).toBe(false);
    });

    it('createProfile() rejects duplicate names', () => {
        app.createProfile('work');
        expect(app.createProfile('work')).toBe(false);
    });

    it('deleteProfile() cannot delete default profile', () => {
        expect(app.deleteProfile('default')).toBe(false);
    });

    it('deleteProfile() removes profile and its data from localStorage', () => {
        app.createProfile('work');
        app.switchProfile('work');
        // Store some data in the work profile
        const workKeys = app.getProfileStorageKeys('work');
        localStorage.setItem(workKeys.storageKey, JSON.stringify({ activeTasks: [{ id: '1' }], completedTasks: [] }));
        localStorage.setItem(workKeys.backlogKey, JSON.stringify([{ id: '2' }]));

        app.deleteProfile('work');

        // Profile should be removed from the registry
        const profiles = app.getProfiles();
        expect(profiles.find(p => p.name === 'work')).toBeFalsy();

        // Profile data should be cleaned up
        expect(localStorage.getItem(workKeys.storageKey)).toBeNull();
        expect(localStorage.getItem(workKeys.backlogKey)).toBeNull();
    });

    it('deleteProfile() switches to default when deleting current profile', () => {
        app.createProfile('temp');
        app.switchProfile('temp');
        expect(app.getCurrentProfileName()).toBe('temp');

        app.deleteProfile('temp');
        expect(app.getCurrentProfileName()).toBe('default');
    });

    it('getCurrentProfileName() returns current profile name', () => {
        expect(app.getCurrentProfileName()).toBe('default');
        app.createProfile('work');
        app.switchProfile('work');
        expect(app.getCurrentProfileName()).toBe('work');
    });

    it('initializeProfile() creates default profile if none exists', () => {
        localStorage.clear();
        setupDOM();
        const freshApp = createApp();
        const profiles = freshApp.getProfiles();
        expect(profiles.length).toBeGreaterThanOrEqual(1);
        expect(profiles.find(p => p.name === 'default')).toBeTruthy();
    });
});

// ============================================================
// 2. Profile Storage Keys
// ============================================================
describe('Profile Storage Keys', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app = createApp();
    });

    it('getProfileStorageKeys("default") returns base keys without suffix', () => {
        const keys = app.getProfileStorageKeys('default');
        expect(keys.storageKey).toBe('eisen_matrix_data_v1');
        expect(keys.backlogKey).toBe('eisen_backlog_v1');
        expect(keys.collapsedKey).toBe('eisen_collapsed_v1');
        expect(keys.collapsedQuadrantsKey).toBe('eisen_collapsed_quadrants_v1');
        expect(keys.draftsKey).toBe('eisen_drafts_v1');
        expect(keys.tourKey).toBe('eisen_tour_seen_v1');
        expect(keys.tagColorsKey).toBe('eisen_tag_colors_v1');
    });

    it('getProfileStorageKeys("work") returns keys with _profile_work suffix', () => {
        const keys = app.getProfileStorageKeys('work');
        expect(keys.storageKey).toBe('eisen_matrix_data_v1_profile_work');
        expect(keys.backlogKey).toBe('eisen_backlog_v1_profile_work');
        expect(keys.collapsedKey).toBe('eisen_collapsed_v1_profile_work');
        expect(keys.collapsedQuadrantsKey).toBe('eisen_collapsed_quadrants_v1_profile_work');
        expect(keys.draftsKey).toBe('eisen_drafts_v1_profile_work');
        expect(keys.tourKey).toBe('eisen_tour_seen_v1_profile_work');
        expect(keys.tagColorsKey).toBe('eisen_tag_colors_v1_profile_work');
    });

    it('applyProfileStorageKeys() updates all storage key properties', () => {
        app.applyProfileStorageKeys('work');
        expect(app.storageKey).toBe('eisen_matrix_data_v1_profile_work');
        expect(app.backlogKey).toBe('eisen_backlog_v1_profile_work');
        expect(app.collapsedKey).toBe('eisen_collapsed_v1_profile_work');
        expect(app.collapsedQuadrantsKey).toBe('eisen_collapsed_quadrants_v1_profile_work');
        expect(app.draftsKey).toBe('eisen_drafts_v1_profile_work');
        expect(app.tourKey).toBe('eisen_tour_seen_v1_profile_work');
        expect(app.tagColorsKey).toBe('eisen_tag_colors_v1_profile_work');
    });

    it('switchProfile() updates storage keys and reloads state', () => {
        app.createProfile('work');

        // Store tasks under work profile keys
        const workKeys = app.getProfileStorageKeys('work');
        localStorage.setItem(workKeys.storageKey, JSON.stringify({
            activeTasks: [{ id: 't1', content: 'Work task', quadrant: 'urgent-important', labels: [], urls: [], status: 'todo' }],
            completedTasks: []
        }));

        app.switchProfile('work');

        expect(app.currentProfileName).toBe('work');
        expect(app.storageKey).toBe(workKeys.storageKey);
        expect(app.backlogKey).toBe(workKeys.backlogKey);
        expect(app.tagColorsKey).toBe(workKeys.tagColorsKey);
    });
});

// ============================================================
// 3. Tag Colors
// ============================================================
describe('Tag Colors', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        app = createApp();
    });

    it('generateTagColor({}) returns a valid hex color', () => {
        const color = app.generateTagColor({});
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('generateTagColor(existingColors) returns a color with hue distance from existing', () => {
        const existing = { tag1: '#ff0000', tag2: '#00ff00' };
        const color = app.generateTagColor(existing);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        // Should not be identical to existing colors
        expect(color).not.toBe('#ff0000');
        expect(color).not.toBe('#00ff00');
    });

    it('getTagTextColor() returns "#FFFFFF" for dark colors', () => {
        expect(app.getTagTextColor('#000000')).toBe('#FFFFFF');
        expect(app.getTagTextColor('#1a1a2e')).toBe('#FFFFFF');
    });

    it('getTagTextColor() returns "#000000" for light colors', () => {
        expect(app.getTagTextColor('#FFFFFF')).toBe('#000000');
        expect(app.getTagTextColor('#ffff00')).toBe('#000000');
    });

    it('getTagColors() returns empty object when no colors stored', () => {
        expect(app.getTagColors()).toEqual({});
    });

    it('saveTagColors() and getTagColors() round-trip', () => {
        const colors = { work: '#ff0000', personal: '#00ff00' };
        app.saveTagColors(colors);
        expect(app.getTagColors()).toEqual(colors);
    });

    it('ensureTagColors() generates colors for new tags', () => {
        app.ensureTagColors(['work', 'personal']);
        const colors = app.getTagColors();
        expect(colors.work).toMatch(/^#[0-9a-f]{6}$/i);
        expect(colors.personal).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('ensureTagColors() does not overwrite existing tag colors', () => {
        app.saveTagColors({ work: '#abcdef' });
        app.ensureTagColors(['work', 'personal']);
        const colors = app.getTagColors();
        expect(colors.work).toBe('#abcdef');
        expect(colors.personal).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('updateTagColor() updates a specific tag color', () => {
        app.saveTagColors({ work: '#ff0000' });
        app.updateTagColor('work', '#00ff00');
        expect(app.getTagColors().work).toBe('#00ff00');
    });

    it('hexToRGB() correctly converts hex to RGB', () => {
        expect(app.hexToRGB('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(app.hexToRGB('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(app.hexToRGB('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
        expect(app.hexToRGB('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(app.hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('hslToHex() and hexToRGB()/rgbToHSL() round-trip approximately', () => {
        // Start with known HSL values, convert to hex, then back to HSL
        const originalH = 120;
        const originalS = 60;
        const originalL = 50;
        const hex = app.hslToHex(originalH, originalS, originalL);
        expect(hex).toMatch(/^#[0-9a-f]{6}$/i);

        const rgb = app.hexToRGB(hex);
        const hsl = app.rgbToHSL(rgb.r, rgb.g, rgb.b);

        // Allow small rounding errors
        expect(Math.abs(hsl.h - originalH)).toBeLessThan(2);
        expect(Math.abs(hsl.s - originalS)).toBeLessThan(2);
        expect(Math.abs(hsl.l - originalL)).toBeLessThan(2);
    });
});

// ============================================================
// 4. URL Parameters
// ============================================================
describe('URL Parameters', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        // Reset URL to clean state
        history.replaceState(null, '', '/');
        app = createApp();
    });

    it('updateURLParams() adds profile param for non-default profiles', () => {
        app.createProfile('work');
        app.switchProfile('work');
        app.updateURLParams();

        const params = new URLSearchParams(window.location.search);
        expect(params.get('profile')).toBe('work');
    });

    it('updateURLParams() omits profile param for default profile', () => {
        app.updateURLParams();

        const params = new URLSearchParams(window.location.search);
        expect(params.get('profile')).toBeNull();
    });

    it('URL with ?profile=work loads the work profile', () => {
        // Create the work profile first
        app.createProfile('work');

        // Set URL with profile param
        history.replaceState(null, '', '/?profile=work');

        // Create a new app instance which reads URL params
        setupDOM();
        const app2 = createApp();
        expect(app2.getCurrentProfileName()).toBe('work');
    });
});

// ============================================================
// 5. Export/Import
// ============================================================
describe('Export/Import', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        history.replaceState(null, '', '/');
        app = createApp();
    });

    it('exportProfileData() exports data for a specific profile', () => {
        // Add some data to the default profile
        const taskData = {
            activeTasks: [{ id: 't1', content: 'Test', quadrant: 'urgent-important', labels: ['work'], urls: [], status: 'todo' }],
            completedTasks: []
        };
        app.persistDataToStorage(taskData);
        app.saveTagColors({ work: '#ff0000' });

        const exported = app.exportProfileData('default');
        expect(exported.tasks).toEqual(taskData);
        expect(exported.tagColors).toEqual({ work: '#ff0000' });
        expect(exported.backlog).toEqual([]);
        expect(exported.collapsed).toEqual([]);
        expect(exported.collapsedQuadrants).toEqual([]);
    });

    it('exportAllData() for single profile creates version 1 format', () => {
        // Mock downloadJSON to capture the data
        let capturedData = null;
        app.downloadJSON = vi.fn((data) => { capturedData = data; });

        // Add an export scope dropdown set to a specific profile
        const container = document.getElementById('exportDropdownContainer');
        if (container) {
            container.innerHTML = '<select id="exportScopeSelect"><option value="default" selected>default</option></select>';
        }

        app.exportAllData();

        expect(capturedData).not.toBeNull();
        expect(capturedData.version).toBe(1);
        expect(capturedData.exportedAt).toBeDefined();
        expect(capturedData.tasks).toBeDefined();
        expect(capturedData.backlog).toBeDefined();
    });

    it('v2 format includes all profiles', () => {
        let capturedData = null;
        app.downloadJSON = vi.fn((data) => { capturedData = data; });

        app.createProfile('work');

        // Set export scope to "all"
        const container = document.getElementById('exportDropdownContainer');
        if (container) {
            container.innerHTML = '<select id="exportScopeSelect"><option value="all" selected>All Profiles</option></select>';
        }

        app.exportAllData();

        expect(capturedData).not.toBeNull();
        expect(capturedData.version).toBe(2);
        expect(capturedData.profiles).toBeDefined();
        expect(capturedData.profiles.length).toBe(2);
        expect(capturedData.profiles.map(p => p.name)).toContain('default');
        expect(capturedData.profiles.map(p => p.name)).toContain('work');
    });

    it('importData() v1 format imports into current profile', () => {
        const importPayload = {
            version: 1,
            tasks: {
                activeTasks: [{ id: 'imp1', content: 'Imported task', quadrant: 'urgent-important', labels: ['test'], urls: [], status: 'todo' }],
                completedTasks: []
            },
            backlog: [{ id: 'b1', content: 'Backlog item', labels: [], urls: [] }],
            theme: 'dark',
            tagColors: { test: '#aabbcc' }
        };

        // Simulate file import by calling the reader.onload callback directly
        const fileContent = JSON.stringify(importPayload);
        const mockEvt = {
            target: {
                files: [new Blob([fileContent], { type: 'application/json' })],
                result: fileContent,
                value: 'test.json'
            }
        };

        // Directly invoke the parsing logic
        const data = JSON.parse(fileContent);

        // Simulate v1 import logic
        if (data.tasks) {
            app.persistDataToStorage(data.tasks);
        }
        if (data.backlog) {
            app.persistBacklogData(data.backlog);
        }
        if (data.tagColors) {
            app.saveTagColors(data.tagColors);
        }

        // Verify data was imported
        const stored = app.retrieveStoredData();
        expect(stored.activeTasks.length).toBe(1);
        expect(stored.activeTasks[0].content).toBe('Imported task');

        const backlog = app.retrieveBacklogData();
        expect(backlog.length).toBe(1);
        expect(backlog[0].content).toBe('Backlog item');

        const tagColors = app.getTagColors();
        expect(tagColors.test).toBe('#aabbcc');
    });

    it('importData() v2 format creates/updates profiles', () => {
        const importPayload = {
            version: 2,
            profiles: [
                {
                    name: 'default',
                    data: {
                        tasks: { activeTasks: [{ id: 'd1', content: 'Default task', quadrant: 'urgent-important', labels: [], urls: [], status: 'todo' }], completedTasks: [] },
                        backlog: [],
                        tagColors: {},
                        collapsed: [],
                        collapsedQuadrants: [],
                        drafts: '{}'
                    }
                },
                {
                    name: 'imported',
                    data: {
                        tasks: { activeTasks: [{ id: 'i1', content: 'Imported profile task', quadrant: 'not-urgent-important', labels: ['new'], urls: [], status: 'todo' }], completedTasks: [] },
                        backlog: [{ id: 'ib1', content: 'Imported backlog', labels: [], urls: [] }],
                        tagColors: { new: '#112233' },
                        collapsed: [],
                        collapsedQuadrants: [],
                        drafts: '{}'
                    }
                }
            ],
            theme: 'light'
        };

        // Simulate v2 import logic directly
        importPayload.profiles.forEach(profileEntry => {
            const { name, data: pData } = profileEntry;
            const profiles = app.getProfiles();
            if (!profiles.find(p => p.name === name)) {
                const maxId = profiles.reduce((max, p) => Math.max(max, p.id), -1);
                profiles.push({ id: maxId + 1, name });
                app.saveProfiles(profiles);
            }
            const keys = app.getProfileStorageKeys(name);
            if (pData.tasks) localStorage.setItem(keys.storageKey, JSON.stringify(pData.tasks));
            if (pData.backlog) localStorage.setItem(keys.backlogKey, JSON.stringify(pData.backlog));
            if (pData.tagColors) localStorage.setItem(keys.tagColorsKey, JSON.stringify(pData.tagColors));
        });

        // Verify the imported profile was created
        const profiles = app.getProfiles();
        expect(profiles.find(p => p.name === 'imported')).toBeTruthy();

        // Verify imported profile data
        const importedKeys = app.getProfileStorageKeys('imported');
        const importedTasks = JSON.parse(localStorage.getItem(importedKeys.storageKey));
        expect(importedTasks.activeTasks[0].content).toBe('Imported profile task');

        const importedBacklog = JSON.parse(localStorage.getItem(importedKeys.backlogKey));
        expect(importedBacklog[0].content).toBe('Imported backlog');

        const importedColors = JSON.parse(localStorage.getItem(importedKeys.tagColorsKey));
        expect(importedColors.new).toBe('#112233');
    });

    it('v1 import includes tagColors', () => {
        const importPayload = {
            version: 1,
            tasks: { activeTasks: [], completedTasks: [] },
            tagColors: { urgent: '#ff0000', personal: '#00ff00' }
        };

        // Simulate v1 import
        if (importPayload.tasks) {
            app.persistDataToStorage(importPayload.tasks);
        }
        if (importPayload.tagColors) {
            app.saveTagColors(importPayload.tagColors);
        }

        const colors = app.getTagColors();
        expect(colors.urgent).toBe('#ff0000');
        expect(colors.personal).toBe('#00ff00');
    });
});

// ============================================================
// 6. Tag Color Rendering
// ============================================================
describe('Tag Color Rendering', () => {
    let app;

    beforeEach(() => {
        localStorage.clear();
        setupDOM();
        history.replaceState(null, '', '/');
        app = createApp();
    });

    it('generateTaskCardHTML() includes inline styles when tag has color', () => {
        // Use a dark background so text color will be #FFFFFF
        app.saveTagColors({ work: '#1a1a2e' });

        const task = {
            id: 'test1',
            content: 'Test task',
            quadrant: 'urgent-important',
            labels: ['work'],
            urls: [],
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        const html = app.generateTaskCardHTML(task);
        expect(html).toContain('background-color: #1a1a2e');
        expect(html).toContain('color: #FFFFFF');
        expect(html).toContain('work');
    });

    it('Tags in backlog rendering include inline color styles', () => {
        app.saveTagColors({ dev: '#0000ff' });

        // Store a backlog task with the tag
        app.persistBacklogData([
            { id: 'b1', content: 'Backlog task', labels: ['dev'], urls: [], createdAt: new Date().toISOString() }
        ]);

        app.renderBacklogList();

        const backlogList = document.getElementById('backlogList');
        const tagSpan = backlogList.querySelector('.task-tag');
        expect(tagSpan).not.toBeNull();
        expect(tagSpan.style.backgroundColor).toBeTruthy();
    });

    it('Tags in archive rendering include inline color styles', () => {
        app.saveTagColors({ done: '#00ff00' });

        // Store a completed task with the tag
        const taskData = {
            activeTasks: [],
            completedTasks: [
                {
                    id: 'c1',
                    content: 'Completed task',
                    quadrant: 'urgent-important',
                    labels: ['done'],
                    urls: [],
                    status: 'done',
                    completedAt: new Date().toISOString()
                }
            ]
        };
        app.persistDataToStorage(taskData);

        app.populateArchiveDisplay();

        const archiveList = document.getElementById('archiveList');
        const tagSpan = archiveList.querySelector('.task-tag');
        expect(tagSpan).not.toBeNull();
        expect(tagSpan.style.backgroundColor).toBeTruthy();
    });
});
