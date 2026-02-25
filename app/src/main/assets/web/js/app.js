(function () {
    'use strict';

    let playerName = null;
    let ws = null;
    let myChips = 0;

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // --- SCREENS ---
    function showJoin() {
        $('#join-screen').classList.remove('hidden');
        $('#game-screen').classList.add('hidden');
    }

    function showGame() {
        $('#join-screen').classList.add('hidden');
        $('#game-screen').classList.remove('hidden');
    }

    // --- JOIN ---
    $('#join-btn').addEventListener('click', join);
    $('#name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') join();
    });

    async function join() {
        const name = $('#name-input').value.trim();
        if (!name) {
            $('#name-input').focus();
            return;
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
                return;
            }
            const data = await res.json();
            playerName = data.name;
            myChips = data.chips;

            sessionStorage.setItem('playerName', playerName);

            $('#player-name-display').textContent = playerName;
            $('#my-chips').textContent = myChips.toLocaleString() + ' chips';
            showGame();
            connectWS();
        } catch (e) {
            showToast('Connection error');
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
                const state = JSON.parse(e.data);
                updateUI(state);
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
    function updateUI(state) {
        // Pot
        $('#pot-amount').textContent = state.pot.toLocaleString();

        // My chips
        const me = state.players[playerName];
        if (me) {
            myChips = me.chips;
            $('#my-chips').textContent = myChips.toLocaleString() + ' chips';
        }

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

    // --- ACTIONS ---
    $('#add-btn').addEventListener('click', () => chipAction('/api/pot/add'));
    $('#take-btn').addEventListener('click', () => chipAction('/api/pot/take'));

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

    // --- QUICK BUTTONS ---
    $$('.quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.amount;
            if (val === 'all') {
                $('#chip-amount').value = myChips;
            } else {
                $('#chip-amount').value = val;
            }
            // Highlight
            $$('.quick-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

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
    const saved = sessionStorage.getItem('playerName');
    if (saved) {
        playerName = saved;
        $('#player-name-display').textContent = playerName;
        showGame();
        connectWS();
        // Re-join to ensure server knows us (in case server restarted)
        fetch('/api/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerName })
        }).then(res => res.json()).then(data => {
            myChips = data.chips;
            $('#my-chips').textContent = myChips.toLocaleString() + ' chips';
        }).catch(() => {});
    }
})();
