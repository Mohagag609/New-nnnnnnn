document.addEventListener('DOMContentLoaded', () => {

    const revenueTableBody = document.getElementById('revenue-table-body');
    const expensesTableBody = document.getElementById('expenses-table-body');

    // --- Helper Functions ---
    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    async function createDataMap(storeName, keyPath, valueField = 'name') {
        return new Promise(resolve => {
            const store = getObjectStore(storeName, 'readonly');
            if (!store) return resolve(new Map());
            const request = store.getAll();
            request.onsuccess = () => {
                const dataMap = new Map(request.result.map(item => [item[keyPath], item[valueField]]));
                resolve(dataMap);
            };
            request.onerror = () => resolve(new Map());
        });
    }

    /**
     * Renders a table of transactions (filtered by type).
     * @param {string} type - The transaction type ('قبض' or 'صرف').
     * @param {HTMLElement} tableBody - The tbody element to render into.
     */
    async function displayTransactionType(type, tableBody) {
        if (!db) return;

        const transactionStore = getObjectStore('transactions', 'readonly');
        if (!transactionStore) return;

        // Create maps for efficient name lookups
        const projectMap = await createDataMap('projects', 'project_id');
        const cashboxMap = await createDataMap('cashboxes', 'cashbox_id');

        const request = transactionStore.getAll();
        request.onsuccess = () => {
            const allTransactions = request.result;
            const filtered = allTransactions.filter(t => t.transaction_type === type);

            tableBody.innerHTML = '';
            if (filtered.length === 0) {
                const message = type === 'قبض' ? 'لا يوجد إيرادات لعرضها.' : 'لا يوجد مصروفات لعرضها.';
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center">${message}</td></tr>`;
            } else {
                filtered.forEach(t => {
                    const projectName = projectMap.get(t.linked_project_id) || 'N/A';
                    const cashboxName = cashboxMap.get(t.linked_cashbox_id) || 'N/A';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${t.transaction_id}</td>
                        <td>${t.date}</td>
                        <td>${t.amount.toFixed(2)}</td>
                        <td>${t.description || ''}</td>
                        <td>${projectName}</td>
                        <td>${cashboxName}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        };
        request.onerror = (e) => console.error(`Error fetching transactions for ${type}:`, e.target.error);
    }

    // --- Event Listeners ---

    // Initial display when the section becomes visible
    const revExpSection = document.getElementById('revenue-expenses-section');
    const observer = new MutationObserver(() => {
        if (db && !revExpSection.classList.contains('d-none')) {
            // Display the initially active tab's content
            displayTransactionType('قبض', revenueTableBody);
            displayTransactionType('صرف', expensesTableBody);
        }
    });
    observer.observe(revExpSection, { attributes: true, attributeFilter: ['class'] });

    // Refresh data when tabs are clicked (optional, but good practice)
    const revenueTab = document.getElementById('revenue-tab');
    const expensesTab = document.getElementById('expenses-tab');

    revenueTab.addEventListener('shown.bs.tab', () => displayTransactionType('قبض', revenueTableBody));
    expensesTab.addEventListener('shown.bs.tab', () => displayTransactionType('صرف', expensesTableBody));
});
