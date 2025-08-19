document.addEventListener('DOMContentLoaded', () => {

    const supplierForm = document.getElementById('supplier-form');
    const suppliersTableBody = document.getElementById('suppliers-table-body');
    const supplierModalEl = document.getElementById('supplierModal');
    const supplierModal = new bootstrap.Modal(supplierModalEl);

    function getObjectStore(storeName, mode) {
        if (!db) {
            console.error('Database not initialized!');
            return null;
        }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    async function displaySuppliers() {
        const store = getObjectStore('suppliers', 'readonly');
        if (!store) return;

        const request = store.getAll();
        request.onsuccess = () => {
            const suppliers = request.result;
            suppliersTableBody.innerHTML = '';
            if (suppliers.length === 0) {
                suppliersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد موردين لعرضهم.</td></tr>';
            } else {
                suppliers.forEach(supplier => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${supplier.supplier_id}</td>
                        <td>${supplier.name}</td>
                        <td>${supplier.contact || ''}</td>
                        <td>${supplier.phone || ''}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${supplier.supplier_id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${supplier.supplier_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    suppliersTableBody.appendChild(row);
                });
            }
        };
        request.onerror = (e) => console.error('Error fetching suppliers:', e.target.error);
    }

    supplierForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const supplierData = {
            name: document.getElementById('supplier-name').value,
            contact: document.getElementById('supplier-contact').value,
            phone: document.getElementById('supplier-phone').value,
        };

        const supplierId = document.getElementById('supplier-id').value;
        const store = getObjectStore('suppliers', 'readwrite');
        if (!store) return;

        let request;
        if (supplierId) {
            supplierData.supplier_id = parseInt(supplierId);
            request = store.put(supplierData);
        } else {
            request = store.add(supplierData);
        }

        request.onsuccess = () => {
            supplierForm.reset();
            supplierModal.hide();
            displaySuppliers();
        };
        request.onerror = (e) => console.error('Error saving supplier:', e.target.error);
    });

    suppliersTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const supplierId = parseInt(target.getAttribute('data-id'));

        if (target.classList.contains('edit-btn')) {
            handleEditSupplier(supplierId);
        } else if (target.classList.contains('delete-btn')) {
            handleDeleteSupplier(supplierId);
        }
    });

    function handleEditSupplier(id) {
        const store = getObjectStore('suppliers', 'readonly');
        if (!store) return;

        const request = store.get(id);
        request.onsuccess = () => {
            const supplier = request.result;
            if (supplier) {
                document.getElementById('supplier-id').value = supplier.supplier_id;
                document.getElementById('supplier-name').value = supplier.name;
                document.getElementById('supplier-contact').value = supplier.contact;
                document.getElementById('supplier-phone').value = supplier.phone;
                supplierModal.show();
            }
        };
    }

    function handleDeleteSupplier(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا المورد؟')) {
            const store = getObjectStore('suppliers', 'readwrite');
            if (!store) return;

            const request = store.delete(id);
            request.onsuccess = () => displaySuppliers();
            request.onerror = (e) => console.error('Error deleting supplier:', e.target.error);
        }
    }

    supplierModalEl.addEventListener('hidden.bs.modal', () => {
        supplierForm.reset();
        document.getElementById('supplier-id').value = '';
    });

    const suppliersSection = document.getElementById('suppliers-section');
    const observer = new MutationObserver(() => {
        if (db && !suppliersSection.classList.contains('d-none')) {
            displaySuppliers();
        }
    });
    observer.observe(suppliersSection, { attributes: true, attributeFilter: ['class'] });
});
