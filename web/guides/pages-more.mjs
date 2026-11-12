// More /guides/ pages: the questions people ask an AI assistant (or a search engine)
// around a home poker game. Each answers its question in the first paragraph, then
// goes deeper. Facts about EasyPoker must match the code (web/src/game.js, room.js):
// up to 30 players, blind presets 1/2 to 1,000/2,000, bet / take part of the pot /
// take whole pot, optional fixed buy-ins, host corrections and restore. There are no
// automatic side pots and no settle-up of real money.

const CTA_LINK = '<a href="/">EasyPoker</a>';

export const more = [
  {
    slug: 'poker-hand-rankings',
    title: 'Poker Hand Rankings: Best to Worst, With Odds',
    description:
      'All ten poker hands ranked from royal flush to high card, with examples, how often each is dealt in five cards, and how ties and kickers are decided.',
    h1: 'Poker hand rankings, from best to worst',
    lede:
      'A royal flush beats everything; high card beats nothing. In between are eight more hands, and the rarer a hand is, the higher it ranks. Here is the full order with an example of each, how often it is dealt, and how ties are broken.',
    related: ['texas-holdem-rules', 'poker-terms-glossary', 'home-poker-house-rules'],
    body: `
<h2>The ten poker hands in order</h2>
<p>From strongest to weakest. The odds are for being dealt that exact hand in five cards from a 52-card deck, out of 2,598,960 possible hands (exact counts, as computed by mathematician Brian Alspach in his <a href="http://people.math.sfu.ca/~alspach/computations" rel="noopener">poker computations</a>).</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Rank</th><th>Hand</th><th>Example</th><th>Ways to make it</th><th>Chance in 5 cards</th></tr></thead>
  <tbody>
    <tr><td>1</td><td><strong>Royal flush</strong></td><td>A♠ K♠ Q♠ J♠ 10♠</td><td>4</td><td>0.00015%</td></tr>
    <tr><td>2</td><td><strong>Straight flush</strong></td><td>9♥ 8♥ 7♥ 6♥ 5♥</td><td>36</td><td>0.0014%</td></tr>
    <tr><td>3</td><td><strong>Four of a kind</strong></td><td>Q♣ Q♦ Q♥ Q♠ 7♦</td><td>624</td><td>0.024%</td></tr>
    <tr><td>4</td><td><strong>Full house</strong></td><td>J♠ J♥ J♦ 4♣ 4♠</td><td>3,744</td><td>0.14%</td></tr>
    <tr><td>5</td><td><strong>Flush</strong></td><td>K♦ 10♦ 8♦ 6♦ 3♦</td><td>5,108</td><td>0.20%</td></tr>
    <tr><td>6</td><td><strong>Straight</strong></td><td>8♣ 7♦ 6♠ 5♥ 4♣</td><td>10,200</td><td>0.39%</td></tr>
    <tr><td>7</td><td><strong>Three of a kind</strong></td><td>7♠ 7♥ 7♣ K♦ 2♠</td><td>54,912</td><td>2.1%</td></tr>
    <tr><td>8</td><td><strong>Two pair</strong></td><td>A♣ A♦ 9♠ 9♥ 5♣</td><td>123,552</td><td>4.8%</td></tr>
    <tr><td>9</td><td><strong>One pair</strong></td><td>10♥ 10♠ K♣ 6♦ 2♥</td><td>1,098,240</td><td>42.3%</td></tr>
    <tr><td>10</td><td><strong>High card</strong></td><td>A♦ J♣ 8♠ 5♥ 3♦</td><td>1,302,540</td><td>50.1%</td></tr>
  </tbody>
</table></div>
<p>In Texas Hold'em you make the best five-card hand from seven cards (your two plus five on the board), so every hand above high card turns up far more often than these five-card figures suggest.</p>

<h2>What each hand means</h2>
<ul>
  <li><strong>Royal flush</strong>: ace, king, queen, jack and ten of the same suit. The best possible hand.</li>
  <li><strong>Straight flush</strong>: five cards in a row, all one suit. A higher top card wins.</li>
  <li><strong>Four of a kind</strong> (quads): four cards of the same rank.</li>
  <li><strong>Full house</strong>: three of one rank plus a pair of another. The three cards decide which full house is higher.</li>
  <li><strong>Flush</strong>: any five cards of one suit. Compare the highest card, then the next, and so on.</li>
  <li><strong>Straight</strong>: five cards in a row of mixed suits. An ace can be high (A-K-Q-J-10) or low (5-4-3-2-A, "the wheel"), but a straight cannot wrap around (Q-K-A-2-3 is not a straight).</li>
  <li><strong>Three of a kind</strong> (trips or a set): three cards of the same rank.</li>
  <li><strong>Two pair</strong>: two different pairs. The higher pair decides, then the lower pair, then the fifth card.</li>
  <li><strong>One pair</strong>: two cards of the same rank.</li>
  <li><strong>High card</strong>: none of the above; the highest card plays.</li>
</ul>

<h2>How ties are broken</h2>
<p>When two players have the same kind of hand, compare the cards that make the hand first, then the leftover cards (the <em>kickers</em>), from highest to lowest. Only five cards ever count.</p>
<ul>
  <li>Pair of kings with an ace kicker beats pair of kings with a queen kicker.</li>
  <li>If all five cards match in rank, the pot is split equally. <strong>Suits never break a tie</strong> in standard poker.</li>
  <li>In Hold'em, if the board itself is the best hand for everyone ("playing the board"), everyone still in the hand splits the pot.</li>
</ul>
<p>Splitting a pot is easy with ${CTA_LINK}: each winner taps <em>Take</em> for their share of the pot instead of taking the whole thing.</p>

<h2>Five hands people get wrong</h2>
<ol>
  <li><strong>A flush beats a straight.</strong> Flushes are rarer.</li>
  <li><strong>A full house beats a flush.</strong></li>
  <li><strong>Two pair of aces and twos loses to two pair of kings and queens?</strong> No: the highest pair decides first, so aces-up wins.</li>
  <li><strong>"Three pair" does not exist.</strong> With seven cards, only the best two pairs count.</li>
  <li><strong>The cards speak.</strong> At showdown, a hand is worth what it is, even if the player calls it wrong.</li>
</ol>
`,
    faq: [
      ['What is the order of poker hands from best to worst?', 'Royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card.'],
      ['Does a flush beat a straight?', 'Yes. A flush beats a straight because it is rarer: 5,108 five-card flushes against 10,200 straights.'],
      ['Does a full house beat a flush?', 'Yes. A full house ranks above a flush and below four of a kind.'],
      ['Which suit is highest in poker?', 'None. In standard poker all suits are equal; two hands that match in rank split the pot.'],
      ['Is ace high or low in poker?', 'Both. An ace is the highest card, but it can also be the low end of a straight: 5-4-3-2-A.'],
      ['What are the odds of a royal flush?', 'In five cards, 4 in 2,598,960, or about 1 in 649,740.'],
    ],
  },

  {
    slug: 'texas-holdem-rules',
    title: "Texas Hold'em Rules: How to Play, Step by Step",
    description:
      "Texas Hold'em rules for a home game: blinds, the four betting rounds, what check, call, raise and fold mean, the showdown, and minimum raise sizes.",
    h1: "Texas Hold'em rules for a home game",
    lede:
      "Each player gets two private cards, five shared cards are dealt face up in three stages, and there are four rounds of betting. The best five-card hand at the end, or the last player who has not folded, wins the pot.",
    related: ['poker-hand-rankings', 'home-poker-blind-structure', 'home-poker-house-rules'],
    howto: {
      name: "How to play a hand of Texas Hold'em",
      steps: [
        ['Post the blinds', 'The two players to the left of the dealer button put in the small blind and the big blind.'],
        ['Deal hole cards and bet pre-flop', 'Everyone gets two cards face down. Betting starts with the player left of the big blind.'],
        ['Deal the flop and bet', 'Burn one card, deal three community cards face up, then bet starting left of the button.'],
        ['Deal the turn and bet', 'Burn one card and deal a fourth community card, then bet again.'],
        ['Deal the river and bet', 'Burn one card and deal the fifth community card, then the last betting round.'],
        ['Showdown', 'Remaining players show their cards; the best five-card hand wins the pot.'],
      ],
    },
    body: `
<h2>What you need</h2>
<ul>
  <li>A standard 52-card deck, no jokers.</li>
  <li>2 to 10 players (6 to 9 is ideal).</li>
  <li>Chips, or a phone each: ${CTA_LINK} keeps every stack and the pot on the players' phones.</li>
  <li>A dealer button: any object that marks who deals. It moves one seat left after every hand.</li>
</ul>

<h2>One hand, step by step</h2>
<ol>
  <li><strong>Blinds.</strong> The player left of the button posts the small blind; the next player posts the big blind (normally twice the small blind, e.g. 10/20). Blinds are bets made before seeing cards, so every pot has something to win.</li>
  <li><strong>Hole cards and pre-flop betting.</strong> Everyone gets two cards face down. The player left of the big blind acts first and must call the big blind, raise or fold. Action goes clockwise; the big blind acts last and may check if nobody raised.</li>
  <li><strong>The flop.</strong> The dealer burns (discards) one card and deals three community cards face up. Betting starts with the first active player left of the button.</li>
  <li><strong>The turn.</strong> Burn one, deal a fourth community card, another betting round.</li>
  <li><strong>The river.</strong> Burn one, deal the fifth and final community card, the last betting round.</li>
  <li><strong>Showdown.</strong> Players still in show their cards. Each makes the best five-card hand from their two cards and the five on the board, using any combination (both, one or none of their own). See the <a href="/guides/poker-hand-rankings">hand rankings</a>.</li>
</ol>
<p>If everyone but one player folds at any point, that player wins the pot immediately and does not have to show.</p>

<h2>Your options when it is your turn</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Action</th><th>When you can</th><th>What it does</th></tr></thead>
  <tbody>
    <tr><td><strong>Check</strong></td><td>Nobody has bet this round</td><td>Pass without betting; stay in the hand</td></tr>
    <tr><td><strong>Bet</strong></td><td>Nobody has bet this round</td><td>Put chips in; others must match to stay in</td></tr>
    <tr><td><strong>Call</strong></td><td>Someone has bet</td><td>Match the current bet</td></tr>
    <tr><td><strong>Raise</strong></td><td>Someone has bet</td><td>Match it and add more</td></tr>
    <tr><td><strong>Fold</strong></td><td>Any time it is your turn</td><td>Give up the hand and anything you already put in</td></tr>
    <tr><td><strong>All-in</strong></td><td>Any time</td><td>Bet every chip you have left</td></tr>
  </tbody>
</table></div>
<p>A betting round ends when every remaining player has put in the same amount (or is all-in) and everyone has had a chance to act.</p>

<h2>How much can you bet?</h2>
<ul>
  <li><strong>No-limit</strong> (the usual home game): any amount up to your whole stack. The minimum bet is the big blind.</li>
  <li><strong>Minimum raise</strong>: at least the size of the previous bet or raise. If someone bets 20, a raise must make it at least 40.</li>
  <li><strong>Pot-limit</strong> and <strong>fixed-limit</strong> variants cap the bet at the pot size or a set amount.</li>
</ul>

<h2>Running the chips with phones</h2>
<p>With EasyPoker, everyone's stack is on their own phone. To bet or call, pick the amount and tap <em>Bet</em>: it leaves your stack and joins the pot that every phone shows. Checks and folds need no tap at all. At showdown the winner taps <em>Take whole pot</em>; for a split pot, each winner takes their share. The host changes the blinds between levels from the Host tab.</p>
`,
    faq: [
      ["How many cards do you get in Texas Hold'em?", 'Two private hole cards each, plus five community cards shared by everyone.'],
      ["Who goes first in Texas Hold'em?", 'Before the flop, the player to the left of the big blind. On the flop, turn and river, the first active player to the left of the dealer button.'],
      ["Can you use only the board in Hold'em?", 'Yes. Your best five cards can use both, one or none of your hole cards. If the board is everyone\'s best hand, the pot is split.'],
      ['What is the minimum raise in no-limit poker?', 'A raise must be at least as big as the previous bet or raise in that round. If the bet is 20, the minimum raise is to 40.'],
      ['What happens if everyone checks?', 'The next card is dealt (or, after the river, the hand goes to showdown) without anything added to the pot.'],
    ],
  },

  {
    slug: 'side-pots',
    title: 'Poker Side Pots Explained With a Worked Example',
    description:
      'How side pots work when a player is all-in for less: build the main pot and each side pot step by step, who can win which, and how to pay them out.',
    h1: 'How side pots work in poker',
    lede:
      'A side pot is created when a player goes all-in for less than the others are betting. The all-in player can only win the main pot, which holds what they could match from each player; everything above that goes into a side pot that only the other players can win.',
    related: ['texas-holdem-rules', 'home-poker-house-rules', 'poker-terms-glossary'],
    body: `
<h2>The rule in one sentence</h2>
<p>A player can only win from each opponent as much as they themselves put in. Side pots are simply the bookkeeping for that rule.</p>

<h2>Worked example: three players, one short stack</h2>
<p>Ana has 100 chips, Ben has 300, Cleo has 500. Ana goes all-in for 100, Ben calls and raises to 300 (all-in), Cleo calls 300.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Pot</th><th>How it is built</th><th>Size</th><th>Who can win it</th></tr></thead>
  <tbody>
    <tr><td><strong>Main pot</strong></td><td>100 from each of Ana, Ben, Cleo</td><td>300</td><td>Ana, Ben or Cleo</td></tr>
    <tr><td><strong>Side pot</strong></td><td>The next 200 from each of Ben and Cleo</td><td>400</td><td>Ben or Cleo only</td></tr>
  </tbody>
</table></div>
<p>Cleo bet 300 and keeps her other 200; nothing above 300 goes in because nobody can match it.</p>
<p><strong>At showdown</strong>, compare hands for each pot separately, starting with the side pot:</p>
<ul>
  <li>If Ana has the best hand overall, she wins the main pot (300). The better of Ben and Cleo wins the side pot (400).</li>
  <li>If Ben has the best hand, he wins both pots (700).</li>
  <li>If Cleo beats Ben but loses to Ana: Ana takes 300, Cleo takes 400.</li>
</ul>

<h2>How to build side pots step by step</h2>
<ol>
  <li>Find the smallest all-in amount. Take that much from every player in the hand: that is the main pot.</li>
  <li>From what is left, find the next-smallest all-in amount and take that much from every player who still has chips in: that is side pot 1.</li>
  <li>Repeat until every chip is in a pot. Any amount a single player put in that nobody could match goes back to that player.</li>
  <li>Each pot is won by the best hand among the players who contributed to it.</li>
</ol>

<h2>Two all-ins: a second example</h2>
<p>Four players. Dev is all-in for 50, Eli is all-in for 150, Fay and Gus both bet 400.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Pot</th><th>Calculation</th><th>Size</th><th>Eligible</th></tr></thead>
  <tbody>
    <tr><td>Main pot</td><td>50 × 4</td><td>200</td><td>Dev, Eli, Fay, Gus</td></tr>
    <tr><td>Side pot 1</td><td>(150 − 50) × 3</td><td>300</td><td>Eli, Fay, Gus</td></tr>
    <tr><td>Side pot 2</td><td>(400 − 150) × 2</td><td>500</td><td>Fay, Gus</td></tr>
  </tbody>
</table></div>
<p>Total 1,000, which matches 50 + 150 + 400 + 400. Always check the pots add up to everything that was bet.</p>

<h2>Paying side pots out with EasyPoker</h2>
<p>${CTA_LINK} keeps one pot on the table and does not split it into side pots automatically. Work out the pots as above, then pay them out in order: the winner of each smaller pot taps <em>Take</em> and enters that pot's size, and the last winner taps <em>Take whole pot</em> for whatever is left. If anyone takes the wrong amount, the host can set the pot and the stacks directly, or restore the table to the moment before.</p>
`,
    faq: [
      ['What is a side pot in poker?', 'A separate pot for chips that an all-in player could not match. Only the players who put chips into a side pot can win it.'],
      ['Can an all-in player win more than they bet?', 'They can win the main pot, which holds their own all-in plus the same amount from every caller, but nothing from the side pots.'],
      ['Who wins the side pot if the all-in player has the best hand?', 'The all-in player takes the main pot; the side pot goes to the best hand among the other players who contributed to it.'],
      ['How do you calculate a side pot?', 'Take the smallest all-in amount from every player for the main pot, then repeat with the next all-in amount for each side pot, until all chips are assigned.'],
    ],
  },

  {
    slug: 'how-to-host-a-poker-night',
    title: 'How to Host a Poker Night: Complete Home Game Checklist',
    description:
      'Everything to host a home poker night: what to buy, how many players, buy-ins, blinds, house rules, food, and how to settle up at the end of the night.',
    h1: 'How to host a poker night',
    lede:
      'To host a poker night you need a table, a couple of decks of cards, a way to track chips, an agreed buy-in and blind structure, and a short list of house rules. Sort those out before people arrive and the game runs itself.',
    related: ['home-poker-house-rules', 'home-poker-blind-structure', 'poker-tournament-payouts'],
    howto: {
      name: 'How to host a home poker night',
      steps: [
        ['Pick the format', 'Choose a cash game or a tournament, and the buy-in.'],
        ['Invite players', 'Invite six to nine people and ask them to confirm.'],
        ['Get the gear', 'Two decks of cards, a dealer button, and chips or a phone chip table.'],
        ['Set chips and blinds', 'Choose a starting stack of 50 to 100 big blinds and a blind schedule.'],
        ['Agree house rules', 'Share a short list of house rules before the first hand.'],
        ['Settle up', 'At the end, record final stacks and settle any stakes between players.'],
      ],
    },
    body: `
<h2>1. Choose the format</h2>
<div class="ep-table-wrap"><table>
  <thead><tr><th></th><th>Cash game</th><th>Tournament</th></tr></thead>
  <tbody>
    <tr><td>Best for</td><td>Casual nights, people arriving and leaving</td><td>A fixed start time and a clear winner</td></tr>
    <tr><td>Blinds</td><td>Fixed all night</td><td>Rise every 15 to 20 minutes</td></tr>
    <tr><td>Running out of chips</td><td>Buy in again</td><td>You are out, unless re-buys are allowed</td></tr>
    <tr><td>Length</td><td>As long as you like</td><td>About 2.5 to 3.5 hours for 8 players</td></tr>
  </tbody>
</table></div>
<p>For a first poker night, a tournament is easier to explain and has a natural end.</p>

<h2>2. Invite the right number of people</h2>
<p>Six to nine players is the sweet spot for one table of Texas Hold'em. Fewer than five gets repetitive; more than ten means long waits between hands, so split into two tables. Invite one or two more than you need, because someone always cancels.</p>

<h2>3. Shopping list</h2>
<ul class="ep-checks">
  <li><strong>Two decks of cards</strong> with different backs, so one can be shuffled while the other is dealt.</li>
  <li><strong>Chips</strong>: about 50 per player for a set, or none at all if everyone uses a phone with ${CTA_LINK}.</li>
  <li><strong>A dealer button</strong>: a coin or bottle cap works.</li>
  <li><strong>A table</strong> big enough to reach the middle, ideally with a cloth so cards slide.</li>
  <li><strong>A timer</strong> for tournament blind levels (any phone clock).</li>
  <li><strong>Food that is not greasy</strong>: finger food leaves marks on the cards. Bowls and napkins away from the felt.</li>
</ul>

<h2>4. Set the stacks and blinds</h2>
<p>Start everyone with <strong>50 to 100 big blinds</strong>. A common home setup is 1,000 chips with 5/10 blinds, raising to 10/20, 20/40, 50/100 and so on. The <a href="/guides/home-poker-blind-structure">blind structure guide</a> has a full schedule, and the <a href="/guides/poker-chip-calculator">chip calculator</a> works out how many chips of each colour to hand out if you use a physical set.</p>

<h2>5. Agree the house rules before the first hand</h2>
<p>Five minutes of rules saves an hour of arguments. Decide on re-buys, the minimum raise, whether you can show one card, and what happens on a misdeal. Our <a href="/guides/home-poker-house-rules">home poker house rules</a> page is a list you can read out or send to the group chat.</p>

<h2>6. Run the night</h2>
<ul>
  <li>Start on time; latecomers can join a cash game or buy in during the first level of a tournament.</li>
  <li>Rotate the deal every hand, with the button moving left.</li>
  <li>Take a short break every hour or two.</li>
  <li>Keep phones for chips only if you are using them as chips; otherwise keep them off the table.</li>
</ul>

<h2>7. Settle up</h2>
<p>At the end, write down each player's final stack before anyone leaves. If you play for stakes, convert chips back at the same rate as the buy-in and settle between yourselves. For tournaments, see <a href="/guides/poker-tournament-payouts">how to split a tournament prize pool</a>. EasyPoker never handles money, but every stack and every action of the night stays on record for the host.</p>
`,
    faq: [
      ['How many people do you need for a poker night?', 'Six to nine players is ideal for one table. Five works; above ten, use two tables.'],
      ['What do I need to host a poker night?', 'Two decks of cards, a dealer button, a table, and chips or a phone chip app. Add a timer for tournaments.'],
      ['How long does a home poker tournament last?', 'With eight players, 1,000-chip stacks and 20-minute blind levels, about two and a half to three and a half hours.'],
      ['What is a good buy-in for a home game?', 'One that nobody minds losing. Agree it in the invite so there are no surprises.'],
      ['Do I need a poker chip set?', 'No. Everyone can keep their stack on their own phone with a free browser table like EasyPoker.'],
    ],
  },

  {
    slug: 'poker-tournament-payouts',
    title: 'Home Poker Tournament Payouts: How to Split the Pot',
    description:
      'How to split a home poker tournament prize pool: payout percentages by number of players, a worked example, and how chop deals at the final table work.',
    h1: 'How to split a home poker tournament prize pool',
    lede:
      'Most home tournaments pay the top 20 to 30 percent of players. A common split is 65/35 for up to 7 players, 50/30/20 for 8 to 10, and 40/30/20/10 for 11 to 20. Agree the split before the first hand.',
    related: ['how-to-host-a-poker-night', 'home-poker-house-rules', 'home-poker-blind-structure'],
    body: `
<h2>Common payout structures</h2>
<p>These are widely used home-game conventions, not official rules. Any split works if everyone agrees to it before play starts.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th>Players</th><th>Places paid</th><th>1st</th><th>2nd</th><th>3rd</th><th>4th</th></tr></thead>
  <tbody>
    <tr><td>2 to 4</td><td>1</td><td>100%</td><td></td><td></td><td></td></tr>
    <tr><td>5 to 7</td><td>2</td><td>65%</td><td>35%</td><td></td><td></td></tr>
    <tr><td>8 to 10</td><td>3</td><td>50%</td><td>30%</td><td>20%</td><td></td></tr>
    <tr><td>11 to 20</td><td>4</td><td>40%</td><td>30%</td><td>20%</td><td>10%</td></tr>
  </tbody>
</table></div>

<h2>Worked example: 9 players, 20 each</h2>
<p>The prize pool is 9 × 20 = 180. With a 50/30/20 split:</p>
<ul>
  <li>1st place: 50% of 180 = <strong>90</strong></li>
  <li>2nd place: 30% of 180 = <strong>54</strong></li>
  <li>3rd place: 20% of 180 = <strong>36</strong></li>
</ul>
<p>Round to amounts that are easy to pay. A popular home tweak is to give the bubble (the first player out of the money) their buy-in back from first place's share.</p>

<h2>Re-buys and add-ons</h2>
<p>If re-buys are allowed, every re-buy goes into the prize pool, so recalculate the payouts once the re-buy period closes. Tell players when re-buys end (often at the end of the first hour or the third blind level). In ${CTA_LINK}, turn on buy-ins when you create the table and the host can see every buy-in in the table's history.</p>

<h2>Chopping at the final table</h2>
<p>When a few players are left, they may agree to stop and split the remaining money (a "chop"). Three common ways:</p>
<ul>
  <li><strong>Even chop</strong>: split what is left equally. Fair only when stacks are close.</li>
  <li><strong>Chip chop</strong>: every remaining player is guaranteed the last unpaid prize, and the rest of the money is split in proportion to chip stacks.</li>
  <li><strong>ICM chop</strong>: the Independent Chip Model estimates each stack's chance of finishing in each place. It is the fairest for uneven stacks but needs a calculator.</li>
</ul>
<p><strong>Chip chop example:</strong> three players remain and 180 is left to pay, with prizes of 90, 54 and 36. Everyone is guaranteed 36 (third place), which uses 108. The other 72 is split by chips: stacks of 5,000, 3,000 and 1,000 (9,000 total) get 72 × 5/9 = 40, 72 × 3/9 = 24 and 72 × 1/9 = 8. Final: 76, 60 and 44.</p>

<h2>Keep it friendly</h2>
<ul>
  <li>Write the payout split in the invite or the group chat.</li>
  <li>Collect buy-ins before the first hand.</li>
  <li>Record final positions as players bust out.</li>
</ul>
<p>EasyPoker only tracks chips and never handles money; settle real stakes between yourselves, as allowed where you live.</p>
`,
    faq: [
      ['How many places should a home poker tournament pay?', 'Usually the top 20 to 30 percent: one place for up to 4 players, two for 5 to 7, three for 8 to 10, four for 11 to 20.'],
      ['What is a standard payout for three places?', '50 percent to first, 30 percent to second and 20 percent to third.'],
      ['What is a chip chop?', 'Each remaining player is guaranteed the lowest unpaid prize, and the rest of the money is split in proportion to chip stacks.'],
      ['Do re-buys go into the prize pool?', 'Yes, normally every re-buy and add-on is added to the prize pool, so payouts are recalculated after the re-buy period.'],
    ],
  },

  {
    slug: 'home-poker-house-rules',
    title: 'Home Poker House Rules: A List to Agree Before Dealing',
    description:
      'A ready-to-share list of home poker house rules: acting in turn, string bets, misdeals, showing cards, re-buys and settling up, with the reason for each rule.',
    h1: 'Home poker house rules',
    lede:
      'Most home-game arguments come from rules nobody agreed on. Read this list out before the first hand, or paste it into the group chat, and change anything your group does differently.',
    related: ['texas-holdem-rules', 'how-to-host-a-poker-night', 'side-pots'],
    body: `
<h2>The short list</h2>
<ol>
  <li><strong>Act in turn.</strong> Wait for the player before you. Acting early gives information away and can be unfair to others.</li>
  <li><strong>Verbal declarations are binding.</strong> If you say "call" or "raise to 100", that is your action.</li>
  <li><strong>No string bets.</strong> Say "raise" first, or put the whole amount in at once. Adding chips in several trips after seeing reactions is not allowed.</li>
  <li><strong>One-chip rule.</strong> A single oversized chip without saying "raise" is a call. (With phone chips, the amount you tap is the amount you bet.)</li>
  <li><strong>Minimum raise.</strong> A raise must be at least the size of the previous bet or raise.</li>
  <li><strong>Cards speak.</strong> At showdown the hand is what the cards show, whatever the player calls it.</li>
  <li><strong>Show one, show all.</strong> If you show your cards to one player, everyone at the table may see them.</li>
  <li><strong>Protect your hand.</strong> Keep a chip or your hand on your cards. If they get mucked by accident, they are dead.</li>
  <li><strong>Misdeals.</strong> If the first or second card dealt is exposed, or a player gets the wrong number of cards, reshuffle and redeal.</li>
  <li><strong>Exposed card later in the deal.</strong> It is replaced after the deal and used as the burn card.</li>
  <li><strong>Re-buys</strong>: say when they are allowed, for how much, and until when.</li>
  <li><strong>Leaving early</strong> in a cash game: you cash out your stack. In a tournament, your blinds keep being posted until you are out, or you forfeit.</li>
  <li><strong>Settle up before anyone leaves.</strong> Write down final stacks.</li>
</ol>

<h2>Why these rules matter</h2>
<h3>String bets and the one-chip rule</h3>
<p>Both stop a player from fishing for a reaction before deciding how much to bet. They also make the bet amount clear to everyone. When bets are made by tapping an exact number on a phone, as with ${CTA_LINK}, the amount is never ambiguous, which removes the most common home-game dispute.</p>
<h3>Cards speak</h3>
<p>New players misread hands. "Cards speak" means nobody loses a pot because they did not notice their own flush, and nobody wins one by calling a hand they do not have.</p>
<h3>Misdeals</h3>
<p>Agreeing in advance what counts as a misdeal turns an argument into a reshuffle. Keep it simple: if in doubt, redeal.</p>

<h2>House rules for the chips themselves</h2>
<ul>
  <li><strong>Chips stay on the table</strong> (or in the app) during a cash game: no pocketing chips mid-game.</li>
  <li><strong>Agree a fixer.</strong> With EasyPoker the host can correct any stack or the pot, and restore the table to any earlier moment, so mistakes are fixed rather than argued about.</li>
  <li><strong>Pot splits.</strong> On a tie, split the pot evenly; an odd chip goes to the first winner left of the button.</li>
  <li><strong>Side pots.</strong> Work them out before showing down. See <a href="/guides/side-pots">how side pots work</a>.</li>
</ul>

<h2>Optional rules some groups add</h2>
<ul>
  <li><strong>Straddle</strong>: the player left of the big blind may put in a voluntary double big blind before cards are dealt.</li>
  <li><strong>Run it twice</strong>: when players are all-in, deal the remaining board twice and split the pot by each result.</li>
  <li><strong>Seven-deuce bonus</strong>: winning a pot with 7-2 earns a small bonus from every player.</li>
  <li><strong>Dealer's choice</strong>: the dealer picks the variant (Hold'em, Omaha, etc.) for each orbit.</li>
</ul>
`,
    faq: [
      ['What is a string bet in poker?', 'Putting chips in over several movements without first saying "raise". Most games do not allow it; the first movement counts as the bet.'],
      ['What does "cards speak" mean?', 'At showdown the hand is judged by the cards, not by what the player says it is.'],
      ['What happens if a card is exposed during the deal?', 'If one of the first two cards is exposed, it is a misdeal and the hand is redealt. Later, the exposed card is replaced and used as a burn card.'],
      ['What is the one-chip rule?', 'Putting a single larger chip in without saying "raise" counts as a call.'],
      ['Who gets the odd chip in a split pot?', 'By common convention, the winner closest to the left of the dealer button.'],
    ],
  },

  {
    slug: 'poker-terms-glossary',
    title: 'Poker Terms Glossary: 40+ Words Every Player Uses',
    description:
      'Plain-English definitions of the poker terms you hear at a home game: blinds, button, flop, turn, river, kicker, all-in, side pot, nuts, tilt and more.',
    h1: 'Poker terms glossary',
    lede:
      'Short, plain definitions of the words you will hear at a home poker game, from "ante" to "under the gun". Each one is a single sentence you can read out at the table.',
    related: ['texas-holdem-rules', 'poker-hand-rankings', 'side-pots'],
    body: `
<h2>Betting and the pot</h2>
<dl class="ep-glossary">
  <dt>All-in</dt><dd>Betting every chip you have left.</dd>
  <dt>Ante</dt><dd>A small forced bet every player puts in before a hand, used in some games and late tournament levels.</dd>
  <dt>Bet</dt><dd>The first chips put in during a betting round.</dd>
  <dt>Big blind</dt><dd>The larger of the two forced bets, posted by the player two seats left of the button.</dd>
  <dt>Buy-in</dt><dd>The amount you pay or receive to start playing, or to start again after losing your chips.</dd>
  <dt>Call</dt><dd>Matching the current bet.</dd>
  <dt>Check</dt><dd>Passing without betting when nobody has bet yet in the round.</dd>
  <dt>Fold</dt><dd>Giving up your hand and any chips you have already put in.</dd>
  <dt>Main pot</dt><dd>The pot every player in the hand can win, including a player who is all-in.</dd>
  <dt>Pot</dt><dd>All the chips bet in the current hand, won by the best hand or the last player left.</dd>
  <dt>Raise</dt><dd>Matching the current bet and adding more.</dd>
  <dt>Re-buy</dt><dd>Buying more chips after running out, if the game allows it.</dd>
  <dt>Side pot</dt><dd>A separate pot for chips an all-in player could not match; only players who contributed to it can win it.</dd>
  <dt>Small blind</dt><dd>The smaller forced bet, posted by the player directly left of the button.</dd>
  <dt>Stack</dt><dd>The chips a player has in front of them.</dd>
  <dt>Straddle</dt><dd>An optional, voluntary blind of twice the big blind, posted before the cards are dealt.</dd>
</dl>

<h2>Cards and the deal</h2>
<dl class="ep-glossary">
  <dt>Board</dt><dd>The community cards face up in the middle of the table.</dd>
  <dt>Burn card</dt><dd>The card discarded face down before the flop, turn and river are dealt.</dd>
  <dt>Button</dt><dd>The marker showing who is the dealer for the hand; it moves one seat left every hand.</dd>
  <dt>Community cards</dt><dd>Cards dealt face up that every player can use.</dd>
  <dt>Flop</dt><dd>The first three community cards, dealt together.</dd>
  <dt>Hole cards</dt><dd>Your private cards, dealt face down.</dd>
  <dt>Kicker</dt><dd>A card that is not part of your made hand but breaks ties.</dd>
  <dt>Muck</dt><dd>The pile of folded and discarded cards; also, to throw your hand away.</dd>
  <dt>River</dt><dd>The fifth and last community card.</dd>
  <dt>Showdown</dt><dd>When the remaining players reveal their hands to decide who wins.</dd>
  <dt>Turn</dt><dd>The fourth community card.</dd>
</dl>

<h2>Hands and strategy</h2>
<dl class="ep-glossary">
  <dt>Bluff</dt><dd>Betting with a weak hand to make better hands fold.</dd>
  <dt>Draw</dt><dd>A hand that needs more cards to become strong, such as four cards to a flush.</dd>
  <dt>Nuts</dt><dd>The best possible hand given the board.</dd>
  <dt>Outs</dt><dd>The cards left in the deck that would improve your hand to a likely winner.</dd>
  <dt>Pocket pair</dt><dd>Two hole cards of the same rank.</dd>
  <dt>Set</dt><dd>Three of a kind made with a pocket pair and one matching board card.</dd>
  <dt>Tilt</dt><dd>Playing badly because you are frustrated or angry.</dd>
  <dt>Wheel</dt><dd>The lowest straight: 5-4-3-2-A.</dd>
</dl>

<h2>Positions at the table</h2>
<dl class="ep-glossary">
  <dt>Cutoff</dt><dd>The seat directly right of the button.</dd>
  <dt>Early position</dt><dd>The first seats to act before the flop, which act with the least information.</dd>
  <dt>In position</dt><dd>Acting after your opponent in a betting round, which is an advantage.</dd>
  <dt>Under the gun</dt><dd>The player directly left of the big blind, who acts first before the flop.</dd>
</dl>

<h2>Formats</h2>
<dl class="ep-glossary">
  <dt>Cash game</dt><dd>A game where chips stand for a fixed amount and players can join, re-buy or leave at any time.</dd>
  <dt>Chop</dt><dd>Splitting a pot or a tournament prize pool by agreement.</dd>
  <dt>No-limit</dt><dd>Betting rules where you may bet any amount up to your whole stack.</dd>
  <dt>Tournament</dt><dd>A game with rising blinds where players are eliminated until one has every chip.</dd>
</dl>

<p>Playing without a chip set? With ${CTA_LINK}, the blinds, stacks and pot are on every player's phone. See <a href="/guides/virtual-poker-chips">how virtual poker chips work</a>.</p>
`,
    faq: [
      ['What does "the nuts" mean in poker?', 'The best possible hand given the community cards on the board.'],
      ['What is the difference between the flop, turn and river?', 'The flop is the first three community cards, the turn is the fourth and the river is the fifth and last.'],
      ['What does "under the gun" mean?', 'The player directly to the left of the big blind, who acts first before the flop.'],
      ['What is a kicker?', 'A card that is not part of your pair or other made hand, used to break ties between equal hands.'],
    ],
  },

  {
    slug: 'best-poker-chip-apps',
    title: 'Best Poker Chip Apps for Home Games, Compared',
    description:
      'Poker chip apps for live home games compared: EasyPoker, Chips of Fury, PartyPot and pokerchips.io, with platform, side pots and settle-up features.',
    h1: 'Poker chip apps for home games, compared',
    lede:
      'Several free apps replace a physical chip set while you play with real cards. They differ mainly in whether players must install an app, whether side pots are automatic, and whether the app works out who owes whom at the end.',
    related: ['poker-chip-app', 'virtual-poker-chips', 'poker-without-chips'],
    body: `
<h2>The comparison</h2>
<p>Details for other apps are taken from each product's own website, checked on 12 November 2026. Features change, so check their sites before relying on one.</p>
<div class="ep-table-wrap"><table>
  <thead><tr><th></th><th>EasyPoker</th><th>Chips of Fury (Chips Only Mode)</th><th>PartyPot</th><th>pokerchips.io</th></tr></thead>
  <tbody>
    <tr><th scope="row">Runs on</th><td>Any phone browser</td><td>App</td><td>iOS and Android app</td><td>Web: create a game, share the link</td></tr>
    <tr><th scope="row">Player install needed</th><td>No</td><td>See their site</td><td>Yes (app)</td><td>No</td></tr>
    <tr><th scope="row">Account needed</th><td>No</td><td>No, per their site</td><td>No, per their site</td><td>Not stated</td></tr>
    <tr><th scope="row">Price</th><td>Free</td><td>Free, per their site</td><td>Free, no ads or subscription, per their site</td><td>Not stated</td></tr>
    <tr><th scope="row">Automatic side pots</th><td>No: pots are paid out manually</td><td>Yes, per their site</td><td>Not stated</td><td>Not stated</td></tr>
    <tr><th scope="row">Who-owes-whom settlement</th><td>No</td><td>Cash-outs, per their site</td><td>Yes ("Smart Settlement")</td><td>Not stated</td></tr>
    <tr><th scope="row">Host can fix stacks and rewind</th><td>Yes, to any earlier moment</td><td>Not stated</td><td>Transaction history, per their site</td><td>Not stated</td></tr>
  </tbody>
</table></div>

<h2>Which one to pick</h2>
<ul>
  <li><strong>Mixed iPhone and Android group, nobody wants to install anything</strong>: a browser app. EasyPoker joins with a QR code and a name.</li>
  <li><strong>Lots of all-ins and side pots</strong>: an app with automatic side pots saves arithmetic. With EasyPoker you work side pots out by hand (see <a href="/guides/side-pots">side pots explained</a>) and each winner takes their share.</li>
  <li><strong>Cash game where the main job is who owes whom</strong>: an app with a settlement feature, such as PartyPot's.</li>
  <li><strong>The host needs to undo mistakes</strong>: EasyPoker keeps every action and lets the host restore the table to any earlier moment.</li>
</ul>

<h2>What all of them have in common</h2>
<ul>
  <li>You still deal a real deck; none of these replace the cards or the dealer.</li>
  <li>Each player sees their own stack on their own phone, and the pot updates live.</li>
  <li>None of them handle real money in a home game. Settle any stakes between yourselves.</li>
</ul>

<h2>What makes a poker chip app good at a real table</h2>
<ol>
  <li><strong>Joining in under a minute.</strong> If guests have to download and register, the night starts late.</li>
  <li><strong>Exact, visible pot.</strong> Everyone sees the same number.</li>
  <li><strong>Mistakes are fixable</strong> without restarting the game.</li>
  <li><strong>Nothing is lost</strong> when a phone dies or a tab closes.</li>
  <li><strong>Works on every phone</strong> at the table, iPhone and Android alike.</li>
</ol>
<p>You can try EasyPoker in about a minute at ${CTA_LINK}: create a table, show the QR code, deal.</p>

<h2>Not to be confused with</h2>
<p>EasyPoker at easypoker.cc is an independent browser chip tracker. It is not the "Poker with Friends – EasyPoker" mobile app, which deals virtual cards and is a separate product from a different developer.</p>
`,
    faq: [
      ['What is the best free poker chip app?', 'It depends on the group. For no installs on mixed phones, a browser app like EasyPoker. For automatic side pots or a who-owes-whom settlement, an installed app with that feature.'],
      ['Is there a poker chip app that works without downloading?', 'Yes. EasyPoker runs in the phone browser: the host shares a link or QR code and players join with a name.'],
      ['Do poker chip apps handle side pots?', 'Some do automatically. EasyPoker does not: you work the side pots out and each winner takes their share of the pot.'],
      ['Is easypoker.cc the same as the EasyPoker app?', 'No. easypoker.cc is an independent browser chip tracker for games played with real cards. The "Poker with Friends – EasyPoker" app is a separate product.'],
    ],
  },
];

