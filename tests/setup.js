// Node.js 22+ ships a built-in `localStorage` global that is a stub without
// proper Storage methods when `--localstorage-file` is not provided.
// This conflicts with jsdom's full localStorage implementation.
// Fix: replace the global localStorage with a simple in-memory Storage polyfill
// so that jsdom (or any code) gets a working localStorage.

function createStorage() {
    let store = {};
    return {
        getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
        setItem(key, value) { store[key] = String(value); },
        removeItem(key) { delete store[key]; },
        clear() { store = {}; },
        get length() { return Object.keys(store).length; },
        key(index) { return Object.keys(store)[index] || null; },
    };
}

// Only replace if the built-in localStorage is broken (missing getItem)
if (typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.getItem !== 'function') {
    globalThis.localStorage = createStorage();
}
