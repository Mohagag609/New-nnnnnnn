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

// Placeholder for edit functionality
function editClient(clientId) {
    alert(`ستتم إضافة وظيفة تعديل العميل (ID: ${clientId}) لاحقًا.`);
    // Implementation will involve:
    // 1. Fetching the client data using getItemById('clients', clientId).
    // 2. Populating a modal (can be the same 'add' modal, but in 'edit' mode) with the data.
    // 3. Changing the form handler to use `updateItem` instead of `addItem`.
}

// --- Supplier Management ---

document.addEventListener('suppliersPageLoaded', () => {
    renderSuppliersList();
    setupAddSupplierForm();
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

function editSupplier(supplierId) {
    alert(`ستتم إضافة وظيفة تعديل المورد (ID: ${supplierId}) لاحقًا.`);
}

// --- Partner Management ---

document.addEventListener('partnersPageLoaded', () => {
    renderPartnersList();
    setupAddPartnerForm();
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

function editPartner(partnerId) {
    alert(`ستتم إضافة وظيفة تعديل الشريك (ID: ${partnerId}) لاحقًا.`);
}

// --- Project Management ---

document.addEventListener('projectsPageLoaded', () => {
    renderProjectsList();
    setupAddProjectForm();
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

function editProject(projectId) {
    alert(`ستتم إضافة وظيفة تعديل المشروع (ID: ${projectId}) لاحقًا.`);
}

// --- Contractor Management ---

document.addEventListener('contractorsPageLoaded', () => {
    renderContractorsList();
    setupAddContractorForm();
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

function editContractor(contractorId) {
    alert(`ستتم إضافة وظيفة تعديل المقاول (ID: ${contractorId}) لاحقًا.`);
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
    // Set default dates
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    if (startDateInput) startDateInput.valueAsDate = firstDayOfMonth;
    if (endDateInput) endDateInput.valueAsDate = today;

    // Setup button listener
    const generateBtn = document.getElementById('generateIncomeExpenseReport');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateIncomeExpenseReport);
    }
});

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
