document.addEventListener('DOMContentLoaded', () => {

    const downloadBtn = document.getElementById('download-backup-btn');

    // --- Helper ---
    function getObjectStore(db, storeName, mode) {
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    /**
     * Gathers all data from a specific object store.
     * @param {IDBDatabase} db - The database connection.
     * @param {string} storeName - The name of the object store.
     * @returns {Promise<Array>} A promise that resolves with the store's data.
     */
    function getAllDataFromStore(db, storeName) {
        return new Promise((resolve, reject) => {
            const store = getObjectStore(db, storeName, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(`Error fetching from ${storeName}: ${e.target.error}`);
        });
    }

    /**
     * Exports all data from the database to a JSON file.
     */
    async function exportDataToJSON() {
        if (!db) {
            alert('Database is not ready. Please wait a moment and try again.');
            return;
        }

        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري التصدير...';

        try {
            const storeNames = db.objectStoreNames;
            const backupData = {};

            const promises = Array.from(storeNames).map(storeName =>
                getAllDataFromStore(db, storeName).then(data => {
                    backupData[storeName] = data;
                })
            );

            await Promise.all(promises);

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `accounting-backup-${date}.json`;

            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Backup failed:', error);
            alert('فشل تصدير النسخة الاحتياطية. يرجى مراجعة الكونسول لمزيد من التفاصيل.');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download me-2"></i> تنزيل ملف النسخ الاحتياطي';
        }
    }

    // --- Event Listener ---
    downloadBtn.addEventListener('click', exportDataToJSON);


    // ########## Restore Logic ##########

    const restoreInput = document.getElementById('restore-file-input');
    const restoreBtn = document.getElementById('restore-backup-btn');
    let backupFile = null;

    restoreInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            backupFile = event.target.files[0];
            restoreBtn.disabled = false;
        } else {
            backupFile = null;
            restoreBtn.disabled = true;
        }
    });

    restoreBtn.addEventListener('click', () => {
        if (!backupFile) {
            alert('يرجى اختيار ملف نسخ احتياطي أولاً.');
            return;
        }

        const confirmation = prompt("للتأكيد، اكتب 'مسح' في المربع أدناه. هذه العملية ستحذف جميع البيانات الحالية بشكل نهائي.");
        if (confirmation !== 'مسح') {
            alert('تم إلغاء عملية الاستعادة.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                // Basic validation
                if (!backupData.projects || !backupData.transactions) {
                    throw new Error('ملف النسخ الاحتياطي غير صالح أو تالف.');
                }
                importDataToDB(backupData);
            } catch (error) {
                console.error('Error parsing backup file:', error);
                alert(`فشل في قراءة ملف النسخ الاحتياطي: ${error.message}`);
            }
        };
        reader.readAsText(backupFile);
    });

    function importDataToDB(data) {
        if (!db) {
            alert('Database is not ready.');
            return;
        }

        restoreBtn.disabled = true;
        restoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> جاري الاستعادة...';

        const storeNames = db.objectStoreNames;
        const tx = db.transaction(storeNames, 'readwrite');

        tx.onerror = (event) => {
            console.error('Restore transaction failed:', event.target.error);
            alert(`فشلت عملية الاستعادة: ${event.target.error}`);
            restoreBtn.disabled = false;
            restoreBtn.innerHTML = '<i class="fas fa-upload me-2"></i> استعادة البيانات الآن';
        };

        tx.oncomplete = () => {
            alert('تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة الآن.');
            location.reload();
        };

        // Clear all stores first
        for (const storeName of storeNames) {
            if (data[storeName]) { // Only clear if data for it exists in backup
                console.log(`Clearing store: ${storeName}`);
                tx.objectStore(storeName).clear();
            }
        }

        // Add new data
        for (const storeName of storeNames) {
            if (data[storeName] && Array.isArray(data[storeName])) {
                console.log(`Importing data for store: ${storeName}`);
                const store = tx.objectStore(storeName);
                data[storeName].forEach(item => {
                    store.add(item);
                });
            }
        }
    }

});
