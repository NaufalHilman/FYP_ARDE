document.addEventListener('DOMContentLoaded', () => {
    const dropdownWrapper = document.querySelector('.dropdown-wrapper');
    const navAbout = document.getElementById('nav-about');
    const overlay = document.querySelector('.dropdown-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');

    navAbout.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownWrapper.classList.toggle('is-open');
    });

    // Close when clicking the overlay (dimmed area)
    if (overlay) {
        overlay.addEventListener('click', () => {
            dropdownWrapper.classList.remove('is-open');
        });
    }
});

const hamburgerBtn = document.getElementById('hamburger-btn');
const navLinks = document.querySelector('.nav-links'); // This holds your links

hamburgerBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '100%';
    navLinks.style.left = '0';
    navLinks.style.background = '#fff';
    navLinks.style.width = '100%';
});