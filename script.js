// ══════════════════════════════════════════════════════
// SUPABASE KONFIGURATION (für Seite 1)
// ══════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://tjxvxajntptuhiufgolx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeHZ4YWpudHB0dWhpdWZnb2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODU0MDIsImV4cCI6MjA5MzY2MTQwMn0.Wv0IzdiXUR3iX2t0cksmknfY7y0luGpwGRgfRXfP8fw';

async function sbFetch(path, opts = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...opts.headers
    };
    const res = await fetch(url, { ...opts, headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Supabase ${res.status}: ${txt}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ══════════════════════════════════════════════════════
// GLOBALE ZUSTÄNDE (Seite 1)
// ══════════════════════════════════════════════════════
const VOTED_KEY  = 'glasshouse_voted_v3';
const VOTES_KEY  = 'glasshouse_votes_v3';
const SELECTIONS = { q1: null, q2: null, q3: null };

function defaultVotes() {
    return {
        q1: { a: 0, b: 0, c: 0, d: 0 },
        q2: { a: 0, b: 0, c: 0, d: 0 },
        q3: { a: 0, b: 0, c: 0, d: 0 },
        total: 0
    };
}

function loadLocalVotes() {
    try { const s = localStorage.getItem(VOTES_KEY); return s ? JSON.parse(s) : defaultVotes(); }
    catch (e) { return defaultVotes(); }
}
function saveLocalVotes(v) {
    try { localStorage.setItem(VOTES_KEY, JSON.stringify(v)); } catch (e) {}
}
function hasVoted() {
    try { return !!localStorage.getItem(VOTED_KEY); } catch (e) { return false; }
}
function markVoted() {
    try { localStorage.setItem(VOTED_KEY, '1'); } catch (e) {}
}

function selectOption(btn) {
    if (hasVoted()) return;
    const q = btn.dataset.q;
    SELECTIONS[q] = btn.dataset.a;
    document.querySelectorAll(`[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    checkVoteReady();
}
function checkVoteReady() {
    const voteBtn = document.getElementById('voteBtn');
    if (voteBtn) voteBtn.disabled = !(SELECTIONS.q1 && SELECTIONS.q2 && SELECTIONS.q3);
}

async function submitVote() {
    if (hasVoted()) { showResults(); return; }
    if (!SELECTIONS.q1 || !SELECTIONS.q2 || !SELECTIONS.q3) {
        alert('Bitte alle drei Fragen beantworten.');
        return;
    }
    const btn = document.getElementById('voteBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';
    try {
        await sbFetch('votes', {
            method: 'POST',
            body: JSON.stringify({ q1: SELECTIONS.q1, q2: SELECTIONS.q2, q3: SELECTIONS.q3 })
        });
        markVoted();
        document.getElementById('voteSuccess')?.classList.add('show');
        disableOptions();
        await loadResultsFromSupabase();
    } catch (err) {
        console.warn('Supabase nicht erreichbar – lokaler Fallback:', err);
        const votes = loadLocalVotes();
        votes.q1[SELECTIONS.q1]++; votes.q2[SELECTIONS.q2]++; votes.q3[SELECTIONS.q3]++;
        votes.total = (votes.total || 0) + 1;
        saveLocalVotes(votes);
        markVoted();
        document.getElementById('voteSuccess')?.classList.add('show');
        disableOptions();
        renderResults(votes);
        const totalEl = document.getElementById('totalVotes');
        if (totalEl) totalEl.textContent = votes.total;
        alert('ℹ️ Stimme lokal gespeichert – Supabase gerade nicht erreichbar.');
    }
    btn.textContent = 'Jetzt abstimmen';
}

function disableOptions() {
    document.querySelectorAll('.poll-option').forEach(b => b.classList.add('disabled'));
    const notice = document.getElementById('voted-notice');
    if (notice) notice.style.display = 'flex';
    const voteBtn = document.getElementById('voteBtn');
    if (voteBtn) voteBtn.disabled = true;
}

async function loadResultsFromSupabase() {
    try {
        const rows = await sbFetch('votes?select=q1,q2,q3', { method: 'GET' });
        if (!rows || rows.length === 0) {
            const totalEl = document.getElementById('totalVotes');
            if (totalEl) totalEl.textContent = '0';
            return;
        }
        const agg = defaultVotes();
        agg.total = rows.length;
        rows.forEach(row => {
            if (agg.q1[row.q1] !== undefined) agg.q1[row.q1]++;
            if (agg.q2[row.q2] !== undefined) agg.q2[row.q2]++;
            if (agg.q3[row.q3] !== undefined) agg.q3[row.q3]++;
        });
        renderResults(agg);
        const totalEl = document.getElementById('totalVotes');
        if (totalEl) totalEl.textContent = agg.total;
    } catch (err) {
        console.warn('Supabase-Ergebnisse nicht ladbar:', err);
        const local = loadLocalVotes();
        renderResults(local);
        const totalEl = document.getElementById('totalVotes');
        if (totalEl) totalEl.textContent = local.total || 0;
    }
}

function renderResults(votes) {
    ['q1', 'q2', 'q3'].forEach(q => {
        const container = document.getElementById('res-' + q);
        if (container) container.style.display = 'block';
        const total = Object.values(votes[q]).reduce((s, v) => s + v, 0) || 1;
        ['a', 'b', 'c', 'd'].forEach(a => {
            const pct = Math.round(((votes[q][a] || 0) / total) * 100);
            const bar = document.getElementById('bar-' + q + '-' + a);
            const pctEl = document.getElementById('pct-' + q + '-' + a);
            if (bar) setTimeout(() => { bar.style.width = pct + '%'; }, 100);
            if (pctEl) pctEl.textContent = pct + '%';
        });
    });
}

function showResults() { loadResultsFromSupabase(); }

function toggleResults() {
    const r1 = document.getElementById('res-q1');
    if (!r1.style.display || r1.style.display === 'none') {
        loadResultsFromSupabase();
    } else {
        ['q1', 'q2', 'q3'].forEach(q => {
            const el = document.getElementById('res-' + q);
            if (el) el.style.display = 'none';
        });
    }
}

function exportVotes() {
    const votes = loadLocalVotes();
    const code = btoa(JSON.stringify(votes));
    const shareCode = document.getElementById('shareCode');
    if (shareCode) shareCode.textContent = code;
    document.getElementById('sharePanel')?.classList.toggle('show');
}

function copyCode() {
    const code = document.getElementById('shareCode')?.textContent;
    if (!code) return;
    navigator.clipboard.writeText(code)
        .then(() => alert('Code in Zwischenablage kopiert!'))
        .catch(() => {
            const el = document.getElementById('shareCode');
            if (!el) return;
            const range = document.createRange();
            range.selectNode(el);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        });
}

function importVotes() {
    const raw = document.getElementById('importCode')?.value.trim();
    if (!raw) { alert('Bitte Code einfügen.'); return; }
    try {
        const imported = JSON.parse(atob(raw));
        const current = loadLocalVotes();
        const merged = defaultVotes();
        ['q1', 'q2', 'q3'].forEach(q => {
            ['a', 'b', 'c', 'd'].forEach(a => {
                merged[q][a] = (current[q][a] || 0) + (imported[q][a] || 0);
            });
        });
        merged.total = (current.total || 0) + (imported.total || 0);
        saveLocalVotes(merged);
        renderResults(merged);
        const totalEl = document.getElementById('totalVotes');
        if (totalEl) totalEl.textContent = merged.total;
        alert('✅ ' + (imported.total || '?') + ' weitere Stimmen lokal zusammengeführt.');
        const importField = document.getElementById('importCode');
        if (importField) importField.value = '';
    } catch (e) {
        alert('Ungültiger Code.');
    }
}

// ══════════════════════════════════════════════════════
// ICEBERG & QUOTE CAROUSEL (Seite 2)
// ══════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
    const level = e.target.closest('.iceberg-level[data-level]');
    if (level) level.classList.toggle('revealed');
});

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

// INIT
(function init() {
    const voteBtn = document.getElementById('voteBtn');
    if (voteBtn) voteBtn.disabled = true;
    if (document.getElementById('pollContainer')) {
        loadResultsFromSupabase();
        if (hasVoted()) disableOptions();
    }
})();
