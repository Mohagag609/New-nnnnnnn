/**
 * Processes a transaction, updating all relevant balances (cashbox, partner).
 * This function is global so it can be called from other modules like settlements.
 */
function processTransaction(transactionData) {
    // This function needs access to the 'db' variable, which is also global.
    if (!db) {
        alert('Database not ready. Please try again.');
        return;
    }
    const tx = db.transaction(['transactions', 'cashboxes', 'partners'], 'readwrite');
    const transStore = tx.objectStore('transactions');
    const cashboxStore = tx.objectStore('cashboxes');
    const partnerStore = tx.objectStore('partners');

    transStore.add(transactionData);

    // Update Cashbox Balance
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

    // Update Partner Balance if linked
    if (transactionData.linked_partner_id) {
        const partnerRequest = partnerStore.get(transactionData.linked_partner_id);
        partnerRequest.onsuccess = () => {
            const partner = partnerRequest.result;
            if (transactionData.transaction_type === 'قبض') { // Receipt from partner
                partner.current_balance += transactionData.amount;
            } else { // Payment to partner
                partner.current_balance -= transactionData.amount;
            }
            partnerStore.put(partner);
        };
    }

    tx.oncomplete = () => {
        console.log('Transaction processed and balances updated.');
        // Refresh the main transaction list after any transaction
        if (typeof displayTransactions === 'function') {
            displayTransactions();
        }
    };
    tx.onerror = (e) => console.error("Transaction failed: ", e.target.error);
}


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

    async function populateSelect(storeName, selectElementId, fieldName) {
        const selectElement = document.getElementById(selectElementId);
        selectElement.innerHTML = `<option value="">اختر...</option>`;
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

    // This function needs to be available to the global processTransaction function
    window.displayTransactions = async function() {
        if (!db) { return; }
        const transStore = getObjectStore('transactions', 'readonly');
        if (!transStore) return;
        const request = transStore.getAll();
        request.onsuccess = async () => {
            const transactions = request.result;
            const dataMaps = await createAllDataMaps();
            transactionsTableBody.innerHTML = '';
            if (transactions.length === 0) {
                transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">لا يوجد معاملات لعرضها.</td></tr>';
            } else {
                transactions.forEach(t => {
                    const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
                    const cashboxName = dataMaps.cashboxes.get(t.linked_cashbox_id) || 'N/A';
                    let partyName = '';
                    if (t.linked_client_id) partyName = `العميل: ${dataMaps.clients.get(t.linked_client_id) || '?'}`;
                    else if (t.linked_supplier_id) partyName = `المورد: ${dataMaps.suppliers.get(t.linked_supplier_id) || '?'}`;
                    else if (t.linked_partner_id) partyName = `الشريك: ${dataMaps.partners.get(t.linked_partner_id) || '?'}`;
                    else if (t.linked_project_id) partyName = `المشروع: ${dataMaps.projects.get(t.linked_project_id) || '?'}`;
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${t.transaction_id}</td><td class="${typeClass}"><b>${t.transaction_type}</b></td><td>${t.amount.toFixed(2)}</td><td>${t.date}</td><td>${t.description || ''}</td><td>${cashboxName}</td><td>${partyName}</td><td><button class="btn btn-sm btn-info edit-btn" data-id="${t.transaction_id}" disabled><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger delete-btn" data-id="${t.transaction_id}"><i class="fas fa-trash"></i></button></td>`;
                    transactionsTableBody.appendChild(row);
                });
            }
        };
    }

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
                request.onerror = () => resolve(new Map());
            });
        }
        return map;
    }

    // --- Event Listeners ---
    transactionModalEl.addEventListener('show.bs.modal', () => {
        populateSelect('cashboxes', 'transaction-cashbox', 'name');
        populateSelect('projects', 'transaction-project', 'name');
        populateSelect('partners', 'transaction-partner', 'name');
        populateSelect('clients', 'transaction-client', 'name');
        populateSelect('suppliers', 'transaction-supplier', 'name');
    });

    isInvoiceCheck.addEventListener('change', () => {
        invoiceFields.classList.toggle('d-none', !isInvoiceCheck.checked);
    });

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

        if (isInvoiceCheck.checked) {
            const invoiceData = {
                invoice_number: document.getElementById('invoice-number').value,
                amount: transactionData.amount,
                status: 'غير مدفوعة',
                due_date: document.getElementById('invoice-due-date').value,
                linked_client_id: transactionData.linked_client_id,
            };
            const invoiceStore = getObjectStore('invoices', 'readwrite');
            const invRequest = invoiceStore.add(invoiceData);
            invRequest.onsuccess = (event) => {
                transactionData.linked_invoice_id = event.target.result;
                processTransaction(transactionData); // Call global function
                transactionModal.hide();
                transactionForm.reset();
            };
            invRequest.onerror = (e) => console.error("Error adding invoice", e.target.error);
        } else {
            processTransaction(transactionData); // Call global function
            transactionModal.hide();
            transactionForm.reset();
        }
    });

    transactionsTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button.delete-btn');
        if (!target) return;
        const transactionId = parseInt(target.getAttribute('data-id'));
        if (confirm('هل أنت متأكد أنك تريد حذف هذه المعاملة؟ سيتم التراجع عن تأثيرها على جميع الأرصدة المرتبطة.')) {
            const tx = db.transaction(['transactions', 'cashboxes', 'partners', 'invoices'], 'readwrite');
            const transStore = tx.objectStore('transactions');
            const cashboxStore = tx.objectStore('cashboxes');
            const partnerStore = tx.objectStore('partners');
            const invoiceStore = tx.objectStore('invoices');

            const getRequest = transStore.get(transactionId);
            getRequest.onsuccess = () => {
                const transaction = getRequest.result;
                if (!transaction) return;

                // Reverse cashbox balance
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

                // Reverse partner balance if linked
                if (transaction.linked_partner_id) {
                    const partnerRequest = partnerStore.get(transaction.linked_partner_id);
                    partnerRequest.onsuccess = () => {
                        const partner = partnerRequest.result;
                        if (transaction.transaction_type === 'قبض') {
                            partner.current_balance -= transaction.amount;
                        } else {
                            partner.current_balance += transaction.amount;
                        }
                        partnerStore.put(partner);
                    };
                }

                if (transaction.linked_invoice_id) {
                    invoiceStore.delete(transaction.linked_invoice_id);
                }
                transStore.delete(transactionId);
            };
            tx.oncomplete = () => {
                console.log('Transaction deleted and balances reversed.');
                displayTransactions();
            };
            tx.onerror = (e) => console.error('Error deleting transaction:', e.target.error);
        }
    });

    const transactionsSection = document.getElementById('transactions-section');
    const observer = new MutationObserver(() => {
        if (db && !transactionsSection.classList.contains('d-none')) {
            displayTransactions();
        }
    });
    observer.observe(transactionsSection, { attributes: true, attributeFilter: ['class'] });
});
