document.addEventListener('DOMContentLoaded', () => {
    // 1. Dropdown Logic
    const dropdownWrapper = document.querySelector('.dropdown-wrapper');
    const navAbout = document.getElementById('nav-about');
    const overlay = document.querySelector('.dropdown-overlay');

    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault(); // Prevents page jump
            e.stopPropagation();
            dropdownWrapper.classList.toggle('is-open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            dropdownWrapper.classList.remove('is-open');
        });
    }

    // 2. Hamburger Mobile Menu Logic
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navContainer = document.querySelector('.nav-container');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            // Toggles the class to trigger your CSS
            navContainer.classList.toggle('mobile-open');
        });
    }
});

// Mobile Slide-in Menu Logic
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const overlay = document.getElementById('mobile-menu-overlay');

    // Open the menu when hamburger is clicked
    if (hamburgerBtn && overlay) {
        hamburgerBtn.addEventListener('click', () => {
            overlay.classList.add('open');
        });
    }

    // Close the menu when the X button is clicked
    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('open');
        });
    }
});

// Toggle Company Sub-menu
const companyTrigger = document.getElementById('mobile-company-trigger');
const companyMenu = document.getElementById('mobile-company-menu');

if (companyTrigger) {
    companyTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle display
        if (companyMenu.style.display === 'block') {
            companyMenu.style.display = 'none';
        } else {
            companyMenu.style.display = 'block';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Get the current URL path
    const currentPath = window.location.pathname;
    const companyTrigger = document.getElementById('mobile-company-trigger');

    // List of sub-pages that should keep "Company" active
    const companySubPages = ['/about', '/community', '/members', '/executive', '/honorary', '/directory', '/contact', '/support', '/awards'];

    // Check if current path matches any company sub-pages
    if (companySubPages.some(page => currentPath.startsWith(page))) {
        if (companyTrigger) {
            companyTrigger.classList.add('active');
        }
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        const overlay = document.getElementById('mobile-menu-overlay');
        if (overlay) {
            overlay.classList.remove('open');
        }
    }
});