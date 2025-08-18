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

document.addEventListener('clientsPageLoaded', () => {
    renderClientsList(); // Initial render
    setupAddClientForm();
    setupEditClientForm();

    const searchInput = document.getElementById('clientSearchInput');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderClientsList(e.target.value);
        });
    }
});

async function renderClientsList(searchTerm = '') {
    try {
        let clients = await getAllItems('clients');

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            clients = clients.filter(client =>
                client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                (client.phone && client.phone.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (client.address && client.address.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        const tableBody = document.getElementById('clientsTableBody');
        if (!tableBody) return;
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
                    <td>${client.balance.toFixed(2)}</td>
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
    }
}

function setupAddClientForm() {
    const addClientForm = document.getElementById('addClientForm');
    if (!addClientForm) return;

    addClientForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newClient = {
            name: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            address: document.getElementById('clientAddress').value,
            balance: parseFloat(document.getElementById('clientBalance').value) || 0
        };

        try {
            await addItem('clients', newClient);
            const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
            modal.hide();
            addClientForm.reset();
            await renderClientsList();
        } catch (error) {
            console.error('Error adding client:', error);
        }
    });
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
            const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
            modal.hide();
            await renderClientsList();
        } catch (error) {
            console.error('Error updating client:', error);
        }
    });
}

async function editClient(clientId) {
    try {
        const client = await getItemById('clients', clientId);
        if (!client) return;

        document.getElementById('editClientId').value = client.client_id;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientPhone').value = client.phone;
        document.getElementById('editClientAddress').value = client.address;
        document.getElementById('editClientBalance').value = client.balance;

        const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching client for editing:', error);
    }
}

async function deleteClient(clientId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا العميل؟')) {
        try {
            await deleteItem('clients', clientId);
            await renderClientsList();
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    }
}

// --- Supplier Management ---

document.addEventListener('suppliersPageLoaded', () => {
    renderSuppliersList();
    setupAddSupplierForm();
    setupEditSupplierForm();
    const searchInput = document.getElementById('supplierSearchInput');
    if(searchInput) searchInput.addEventListener('input', (e) => renderSuppliersList(e.target.value));
});

async function renderSuppliersList(searchTerm = '') {
    try {
        let suppliers = await getAllItems('suppliers');
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            suppliers = suppliers.filter(s => s.name.toLowerCase().includes(lowerCaseSearchTerm) || (s.phone && s.phone.includes(lowerCaseSearchTerm)));
        }

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
                    <td>${supplier.balance.toFixed(2)}</td>
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
    }
}

function setupAddSupplierForm() {
    const form = document.getElementById('addSupplierForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newSupplier = {
            name: document.getElementById('supplierName').value,
            phone: document.getElementById('supplierPhone').value,
            address: document.getElementById('supplierAddress').value,
            balance: parseFloat(document.getElementById('supplierBalance').value) || 0
        };
        await addItem('suppliers', newSupplier);
        bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide();
        form.reset();
        await renderSuppliersList();
    });
}

function setupEditSupplierForm() {
    const form = document.getElementById('editSupplierForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const supplierId = parseInt(document.getElementById('editSupplierId').value);
        const updatedSupplier = {
            supplier_id: supplierId,
            name: document.getElementById('editSupplierName').value,
            phone: document.getElementById('editSupplierPhone').value,
            address: document.getElementById('editSupplierAddress').value,
            balance: parseFloat(document.getElementById('editSupplierBalance').value)
        };
        await updateItem('suppliers', updatedSupplier);
        bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
        await renderSuppliersList();
    });
}

async function editSupplier(supplierId) {
    const supplier = await getItemById('suppliers', supplierId);
    if (!supplier) return;
    document.getElementById('editSupplierId').value = supplier.supplier_id;
    document.getElementById('editSupplierName').value = supplier.name;
    document.getElementById('editSupplierPhone').value = supplier.phone;
    document.getElementById('editSupplierAddress').value = supplier.address;
    document.getElementById('editSupplierBalance').value = supplier.balance;
    new bootstrap.Modal(document.getElementById('editSupplierModal')).show();
}

async function deleteSupplier(supplierId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا المورد؟')) {
        await deleteItem('suppliers', supplierId);
        await renderSuppliersList();
    }
}

// --- Partner Management ---

document.addEventListener('partnersPageLoaded', () => {
    renderPartnersList();
    setupAddPartnerForm();
    setupEditPartnerForm();
    const searchInput = document.getElementById('partnerSearchInput');
    if(searchInput) searchInput.addEventListener('input', (e) => renderPartnersList(e.target.value));
});

async function renderPartnersList(searchTerm = '') {
    try {
        let partners = await getAllItems('partners');
        if (searchTerm) {
            partners = partners.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

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
                    <td>${partner.current_balance.toFixed(2)}</td>
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
    }
}

function setupAddPartnerForm() {
    const form = document.getElementById('addPartnerForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const balance = parseFloat(document.getElementById('partnerBalance').value) || 0;
        const newPartner = {
            name: document.getElementById('partnerName').value,
            share_percentage: parseFloat(document.getElementById('partnerShare').value),
            previous_balance: balance,
            current_balance: balance
        };
        await addItem('partners', newPartner);
        bootstrap.Modal.getInstance(document.getElementById('addPartnerModal')).hide();
        form.reset();
        await renderPartnersList();
    });
}

function setupEditPartnerForm() {
    const form = document.getElementById('editPartnerForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const partnerId = parseInt(document.getElementById('editPartnerId').value);
        const originalPartner = await getItemById('partners', partnerId);
        const updatedPartner = {
            partner_id: partnerId,
            name: document.getElementById('editPartnerName').value,
            share_percentage: parseFloat(document.getElementById('editPartnerShare').value),
            current_balance: parseFloat(document.getElementById('editPartnerBalance').value),
            previous_balance: originalPartner.previous_balance
        };
        await updateItem('partners', updatedPartner);
        bootstrap.Modal.getInstance(document.getElementById('editPartnerModal')).hide();
        await renderPartnersList();
    });
}

async function editPartner(partnerId) {
    const partner = await getItemById('partners', partnerId);
    if (!partner) return;
    document.getElementById('editPartnerId').value = partner.partner_id;
    document.getElementById('editPartnerName').value = partner.name;
    document.getElementById('editPartnerShare').value = partner.share_percentage;
    document.getElementById('editPartnerBalance').value = partner.current_balance;
    new bootstrap.Modal(document.getElementById('editPartnerModal')).show();
}

