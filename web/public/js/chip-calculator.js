// Poker chip calculator on /guides/poker-chip-calculator: chip values + per-player
// distribution, and a stack counter. No dependencies.
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const NICE = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const COLORS = [['White', '#f4f1e8'], ['Red', '#e94560'], ['Green', '#1f9d5a'], ['Black', '#2b2b2b'], ['Purple', '#8e44ad']];
    // Share of the stack's value held in each colour, smallest first.
    const SHARES = { 3: [0.1, 0.3, 0.6], 4: [0.05, 0.15, 0.3, 0.5], 5: [0.04, 0.1, 0.2, 0.26, 0.4] };
    const fmt = (n) => n.toLocaleString('en-US');
    const int = (el) => Math.max(0, parseInt(el.value, 10) || 0);

    /** Chip values: the small blind, then each next "nice" value at least 4x the previous. */
    function denominations(sb, k) {
        const out = [sb];
        while (out.length < k) {
            const prev = out[out.length - 1];
            const next = NICE.find((v) => v >= prev * 4 && v % sb === 0) || prev * 5;
            out.push(next);
        }
        return out;
    }

    /** Chips of each value per player, summing exactly to the stack. */
    function distribute(stack, values) {
        const shares = SHARES[values.length];
        const counts = values.map((v, i) => (i < values.length - 1 ? Math.floor((shares[i] * stack) / v) : 0));
        let rest = stack - counts.reduce((s, c, i) => s + c * values[i], 0);
        for (let i = values.length - 1; i >= 0; i--) {
            const n = Math.floor(rest / values[i]);
            counts[i] += n;
            rest -= n * values[i];
        }
        return counts;
    }

    function renderDistribution() {
        const players = Math.min(int($('calc-players')), 50);
        const stack = int($('calc-stack'));
        const sb = int($('calc-sb'));
        const k = parseInt($('calc-colors').value, 10);
        const out = $('calc-result');
        if (!players || !stack || !sb) { out.innerHTML = '<p class="ep-tool-note">Fill in every field.</p>'; return; }
        if (stack % sb) {
            out.innerHTML = `<p class="ep-tool-warn">The starting stack should be a multiple of the small blind (${fmt(sb)}).</p>`;
            return;
        }
        const values = denominations(sb, k);
        const counts = distribute(stack, values);
        const perPlayer = counts.reduce((a, b) => a + b, 0);
        const rows = values.map((v, i) => `<tr><td><span class="ep-dot" style="--c:${COLORS[i][1]}"></span>${COLORS[i][0]}</td>` +
            `<td>${fmt(v)}</td><td>${fmt(counts[i])}</td><td>${fmt(counts[i] * players)}</td></tr>`).join('');
        out.innerHTML =
            `<div class="ep-table-wrap"><table><thead><tr><th>Colour</th><th>Value</th><th>Per player</th><th>Total (${fmt(players)} players)</th></tr></thead>` +
            `<tbody>${rows}</tbody></table></div>` +
            `<p class="ep-tool-note">Each player gets ${fmt(perPlayer)} chips worth ${fmt(stack)} (${fmt(Math.round(stack / (sb * 2)))} big blinds). ` +
            `You need ${fmt(perPlayer * players)} chips in total.</p>`;
    }

    function renderCounter() {
        const rows = $('count-rows');
        if (!rows.childElementCount) {
            for (const v of [1, 5, 25, 100, 500, 1000]) {
                const label = document.createElement('label');
                label.className = 'ep-field';
                label.innerHTML = `<span class="ep-field-label">Chips worth ${fmt(v)}</span>` +
                    `<input class="ep-input" type="number" min="0" value="0" inputmode="numeric" data-value="${v}">`;
                rows.appendChild(label);
            }
            rows.addEventListener('input', renderCounter);
        }
        let total = 0;
        for (const input of rows.querySelectorAll('input')) total += int(input) * Number(input.dataset.value);
        $('count-total').textContent = fmt(total);
    }

    for (const id of ['calc-players', 'calc-stack', 'calc-sb', 'calc-colors']) $(id).addEventListener('input', renderDistribution);
    renderDistribution();
    renderCounter();
})();
