const VIRTUAL_CASHBOX_NAME = "خزنة التسويات";

/**
 * Checks if the virtual cashbox for settlements exists, and creates it if not.
 * This should be called once the database is initialized.
 */
function ensureVirtualCashboxExists() {
    if (!db) {
        console.error("DB not ready for virtual cashbox check.");
        return;
    }
    const tx = db.transaction('cashboxes', 'readwrite');
    const store = tx.objectStore('cashboxes');
    const index = store.index('name_idx');
    const request = index.get(VIRTUAL_CASHBOX_NAME);

    request.onsuccess = () => {
        if (!request.result) {
            // It doesn't exist, so create it.
            console.log(`Virtual cashbox "${VIRTUAL_CASHBOX_NAME}" not found, creating it.`);
            store.add({
                name: VIRTUAL_CASHBOX_NAME,
                initial_balance: 0,
                current_balance: 0
            });
        } else {
            console.log(`Virtual cashbox "${VIRTUAL_CASHBOX_NAME}" already exists.`);
        }
    };
    tx.onerror = (e) => {
        console.error("Error ensuring virtual cashbox exists:", e.target.error);
    };
}


document.addEventListener('DOMContentLoaded', () => {

    const cashboxForm = document.getElementById('cashbox-form');
    const cashboxesTableBody = document.getElementById('cashboxes-table-body');
    const cashboxModalEl = document.getElementById('cashboxModal');
    const cashboxModal = new bootstrap.Modal(cashboxModalEl);

    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    async function displayCashboxes() {
        const store = getObjectStore('cashboxes', 'readonly');
        if (!store) return;

        const request = store.getAll();
        request.onsuccess = () => {
            const cashboxes = request.result;
            cashboxesTableBody.innerHTML = '';
            if (cashboxes.length === 0) {
                cashboxesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد خزائن لعرضها.</td></tr>';
            } else {
                cashboxes.forEach(cashbox => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cashbox.cashbox_id}</td>
                        <td>${cashbox.name}</td>
                        <td>${cashbox.initial_balance.toFixed(2)}</td>
                        <td>${cashbox.current_balance.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${cashbox.cashbox_id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${cashbox.cashbox_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    cashboxesTableBody.appendChild(row);
                });
            }
        };
        request.onerror = (e) => console.error('Error fetching cashboxes:', e.target.error);
    }

    cashboxForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cashboxId = document.getElementById('cashbox-id').value;
        const initialBalance = parseFloat(document.getElementById('cashbox-initial-balance').value);

        const cashboxData = {
            name: document.getElementById('cashbox-name').value,
            initial_balance: initialBalance,
        };

        const store = getObjectStore('cashboxes', 'readwrite');
        if (!store) return;

        let request;
        if (cashboxId) {
            const getRequest = store.get(parseInt(cashboxId));
            getRequest.onsuccess = () => {
                const existingCashbox = getRequest.result;
                existingCashbox.name = cashboxData.name;
                const putRequest = store.put(existingCashbox);
                putRequest.onsuccess = () => {
                    cashboxForm.reset();
                    cashboxModal.hide();
                    displayCashboxes();
                };
                 putRequest.onerror = (e) => console.error('Error updating cashbox:', e.target.error);
            };
            getRequest.onerror = (e) => console.error('Error fetching cashbox for update:', e.target.error);
        } else {
            cashboxData.current_balance = initialBalance;
            request = store.add(cashboxData);
            request.onsuccess = () => {
                cashboxForm.reset();
                cashboxModal.hide();
                displayCashboxes();
            };
            request.onerror = (e) => console.error('Error adding cashbox:', e.target.error);
        }
    });

    cashboxesTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const cashboxId = parseInt(target.getAttribute('data-id'));
        if (target.classList.contains('edit-btn')) {
            handleEditCashbox(cashboxId);
        } else if (target.classList.contains('delete-btn')) {
            handleDeleteCashbox(cashboxId);
        }
    });

    function handleEditCashbox(id) {
        const store = getObjectStore('cashboxes', 'readonly');
        if (!store) return;
        const request = store.get(id);
        request.onsuccess = () => {
            const cashbox = request.result;
            if (cashbox) {
                document.getElementById('cashbox-id').value = cashbox.cashbox_id;
                document.getElementById('cashbox-name').value = cashbox.name;
                document.getElementById('cashbox-initial-balance').value = cashbox.initial_balance;
                document.getElementById('cashbox-initial-balance').disabled = true;
                cashboxModal.show();
            }
        };
    }

    function handleDeleteCashbox(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذه الخزنة؟')) {
            const store = getObjectStore('cashboxes', 'readwrite');
            if (!store) return;
            const request = store.delete(id);
            request.onsuccess = () => displayCashboxes();
            request.onerror = (e) => console.error('Error deleting cashbox:', e.target.error);
        }
    }

    cashboxModalEl.addEventListener('hidden.bs.modal', () => {
        cashboxForm.reset();
        document.getElementById('cashbox-id').value = '';
        document.getElementById('cashbox-initial-balance').disabled = false;
    });

    const cashboxesSection = document.getElementById('cashboxes-section');
    const observer = new MutationObserver(() => {
        if (db && !cashboxesSection.classList.contains('d-none')) {
            displayCashboxes();
        }
    });
    observer.observe(cashboxesSection, { attributes: true, attributeFilter: ['class'] });
});