export const about = {
  title: 'About EasyPoker (easypoker.cc)',
  description:
    'What EasyPoker at easypoker.cc is, who it is for, what it does and does not do, and how it differs from other products with a similar name.',
  h1: 'About EasyPoker',
  body: `
<p><strong>EasyPoker (easypoker.cc) is a free, browser-based poker chip tracker for live home games.</strong> The host creates a table, players join from their own phones with a link or QR code, and every bet, pot and payout updates on every phone at once. Players still deal a real deck of cards.</p>
<h2>What it does</h2>
<ul>
  <li>Keeps each player's chip stack on their own phone, with a live shared pot.</li>
  <li>Lets the host set the starting stack and the blinds (presets from 1/2 to 1,000/2,000) and optionally allow buy-ins of a fixed amount.</li>
  <li>Seats up to 30 players at one table.</li>
  <li>Saves every action on the server as it happens, so a closed tab or dead battery loses nothing.</li>
  <li>Lets the host correct any stack or the pot, change blinds, remove a player, and restore the table to any earlier moment.</li>
</ul>
<h2>What it does not do</h2>
<ul>
  <li>It does not deal cards or decide who wins a hand.</li>
  <li>It does not work out side pots automatically.</li>
  <li>It does not handle money, sell chips, or offer real-money gambling.</li>
</ul>
<h2>Cost and accounts</h2>
<p>Free. There are no accounts, no app download and no ads. See the <a href="/privacy">privacy page</a> for exactly what is stored.</p>
<h2>Not the same as</h2>
<p>EasyPoker at easypoker.cc is an independent project. It is not affiliated with the "Poker with Friends – EasyPoker" mobile app or the easy.poker website, which is a separate product that deals virtual cards.</p>
<h2>Start a game</h2>
<p><a href="/">Create a free table</a>, or read the <a href="/guides/">home poker guides</a>.</p>
`,
};
