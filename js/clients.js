document.addEventListener('DOMContentLoaded', () => {

    const clientForm = document.getElementById('client-form');
    const clientsTableBody = document.getElementById('clients-table-body');
    const clientModalEl = document.getElementById('clientModal');
    const clientModal = new bootstrap.Modal(clientModalEl);

    // Assuming db is initialized and global from db.js
    function getObjectStore(storeName, mode) {
        if (!db) {
            console.error('Database not initialized!');
            return null;
        }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    /**
     * Fetches all clients and displays them in the table.
     */
    async function displayClients() {
        const store = getObjectStore('clients', 'readonly');
        if (!store) return;

        const request = store.getAll();
        request.onsuccess = () => {
            const clients = request.result;
            clientsTableBody.innerHTML = '';
            if (clients.length === 0) {
                clientsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد عملاء لعرضهم.</td></tr>';
            } else {
                clients.forEach(client => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${client.client_id}</td>
                        <td>${client.name}</td>
                        <td>${client.email || ''}</td>
                        <td>${client.phone || ''}</td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${client.client_id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${client.client_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    clientsTableBody.appendChild(row);
                });
            }
        };
        request.onerror = (e) => console.error('Error fetching clients:', e.target.error);
    }

    /**
     * Handles form submission for adding/editing a client.
     */
    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
        };

        const clientId = document.getElementById('client-id').value;
        const store = getObjectStore('clients', 'readwrite');
        if (!store) return;

        let request;
        if (clientId) {
            clientData.client_id = parseInt(clientId);
            request = store.put(clientData);
        } else {
            request = store.add(clientData);
        }

        request.onsuccess = () => {
            clientForm.reset();
            clientModal.hide();
            setTimeout(displayClients, 200);
        };
        request.onerror = (e) => console.error('Error saving client:', e.target.error);
    });

    /**
     * Handles edit and delete button clicks.
     */
    clientsTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const clientId = parseInt(target.getAttribute('data-id'));

        if (target.classList.contains('edit-btn')) {
            handleEditClient(clientId);
        } else if (target.classList.contains('delete-btn')) {
            handleDeleteClient(clientId);
        }
    });

    function handleEditClient(id) {
        const store = getObjectStore('clients', 'readonly');
        if (!store) return;

        const request = store.get(id);
        request.onsuccess = () => {
            const client = request.result;
            if (client) {
                document.getElementById('client-id').value = client.client_id;
                document.getElementById('client-name').value = client.name;
                document.getElementById('client-email').value = client.email;
                document.getElementById('client-phone').value = client.phone;
                clientModal.show();
            }
        };
    }

    function handleDeleteClient(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا العميل؟')) {
            const store = getObjectStore('clients', 'readwrite');
            if (!store) return;

            const request = store.delete(id);
            request.onsuccess = () => displayClients();
            request.onerror = (e) => console.error('Error deleting client:', e.target.error);
        }
    }

    // Reset form when modal is hidden
    clientModalEl.addEventListener('hidden.bs.modal', () => {
        clientForm.reset();
        document.getElementById('client-id').value = '';
    });

    // Display clients when the section becomes visible
    const clientsSection = document.getElementById('clients-section');
    const observer = new MutationObserver(() => {
        if (db && !clientsSection.classList.contains('d-none')) {
            displayClients();
        }
    });
    observer.observe(clientsSection, { attributes: true, attributeFilter: ['class'] });
});
