document.addEventListener('DOMContentLoaded', () => {

    const projectForm = document.getElementById('project-form');
    const projectsTableBody = document.getElementById('projects-table-body');
    const projectModalEl = document.getElementById('projectModal');
    const projectModal = new bootstrap.Modal(projectModalEl);

    // This is a simplified getObjectStore, assuming db is global from db.js
    function getObjectStore(storeName, mode) {
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    /**
     * Fetches all projects from the DB and displays them in the table.
     */
    async function displayProjects() {
        if (!db) {
            console.error('Database is not initialized.');
            setTimeout(displayProjects, 100); // Retry after a short delay
            return;
        }
        const store = getObjectStore('projects', 'readonly');
        const request = store.getAll();

        request.onsuccess = () => {
            const projects = request.result;
            projectsTableBody.innerHTML = ''; // Clear existing rows
            if (projects.length === 0) {
                 projectsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مشاريع لعرضها.</td></tr>';
            } else {
                projects.forEach(project => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${project.project_id}</td>
                        <td>${project.name}</td>
                        <td>${project.description || ''}</td>
                        <td>${project.start_date || ''}</td>
                        <td>${project.end_date || ''}</td>
                        <td><span class="badge bg-secondary">${project.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info edit-btn" data-id="${project.project_id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${project.project_id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    projectsTableBody.appendChild(row);
                });
            }
        };
        request.onerror = (event) => {
            console.error('Error fetching projects:', event.target.error);
        };
    }

    /**
     * Handles the form submission for adding or editing a project.
     */
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const projectData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            start_date: document.getElementById('project-start-date').value,
            end_date: document.getElementById('project-end-date').value,
            status: document.getElementById('project-status').value,
        };

        const projectId = document.getElementById('project-id').value;
        const store = getObjectStore('projects', 'readwrite');
        let request;

        if (projectId) {
            projectData.project_id = parseInt(projectId);
            request = store.put(projectData);
        } else {
            request = store.add(projectData);
        }

        request.onsuccess = () => {
            console.log('Project saved successfully.');
            projectForm.reset();
            projectModal.hide();
            displayProjects();
        };

        request.onerror = (event) => {
            console.error('Error saving project:', event.target.error);
        };
    });

    /**
     * Event delegation for edit and delete buttons
     */
    projectsTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const projectId = parseInt(target.getAttribute('data-id'));

        if (target.classList.contains('edit-btn')) {
            handleEditProject(projectId);
        }

        if (target.classList.contains('delete-btn')) {
            handleDeleteProject(projectId);
        }
    });

    function handleEditProject(id) {
        const store = getObjectStore('projects', 'readonly');
        const request = store.get(id);

        request.onsuccess = () => {
            const project = request.result;
            if (project) {
                document.getElementById('project-id').value = project.project_id;
                document.getElementById('project-name').value = project.name;
                document.getElementById('project-description').value = project.description;
                document.getElementById('project-start-date').value = project.start_date;
                document.getElementById('project-end-date').value = project.end_date;
                document.getElementById('project-status').value = project.status;
                projectModal.show();
            }
        };
    }

    function handleDeleteProject(id) {
        if (confirm('هل أنت متأكد أنك تريد حذف هذا المشروع؟ سيؤدي هذا إلى حذف الشركاء المرتبطين به أيضًا.')) {
            const store = getObjectStore('projects', 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Project deleted successfully.');
                displayProjects();
                // Here you might want to also delete associated partners, transactions etc.
                // This can get complex and might require a more robust deletion logic.
                // For now, we just delete the project.
            };
        }
    }

    projectModalEl.addEventListener('hidden.bs.modal', () => {
        projectForm.reset();
        document.getElementById('project-id').value = '';
    });

    // Display projects when the section is visible
    const projectsSection = document.getElementById('projects-section');
    const observer = new MutationObserver(() => {
        if (!projectsSection.classList.contains('d-none')) {
            displayProjects();
        }
    });
    observer.observe(projectsSection, { attributes: true, attributeFilter: ['class'] });
});
