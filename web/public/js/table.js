// The table page. Derived from the Android app's player client (assets/web/js/app.js):
// same actions and reconnect logic, plus a host panel and an invite card.
(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const CODE = location.pathname.slice(1).toUpperCase();
    const API = '/api/t/' + CODE;
    const JOIN_URL = location.origin + '/' + CODE;
    const NAME_KEY = 'easypoker.joined.' + CODE;
    const HOST_KEY = 'easypoker.host.' + CODE;
    const LEVELS = [[1, 2], [5, 10], [10, 20], [20, 40], [50, 100], [100, 200], [200, 400], [500, 1000], [1000, 2000]];

    let playerName = null;
    let hostKey = null;
    let ws = null;
    let state = null;
    let myChips = 0;
    let pot = 0;
    let smallBlind = 10;
    let bigBlind = 20;
    let joined = false;

    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
    };

    // A host link carries the key in the fragment (never sent to the server in a URL).
    const hashKey = new URLSearchParams(location.hash.slice(1)).get('host');
    if (hashKey) {
        store.set(HOST_KEY, hashKey);
        history.replaceState(null, '', location.pathname);
    }
    hostKey = store.get(HOST_KEY);

    // Without a timeout a request sent while a phone was dozing can hang forever and
    // the button just looks dead. Fail after 8 s so the toast shows.
    function request(path, body, extraHeaders) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const opts = { signal: ctrl.signal, headers: Object.assign({}, extraHeaders) };
        if (body !== undefined) {
            opts.method = 'POST';
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        return fetch(API + path, opts).finally(() => clearTimeout(t));
    }

    async function call(path, body) {
        try {
            const res = await request(path, body);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { showToast(data.error || 'Action failed'); return null; }
            return data;
        } catch (_) {
            showToast('Connection error');
            return null;
        }
    }

    function hostCall(path, body) {
        return (async () => {
            try {
                const res = await request('/host/' + path, body, { 'X-Host-Key': hostKey });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) { showToast(data.error || 'Action failed'); return null; }
                return data;
            } catch (_) {
                showToast('Connection error');
                return null;
            }
        })();
    }

    // --- SCREENS ---
    function show(id) {
        for (const s of ['#missing-screen', '#join-screen', '#game-screen']) {
            $(s).classList.toggle('hidden', s !== id);
        }
    }

    function showJoin(note) {
        joined = false;
        show('#join-screen');
        $('#join-code-display').textContent = CODE;
        const noteEl = $('#join-note');
        noteEl.textContent = note || '';
        noteEl.classList.toggle('hidden', !note);
        $('#name-input').focus();
    }

    function showGame() {
        joined = true;
        show('#game-screen');
        $('#code-chip').textContent = CODE;
        $('#host-panel').classList.toggle('hidden', !hostKey);
    }

    // --- JOIN ---
    $('#join-btn').addEventListener('click', () => join($('#name-input').value.trim()));
    $('#name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') join($('#name-input').value.trim());
    });

    async function join(name) {
        if (!name) { $('#name-input').focus(); return; }
        const data = await call('/join', { name: name });
        if (!data) { if (!joined) showJoin(); return; }
        playerName = data.name;
        myChips = data.chips;
        store.set(NAME_KEY, playerName);
        store.set('easypoker.name', playerName);
        $('#player-name-display').textContent = playerName;
        renderMyChips();
        showGame();
        connectWS();
    }

    // --- WEBSOCKET ---
    // A phone that sleeps or switches networks often leaves the socket looking OPEN
    // while nothing arrives any more. So: ping every 10 s, and if nothing (pong or
    // state) has come back for 25 s, tear the socket down and reconnect. Also
    // reconnect immediately whenever the tab becomes visible or the network returns.
    const PING_MS = 10000;
    const STALE_MS = 25000;
    let lastMessageAt = 0;
    let reconnectTimer = null;
    let reconnectDelay = 1000;

    function connectWS() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const sock = new WebSocket(proto + '//' + location.host + API + '/ws');
        ws = sock;
        lastMessageAt = Date.now();

        sock.onopen = () => { reconnectDelay = 1000; setConnected(true); };
        sock.onmessage = (e) => {
            lastMessageAt = Date.now();
            if (e.data === 'pong') return;
            try { updateUI(JSON.parse(e.data)); } catch (_) {}
        };
        sock.onclose = () => {
            if (ws !== sock) return; // superseded by a newer socket
            ws = null;
            setConnected(false);
            scheduleReconnect();
        };
        sock.onerror = () => { try { sock.close(); } catch (_) {} };
    }

    function scheduleReconnect() {
        if (reconnectTimer) return;
        reconnectTimer = setTimeout(() => { reconnectTimer = null; connectWS(); }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 5000);
    }

    function forceReconnect() {
        const old = ws;
        ws = null;
        if (old) { old.onclose = null; try { old.close(); } catch (_) {} }
        reconnectDelay = 1000;
        connectWS();
    }

    setInterval(() => {
        if (!joined) return;
        if (!ws) { connectWS(); return; }
        if (ws.readyState !== WebSocket.OPEN) return;
        if (Date.now() - lastMessageAt > STALE_MS) { setConnected(false); forceReconnect(); return; }
        try { ws.send('ping'); } catch (_) { forceReconnect(); }
    }, PING_MS);

    function resume() {
        if (!joined) return;
        if (!ws || ws.readyState !== WebSocket.OPEN || Date.now() - lastMessageAt > PING_MS) forceReconnect();
        else { try { ws.send('ping'); } catch (_) { forceReconnect(); } }
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resume(); });
    window.addEventListener('online', resume);
    window.addEventListener('pageshow', (e) => { if (e.persisted) forceReconnect(); });

    function setConnected(ok) { $('#conn-status').classList.toggle('hidden', ok); }

    // --- UI UPDATE ---
    function renderMyChips() { $('#my-chips').textContent = myChips.toLocaleString() + ' chips'; }

    function updateUI(s) {
        state = s;
        pot = s.pot;
        const blindsChanged = s.smallBlind !== smallBlind || s.bigBlind !== bigBlind;
        smallBlind = s.smallBlind || smallBlind;
        bigBlind = s.bigBlind || bigBlind;

        $('#pot-amount').textContent = pot.toLocaleString();
        $('#take-all-btn').disabled = pot <= 0;
        $('#take-all-btn').textContent = pot > 0 ? 'Take whole pot (' + pot.toLocaleString() + ')' : 'Take whole pot';
        $('#blinds-display').textContent = 'BLINDS ' + smallBlind + ' / ' + bigBlind;
        $('#chip-amount').step = smallBlind;
        if (blindsChanged || !$('#chip-amount').value) $('#chip-amount').value = bigBlind;

        // The host may have removed us or started a game without us.
        const me = playerName && s.players[playerName];
        if (joined && !me) {
            $('#name-input').value = playerName || '';
            store.set(NAME_KEY, '');
            showJoin('You are not in the current game. Join again — use the same name to get your chips back.');
            return;
        }
        if (me) { myChips = me.chips; renderMyChips(); }

        renderQuickButtons();
        renderPlayers();
        renderHostFields();

        const logList = $('#log-list');
        logList.innerHTML = '';
        for (const entry of (s.log || []).slice(-10).reverse()) {
            const li = document.createElement('li');
            li.className = 'log-item';
            li.textContent = entry.message;
            logList.appendChild(li);
        }

        // The host sees the invite card until somebody else has joined.
        if (hostKey && !inviteToggled) $('#invite').classList.toggle('hidden', (s.order || []).length > 1);
    }

    function renderPlayers() {
        const list = $('#players-list');
        list.innerHTML = '';
        const names = (state.order || Object.keys(state.players)).slice();
        names.sort((a, b) => (a === playerName ? -1 : b === playerName ? 1 : 0));
        for (const name of names) {
            const player = state.players[name];
            const li = document.createElement('li');
            li.className = 'player-item' + (hostKey ? ' editable' : '');
            const isMe = name === playerName;
            const n = document.createElement('span');
            n.className = 'name' + (isMe ? ' is-me' : '');
            n.textContent = player.name + (isMe ? ' (you)' : '');
            const c = document.createElement('span');
            c.className = 'chips';
            c.textContent = player.chips.toLocaleString();
            li.append(n, c);
            if (hostKey) li.addEventListener('click', () => openSheet(player));
            list.appendChild(li);
        }
    }

    // --- QUICK BUTTONS: sized from the blinds, like a real table ---
    function quickAmounts() {
        return [
            { label: 'SB', value: smallBlind },
            { label: 'BB', value: bigBlind },
            { label: '2 BB', value: 2 * bigBlind },
            { label: '3 BB', value: 3 * bigBlind },
            { label: '5 BB', value: 5 * bigBlind },
            { label: '½ Pot', value: Math.floor(pot / 2 / smallBlind) * smallBlind },
            { label: 'Pot', value: pot },
            { label: 'All-in', value: myChips }
        ];
    }

    function renderQuickButtons() {
        const row = $('#quick-row');
        const selected = parseInt($('#chip-amount').value, 10);
        row.innerHTML = '';
        for (const q of quickAmounts()) {
            const btn = document.createElement('button');
            btn.className = 'quick-btn' + (q.value === selected ? ' active' : '');
            btn.textContent = q.label;
            const sub = document.createElement('span');
            sub.className = 'sub';
            sub.textContent = q.value.toLocaleString();
            btn.appendChild(sub);
            btn.disabled = q.value <= 0;
            btn.addEventListener('click', () => { $('#chip-amount').value = q.value; renderQuickButtons(); });
            row.appendChild(btn);
        }
    }

    function step(direction) {
        const current = parseInt($('#chip-amount').value, 10) || 0;
        const snapped = Math.round(current / smallBlind) * smallBlind;
        let next = snapped === current ? current + direction * smallBlind : snapped;
        if (next < smallBlind) next = smallBlind;
        $('#chip-amount').value = next;
        renderQuickButtons();
    }
    $('#minus-btn').addEventListener('click', () => step(-1));
    $('#plus-btn').addEventListener('click', () => step(1));
    $('#chip-amount').addEventListener('input', renderQuickButtons);

    // --- ACTIONS ---
    async function chipAction(path) {
        const amount = parseInt($('#chip-amount').value, 10);
        if (!amount || amount <= 0) { showToast('Enter an amount'); return; }
        if (await call(path, { name: playerName, amount: amount }) && navigator.vibrate) navigator.vibrate(30);
    }
    $('#add-btn').addEventListener('click', () => chipAction('/pot/add'));
    $('#take-btn').addEventListener('click', () => chipAction('/pot/take'));

    // Sends no amount: the server gives whatever the pot holds when the request lands.
    $('#take-all-btn').addEventListener('click', async () => {
        if (pot <= 0) return;
        if (await call('/pot/take-all', { name: playerName }) && navigator.vibrate) navigator.vibrate([30, 60, 30]);
    });

    // --- INVITE ---
    let inviteToggled = false;
    let qrDrawn = false;
    function drawQr() {
        if (qrDrawn || typeof window.qrcode !== 'function') return;
        const qr = window.qrcode(0, 'M');
        qr.addData(JOIN_URL);
        qr.make();
        $('#qr').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
        qrDrawn = true;
    }
    $('#invite-code').textContent = CODE;
    $('#invite-link').textContent = JOIN_URL.replace(/^https?:\/\//, '');
    const inviteObserver = new MutationObserver(() => { if (!$('#invite').classList.contains('hidden')) drawQr(); });
    inviteObserver.observe($('#invite'), { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('load', () => { if (!$('#invite').classList.contains('hidden')) drawQr(); });

    $('#code-chip').addEventListener('click', () => {
        inviteToggled = true;
        $('#invite').classList.toggle('hidden');
    });

    async function copy(text, done) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(done);
        } catch (_) {
            window.prompt('Copy this link:', text);
        }
    }
    $('#copy-btn').addEventListener('click', () => copy(JOIN_URL, 'Link copied'));
    $('#share-btn').addEventListener('click', async () => {
        if (navigator.share) {
            try { await navigator.share({ title: 'EasyPoker table ' + CODE, text: 'Join my poker table', url: JOIN_URL }); } catch (_) {}
        } else {
            copy(JOIN_URL, 'Link copied');
        }
    });
    if (!navigator.share) $('#share-btn').classList.add('hidden');

    // --- HOST ---
    const preset = $('#blind-preset');
    const custom = document.createElement('option');
    custom.value = '';
    custom.textContent = 'Custom';
    preset.appendChild(custom);
    for (const [s, b] of LEVELS) {
        const opt = document.createElement('option');
        opt.value = s + '/' + b;
        opt.textContent = s + ' / ' + b;
        preset.appendChild(opt);
    }
    preset.addEventListener('change', () => {
        if (!preset.value) return;
        const [s, b] = preset.value.split('/');
        $('#sb-input').value = s;
        $('#bb-input').value = b;
    });

    const editing = (el) => document.activeElement === el;
    function renderHostFields() {
        if (!hostKey || !state) return;
        if (!editing($('#sb-input')) && !editing($('#bb-input')) && !editing(preset)) {
            $('#sb-input').value = state.smallBlind;
            $('#bb-input').value = state.bigBlind;
            preset.value = state.smallBlind + '/' + state.bigBlind; // unknown level shows "Custom"
        }
        if (!editing($('#pot-input'))) $('#pot-input').value = state.pot;
        if (!editing($('#start-input'))) $('#start-input').value = state.startingChips;
    }

    const num = (sel) => parseInt($(sel).value, 10);
    $('#blinds-btn').addEventListener('click', async () => {
        if (await hostCall('blinds', { small: num('#sb-input'), big: num('#bb-input') })) showToast('Blinds updated');
    });
    $('#pot-btn').addEventListener('click', async () => {
        if (await hostCall('pot', { amount: num('#pot-input') })) showToast('Pot updated');
    });
    $('#start-btn').addEventListener('click', async () => {
        if (await hostCall('starting-chips', { amount: num('#start-input') })) showToast('Starting chips updated');
    });

    // Two taps instead of a confirm() dialog, which some in-app browsers block.
    function twoTap(btn, label, action) {
        let armed = null;
        btn.addEventListener('click', async () => {
            if (!armed) {
                const original = btn.textContent;
                btn.textContent = label;
                btn.classList.add('armed');
                armed = setTimeout(() => { btn.textContent = original; btn.classList.remove('armed'); armed = null; }, 3000);
                btn.dataset.original = original;
                return;
            }
            clearTimeout(armed);
            armed = null;
            btn.textContent = btn.dataset.original;
            btn.classList.remove('armed');
            await action();
        });
    }
    twoTap($('#new-game-btn'), 'Tap again to start a new game', async () => {
        if (await hostCall('new-game', {})) showToast('New game started — the old one is in History');
    });

    $('#host-link-btn').addEventListener('click', () =>
        copy(JOIN_URL + '#host=' + hostKey, 'Host link copied — keep it private'));

    // Player sheet: correct chips or remove.
    let sheetPlayer = null;
    function openSheet(player) {
        sheetPlayer = player.name;
        $('#sheet-title').textContent = player.name;
        $('#sheet-chips').value = player.chips;
        $('#sheet').classList.remove('hidden');
        $('#sheet-remove').textContent = 'Remove';
    }
    function closeSheet() { $('#sheet').classList.add('hidden'); sheetPlayer = null; }
    $('#sheet-cancel').addEventListener('click', closeSheet);
    $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    $('#sheet-save').addEventListener('click', async () => {
        if (await hostCall('player-chips', { name: sheetPlayer, chips: num('#sheet-chips') })) closeSheet();
    });
    twoTap($('#sheet-remove'), 'Tap again to remove', async () => {
        if (await hostCall('remove', { name: sheetPlayer })) closeSheet();
    });

    // History & restore.
    const fmtTime = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmtClock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    $('#history-btn').addEventListener('click', async () => {
        const box = $('#history');
        if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
        await showGames();
    });

    async function showGames() {
        const games = await hostCall('games');
        if (!games) return;
        const box = $('#history');
        box.innerHTML = '';
        box.classList.remove('hidden');
        for (const g of games) {
            const row = document.createElement('button');
            row.className = 'history-game';
            const who = g.players.map((p) => p.name + ' ' + p.chips.toLocaleString()).join(', ') || 'no players';
            row.innerHTML = '<strong></strong><span></span>';
            row.firstChild.textContent = fmtTime(g.createdAt) + (g.current ? ' · current' : '') + ' · ' + g.actions + ' actions';
            row.lastChild.textContent = who + (g.pot ? ' · pot ' + g.pot.toLocaleString() : '');
            row.addEventListener('click', () => showEntries(g));
            box.appendChild(row);
        }
    }

    async function showEntries(game) {
        const entries = await hostCall('history?game=' + encodeURIComponent(game.gameId));
        if (!entries) return;
        const box = $('#history');
        box.innerHTML = '';
        const back = document.createElement('button');
        back.className = 'btn btn-small btn-outline';
        back.textContent = '← All games';
        back.addEventListener('click', showGames);
        box.appendChild(back);
        if (!game.current) {
            const resume = document.createElement('button');
            resume.className = 'btn btn-small btn-success';
            resume.textContent = 'Resume this game';
            twoTap(resume, 'Tap again to resume', async () => {
                if (await hostCall('resume', { gameId: game.gameId })) { showToast('Game resumed'); box.classList.add('hidden'); }
            });
            box.appendChild(resume);
        }
        const hint = document.createElement('p');
        hint.className = 'muted small';
        hint.textContent = 'Tap an entry to rewind to right after it. The rewind is recorded too, so it can be undone.';
        box.appendChild(hint);
        const list = document.createElement('ul');
        list.className = 'history-list';
        for (const e of entries.slice().reverse()) {
            const li = document.createElement('li');
            li.className = 'history-entry';
            const text = document.createElement('span');
            text.textContent = '#' + e.seq + ' ' + fmtClock(e.timestamp) + ' — ' + e.message;
            li.appendChild(text);
            li.addEventListener('click', () => {
                if (li.classList.contains('armed')) {
                    hostCall('restore', { gameId: game.gameId, seq: e.seq }).then((ok) => {
                        if (ok) { showToast('Restored to #' + e.seq); box.classList.add('hidden'); }
                    });
                    return;
                }
                for (const other of list.querySelectorAll('.armed')) other.classList.remove('armed');
                li.classList.add('armed');
                const balances = e.players.map((p) => p.name + ' ' + p.chips.toLocaleString()).join(', ');
                text.textContent = 'Tap again to restore: ' + (balances || 'no players') + ', pot ' + e.pot.toLocaleString();
                setTimeout(() => {
                    li.classList.remove('armed');
                    text.textContent = '#' + e.seq + ' ' + fmtClock(e.timestamp) + ' — ' + e.message;
                }, 4000);
            });
            list.appendChild(li);
        }
        box.appendChild(list);
    }

    // --- TOAST ---
    let toastTimeout = null;
    function showToast(msg) {
        const el = $('#toast');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => el.classList.add('hidden'), 3000);
    }

    // --- START ---
    (async function start() {
        let res;
        try { res = await request('/state'); } catch (_) { showJoin('Connection error — check your internet and reload.'); return; }
        if (res.status === 404) { show('#missing-screen'); return; }
        if (hostKey) {
            try {
                const check = await request('/host/check', undefined, { 'X-Host-Key': hostKey });
                if (check.status === 403) hostKey = null;
            } catch (_) {}
        }
        document.title = 'EasyPoker · ' + CODE;
        const saved = store.get(NAME_KEY);
        $('#name-input').value = saved || store.get('easypoker.name') || '';
        if (saved) await join(saved);
        else showJoin();
    })();
})();
