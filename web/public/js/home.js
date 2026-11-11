(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const LEVELS = [[1, 2], [5, 10], [10, 20], [20, 40], [50, 100], [100, 200], [200, 400], [500, 1000], [1000, 2000]];
    const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

    const blinds = $('#blinds');
    for (const [s, b] of LEVELS) {
        const opt = document.createElement('option');
        opt.value = s + '/' + b;
        opt.textContent = s + ' / ' + b;
        if (s === 10) opt.selected = true;
        blinds.appendChild(opt);
    }

    try { $('#host-name').value = localStorage.getItem('easypoker.name') || ''; } catch (_) {}

    let toastTimer = null;
    function toast(msg) {
        const el = $('#toast');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
    }

    $('#create-btn').addEventListener('click', async () => {
        const name = $('#host-name').value.trim();
        if (!name) { $('#host-name').focus(); toast('Enter your name'); return; }
        const [smallBlind, bigBlind] = blinds.value.split('/').map(Number);
        const startingChips = parseInt($('#starting-chips').value, 10);
        const btn = $('#create-btn');
        btn.disabled = true;
        try {
            const res = await fetch('/api/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startingChips, smallBlind, bigBlind })
            });
            const data = await res.json();
            if (!res.ok) { toast(data.error || 'Could not create the table'); return; }
            try {
                localStorage.setItem('easypoker.host.' + data.code, data.hostKey);
                localStorage.setItem('easypoker.name', name);
                localStorage.setItem('easypoker.joined.' + data.code, name);
            } catch (_) {}
            location.href = '/' + data.code;
        } catch (_) {
            toast('Connection error');
        } finally {
            btn.disabled = false;
        }
    });

    function joinCode() {
        const code = $('#join-code').value.trim().toUpperCase();
        if (!CODE_RE.test(code)) { toast('Codes are 6 letters and digits'); return; }
        location.href = '/' + code;
    }
    $('#join-btn').addEventListener('click', joinCode);
    $('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinCode(); });
    $('#host-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#create-btn').click(); });
})();
