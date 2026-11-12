// Content for the /guides/ pages on easypoker.cc. `node guides/build.mjs` renders these
// into public/guides/*.html and public/sitemap.xml (test/guides.test.js fails if the
// rendered files are stale). Each page targets one search intent; keep them distinct,
// factual about what EasyPoker does, and useful on their own.

export const UPDATED = '2026-11-12';

const CTA_LINK = '<a href="/">EasyPoker</a>';

export const pages = [
  {
    slug: 'virtual-poker-chips',
    title: 'Virtual Poker Chips: Free Digital Chips for Home Games',
    description:
      'Use virtual poker chips on your phones instead of a chip set. Free, no app or sign-up: host a table in the browser and everyone bets from their own phone.',
    h1: 'Virtual poker chips for your home game',
    lede:
      'Real cards on the table, chips on every phone. Virtual poker chips keep exact stacks, a live pot and the blinds for you, so nobody counts, nobody makes change and nobody argues about who owes what.',
    related: ['poker-chip-app', 'poker-without-chips', 'poker-chip-calculator'],
    body: `
<h2>What are virtual poker chips?</h2>
<p>Virtual poker chips (also called digital poker chips) replace the physical chip set in a live poker game. You still deal real cards and play at a real table. The only thing that moves to the phones is the money: each player sees their own stack, taps to bet, and the pot updates on every phone at the same moment.</p>
<p>They are not play money for an online poker site, and nothing is bought or sold. They are a scoreboard for the chips you would otherwise push across the felt.</p>

<h2>How virtual chips work at EasyPoker</h2>
<ol>
  <li><strong>The host creates a table</strong> at ${CTA_LINK} and picks the starting stack and the blinds (for example 1,000 chips with 5/10 blinds).</li>
  <li><strong>Everyone joins</strong> by scanning the QR code on the host's screen or opening the shared link, then types a name. No app to install, no account.</li>
  <li><strong>Players bet from their own phone.</strong> Pick an amount, tap <em>Bet</em>, and the chips leave your stack and land in the pot.</li>
  <li><strong>The winner taps <em>Take whole pot</em></strong> (or takes part of it for a split pot). Every phone shows the new stacks instantly.</li>
</ol>
<p>Every action is saved the moment it happens. If a phone dies or someone closes the tab, they open the link again and their stack is exactly where they left it.</p>

<h2>Virtual chips vs. a physical chip set</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th></th><th>Physical chips</th><th>Virtual chips</th></tr></thead>
  <tbody>
    <tr><th scope="row">Cost</th><td>A decent 300 to 500 chip set costs real money</td><td>Free</td></tr>
    <tr><th scope="row">Setup</th><td>Count and hand out stacks by colour</td><td>Under a minute: share one link</td></tr>
    <tr><th scope="row">Making change</th><td>Constant, and slows every hand</td><td>Never: bet any exact amount</td></tr>
    <tr><th scope="row">Counting the pot</th><td>By eye, with mistakes</td><td>Always exact, on every phone</td></tr>
    <tr><th scope="row">Mistakes</th><td>Hard to prove, hard to undo</td><td>Host can fix any stack or rewind</td></tr>
    <tr><th scope="row">Travel</th><td>Heavy case, chips go missing</td><td>Nothing to carry</td></tr>
    <tr><th scope="row">Feel</th><td>The clack of chips is great</td><td>You lose the shuffle and the stacking</td></tr>
  </tbody>
</table></div>
<p>Physical chips still win on feel. Virtual chips win on everything that slows a home game down.</p>

<h2>When digital chips make the most sense</h2>
<ul>
  <li><strong>You do not own a chip set</strong>, or it is at someone else's house.</li>
  <li><strong>You are travelling</strong>: holidays, cabins, camping, a hotel room. A deck of cards fits in a pocket; a chip case does not.</li>
  <li><strong>The group is big.</strong> Eight or nine players drain a 300-chip set fast, and colours run out.</li>
  <li><strong>You keep losing track</strong> of rebuys, side bets or who put what in the pot.</li>
  <li><strong>New players are at the table.</strong> Nobody needs to learn what a green chip is worth.</li>
</ul>

<h2>What virtual chips do not do</h2>
<p>EasyPoker does not deal cards and does not handle real money. Deal a normal deck at the table, and settle any real stakes between yourselves at the end of the night if your group plays for them. The app only tracks the chips.</p>
`,
    faq: [
      ['Are virtual poker chips free?', 'Yes. Creating a table and joining one is free, with no account and no app download.'],
      ['Do all players need the app?', 'No. Everyone plays in their phone browser by opening the table link or scanning the QR code.'],
      ['What happens if my phone battery dies?', 'Every action is saved on the server as it happens. Open the link again on any device, enter the same name, and your stack is still there.'],
      ['Can the host correct a mistake?', 'Yes. The host can set any player\'s stack, set the pot, change the blinds, remove a player, or restore the table to any earlier moment.'],
      ['How many players can join?', 'A normal home game of two to ten players works well. Each player only needs a phone with a browser.'],
    ],
  },

  {
    slug: 'poker-chip-app',
    title: 'Poker Chip App: Track Chips on Every Phone, No Download',
    description:
      'A free poker chip app that runs in the browser. Track every stack, the pot and the blinds on each player\'s phone. No download, no sign-up.',
    h1: 'A poker chip app that runs in the browser',
    lede:
      'Most poker chip apps make every player download something. EasyPoker runs in the browser: the host opens a table, everyone else scans a QR code, and the chips live on each player\'s own phone.',
    related: ['virtual-poker-chips', 'poker-chip-calculator', 'home-poker-blind-structure'],
    body: `
<h2>What a good poker chip app needs to do</h2>
<p>A poker chip app (sometimes called a poker chip tracker) replaces the chip set in a live game. After many home games, this is the list that matters:</p>
<ul class="ep-checks">
  <li><strong>One stack per phone.</strong> Each player controls their own chips. A single shared tablet that everyone has to reach for is slower than real chips.</li>
  <li><strong>A pot everyone can see.</strong> Bets show up on every screen at once, so nobody asks "what's the pot?"</li>
  <li><strong>Blinds built in.</strong> The current small and big blind are always visible, and the host can raise them between levels.</li>
  <li><strong>Mistakes are fixable.</strong> Someone will tap the wrong amount. The host needs to correct a stack or undo the last few moves without restarting.</li>
  <li><strong>Nothing gets lost.</strong> A dead battery, a closed tab or a dropped Wi-Fi connection must not wipe anyone's chips.</li>
  <li><strong>Zero setup for guests.</strong> If joining takes more than a minute, people go back to counting coins.</li>
</ul>

<h2>How EasyPoker covers each one</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Need</th><th>EasyPoker</th></tr></thead>
  <tbody>
    <tr><td>One stack per phone</td><td>Every player joins from their own phone browser</td></tr>
    <tr><td>Shared pot</td><td>Live on every screen; updates the moment anyone bets</td></tr>
    <tr><td>Blinds</td><td>Set at table creation, changeable by the host any time</td></tr>
    <tr><td>Fixing mistakes</td><td>Host can set any stack or the pot, or restore any earlier moment</td></tr>
    <tr><td>Not losing chips</td><td>Every action is saved on the server; rejoin with the same name</td></tr>
    <tr><td>Fast joining</td><td>QR code or link, then type a name</td></tr>
    <tr><td>Buy-ins</td><td>Optional: the host can allow re-buys of a set amount</td></tr>
  </tbody>
</table></div>

<h2>Poker chip app, tracker or counter: what's the difference?</h2>
<p>People search for all three, and they usually mean slightly different things:</p>
<ul>
  <li><strong>Poker chip app</strong>: replaces chips completely. Every player bets on a phone. This is what EasyPoker is.</li>
  <li><strong>Poker chip tracker</strong>: one person records stacks or buy-ins while the group still uses physical chips. Useful for cash games, but someone has to keep typing.</li>
  <li><strong>Poker chip counter</strong>: works out what a pile of chips is worth, or how to split a chip set between players. Our <a href="/guides/poker-chip-calculator">poker chip calculator</a> does both, if you are sticking with physical chips.</li>
</ul>

<h2>Why a browser app instead of an app store download?</h2>
<p>At a home game, the slowest part of any app is getting everyone to install it. Somebody is on iPhone, somebody is on Android, somebody's storage is full, somebody does not want another account. A browser table avoids all of that: one link, and every phone is in.</p>
<p>The host also does not need to stay on one device. The host link can be copied to a laptop or another phone, which helps if the host's own battery is running low.</p>

<h2>Set up a game in about a minute</h2>
<ol>
  <li>Open ${CTA_LINK}, type your name, choose starting chips and blinds, and tap <em>Create table</em>.</li>
  <li>Put your phone in the middle of the table with the QR code showing.</li>
  <li>Everyone scans, types a name, and sees their starting stack.</li>
  <li>Deal.</li>
</ol>
`,
    faq: [
      ['Is there a poker chip app for both iPhone and Android?', 'EasyPoker runs in any modern phone browser, so iPhone and Android players can sit at the same table. Nothing needs to be installed.'],
      ['Does the poker chip app work without internet?', 'The browser version needs a connection, because the stacks sync through the server. Mobile data is enough; each action is a tiny message.'],
      ['Can I track buy-ins and re-buys?', 'Yes. The host can allow buy-ins of a fixed amount when creating the table, and can also set any player\'s stack directly.'],
      ['Does it deal cards?', 'No. It is a chip app: deal a normal deck at the table.'],
      ['Is it really free?', 'Yes, with no account and no ads in the game.'],
    ],
  },

  {
    slug: 'poker-chip-calculator',
    title: 'Poker Chip Calculator: Chip Values & Chips per Player',
    description:
      'Free poker chip calculator: work out chip values and how many chips of each colour to give every player, or count what a stack is worth.',
    h1: 'Poker chip calculator',
    lede:
      'Split a chip set fairly between players, pick sensible chip values for your blinds, or count up what a stack is worth. Everything runs in your browser.',
    related: ['home-poker-blind-structure', 'virtual-poker-chips', 'poker-chip-app'],
    script: '/js/chip-calculator.js',
    body: `
<section class="ep-tool" aria-labelledby="dist-title">
  <h2 id="dist-title">Chip distribution calculator</h2>
  <p class="ep-tool-intro">How many chips of each colour should every player start with?</p>
  <div class="ep-tool-grid">
    <label class="ep-field"><span class="ep-field-label">Players</span><input id="calc-players" class="ep-input" type="number" min="2" max="20" value="6" inputmode="numeric"></label>
    <label class="ep-field"><span class="ep-field-label">Starting stack (chips)</span><input id="calc-stack" class="ep-input" type="number" min="1" value="1000" inputmode="numeric"></label>
    <label class="ep-field"><span class="ep-field-label">Small blind</span><input id="calc-sb" class="ep-input" type="number" min="1" value="5" inputmode="numeric"></label>
    <label class="ep-field"><span class="ep-field-label">Chip colours</span>
      <select id="calc-colors" class="ep-select"><option>3</option><option selected>4</option><option>5</option></select></label>
  </div>
  <div id="calc-result" class="ep-tool-result" aria-live="polite"></div>
</section>

<section class="ep-tool" aria-labelledby="count-title">
  <h2 id="count-title">Poker chip counter</h2>
  <p class="ep-tool-intro">Type how many chips of each value you have; the total updates as you type.</p>
  <div id="count-rows" class="ep-tool-grid"></div>
  <p class="ep-tool-total">Total: <strong id="count-total">0</strong></p>
</section>

<h2>Standard poker chip colours and values</h2>
<p>There is no official rule, but most home sets and many casinos in the US follow this pattern. If your set has different colours, keep the order: lighter colours for smaller values.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Colour</th><th>Common value</th><th>Used for</th></tr></thead>
  <tbody>
    <tr><td><span class="ep-dot" style="--c:#f4f1e8"></span>White</td><td>1</td><td>Small blinds in low-stakes games</td></tr>
    <tr><td><span class="ep-dot" style="--c:#e94560"></span>Red</td><td>5</td><td>Blinds and small bets</td></tr>
    <tr><td><span class="ep-dot" style="--c:#1f9d5a"></span>Green</td><td>25</td><td>Standard bets and raises</td></tr>
    <tr><td><span class="ep-dot" style="--c:#2b2b2b"></span>Black</td><td>100</td><td>Bigger bets, later levels</td></tr>
    <tr><td><span class="ep-dot" style="--c:#8e44ad"></span>Purple</td><td>500</td><td>Tournaments with deep stacks</td></tr>
    <tr><td><span class="ep-dot" style="--c:#f1c40f"></span>Yellow</td><td>1,000</td><td>Late tournament levels</td></tr>
  </tbody>
</table></div>

<h2>How many chips per player?</h2>
<p>A comfortable starting stack is <strong>50 to 100 big blinds</strong>. With 5/10 blinds that is 500 to 1,000 chips in value. Shorter stacks make the game faster and more all-in; deeper stacks give more room to play.</p>
<p>In physical chips, each player needs about <strong>20 to 50 chips</strong>, enough small ones to post blinds and make change. That is why chip sets come in these sizes:</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Chip set</th><th>Comfortable for</th></tr></thead>
  <tbody>
    <tr><td>300 chips</td><td>4 to 6 players</td></tr>
    <tr><td>500 chips</td><td>6 to 8 players</td></tr>
    <tr><td>750 to 1,000 chips</td><td>8 to 10 players, or tournaments with re-buys</td></tr>
  </tbody>
</table></div>

<h2>Tips for choosing chip values</h2>
<ul>
  <li><strong>Make the smallest chip equal the small blind.</strong> Anything smaller is never used; anything bigger forces change on every hand.</li>
  <li><strong>Keep each colour 4 to 5 times the one below</strong> (5, 25, 100, 500). Fewer colours with big jumps cause change problems; tiny jumps waste colours.</li>
  <li><strong>Give more small chips than you think.</strong> Running out of small chips is the most common home-game slowdown.</li>
  <li><strong>Colour up as blinds rise.</strong> In a tournament, swap the smallest chips for bigger ones once the small blind outgrows them.</li>
</ul>

<h2>Skip the counting entirely</h2>
<p>If the maths above is the part of poker night you dread, use virtual chips instead. With ${CTA_LINK}, every player's stack is an exact number on their own phone: no colours, no change, no counting at the end. <a href="/guides/virtual-poker-chips">How virtual poker chips work</a>.</p>
`,
    faq: [
      ['How many poker chips do I need for 6 players?', 'About 300 chips is enough for six players at a cash game, which gives each player roughly 50 chips. For a tournament with re-buys, 500 is more comfortable.'],
      ['What should the starting stack be in a home game?', 'Between 50 and 100 big blinds. With 5/10 blinds, a 1,000-chip starting stack is a common choice.'],
      ['What are the standard poker chip colour values?', 'A common convention is white 1, red 5, green 25, black 100, purple 500 and yellow 1,000. Home sets vary, so agree on values before the first hand.'],
      ['How do I count a stack of poker chips quickly?', 'Count each colour in stacks of 20, multiply by the chip value, and add the colours together. The chip counter on this page does the multiplication for you.'],
    ],
  },

  {
    slug: 'poker-without-chips',
    title: 'How to Play Poker Without Chips: 7 Options That Work',
    description:
      'No poker chips? Seven ways to play anyway: a free phone chip app, pen and paper, coins, a second deck of cards and more, with the pros and cons of each.',
    h1: 'How to play poker without chips',
    lede:
      'You have a deck of cards and a group of friends, but no chip set. Here are seven ways to keep score, from the fastest to the most improvised.',
    related: ['virtual-poker-chips', 'poker-chip-calculator', 'home-poker-blind-structure'],
    body: `
<h2>1. Use your phones as chips</h2>
<p>The quickest fix, because everyone already has a phone. With ${CTA_LINK}, one person creates a table in the browser and shows a QR code. Everyone else scans it, types a name and gets a starting stack. Bets go into a pot that every phone can see, and the winner taps to collect it.</p>
<ul class="ep-pros">
  <li>Exact stacks, no counting, no change</li>
  <li>Free, no app download, no sign-up</li>
  <li>Survives dead batteries and closed tabs; the host can fix mistakes</li>
</ul>
<ul class="ep-cons">
  <li>Needs a phone with a browser and some signal for each player</li>
</ul>

<h2>2. Pen and paper ledger</h2>
<p>Make a column for each player on a sheet of paper and give everyone the same starting number. One person acts as banker and writes down every bet and every pot. It works, but it is slow: each hand needs several lines of arithmetic, and one mistake throws off every number below it.</p>
<p><strong>Tip:</strong> only update the sheet at the end of each hand. Players announce bets out loud during the hand, and the banker writes the final pot result.</p>

<h2>3. Coins</h2>
<p>Raid the coin jar. Use the coin's face value or agree your own values (for example, small coins are 1, large coins are 5). Coins stack and clack like chips, which keeps the feel of the game. The downside: you need a lot of them, and everyone has to remember what each coin is worth.</p>

<h2>4. A second deck of cards</h2>
<p>Deal a second deck as currency: number cards are worth 1, face cards 5, aces 10, or whatever values you agree. It is surprisingly playable for small groups. Keep the second deck visibly different (another back colour) so it never gets mixed into the deck in play.</p>

<h2>5. Small objects: matches, sweets, beans, pasta</h2>
<p>Anything small and countable works: matchsticks, dried beans, pasta shapes, wrapped sweets. Use two or three different objects for different values. It is fun for a casual game and terrible for a serious one, because the objects get lost, eaten or knocked over.</p>

<h2>6. Board game money</h2>
<p>Paper money from a board game has printed values, which helps. It is fiddly to handle, though: notes blow away, stick together and are hard to count at a glance.</p>

<h2>7. Paper chips</h2>
<p>Cut squares of paper or card and write a value on each, or use coloured sticky notes for different values. It takes ten minutes of preparation and gives you something closer to real chips than coins or beans.</p>

<h2>Which option should you choose?</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Option</th><th>Setup time</th><th>Accuracy</th><th>Best for</th></tr></thead>
  <tbody>
    <tr><td>Phones (EasyPoker)</td><td>1 minute</td><td>Exact</td><td>Any game, any size</td></tr>
    <tr><td>Pen and paper</td><td>2 minutes</td><td>Error-prone</td><td>2 to 4 players, few hands</td></tr>
    <tr><td>Coins</td><td>5 minutes</td><td>Good</td><td>Casual games</td></tr>
    <tr><td>Second deck</td><td>2 minutes</td><td>Good</td><td>Small groups</td></tr>
    <tr><td>Small objects</td><td>5 minutes</td><td>Fair</td><td>Very casual games</td></tr>
    <tr><td>Board game money</td><td>5 minutes</td><td>Fair</td><td>If you have it nearby</td></tr>
    <tr><td>Paper chips</td><td>10+ minutes</td><td>Good</td><td>Planned game nights</td></tr>
  </tbody>
</table></div>
<p>If everyone has a phone, start with the phones: it is the only option that is both fast to set up and exact. If you want the feel of chips in your hand, coins or paper chips are the best stand-ins.</p>
`,
    faq: [
      ['Can you play poker without chips?', 'Yes. Chips only track who has what. You can use phones, a written ledger, coins, a second deck of cards or any small objects instead.'],
      ['What can I use instead of poker chips?', 'The most practical replacement is a phone chip app, since everyone has a phone. Coins, a second deck of cards, paper chips and a pen-and-paper ledger also work.'],
      ['How do you play poker with friends without chips?', 'Give everyone the same starting amount, agree on the blinds, and keep score with one of the methods above. With EasyPoker, the stacks and pot are tracked on each phone automatically.'],
      ['Is pen and paper good enough for poker?', 'For a few hands with two to four players, yes. For a full evening it gets slow, and one arithmetic mistake affects every number after it.'],
    ],
  },

  {
    slug: 'online-poker-chips',
    title: 'Online Poker Chips for Home Games With Friends',
    description:
      'Online poker chips that sync between your friends\' phones: free, no download. Track stacks, pot and blinds online while you play with real cards.',
    h1: 'Online poker chips for playing with friends',
    lede:
      'Your cards stay real; the chips go online. Each friend\'s stack lives on the internet and shows on their phone, so the pot is always right and nobody loses chips between hands or between nights.',
    related: ['virtual-poker-chips', 'poker-chip-app', 'poker-without-chips'],
    body: `
<h2>Two very different things called "online poker chips"</h2>
<p>When people search for online poker chips they usually mean one of two things:</p>
<ul>
  <li><strong>Play-money chips on poker sites and social casino games.</strong> These are a site's own currency for its online card tables. EasyPoker has nothing to do with those, and does not sell chips of any kind.</li>
  <li><strong>Chips for a real game with friends, kept online.</strong> You play with a physical deck, and an online table keeps everyone's stack in sync on their phones. This page is about that.</li>
</ul>

<h2>Why keep your chips online?</h2>
<ul>
  <li><strong>Every phone shows the same numbers.</strong> A bet on one phone shows up on all the others at once.</li>
  <li><strong>Nothing is lost.</strong> Each action is saved on the server as it happens. A phone can die, a tab can close, Wi-Fi can drop: reopen the link and the stack is still there.</li>
  <li><strong>The whole night is on record.</strong> The host can see every move and restore the table to an earlier point if something went wrong.</li>
  <li><strong>No equipment.</strong> A deck of cards and the phones you already carry are enough.</li>
</ul>

<h2>How to start an online chip table</h2>
<ol>
  <li>Open ${CTA_LINK} and choose a starting stack and blinds.</li>
  <li>Share the table link in your group chat, or show the QR code.</li>
  <li>Each friend opens it, types a name and gets their chips.</li>
  <li>Deal a real deck. Bet, call and raise from your phones.</li>
</ol>

<h2>Playing poker with friends who are not in the room</h2>
<p>Because the chips are online, the table link works from anywhere. The tricky part of a remote game is the cards, not the chips: everyone needs private hole cards. EasyPoker only tracks chips and does not deal cards, so for a remote game you need your own way of dealing, and EasyPoker keeps the money side honest. For games around one table, the setup above is all you need.</p>

<h2>What it costs</h2>
<p>Nothing. There is no account, no subscription and no in-game purchase. The chips have no cash value: if your group plays for real stakes, settle up between yourselves at the end of the night.</p>
`,
    faq: [
      ['Can I buy online poker chips here?', 'No. EasyPoker does not sell chips. It tracks chips for a game you play with friends using a real deck of cards.'],
      ['Do online poker chips work on any phone?', 'Yes. EasyPoker runs in the browser on iPhone, Android and laptops, all at the same table.'],
      ['Can friends join from different places?', 'Yes, the table link works from anywhere with an internet connection. EasyPoker does not deal cards, so a remote game needs its own way to deal private hands.'],
      ['Are the chips saved if we stop and continue later?', 'Yes. The table and its full history are kept, so you can come back to the same link later.'],
    ],
  },

  {
    slug: 'home-poker-blind-structure',
    title: 'Home Poker Blind Structure: Levels, Timing & Stacks',
    description:
      'A simple blind structure for home poker games: blind levels, how long each level should last, and starting stacks for cash games and tournaments.',
    h1: 'Home poker blind structure',
    lede:
      'Blinds decide how fast a home game moves. Here is a structure that works for most groups, with levels, timings and starting stacks you can copy tonight.',
    related: ['poker-chip-calculator', 'poker-chip-app', 'virtual-poker-chips'],
    body: `
<h2>What blinds are for</h2>
<p>The small blind and big blind are forced bets that start the pot before any cards are seen. Without them, nobody has a reason to play a hand. In a cash game the blinds usually stay the same all night. In a tournament they go up at fixed intervals, so stacks shrink relative to the blinds and the game eventually ends.</p>

<h2>Recommended blind levels for a 1,000-chip stack</h2>
<p>These levels match the blind options when you create a table on ${CTA_LINK}, and suit a home tournament where everyone starts with 1,000 chips.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Level</th><th>Small blind</th><th>Big blind</th><th>Starting stack in big blinds</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>5</td><td>10</td><td>100</td></tr>
    <tr><td>2</td><td>10</td><td>20</td><td>50</td></tr>
    <tr><td>3</td><td>20</td><td>40</td><td>25</td></tr>
    <tr><td>4</td><td>50</td><td>100</td><td>10</td></tr>
    <tr><td>5</td><td>100</td><td>200</td><td>5</td></tr>
    <tr><td>6</td><td>200</td><td>400</td><td>2.5</td></tr>
    <tr><td>7</td><td>500</td><td>1,000</td><td>1</td></tr>
  </tbody>
</table></div>
<p>For a longer game, start at 1/2 blinds. For a short one, start at 10/20.</p>

<h2>How long should each blind level be?</h2>
<ul>
  <li><strong>15 minutes</strong>: a fast game, about 2 hours with 6 to 8 players.</li>
  <li><strong>20 minutes</strong>: the usual home-game choice, about 2.5 to 3 hours.</li>
  <li><strong>30 minutes</strong>: a slow, deep game for a long evening.</li>
</ul>
<p>Count hands instead of minutes if your group plays slowly: raising the blinds every 10 to 12 hands works well.</p>

<h2>Cash game or tournament?</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th></th><th>Cash game</th><th>Tournament</th></tr></thead>
  <tbody>
    <tr><td>Blinds</td><td>Fixed all night</td><td>Go up every level</td></tr>
    <tr><td>Starting stack</td><td>100 big blinds is standard</td><td>50 to 100 big blinds</td></tr>
    <tr><td>Running out of chips</td><td>Buy in again any time</td><td>You are out (unless re-buys are allowed)</td></tr>
    <tr><td>Ends</td><td>When people want to stop</td><td>When one player has every chip</td></tr>
  </tbody>
</table></div>
<p>EasyPoker supports both: set fixed blinds for a cash game, or have the host raise the blinds between levels. Turn on buy-ins when you create the table if your group allows re-buys.</p>

<h2>Common blind mistakes in home games</h2>
<ul>
  <li><strong>Raising the blinds too fast.</strong> If stacks are under 10 big blinds within an hour, the game turns into an all-in lottery.</li>
  <li><strong>Forgetting to raise them at all.</strong> A tournament with flat blinds can last until 4 a.m. Set a timer.</li>
  <li><strong>Blinds that don't match the chips.</strong> If the small blind is 5, you need 5-value chips. Use the <a href="/guides/poker-chip-calculator">chip calculator</a> to match chip values to your blinds, or use virtual chips and skip the problem.</li>
</ul>
`,
    faq: [
      ['What are good blinds for a home poker game?', 'With a 1,000-chip starting stack, start at 5/10 and raise every 15 to 20 minutes: 10/20, 20/40, 50/100, 100/200 and so on.'],
      ['How often should blinds go up in a home tournament?', 'Every 15 to 20 minutes for most groups, or every 10 to 12 hands if play is slow.'],
      ['What is the big blind usually in relation to the small blind?', 'The big blind is normally twice the small blind, for example 5/10 or 50/100.'],
      ['Can I change the blinds in EasyPoker during a game?', 'Yes. The host can change the blinds at any time from the Host tab.'],
    ],
  },
];

