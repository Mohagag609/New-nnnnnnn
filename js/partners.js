document.addEventListener('DOMContentLoaded', () => {

    const partnerForm = document.getElementById('partner-form');
    const partnersTableBody = document.getElementById('partners-table-body');
    const partnerModalEl = document.getElementById('partnerModal');
    const partnerModal = new bootstrap.Modal(partnerModalEl);
    const projectSelect = document.getElementById('partner-project');

    // --- Database Helper Functions ---
    function getObjectStore(storeName, mode) {
        // Ensure db is ready
        if (!db) {
            console.error("Database not initialized");
            return;
        }
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    /**
     * Loads all projects into the select dropdown in the partner modal.
     */
    async function loadProjectsIntoSelect() {
        const store = getObjectStore('projects', 'readonly');
        if (!store) return;

        const request = store.getAll();
        request.onsuccess = () => {
            const projects = request.result;
            projectSelect.innerHTML = '<option value="">اختر مشروع...</option>'; // Reset
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.project_id;
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        };
        request.onerror = (event) => {
            console.error('Error loading projects into select:', event.target.error);
        };
    }

    /**
     * Fetches all partners and their corresponding project names.
     */
    async function displayPartners() {
        if (!db) {
            console.error('Database is not initialized.');
            return;
        }

        // 1. Get all projects and create a map for quick lookup
        const projectsStore = getObjectStore('projects', 'readonly');
        const projectsRequest = projectsStore.getAll();

        projectsRequest.onsuccess = () => {
            const projects = projectsRequest.result;
            const projectMap = new Map(projects.map(p => [p.project_id, p.name]));

            // 2. Get all partners
            const partnersStore = getObjectStore('partners', 'readonly');
            const partnersRequest = partnersStore.getAll();

            partnersRequest.onsuccess = () => {
                const partners = partnersRequest.result;
                partnersTableBody.innerHTML = ''; // Clear existing rows
                if (partners.length === 0) {
                    partnersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد شركاء لعرضهم.</td></tr>';
                } else {
                    partners.forEach(partner => {
                        const projectName = projectMap.get(parseInt(partner.project_id)) || 'N/A';
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${partner.partner_id}</td>
                            <td>${partner.name}</td>
                            <td>${partner.share_percentage}</td>
                            <td>${projectName}</td>
                            <td>${partner.current_balance || 0}</td>
                            <td>
                                <button class="btn btn-sm btn-info edit-btn" data-id="${partner.partner_id}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger delete-btn" data-id="${partner.partner_id}"><i class="fas fa-trash"></i></button>
                            </td>
                        `;
                        partnersTableBody.appendChild(row);
                    });
                }
            };
             partnersRequest.onerror = (event) => console.error('Error fetching partners:', event.target.error);
        };
        projectsRequest.onerror = (event) => console.error('Error fetching projects for map:', event.target.error);
    }

    // The rest of the functions (form submission, edit, delete) remain largely the same
    partnerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const partnerData = {
            name: document.getElementById('partner-name').value,
            share_percentage: parseFloat(document.getElementById('partner-share').value),
            project_id: document.getElementById('partner-project').value,
            previous_balance: 0,
            current_balance: 0,
        };

        const partnerId = document.getElementById('partner-id').value;
        const store = getObjectStore('partners', 'readwrite');
        let request;

        if (partnerId) {
            partnerData.partner_id = parseInt(partnerId);
            request = store.put(partnerData);
        } else {
            request = store.add(partnerData);
        }

        request.onsuccess = () => {
            partnerForm.reset();
            partnerModal.hide();
            displayPartners();
        };
        request.onerror = (event) => console.error('Error saving partner:', event.target.error);
    });

    partnersTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const partnerId = parseInt(target.getAttribute('data-id'));
        if (target.classList.contains('edit-btn')) handleEdit(partnerId);
        if (target.classList.contains('delete-btn')) handleDelete(partnerId);
    });

    function handleEdit(id) {
        const store = getObjectStore('partners', 'readonly');
        const request = store.get(id);

        request.onsuccess = () => {
            const partner = request.result;
            if (partner) {
                document.getElementById('partner-id').value = partner.partner_id;
                document.getElementById('partner-name').value = partner.name;
                document.getElementById('partner-share').value = partner.share_percentage;
                // Important: We need to make sure projects are loaded before setting the value
                loadProjectsIntoSelect().then(() => {
                    document.getElementById('partner-project').value = partner.project_id;
                });
                partnerModal.show();
            }
        };
    }

    function handleDelete(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا الشريك؟')) {
            const store = getObjectStore('partners', 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => displayPartners();
            request.onerror = (event) => console.error('Error deleting partner:', event.target.error);
        }
    }

    // When the modal is about to be shown, load the projects
    partnerModalEl.addEventListener('show.bs.modal', loadProjectsIntoSelect);

    // When the modal is closed, reset the form
    partnerModalEl.addEventListener('hidden.bs.modal', () => {
        partnerForm.reset();
        document.getElementById('partner-id').value = '';
    });

    // Observer to display partners when section is visible
    const partnersSection = document.getElementById('partners-section');
    const observer = new MutationObserver((mutations) => {
        if (!partnersSection.classList.contains('d-none')) {
            displayPartners();
        }
    });
    observer.observe(partnersSection, { attributes: true });
});
