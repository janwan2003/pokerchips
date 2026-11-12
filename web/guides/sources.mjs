// External sources shown under each guide ("Sources") and emitted as schema.org
// `citation`. Primary sources only: rulebooks, regulations, papers and the authors'
// own computations; no encyclopedias or other summaries. Every URL was opened on
// 2026-11-12 and checked against the claim it backs. Cite a page only for what it
// actually says. A source without a URL (a book) is listed without a link.
//
// Guides that only describe EasyPoker itself get NOTES instead: they make no claim an
// outside source could back, and citing one anyway would be decoration.

const S = {
  roberts: ["Robert's Rules of Poker, Bob Ciaffone: string raises, oversized chip, showdown, misdeals, burn cards, button and blinds, glossary", 'https://www.briggsoft.com/docs/pmavens/Rules_Roberts.htm'],
  tda: ['Poker Tournament Directors Association, 2026 Rules v1.1: Rule 21 odd chips, Rule 45 raise amounts, Rule 46 oversized chip, Rule 53 verbal declarations', 'https://www.pokertda.com/view-poker-tda-rules/'],
  alspach: ['Brian Alspach (Simon Fraser University), Poker Computations: exact hand counts and probabilities', 'http://people.math.sfu.ca/~alspach/computations'],
  alspach169: ['Brian Alspach, "Counting Starting Poker Hands": 169 starting hands from 1,326 combinations', 'http://people.math.sfu.ca/~alspach/art3.pdf'],
  pagatRank: ['John McLeod, Pagat: Poker hand ranking (order, equal suits, the wheel, kickers, split pots)', 'https://www.pagat.com/poker/rules/ranking.html'],
  pagatBet: ['John McLeod, Pagat: Poker betting (blinds, no-limit and pot-limit maximums, all-ins and side pots)', 'https://www.pagat.com/poker/rules/betting.html'],
  pagatHoldem: ["John McLeod, Pagat: Texas Hold'em rules (deal, burn cards, betting order, showdown)", 'https://www.pagat.com/poker/variants/texasholdem.html'],
  pagatOmaha: ['John McLeod, Pagat: Omaha rules (four hole cards, exactly two plus three, pot-limit)', 'https://www.pagat.com/poker/variants/omaha.html'],
  bayer: ['Bayer and Diaconis, "Trailing the Dovetail Shuffle to its Lair", Annals of Applied Probability 2(2), 1992', 'https://doi.org/10.1214/aoap/1177005705'],
  harville: ['Harville, "Assigning Probabilities to the Outcomes of Multi-Entry Competitions", JASA 68(342), 1973: the model ICM is built on', 'https://doi.org/10.1080/01621459.1973.10482425'],
  sklansky: ['David Sklansky, The Theory of Poker (Two Plus Two Publishing, 1987): pot odds and implied odds'],
  njChips: ['New Jersey Administrative Code 13:69E-1.3, Value gaming chips: regulated chip colours', 'https://www.nj.gov/lps/ge/docs/Regulations/CHAPTER69E.pdf'],
  cof: ['Chips of Fury: Virtual Poker Chips (Chips Only Mode)', 'https://chipsoffury.com/virtual-poker-chips/'],
  partypot: ['PartyPot: Is there a free app to replace poker chips?', 'https://partypotapp.com/faq/replace-poker-chips-free-app/'],
  pokerchipsio: ['pokerchips.io home page', 'https://www.pokerchips.io/'],
};

export const SOURCES = {
  'poker-hand-rankings': [S.pagatRank, S.alspach, S.roberts],
  'texas-holdem-rules': [S.pagatHoldem, S.pagatBet, S.roberts, S.tda],
  'side-pots': [S.pagatBet, S.roberts],
  'how-to-host-a-poker-night': [S.roberts, S.tda, S.pagatHoldem],
  'poker-tournament-payouts': [S.harville],
  'home-poker-house-rules': [S.roberts, S.tda],
  'poker-terms-glossary': [S.roberts, S.pagatHoldem, S.pagatBet],
  'best-poker-chip-apps': [S.cof, S.partypot, S.pokerchipsio],
  'home-poker-blind-structure': [S.pagatBet, S.roberts, S.tda],
  'poker-chip-calculator': [S.njChips],
  'poker-outs-and-odds': [S.alspach, S.sklansky],
  'pot-odds': [S.sklansky, S.pagatBet],
  'texas-holdem-starting-hands': [S.alspach169, S.alspach],
  'poker-positions': [S.roberts, S.pagatHoldem],
  'omaha-poker-rules': [S.pagatOmaha, S.pagatBet, S.pagatRank],
  'how-to-deal-poker': [S.roberts, S.bayer, S.pagatHoldem],
};

// Shown in place of a source list on guides that only describe EasyPoker.
const OWN = 'This page describes how EasyPoker itself works. Each feature it mentions was checked against the app on 2026-11-12; see also the About page.';
export const NOTES = {
  'virtual-poker-chips': OWN,
  'poker-chip-app': OWN,
  'online-poker-chips': OWN,
  'poker-without-chips': 'The phone option describes EasyPoker itself, checked against the app on 2026-11-12. The other six options are common home-game workarounds rather than rules, so there is no rulebook to cite.',
};

// Notes added under a page's sources, for claims that are conventions, not rules.
export const CAVEATS = {
  'poker-tournament-payouts': 'Payout percentages are home-game conventions; neither the TDA rules nor Robert\'s Rules set them. The chip-chop example is arithmetic shown on the page.',
  'texas-holdem-starting-hands': 'The tier list is a simplified guideline, not a published chart; the counts and odds are exact.',
  'poker-positions': 'Seat names such as lojack, hijack and cutoff are player slang with no rulebook definition; the sources cover the button, the blinds and the order of action.',
  'home-poker-blind-structure': 'Level timings are common home-game choices, not rules.',
  'poker-chip-calculator': 'Chips per player and set sizes are common guidance for home sets, not a rule.',
};
