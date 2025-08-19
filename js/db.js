const DB_NAME = 'TreasuryAppDB';
const DB_VERSION = 4;
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

            if (!db.objectStoreNames.contains('clients')) {
                db.createObjectStore('clients', { keyPath: 'client_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('suppliers')) {
                db.createObjectStore('suppliers', { keyPath: 'supplier_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('partners')) {
                db.createObjectStore('partners', { keyPath: 'partner_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('contractors')) {
                db.createObjectStore('contractors', { keyPath: 'contractor_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('projects')) {
                const projectsStore = db.createObjectStore('projects', { keyPath: 'project_id', autoIncrement: true });
                projectsStore.createIndex('status', 'status', { unique: false });
            }
            if (!db.objectStoreNames.contains('items')) {
                db.createObjectStore('items', { keyPath: 'item_id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('settlements')) {
                db.createObjectStore('settlements', { keyPath: 'settlement_id', autoIncrement: true });
            }
             if (!db.objectStoreNames.contains('accounts')) {
                db.createObjectStore('accounts', { keyPath: 'account_id', autoIncrement: true });
            }

            const transactionsStoreName = 'transactions';
            let transactionsStore;
            if (!db.objectStoreNames.contains(transactionsStoreName)) {
                transactionsStore = db.createObjectStore(transactionsStoreName, { keyPath: 'transaction_id', autoIncrement: true });
            } else {
                transactionsStore = event.target.transaction.objectStore(transactionsStoreName);
            }
            if (!transactionsStore.indexNames.contains('date')) transactionsStore.createIndex('date', 'date', { unique: false });
            if (!transactionsStore.indexNames.contains('linked_client_id')) transactionsStore.createIndex('linked_client_id', 'linked_client_id', { unique: false });
            if (!transactionsStore.indexNames.contains('linked_supplier_id')) transactionsStore.createIndex('linked_supplier_id', 'linked_supplier_id', { unique: false });
            if (!transactionsStore.indexNames.contains('linked_project_id')) transactionsStore.createIndex('linked_project_id', 'linked_project_id', { unique: false });
            if (!transactionsStore.indexNames.contains('linked_partner_id')) transactionsStore.createIndex('linked_partner_id', 'linked_partner_id', { unique: false });
            if (!transactionsStore.indexNames.contains('linked_invoice_id')) transactionsStore.createIndex('linked_invoice_id', 'linked_invoice_id', { unique: false });
            if (!transactionsStore.indexNames.contains('account_id')) transactionsStore.createIndex('account_id', 'account_id', { unique: false });

            if (!db.objectStoreNames.contains('invoices')) {
                const invoicesStore = db.createObjectStore('invoices', { keyPath: 'invoice_id', autoIncrement: true });
                invoicesStore.createIndex('client_id', 'client_id', { unique: false });
                invoicesStore.createIndex('status', 'status', { unique: false });
            }
        };
    });
}

initDB().catch(err => console.error(err));

function addItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getItemById(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}
