// Strategy and variant guides. Odds below are exact counts from a 52-card deck (outs
// over unseen cards: 47 on the flop, 46 on the turn); see guides/sources.mjs for the
// pages each one is checked against.

const CTA_LINK = '<a href="/">EasyPoker</a>';

export const strategy = [
  {
    slug: 'poker-outs-and-odds',
    title: 'Poker Outs and Odds: The Rule of 4 and 2',
    description:
      'Count your outs and turn them into odds at the table: the rule of 4 and 2, an exact odds chart for common draws, and when the shortcut is wrong.',
    h1: 'Poker outs and odds: the rule of 4 and 2',
    lede:
      'Outs are the unseen cards that would make your hand. Multiply your outs by 4 on the flop (two cards to come) or by 2 on the turn (one card to come) for a quick percentage chance of hitting. A flush draw has 9 outs: about 36% on the flop and 18% on the turn.',
    related: ['pot-odds', 'texas-holdem-starting-hands', 'poker-hand-rankings'],
    body: `
<h2>How to count outs</h2>
<p>After the flop you have seen 5 cards (your 2 and the 3 on the board), so 47 are unseen. After the turn, 46 are unseen. An <strong>out</strong> is any of those cards that improves you to a hand you expect to win.</p>
<ul>
  <li><strong>Flush draw</strong> (four of one suit): 13 cards of the suit minus the 4 you can see = <strong>9 outs</strong>.</li>
  <li><strong>Open-ended straight draw</strong> (e.g. 8-7-6-5): four cards at each end = <strong>8 outs</strong>.</li>
  <li><strong>Gutshot</strong> (inside straight draw, e.g. 9-8-6-5): <strong>4 outs</strong>.</li>
  <li><strong>Pocket pair hoping for a set</strong>: <strong>2 outs</strong>.</li>
  <li><strong>Flush draw plus open-ended straight draw</strong>: 9 + 8 minus the 2 cards counted twice = <strong>15 outs</strong>.</li>
</ul>
<p>Do not count an out twice, and discount outs that also help your opponent (a card that completes your straight but pairs the board may give someone a full house).</p>

<h2>Exact odds chart</h2>
<p>The chance of hitting at least one out, calculated exactly: on the flop, 1 − (non-outs/47 × (non-outs − 1)/46); on the turn, outs/46.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Draw</th><th>Outs</th><th>Flop to river</th><th>Rule of 4</th><th>Turn to river</th><th>Rule of 2</th></tr></thead>
  <tbody>
    <tr><td>Pocket pair to a set</td><td>2</td><td>8.4%</td><td>8%</td><td>4.3%</td><td>4%</td></tr>
    <tr><td>Gutshot</td><td>4</td><td>16.5%</td><td>16%</td><td>8.7%</td><td>8%</td></tr>
    <tr><td>Two overcards</td><td>6</td><td>24.1%</td><td>24%</td><td>13.0%</td><td>12%</td></tr>
    <tr><td>Open-ended straight</td><td>8</td><td>31.5%</td><td>32%</td><td>17.4%</td><td>16%</td></tr>
    <tr><td>Flush draw</td><td>9</td><td>35.0%</td><td>36%</td><td>19.6%</td><td>18%</td></tr>
    <tr><td>Flush + straight draw</td><td>15</td><td>54.1%</td><td>60%</td><td>32.6%</td><td>30%</td></tr>
  </tbody>
</table></div>

<h2>When the rule of 4 is wrong</h2>
<ul>
  <li><strong>Many outs.</strong> Above about 8 outs, ×4 overstates the chance: 15 outs is 54%, not 60%. Use (outs × 4) − (outs − 8) as a closer estimate.</li>
  <li><strong>Only one card is guaranteed.</strong> The ×4 figure assumes you see both the turn and the river. If someone can bet again on the turn, you usually only get one card for the price, so use ×2.</li>
  <li><strong>Dirty outs.</strong> If some outs also improve your opponent, do not count them.</li>
</ul>

<h2>Turning the percentage into a decision</h2>
<p>Odds alone do not say whether to call. Compare them with the <a href="/guides/pot-odds">pot odds</a>: the share of the final pot that your call makes up. If your chance of hitting is higher than that share, calling is profitable in the long run.</p>
<p>At a home game, the arithmetic is easier when the pot is an exact number in front of everyone. With ${CTA_LINK} the pot and every bet show live on each phone, so you only have to count your outs.</p>
`,
    faq: [
      ['What is the rule of 4 and 2 in poker?', 'Multiply your outs by 4 on the flop, or by 2 on the turn, to estimate your percentage chance of hitting by the river.'],
      ['How many outs does a flush draw have?', 'Nine. There are 13 cards of each suit and you can already see four of them.'],
      ['What are the odds of hitting a flush draw?', 'About 35% from the flop to the river and about 19.6% from the turn to the river.'],
      ['What are the odds of an open-ended straight draw?', 'About 31.5% from the flop to the river with 8 outs, and 17.4% from the turn.'],
      ['What are the odds of flopping a set with a pocket pair?', 'About 11.8%, or 1 time in 8.5. If you miss on the flop, two outs give about 8.4% to hit by the river.'],
    ],
  },

  {
    slug: 'pot-odds',
    title: 'Pot Odds Explained: When to Call in Poker',
    description:
      'How to calculate pot odds in poker, convert them to the equity you need to call, and compare them with your draw. Worked examples with real numbers.',
    h1: 'Pot odds explained',
    lede:
      'Pot odds compare the size of a call with the pot you could win. Divide the amount you must call by the total pot after your call: that is the share of the time you need to win for the call to break even. Calling 50 to win a pot that will be 200 needs 25%.',
    related: ['poker-outs-and-odds', 'texas-holdem-rules', 'side-pots'],
    body: `
<h2>The formula</h2>
<p><strong>Equity needed = amount to call ÷ (pot before your call + amount to call)</strong></p>
<p>"Pot before your call" includes your opponent's bet. The result is the minimum chance of winning that makes the call break even over many hands.</p>

<h2>Worked example</h2>
<ol>
  <li>The pot is 100. Your opponent bets 50, so the pot is now 150.</li>
  <li>You must call 50. After your call the pot will be 200.</li>
  <li>Equity needed: 50 ÷ 200 = <strong>25%</strong>.</li>
  <li>Expressed as a ratio, the pot is offering you 150 to 50, or <strong>3 to 1</strong>.</li>
</ol>

<h2>Common bet sizes and the equity they demand</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Opponent bets</th><th>Pot odds offered</th><th>Equity you need to call</th></tr></thead>
  <tbody>
    <tr><td>Quarter pot</td><td>5 to 1</td><td>16.7%</td></tr>
    <tr><td>Third of the pot</td><td>4 to 1</td><td>20%</td></tr>
    <tr><td>Half pot</td><td>3 to 1</td><td>25%</td></tr>
    <tr><td>Two thirds pot</td><td>2.5 to 1</td><td>28.6%</td></tr>
    <tr><td>Full pot</td><td>2 to 1</td><td>33.3%</td></tr>
    <tr><td>Twice the pot</td><td>1.5 to 1</td><td>40%</td></tr>
  </tbody>
</table></div>

<h2>Putting pot odds and outs together</h2>
<p>Say you hold a flush draw on the turn. You have 9 outs and one card to come: 9 ÷ 46 = <strong>19.6%</strong> (see <a href="/guides/poker-outs-and-odds">outs and odds</a>).</p>
<ul>
  <li>Opponent bets a third of the pot: you need 20%. Almost exactly break-even.</li>
  <li>Opponent bets half the pot: you need 25%. Calling loses chips in the long run, unless you expect to win more later.</li>
  <li>Opponent bets a quarter of the pot: you need 16.7%. Calling is profitable.</li>
</ul>
<p>On the flop, if your opponent is all-in so you are sure to see both cards, the flush draw is 35% and you can call a bet up to about the size of the pot.</p>

<h2>Implied odds</h2>
<p>Pot odds only count the chips already in the middle. <strong>Implied odds</strong> add what you expect to win on later streets if you hit. With deep stacks and an opponent who will pay you off, a draw can be worth calling even when the pot odds alone say no. The reverse, <strong>reverse implied odds</strong>, is when hitting your hand can still cost you, such as a small flush against a bigger one.</p>

<h2>Pot odds at a home game</h2>
<p>The hardest part of pot odds at a live table is knowing the pot. With ${CTA_LINK}, the pot is shown as an exact number on every player's phone, so the formula above is one division.</p>
`,
    faq: [
      ['How do you calculate pot odds?', 'Divide the amount you have to call by the total pot after your call. Calling 50 into a pot of 150 gives 50 ÷ 200 = 25%.'],
      ['What are good pot odds to call?', 'Any time your chance of winning is higher than the equity the pot odds require. Facing a half-pot bet, you need 25%.'],
      ['What is the difference between pot odds and implied odds?', 'Pot odds use only the chips already in the pot. Implied odds also include chips you expect to win on later streets.'],
      ['Should I call with a flush draw?', 'On the turn, a flush draw wins about 19.6% of the time, so it is a break-even call against a bet of a third of the pot and a losing call against larger bets, before implied odds.'],
    ],
  },

  {
    slug: 'texas-holdem-starting-hands',
    title: "Texas Hold'em Starting Hands: Which to Play",
    description:
      "Which Texas Hold'em starting hands to play at a home game: a simple tier list, how position changes it, and the odds of being dealt each kind of hand.",
    h1: "Texas Hold'em starting hands",
    lede:
      "There are 169 different starting hands in Hold'em. At a typical home game, play the strongest 15 to 25 percent of them: big pairs, big aces and suited broadway cards, more hands from late position and fewer from early position.",
    related: ['poker-positions', 'poker-outs-and-odds', 'poker-hand-rankings'],
    body: `
<h2>Starting hand facts</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Fact</th><th>Number</th></tr></thead>
  <tbody>
    <tr><td>Two-card combinations from 52 cards</td><td>1,326</td></tr>
    <tr><td>Distinct starting hands (ignoring suit order)</td><td>169: 13 pairs, 78 suited, 78 offsuit</td></tr>
    <tr><td>Chance of any pocket pair</td><td>78 / 1,326 = 1 in 17 (5.9%)</td></tr>
    <tr><td>Chance of a specific pair, e.g. aces</td><td>6 / 1,326 = 1 in 221 (0.45%)</td></tr>
    <tr><td>Chance of two suited cards</td><td>312 / 1,326 = 4 in 17 (23.5%)</td></tr>
    <tr><td>Chance of ace-king, suited or not</td><td>16 / 1,326 (1.2%)</td></tr>
  </tbody>
</table></div>

<h2>A simple tier list</h2>
<p>This is a common, deliberately simple way to group hands for a full-ring home game, not a solver chart. "s" means suited, "o" offsuit.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Tier</th><th>Hands</th><th>How to play them</th></tr></thead>
  <tbody>
    <tr><th scope="row">Premium</th><td>A♠ A♥, K♠ K♥, Q♠ Q♥, J♠ J♥, A♠ K♠, A♠ K♥</td><td>Raise from any position; re-raise if someone raised first</td></tr>
    <tr><th scope="row">Strong</th><td>10-10, 9-9, AQs, AJs, KQs, AQo</td><td>Raise from any position; call a single raise</td></tr>
    <tr><th scope="row">Playable</th><td>8-8 to 2-2, ATs, KJs, QJs, J10s, 10-9s, AJo, KQo</td><td>Raise from middle and late position; small pairs hope to hit a set</td></tr>
    <tr><th scope="row">Late position only</th><td>Suited aces (A9s to A2s), suited connectors (98s to 54s), KTs, QTs, KJo, QJo</td><td>Open from the cutoff or button when nobody has raised</td></tr>
    <tr><th scope="row">Usually fold</th><td>Unsuited low cards, gappers like 9-5, weak aces offsuit (A8o and below)</td><td>Fold, except from the big blind when nobody raised</td></tr>
  </tbody>
</table></div>

<h2>Why position changes everything</h2>
<p>Players who act later see what everyone else did first. That makes marginal hands easier to play, so the later your <a href="/guides/poker-positions">position</a>, the more hands you can open. A hand like K♣ J♦ is a fold under the gun at a full table and a raise on the button.</p>

<h2>Home game adjustments</h2>
<ul>
  <li><strong>Loose tables</strong> (many players call pre-flop): play fewer weak aces and more suited and connected cards and small pairs, which make strong hands that win big multi-way pots.</li>
  <li><strong>Tight tables</strong> (most players fold): steal the blinds more often from late position.</li>
  <li><strong>Short-handed</strong> (five or fewer players): every hand goes up a tier, because fewer opponents hold something better.</li>
</ul>

<h2>Starting hands people overvalue</h2>
<ul>
  <li><strong>Any ace.</strong> A♦ 7♣ loses to every better ace and is hard to play after the flop.</li>
  <li><strong>Any two suited cards.</strong> Being suited adds only a few percent of equity; 9♥ 3♥ is still a bad hand.</li>
  <li><strong>Small pairs out of position</strong> facing a raise: you flop a set only about 1 time in 8.5.</li>
</ul>
`,
    faq: [
      ["How many starting hands are there in Texas Hold'em?", '169 distinct hands (13 pairs, 78 suited and 78 offsuit combinations of ranks), made from 1,326 possible two-card combinations.'],
      ["What is the best starting hand in Hold'em?", 'Pocket aces. You are dealt them 1 time in 221.'],
      ['How often do you get a pocket pair?', 'Once every 17 hands on average, or 5.9% of the time.'],
      ['What percentage of hands should I play?', 'At a full home table, roughly the best 15 to 25 percent, playing more from late position than early.'],
      ['Is ace-king a pair?', 'No, but it is one of the strongest starting hands because it makes top pair with the best kicker.'],
    ],
  },

  {
    slug: 'poker-positions',
    title: 'Poker Positions Explained: Button, Blinds, UTG',
    description:
      'Every seat at a poker table explained, from under the gun to the button: who acts first before and after the flop, and why late position wins more.',
    h1: 'Poker positions explained',
    lede:
      'Position is where you sit relative to the dealer button, and it decides when you act. The button acts last on every street after the flop, which is the biggest advantage at the table; the blinds and under the gun act with the least information.',
    related: ['texas-holdem-starting-hands', 'texas-holdem-rules', 'poker-terms-glossary'],
    body: `
<h2>The seats at a 9-player table</h2>
<p>Listed in the order they act before the flop.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Seat</th><th>Short name</th><th>Where it is</th><th>Group</th></tr></thead>
  <tbody>
    <tr><td>Under the gun</td><td>UTG</td><td>Left of the big blind; first to act pre-flop</td><td>Early</td></tr>
    <tr><td>Under the gun +1</td><td>UTG+1</td><td>Next seat left</td><td>Early</td></tr>
    <tr><td>Middle position</td><td>MP</td><td>Next seat left</td><td>Middle</td></tr>
    <tr><td>Lojack</td><td>LJ</td><td>Three seats right of the button</td><td>Middle</td></tr>
    <tr><td>Hijack</td><td>HJ</td><td>Two seats right of the button</td><td>Late</td></tr>
    <tr><td>Cutoff</td><td>CO</td><td>Directly right of the button</td><td>Late</td></tr>
    <tr><td>Button</td><td>BTN</td><td>The dealer; last to act after the flop</td><td>Late</td></tr>
    <tr><td>Small blind</td><td>SB</td><td>Left of the button; posts the small blind</td><td>Blinds</td></tr>
    <tr><td>Big blind</td><td>BB</td><td>Two left of the button; last to act pre-flop</td><td>Blinds</td></tr>
  </tbody>
</table></div>
<p>With fewer players, remove seats from the early positions first. Six-handed, the seats are UTG, hijack, cutoff, button, small blind and big blind.</p>

<h2>Who acts first?</h2>
<ul>
  <li><strong>Before the flop:</strong> under the gun acts first and the big blind acts last.</li>
  <li><strong>On the flop, turn and river:</strong> the first player still in the hand left of the button acts first (usually the small blind), and the button acts last.</li>
</ul>

<h2>Why acting last is worth chips</h2>
<ol>
  <li><strong>Information.</strong> You see whether opponents checked, bet or raised before you decide.</li>
  <li><strong>Control of the pot size.</strong> You can check behind to see a free card, or bet when others show weakness.</li>
  <li><strong>Cheaper bluffs.</strong> When everyone checks to you, a bet often wins the pot right away.</li>
</ol>
<p>That is why good players play more <a href="/guides/texas-holdem-starting-hands">starting hands</a> from the cutoff and button and fewer from early position.</p>

<h2>The blinds: the worst seats</h2>
<p>The small and big blind have money in the pot before seeing cards and will act first on every later street. Defend the big blind with reasonable hands because you are getting a discount, but do not fall in love with weak hands out of position.</p>

<h2>Common position mistakes</h2>
<ul>
  <li><strong>Playing the same hands from every seat.</strong> A hand that is a fine raise on the button is often a fold under the gun.</li>
  <li><strong>Calling raises from the small blind</strong> with marginal hands. You will be first to act for the rest of the hand.</li>
  <li><strong>Forgetting that position is relative.</strong> What matters after the flop is whether you act before or after the players still in the hand, not your seat name.</li>
</ul>

<h2>Keeping track of the button at home</h2>
<p>Use any object as the dealer button and move it one seat left after every hand; the blinds follow it. At a table run on ${CTA_LINK}, players post the blinds from their own phones, and the host sets the current blind level so everyone sees the same amounts.</p>
`,
    faq: [
      ['What is the best position in poker?', 'The button, because it acts last on the flop, turn and river.'],
      ['What does UTG mean in poker?', 'Under the gun: the seat directly left of the big blind, which acts first before the flop.'],
      ['Who acts first after the flop?', 'The first player still in the hand to the left of the dealer button, usually the small blind.'],
      ['What is the cutoff in poker?', 'The seat directly to the right of the button, the second-best position at the table.'],
      ['What is the hijack seat?', 'The seat two to the right of the button, just before the cutoff.'],
    ],
  },

  {
    slug: 'omaha-poker-rules',
    title: 'Omaha Poker Rules: How Pot-Limit Omaha Works',
    description:
      'Omaha poker rules for a home game: four hole cards, the use-exactly-two rule, pot-limit betting with a worked example, and how Omaha differs from Hold\'em.',
    h1: 'Omaha poker rules',
    lede:
      "Omaha is played like Texas Hold'em, with four hole cards instead of two. At showdown you must use exactly two of your hole cards and exactly three of the five board cards. It is usually played pot-limit, so the biggest raise allowed is the size of the pot.",
    related: ['texas-holdem-rules', 'poker-hand-rankings', 'home-poker-house-rules'],
    body: `
<h2>Omaha in five rules</h2>
<ol>
  <li>Each player gets <strong>four hole cards</strong> face down.</li>
  <li>Blinds, the flop, turn and river, and the four betting rounds work exactly as in <a href="/guides/texas-holdem-rules">Texas Hold'em</a>.</li>
  <li>Your hand is made of <strong>exactly two hole cards plus exactly three board cards</strong>. Not one, not three, not four.</li>
  <li>Hands rank the same as in Hold'em (see <a href="/guides/poker-hand-rankings">hand rankings</a>).</li>
  <li>In Pot-Limit Omaha (PLO), the maximum bet or raise is the size of the pot.</li>
</ol>

<h2>The two-plus-three rule, with examples</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Your hand</th><th>Board</th><th>What you have</th></tr></thead>
  <tbody>
    <tr><td>A♥ K♣ 7♦ 2♠</td><td>Q♥ J♥ 9♥ 4♥ 3♣</td><td>No flush: you hold only one heart and must use two hole cards</td></tr>
    <tr><td>A♥ 6♥ K♣ 2♠</td><td>Q♥ J♥ 9♥ 4♣ 3♣</td><td>Ace-high flush: A♥ 6♥ plus Q♥ J♥ 9♥</td></tr>
    <tr><td>K♠ K♣ 8♦ 3♥</td><td>K♥ 9♣ 9♦ 5♠ 2♣</td><td>Full house, kings full of nines</td></tr>
    <tr><td>Q♦ 7♣ 6♠ 2♥</td><td>9♥ 9♣ 9♦ 9♠ A♣</td><td>Not four of a kind: only three board cards count, so you have trip nines with Q-7</td></tr>
  </tbody>
</table></div>

<h2>Pot-limit betting, worked out</h2>
<p>A pot-sized raise is: <strong>call first, then raise by the size of the pot after your call</strong>.</p>
<ol>
  <li>The pot is 100. Your opponent bets 50, so the pot is 150.</li>
  <li>You first call 50: the pot would be 200.</li>
  <li>You may raise by up to 200 more, so your total bet is up to <strong>250</strong>.</li>
</ol>
<p>When nobody has bet yet, the maximum bet is simply the size of the pot.</p>

<h2>How Omaha feels different from Hold'em</h2>
<ul>
  <li><strong>Hands are stronger.</strong> With six two-card combinations in every hand, big hands are common. Two pair rarely wins a multi-way pot.</li>
  <li><strong>Draws are bigger.</strong> Wrap straight draws can have 13 or more outs, so the favourite on the flop is often only a slight one.</li>
  <li><strong>Pots grow fast</strong> because pot-limit raises compound on every street.</li>
</ul>

<h2>Omaha at a home game</h2>
<p>Deal four cards each, so a full deck supports up to 10 players with room for burn cards. Pot-limit maths is the part people get wrong. With ${CTA_LINK}, the pot is always an exact number on every phone, which makes "pot" one easy look.</p>
`,
    faq: [
      ['How many cards do you get in Omaha?', 'Four hole cards each, plus five community cards shared by all players.'],
      ['Do you have to use two cards in Omaha?', 'Yes. Your final hand must use exactly two of your four hole cards and exactly three of the five board cards.'],
      ['Can you have a flush with one suited card in Omaha?', 'No. You need two hole cards of the suit, plus three of that suit on the board.'],
      ['How do you calculate a pot-size raise?', 'Add the amount you need to call to the pot, then raise by that total. Facing a 50 bet into 100, the maximum total bet is 250.'],
    ],
  },

  {
    slug: 'how-to-deal-poker',
    title: 'How to Deal Poker: Shuffle, Burn and Deal',
    description:
      "How to deal poker at a home game: shuffling and cutting, dealing hole cards, burning before the flop, turn and river, and fixing common dealing mistakes.",
    h1: 'How to deal poker',
    lede:
      'Shuffle well, have the player on your right cut, then deal one card at a time clockwise starting with the player on your left. Burn one card face down before the flop, the turn and the river. Keep the deck low and the cards flat so nothing is exposed.',
    related: ['texas-holdem-rules', 'home-poker-house-rules', 'how-to-host-a-poker-night'],
    howto: {
      name: "How to deal a hand of Texas Hold'em",
      steps: [
        ['Shuffle', 'Riffle shuffle the deck several times, about seven, then square it.'],
        ['Cut', 'Offer the deck to the player on your right to cut.'],
        ['Deal hole cards', 'Starting left of the button, deal one card at a time clockwise until everyone has two.'],
        ['Burn and flop', 'After pre-flop betting, burn one card face down and deal three cards face up.'],
        ['Burn and turn', 'After flop betting, burn one card and deal the fourth community card.'],
        ['Burn and river', 'After turn betting, burn one card and deal the fifth community card.'],
      ],
    },
    body: `
<h2>Before the deal</h2>
<ul>
  <li><strong>Know whose deal it is.</strong> In a home game the deal rotates: the player with the dealer button deals, and the button moves one seat left after each hand.</li>
  <li><strong>Check the blinds are in.</strong> The small blind and big blind post before any cards come out.</li>
  <li><strong>Use two decks</strong> with different backs if you can: one is shuffled while the other is dealt.</li>
</ul>

<h2>Shuffling and cutting</h2>
<p>A riffle shuffle splits the deck in two and interleaves the halves. Mathematicians Dave Bayer and Persi Diaconis showed in 1992 that about <strong>seven riffle shuffles</strong> are needed to mix a 52-card deck well; fewer leave noticeable order. A common home routine: riffle, riffle, strip (pull packets off the top), riffle, then cut.</p>
<p>After shuffling, offer the deck to the player on your right to cut, or cut it yourself onto a cut card. Keep the bottom card hidden.</p>

<h2>Dealing the hole cards</h2>
<ol>
  <li>Start with the player directly to your left (the small blind).</li>
  <li>Deal one card at a time, face down, clockwise around the table, ending with yourself.</li>
  <li>Go round a second time so everyone has two cards (four for <a href="/guides/omaha-poker-rules">Omaha</a>).</li>
  <li>Pitch the cards low and flat across the table so they do not flip over.</li>
</ol>

<h2>Burn and turn</h2>
<p>Before each set of community cards, discard the top card face down: the <strong>burn card</strong>. It protects against anyone having seen or marked the top card.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Street</th><th>Burn</th><th>Then deal</th></tr></thead>
  <tbody>
    <tr><td>Flop</td><td>1 card</td><td>3 cards face up</td></tr>
    <tr><td>Turn</td><td>1 card</td><td>1 card face up</td></tr>
    <tr><td>River</td><td>1 card</td><td>1 card face up</td></tr>
  </tbody>
</table></div>
<p>Only deal the next street when the betting round is complete.</p>

<h2>Dealing mistakes and how to fix them</h2>
<ul>
  <li><strong>The first or second card is exposed:</strong> misdeal; reshuffle and deal again.</li>
  <li><strong>A card is exposed later in the deal:</strong> finish dealing, replace the exposed card with the next card, and use the exposed card as the burn card.</li>
  <li><strong>A player has the wrong number of cards:</strong> misdeal, if no significant action has taken place.</li>
  <li><strong>The flop came out before betting finished:</strong> put the flop cards back into the deck, reshuffle the remaining stub, and deal a new flop without a new burn.</li>
</ul>
<p>Agree these before the night starts; our <a href="/guides/home-poker-house-rules">house rules</a> list includes them.</p>

<h2>The dealer also runs the action</h2>
<p>In a home game the dealer usually also keeps the game moving: says whose turn it is, makes sure bets are complete, and pushes the pot to the winner. With ${CTA_LINK}, the pot is pushed with one tap by the winner, and every phone shows the stacks, so the dealer only has to deal.</p>
`,
    faq: [
      ['Who deals first in poker?', 'Any agreed method, such as everyone drawing a card with the highest card taking the button. After that, the deal moves one seat left each hand.'],
      ['How many times should you shuffle a deck for poker?', 'About seven riffle shuffles, the number Bayer and Diaconis found is needed to mix a 52-card deck well.'],
      ['Why do you burn a card in poker?', 'To protect against anyone having seen or marked the top card of the deck.'],
      ['What happens if the dealer exposes a card?', 'If it is the first or second card of the deal, it is a misdeal. Later, the exposed card is replaced and becomes the burn card.'],
    ],
  },
];
