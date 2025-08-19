/**
 * Processes a transaction, updating all relevant balances.
 */
function processTransaction(transactionData) {
    if (!db) {
        alert('Database not ready. Please try again.');
        return;
    }
    const tx = db.transaction(['transactions', 'cashboxes', 'partners'], 'readwrite');
    const transStore = tx.objectStore('transactions');
    const cashboxStore = tx.objectStore('cashboxes');
    const partnerStore = tx.objectStore('partners');

    transStore.add(transactionData);

    if (transactionData.linked_cashbox_id) {
        const cashboxRequest = cashboxStore.get(transactionData.linked_cashbox_id);
        cashboxRequest.onsuccess = () => {
            const cashbox = cashboxRequest.result;
            if (transactionData.transaction_type === 'قبض') cashbox.current_balance += transactionData.amount;
            else cashbox.current_balance -= transactionData.amount;
            cashboxStore.put(cashbox);
        };
    }

    if (transactionData.linked_partner_id) {
        const partnerRequest = partnerStore.get(transactionData.linked_partner_id);
        partnerRequest.onsuccess = () => {
            const partner = partnerRequest.result;
            if (transactionData.is_partner_expense) {
                partner.current_balance += transactionData.amount;
            } else if (transactionData.transaction_type === 'قبض') {
                partner.current_balance += transactionData.amount;
            } else {
                partner.current_balance -= transactionData.amount;
            }
            partnerStore.put(partner);
        };
    }

    tx.oncomplete = () => {
        console.log('Transaction processed and balances updated.');
        if (typeof displayTransactions === 'function') {
            displayTransactions();
        }
    };
    tx.onerror = (e) => console.error("Transaction failed: ", e.target.error);
}


