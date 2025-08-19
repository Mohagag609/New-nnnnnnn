document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const cashboxReportBody = document.getElementById('report-cashbox-balances');
    const partnerReportBody = document.getElementById('report-partner-balances');
    const projectReportBody = document.getElementById('report-project-profitability');

    // --- Helper ---
    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    // --- Report Generation Functions ---

    /**
     * Report 1: Generates a summary of cashbox balances.
     */
    function generateCashboxReport() {
        const store = getObjectStore('cashboxes', 'readonly');
        if (!store) return;
        const request = store.getAll();
        request.onsuccess = () => {
            cashboxReportBody.innerHTML = '';
            const cashboxes = request.result;
            if (cashboxes.length === 0) {
                cashboxReportBody.innerHTML = '<tr><td colspan="2" class="text-center">لا يوجد بيانات.</td></tr>';
            } else {
                cashboxes.forEach(c => {
                    const row = cashboxReportBody.insertRow();
                    row.innerHTML = `<td>${c.name}</td><td>${c.current_balance.toFixed(2)}</td>`;
                });
            }
        };
    }

    /**
     * Report 2: Generates a summary of partner balances.
     */
    function generatePartnerBalanceReport() {
        const store = getObjectStore('partners', 'readonly');
        if (!store) return;
        const request = store.getAll();
        request.onsuccess = () => {
            partnerReportBody.innerHTML = '';
            const partners = request.result;
            if (partners.length === 0) {
                partnerReportBody.innerHTML = '<tr><td colspan="2" class="text-center">لا يوجد بيانات.</td></tr>';
            } else {
                partners.forEach(p => {
                    const row = partnerReportBody.insertRow();
                    row.innerHTML = `<td>${p.name}</td><td>${p.current_balance.toFixed(2)}</td>`;
                });
            }
        };
    }

    /**
     * Report 3: Generates a project profitability summary.
     */
    async function generateProjectProfitabilityReport() {
        const projectStore = getObjectStore('projects', 'readonly');
        const transactionStore = getObjectStore('transactions', 'readonly');
        if (!projectStore || !transactionStore) return;

        const projectsRequest = projectStore.getAll();
        const transactionsRequest = transactionStore.getAll();

        // Use Promise.all to wait for both requests
        Promise.all([
            new Promise(resolve => projectsRequest.onsuccess = () => resolve(projectsRequest.result)),
            new Promise(resolve => transactionsRequest.onsuccess = () => resolve(transactionsRequest.result))
        ]).then(([projects, transactions]) => {
            const profitability = new Map();

            // Initialize map with all projects
            projects.forEach(p => {
                profitability.set(p.project_id, {
                    name: p.name,
                    revenue: 0,
                    expenses: 0
                });
            });

            // Aggregate transaction amounts
            transactions.forEach(t => {
                if (t.linked_project_id && profitability.has(t.linked_project_id)) {
                    const projectData = profitability.get(t.linked_project_id);
                    if (t.transaction_type === 'قبض') {
                        projectData.revenue += t.amount;
                    } else if (t.transaction_type === 'صرف') {
                        projectData.expenses += t.amount;
                    }
                }
            });

            // Render the report table
            projectReportBody.innerHTML = '';
            if (profitability.size === 0) {
                projectReportBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد بيانات.</td></tr>';
            } else {
                profitability.forEach(data => {
                    const net = data.revenue - data.expenses;
                    const netClass = net >= 0 ? 'text-success' : 'text-danger';
                    const row = projectReportBody.insertRow();
                    row.innerHTML = `
                        <td>${data.name}</td>
                        <td>${data.revenue.toFixed(2)}</td>
                        <td>${data.expenses.toFixed(2)}</td>
                        <td class="fw-bold ${netClass}">${net.toFixed(2)}</td>
                    `;
                });
            }
        });
    }

    // --- Observer ---
    const reportsSection = document.getElementById('reports-section');
    const observer = new MutationObserver(() => {
        if (db && !reportsSection.classList.contains('d-none')) {
            generateCashboxReport();
            generatePartnerBalanceReport();
            generateProjectProfitabilityReport();
        }
    });
    observer.observe(reportsSection, { attributes: true, attributeFilter: ['class'] });
});
