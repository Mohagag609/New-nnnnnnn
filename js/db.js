const DB_NAME = 'TreasuryAppDB';
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error: ' + event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Database upgrade needed.');

            // 1. clients table
            if (!db.objectStoreNames.contains('clients')) {
                const clientsStore = db.createObjectStore('clients', { keyPath: 'client_id', autoIncrement: true });
                clientsStore.createIndex('name', 'name', { unique: false });
            }

            // 2. suppliers table
            if (!db.objectStoreNames.contains('suppliers')) {
                const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'supplier_id', autoIncrement: true });
                suppliersStore.createIndex('name', 'name', { unique: false });
            }

            // 3. partners table
            if (!db.objectStoreNames.contains('partners')) {
                const partnersStore = db.createObjectStore('partners', { keyPath: 'partner_id', autoIncrement: true });
                partnersStore.createIndex('name', 'name', { unique: false });
            }

            // 4. contractors table
            if (!db.objectStoreNames.contains('contractors')) {
                const contractorsStore = db.createObjectStore('contractors', { keyPath: 'contractor_id', autoIncrement: true });
                contractorsStore.createIndex('name', 'name', { unique: false });
            }

            // 5. projects table
            if (!db.objectStoreNames.contains('projects')) {
                const projectsStore = db.createObjectStore('projects', { keyPath: 'project_id', autoIncrement: true });
                projectsStore.createIndex('name', 'name', { unique: false });
                projectsStore.createIndex('status', 'status', { unique: false });
            }

            // 6. items table
            if (!db.objectStoreNames.contains('items')) {
                const itemsStore = db.createObjectStore('items', { keyPath: 'item_id', autoIncrement: true });
                itemsStore.createIndex('name', 'name', { unique: false });
            }

            // 7. transactions table
            if (!db.objectStoreNames.contains('transactions')) {
                const transactionsStore = db.createObjectStore('transactions', { keyPath: 'transaction_id', autoIncrement: true });
                transactionsStore.createIndex('date', 'date', { unique: false });
                transactionsStore.createIndex('transaction_type', 'transaction_type', { unique: false });
                transactionsStore.createIndex('linked_project_id', 'linked_project_id', { unique: false });
                transactionsStore.createIndex('linked_client_id', 'linked_client_id', { unique: false });
                transactionsStore.createIndex('linked_supplier_id', 'linked_supplier_id', { unique: false });
            }

            // 8. settlements table
            if (!db.objectStoreNames.contains('settlements')) {
                const settlementsStore = db.createObjectStore('settlements', { keyPath: 'settlement_id', autoIncrement: true });
                settlementsStore.createIndex('partner_id', 'partner_id', { unique: false });
                settlementsStore.createIndex('date', 'date', { unique: false });
            }
        };
    });
}

// Initialize the database when the script is loaded
initDB().catch(err => console.error(err));

// Generic helper functions for database operations

/**
 * Adds an item to a store.
 * @param {string} storeName The name of the object store.
 * @param {object} item The item to add.
 * @returns {Promise<number>} The ID of the added item.
 */
function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error adding item: ' + event.target.error);
    });
}

/**
 * Gets all items from a store.
 * @param {string} storeName The name of the object store.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of items.
 */
function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error getting all items: ' + event.target.error);
    });
}

/**
 * Gets an item by its ID from a store.
 * @param {string} storeName The name of the object store.
 * @param {number} id The ID of the item to get.
 * @returns {Promise<object>} A promise that resolves with the item.
 */
function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error getting item by ID: ' + event.target.error);
    });
}

/**
 * Updates an item in a store.
 * @param {string} storeName The name of the object store.
 * @param {object} item The item to update.
 * @returns {Promise<number>} The ID of the updated item.
 */
function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error updating item: ' + event.target.error);
    });
}

/**
 * Deletes an item from a store by its ID.
 * @param {string} storeName The name of the object store.
 * @param {number} id The ID of the item to delete.
 * @returns {Promise<void>}
 */
function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error deleting item: ' + event.target.error);
    });
}