document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionsTableBody = document.getElementById('transactions-table-body');
    const transactionModalEl = document.getElementById('transactionModal');
    const transactionModal = new bootstrap.Modal(transactionModalEl);
    const transactionTypeSelect = document.getElementById('transaction-type');
    const paymentSourceSelector = document.getElementById('payment-source-selector');

    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }
    async function populateSelect(selectElement, storeName, fieldName) {
        selectElement.innerHTML = `<option value="">اختر...</option>`;
        const store = getObjectStore(storeName, 'readonly');
        if (!store) return;
        const request = store.getAll();
        request.onsuccess = () => {
            request.result.forEach(item => {
                selectElement.innerHTML += `<option value="${item[store.keyPath]}">${item[fieldName]}</option>`;
            });
        };
    }

    function updatePaymentSourceUI() {
        const type = transactionTypeSelect.value;
        paymentSourceSelector.innerHTML = '';
        if (type === 'قبض') {
            paymentSourceSelector.innerHTML = `<label for="transaction-cashbox" class="form-label">إلى خزنة</label><select class="form-select" id="transaction-cashbox" required></select>`;
            populateSelect(document.getElementById('transaction-cashbox'), 'cashboxes', 'name');
        } else {
            paymentSourceSelector.innerHTML = `
                <label class="form-label">تم الدفع بواسطة</label>
                <div class="form-check"><input class="form-check-input" type="radio" name="paymentSource" id="sourceCashbox" value="cashbox" checked><label class="form-check-label" for="sourceCashbox">خزنة</label></div>
                <div class="form-check"><input class="form-check-input" type="radio" name="paymentSource" id="sourcePartner" value="partner"><label class="form-check-label" for="sourcePartner">شريك</label></div>
                <div id="cashbox-payer-div" class="mt-2"><select class="form-select" id="transaction-cashbox-payer"></select></div>
                <div id="partner-payer-div" class="mt-2 d-none"><select class="form-select" id="transaction-partner-payer"></select></div>`;

            const cashboxDiv = document.getElementById('cashbox-payer-div');
            const partnerDiv = document.getElementById('partner-payer-div');
            populateSelect(document.getElementById('transaction-cashbox-payer'), 'cashboxes', 'name');
            populateSelect(document.getElementById('transaction-partner-payer'), 'partners', 'name');

            document.getElementById('sourceCashbox').addEventListener('change', () => {
                cashboxDiv.classList.remove('d-none');
                partnerDiv.classList.add('d-none');
            });
            document.getElementById('sourcePartner').addEventListener('change', () => {
                cashboxDiv.classList.add('d-none');
                partnerDiv.classList.remove('d-none');
            });
        }
    }

    window.displayTransactions = async function() {
        if (!db) return;
        const transStore = getObjectStore('transactions', 'readonly');
        if (!transStore) return;
        const request = transStore.getAll();
        request.onsuccess = async () => {
            const [transactions, projectMap, partnerMap, clientMap, supplierMap, cashboxMap] = await Promise.all([
                Promise.resolve(request.result),
                createDataMap('projects'),
                createDataMap('partners'),
                createDataMap('clients'),
                createDataMap('suppliers'),
                createDataMap('cashboxes')
            ]);

            transactionsTableBody.innerHTML = '';
            if (transactions.length === 0) {
                transactionsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">لا يوجد معاملات لعرضها.</td></tr>';
            } else {
                transactions.forEach(t => {
                    const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
                    let sourceOrDest = t.is_partner_expense ? `دفع بواسطة: ${partnerMap.get(t.linked_partner_id) || '?'}` : cashboxMap.get(t.linked_cashbox_id) || '?';
                    let partyName = '';
                    if (t.linked_client_id) partyName = `العميل: ${clientMap.get(t.linked_client_id) || '?'}`;
                    else if (t.linked_supplier_id) partyName = `المورد: ${supplierMap.get(t.linked_supplier_id) || '?'}`;
                    else if (t.linked_partner_id && !t.is_partner_expense) partyName = `الشريك: ${partnerMap.get(t.linked_partner_id) || '?'}`;
                    else if (t.linked_project_id) partyName = `المشروع: ${projectMap.get(t.linked_project_id) || '?'}`;

                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${t.transaction_id}</td><td class="${typeClass}"><b>${t.transaction_type}</b></td><td>${t.amount.toFixed(2)}</td><td>${t.date}</td><td>${t.description || ''}</td><td>${sourceOrDest}</td><td>${partyName}</td><td><button class="btn btn-sm btn-info edit-btn" data-id="${t.transaction_id}" disabled><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-danger delete-btn" data-id="${t.transaction_id}"><i class="fas fa-trash"></i></button></td>`;
                    transactionsTableBody.appendChild(row);
                });
            }
        };
    };

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

    transactionModalEl.addEventListener('show.bs.modal', () => {
        populateSelect(document.getElementById('transaction-project'), 'projects', 'name');
        populateSelect(document.getElementById('transaction-partner'), 'partners', 'name');
        populateSelect(document.getElementById('transaction-client'), 'clients', 'name');
        populateSelect(document.getElementById('transaction-supplier'), 'suppliers', 'name');
        updatePaymentSourceUI();
    });
    transactionTypeSelect.addEventListener('change', updatePaymentSourceUI);

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transactionData = {
            transaction_type: transactionTypeSelect.value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            date: document.getElementById('transaction-date').value,
            description: document.getElementById('transaction-description').value,
            linked_project_id: parseInt(document.getElementById('transaction-project').value) || null,
            linked_partner_id: parseInt(document.getElementById('transaction-partner').value) || null,
            linked_client_id: parseInt(document.getElementById('transaction-client').value) || null,
            linked_supplier_id: parseInt(document.getElementById('transaction-supplier').value) || null,
            is_partner_expense: false,
            linked_cashbox_id: null,
        };

        if (transactionData.transaction_type === 'قبض') {
            transactionData.linked_cashbox_id = parseInt(document.getElementById('transaction-cashbox').value);
        } else {
            const paymentSource = document.querySelector('input[name="paymentSource"]:checked').value;
            if (paymentSource === 'cashbox') {
                transactionData.linked_cashbox_id = parseInt(document.getElementById('transaction-cashbox-payer').value);
            } else {
                transactionData.linked_partner_id = parseInt(document.getElementById('transaction-partner-payer').value);
                transactionData.is_partner_expense = true;
            }
        }

        processTransaction(transactionData);
        // Add timeout to prevent race condition with modal closing animation
        setTimeout(() => {
            transactionModal.hide();
            transactionForm.reset();
        }, 200);
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

            const getRequest = transStore.get(transactionId);
            getRequest.onsuccess = () => {
                const transaction = getRequest.result;
                if (!transaction) return;

                if (transaction.linked_cashbox_id) {
                    const cashboxRequest = cashboxStore.get(transaction.linked_cashbox_id);
                    cashboxRequest.onsuccess = () => {
                        const cashbox = cashboxRequest.result;
                        if (transaction.transaction_type === 'قبض') cashbox.current_balance -= transaction.amount;
                        else cashbox.current_balance += transaction.amount;
                        cashboxStore.put(cashbox);
                    };
                }
                if (transaction.linked_partner_id) {
                    const partnerRequest = partnerStore.get(transaction.linked_partner_id);
                    partnerRequest.onsuccess = () => {
                        const partner = partnerRequest.result;
                        if (transaction.is_partner_expense) partner.current_balance -= transaction.amount;
                        else if (transaction.transaction_type === 'قبض') partner.current_balance -= transaction.amount;
                        else partner.current_balance += transaction.amount;
                        partnerStore.put(partner);
                    };
                }

                if (transaction.linked_invoice_id) tx.objectStore('invoices').delete(transaction.linked_invoice_id);
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