async function deletePartner(partnerId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا الشريك؟')) {
        await deleteItem('partners', partnerId);
        await renderPartnersList();
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
    }
}

function setupAddContractorForm() {
    const form = document.getElementById('addContractorForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newContractor = {
            name: document.getElementById('contractorName').value,
            contact_info: document.getElementById('contractorContact').value
        };
        await addItem('contractors', newContractor);
        bootstrap.Modal.getInstance(document.getElementById('addContractorModal')).hide();
        form.reset();
        await renderContractorsList();
    });
}

function setupEditContractorForm() {
    const form = document.getElementById('editContractorForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const contractorId = parseInt(document.getElementById('editContractorId').value);
        const updatedContractor = {
            contractor_id: contractorId,
            name: document.getElementById('editContractorName').value,
            contact_info: document.getElementById('editContractorContact').value
        };
        await updateItem('contractors', updatedContractor);
        bootstrap.Modal.getInstance(document.getElementById('editContractorModal')).hide();
        await renderContractorsList();
    });
}

async function editContractor(contractorId) {
    const contractor = await getItemById('contractors', contractorId);
    if (!contractor) return;
    document.getElementById('editContractorId').value = contractor.contractor_id;
    document.getElementById('editContractorName').value = contractor.name;
    document.getElementById('editContractorContact').value = contractor.contact_info;
    new bootstrap.Modal(document.getElementById('editContractorModal')).show();
}

async function deleteContractor(contractorId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا المقاول؟')) {
        await deleteItem('contractors', contractorId);
        await renderContractorsList();
    }
}

// --- Project Management ---

document.addEventListener('projectsPageLoaded', () => {
    renderProjectsList();
    setupAddProjectForm();
    setupEditProjectForm();
    const searchInput = document.getElementById('projectSearchInput');
    if(searchInput) searchInput.addEventListener('input', (e) => renderProjectsList(e.target.value));
});

async function renderProjectsList(searchTerm = '') {
    try {
        let projects = await getAllItems('projects');
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            projects = projects.filter(p => p.name.toLowerCase().includes(lowerCaseSearchTerm) || (p.description && p.description.toLowerCase().includes(lowerCaseSearchTerm)));
        }

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
                        <div class="btn-group">
                            <a href="view-project.html?id=${project.project_id}" class="btn btn-sm btn-info"><i class="fas fa-eye"></i></a>
                            <button class="btn btn-sm btn-warning" onclick="editProject(${project.project_id})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProject(${project.project_id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error rendering projects list:', error);
    }
}

function setupAddProjectForm() {
    const form = document.getElementById('addProjectForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newProject = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            start_date: document.getElementById('projectStartDate').value,
            end_date: document.getElementById('projectEndDate').value,
            status: document.getElementById('projectStatus').value
        };
        await addItem('projects', newProject);
        bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
        form.reset();
        await renderProjectsList();
    });
}

function setupEditProjectForm() {
    const form = document.getElementById('editProjectForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
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
        await updateItem('projects', updatedProject);
        bootstrap.Modal.getInstance(document.getElementById('editProjectModal')).hide();
        await renderProjectsList();
    });
}

async function editProject(projectId) {
    const project = await getItemById('projects', projectId);
    if (!project) return;
    document.getElementById('editProjectId').value = project.project_id;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectStartDate').value = project.start_date;
    document.getElementById('editProjectEndDate').value = project.end_date;
    document.getElementById('editProjectStatus').value = project.status;
    new bootstrap.Modal(document.getElementById('editProjectModal')).show();
}

async function deleteProject(projectId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا المشروع؟')) {
        await deleteItem('projects', projectId);
        await renderProjectsList();
    }
}

// --- View Project Page ---
document.addEventListener('viewProjectPageLoaded', () => {
    const container = document.getElementById('project-view-container');
    container.prepend(createPrintHeader());
    container.append(createPrintFooter());
    renderSingleProject();
});

async function renderSingleProject() {
    // ... (existing code)
}

// --- Accounts (Treasuries) Management ---

document.addEventListener('accountsPageLoaded', () => {
    renderAccountsList();
    setupAddAccountForm();
    setupEditAccountForm();
    setupTransferForm();
});

