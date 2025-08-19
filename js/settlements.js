document.addEventListener('DOMContentLoaded', () => {

    // --- State & Elements ---
    let calculatedSettlementActions = [];
    const VIRTUAL_CASHBOX_NAME = "خزنة التسويات";
    const projectSelector = document.getElementById('settlement-project-selector');
    const detailsContainer = document.getElementById('settlement-details-container');
    const contributionsTableBody = document.getElementById('settlement-partner-contributions-table');
    const actionsSummary = document.getElementById('settlement-actions-summary');
    const executeBtn = document.getElementById('execute-equalization-btn');

    // --- Helper ---
    function getObjectStore(storeName, mode) {
        if (!db) { return null; }
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    function getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const store = getObjectStore(storeName, 'readonly');
            if (!store) return reject(`Store ${storeName} not found.`);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(`Error fetching from ${storeName}: ${e.target.error}`);
        });
    }

    // --- Main Functions ---
    function populateProjectSelector() {
        getAllFromStore('projects').then(projects => {
            projectSelector.innerHTML = '<option value="">اختر مشروعا لبدء التسوية...</option>';
            projects.forEach(p => {
                projectSelector.innerHTML += `<option value="${p.project_id}">${p.name}</option>`;
            });
        }).catch(err => console.error(err));
    }

    async function calculateAndDisplayProjectSettlement() {
        const projectId = parseInt(projectSelector.value);
        if (!projectId) {
            detailsContainer.classList.add('d-none');
            return;
        }
        detailsContainer.classList.remove('d-none');
        executeBtn.disabled = true;
        contributionsTableBody.innerHTML = '<tr><td colspan="3">جاري الحساب...</td></tr>';
        actionsSummary.innerHTML = '';

        try {
            const [allPartners, allTransactions, allSettlements] = await Promise.all([
                getAllFromStore('partners'),
                getAllFromStore('transactions'),
                getAllFromStore('settlements')
            ]);

            const lastSettlementDate = allSettlements
                .filter(s => s.linked_project_id === projectId)
                .map(s => s.date)
                .sort()
                .pop() || null;

            const projectPartners = allPartners.filter(p => p.project_id && Number(p.project_id) === projectId);

            if (projectPartners.length < 2) {
                contributionsTableBody.innerHTML = '<tr><td colspan="3">يجب وجود شريكين على الأقل في المشروع لإجراء تسوية.</td></tr>';
                return;
            }

            const contributions = new Map(projectPartners.map(p => [p.partner_id, { name: p.name, total: 0 }]));

            allTransactions.forEach(t => {
                const isNewTransaction = !lastSettlementDate || t.date > lastSettlementDate;
                if (!isNewTransaction) return;

                const isProjectMatch = t.linked_project_id && Number(t.linked_project_id) === projectId;
                if (!isProjectMatch || !t.linked_partner_id) return;

                if (contributions.has(t.linked_partner_id)) {
                    if (t.transaction_type === 'قبض' || t.is_partner_expense) {
                        contributions.get(t.linked_partner_id).total += t.amount;
                    }
                }
            });

            const totalContribution = Array.from(contributions.values()).reduce((sum, p) => sum + p.total, 0);
            const average = totalContribution > 0 ? totalContribution / contributions.size : 0;

            const debtors = [];
            const creditors = [];

            contributions.forEach((data, id) => {
                const difference = data.total - average;
                data.difference = difference;
                if (difference > 0.01) {
                    creditors.push({ id, name: data.name, amount: difference });
                } else if (difference < -0.01) {
                    debtors.push({ id, name: data.name, amount: -difference });
                }
            });

            contributionsTableBody.innerHTML = '';
            contributions.forEach(data => {
                let status = 'متوازن';
                let statusClass = 'text-secondary';
                if (data.difference > 0.01) {
                    status = `دائن بمبلغ ${data.difference.toFixed(2)}`;
                    statusClass = 'text-success';
                } else if (data.difference < -0.01) {
                    status = `مدين بمبلغ ${(-data.difference).toFixed(2)}`;
                    statusClass = 'text-danger';
                }
                contributionsTableBody.innerHTML += `<tr><td>${data.name}</td><td>${data.total.toFixed(2)}</td><td class="${statusClass}">${status}</td></tr>`;
            });

            calculatedSettlementActions = [];
            debtors.sort((a, b) => a.amount - b.amount);
            creditors.sort((a, b) => a.amount - b.amount);

            while (debtors.length > 0 && creditors.length > 0) {
                const debtor = debtors[0];
                const creditor = creditors[0];
                const amount = Math.min(debtor.amount, creditor.amount);

                if (amount > 0.01) {
                     calculatedSettlementActions.push({ from: debtor.id, to: creditor.id, amount });
                }

                debtor.amount -= amount;
                creditor.amount -= amount;

                if (debtor.amount < 0.01) debtors.shift();
                if (creditor.amount < 0.01) creditors.shift();
            }

            if (calculatedSettlementActions.length > 0) {
                actionsSummary.innerHTML = '<p>لتسوية الحسابات، يجب تنفيذ الإجراءات التالية:</p>';
                const list = document.createElement('ul');
                list.className = 'list-group';
                calculatedSettlementActions.forEach(action => {
                    const fromPartner = contributions.get(action.from).name;
                    const toPartner = contributions.get(action.to).name;
                    list.innerHTML += `<li class="list-group-item">يقوم <strong>${fromPartner}</strong> بدفع <strong>${action.amount.toFixed(2)}</strong> إلى <strong>${toPartner}</strong>.</li>`;
                });
                actionsSummary.appendChild(list);
                executeBtn.disabled = false;
            } else {
                actionsSummary.innerHTML = '<div class="alert alert-success">جميع مساهمات الشركاء متوازنة. لا حاجة للتسوية.</div>';
            }
        } catch (error) {
            console.error("Failed to calculate settlement:", error);
            contributionsTableBody.innerHTML = `<tr><td colspan="3" class="text-danger">حدث خطأ أثناء حساب التسوية.</td></tr>`;
        }
    }

    async function handleExecuteSettlement() {
        if (calculatedSettlementActions.length === 0) return;
        executeBtn.disabled = true;
        executeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التنفيذ...';

        const cashboxStore = getObjectStore('cashboxes', 'readonly');
        const vCashboxReq = cashboxStore.index('name_idx').get(VIRTUAL_CASHBOX_NAME);

        vCashboxReq.onsuccess = () => {
            const vCashbox = vCashboxReq.result;
            if (!vCashbox) {
                alert(`خطأ: الخزنة الافتراضية "${VIRTUAL_CASHBOX_NAME}" غير موجودة.`);
                executeBtn.innerHTML = '<i class="fas fa-check me-2"></i> تأكيد تنفيذ التسوية';
                return;
            }
            // This part is complex and needs the contributions map
            // We'll just re-fetch it for simplicity, though it's inefficient
            getAllFromStore('partners').then(partners => {
                const partnerMap = new Map(partners.map(p => [p.partner_id, p.name]));

                for (const action of calculatedSettlementActions) {
                    const date = new Date().toISOString().slice(0, 10);
                    const desc = `تسوية مساهمات مشروع: ${projectSelector.options[projectSelector.selectedIndex].text}`;

                    processTransaction({
                        transaction_type: 'صرف',
                        amount: action.amount,
                        date: date,
                        description: `دفعة تسوية إلى ${partnerMap.get(action.to) || '?'}. ${desc}`,
                        linked_cashbox_id: vCashbox.cashbox_id,
                        linked_partner_id: action.from,
                        is_partner_expense: true
                    });

                    processTransaction({
                        transaction_type: 'قبض',
                        amount: action.amount,
                        date: date,
                        description: `دفعة تسوية من ${partnerMap.get(action.from) || '?'}. ${desc}`,
                        linked_cashbox_id: vCashbox.cashbox_id,
                        linked_partner_id: action.to
                    });
                }

            const settlementRecord = {
                project_id: parseInt(projectSelector.value),
                date: new Date().toISOString().slice(0, 10),
                actions_taken: JSON.stringify(calculatedSettlementActions)
            };

            const settlementStore = getObjectStore('settlements', 'readwrite');
            const addRequest = settlementStore.add(settlementRecord);

            addRequest.onsuccess = () => {
                 setTimeout(() => {
                    alert('تم تنفيذ التسوية وحفظها في السجل بنجاح!');
                    calculateAndDisplayProjectSettlement(); // Refresh the view
                }, 500); // Shorter timeout
            };
            addRequest.onerror = () => {
                console.error("Failed to save settlement record");
                alert("تم تنفيذ التسوية ولكن فشل حفظها في السجل.");
            }
            });
        };
    }

    async function displaySettlementHistory() {
        const historyTableBody = document.getElementById('settlement-history-table-body');
        historyTableBody.innerHTML = '<tr><td colspan="4">جاري تحميل السجل...</td></tr>';

        try {
            const [settlements, projects] = await Promise.all([
                getAllFromStore('settlements'),
                getAllFromStore('projects')
            ]);
            const projectMap = new Map(projects.map(p => [p.project_id, p.name]));

            historyTableBody.innerHTML = '';
            if (settlements.length === 0) {
                historyTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد تسويات سابقة.</td></tr>';
                return;
            }

            settlements.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

            settlements.forEach(s => {
                const projectName = projectMap.get(s.project_id) || 'مشروع محذوف';
                const actions = JSON.parse(s.actions_taken);
                let details = '<ul>';
                actions.forEach(action => {
                    // This requires another lookup to get partner names, which is inefficient here.
                    // For now, we'll just show IDs. This can be improved later.
                    details += `<li>Partner ${action.from} pays Partner ${action.to} amount ${action.amount.toFixed(2)}</li>`;
                });
                details += '</ul>';

                const row = historyTableBody.insertRow();
                row.innerHTML = `
                    <td>${s.settlement_id}</td>
                    <td>${s.date}</td>
                    <td>${projectName}</td>
                    <td>${details}</td>
                `;
            });

        } catch (error) {
            console.error("Failed to display settlement history:", error);
            historyTableBody.innerHTML = '<tr><td colspan="4" class="text-danger">فشل تحميل سجل التسويات.</td></tr>';
        }
    }

    // --- Event Listeners ---
    projectSelector.addEventListener('change', calculateAndDisplayProjectSettlement);
    executeBtn.addEventListener('click', handleExecuteSettlement);
    document.getElementById('nav-settlement-history-tab').addEventListener('shown.bs.tab', displaySettlementHistory);
    const settlementsSection = document.getElementById('settlements-section');
    const observer = new MutationObserver(() => {
        if (db && !settlementsSection.classList.contains('d-none')) {
            populateProjectSelector();
            detailsContainer.classList.add('d-none');
        }
    });
    observer.observe(settlementsSection, { attributes: true, attributeFilter: ['class'] });
});
