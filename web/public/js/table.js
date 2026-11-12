// The table page.
// Game half: the Android app's player client (app/src/main/assets/web/js/app.js), same
// behaviour and rendering, with API paths under /api/t/<CODE>. Host half: a separate tab.
(function () {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const CODE = location.pathname.slice(1).toUpperCase();
    const API = '/api/t/' + CODE;
    const JOIN_URL = location.origin + '/' + CODE;
    const NAME_KEY = 'easypoker.joined.' + CODE;
    const HOST_KEY = 'easypoker.host.' + CODE;
    const TAB_KEY = 'easypoker.tab.' + CODE;
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
    let tab = 'play';

    const store = {
        get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (_) { return null; } },
        set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (_) {} }
    };

    // A host link carries the key in the fragment, which never reaches the server.
    const hashKey = new URLSearchParams(location.hash.slice(1)).get('host');
    if (hashKey) {
        store.set(HOST_KEY, hashKey);
        history.replaceState(null, '', location.pathname);
    }
    hostKey = store.get(HOST_KEY);

    // Without a timeout a request sent while a phone was dozing can hang forever and
    // the button just looks dead. Fail after 8 s so the toast shows.
    function request(path, body, headers) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const opts = { signal: ctrl.signal, headers: Object.assign({}, headers) };
        if (body !== undefined) {
            opts.method = 'POST';
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        return fetch(API + path, opts).finally(() => clearTimeout(t));
    }

    async function send(path, body, headers, toast) {
        try {
            const res = await request(path, body, headers);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { toast(data.error || 'Action failed', true); return null; }
            return data;
        } catch (_) {
            toast('Connection error', true);
            return null;
        }
    }
    const call = (path, body) => send(path, body, undefined, showToast);
    const hostCall = (path, body) => send('/host/' + path, body, { 'X-Host-Key': hostKey }, hostToast);

    // Disable a button while its request is in flight.
    async function busy(btn, fn) {
        btn.classList.add('busy');
        try { return await fn(); } finally { btn.classList.remove('busy'); }
    }

    // ===================== SCREENS =====================
    function showJoin(note) {
        joined = false;
        $('#join-screen').classList.remove('hidden');
        $('#game-screen').classList.add('hidden');
        const noteEl = $('#join-note');
        if (note) {
            noteEl.textContent = note;
            noteEl.classList.remove('hidden');
        } else {
            noteEl.classList.add('hidden');
        }
        if (hostKey) setTab('play');
    }

    function showGame() {
        joined = true;
        $('#join-screen').classList.add('hidden');
        $('#game-screen').classList.remove('hidden');
    }

    // ===================== TABS (host only) =====================
    function setTab(next) {
        tab = next;
        store.set(TAB_KEY, next, true);
        const host = next === 'host';
        $('#tab-play').setAttribute('aria-selected', String(!host));
        $('#tab-host').setAttribute('aria-selected', String(host));
        $('#host-view').classList.toggle('hidden', !host);
        if (host) {
            $('#join-screen').classList.add('hidden');
            $('#game-screen').classList.add('hidden');
            drawQr();
            renderHost();
        } else if (joined) {
            showGame();
        } else {
            $('#join-screen').classList.remove('hidden');
        }
        window.scrollTo(0, 0);
    }
    $('#tab-play').addEventListener('click', () => setTab('play'));
    $('#tab-host').addEventListener('click', () => setTab('host'));

    // ===================== JOIN =====================
    $('#join-btn').addEventListener('click', () => join($('#name-input').value.trim()));
    $('#name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') join($('#name-input').value.trim());
    });

    async function join(name) {
        if (!name) {
            $('#name-input').focus();
            return false;
        }
        const data = await call('/join', { name: name });
        if (!data) return false;
        playerName = data.name;
        myChips = data.chips;
        store.set(NAME_KEY, playerName);
        store.set('easypoker.name', playerName);
        $('#player-name-display').textContent = playerName;
        renderMyChips();
        if (tab === 'play') showGame(); else joined = true;
        connectWS();
        return true;
    }

    // ===================== WEBSOCKET =====================
    // A phone that sleeps or switches networks often leaves the socket looking OPEN
    // while nothing arrives any more. So: ping every 10 s, and if nothing (pong or
    // state) has come back for 25 s, tear the socket down and reconnect. Also
    // reconnect immediately whenever the tab becomes visible or the network returns.
    const PING_MS = 10000;
    const STALE_MS = 25000;
    let lastMessageAt = 0;
    let reconnectTimer = null;
    let reconnectDelay = 1000;
    const wanted = () => joined || !!hostKey;

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
        if (!wanted()) return;
        if (!ws) { connectWS(); return; }
        if (ws.readyState !== WebSocket.OPEN) return;
        if (Date.now() - lastMessageAt > STALE_MS) { setConnected(false); forceReconnect(); return; }
        try { ws.send('ping'); } catch (_) { forceReconnect(); }
    }, PING_MS);

    function resume() {
        if (!wanted()) return;
        if (!ws || ws.readyState !== WebSocket.OPEN || Date.now() - lastMessageAt > PING_MS) forceReconnect();
        else { try { ws.send('ping'); } catch (_) { forceReconnect(); } }
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resume(); });
    window.addEventListener('online', resume);
    window.addEventListener('pageshow', (e) => { if (e.persisted) forceReconnect(); });

    function setConnected(ok) {
        const el = $('#conn-status');
        if (el) el.classList.toggle('hidden', ok);
    }

    // ===================== GAME UI (as app.js) =====================
    function renderMyChips() {
        $('#my-chips').textContent = myChips.toLocaleString() + ' chips';
    }

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

        renderHost();
        renderBuyIn();

        // The host may have started a new game from a typed-in state, or removed us.
        const me = playerName && s.players[playerName];
        if (joined && !me) {
            $('#name-input').value = playerName || '';
            showJoin('You are not in the current game. Join again — use the same name the host entered.');
            return;
        }
        if (me) {
            myChips = me.chips;
            renderMyChips();
        }

        renderQuickButtons();

        const list = $('#players-list');
        list.innerHTML = '';
        const entries = Object.entries(s.players);
        entries.sort((a, b) => {
            if (a[0] === playerName) return -1;
            if (b[0] === playerName) return 1;
            return 0;
        });
        for (const [name, player] of entries) {
            const li = document.createElement('li');
            li.className = 'player-item';
            const isMe = name === playerName;
            li.innerHTML =
                '<span class="name' + (isMe ? ' is-me' : '') + '">' +
                escapeHtml(player.name) + (isMe ? ' (you)' : '') +
                '</span>' +
                '<span class="chips">' + player.chips.toLocaleString() + '</span>';
            list.appendChild(li);
        }

        const logList = $('#log-list');
        logList.innerHTML = '';
        for (const entry of (s.log || []).slice(-10).reverse()) {
            const li = document.createElement('li');
            li.className = 'log-item';
            li.textContent = entry.message;
            logList.appendChild(li);
        }
    }

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
            btn.innerHTML = escapeHtml(q.label) + '<span class="sub">' + q.value.toLocaleString() + '</span>';
            btn.disabled = q.value <= 0;
            btn.addEventListener('click', () => {
                $('#chip-amount').value = q.value;
                renderQuickButtons();
            });
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

    // Buy-in: not part of the app's markup, so it is added here with the app's button classes.
    const buyInBtn = document.createElement('button');
    buyInBtn.id = 'buyin-btn';
    buyInBtn.className = 'btn btn-success hidden';
    buyInBtn.style.width = '100%';
    $('#take-all-btn').after(buyInBtn);
    let buyInArmed = null;
    function renderBuyIn() {
        if (!state) return;
        buyInBtn.classList.toggle('hidden', !state.allowBuyIn);
        if (!buyInArmed) buyInBtn.textContent = 'Buy in (+' + (state.buyInAmount || 0).toLocaleString() + ')';
    }
    function disarmBuyIn() {
        clearTimeout(buyInArmed);
        buyInArmed = null;
        renderBuyIn();
    }
    buyInBtn.addEventListener('click', async () => {
        if (!buyInArmed) {
            buyInBtn.textContent = 'Tap again to buy in for ' + (state.buyInAmount || 0).toLocaleString();
            buyInArmed = setTimeout(disarmBuyIn, 3500);
            return;
        }
        disarmBuyIn();
        if (await call('/buy-in', { name: playerName }) && navigator.vibrate) navigator.vibrate([30, 60, 30]);
    });

    let toastTimeout = null;
    function showToast(msg) {
        const el = $('#toast');
        el.textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => el.classList.add('hidden'), 3000);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===================== HOST VIEW =====================
    let hostToastTimer = null;
    function hostToast(msg, error) {
        const el = $('#host-toast');
        el.textContent = msg;
        el.classList.toggle('error', !!error);
        el.classList.remove('hidden');
        clearTimeout(hostToastTimer);
        hostToastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
    }

    $('#host-code').textContent = CODE;
    $('#invite-link').textContent = JOIN_URL.replace(/^https?:\/\//, '');

    // The QR library is only for the host, so players never wait on a third-party download.
    let qrDrawn = false;
    let qrLoading = false;
    function drawQr() {
        if (qrDrawn) return;
        if (typeof window.qrcode !== 'function') {
            if (qrLoading) return;
            qrLoading = true;
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
            s.onload = () => { qrLoading = false; drawQr(); };
            s.onerror = () => { qrLoading = false; };
            document.head.appendChild(s);
            return;
        }
        const qr = window.qrcode(0, 'M');
        qr.addData(JOIN_URL);
        qr.make();
        $('#qr').innerHTML = qr.createSvgTag({ cellSize: 5, margin: 1, scalable: true });
        qrDrawn = true;
    }

    async function copy(text, done) {
        try {
            await navigator.clipboard.writeText(text);
            hostToast(done);
        } catch (_) {
            window.prompt('Copy this link:', text);
        }
    }
    $('#copy-btn').addEventListener('click', () => copy(JOIN_URL, 'Link copied'));
    if (navigator.share) {
        $('#share-btn').addEventListener('click', async () => {
            try { await navigator.share({ title: 'EasyPoker table ' + CODE, text: 'Join my poker table', url: JOIN_URL }); } catch (_) {}
        });
    } else {
        $('#share-btn').classList.add('hidden');
        $('#share-btn').parentElement.classList.add('single');
    }
    $('#host-link-btn').addEventListener('click', () =>
        copy(JOIN_URL + '#host=' + hostKey, 'Host link copied — anyone with it can run the table'));

    // Blind level pills apply in one tap; every change is recorded and reversible.
    const pills = $('#blind-pills');
    for (const [s, b] of LEVELS) {
        const pill = document.createElement('button');
        pill.className = 'ep-pill';
        pill.dataset.level = s + '/' + b;
        pill.textContent = s.toLocaleString() + '/' + b.toLocaleString();
        pill.setAttribute('aria-pressed', 'false');
        pill.addEventListener('click', () => busy(pill, async () => {
            if (await hostCall('blinds', { small: s, big: b })) hostToast('Blinds ' + s + '/' + b);
        }));
        pills.appendChild(pill);
    }

    const editing = (el) => document.activeElement === el;
    const fmt = (n) => n.toLocaleString();

    function renderHost() {
        if (!hostKey || !state) return;
        const names = state.order || Object.keys(state.players);
        const inPlay = names.reduce((sum, n) => sum + state.players[n].chips, 0) + state.pot;

        $('#host-summary').textContent =
            names.length + (names.length === 1 ? ' player' : ' players') +
            ' · pot ' + fmt(state.pot) + ' · blinds ' + fmt(state.smallBlind) + '/' + fmt(state.bigBlind);
        const badge = $('#tab-host-badge');
        badge.textContent = names.length;
        badge.classList.toggle('hidden', names.length === 0);

        // Players
        const list = $('#host-players');
        list.innerHTML = '';
        if (!names.length) {
            const li = document.createElement('li');
            li.className = 'ep-empty';
            li.textContent = 'Nobody yet. Share the link or QR code.';
            list.appendChild(li);
        }
        for (const n of names) {
            const p = state.players[n];
            const li = document.createElement('li');
            const b = document.createElement('button');
            b.className = 'ep-player';
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = p.name;
            if (p.name === playerName) {
                const you = document.createElement('span');
                you.className = 'ep-you';
                you.textContent = 'you';
                name.appendChild(you);
            }
            const chips = document.createElement('span');
            chips.className = 'chips';
            chips.textContent = fmt(p.chips);
            const net = p.chips - (p.invested ?? state.startingChips);
            const meta = document.createElement('span');
            meta.className = 'meta' + (net > 0 ? ' up' : net < 0 ? ' down' : '');
            meta.textContent = (net > 0 ? '+' : net < 0 ? '−' : '±') + fmt(Math.abs(net)) +
                (p.buyIns ? ' · ' + p.buyIns + (p.buyIns === 1 ? ' buy-in' : ' buy-ins') : '');
            meta.title = 'Up or down against everything put in (starting chips plus buy-ins)';
            b.append(name, meta, chips);
            b.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-edit"/></svg>');
            b.setAttribute('aria-label', 'Edit ' + p.name + ', ' + fmt(p.chips) + ' chips');
            b.addEventListener('click', () => openSheet(p));
            li.appendChild(b);
            list.appendChild(li);
        }
        $('#host-total').innerHTML = '<span>Chips in play</span><strong></strong>';
        $('#host-total strong').textContent = fmt(inPlay);

        // Settings
        const level = state.smallBlind + '/' + state.bigBlind;
        for (const pill of pills.children) pill.setAttribute('aria-pressed', String(pill.dataset.level === level));
        $('#blinds-now').textContent = fmt(state.smallBlind) + ' / ' + fmt(state.bigBlind);
        if (!editing($('#sb-input')) && !editing($('#bb-input'))) {
            $('#sb-input').value = state.smallBlind;
            $('#bb-input').value = state.bigBlind;
        }
        if (!editing($('#pot-input'))) $('#pot-input').value = state.pot;
        $('#host-allow-buyin').checked = !!state.allowBuyIn;
        $('#host-buyin-state').textContent = state.allowBuyIn ? 'On' : 'Off';
        if (!editing($('#host-buyin-amount'))) $('#host-buyin-amount').value = state.buyInAmount;
        if (sheetPlayer && state.players[sheetPlayer]) {
            renderSheet(state.players[sheetPlayer]);
            if (!editing($('#sheet-chips'))) $('#sheet-chips').value = state.players[sheetPlayer].chips;
        }
        if (!editing($('#start-input'))) $('#start-input').value = state.startingChips;
    }

    const num = (sel) => parseInt($(sel).value, 10);
    $('#blinds-btn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
        if (await hostCall('blinds', { small: num('#sb-input'), big: num('#bb-input') })) hostToast('Blinds updated');
    }));
    $('#pot-btn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
        if (await hostCall('pot', { amount: num('#pot-input') })) hostToast('Pot updated');
    }));
    $('#start-btn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
        if (await hostCall('starting-chips', { amount: num('#start-input') })) hostToast('Starting chips updated');
    }));
    const setBuyIn = (btn) => busy(btn, async () => {
        const allow = $('#host-allow-buyin').checked;
        if (await hostCall('buy-in-settings', { allow: allow, amount: num('#host-buyin-amount') })) {
            hostToast(allow ? 'Buy-ins on: ' + fmt(num('#host-buyin-amount')) : 'Buy-ins off');
        } else if (state) {
            $('#host-allow-buyin').checked = !!state.allowBuyIn;
        }
    });
    $('#host-allow-buyin').addEventListener('change', () => setBuyIn($('#host-buyin-btn')));
    $('#host-buyin-btn').addEventListener('click', (e) => setBuyIn(e.currentTarget));
    for (const [input, btn] of [['#host-buyin-amount', '#host-buyin-btn'], ['#pot-input', '#pot-btn'], ['#start-input', '#start-btn'], ['#bb-input', '#blinds-btn'], ['#sb-input', '#blinds-btn']]) {
        $(input).addEventListener('keydown', (e) => { if (e.key === 'Enter') $(btn).click(); });
    }

    // Two taps instead of a confirm() dialog, which some in-app browsers block.
    function twoTap(btn, armedLabel, action) {
        let timer = null;
        const label = btn.querySelector('strong') || btn;
        btn.addEventListener('click', async () => {
            if (!timer) {
                btn.dataset.original = label.textContent;
                label.textContent = armedLabel;
                btn.classList.add('armed');
                timer = setTimeout(reset, 3500);
                return;
            }
            reset();
            await busy(btn, action);
        });
        function reset() {
            clearTimeout(timer);
            timer = null;
            if (btn.dataset.original) label.textContent = btn.dataset.original;
            btn.classList.remove('armed');
        }
    }
    twoTap($('#new-game-btn'), 'Tap again to start a new game', async () => {
        if (await hostCall('new-game', {})) hostToast('New game started — the old one is in history');
    });

    // Player sheet
    let sheetPlayer = null;
    function renderSheet(player) {
        const put = player.invested ?? state.startingChips;
        const net = player.chips - put;
        $('#sheet-buyin').textContent = 'Give a buy-in (+' + fmt(state.buyInAmount) + ')';
        $('#sheet-stats').textContent = (player.buyIns || 0) + (player.buyIns === 1 ? ' buy-in' : ' buy-ins') +
            ' · put in ' + fmt(put) + ' · ' + (net >= 0 ? 'up ' : 'down ') + fmt(Math.abs(net));
    }
    function openSheet(player) {
        sheetPlayer = player.name;
        $('#sheet-title').textContent = player.name;
        renderSheet(player);
        $('#sheet-chips').value = player.chips;
        $('#sheet').classList.remove('hidden');
        $('#sheet-chips').focus();
        $('#sheet-chips').select();
    }
    function closeSheet() { $('#sheet').classList.add('hidden'); sheetPlayer = null; }
    $('#sheet-cancel').addEventListener('click', closeSheet);
    $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheetPlayer) closeSheet(); });
    const saveSheet = () => busy($('#sheet-save'), async () => {
        if (await hostCall('player-chips', { name: sheetPlayer, chips: num('#sheet-chips') })) closeSheet();
    });
    $('#sheet-save').addEventListener('click', saveSheet);
    $('#sheet-buyin').addEventListener('click', (e) => busy(e.currentTarget, async () => {
        if (await hostCall('buy-in', { name: sheetPlayer })) {
            hostToast(sheetPlayer + ' bought in');
            const p = state && state.players[sheetPlayer];
            if (p) $('#sheet-chips').value = p.chips;
        }
    }));
    $('#sheet-chips').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveSheet(); });
    twoTap($('#sheet-remove'), 'Tap again', async () => {
        if (await hostCall('remove', { name: sheetPlayer })) closeSheet();
    });

    // History & restore
    const fmtDate = (ts) => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    $('#history-btn').addEventListener('click', async (e) => {
        const box = $('#history');
        const btn = e.currentTarget;
        if (!box.classList.contains('hidden')) {
            box.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
            return;
        }
        await busy(btn, showGames);
        btn.setAttribute('aria-expanded', 'true');
    });

    async function showGames() {
        const games = await hostCall('games');
        if (!games) return;
        const box = $('#history');
        box.innerHTML = '';
        box.classList.remove('hidden');
        for (const g of games) {
            const row = document.createElement('button');
            row.className = 'ep-game';
            const title = document.createElement('strong');
            title.textContent = fmtDate(g.createdAt) + ' · ' + g.actions + ' actions';
            if (g.current) title.insertAdjacentHTML('beforeend', ' · <span class="ep-current">now playing</span>');
            const who = document.createElement('span');
            who.textContent = (g.players.map((p) => p.name + ' ' + fmt(p.chips)).join(', ') || 'No players') +
                (g.pot ? ' · pot ' + fmt(g.pot) : '');
            row.append(title, who);
            row.addEventListener('click', () => showEntries(g));
            box.appendChild(row);
        }
    }

    async function showEntries(game) {
        const entries = await hostCall('history?game=' + encodeURIComponent(game.gameId));
        if (!entries) return;
        const box = $('#history');
        box.innerHTML = '';
        const bar = document.createElement('div');
        bar.className = 'ep-history-bar';
        const back = document.createElement('button');
        back.className = 'ep-btn ep-btn-ghost';
        back.textContent = '← All games';
        back.addEventListener('click', showGames);
        bar.appendChild(back);
        if (!game.current) {
            const resume = document.createElement('button');
            resume.className = 'ep-btn ep-btn-green';
            resume.textContent = 'Resume this game';
            twoTap(resume, 'Tap again to resume', async () => {
                if (await hostCall('resume', { gameId: game.gameId })) { hostToast('Game resumed'); box.classList.add('hidden'); }
            });
            bar.appendChild(resume);
        }
        box.appendChild(bar);
        const hint = document.createElement('p');
        hint.className = 'ep-hint';
        hint.textContent = 'Tap an entry to rewind to right after it. The rewind is recorded too, so it can be undone.';
        box.appendChild(hint);
        const list = document.createElement('ul');
        list.className = 'ep-entries';
        for (const e of entries.slice().reverse()) {
            const li = document.createElement('li');
            const row = document.createElement('button');
            row.className = 'ep-entry';
            const when = document.createElement('span');
            when.className = 'when';
            when.textContent = '#' + e.seq + ' ' + fmtTime(e.timestamp).slice(0, 5);
            const text = document.createElement('span');
            const plain = e.message;
            text.textContent = plain;
            row.append(when, text);
            let timer = null;
            row.addEventListener('click', async () => {
                if (row.classList.contains('armed')) {
                    clearTimeout(timer);
                    if (await hostCall('restore', { gameId: game.gameId, seq: e.seq })) {
                        hostToast('Restored to #' + e.seq);
                        box.classList.add('hidden');
                        $('#history-btn').setAttribute('aria-expanded', 'false');
                    }
                    return;
                }
                for (const other of list.querySelectorAll('.armed')) other.dispatchEvent(new Event('disarm'));
                row.classList.add('armed');
                const balances = e.players.map((p) => p.name + ' ' + fmt(p.chips)).join(', ');
                text.textContent = 'Tap again to restore: ' + (balances || 'no players') + ', pot ' + fmt(e.pot);
                timer = setTimeout(() => row.dispatchEvent(new Event('disarm')), 4000);
            });
            row.addEventListener('disarm', () => {
                clearTimeout(timer);
                row.classList.remove('armed');
                text.textContent = plain;
            });
            li.appendChild(row);
            list.appendChild(li);
        }
        box.appendChild(list);
    }

    // ===================== START =====================
    (async function start() {
        let res;
        try { res = await request('/state'); } catch (_) { showJoin('Connection error — check your internet and reload.'); return; }
        if (res.status === 404) {
            $('#join-screen').classList.add('hidden');
            $('#missing-screen').classList.remove('hidden');
            return;
        }
        if (hostKey) {
            try {
                const check = await request('/host/check', undefined, { 'X-Host-Key': hostKey });
                if (check.status === 403) hostKey = null;
            } catch (_) {}
        }
        document.title = 'EasyPoker · ' + CODE;
        // Only paint this first state if nobody joined meanwhile: it predates the join,
        // so it would say we are not in the game. The socket brings the fresh one.
        try { const first = await res.json(); if (!joined) updateUI(first); } catch (_) {}

        if (hostKey) {
            document.body.classList.add('has-tabs');
            $('#tabs').classList.remove('hidden');
            connectWS();
        }
        const saved = store.get(NAME_KEY);
        $('#name-input').value = saved || store.get('easypoker.name') || '';
        if (saved) await join(saved);

        if (hostKey) {
            const remembered = store.get(TAB_KEY, true);
            const alone = (state && (state.order || []).length < 2);
            setTab(remembered || (alone ? 'host' : 'play'));
        }
    })();
})();
