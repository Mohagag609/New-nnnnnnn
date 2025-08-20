// =================================================================================
// Main Consolidated JavaScript File for the Accounting Management System
// All modules have been combined into this single file to resolve dependency
// and loading order issues.
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {

    let db;
    const DB_NAME = 'AccountingDB';
    const DB_VERSION = 2;
    const VIRTUAL_CASHBOX_NAME = "خزنة التسويات";

    // --- Core Helpers & Setup ---
    const getObjectStore = (storeName, mode) => db.transaction(storeName, mode).objectStore(storeName);
    const getAllFromStore = (storeName) => new Promise((resolve, reject) => {
        const request = getObjectStore(storeName, 'readonly').getAll();
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });

    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const dbInstance = event.target.result;
                if (!dbInstance.objectStoreNames.contains('partners')) {
                    dbInstance.createObjectStore('partners', { keyPath: 'partner_id', autoIncrement: true }).createIndex('project_id_idx', 'project_id', { unique: false });
                }
                if (!dbInstance.objectStoreNames.contains('projects')) {
                    dbInstance.createObjectStore('projects', { keyPath: 'project_id', autoIncrement: true });
                }
                if (!dbInstance.objectStoreNames.contains('transactions')) {
                    dbInstance.createObjectStore('transactions', { keyPath: 'transaction_id', autoIncrement: true });
                }
                if (!dbInstance.objectStoreNames.contains('settlements')) {
                    dbInstance.createObjectStore('settlements', { keyPath: 'settlement_id', autoIncrement: true }).createIndex('project_id_idx', 'project_id', { unique: false });
                }
                if (!dbInstance.objectStoreNames.contains('cashboxes')) {
                    dbInstance.createObjectStore('cashboxes', { keyPath: 'cashbox_id', autoIncrement: true }).createIndex('name_idx', 'name', { unique: true });
                }
                if (!dbInstance.objectStoreNames.contains('clients')) {
                    dbInstance.createObjectStore('clients', { keyPath: 'client_id', autoIncrement: true });
                }
                if (!dbInstance.objectStoreNames.contains('suppliers')) {
                    dbInstance.createObjectStore('suppliers', { keyPath: 'supplier_id', autoIncrement: true });
                }
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Database opened successfully.');
                // Ensure virtual cashbox exists
                const tx = db.transaction('cashboxes', 'readwrite');
                const store = tx.objectStore('cashboxes');
                const index = store.index('name_idx');
                const req = index.get(VIRTUAL_CASHBOX_NAME);
                req.onsuccess = () => {
                    if (!req.result) {
                        store.add({ name: VIRTUAL_CASHBOX_NAME, initial_balance: 0, current_balance: 0 });
                    }
                };
                resolve(db);
            };
            request.onerror = (event) => reject(`Database error: ${event.target.errorCode}`);
        });
    };

    // --- Start Application ---
    initDB().then(() => {
        console.log("DB Initialized. Setting up modules.");
        setupAllModules();
        document.querySelector('[data-section="dashboard"]').click();
    }).catch(err => {
        console.error("FATAL: Could not initialize database.", err);
        alert("FATAL: Could not initialize database. The application cannot start.");
    });


    function setupAllModules() {
        // --- Navigation ---
        const navLinks = document.querySelectorAll('#sidebar .nav-link');
        const sections = document.querySelectorAll('main section');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const targetSectionId = link.getAttribute('data-section') + '-section';
                sections.forEach(s => s.classList.toggle('d-none', s.id !== targetSectionId));
            });
        });

        // --- Transactions (Core Logic) ---
        const transactionForm = document.getElementById('transaction-form');
        const transactionModalEl = document.getElementById('transactionModal');
        const transactionModal = new bootstrap.Modal(transactionModalEl);

        const processTransaction = (transactionData) => { /* ... full logic ... */ };
        const displayTransactions = async () => { /* ... full logic ... */ };

        // --- Settlements (Depends on Transactions) ---
        const settlementProjectSelector = document.getElementById('settlement-project-selector');

        const calculateAndDisplayProjectSettlement = async () => { /* ... full logic ... */ };
        settlementProjectSelector.addEventListener('change', calculateAndDisplayProjectSettlement);

        // ... All other setup logic for every module ...
    }
});
// This is still a placeholder. The full, monstrous file is next.
