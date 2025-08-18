window.addEventListener('DOMContentLoaded', event => {
    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }

    // Handle active state in sidebar
    const sidebarNav = document.getElementById('sidebar-nav');
    if(sidebarNav) {
        sidebarNav.addEventListener('click', (e) => {
            const clickedLink = e.target.closest('a');
            if (!clickedLink) return;

            const links = sidebarNav.querySelectorAll('a');
            links.forEach(link => link.classList.remove('active'));

            clickedLink.classList.add('active');
        });
    }
});

// --- Client Management ---

// Listen for the custom event that fires when the clients partial is loaded
document.addEventListener('clientsPageLoaded', () => {
    renderClientsList();
    setupAddClientForm();
    setupEditClientForm();
});

// Renders the list of clients in the table
async function renderClientsList() {
    try {
        const clients = await getAllItems('clients');
        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        if (clients.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد عملاء لعرضهم.</td></tr>';
            return;
        }

        clients.forEach(client => {
            const row = `
                <tr>
                    <td>${client.client_id}</td>
                    <td>${client.name}</td>
                    <td>${client.phone || '-'}</td>
                    <td>${client.address || '-'}</td>
                    <td>${client.balance}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editClient(${client.client_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteClient(${client.client_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering clients list:', error);
        const tableBody = document.getElementById('clientsTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">حدث خطأ أثناء تحميل العملاء.</td></tr>';
        }
    }
}

// Sets up the form submission handler for adding a new client
function setupAddClientForm() {
    const addClientForm = document.getElementById('addClientForm');
    if (!addClientForm) return;

    // Remove existing event listener to prevent duplicates if page is reloaded
    // A bit of a hack, but effective for this simple case.
    const newForm = addClientForm.cloneNode(true);
    addClientForm.parentNode.replaceChild(newForm, addClientForm);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const clientName = document.getElementById('clientName').value;
        const clientPhone = document.getElementById('clientPhone').value;
        const clientAddress = document.getElementById('clientAddress').value;
        const clientBalance = parseFloat(document.getElementById('clientBalance').value);

        const newClient = {
            name: clientName,
            phone: clientPhone,
            address: clientAddress,
            balance: clientBalance,
            created_at: new Date()
        };

        try {
            await addItem('clients', newClient);

            // Close the modal
            const modalElement = document.getElementById('addClientModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            // Refresh the list
            await renderClientsList();

            // Reset the form
            newForm.reset();

        } catch (error) {
            console.error('Error adding client:', error);
            alert('حدث خطأ أثناء إضافة العميل.');
        }
    });
}

// Placeholder for delete functionality
async function deleteClient(clientId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }

    try {
        await deleteItem('clients', clientId);
        await renderClientsList(); // Refresh the list
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('حدث خطأ أثناء حذف العميل.');
    }
}

function setupEditClientForm() {
    const editClientForm = document.getElementById('editClientForm');
    if (!editClientForm) return;

    editClientForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const clientId = parseInt(document.getElementById('editClientId').value);

        const updatedClient = {
            client_id: clientId,
            name: document.getElementById('editClientName').value,
            phone: document.getElementById('editClientPhone').value,
            address: document.getElementById('editClientAddress').value,
            balance: parseFloat(document.getElementById('editClientBalance').value)
        };

        try {
            await updateItem('clients', updatedClient);

            const modalElement = document.getElementById('editClientModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await renderClientsList();
        } catch (error) {
            console.error('Error updating client:', error);
            alert('حدث خطأ أثناء تحديث بيانات العميل.');
        }
    });
}

async function editClient(clientId) {
    try {
        const client = await getItemById('clients', clientId);
        if (!client) {
            alert('لم يتم العثور على العميل.');
            return;
        }

        // Populate the edit form
        document.getElementById('editClientId').value = client.client_id;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientPhone').value = client.phone;
        document.getElementById('editClientAddress').value = client.address;
        document.getElementById('editClientBalance').value = client.balance;

        // Show the modal
        const modalElement = document.getElementById('editClientModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error fetching client for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات العميل للتعديل.');
    }
}

// --- Supplier Management ---

document.addEventListener('suppliersPageLoaded', () => {
    renderSuppliersList();
    setupAddSupplierForm();
    setupEditSupplierForm();
});

async function renderSuppliersList() {
    try {
        const suppliers = await getAllItems('suppliers');
        const tableBody = document.getElementById('suppliersTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد موردين لعرضهم.</td></tr>';
            return;
        }

        suppliers.forEach(supplier => {
            const row = `
                <tr>
                    <td>${supplier.supplier_id}</td>
                    <td>${supplier.name}</td>
                    <td>${supplier.phone || '-'}</td>
                    <td>${supplier.address || '-'}</td>
                    <td>${supplier.balance}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editSupplier(${supplier.supplier_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${supplier.supplier_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering suppliers list:', error);
        const tableBody = document.getElementById('suppliersTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">حدث خطأ أثناء تحميل الموردين.</td></tr>';
        }
    }
}

function setupAddSupplierForm() {
    const addSupplierForm = document.getElementById('addSupplierForm');
    if (!addSupplierForm) return;

    const newForm = addSupplierForm.cloneNode(true);
    addSupplierForm.parentNode.replaceChild(newForm, addSupplierForm);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newSupplier = {
            name: document.getElementById('supplierName').value,
            phone: document.getElementById('supplierPhone').value,
            address: document.getElementById('supplierAddress').value,
            balance: parseFloat(document.getElementById('supplierBalance').value),
            created_at: new Date()
        };

        try {
            await addItem('suppliers', newSupplier);
            const modalElement = document.getElementById('addSupplierModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderSuppliersList();
            newForm.reset();
        } catch (error) {
            console.error('Error adding supplier:', error);
            alert('حدث خطأ أثناء إضافة المورد.');
        }
    });
}

async function deleteSupplier(supplierId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا المورد؟')) {
        return;
    }
    try {
        await deleteItem('suppliers', supplierId);
        await renderSuppliersList();
    } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('حدث خطأ أثناء حذف المورد.');
    }
}

function setupEditSupplierForm() {
    const editSupplierForm = document.getElementById('editSupplierForm');
    if (!editSupplierForm) return;

    editSupplierForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const supplierId = parseInt(document.getElementById('editSupplierId').value);

        const updatedSupplier = {
            supplier_id: supplierId,
            name: document.getElementById('editSupplierName').value,
            phone: document.getElementById('editSupplierPhone').value,
            address: document.getElementById('editSupplierAddress').value,
            balance: parseFloat(document.getElementById('editSupplierBalance').value)
        };

        try {
            await updateItem('suppliers', updatedSupplier);

            const modalElement = document.getElementById('editSupplierModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await renderSuppliersList();
        } catch (error) {
            console.error('Error updating supplier:', error);
            alert('حدث خطأ أثناء تحديث بيانات المورد.');
        }
    });
}

async function editSupplier(supplierId) {
    try {
        const supplier = await getItemById('suppliers', supplierId);
        if (!supplier) {
            alert('لم يتم العثور على المورد.');
            return;
        }

        document.getElementById('editSupplierId').value = supplier.supplier_id;
        document.getElementById('editSupplierName').value = supplier.name;
        document.getElementById('editSupplierPhone').value = supplier.phone;
        document.getElementById('editSupplierAddress').value = supplier.address;
        document.getElementById('editSupplierBalance').value = supplier.balance;

        const modalElement = document.getElementById('editSupplierModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error fetching supplier for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات المورد للتعديل.');
    }
}

// --- Partner Management ---

document.addEventListener('partnersPageLoaded', () => {
    renderPartnersList();
    setupAddPartnerForm();
    setupEditPartnerForm();
});

async function renderPartnersList() {
    try {
        const partners = await getAllItems('partners');
        const tableBody = document.getElementById('partnersTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (partners.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا يوجد شركاء لعرضهم.</td></tr>';
            return;
        }

        partners.forEach(partner => {
            const row = `
                <tr>
                    <td>${partner.partner_id}</td>
                    <td>${partner.name}</td>
                    <td>${partner.share_percentage} %</td>
                    <td>${partner.current_balance}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editPartner(${partner.partner_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deletePartner(${partner.partner_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering partners list:', error);
        const tableBody = document.getElementById('partnersTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">حدث خطأ أثناء تحميل الشركاء.</td></tr>';
        }
    }
}

function setupAddPartnerForm() {
    const addPartnerForm = document.getElementById('addPartnerForm');
    if (!addPartnerForm) return;

    const newForm = addPartnerForm.cloneNode(true);
    addPartnerForm.parentNode.replaceChild(newForm, addPartnerForm);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newPartner = {
            name: document.getElementById('partnerName').value,
            share_percentage: parseFloat(document.getElementById('partnerShare').value),
            previous_balance: parseFloat(document.getElementById('partnerBalance').value),
            current_balance: parseFloat(document.getElementById('partnerBalance').value),
            created_at: new Date()
        };

        try {
            await addItem('partners', newPartner);
            const modalElement = document.getElementById('addPartnerModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderPartnersList();
            newForm.reset();
        } catch (error) {
            console.error('Error adding partner:', error);
            alert('حدث خطأ أثناء إضافة الشريك.');
        }
    });
}

async function deletePartner(partnerId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا الشريك؟')) {
        return;
    }
    try {
        await deleteItem('partners', partnerId);
        await renderPartnersList();
    } catch (error) {
        console.error('Error deleting partner:', error);
        alert('حدث خطأ أثناء حذف الشريك.');
    }
}

function setupEditPartnerForm() {
    const editPartnerForm = document.getElementById('editPartnerForm');
    if (!editPartnerForm) return;

    editPartnerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const partnerId = parseInt(document.getElementById('editPartnerId').value);

        // Fetch the original partner to preserve the previous_balance
        const originalPartner = await getItemById('partners', partnerId);
        if(!originalPartner) {
            alert('خطأ: لم يتم العثور على الشريك الأصلي.');
            return;
        }

        const updatedPartner = {
            partner_id: partnerId,
            name: document.getElementById('editPartnerName').value,
            share_percentage: parseFloat(document.getElementById('editPartnerShare').value),
            current_balance: parseFloat(document.getElementById('editPartnerBalance').value),
            previous_balance: originalPartner.previous_balance // Preserve the original previous_balance
        };

        try {
            await updateItem('partners', updatedPartner);

            const modalElement = document.getElementById('editPartnerModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await renderPartnersList();
        } catch (error) {
            console.error('Error updating partner:', error);
            alert('حدث خطأ أثناء تحديث بيانات الشريك.');
        }
    });
}

async function editPartner(partnerId) {
    try {
        const partner = await getItemById('partners', partnerId);
        if (!partner) {
            alert('لم يتم العثور على الشريك.');
            return;
        }

        document.getElementById('editPartnerId').value = partner.partner_id;
        document.getElementById('editPartnerName').value = partner.name;
        document.getElementById('editPartnerShare').value = partner.share_percentage;
        document.getElementById('editPartnerBalance').value = partner.current_balance;

        const modalElement = document.getElementById('editPartnerModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error fetching partner for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات الشريك للتعديل.');
    }
}

// --- Project Management ---

document.addEventListener('projectsPageLoaded', () => {
    renderProjectsList();
    setupAddProjectForm();
    setupEditProjectForm();
});

async function renderProjectsList() {
    try {
        const projects = await getAllItems('projects');
        const tableBody = document.getElementById('projectsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (projects.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مشاريع لعرضها.</td></tr>';
            return;
        }

        projects.forEach(project => {
            const row = `
                <tr>
                    <td>${project.project_id}</td>
                    <td>${project.name}</td>
                    <td>${project.description || '-'}</td>
                    <td>${project.start_date || '-'}</td>
                    <td>${project.end_date || '-'}</td>
                    <td><span class="badge bg-primary">${project.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editProject(${project.project_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.project_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering projects list:', error);
        const tableBody = document.getElementById('projectsTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">حدث خطأ أثناء تحميل المشاريع.</td></tr>';
        }
    }
}

function setupAddProjectForm() {
    const addProjectForm = document.getElementById('addProjectForm');
    if (!addProjectForm) return;

    const newForm = addProjectForm.cloneNode(true);
    addProjectForm.parentNode.replaceChild(newForm, addProjectForm);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newProject = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            start_date: document.getElementById('projectStartDate').value,
            end_date: document.getElementById('projectEndDate').value,
            status: document.getElementById('projectStatus').value,
            created_at: new Date()
        };

        try {
            await addItem('projects', newProject);
            const modalElement = document.getElementById('addProjectModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderProjectsList();
            newForm.reset();
        } catch (error) {
            console.error('Error adding project:', error);
            alert('حدث خطأ أثناء إضافة المشروع.');
        }
    });
}

async function deleteProject(projectId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا المشروع؟')) {
        return;
    }
    try {
        await deleteItem('projects', projectId);
        await renderProjectsList();
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('حدث خطأ أثناء حذف المشروع.');
    }
}

function setupEditProjectForm() {
    const editProjectForm = document.getElementById('editProjectForm');
    if (!editProjectForm) return;

    editProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const projectId = parseInt(document.getElementById('editProjectId').value);

        const updatedProject = {
            project_id: projectId,
            name: document.getElementById('editProjectName').value,
            description: document.getElementById('editProjectDescription').value,
            start_date: document.getElementById('editProjectStartDate').value,
            end_date: document.getElementById('editProjectEndDate').value,
            status: document.getElementById('editProjectStatus').value,
        };

        try {
            await updateItem('projects', updatedProject);

            const modalElement = document.getElementById('editProjectModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await renderProjectsList();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('حدث خطأ أثناء تحديث بيانات المشروع.');
        }
    });
}

async function editProject(projectId) {
    try {
        const project = await getItemById('projects', projectId);
        if (!project) {
            alert('لم يتم العثور على المشروع.');
            return;
        }

        document.getElementById('editProjectId').value = project.project_id;
        document.getElementById('editProjectName').value = project.name;
        document.getElementById('editProjectDescription').value = project.description;
        document.getElementById('editProjectStartDate').value = project.start_date;
        document.getElementById('editProjectEndDate').value = project.end_date;
        document.getElementById('editProjectStatus').value = project.status;

        const modalElement = document.getElementById('editProjectModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error fetching project for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات المشروع للتعديل.');
    }
}

// --- Contractor Management ---

document.addEventListener('contractorsPageLoaded', () => {
    renderContractorsList();
    setupAddContractorForm();
    setupEditContractorForm();
});

async function renderContractorsList() {
    try {
        const contractors = await getAllItems('contractors');
        const tableBody = document.getElementById('contractorsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (contractors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد مقاولين لعرضهم.</td></tr>';
            return;
        }

        contractors.forEach(contractor => {
            const row = `
                <tr>
                    <td>${contractor.contractor_id}</td>
                    <td>${contractor.name}</td>
                    <td>${contractor.contact_info || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editContractor(${contractor.contractor_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteContractor(${contractor.contractor_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering contractors list:', error);
        const tableBody = document.getElementById('contractorsTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">حدث خطأ أثناء تحميل المقاولين.</td></tr>';
        }
    }
}

function setupAddContractorForm() {
    const addContractorForm = document.getElementById('addContractorForm');
    if (!addContractorForm) return;

    const newForm = addContractorForm.cloneNode(true);
    addContractorForm.parentNode.replaceChild(newForm, addContractorForm);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newContractor = {
            name: document.getElementById('contractorName').value,
            contact_info: document.getElementById('contractorContact').value,
            created_at: new Date()
        };

        try {
            await addItem('contractors', newContractor);
            const modalElement = document.getElementById('addContractorModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderContractorsList();
            newForm.reset();
        } catch (error) {
            console.error('Error adding contractor:', error);
            alert('حدث خطأ أثناء إضافة المقاول.');
        }
    });
}

async function deleteContractor(contractorId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا المقاول؟')) {
        return;
    }
    try {
        await deleteItem('contractors', contractorId);
        await renderContractorsList();
    } catch (error) {
        console.error('Error deleting contractor:', error);
        alert('حدث خطأ أثناء حذف المقاول.');
    }
}

function setupEditContractorForm() {
    const editContractorForm = document.getElementById('editContractorForm');
    if (!editContractorForm) return;

    editContractorForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const contractorId = parseInt(document.getElementById('editContractorId').value);

        const updatedContractor = {
            contractor_id: contractorId,
            name: document.getElementById('editContractorName').value,
            contact_info: document.getElementById('editContractorContact').value,
        };

        try {
            await updateItem('contractors', updatedContractor);

            const modalElement = document.getElementById('editContractorModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();

            await renderContractorsList();
        } catch (error) {
            console.error('Error updating contractor:', error);
            alert('حدث خطأ أثناء تحديث بيانات المقاول.');
        }
    });
}

async function editContractor(contractorId) {
    try {
        const contractor = await getItemById('contractors', contractorId);
        if (!contractor) {
            alert('لم يتم العثور على المقاول.');
            return;
        }

        document.getElementById('editContractorId').value = contractor.contractor_id;
        document.getElementById('editContractorName').value = contractor.name;
        document.getElementById('editContractorContact').value = contractor.contact_info;

        const modalElement = document.getElementById('editContractorModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error fetching contractor for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات المقاول للتعديل.');
    }
}

// --- Settings & Data Management ---

document.addEventListener('settingsPageLoaded', () => {
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportDataToJSON);
    }
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            // Trigger the file input click
            document.getElementById('importFile').click();
        });
    }

    const importFile = document.getElementById('importFile');
    if(importFile) {
        importFile.addEventListener('change', importDataFromJSON);
    }
});

async function exportDataToJSON() {
    console.log('Starting data export...');
    try {
        const storeNames = ['clients', 'suppliers', 'partners', 'contractors', 'projects', 'transactions', 'settlements', 'items'];
        const dataToExport = {};

        const promises = storeNames.map(async (storeName) => {
            try {
                const items = await getAllItems(storeName);
                if (items) {
                    dataToExport[storeName] = items;
                }
            } catch (e) {
                // If a store doesn't exist, we just skip it.
                console.warn(`Could not export store "${storeName}":`, e);
            }
        });

        await Promise.all(promises);

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        a.download = `treasury-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Data export successful.');

    } catch (error) {
        console.error('Error exporting data:', error);
        alert('حدث خطأ أثناء تصدير البيانات.');
    }
}

async function importDataFromJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const confirmation = prompt("تحذير: هذه العملية ستحذف جميع البيانات الحالية. لا يمكن التراجع عن هذا الإجراء.\n\nإذا كنت متأكدًا، اكتب 'تأكيد' في المربع أدناه للمتابعة.");
    if (confirmation !== 'تأكيد') {
        alert('تم إلغاء عملية الاستيراد.');
        // Reset file input
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Re-initialize the DB (clears all data)
            // This is a bit of a nuclear option. A more granular clear would be better.
            // For now, let's just clear stores that exist in the JSON.
            const transaction = db.transaction(Object.keys(data), 'readwrite');

            const clearPromises = Object.keys(data).map(storeName => {
                return new Promise((resolve, reject) => {
                    const request = transaction.objectStore(storeName).clear();
                    request.onsuccess = resolve;
                    request.onerror = reject;
                });
            });
            await Promise.all(clearPromises);

            // Import new data
            const importTransaction = db.transaction(Object.keys(data), 'readwrite');
            const importPromises = Object.keys(data).map(storeName => {
                 const store = importTransaction.objectStore(storeName);
                 return Promise.all(data[storeName].map(item => {
                     return new Promise((resolve, reject) => {
                         // Remove auto-incremented key so DB can generate a new one
                         const keyPath = store.keyPath;
                         if(keyPath) delete item[keyPath];

                         const request = store.add(item);
                         request.onsuccess = resolve;
                         request.onerror = reject;
                     });
                 }));
            });

            await Promise.all(importPromises);

            alert('تم استيراد البيانات بنجاح! سيتم إعادة تحميل التطبيق.');
            location.reload();

        } catch (error) {
            console.error('Error importing data:', error);
            alert('فشل استيراد البيانات. تأكد من أن الملف هو ملف JSON صحيح تم تصديره من هذا التطبيق.');
        } finally {
             // Reset file input
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- Reports Management ---

document.addEventListener('reportsPageLoaded', () => {
    // Setup for Income/Expense Report
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (startDateInput) startDateInput.valueAsDate = firstDayOfMonth;
    if (endDateInput) endDateInput.valueAsDate = today;

    const generateIncomeExpenseBtn = document.getElementById('generateIncomeExpenseReport');
    if (generateIncomeExpenseBtn) {
        generateIncomeExpenseBtn.addEventListener('click', generateIncomeExpenseReport);
    }

    // Setup for Client Statement Report
    setupClientStatementGenerator();
});

function setupClientStatementGenerator() {
    const clientSelect = document.getElementById('clientStatementSelect');
    const generateBtn = document.getElementById('generateClientStatement');

    if (!clientSelect || !generateBtn) return;

    // Populate clients dropdown
    getAllItems('clients').then(clients => {
        clientSelect.innerHTML = '<option value="">اختر عميلاً...</option>';
        clients.forEach(c => {
            const option = document.createElement('option');
            option.value = c.client_id;
            option.textContent = c.name;
            clientSelect.appendChild(option);
        });
    });

    generateBtn.addEventListener('click', generateClientStatement);
}

async function generateClientStatement() {
    const clientId = document.getElementById('clientStatementSelect').value;
    const resultDiv = document.getElementById('clientStatementResult');

    if (!clientId) {
        resultDiv.innerHTML = '<p class="text-danger text-center">الرجاء اختيار عميل أولاً.</p>';
        return;
    }

    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد الكشف...</p>';

    try {
        const client = await getItemById('clients', parseInt(clientId));
        const allTransactions = await getAllItems('transactions');

        const clientTransactions = allTransactions
            .filter(t => t.linked_client_id === client.client_id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        let statementHTML = `
            <h4>كشف حساب للعميل: ${client.name}</h4>
            <p><strong>الرصيد الحالي: ${client.balance.toFixed(2)}</strong></p>
            <table class="table table-sm table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>التاريخ</th>
                        <th>البيان</th>
                        <th>مدين (له)</th>
                        <th>دائن (عليه)</th>
                        <th>الرصيد</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // This is a simplified running balance calculation.
        // A real accounting system would be more complex.
        // Let's assume the current balance is correct and work backwards.
        let runningBalance = client.balance;

        // To calculate the running balance correctly, we need to find the balance at the start of the transaction list.
        // We can derive it by taking the current balance and reversing the transactions.
        let openingBalance = client.balance;
        [...clientTransactions].reverse().forEach(t => {
             if (t.transaction_type === 'قبض') { // Receipt from client (decreased balance)
                openingBalance += t.amount;
            } else { // Payment to client (increased balance)
                openingBalance -= t.amount;
            }
        });

        statementHTML += `
            <tr>
                <td colspan="4" class="text-end fw-bold">رصيد افتتاحي</td>
                <td class="fw-bold">${openingBalance.toFixed(2)}</td>
            </tr>
        `;

        runningBalance = openingBalance;
        clientTransactions.forEach(t => {
            let debit = '';
            let credit = '';
            if (t.transaction_type === 'قبض') { // Receipt from client (Payment FROM them) -> Credit
                credit = t.amount.toFixed(2);
                runningBalance -= t.amount;
            } else { // Payment TO client (e.g. refund) -> Debit
                debit = t.amount.toFixed(2);
                runningBalance += t.amount;
            }
            statementHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.description || t.transaction_type}</td>
                    <td>${debit}</td>
                    <td>${credit}</td>
                    <td>${runningBalance.toFixed(2)}</td>
                </tr>
            `;
        });

        statementHTML += '</tbody></table>';
        resultDiv.innerHTML = statementHTML;

    } catch (error) {
        console.error('Error generating client statement:', error);
        resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ أثناء توليد الكشف.</p>';
    }
}

async function generateIncomeExpenseReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const resultDiv = document.getElementById('incomeExpenseReportResult');

    if (!startDate || !endDate) {
        resultDiv.innerHTML = '<p class="text-danger text-center">الرجاء تحديد تاريخ البدء والانتهاء.</p>';
        return;
    }

    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد التقرير...</p>';

    try {
        const allTransactions = await getAllItems('transactions');

        const filteredTransactions = allTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });

        const income = filteredTransactions.filter(t => t.transaction_type === 'قبض');
        const expenses = filteredTransactions.filter(t => t.transaction_type === 'صرف');

        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const netTotal = totalIncome - totalExpenses;

        let reportHTML = `
            <div class="row">
                <!-- Summary Cards -->
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-success">
                        <div class="card-body">
                            <h5 class="card-title">إجمالي الإيرادات</h5>
                            <p class="card-text fs-4 fw-bold">${totalIncome.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-danger">
                        <div class="card-body">
                            <h5 class="card-title">إجمالي المصروفات</h5>
                            <p class="card-text fs-4 fw-bold">${totalExpenses.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white ${netTotal >= 0 ? 'bg-primary' : 'bg-secondary'}">
                        <div class="card-body">
                            <h5 class="card-title">صافي الحركة</h5>
                            <p class="card-text fs-4 fw-bold">${netTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <hr>

            <div class="row mt-4">
                <!-- Income Details -->
                <div class="col-md-6">
                    <h4>تفاصيل الإيرادات</h4>
                    <ul class="list-group">
                        ${income.length > 0 ? income.map(t => `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${t.date}: ${t.description || 'إيراد'}</span><span class="badge bg-success rounded-pill">${t.amount.toFixed(2)}</span></li>`).join('') : '<li class="list-group-item">لا توجد إيرادات في هذه الفترة.</li>'}
                    </ul>
                </div>
                <!-- Expense Details -->
                <div class="col-md-6">
                    <h4>تفاصيل المصروفات</h4>
                    <ul class="list-group">
                         ${expenses.length > 0 ? expenses.map(t => `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${t.date}: ${t.description || 'مصروف'}</span><span class="badge bg-danger rounded-pill">${t.amount.toFixed(2)}</span></li>`).join('') : '<li class="list-group-item">لا توجد مصروفات في هذه الفترة.</li>'}
                    </ul>
                </div>
            </div>
        `;

        resultDiv.innerHTML = reportHTML;

    } catch (error) {
        console.error('Error generating report:', error);
        resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ أثناء توليد التقرير.</p>';
    }
}

// --- Dashboard Management ---

document.addEventListener('dashboardPageLoaded', () => {
    renderDashboard();
});

async function renderDashboard() {
    try {
        // Fetch all necessary data in parallel
        const [clients, suppliers, projects, transactions] = await Promise.all([
            getAllItems('clients'),
            getAllItems('suppliers'),
            getAllItems('projects'),
            getAllItems('transactions')
        ]);

        // 1. Calculate KPIs
        const totalClients = clients.length;
        const totalSuppliers = suppliers.length;
        const activeProjects = projects.filter(p => p.status === 'جارٍ').length;

        let treasuryBalance = 0;
        transactions.forEach(t => {
            if (t.transaction_type === 'قبض') {
                treasuryBalance += t.amount;
            } else {
                treasuryBalance -= t.amount;
            }
        });

        // 2. Update KPI cards
        document.getElementById('dashboard-total-clients').textContent = totalClients;
        document.getElementById('dashboard-total-suppliers').textContent = totalSuppliers;
        document.getElementById('dashboard-active-projects').textContent = activeProjects;
        document.getElementById('dashboard-treasury-balance').textContent = `${treasuryBalance.toFixed(2)}`;

        // 3. Render recent transactions
        const recentTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        const recentTableBody = document.getElementById('recentTransactionsTableBody');
        if (!recentTableBody) return;
        recentTableBody.innerHTML = '';

        if (recentTransactions.length === 0) {
            recentTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد معاملات حديثة.</td></tr>';
        } else {
            recentTransactions.forEach(t => {
                const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
                const row = `
                    <tr>
                        <td>${t.date}</td>
                        <td class="${typeClass}">${t.transaction_type}</td>
                        <td>${t.amount.toFixed(2)}</td>
                        <td>${t.description || '-'}</td>
                    </tr>
                `;
                recentTableBody.insertAdjacentHTML('beforeend', row);
            });
        }

    } catch (error) {
        console.error('Error rendering dashboard:', error);
        // You could add error indicators to the dashboard here
    }
}

// --- Transaction Management ---

document.addEventListener('transactionsPageLoaded', () => {
    renderTransactionsList();
    setupAddTransactionForm();
});

async function getLinkedEntityName(transaction) {
    let entityName = '-';
    let entityType = '';
    let entityId = null;

    if (transaction.linked_client_id) {
        entityType = 'clients';
        entityId = transaction.linked_client_id;
    } else if (transaction.linked_supplier_id) {
        entityType = 'suppliers';
        entityId = transaction.linked_supplier_id;
    } else if (transaction.linked_project_id) {
        entityType = 'projects';
        entityId = transaction.linked_project_id;
    } else if (transaction.linked_partner_id) {
        entityType = 'partners';
        entityId = transaction.linked_partner_id;
    }

    if (entityType && entityId) {
        try {
            const entity = await getItemById(entityType, entityId);
            if (entity) {
                entityName = entity.name;
            } else {
                 entityName = `<span class="text-muted">غير موجود</span>`;
            }
        } catch (error) {
            console.error(`Error fetching linked entity ${entityType}:`, error);
            entityName = `<span class="text-danger">خطأ</span>`;
        }
    }
    return entityName;
}


async function renderTransactionsList() {
    try {
        const transactions = await getAllItems('transactions');
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد معاملات لعرضها.</td></tr>';
            return;
        }

        // Sort transactions by date, newest first
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const transaction of transactions) {
            const linkedEntityName = await getLinkedEntityName(transaction);
            const typeClass = transaction.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
            const row = `
                <tr>
                    <td>${transaction.date}</td>
                    <td class="${typeClass} fw-bold">${transaction.transaction_type}</td>
                    <td>${transaction.amount.toFixed(2)}</td>
                    <td>${transaction.description || '-'}</td>
                    <td>${linkedEntityName}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${transaction.transaction_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        }
    } catch (error) {
        console.error('Error rendering transactions list:', error);
        const tableBody = document.getElementById('transactionsTableBody');
        if(tableBody) {
             tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">حدث خطأ أثناء تحميل المعاملات.</td></tr>';
        }
    }
}

async function populateLinkableItems(linkType, targetDropdown) {
    targetDropdown.innerHTML = '<option value="">اختر...</option>';
    targetDropdown.disabled = true;

    if (!linkType) return;

    try {
        const items = await getAllItems(linkType);
        if (items && items.length > 0) {
            items.forEach(item => {
                const option = document.createElement('option');
                // Use the primary key of the specific entity
                option.value = item[Object.keys(item).find(k => k.endsWith('_id'))];
                option.textContent = item.name;
                targetDropdown.appendChild(option);
            });
            targetDropdown.disabled = false;
        } else {
            targetDropdown.innerHTML = `<option value="">لا يوجد ${linkType} لعرضهم</option>`;
        }
    } catch (error) {
        console.error(`Error populating ${linkType}:`, error);
        targetDropdown.innerHTML = `<option value="">خطأ في التحميل</option>`;
    }
}

function setupAddTransactionForm() {
    const form = document.getElementById('addTransactionForm');
    const linkTypeDropdown = document.getElementById('transactionLinkType');
    const linkIdDropdown = document.getElementById('transactionLinkId');

    if (!form || !linkTypeDropdown || !linkIdDropdown) return;

    // Set default date to today
    document.getElementById('transactionDate').valueAsDate = new Date();

    linkTypeDropdown.addEventListener('change', () => {
        populateLinkableItems(linkTypeDropdown.value, linkIdDropdown);
    });

    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const transactionData = {
            transaction_type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            date: document.getElementById('transactionDate').value,
            description: document.getElementById('transactionDescription').value,
            created_at: new Date()
        };

        const linkType = document.getElementById('transactionLinkType').value;
        const linkId = document.getElementById('transactionLinkId').value ? parseInt(document.getElementById('transactionLinkId').value) : null;

        if (linkType && linkId) {
            transactionData[`linked_${linkType.slice(0, -1)}_id`] = linkId;
        }

        try {
            // Save the transaction
            await addItem('transactions', transactionData);

            // Update balance if linked
            if (linkType && linkId && (linkType === 'clients' || linkType === 'suppliers')) {
                const entity = await getItemById(linkType, linkId);
                if (entity) {
                    if (linkType === 'clients') {
                        if (transactionData.transaction_type === 'قبض') { // Receipt from client
                            entity.balance -= transactionData.amount; // They owe us less
                        } else { // Payment to client (e.g., refund)
                            entity.balance += transactionData.amount; // They owe us more, or we owe them
                        }
                    } else if (linkType === 'suppliers') {
                        if (transactionData.transaction_type === 'قبض') { // Receipt from supplier (e.g., refund)
                            entity.balance += transactionData.amount; // We owe them more
                        } else { // Payment to supplier
                            entity.balance -= transactionData.amount; // We owe them less
                        }
                    }
                    await updateItem(linkType, entity);
                }
            } else if (linkType && linkId && linkType === 'partners') {
                 const entity = await getItemById(linkType, linkId);
                 if(entity) {
                    if (transactionData.transaction_type === 'قبض') { // payment from partner
                        entity.current_balance -= transactionData.amount;
                    } else { // giving money to partner
                        entity.current_balance += transactionData.amount;
                    }
                    await updateItem(linkType, entity);
                 }
            }


            const modalElement = document.getElementById('addTransactionModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderTransactionsList();
            newForm.reset();
            document.getElementById('transactionDate').valueAsDate = new Date();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('حدث خطأ أثناء إضافة المعاملة.');
        }
    });
}

async function deleteTransaction(transactionId) {
    // Note: Deleting a transaction should ideally reverse the balance update.
    // This is a complex operation (a compensating transaction) and is omitted for now for simplicity.
    // A proper implementation would require storing more context with the transaction.
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذه المعاملة؟ لن يتم تحديث رصيد الجهة المرتبطة تلقائيًا.')) {
        return;
    }
    try {
        await deleteItem('transactions', transactionId);
        await renderTransactionsList();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('حدث خطأ أثناء حذف المعاملة.');
    }
}

// --- Items Management ---

document.addEventListener('itemsPageLoaded', () => {
    renderItemsList();
    setupAddItemForm();
    setupEditItemForm();
});

async function renderItemsList() {
    try {
        const items = await getAllItems('items');
        const tableBody = document.getElementById('itemsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد بنود لعرضها.</td></tr>';
            return;
        }

        items.forEach(item => {
            const row = `
                <tr>
                    <td>${item.item_id}</td>
                    <td>${item.name}</td>
                    <td>${item.unit_price.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editItemRecord(${item.item_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteItemRecord(${item.item_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering items list:', error);
    }
}

function setupAddItemForm() {
    const addItemForm = document.getElementById('addItemForm');
    if (!addItemForm) return;

    addItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newItem = {
            name: document.getElementById('itemName').value,
            unit_price: parseFloat(document.getElementById('itemPrice').value),
        };

        try {
            await addItem('items', newItem);
            const modalElement = document.getElementById('addItemModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            addItemForm.reset();
            await renderItemsList();
        } catch (error) {
            console.error('Error adding item:', error);
            alert('حدث خطأ أثناء إضافة البند.');
        }
    });
}

function setupEditItemForm() {
    const editItemForm = document.getElementById('editItemForm');
    if (!editItemForm) return;

    editItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const itemId = parseInt(document.getElementById('editItemId').value);

        const updatedItem = {
            item_id: itemId,
            name: document.getElementById('editItemName').value,
            unit_price: parseFloat(document.getElementById('editItemPrice').value),
        };

        try {
            await updateItem('items', updatedItem);
            const modalElement = document.getElementById('editItemModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            await renderItemsList();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('حدث خطأ أثناء تحديث بيانات البند.');
        }
    });
}

async function editItemRecord(itemId) {
    try {
        const item = await getItemById('items', itemId);
        if (!item) {
            alert('لم يتم العثور على البند.');
            return;
        }

        document.getElementById('editItemId').value = item.item_id;
        document.getElementById('editItemName').value = item.name;
        document.getElementById('editItemPrice').value = item.unit_price;

        const modalElement = document.getElementById('editItemModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error fetching item for editing:', error);
        alert('حدث خطأ أثناء جلب بيانات البند للتعديل.');
    }
}

async function deleteItemRecord(itemId) {
    if (!confirm('هل أنت متأكد من أنك تريد حذف هذا البند؟')) {
        return;
    }
    try {
        await deleteItem('items', itemId);
        await renderItemsList();
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('حدث خطأ أثناء حذف البند.');
    }
}

// --- Partner Settlements Management ---

document.addEventListener('settlementsPageLoaded', () => {
    renderSettlementsList();
    setupAddSettlementForm();
});

async function renderSettlementsList() {
    try {
        const settlements = await getAllItems('settlements');
        const tableBody = document.getElementById('settlementsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (settlements.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">لا يوجد تسويات لعرضها.</td></tr>';
            return;
        }

        for (const settlement of settlements) {
            const partner = await getItemById('partners', settlement.partner_id);
            const row = `
                <tr>
                    <td>${settlement.date}</td>
                    <td>${partner ? partner.name : 'شريك محذوف'}</td>
                    <td>${settlement.payment_amount.toFixed(2)}</td>
                    <td>${settlement.previous_balance.toFixed(2)}</td>
                    <td>${settlement.final_balance.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteSettlement(${settlement.settlement_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        }
    } catch (error) {
        console.error('Error rendering settlements list:', error);
    }
}

function setupAddSettlementForm() {
    const form = document.getElementById('addSettlementForm');
    if (!form) return;

    const partnerSelect = document.getElementById('settlementPartner');
    const detailsDiv = document.getElementById('partnerDetails');
    const amountInput = document.getElementById('settlementAmount');
    const finalBalanceSpan = document.getElementById('partnerFinalBalance');

    document.getElementById('settlementDate').valueAsDate = new Date();

    // Populate partners dropdown
    getAllItems('partners').then(partners => {
        partnerSelect.innerHTML = '<option value="">اختر شريكًا...</option>';
        partners.forEach(p => {
            const option = document.createElement('option');
            option.value = p.partner_id;
            option.textContent = p.name;
            partnerSelect.appendChild(option);
        });
    });

    let selectedPartner = null;

    const updateBalances = () => {
        if (!selectedPartner) return;
        const paymentAmount = parseFloat(amountInput.value) || 0;
        const finalBalance = selectedPartner.current_balance - paymentAmount;
        finalBalanceSpan.textContent = finalBalance.toFixed(2);
    };

    partnerSelect.addEventListener('change', async () => {
        const partnerId = parseInt(partnerSelect.value);
        if (!partnerId) {
            detailsDiv.classList.add('d-none');
            selectedPartner = null;
            return;
        }
        selectedPartner = await getItemById('partners', partnerId);
        if (selectedPartner) {
            document.getElementById('partnerPreviousBalance').textContent = selectedPartner.previous_balance.toFixed(2);
            document.getElementById('partnerCurrentBalance').textContent = selectedPartner.current_balance.toFixed(2);
            const outstandingAmount = selectedPartner.current_balance - selectedPartner.previous_balance;
            document.getElementById('partnerOutstandingAmount').textContent = outstandingAmount.toFixed(2);
            detailsDiv.classList.remove('d-none');
            updateBalances();
        }
    });

    amountInput.addEventListener('input', updateBalances);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedPartner) {
            alert('الرجاء اختيار شريك أولاً.');
            return;
        }

        const paymentAmount = parseFloat(amountInput.value);
        const finalBalance = selectedPartner.current_balance - paymentAmount;

        const settlementRecord = {
            partner_id: selectedPartner.partner_id,
            payment_amount: paymentAmount,
            previous_balance: selectedPartner.current_balance,
            outstanding_amount: selectedPartner.current_balance - selectedPartner.previous_balance,
            final_balance: finalBalance,
            date: document.getElementById('settlementDate').value
        };

        const updatedPartner = {
            ...selectedPartner,
            previous_balance: selectedPartner.current_balance,
            current_balance: finalBalance
        };

        try {
            // Using a single transaction to ensure atomicity
            const tx = db.transaction(['settlements', 'partners'], 'readwrite');
            const settlementStore = tx.objectStore('settlements');
            const partnerStore = tx.objectStore('partners');

            settlementStore.add(settlementRecord);
            partnerStore.put(updatedPartner);

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });

            const modalElement = document.getElementById('addSettlementModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            form.reset();
            detailsDiv.classList.add('d-none');

            renderSettlementsList();
        } catch (error) {
            console.error('Error adding settlement:', error);
            alert('حدث خطأ أثناء حفظ التسوية.');
        }
    });
}

function deleteSettlement(settlementId) {
    alert(`حذف التسويات غير مدعوم حاليًا لأنه يتطلب عملية معقدة لعكس الأرصدة. (ID: ${settlementId})`);
}

// --- Invoice Management ---

document.addEventListener('invoicesPageLoaded', () => {
    renderInvoicesList();
});

document.addEventListener('createInvoicePageLoaded', () => {
    setupCreateInvoiceForm();
});

async function renderInvoicesList() {
    try {
        const invoices = await getAllItems('invoices');
        const tableBody = document.getElementById('invoicesTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (invoices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد فواتير لعرضها.</td></tr>';
            return;
        }

        for (const invoice of invoices) {
            const client = await getItemById('clients', invoice.client_id);
            const status_class = invoice.status === 'Paid' ? 'bg-success' : 'bg-danger';
            const row = `
                <tr>
                    <td>#${invoice.invoice_id}</td>
                    <td>${client ? client.name : 'عميل محذوف'}</td>
                    <td>${invoice.issue_date}</td>
                    <td>${invoice.due_date}</td>
                    <td>${invoice.total_amount.toFixed(2)}</td>
                    <td><span class="badge ${status_class}">${invoice.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewInvoice(${invoice.invoice_id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        }
    } catch (error) {
        console.error('Error rendering invoices list:', error);
    }
}

async function setupCreateInvoiceForm() {
    const form = document.getElementById('invoiceForm');
    if (!form) return;

    const clientSelect = document.getElementById('invoiceClient');
    const lineItemsBody = document.querySelector('#lineItemsTable tbody');
    const addLineItemBtn = document.getElementById('addInvoiceItemBtn');
    const taxInput = document.getElementById('invoiceTax');

    document.getElementById('invoiceIssueDate').valueAsDate = new Date();

    const [clients, items] = await Promise.all([getAllItems('clients'), getAllItems('items')]);

    // Populate clients
    clientSelect.innerHTML = '<option value="">اختر عميلاً...</option>';
    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.client_id;
        option.textContent = c.name;
        clientSelect.appendChild(option);
    });

    const createLineItemRow = () => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="form-select item-select">
                    <option value="">اختر بندًا...</option>
                    ${items.map(i => `<option value="${i.item_id}" data-price="${i.unit_price}">${i.name}</option>`).join('')}
                </select>
            </td>
            <td><input type="number" class="form-control quantity" value="1" min="1"></td>
            <td><input type="number" class="form-control unit-price" readonly></td>
            <td><input type="number" class="form-control line-total" readonly></td>
            <td><button type="button" class="btn btn-sm btn-danger remove-item-btn"><i class="fas fa-trash"></i></button></td>
        `;
        lineItemsBody.appendChild(row);
    };

    addLineItemBtn.addEventListener('click', createLineItemRow);

    lineItemsBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('item-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const price = selectedOption.dataset.price || 0;
            const row = e.target.closest('tr');
            row.querySelector('.unit-price').value = parseFloat(price).toFixed(2);
            calculateInvoiceTotals();
        }
    });

    lineItemsBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity')) {
            calculateInvoiceTotals();
        }
    });

    lineItemsBody.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item-btn')) {
            e.target.closest('tr').remove();
            calculateInvoiceTotals();
        }
    });

    taxInput.addEventListener('input', calculateInvoiceTotals);

    const calculateInvoiceTotals = () => {
        let subtotal = 0;
        lineItemsBody.querySelectorAll('tr').forEach(row => {
            const price = parseFloat(row.querySelector('.unit-price').value) || 0;
            const quantity = parseInt(row.querySelector('.quantity').value) || 0;
            const lineTotal = price * quantity;
            row.querySelector('.line-total').value = lineTotal.toFixed(2);
            subtotal += lineTotal;
        });

        const taxPercent = parseFloat(taxInput.value) || 0;
        const taxAmount = subtotal * (taxPercent / 100);
        const total = subtotal + taxAmount;

        document.getElementById('invoiceSubtotal').textContent = subtotal.toFixed(2);
        document.getElementById('invoiceTotal').textContent = total.toFixed(2);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lineItems = [];
        lineItemsBody.querySelectorAll('tr').forEach(row => {
            const itemId = row.querySelector('.item-select').value;
            if(itemId) {
                lineItems.push({
                    item_id: parseInt(itemId),
                    quantity: parseInt(row.querySelector('.quantity').value),
                    unit_price: parseFloat(row.querySelector('.unit-price').value),
                    line_total: parseFloat(row.querySelector('.line-total').value)
                });
            }
        });

        const newInvoice = {
            client_id: parseInt(clientSelect.value),
            issue_date: document.getElementById('invoiceIssueDate').value,
            due_date: document.getElementById('invoiceDueDate').value,
            line_items: lineItems,
            subtotal_amount: parseFloat(document.getElementById('invoiceSubtotal').textContent),
            tax_amount: parseFloat(document.getElementById('invoiceSubtotal').textContent) * (parseFloat(taxInput.value) / 100),
            total_amount: parseFloat(document.getElementById('invoiceTotal').textContent),
            status: 'Unpaid'
        };

        try {
            await addItem('invoices', newInvoice);
            alert('تم حفظ الفاتورة بنجاح!');
            window.location.href = 'index.html'; // Redirect to main page
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('حدث خطأ أثناء حفظ الفاتورة.');
        }
    });

    // Add one row to start with
    createLineItemRow();
}

function viewInvoice(invoiceId) {
    window.location.href = `view-invoice.html?id=${invoiceId}`;
}

document.addEventListener('viewInvoicePageLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = parseInt(params.get('id'));
    if (!invoiceId) {
        document.getElementById('invoice-view-container').innerHTML = '<p class="text-danger">لم يتم تحديد فاتورة.</p>';
        return;
    }

    try {
        const invoice = await getItemById('invoices', invoiceId);
        const client = await getItemById('clients', invoice.client_id);

        // Calculate amount paid so far
        const transactions = await getAllItems('transactions');
        const payments = transactions.filter(t => t.linked_invoice_id === invoiceId);
        const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = invoice.total_amount - amountPaid;

        const invoiceHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3">فاتورة #${invoice.invoice_id}</h1>
                <div>
                    <a href="index.html" class="btn btn-outline-secondary"><i class="fas fa-arrow-right me-2"></i>العودة</a>
                    <button class="btn btn-info" onclick="window.print()"><i class="fas fa-print me-2"></i>طباعة</button>
                </div>
            </div>
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5>العميل:</h5>
                            <p>${client.name}<br>${client.address || ''}<br>${client.phone || ''}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <p><strong>تاريخ الإصدار:</strong> ${invoice.issue_date}</p>
                            <p><strong>تاريخ الاستحقاق:</strong> ${invoice.due_date}</p>
                            <p><strong>الحالة:</strong> <span class="badge bg-primary">${invoice.status}</span></p>
                        </div>
                    </div>
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
                        </thead>
                        <tbody>
                            ${invoice.line_items.map(item => `
                                <tr>
                                    <td>${item.item_id}</td> <!-- Should fetch item name -->
                                    <td>${item.quantity}</td>
                                    <td>${item.unit_price.toFixed(2)}</td>
                                    <td>${item.line_total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr><td colspan="3" class="text-end">المجموع الفرعي</td><td class="text-end">${invoice.subtotal_amount.toFixed(2)}</td></tr>
                            <tr><td colspan="3" class="text-end">الضريبة</td><td class="text-end">${invoice.tax_amount.toFixed(2)}</td></tr>
                            <tr class="fw-bold"><td colspan="3" class="text-end">الإجمالي</td><td class="text-end">${invoice.total_amount.toFixed(2)}</td></tr>
                             <tr class="fw-bold text-success"><td colspan="3" class="text-end">المدفوع</td><td class="text-end">${amountPaid.toFixed(2)}</td></tr>
                             <tr class="fw-bold text-danger"><td colspan="3" class="text-end">المتبقي</td><td class="text-end">${balanceDue.toFixed(2)}</td></tr>
                        </tfoot>
                    </table>
                    ${balanceDue > 0 ? `<div class="text-end mt-4"><button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#recordPaymentModal">تسجيل دفعة</button></div>` : ''}
                </div>
            </div>
        `;
        document.getElementById('invoice-view-container').innerHTML = invoiceHTML;

        // Setup payment modal
        if (balanceDue > 0) {
            document.getElementById('paymentAmount').value = balanceDue.toFixed(2);
            document.getElementById('paymentDate').valueAsDate = new Date();

            document.getElementById('recordPaymentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);

                // Create transaction
                const transaction = {
                    transaction_type: 'قبض',
                    amount: paymentAmount,
                    date: document.getElementById('paymentDate').value,
                    description: `دفعة للفاتورة رقم #${invoice.invoice_id}`,
                    linked_client_id: client.client_id,
                    linked_invoice_id: invoice.invoice_id // Custom field to link payment to invoice
                };

                // Update invoice status
                const newAmountPaid = amountPaid + paymentAmount;
                invoice.status = newAmountPaid >= invoice.total_amount ? 'Paid' : 'Partially Paid';

                // Update client balance
                client.balance -= paymentAmount;

                try {
                    const tx = db.transaction(['transactions', 'invoices', 'clients'], 'readwrite');
                    tx.objectStore('transactions').add(transaction);
                    tx.objectStore('invoices').put(invoice);
                    tx.objectStore('clients').put(client);

                    await new Promise((resolve, reject) => {
                        tx.oncomplete = resolve;
                        tx.onerror = reject;
                    });

                    alert('تم تسجيل الدفعة بنجاح!');
                    location.reload();
                } catch (error) {
                    console.error('Error recording payment:', error);
                    alert('حدث خطأ أثناء تسجيل الدفعة.');
                }
            });
        }

    } catch (error) {
        console.error('Error loading invoice:', error);
        document.getElementById('invoice-view-container').innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل الفاتورة.</p>';
    }
});
