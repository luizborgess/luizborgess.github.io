// Sidebar toggle for mobile
const sidebarTrigger = document.getElementById('sidebar-trigger');
const sidebar = document.getElementById('sidebar');

if (sidebarTrigger && sidebar) {
    sidebarTrigger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarTrigger.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// Table of Contents - Active heading highlight
function initToc() {
    const tocLinks = document.querySelectorAll('.toc a');
    if (tocLinks.length === 0) return;

    const headings = Array.from(tocLinks).map(link => {
        const id = link.getAttribute('href').replace('#', '');
        return document.getElementById(id);
    }).filter(Boolean);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    tocLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + entry.target.id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        },
        { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(heading => observer.observe(heading));
}

// Initialize TOC when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToc);
} else {
    initToc();
}
