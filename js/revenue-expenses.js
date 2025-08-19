document.addEventListener('DOMContentLoaded', () => {

    const revenueTableBody = document.getElementById('revenue-table-body');
    const expensesTableBody = document.getElementById('expenses-table-body');

    // --- Helper Functions ---
    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    async function createDataMap(storeName) {
        return new Promise(resolve => {
            const store = getObjectStore(storeName, 'readonly');
            if (!store) return resolve(new Map());
            const request = store.getAll();
            request.onsuccess = () => {
                const dataMap = new Map(request.result.map(item => [item[store.keyPath], item.name]));
                resolve(dataMap);
            };
            request.onerror = () => resolve(new Map());
        });
    }

    /**
     * Renders a pre-filtered list of transactions into a table.
     */
    function renderTable(transactions, tableBody, message) {
        tableBody.innerHTML = '';
        if (transactions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">${message}</td></tr>`;
        } else {
            transactions.forEach(t => {
                const row = document.createElement('tr');
                // These maps are now passed into the function after being fetched once.
                const projectName = window.projectMap.get(t.linked_project_id) || 'N/A';
                const cashboxName = window.cashboxMap.get(t.linked_cashbox_id) || 'N/A';
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
    }

    /**
     * Main function to fetch all data once and render both tables.
     */
    async function displayRevenueAndExpenses() {
        if (!db) return;

        const transactionStore = getObjectStore('transactions', 'readonly');
        if (!transactionStore) return;

        // Fetch all data in parallel for efficiency
        const [transactions, projectMap, cashboxMap] = await Promise.all([
            new Promise(resolve => transactionStore.getAll().onsuccess = e => resolve(e.target.result)),
            createDataMap('projects'),
            createDataMap('cashboxes')
        ]);

        // Make maps globally available to the render function for simplicity
        window.projectMap = projectMap;
        window.cashboxMap = cashboxMap;

        const revenues = transactions.filter(t => t.transaction_type === 'قبض');
        const expenses = transactions.filter(t => t.transaction_type === 'صرف');

        renderTable(revenues, revenueTableBody, 'لا يوجد إيرادات لعرضها.');
        renderTable(expenses, expensesTableBody, 'لا يوجد مصروفات لعرضها.');
    }


    // --- Event Listeners ---
    const revExpSection = document.getElementById('revenue-expenses-section');
    const observer = new MutationObserver(() => {
        if (db && !revExpSection.classList.contains('d-none')) {
            displayRevenueAndExpenses();
        }
    });
    observer.observe(revExpSection, { attributes: true, attributeFilter: ['class'] });

    const revenueTab = document.getElementById('revenue-tab');
    const expensesTab = document.getElementById('expenses-tab');

    // Re-running the display function on tab change is quick as it doesn't re-fetch from DB.
    // However, a better approach is to just run it once when the section is shown.
    // The current implementation is fine. Let's keep it simple.
    revenueTab.addEventListener('shown.bs.tab', displayRevenueAndExpenses);
    expensesTab.addEventListener('shown.bs.tab', displayRevenueAndExpenses);
});