async function renderAccountsList() {
    try {
        const accounts = await getAllItems('accounts');
        const tableBody = document.getElementById('accountsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (accounts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد خزن/حسابات. الرجاء إضافة واحدة.</td></tr>';
            return;
        }

        for (const account of accounts) {
            // Recalculate balance on the fly for accuracy
            const transactions = await getAllItems('transactions');
            const balance = transactions
                .filter(t => t.account_id === account.account_id)
                .reduce((bal, t) => bal + (t.transaction_type === 'قبض' ? t.amount : -t.amount), account.initial_balance || 0);

            // Update the stored balance if it's different
            if (balance !== account.balance) {
                account.balance = balance;
                await updateItem('accounts', account);
            }

            const row = `
                <tr>
                    <td>${account.account_id}</td>
                    <td>${account.name}</td>
                    <td>${balance.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editAccount(${account.account_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAccount(${account.account_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        }
    } catch (error) {
        console.error('Error rendering accounts list:', error);
    }
}

function setupAddAccountForm() {
    const form = document.getElementById('addAccountForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const balance = parseFloat(document.getElementById('accountBalance').value) || 0;
        const newAccount = {
            name: document.getElementById('accountName').value,
            initial_balance: balance,
            balance: balance
        };
        await addItem('accounts', newAccount);
        bootstrap.Modal.getInstance(document.getElementById('addAccountModal')).hide();
        form.reset();
        await renderAccountsList();
    });
}

function setupEditAccountForm() {
    const form = document.getElementById('editAccountForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = parseInt(document.getElementById('editAccountId').value);
        const account = await getItemById('accounts', accountId);
        account.name = document.getElementById('editAccountName').value;
        await updateItem('accounts', account);
        bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
        await renderAccountsList();
    });
}

async function editAccount(accountId) {
    const account = await getItemById('accounts', accountId);
    if (!account) return;
    document.getElementById('editAccountId').value = account.account_id;
    document.getElementById('editAccountName').value = account.name;
    new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

async function deleteAccount(accountId) {
    const transactions = await getAllItems('transactions');
    if (transactions.some(t => t.account_id === accountId)) {
        alert('لا يمكن حذف هذه الخزنة لأنها مرتبطة بمعاملات حالية. يجب حذف المعاملات المرتبطة أولاً.');
        return;
    }
    if (confirm('هل أنت متأكد من أنك تريد حذف هذه الخزنة/الحساب؟')) {
        await deleteItem('accounts', accountId);
        await renderAccountsList();
    }
}

function setupTransferForm() {
    const form = document.getElementById('transferForm');
    if (!form) return;

    const fromSelect = document.getElementById('fromAccount');
    const toSelect = document.getElementById('toAccount');

    getAllItems('accounts').then(accounts => {
        fromSelect.innerHTML = '<option value="">اختر حساب المصدر</option>';
        toSelect.innerHTML = '<option value="">اختر حساب الوجهة</option>';
        accounts.forEach(acc => {
            fromSelect.innerHTML += `<option value="${acc.account_id}">${acc.name} (الرصيد: ${acc.balance.toFixed(2)})</option>`;
            toSelect.innerHTML += `<option value="${acc.account_id}">${acc.name}</option>`;
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fromAccountId = parseInt(fromSelect.value);
        const toAccountId = parseInt(toSelect.value);
        const amount = parseFloat(document.getElementById('transferAmount').value);

        if (!fromAccountId || !toAccountId || !amount) {
            alert('يرجى ملء جميع الحقول.');
            return;
        }
        if (fromAccountId === toAccountId) {
            alert('لا يمكن التحويل إلى نفس الحساب.');
            return;
        }

        const tx = db.transaction(['accounts', 'transactions'], 'readwrite');
        const accountStore = tx.objectStore('accounts');
        const transactionStore = tx.objectStore('transactions');

        try {
            const fromAccount = await accountStore.get(fromAccountId);
            const toAccount = await accountStore.get(toAccountId);

            if (fromAccount.balance < amount) {
                alert('رصيد حساب المصدر غير كافٍ لإتمام العملية.');
                tx.abort();
                return;
            }

            // Update balances
            fromAccount.balance -= amount;
            toAccount.balance += amount;

            // Create transactions
            const date = new Date().toISOString().split('T')[0];
            const withdrawal = { account_id: fromAccountId, transaction_type: 'صرف', amount: amount, date: date, description: `تحويل إلى ${toAccount.name}`};
            const deposit = { account_id: toAccountId, transaction_type: 'قبض', amount: amount, date: date, description: `تحويل من ${fromAccount.name}`};

            accountStore.put(fromAccount);
            accountStore.put(toAccount);
            transactionStore.add(withdrawal);
            transactionStore.add(deposit);

            await new Promise((resolve, reject) => {
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });

            bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
            form.reset();
            await renderAccountsList();

        } catch (error) {
            console.error('Transfer failed:', error);
            alert('فشل التحويل.');
            tx.abort();
        }
    });
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
    const form = document.getElementById('addItemForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newItem = {
            name: document.getElementById('itemName').value,
            unit_price: parseFloat(document.getElementById('itemPrice').value)
        };
        await addItem('items', newItem);
        bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
        form.reset();
        await renderItemsList();
    });
}

function setupEditItemForm() {
    const form = document.getElementById('editItemForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const itemId = parseInt(document.getElementById('editItemId').value);
        const updatedItem = {
            item_id: itemId,
            name: document.getElementById('editItemName').value,
            unit_price: parseFloat(document.getElementById('editItemPrice').value)
        };
        await updateItem('items', updatedItem);
        bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
        await renderItemsList();
    });
}

async function editItemRecord(itemId) {
    const item = await getItemById('items', itemId);
    if (!item) return;
    document.getElementById('editItemId').value = item.item_id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemPrice').value = item.unit_price;
    new bootstrap.Modal(document.getElementById('editItemModal')).show();
}

async function deleteItemRecord(itemId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذا البند؟')) {
        await deleteItem('items', itemId);
        await renderItemsList();
    }
}

// --- Dashboard Management ---

document.addEventListener('dashboardPageLoaded', () => {
    renderDashboard();
});

async function renderDashboard() {
    try {
        const [clients, suppliers, projects, transactions, accounts] = await Promise.all([
            getAllItems('clients'), getAllItems('suppliers'), getAllItems('projects'), getAllItems('transactions'), getAllItems('accounts')
        ]);

        document.getElementById('dashboard-total-clients').textContent = clients.length;
        document.getElementById('dashboard-total-suppliers').textContent = suppliers.length;
        document.getElementById('dashboard-active-projects').textContent = projects.filter(p => p.status === 'جارٍ').length;

        // Render account balances
        const accountBalancesBody = document.getElementById('accountBalancesTableBody');
        accountBalancesBody.innerHTML = '';
        if (accounts.length > 0) {
            let totalBalance = 0;
            accounts.forEach(acc => {
                accountBalancesBody.innerHTML += `<tr><td class="fw-bold">${acc.name}</td><td class="text-end">${acc.balance.toFixed(2)}</td></tr>`;
                totalBalance += acc.balance;
            });
            accountBalancesBody.innerHTML += `<tr class="table-light"><td class="fw-bold">الإجمالي</td><td class="text-end fw-bold">${totalBalance.toFixed(2)}</td></tr>`;
        } else {
            accountBalancesBody.innerHTML = '<tr><td>الرجاء إضافة خزنة/حساب أولاً.</td></tr>';
        }

        const recentTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        const recentTableBody = document.getElementById('recentTransactionsTableBody');
        recentTableBody.innerHTML = '';
        if (recentTransactions.length > 0) {
            recentTransactions.forEach(t => {
                const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
                recentTableBody.innerHTML += `<tr><td>${t.date}</td><td class="${typeClass}">${t.transaction_type}</td><td>${t.amount.toFixed(2)}</td><td>${t.description || '-'}</td></tr>`;
            });
        } else {
            recentTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد معاملات حديثة.</td></tr>';
        }
    } catch (error) { console.error('Error rendering dashboard:', error); }
}

// --- Transaction Management ---

document.addEventListener('transactionsPageLoaded', () => {
    renderTransactionsList();
    setupAddTransactionForm();
});

async function getLinkedEntityName(transaction) {
    const linkMap = { linked_client_id: 'clients', linked_supplier_id: 'suppliers', linked_project_id: 'projects', linked_partner_id: 'partners' };
    for (const key in linkMap) {
        if (transaction[key]) {
            try {
                const entity = await getItemById(linkMap[key], transaction[key]);
                return entity ? entity.name : `<span class="text-muted">غير موجود</span>`;
            } catch { return `<span class="text-danger">خطأ</span>`; }
        }
    }
    return '-';
}

async function renderTransactionsList() {
    try {
        const transactions = (await getAllItems('transactions')).sort((a, b) => new Date(b.date) - new Date(a.date));
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد معاملات لعرضها.</td></tr>';
            return;
        }
        for (const t of transactions) {
            const linkedEntityName = await getLinkedEntityName(t);
            const account = await getItemById('accounts', t.account_id);
            const typeClass = t.transaction_type === 'قبض' ? 'text-success' : 'text-danger';
            tableBody.innerHTML += `<tr><td>${t.date}</td><td>${account ? account.name : 'غير معروف'}</td><td class="${typeClass} fw-bold">${t.transaction_type}</td><td>${t.amount.toFixed(2)}</td><td>${t.description || '-'}</td><td>${linkedEntityName}</td><td><button class="btn btn-sm btn-danger" onclick="deleteTransaction(${t.transaction_id})"><i class="fas fa-trash"></i></button></td></tr>`;
        }
    } catch (error) { console.error('Error rendering transactions list:', error); }
}

async function populateLinkableItems(linkType, targetDropdown) {
    targetDropdown.innerHTML = '<option value="">اختر...</option>';
    targetDropdown.disabled = true;
    if (!linkType) return;
    try {
        const items = await getAllItems(linkType);
        if (items && items.length > 0) {
            items.forEach(item => {
                targetDropdown.innerHTML += `<option value="${item[Object.keys(item).find(k => k.endsWith('_id'))]}">${item.name}</option>`;
            });
            targetDropdown.disabled = false;
        } else {
            targetDropdown.innerHTML = `<option value="">لا يوجد بيانات</option>`;
        }
    } catch (error) { console.error(`Error populating ${linkType}:`, error); }
}

function setupAddTransactionForm() {
    const form = document.getElementById('addTransactionForm');
    if (!form) return;
    const linkTypeDropdown = document.getElementById('transactionLinkType');
    const linkIdDropdown = document.getElementById('transactionLinkId');
    const accountDropdown = document.getElementById('transactionAccount');

    document.getElementById('transactionDate').valueAsDate = new Date();

    // Populate accounts dropdown
    getAllItems('accounts').then(accounts => {
        accountDropdown.innerHTML = '';
        if (accounts.length === 0) {
            accountDropdown.innerHTML = '<option value="">الرجاء إضافة خزنة أولاً</option>';
        } else {
            accounts.forEach(acc => {
                accountDropdown.innerHTML += `<option value="${acc.account_id}">${acc.name}</option>`;
            });
        }
    });

    linkTypeDropdown.addEventListener('change', () => populateLinkableItems(linkTypeDropdown.value, linkIdDropdown));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const accountId = parseInt(accountDropdown.value);
        if (!accountId) {
            alert('الرجاء اختيار خزنة/حساب أولاً.');
            return;
        }

        const transactionData = {
            account_id: accountId,
            transaction_type: document.getElementById('transactionType').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            date: document.getElementById('transactionDate').value,
            description: document.getElementById('transactionDescription').value,
        };
        const linkType = linkTypeDropdown.value;
        const linkId = linkIdDropdown.value ? parseInt(linkIdDropdown.value) : null;
        if (linkType && linkId) {
            transactionData[`linked_${linkType.slice(0, -1)}_id`] = linkId;
        }

        const tx = db.transaction(['transactions', 'accounts', 'clients', 'suppliers', 'partners'], 'readwrite');
        const accountStore = tx.objectStore('accounts');

        // Add transaction
        tx.objectStore('transactions').add(transactionData);

        // Update account balance
        const account = await accountStore.get(accountId);
        const amount = transactionData.amount;
        account.balance += (transactionData.transaction_type === 'قبض' ? amount : -amount);
        accountStore.put(account);

        // Update linked entity balance (e.g., client's debt)
        if (linkType && linkId && ['clients', 'suppliers', 'partners'].includes(linkType)) {
            const entityStore = tx.objectStore(linkType);
            const entity = await entityStore.get(linkId);
            if (entity) {
                if (linkType === 'clients') entity.balance += (transactionData.transaction_type === 'قبض' ? -amount : amount);
                else if (linkType === 'suppliers') entity.balance += (transactionData.transaction_type === 'صرف' ? -amount : amount);
                else if (linkType === 'partners') entity.current_balance += (transactionData.transaction_type === 'صرف' ? amount : -amount);
                entityStore.put(entity);
            }
        }

        await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });

        bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
        form.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        await renderTransactionsList();
    });
}

async function deleteTransaction(transactionId) {
    if (confirm('هل أنت متأكد من أنك تريد حذف هذه المعاملة؟ لن يتم تحديث رصيد الجهة المرتبطة تلقائيًا.')) {
        await deleteItem('transactions', transactionId);
        await renderTransactionsList();
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
            tableBody.innerHTML += `<tr><td>${settlement.date}</td><td>${partner ? partner.name : 'شريك محذوف'}</td><td>${settlement.payment_amount.toFixed(2)}</td><td>${settlement.previous_balance.toFixed(2)}</td><td>${settlement.final_balance.toFixed(2)}</td><td><button class="btn btn-sm btn-danger" onclick="deleteSettlement(${settlement.settlement_id})"><i class="fas fa-trash"></i></button></td></tr>`;
        }
    } catch (error) { console.error('Error rendering settlements list:', error); }
}

function setupAddSettlementForm() {
    const form = document.getElementById('addSettlementForm');
    if (!form) return;
    const partnerSelect = document.getElementById('settlementPartner');
    const detailsDiv = document.getElementById('partnerDetails');
    const amountInput = document.getElementById('settlementAmount');
    const finalBalanceSpan = document.getElementById('partnerFinalBalance');
    document.getElementById('settlementDate').valueAsDate = new Date();

    getAllItems('partners').then(partners => {
        partnerSelect.innerHTML = '<option value="">اختر شريكًا...</option>';
        partners.forEach(p => { partnerSelect.innerHTML += `<option value="${p.partner_id}">${p.name}</option>`; });
    });

    let selectedPartner = null;
    const updateBalances = () => {
        if (!selectedPartner) return;
        const paymentAmount = parseFloat(amountInput.value) || 0;
        finalBalanceSpan.textContent = (selectedPartner.current_balance - paymentAmount).toFixed(2);
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
            document.getElementById('partnerOutstandingAmount').textContent = (selectedPartner.current_balance - selectedPartner.previous_balance).toFixed(2);
            detailsDiv.classList.remove('d-none');
            updateBalances();
        }
    });

    amountInput.addEventListener('input', updateBalances);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedPartner) { alert('الرجاء اختيار شريك أولاً.'); return; }
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
        const updatedPartner = { ...selectedPartner, previous_balance: selectedPartner.current_balance, current_balance: finalBalance };
        const tx = db.transaction(['settlements', 'partners'], 'readwrite');
        tx.objectStore('settlements').add(settlementRecord);
        tx.objectStore('partners').put(updatedPartner);
        await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
        bootstrap.Modal.getInstance(document.getElementById('addSettlementModal')).hide();
        form.reset();
        detailsDiv.classList.add('d-none');
        renderSettlementsList();
    });
}

function deleteSettlement(settlementId) {
    alert(`حذف التسويات غير مدعوم حاليًا لأنه يتطلب عملية معقدة لعكس الأرصدة. (ID: ${settlementId})`);
}

// --- Invoice Management ---

document.addEventListener('invoicesPageLoaded', () => renderInvoicesList());
document.addEventListener('createInvoicePageLoaded', () => setupCreateInvoiceForm());

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
            tableBody.innerHTML += `<tr><td>#${invoice.invoice_id}</td><td>${client ? client.name : 'عميل محذوف'}</td><td>${invoice.issue_date}</td><td>${invoice.due_date}</td><td>${invoice.total_amount.toFixed(2)}</td><td><span class="badge ${status_class}">${invoice.status}</span></td><td><button class="btn btn-sm btn-info" onclick="viewInvoice(${invoice.invoice_id})"><i class="fas fa-eye"></i></button></td></tr>`;
        }
    } catch (error) { console.error('Error rendering invoices list:', error); }
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
    clientSelect.innerHTML = '<option value="">اختر عميلاً...</option>';
    clients.forEach(c => { clientSelect.innerHTML += `<option value="${c.client_id}">${c.name}</option>`; });

    const createLineItemRow = () => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><select class="form-select item-select"><option value="">اختر بندًا...</option>${items.map(i => `<option value="${i.item_id}" data-price="${i.unit_price}">${i.name}</option>`).join('')}</select></td><td><input type="number" class="form-control quantity" value="1" min="1"></td><td><input type="number" class="form-control unit-price" readonly></td><td><input type="number" class="form-control line-total" readonly></td><td><button type="button" class="btn btn-sm btn-danger remove-item-btn"><i class="fas fa-trash"></i></button></td>`;
        lineItemsBody.appendChild(row);
    };

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
        document.getElementById('invoiceSubtotal').textContent = subtotal.toFixed(2);
        document.getElementById('invoiceTotal').textContent = (subtotal + taxAmount).toFixed(2);
    };

    addLineItemBtn.addEventListener('click', createLineItemRow);
    lineItemsBody.addEventListener('change', e => {
        if (e.target.classList.contains('item-select')) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            e.target.closest('tr').querySelector('.unit-price').value = parseFloat(selectedOption.dataset.price || 0).toFixed(2);
            calculateInvoiceTotals();
        }
    });
    lineItemsBody.addEventListener('input', e => { if (e.target.classList.contains('quantity')) calculateInvoiceTotals(); });
    lineItemsBody.addEventListener('click', e => { if (e.target.closest('.remove-item-btn')) { e.target.closest('tr').remove(); calculateInvoiceTotals(); } });
    taxInput.addEventListener('input', calculateInvoiceTotals);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lineItems = [];
        lineItemsBody.querySelectorAll('tr').forEach(row => {
            const itemId = row.querySelector('.item-select').value;
            if(itemId) lineItems.push({ item_id: parseInt(itemId), quantity: parseInt(row.querySelector('.quantity').value), unit_price: parseFloat(row.querySelector('.unit-price').value), line_total: parseFloat(row.querySelector('.line-total').value) });
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
        await addItem('invoices', newInvoice);
        alert('تم حفظ الفاتورة بنجاح!');
        window.location.href = 'index.html';
    });
    createLineItemRow();
}

function viewInvoice(invoiceId) {
    window.location.href = `view-invoice.html?id=${invoiceId}`;
}

document.addEventListener('viewInvoicePageLoaded', async () => {
    const container = document.getElementById('invoice-view-container');
    container.prepend(createPrintHeader());
    container.append(createPrintFooter());
    renderSingleInvoice();
});

async function renderSingleInvoice() {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = parseInt(params.get('id'));
    const container = document.getElementById('invoice-view-container');
    if (!invoiceId) { container.innerHTML = '<p class="text-danger">لم يتم تحديد فاتورة.</p>'; return; }
    try {
        const invoice = await getItemById('invoices', invoiceId);
        const client = await getItemById('clients', invoice.client_id);
        const transactions = await getAllItems('transactions');
        const payments = transactions.filter(t => t.linked_invoice_id === invoiceId);
        const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const balanceDue = invoice.total_amount - amountPaid;
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 d-print-none">
                <h1 class="h3">فاتورة #${invoice.invoice_id}</h1>
                <div>
                    <a href="index.html" class="btn btn-outline-secondary"><i class="fas fa-arrow-right me-2"></i>العودة</a>
                    <button class="btn btn-info" onclick="window.print()"><i class="fas fa-print me-2"></i>طباعة</button>
                </div>
            </div>
            <div class="card shadow-sm"><div class="card-body">
                <div class="row mb-4"><div class="col-md-6"><h5>العميل:</h5><p>${client.name}<br>${client.address || ''}<br>${client.phone || ''}</p></div>
                <div class="col-md-6 text-md-end"><p><strong>تاريخ الإصدار:</strong> ${invoice.issue_date}</p><p><strong>تاريخ الاستحقاق:</strong> ${invoice.due_date}</p><p><strong>الحالة:</strong> <span class="badge bg-primary">${invoice.status}</span></p></div></div>
                <table class="table table-bordered">
                    <thead class="table-light"><tr><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
                    <tbody>${invoice.line_items.map(item => `<tr><td>${item.item_id}</td><td>${item.quantity}</td><td>${item.unit_price.toFixed(2)}</td><td>${item.line_total.toFixed(2)}</td></tr>`).join('')}</tbody>
                    <tfoot>
                        <tr><td colspan="3" class="text-end">المجموع الفرعي</td><td class="text-end">${invoice.subtotal_amount.toFixed(2)}</td></tr>
                        <tr><td colspan="3" class="text-end">الضريبة</td><td class="text-end">${invoice.tax_amount.toFixed(2)}</td></tr>
                        <tr class="fw-bold"><td colspan="3" class="text-end">الإجمالي</td><td class="text-end">${invoice.total_amount.toFixed(2)}</td></tr>
                        <tr class="fw-bold text-success"><td colspan="3" class="text-end">المدفوع</td><td class="text-end">${amountPaid.toFixed(2)}</td></tr>
                        <tr class="fw-bold text-danger"><td colspan="3" class="text-end">المتبقي</td><td class="text-end">${balanceDue.toFixed(2)}</td></tr>
                    </tfoot>
                </table>
                ${balanceDue > 0 ? `<div class="text-end mt-4"><button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#recordPaymentModal">تسجيل دفعة</button></div>` : ''}
            </div></div>`;
        if (balanceDue > 0) {
            document.getElementById('paymentAmount').value = balanceDue.toFixed(2);
            document.getElementById('paymentDate').valueAsDate = new Date();
            document.getElementById('recordPaymentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
                const transaction = { transaction_type: 'قبض', amount: paymentAmount, date: document.getElementById('paymentDate').value, description: `دفعة للفاتورة رقم #${invoice.invoice_id}`, linked_client_id: client.client_id, linked_invoice_id: invoice.invoice_id };
                invoice.status = (amountPaid + paymentAmount) >= invoice.total_amount ? 'Paid' : 'Partially Paid';
                client.balance -= paymentAmount;
                const tx = db.transaction(['transactions', 'invoices', 'clients'], 'readwrite');
                tx.objectStore('transactions').add(transaction);
                tx.objectStore('invoices').put(invoice);
                tx.objectStore('clients').put(client);
                await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject; });
                alert('تم تسجيل الدفعة بنجاح!');
                location.reload();
            });
        }
    } catch (error) {
        console.error('Error loading invoice:', error);
        container.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل الفاتورة.</p>';
    }
}

