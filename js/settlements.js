document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selectors ---
    const settlementForm = document.getElementById('settlement-form');
    const settlementsTableBody = document.getElementById('settlements-table-body');
    const settlementModalEl = document.getElementById('settlementModal');
    const settlementModal = new bootstrap.Modal(settlementModalEl);
    const partnerSelect = document.getElementById('settlement-partner');
    const balanceDisplay = document.getElementById('partner-current-balance-display');

    // --- Helper Functions ---
    function getObjectStore(storeName, mode) {
        if (!db) { console.error('Database not initialized!'); return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    // Generic function to populate a select dropdown
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
        populateSelect('projects', 'settlement-project', 'name');
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
     * Fetches and displays all settlements.
     */
    async function displaySettlements() {
        if (!db) { return; }
        const store = getObjectStore('settlements', 'readonly');
        if (!store) return;

        const request = store.getAll();
        request.onsuccess = async () => {
            const settlements = request.result;
            const partnerMap = await createDataMap('partners');
            const projectMap = await createDataMap('projects');

            settlementsTableBody.innerHTML = '';
            if (settlements.length === 0) {
                settlementsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد تسويات لعرضها.</td></tr>';
            } else {
                settlements.forEach(s => {
                    const partnerName = partnerMap.get(s.partner_id) || '?';
                    const projectName = projectMap.get(s.linked_project_id) || '?';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${s.settlement_id}</td>
                        <td>${s.date}</td>
                        <td>${partnerName}</td>
                        <td>${projectName}</td>
                        <td>${s.payment_amount.toFixed(2)}</td>
                        <td>${s.final_balance.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${s.settlement_id}" disabled><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${s.settlement_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    settlementsTableBody.appendChild(row);
                });
            }
        };
    }

    async function createDataMap(storeName) {
        return new Promise(resolve => {
            const store = getObjectStore(storeName, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => {
                const dataMap = new Map(request.result.map(item => [item[store.keyPath], item.name]));
                resolve(dataMap);
            };
            request.onerror = () => resolve(new Map());
        });
    }

    /**
     * Handles the settlement form submission.
     */
    settlementForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const settlementData = {
            partner_id: parseInt(document.getElementById('settlement-partner').value),
            linked_project_id: parseInt(document.getElementById('settlement-project').value),
            payment_amount: parseFloat(document.getElementById('settlement-amount').value),
            date: document.getElementById('settlement-date').value,
        };

        const tx = db.transaction(['settlements', 'partners'], 'readwrite');
        const settlementStore = tx.objectStore('settlements');
        const partnerStore = tx.objectStore('partners');

        const partnerRequest = partnerStore.get(settlementData.partner_id);

        partnerRequest.onsuccess = () => {
            const partner = partnerRequest.result;
            if (!partner) {
                console.error("Partner not found!");
                tx.abort();
                return;
            }

            // Populate settlement record with balance info
            settlementData.previous_balance = partner.current_balance;
            settlementData.final_balance = partner.current_balance - settlementData.payment_amount;
            settlementData.outstanding_amount = settlementData.final_balance; // As per spec

            // Update partner's balance
            partner.current_balance = settlementData.final_balance;

            // Save both records
            partnerStore.put(partner);
            settlementStore.add(settlementData);
        };

        tx.oncomplete = () => {
            console.log('Settlement complete, partner balance updated.');
            settlementForm.reset();
            balanceDisplay.value = '';
            settlementModal.hide();
            displaySettlements();
            // We should also update the partners view if it's visible
        };

        tx.onerror = (e) => {
            console.error('Error during settlement transaction:', e.target.error);
        };
    });

    settlementsTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button.delete-btn');
        if (!target) return;

        const settlementId = parseInt(target.getAttribute('data-id'));
        if (confirm('هل أنت متأكد أنك تريد حذف هذه التسوية؟ سيتم استرجاع المبلغ إلى رصيد الشريك.')) {
            handleDeleteSettlement(settlementId);
        }
    });

    function handleDeleteSettlement(settlementId) {
        const tx = db.transaction(['settlements', 'partners'], 'readwrite');
        const settlementStore = tx.objectStore('settlements');
        const partnerStore = tx.objectStore('partners');

        const settlementRequest = settlementStore.get(settlementId);

        settlementRequest.onsuccess = () => {
            const settlement = settlementRequest.result;
            if (!settlement) {
                console.error("Settlement not found!");
                tx.abort();
                return;
            }

            const partnerRequest = partnerStore.get(settlement.partner_id);
            partnerRequest.onsuccess = () => {
                const partner = partnerRequest.result;
                if (!partner) {
                    console.error("Associated partner not found!");
                    tx.abort();
                    return;
                }

                // Reverse the settlement amount
                partner.current_balance += settlement.payment_amount;

                partnerStore.put(partner);
                settlementStore.delete(settlementId);
            };
        };

        tx.oncomplete = () => {
            console.log('Settlement deleted and partner balance restored.');
            displaySettlements();
        };

        tx.onerror = (e) => {
            console.error('Error deleting settlement:', e.target.error);
        };
    }

    // Initial display
    const settlementsSection = document.getElementById('settlements-section');
    const observer = new MutationObserver(() => {
        if (db && !settlementsSection.classList.contains('d-none')) {
            displaySettlements();
        }
    });
    observer.observe(settlementsSection, { attributes: true, attributeFilter: ['class'] });
});