export const hub = {
  slug: '',
  title: 'Home Poker Guides: Chips, Blinds and Game Night',
  description:
    'Guides for running a home poker game: virtual poker chips, chip values and how many chips per player, blind structures, and playing poker without chips.',
  h1: 'Home poker guides',
  lede: 'Everything about the money side of a home game: chips, stacks, blinds and how to keep track of it all.',
};

export const privacy = {
  title: 'Privacy | EasyPoker',
  description: 'What EasyPoker stores when you host or join a poker table, and what it does not.',
  h1: 'Privacy',
  body: `
<p>EasyPoker has no accounts, no ads and no analytics or tracking scripts. This page lists everything the site does keep.</p>
<h2>What is stored about a table</h2>
<ul>
  <li><strong>The table itself</strong>: its code, starting chips, blinds and buy-in settings.</li>
  <li><strong>Player names</strong> exactly as typed when joining. Use a nickname if you prefer.</li>
  <li><strong>Every action at the table</strong> (bets, pots taken, host corrections), each with a timestamp, so stacks survive a closed tab and the host can restore an earlier moment. This history is kept and is not deleted.</li>
</ul>
<h2>What is stored in your browser</h2>
<p>Your browser's own storage remembers the name you last used and, for the host, a secret host key for each table you created. It never leaves your device except when you use the host features of that table. No cookies are set.</p>
<h2>Third parties</h2>
<ul>
  <li><strong>Cloudflare</strong> hosts the site and the tables and, like any web host, sees standard request information such as IP addresses.</li>
  <li><strong>Google Fonts</strong> serves the typefaces, so your browser requests them from Google.</li>
</ul>
<h2>Money</h2>
<p>EasyPoker only tracks chip counts. It does not handle payments or real money of any kind.</p>
`,
};
