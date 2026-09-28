(function () {
    'use strict';

    const STORAGE_KEY = 'pokerchips.playerName';

    let playerName = null;
    let ws = null;
    let myChips = 0;
    let pot = 0;
    let smallBlind = 10;
    let bigBlind = 20;
    let joined = false;

    const $ = (sel) => document.querySelector(sel);

    // Survives closing the tab or restarting the browser, so a player never has to
    // remember what exact name they joined with.
    function loadName() {
        try { return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem('playerName'); } catch (_) { return null; }
    }
    function saveName(name) {
        try { localStorage.setItem(STORAGE_KEY, name); } catch (_) {}
    }

    // --- SCREENS ---
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
    }

    function showGame() {
        joined = true;
        $('#join-screen').classList.add('hidden');
        $('#game-screen').classList.remove('hidden');
    }

    // --- JOIN ---
    $('#join-btn').addEventListener('click', () => join($('#name-input').value.trim()));
    $('#name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') join($('#name-input').value.trim());
    });

    async function join(name) {
        if (!name) {
            $('#name-input').focus();
            return false;
        }
        try {
            const res = await fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to join');
                return false;
            }
            const data = await res.json();
            playerName = data.name;
            myChips = data.chips;
            saveName(playerName);

            $('#player-name-display').textContent = playerName;
            renderMyChips();
            showGame();
            connectWS();
            return true;
        } catch (e) {
            showToast('Connection error');
            return false;
        }
    }

    // --- WEBSOCKET ---
    function connectWS() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(proto + '//' + location.host + '/ws');

        ws.onmessage = (e) => {
            try {
                updateUI(JSON.parse(e.data));
            } catch (_) {}
        };

        ws.onclose = () => {
            setTimeout(connectWS, 2000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }

    // --- UI UPDATE ---
    function renderMyChips() {
        $('#my-chips').textContent = myChips.toLocaleString() + ' chips';
    }

    function updateUI(state) {
        pot = state.pot;
        const blindsChanged = state.smallBlind !== smallBlind || state.bigBlind !== bigBlind;
        smallBlind = state.smallBlind || smallBlind;
        bigBlind = state.bigBlind || bigBlind;

        $('#pot-amount').textContent = pot.toLocaleString();
        $('#take-all-btn').disabled = pot <= 0;
        $('#take-all-btn').textContent = pot > 0 ? 'Take whole pot (' + pot.toLocaleString() + ')' : 'Take whole pot';
        $('#blinds-display').textContent = 'BLINDS ' + smallBlind + ' / ' + bigBlind;
        $('#chip-amount').step = smallBlind;
        if (blindsChanged || !$('#chip-amount').value) $('#chip-amount').value = bigBlind;

        // The host may have started a new game from a typed-in state, or removed us.
        const me = playerName && state.players[playerName];
        if (joined && !me) {
            $('#name-input').value = playerName || '';
            showJoin("You are not in the current game. Join again — use the same name the host entered.");
            return;
        }
        if (me) {
            myChips = me.chips;
            renderMyChips();
        }

        renderQuickButtons();

        // Players
        const list = $('#players-list');
        list.innerHTML = '';
        const entries = Object.entries(state.players);
        // Show current player first
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

        // Log
        const logList = $('#log-list');
        logList.innerHTML = '';
        const recent = (state.log || []).slice(-10).reverse();
        for (const entry of recent) {
            const li = document.createElement('li');
            li.className = 'log-item';
            li.textContent = entry.message;
            logList.appendChild(li);
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
        // Snap to the small-blind grid first, then move one small blind.
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
    $('#add-btn').addEventListener('click', () => chipAction('/api/pot/add'));
    $('#take-btn').addEventListener('click', () => chipAction('/api/pot/take'));

    // Sends no amount: the server gives whatever the pot holds when the request lands,
    // so a bet arriving at the same moment is never left behind.
    $('#take-all-btn').addEventListener('click', async () => {
        if (pot <= 0) return;
        try {
            const res = await fetch('/api/pot/take-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName })
            });
            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Action failed');
                return;
            }
            if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
        } catch (e) {
            showToast('Connection error');
        }
    });

    async function chipAction(endpoint) {
        const amount = parseInt($('#chip-amount').value, 10);
        if (!amount || amount <= 0) {
            showToast('Enter an amount');
            return;
        }
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName, amount: amount })
            });
            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Action failed');
                return;
            }
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(30);
        } catch (e) {
            showToast('Connection error');
        }
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

    // --- UTILS ---
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- RESTORE SESSION ---
    // Re-join before listening, so the first state we see already includes us.
    const saved = loadName();
    if (saved) {
        $('#name-input').value = saved;
        join(saved);
    }
})();
