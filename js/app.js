document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    const sections = document.querySelectorAll('main section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Manage active link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');

            // Manage visible section
            const targetSectionId = link.getAttribute('data-section') + '-section';
            sections.forEach(section => {
                if (section.id === targetSectionId) {
                    section.classList.remove('d-none');
                } else {
                    section.classList.add('d-none');
                }
            });
        });
    });

    // Show dashboard by default
    document.querySelector('[data-section="dashboard"]').click();
});
