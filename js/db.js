const DB_NAME = 'AccountingDB';
const DB_VERSION = 2; // <-- Increased version
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const oldVersion = event.oldVersion;
            console.log(`Database upgrade needed from version ${oldVersion} to ${DB_VERSION}.`);

            // Version 1 schema
            if (oldVersion < 1) {
                // 1. Partners Store
                if (!db.objectStoreNames.contains('partners')) {
                    const partnersStore = db.createObjectStore('partners', { keyPath: 'partner_id', autoIncrement: true });
                    partnersStore.createIndex('project_id_idx', 'project_id', { unique: false });
                }
                // 2. Projects Store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectsStore = db.createObjectStore('projects', { keyPath: 'project_id', autoIncrement: true });
                    projectsStore.createIndex('status_idx', 'status', { unique: false });
                }
                // ... (and so on for all original stores)
                 if (!db.objectStoreNames.contains('transactions')) {
                    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'transaction_id', autoIncrement: true });
                    transactionsStore.createIndex('project_id_idx', 'linked_project_id', { unique: false });
                    transactionsStore.createIndex('type_idx', 'transaction_type', { unique: false });
                }
                if (!db.objectStoreNames.contains('invoices')) {
                    const invoicesStore = db.createObjectStore('invoices', { keyPath: 'invoice_id', autoIncrement: true });
                    invoicesStore.createIndex('status_idx', 'status', { unique: false });
                    invoicesStore.createIndex('transaction_id_idx', 'linked_transaction_id', { unique: true });
                }
                if (!db.objectStoreNames.contains('settlements')) {
                    const settlementsStore = db.createObjectStore('settlements', { keyPath: 'settlement_id', autoIncrement: true });
                    settlementsStore.createIndex('partner_id_idx', 'partner_id', { unique: false });
                    settlementsStore.createIndex('project_id_idx', 'linked_project_id', { unique: false });
                }
                if (!db.objectStoreNames.contains('cashboxes')) {
                    const cashboxesStore = db.createObjectStore('cashboxes', { keyPath: 'cashbox_id', autoIncrement: true });
                    cashboxesStore.createIndex('name_idx', 'name', { unique: true });
                }
                if (!db.objectStoreNames.contains('revenue')) {
                    const revenueStore = db.createObjectStore('revenue', { keyPath: 'revenue_id', autoIncrement: true });
                    revenueStore.createIndex('project_id_idx', 'project_id', { unique: false });
                }
                if (!db.objectStoreNames.contains('expenses')) {
                    const expensesStore = db.createObjectStore('expenses', { keyPath: 'expense_id', autoIncrement: true });
                    expensesStore.createIndex('project_id_idx', 'project_id', { unique: false });
                }
            }

            // Version 2 schema update
            if (oldVersion < 2) {
                console.log('Applying version 2 schema updates...');
                // 9. Clients Store
                if (!db.objectStoreNames.contains('clients')) {
                    const clientsStore = db.createObjectStore('clients', { keyPath: 'client_id', autoIncrement: true });
                    clientsStore.createIndex('name_idx', 'name', { unique: false });
                }
                // 10. Suppliers Store
                if (!db.objectStoreNames.contains('suppliers')) {
                    const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'supplier_id', autoIncrement: true });
                    suppliersStore.createIndex('name_idx', 'name', { unique: false });
                }
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully.');

            // Ensure the virtual cashbox for settlements exists.
            if (typeof ensureVirtualCashboxExists === 'function') {
                ensureVirtualCashboxExists();
            }

            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.error);
        };
    });
}

// Call initDB when the script loads
document.addEventListener('DOMContentLoaded', () => {
    initDB().catch(err => console.error("Failed to initialize DB:", err));
});
