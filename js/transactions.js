document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const transactionForm = document.getElementById('transaction-form');
    const transactionsTableBody = document.getElementById('transactions-table-body');
    const transactionModalEl = document.getElementById('transactionModal');
    const transactionModal = new bootstrap.Modal(transactionModalEl);
    const isInvoiceCheck = document.getElementById('is-invoice-check');
    const invoiceFields = document.getElementById('invoice-fields');

    // --- Helper Functions ---
    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    // Generic function to populate a select dropdown
    async function populateSelect(storeName, selectElementId, fieldName) {
        const selectElement = document.getElementById(selectElementId);
        selectElement.innerHTML = `<option value="">اختر...</option>`; // Reset
        const store = getObjectStore(storeName, 'readonly');
        if (!store) return;
        const request = store.getAll();
        request.onsuccess = () => {
            request.result.forEach(item => {
                const option = document.createElement('option');
                option.value = item[store.keyPath];
                option.textContent = item[fieldName];
                selectElement.appendChild(option);
            });
        };
    }

    // --- Main Logic ---

    // Populate all dropdowns when the modal is about to open
    transactionModalEl.addEventListener('show.bs.modal', () => {
        populateSelect('cashboxes', 'transaction-cashbox', 'name');
        populateSelect('projects', 'transaction-project', 'name');
        populateSelect('partners', 'transaction-partner', 'name');
        populateSelect('clients', 'transaction-client', 'name');
        populateSelect('suppliers', 'transaction-supplier', 'name');
    });

    // Toggle invoice fields visibility
    isInvoiceCheck.addEventListener('change', () => {
        invoiceFields.classList.toggle('d-none', !isInvoiceCheck.checked);
    });

    /**
     * Fetches and displays all transactions with resolved names.
     */
    async function displayTransactions() {
        if (!db) { return; }

        const transStore = getObjectStore('transactions', 'readonly');
        if (!transStore) return;

        const request = transStore.getAll();
        request.onsuccess = async () => {
            const transactions = request.result;
            // Create maps for all related entities for efficient lookup
            const dataMaps = await createAllDataMaps();

            transactionsTableBody.innerHTML = '';
            if (transactions.length === 0) {
                transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">لا يوجد معاملات لعرضها.</td></tr>';
            } else {
                transactions.forEach(t => {
                    const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
                    const cashboxName = dataMaps.cashboxes.get(t.linked_cashbox_id) || 'N/A';

                    // Determine the "party" (client, supplier, partner)
                    let partyName = '';
                    if (t.linked_client_id) partyName = `العميل: ${dataMaps.clients.get(t.linked_client_id) || '?'}`;
                    else if (t.linked_supplier_id) partyName = `المورد: ${dataMaps.suppliers.get(t.linked_supplier_id) || '?'}`;
                    else if (t.linked_partner_id) partyName = `الشريك: ${dataMaps.partners.get(t.linked_partner_id) || '?'}`;
                    else if (t.linked_project_id) partyName = `المشروع: ${dataMaps.projects.get(t.linked_project_id) || '?'}`;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${t.transaction_id}</td>
                        <td class="${typeClass}"><b>${t.transaction_type}</b></td>
                        <td>${t.amount.toFixed(2)}</td>
                        <td>${t.date}</td>
                        <td>${t.description || ''}</td>
                        <td>${cashboxName}</td>
                        <td>${partyName}</td>
                        <td>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${t.transaction_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    transactionsTableBody.appendChild(row);
                });
            }
        };
    }

    // Helper to create maps of all related data for display
    async function createAllDataMaps() {
        const stores = ['projects', 'partners', 'clients', 'suppliers', 'cashboxes'];
        const map = {};
        for (const storeName of stores) {
            map[storeName] = await new Promise(resolve => {
                const store = getObjectStore(storeName, 'readonly');
                const request = store.getAll();
                request.onsuccess = () => {
                    const dataMap = new Map(request.result.map(item => [item[store.keyPath], item.name]));
                    resolve(dataMap);
                };
                request.onerror = () => resolve(new Map()); // Resolve with empty map on error
            });
        }
        return map;
    }

    /**
     * Handles the complex logic of submitting the transaction form.
     */
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transactionData = {
            transaction_type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            date: document.getElementById('transaction-date').value,
            description: document.getElementById('transaction-description').value,
            linked_cashbox_id: parseInt(document.getElementById('transaction-cashbox').value),
            linked_project_id: parseInt(document.getElementById('transaction-project').value) || null,
            linked_partner_id: parseInt(document.getElementById('transaction-partner').value) || null,
            linked_client_id: parseInt(document.getElementById('transaction-client').value) || null,
            linked_supplier_id: parseInt(document.getElementById('transaction-supplier').value) || null,
        };

        // --- Step 1: Handle Invoice Creation (if applicable) ---
        if (isInvoiceCheck.checked) {
            const invoiceData = {
                invoice_number: document.getElementById('invoice-number').value,
                amount: transactionData.amount,
                status: 'غير مدفوعة', // Invoices start as unpaid
                due_date: document.getElementById('invoice-due-date').value,
                linked_client_id: transactionData.linked_client_id, // Or supplier
            };
            const invoiceStore = getObjectStore('invoices', 'readwrite');
            const invRequest = invoiceStore.add(invoiceData);

            // This is tricky without promises. We'll nest the callbacks.
            invRequest.onsuccess = (event) => {
                transactionData.linked_invoice_id = event.target.result; // Get new invoice ID
                // Proceed to add transaction and update cashbox
                addTransactionAndUpdateCashbox(transactionData);
            };
            invRequest.onerror = (e) => console.error("Error adding invoice", e.target.error);
        } else {
            // No invoice, just add the transaction
            addTransactionAndUpdateCashbox(transactionData);
        }
    });

    /**
     * Adds the transaction and updates cashbox balance in one go.
     */
    function addTransactionAndUpdateCashbox(transactionData) {
        const tx = db.transaction(['transactions', 'cashboxes'], 'readwrite');
        const transStore = tx.objectStore('transactions');
        const cashboxStore = tx.objectStore('cashboxes');

        // 1. Add the transaction
        transStore.add(transactionData);

        // 2. Update the cashbox balance
        const cashboxRequest = cashboxStore.get(transactionData.linked_cashbox_id);
        cashboxRequest.onsuccess = () => {
            const cashbox = cashboxRequest.result;
            if (transactionData.transaction_type === 'قبض') {
                cashbox.current_balance += transactionData.amount;
            } else {
                cashbox.current_balance -= transactionData.amount;
            }
            cashboxStore.put(cashbox);
        };

        tx.oncomplete = () => {
            console.log('Transaction and cashbox update complete.');
            transactionForm.reset();
            isInvoiceCheck.checked = false;
            invoiceFields.classList.add('d-none');
            transactionModal.hide();
            displayTransactions();
            // We should also refresh the cashbox view if it's visible
            // This requires a bit more complex eventing system or a global refresh function
        };

        tx.onerror = (e) => console.error("Transaction failed: ", e.target.error);
    }

    // --- Delete Logic ---
    transactionsTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button.delete-btn');
        if (!target) return;

        const transactionId = parseInt(target.getAttribute('data-id'));
        if (confirm('هل أنت متأكد أنك تريد حذف هذه المعاملة؟ سيتم التراجع عن تأثيرها على رصيد الخزنة.')) {
            const tx = db.transaction(['transactions', 'cashboxes', 'invoices'], 'readwrite');
            const transStore = tx.objectStore('transactions');
            const cashboxStore = tx.objectStore('cashboxes');
            const invoiceStore = tx.objectStore('invoices');

            // First, get the transaction to know how to reverse its effects
            const getRequest = transStore.get(transactionId);
            getRequest.onsuccess = () => {
                const transaction = getRequest.result;
                if (!transaction) return;

                // Reverse the cashbox balance
                const cashboxRequest = cashboxStore.get(transaction.linked_cashbox_id);
                cashboxRequest.onsuccess = () => {
                    const cashbox = cashboxRequest.result;
                    if (transaction.transaction_type === 'قبض') {
                        cashbox.current_balance -= transaction.amount;
                    } else {
                        cashbox.current_balance += transaction.amount;
                    }
                    cashboxStore.put(cashbox);
                };

                // Delete the linked invoice, if it exists
                if (transaction.linked_invoice_id) {
                    invoiceStore.delete(transaction.linked_invoice_id);
                }

                // Finally, delete the transaction itself
                transStore.delete(transactionId);
            };

            tx.oncomplete = () => {
                console.log('Transaction deleted and balance reversed.');
                displayTransactions();
            };
            tx.onerror = (e) => console.error('Error deleting transaction:', e.target.error);
        }
    });


    // Initial display
    const transactionsSection = document.getElementById('transactions-section');
    const observer = new MutationObserver(() => {
        if (db && !transactionsSection.classList.contains('d-none')) {
            displayTransactions();
        }
    });
    observer.observe(transactionsSection, { attributes: true, attributeFilter: ['class'] });

});
