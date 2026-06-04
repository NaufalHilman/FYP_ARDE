document.addEventListener('DOMContentLoaded', () => {

    const slides  = document.querySelectorAll('.hero-slide');
    const dots    = document.querySelectorAll('.hero-dot');
    const prevBtn = document.querySelector('.hero-arrow-left');
    const nextBtn = document.querySelector('.hero-arrow-right');
    if (!slides.length) return;

    let current = 0;
    let timer;

    function goTo(index) {
        if (index === current) return;
        slides[current].classList.remove('active', 'fade-in');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active', 'fade-in');
        dots[current].classList.add('active');
        slides[current].addEventListener('animationend', () => {
            slides[current].classList.remove('fade-in');
        }, { once: true });
    }

    function next() { goTo((current + 1) % slides.length); }
    function prev() { goTo((current - 1 + slides.length) % slides.length); }
    function startTimer() { timer = setInterval(next, 5000); }
    function resetTimer() { clearInterval(timer); startTimer(); }

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });

    // Touch swipe
    let startX = 0;
    const heroEl = document.querySelector('.banner-hero');
    if (heroEl) {
        heroEl.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
        heroEl.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (diff > 50)       { next(); resetTimer(); }
            else if (diff < -50) { prev(); resetTimer(); }
        });
    }

    startTimer();
});