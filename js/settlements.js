document.addEventListener('DOMContentLoaded', () => {

    // This module is now a simplified UI for creating a partner-linked transaction.
    // The core logic is handled by the global processTransaction function.

    // --- Element Selectors ---
    const settlementForm = document.getElementById('settlement-form');
    const settlementModalEl = document.getElementById('settlementModal');
    const settlementModal = new bootstrap.Modal(settlementModalEl);
    const partnerSelect = document.getElementById('settlement-partner');
    const balanceDisplay = document.getElementById('partner-current-balance-display');

    // --- Helper Functions (assuming these are globally available or defined in other scripts) ---
    // Note: To make this truly robust, populateSelect and getObjectStore should be moved to a shared utils.js file.
    // For now, we'll redefine a minimal version here.
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

    // --- Main Logic ---

    // Populate dropdowns when the modal is about to open
    settlementModalEl.addEventListener('show.bs.modal', () => {
        populateSelect('partners', 'settlement-partner', 'name');
        populateSelect('cashboxes', 'settlement-cashbox', 'name');
        balanceDisplay.value = ''; // Clear display on open
    });

    // Update balance display when a partner is selected
    partnerSelect.addEventListener('change', async () => {
        const partnerId = parseInt(partnerSelect.value);
        if (!partnerId) {
            balanceDisplay.value = '';
            return;
        }
        const store = getObjectStore('partners', 'readonly');
        const request = store.get(partnerId);
        request.onsuccess = () => {
            const partner = request.result;
            if (partner) {
                balanceDisplay.value = partner.current_balance.toFixed(2);
            }
        };
    });

    /**
     * Handles the settlement form submission by creating a transaction.
     */
    settlementForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // The settlement UI now creates a standard transaction
        const transactionData = {
            transaction_type: document.getElementById('settlement-type').value,
            amount: parseFloat(document.getElementById('settlement-amount').value),
            date: document.getElementById('settlement-date').value,
            description: `تسوية: ${document.getElementById('settlement-description').value}`,
            linked_cashbox_id: parseInt(document.getElementById('settlement-cashbox').value),
            linked_partner_id: parseInt(document.getElementById('settlement-partner').value),
            // These are not part of the settlement UI, so they are null
            linked_project_id: null,
            linked_client_id: null,
            linked_supplier_id: null,
            linked_invoice_id: null,
        };

        // Validate required fields
        if (!transactionData.linked_cashbox_id || !transactionData.linked_partner_id || !transactionData.amount) {
            alert('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }

        // Call the global transaction processor from transactions.js
        // This is a dependency. Assumes transactions.js is loaded and processTransaction is global.
        if (typeof processTransaction === 'function') {
            processTransaction(transactionData);
            settlementModal.hide();
            settlementForm.reset();
        } else {
            alert('خطأ: وظيفة معالجة المعاملات غير متاحة. الرجاء تحديث الصفحة والمحاولة مرة أخرى.');
            console.error('processTransaction function is not defined globally.');
        }
    });

    // Since this module no longer manages its own table, we remove the display and delete logic.
    // The result of a settlement will be visible in the main Transactions list.
    // We can clear the old table body for cleanliness.
    const settlementsTableBody = document.getElementById('settlements-table-body');
    if(settlementsTableBody) {
        settlementsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">يتم عرض التسويات كمعاملات في <a href="#" onclick="document.querySelector(`[data-section=transactions]`).click()">قائمة المعاملات</a>.</td></tr>';
    }
});
