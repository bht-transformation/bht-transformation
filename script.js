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
                // ✅ Nur numerische Werte animieren – verhindert NaN auf Buttons
                const targetValue = parseInt(num.dataset.target, 10);
                if (!isNaN(targetValue)) {
                    num.dataset.animated = '1';
                    animateCounter(num);
                }
            }
            revealObserver.unobserve(e.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
document.querySelectorAll('.stat-card').forEach(c => revealObserver.observe(c));

// ══════════════════════════════════════════════════════
// ICEBERG
// ══════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
    const level = e.target.closest('.iceberg-level[data-level]');
    if (level) level.classList.toggle('revealed');
});

// ══════════════════════════════════════════════════════
// QUOTE CAROUSEL
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

// ══════════════════════════════════════════════════════
// MOBILE NAV TOGGLE
// ══════════════════════════════════════════════════════
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('active');
    });
    // Menü schließen, wenn ein Link angeklickt wird
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });
}

// ══════════════════════════════════════════════════════
// NEU: TOGGLE DETAILS FÜR INTERVENTIONEN
// ══════════════════════════════════════════════════════
document.querySelectorAll('.toggle-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target');
        const detailsDiv = document.getElementById(targetId);
        if (detailsDiv) {
            detailsDiv.classList.toggle('open');
            btn.textContent = detailsDiv.classList.contains('open') ? "Weniger anzeigen" : "Mehr erfahren";
        }
    });
});

// ══════════════════════════════════════════════════════
// NEU: MODAL SYSTEM (Spiegel- & Stuhl-Intervention)
// ══════════════════════════════════════════════════════
const modalOverlay = document.getElementById('modalOverlay');
const modalContentDiv = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');

function showModal(html) {
    if (!modalContentDiv) return;
    modalContentDiv.innerHTML = html;
    modalOverlay.style.display = 'flex';
}

function closeModal() {
    if (modalOverlay) modalOverlay.style.display = 'none';
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// Spiegel-Modal
const openSpiegelBtn = document.getElementById('openSpiegelModalBtn');
if (openSpiegelBtn) {
    openSpiegelBtn.addEventListener('click', () => {
        showModal(`
            <h3 style="font-family: 'Futura'">🪞 Würdest du dich selbst wählen?</h3>
            <p>Spiegelintervention – ehrlicher Moment der Selbstreflexion.</p>
            <div class="vote-radio-group">
                <p><strong>Wann hast du dich zuletzt im Arbeitskontext wirklich beteiligt?</strong></p>
                <label><input type="radio" name="spiegelVote" value="Heute"> Heute</label>
                <label><input type="radio" name="spiegelVote" value="Diese Woche"> Diese Woche</label>
                <label><input type="radio" name="spiegelVote" value="Schon länger nicht"> Schon länger nicht</label>
                <label><input type="radio" name="spiegelVote" value="Weiß nicht"> Weiß nicht genau</label>
            </div>
            <button id="submitSpiegel" class="btn-modal-submit">Abstimmen (Demo)</button>
            <p style="font-size:0.7rem; margin-top:1rem;">✨ Teil der Semesterdokumentation – deine Stimme zählt.</p>
        `);
        const submitBtn = document.getElementById('submitSpiegel');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const selected = document.querySelector('input[name="spiegelVote"]:checked');
                if (selected) alert(`Danke für deine Stimme: "${selected.value}" – Reflexion gespeichert.`);
                else alert("Bitte wähle eine Antwort.");
                closeModal();
            });
        }
    });
}

// Stuhl-Modal
const openStuhlBtn = document.getElementById('openStuhlModalBtn');
if (openStuhlBtn) {
    openStuhlBtn.addEventListener('click', () => {
        showModal(`
            <h3 style="font-family: 'Futura'">🪑 Stiller Streik der Stühle – Deine Perspektive</h3>
            <p>Warum darfst du an Meetings teilnehmen, die über deine Arbeit entscheiden? Was fehlt?</p>
            <textarea id="stuhlText" rows="3" style="width:100%; background:rgba(0,0,0,0.3); border-radius:12px; padding:10px; color:white; margin:1rem 0;" placeholder="Schreib hier deine Gedanken ..."></textarea>
            <button id="submitStuhl" class="btn-modal-submit">Gedanke teilen (Demo)</button>
        `);
        const submitStuhl = document.getElementById('submitStuhl');
        if (submitStuhl) {
            submitStuhl.addEventListener('click', () => {
                const text = document.getElementById('stuhlText')?.value;
                if (text && text.trim() !== "") alert(`Danke für deine Reflexion: "${text.substring(0,80)}..." – fließt in die Auswertung ein.`);
                else alert("Bitte teile einen Gedanken mit.");
                closeModal();
            });
        }
    });
}
