// ══════════════════════════════════════════════════════
// STAT-COUNTER & SCROLL REVEAL
// ══════════════════════════════════════════════════════
function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, 25);
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            const num = e.target.querySelector('[data-target]');
            if (num && !num.dataset.animated) {
                num.dataset.animated = '1';
                animateCounter(num);
            }
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
document.querySelectorAll('.stat-card').forEach(c => revealObserver.observe(c));

// ══════════════════════════════════════════════════════
// ICEBERG (Seite 2)
// ══════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
    const level = e.target.closest('.iceberg-level[data-level]');
    if (level) level.classList.toggle('revealed');
});

// ══════════════════════════════════════════════════════
// QUOTE CAROUSEL (Seite 2)
// ══════════════════════════════════════════════════════
(function() {
    const container = document.getElementById('quoteCarousel');
    if (!container) return;
    const slides = container.querySelectorAll('.quote-slide');
    let current = 0;
    function show(index) {
        slides.forEach(s => s.classList.remove('active'));
        slides[index].classList.add('active');
        current = index;
    }
    document.getElementById('quoteNext')?.addEventListener('click', () => show((current+1) % slides.length));
    document.getElementById('quotePrev')?.addEventListener('click', () => show((current-1+slides.length) % slides.length));
    let interval = setInterval(() => show((current+1) % slides.length), 5000);
    container.addEventListener('mouseenter', () => clearInterval(interval));
    container.addEventListener('mouseleave', () => { interval = setInterval(() => show((current+1) % slides.length), 5000); });
})();