// --- Reports Management ---

document.addEventListener('reportsPageLoaded', () => {
    setupIncomeExpenseReport();
    setupClientStatementGenerator();
    setupSupplierStatementGenerator();
    setupInvoicesReportGenerator();
    const projectsTab = document.getElementById('projects-tab');
    if (projectsTab) projectsTab.addEventListener('shown.bs.tab', generateProjectsSummaryReport);
    const settlementsTab = document.getElementById('settlements-report-tab');
    if (settlementsTab) settlementsTab.addEventListener('shown.bs.tab', generateSettlementsReport);
});

function setupIncomeExpenseReport() {
    const generateBtn = document.getElementById('generateIncomeExpenseReport');
    const accountFilter = document.getElementById('reportAccountFilter');
    if (!generateBtn || !accountFilter) return;

    getAllItems('accounts').then(accounts => {
        accountFilter.innerHTML = '<option value="all">كل الخزن</option>';
        accounts.forEach(acc => {
            accountFilter.innerHTML += `<option value="${acc.account_id}">${acc.name}</option>`;
        });
    });

    generateBtn.addEventListener('click', generateIncomeExpenseReport);
    document.getElementById('startDate').valueAsDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    document.getElementById('endDate').valueAsDate = new Date();
}

async function generateIncomeExpenseReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const accountId = document.getElementById('reportAccountFilter').value;
    const resultDiv = document.getElementById('incomeExpenseReportResult');
    if (!startDate || !endDate) { resultDiv.innerHTML = '<p class="text-danger text-center">الرجاء تحديد تاريخ البدء والانتهاء.</p>'; return; }
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد التقرير...</p>';
    try {
        let allTransactions = await getAllItems('transactions');
        // Filter by account
        if (accountId !== 'all') {
            allTransactions = allTransactions.filter(t => t.account_id === parseInt(accountId));
        }
        const filtered = allTransactions.filter(t => new Date(t.date) >= new Date(startDate) && new Date(t.date) <= new Date(endDate));
        const income = filtered.filter(t => t.transaction_type === 'قبض');
        const expenses = filtered.filter(t => t.transaction_type === 'صرف');
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const netTotal = totalIncome - totalExpenses;
        resultDiv.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3"><div class="card text-white bg-success"><div class="card-body"><h5 class="card-title">إجمالي الإيرادات</h5><p class="card-text fs-4 fw-bold">${totalIncome.toFixed(2)}</p></div></div></div>
                <div class="col-md-4 mb-3"><div class="card text-white bg-danger"><div class="card-body"><h5 class="card-title">إجمالي المصروفات</h5><p class="card-text fs-4 fw-bold">${totalExpenses.toFixed(2)}</p></div></div></div>
                <div class="col-md-4 mb-3"><div class="card text-white ${netTotal >= 0 ? 'bg-primary' : 'bg-secondary'}"><div class="card-body"><h5 class="card-title">صافي الحركة</h5><p class="card-text fs-4 fw-bold">${netTotal.toFixed(2)}</p></div></div></div>
            </div><hr><div class="row mt-4">
                <div class="col-md-6"><h4>تفاصيل الإيرادات</h4><ul class="list-group">${income.length > 0 ? income.map(t => `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${t.date}: ${t.description || 'إيراد'}</span><span class="badge bg-success rounded-pill">${t.amount.toFixed(2)}</span></li>`).join('') : '<li class="list-group-item">لا توجد إيرادات.</li>'}</ul></div>
                <div class="col-md-6"><h4>تفاصيل المصروفات</h4><ul class="list-group">${expenses.length > 0 ? expenses.map(t => `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${t.date}: ${t.description || 'مصروف'}</span><span class="badge bg-danger rounded-pill">${t.amount.toFixed(2)}</span></li>`).join('') : '<li class="list-group-item">لا توجد مصروفات.</li>'}</ul></div>
            </div>`;
    } catch (error) { console.error('Error generating report:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

function setupClientStatementGenerator() {
    const clientSelect = document.getElementById('clientStatementSelect');
    const generateBtn = document.getElementById('generateClientStatement');
    if (!clientSelect || !generateBtn) return;
    getAllItems('clients').then(clients => {
        clientSelect.innerHTML = '<option value="">اختر عميلاً...</option>';
        clients.forEach(c => { clientSelect.innerHTML += `<option value="${c.client_id}">${c.name}</option>`; });
    });
    generateBtn.addEventListener('click', generateClientStatement);
}

async function generateClientStatement() {
    const clientId = document.getElementById('clientStatementSelect').value;
    const resultDiv = document.getElementById('clientStatementResult');
    if (!clientId) { resultDiv.innerHTML = '<p class="text-danger text-center">الرجاء اختيار عميل.</p>'; return; }
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد الكشف...</p>';
    try {
        const client = await getItemById('clients', parseInt(clientId));
        const transactions = (await getAllItems('transactions')).filter(t => t.linked_client_id === client.client_id).sort((a, b) => new Date(a.date) - new Date(b.date));
        let openingBalance = client.balance;
        [...transactions].reverse().forEach(t => { openingBalance += (t.transaction_type === 'قبض' ? t.amount : -t.amount); });
        let runningBalance = openingBalance;
        let statementHTML = `<h4>كشف حساب لـ: ${client.name}</h4><p><strong>الرصيد الحالي: ${client.balance.toFixed(2)}</strong></p><table class="table table-sm table-bordered"><thead class="table-light"><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody><tr><td colspan="4" class="text-end fw-bold">رصيد افتتاحي</td><td class="fw-bold">${openingBalance.toFixed(2)}</td></tr>`;
        transactions.forEach(t => {
            const debit = t.transaction_type === 'صرف' ? t.amount.toFixed(2) : '';
            const credit = t.transaction_type === 'قبض' ? t.amount.toFixed(2) : '';
            runningBalance += (t.transaction_type === 'صرف' ? t.amount : -t.amount);
            statementHTML += `<tr><td>${t.date}</td><td>${t.description || t.transaction_type}</td><td>${debit}</td><td>${credit}</td><td>${runningBalance.toFixed(2)}</td></tr>`;
        });
        statementHTML += '</tbody></table>';
        resultDiv.innerHTML = statementHTML;
    } catch (error) { console.error('Error generating client statement:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

function setupSupplierStatementGenerator() {
    const supplierSelect = document.getElementById('supplierStatementSelect');
    const generateBtn = document.getElementById('generateSupplierStatement');
    if (!supplierSelect || !generateBtn) return;
    getAllItems('suppliers').then(suppliers => {
        supplierSelect.innerHTML = '<option value="">اختر موردًا...</option>';
        suppliers.forEach(s => { supplierSelect.innerHTML += `<option value="${s.supplier_id}">${s.name}</option>`; });
    });
    generateBtn.addEventListener('click', generateSupplierStatement);
}

async function generateSupplierStatement() {
    const supplierId = document.getElementById('supplierStatementSelect').value;
    const resultDiv = document.getElementById('supplierStatementResult');
    if (!supplierId) { resultDiv.innerHTML = '<p class="text-danger text-center">الرجاء اختيار مورد.</p>'; return; }
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد الكشف...</p>';
    try {
        const supplier = await getItemById('suppliers', parseInt(supplierId));
        const transactions = (await getAllItems('transactions')).filter(t => t.linked_supplier_id === supplier.supplier_id).sort((a, b) => new Date(a.date) - new Date(b.date));
        let openingBalance = supplier.balance;
        [...transactions].reverse().forEach(t => { openingBalance += (t.transaction_type === 'صرف' ? t.amount : -t.amount); });
        let runningBalance = openingBalance;
        let statementHTML = `<h4>كشف حساب لـ: ${supplier.name}</h4><p><strong>الرصيد الحالي: ${supplier.balance.toFixed(2)}</strong></p><table class="table table-sm table-bordered"><thead class="table-light"><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody><tr><td colspan="4" class="text-end fw-bold">رصيد افتتاحي</td><td class="fw-bold">${openingBalance.toFixed(2)}</td></tr>`;
        transactions.forEach(t => {
            const debit = t.transaction_type === 'صرف' ? t.amount.toFixed(2) : '';
            const credit = t.transaction_type === 'قبض' ? t.amount.toFixed(2) : '';
            runningBalance += (t.transaction_type === 'قبض' ? t.amount : -t.amount);
            statementHTML += `<tr><td>${t.date}</td><td>${t.description || t.transaction_type}</td><td>${debit}</td><td>${credit}</td><td>${runningBalance.toFixed(2)}</td></tr>`;
        });
        statementHTML += '</tbody></table>';
        resultDiv.innerHTML = statementHTML;
    } catch (error) { console.error('Error generating supplier statement:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

async function generateProjectsSummaryReport() {
    const resultDiv = document.getElementById('projectsReportResult');
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد التقرير...</p>';
    try {
        const [projects, transactions] = await Promise.all([getAllItems('projects'), getAllItems('transactions')]);
        if (projects.length === 0) { resultDiv.innerHTML = '<p class="text-center">لا يوجد مشاريع.</p>'; return; }
        let reportHTML = `<table class="table table-bordered table-hover"><thead class="table-light"><tr><th>المشروع</th><th>الحالة</th><th>إجمالي الإيرادات</th><th>إجمالي المصروفات</th><th>صافي الربح/الخسارة</th></tr></thead><tbody>`;
        projects.forEach(project => {
            const projectTransactions = transactions.filter(t => t.linked_project_id === project.project_id);
            const income = projectTransactions.filter(t => t.transaction_type === 'قبض').reduce((sum, t) => sum + t.amount, 0);
            const expenses = projectTransactions.filter(t => t.transaction_type === 'صرف').reduce((sum, t) => sum + t.amount, 0);
            const net = income - expenses;
            reportHTML += `<tr><td><a href="view-project.html?id=${project.project_id}">${project.name}</a></td><td><span class="badge bg-primary">${project.status}</span></td><td>${income.toFixed(2)}</td><td>${expenses.toFixed(2)}</td><td class="fw-bold ${net >= 0 ? 'text-success' : 'text-danger'}">${net.toFixed(2)}</td></tr>`;
        });
        reportHTML += '</tbody></table>';
        resultDiv.innerHTML = reportHTML;
    } catch (error) { console.error('Error generating projects summary report:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

function setupInvoicesReportGenerator() {
    const statusFilter = document.getElementById('invoiceStatusFilter');
    const clientFilter = document.getElementById('invoiceClientFilter');
    const generateBtn = document.getElementById('generateInvoicesReport');
    if (!statusFilter || !clientFilter || !generateBtn) return;
    getAllItems('clients').then(clients => {
        clientFilter.innerHTML = '<option value="all">كل العملاء</option>';
        clients.forEach(c => { clientFilter.innerHTML += `<option value="${c.client_id}">${c.name}</option>`; });
    });
    generateBtn.addEventListener('click', generateInvoicesReport);
}

async function generateInvoicesReport() {
    const status = document.getElementById('invoiceStatusFilter').value;
    const clientId = document.getElementById('invoiceClientFilter').value;
    const resultDiv = document.getElementById('invoicesReportResult');
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد التقرير...</p>';
    try {
        let invoices = await getAllItems('invoices');
        if (status !== 'all') invoices = invoices.filter(inv => inv.status === status);
        if (clientId !== 'all') invoices = invoices.filter(inv => inv.client_id === parseInt(clientId));
        if (invoices.length === 0) { resultDiv.innerHTML = '<p class="text-center">لا توجد فواتير تطابق البحث.</p>'; return; }
        let reportHTML = `<table class="table table-bordered table-hover"><thead class="table-light"><tr><th>#</th><th>العميل</th><th>تاريخ الإصدار</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>`;
        for (const invoice of invoices) {
            const client = await getItemById('clients', invoice.client_id);
            reportHTML += `<tr><td><a href="view-invoice.html?id=${invoice.invoice_id}">#${invoice.invoice_id}</a></td><td>${client ? client.name : 'محذوف'}</td><td>${invoice.issue_date}</td><td>${invoice.total_amount.toFixed(2)}</td><td><span class="badge ${invoice.status === 'Paid' ? 'text-success' : 'text-danger'}">${invoice.status}</span></td></tr>`;
        }
        reportHTML += '</tbody></table>';
        resultDiv.innerHTML = reportHTML;
    } catch (error) { console.error('Error generating invoices report:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

async function generateSettlementsReport() {
    const resultDiv = document.getElementById('settlementsReportResult');
    resultDiv.innerHTML = '<p class="text-info text-center">جاري توليد التقرير...</p>';
    try {
        const settlements = await getAllItems('settlements');
        if (settlements.length === 0) { resultDiv.innerHTML = '<p class="text-center">لا يوجد تسويات لعرضها.</p>'; return; }
        let reportHTML = `<table class="table table-bordered table-hover"><thead class="table-light"><tr><th>تاريخ التسوية</th><th>الشريك</th><th>المبلغ المسدد</th><th>الرصيد قبل</th><th>الرصيد بعد</th></tr></thead><tbody>`;
        for (const settlement of settlements) {
            const partner = await getItemById('partners', settlement.partner_id);
            reportHTML += `<tr><td>${settlement.date}</td><td>${partner ? partner.name : 'محذوف'}</td><td>${settlement.payment_amount.toFixed(2)}</td><td>${settlement.previous_balance.toFixed(2)}</td><td class="fw-bold">${settlement.final_balance.toFixed(2)}</td></tr>`;
        }
        reportHTML += '</tbody></table>';
        resultDiv.innerHTML = reportHTML;
    } catch (error) { console.error('Error generating settlements report:', error); resultDiv.innerHTML = '<p class="text-danger text-center">حدث خطأ.</p>'; }
}

// --- Settings & PWA ---

document.addEventListener('settingsPageLoaded', () => {
    // Data Management
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importFile');
    if (exportBtn) exportBtn.addEventListener('click', exportDataToJSON);
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importDataFromJSON);

    // Print Settings
    const companyNameInput = document.getElementById('printCompanyName');
    const footerTextInput = document.getElementById('printFooterText');
    if (companyNameInput && footerTextInput) {
        companyNameInput.value = localStorage.getItem('printCompanyName') || '';
        footerTextInput.value = localStorage.getItem('printFooterText') || '';
        companyNameInput.addEventListener('input', (e) => localStorage.setItem('printCompanyName', e.target.value));
        footerTextInput.addEventListener('input', (e) => localStorage.setItem('printFooterText', e.target.value));
    }
});

async function exportDataToJSON() {
    try {
        const storeNames = ['clients', 'suppliers', 'partners', 'contractors', 'projects', 'transactions', 'settlements', 'items', 'invoices'];
        const dataToExport = {};
        for (const storeName of storeNames) {
            dataToExport[storeName] = await getAllItems(storeName);
        }
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `treasury-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) { console.error('Error exporting data:', error); alert('حدث خطأ أثناء تصدير البيانات.'); }
}

async function importDataFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (prompt("تحذير: هذه العملية ستحذف جميع البيانات الحالية. للمتابعة، اكتب 'تأكيد'") !== 'تأكيد') {
        event.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const storeNames = Object.keys(data);
            const tx = db.transaction(storeNames, 'readwrite');
            await Promise.all(storeNames.map(storeName => new Promise((resolve, reject) => {
                const request = tx.objectStore(storeName).clear();
                request.onsuccess = resolve;
                request.onerror = reject;
            })));
            await Promise.all(storeNames.flatMap(storeName => data[storeName].map(item => {
                const keyPath = db.transaction(storeName).objectStore(storeName).keyPath;
                if(keyPath) delete item[keyPath];
                return addItem(storeName, item);
            })));
            alert('تم استيراد البيانات بنجاح! سيتم إعادة تحميل التطبيق.');
            location.reload();
        } catch (error) { console.error('Error importing data:', error); alert('فشل استيراد البيانات.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function createPrintHeader() {
    const companyName = localStorage.getItem('printCompanyName') || 'برنامج الخزينة';
    const header = document.createElement('div');
    header.className = 'd-none d-print-block text-center mb-4';
    header.innerHTML = `<h2>${companyName}</h2><hr>`;
    return header;
}

function createPrintFooter() {
    const footerText = localStorage.getItem('printFooterText') || `تاريخ الطباعة: ${new Date().toLocaleDateString()}`;
    const footer = document.createElement('div');
    footer.className = 'd-none d-print-block text-center text-muted mt-4';
    footer.innerHTML = `<p>${footerText}</p>`;
    return footer;
}
