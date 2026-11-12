// External sources shown under each guide ("Sources") and listed as schema.org
// `citation`. Every URL was opened and checked against the claim it supports on
// 2026-11-12. Only cite a page for what it actually says.

const S = {
  roberts: ["Robert's Rules of Poker, Bob Ciaffone (string raises, oversized chip, showdown, misdeals, ties, no-limit raises)", 'https://www.briggsoft.com/docs/pmavens/Rules_Roberts.htm'],
  tda: ['Poker Tournament Directors Association, 2026 Rules v1.1 (Rule 21 odd chips, Rule 45 raise amounts, Rule 46 oversized chip, Rule 53 verbal declarations)', 'https://www.pokertda.com/view-poker-tda-rules/'],
  prob: ['Wikipedia: Poker probability (five- and seven-card hand frequencies)', 'https://en.wikipedia.org/wiki/Poker_probability'],
  hands: ['Wikipedia: List of poker hands (ranking order and tie-breaking)', 'https://en.wikipedia.org/wiki/List_of_poker_hands'],
  holdem: ["Wikipedia: Texas hold 'em (deal, betting rounds, showdown)", 'https://en.wikipedia.org/wiki/Texas_hold_%27em'],
  starting: ["Wikipedia: Texas hold 'em starting hands (169 distinct hands, 1,326 combinations, pair frequency)", 'https://en.wikipedia.org/wiki/Texas_hold_%27em_starting_hands'],
  betting: ['Wikipedia: Betting in poker (limits, all-in and side pots, pot-limit)', 'https://en.wikipedia.org/wiki/Betting_in_poker'],
  blinds: ['Wikipedia: Blind (poker)', 'https://en.wikipedia.org/wiki/Blind_(poker)'],
  tourney: ['Wikipedia: Poker tournament (structures, re-buys, payouts)', 'https://en.wikipedia.org/wiki/Poker_tournament'],
  icm: ['Wikipedia: Independent Chip Model', 'https://en.wikipedia.org/wiki/Independent_Chip_Model'],
  glossary: ['Wikipedia: Glossary of poker terms', 'https://en.wikipedia.org/wiki/Glossary_of_poker_terms'],
  potodds: ['Wikipedia: Pot odds', 'https://en.wikipedia.org/wiki/Pot_odds'],
  position: ['Wikipedia: Position (poker)', 'https://en.wikipedia.org/wiki/Position_(poker)'],
  omaha: ["Wikipedia: Omaha hold 'em (four hole cards, exactly two from hand and three from board)", 'https://en.wikipedia.org/wiki/Omaha_hold_%27em'],
  shuffle: ['Wikipedia: Shuffling (riffle shuffles and the "seven shuffles" result of Bayer and Diaconis)', 'https://en.wikipedia.org/wiki/Shuffling'],
  cof: ['Chips of Fury: Virtual Poker Chips (Chips Only Mode)', 'https://chipsoffury.com/virtual-poker-chips/'],
  partypot: ['PartyPot: Is there a free app to replace poker chips?', 'https://partypotapp.com/faq/replace-poker-chips-free-app/'],
  pokerchipsio: ['pokerchips.io home page', 'https://www.pokerchips.io/'],
};

export const SOURCES = {
  'poker-hand-rankings': [S.hands, S.prob, S.roberts],
  'texas-holdem-rules': [S.holdem, S.roberts, S.tda, S.betting],
  'side-pots': [S.betting, S.roberts],
  'how-to-host-a-poker-night': [S.holdem, S.roberts, S.tourney],
  'poker-tournament-payouts': [S.tourney, S.icm],
  'home-poker-house-rules': [S.roberts, S.tda],
  'poker-terms-glossary': [S.glossary, S.position],
  'best-poker-chip-apps': [S.cof, S.partypot, S.pokerchipsio],
  'home-poker-blind-structure': [S.blinds, S.tourney, S.tda],
  'poker-outs-and-odds': [S.prob, S.potodds],
  'pot-odds': [S.potodds, S.prob],
  'texas-holdem-starting-hands': [S.starting, S.position],
  'poker-positions': [S.position, S.blinds],
  'omaha-poker-rules': [S.omaha, S.betting, S.hands],
  'how-to-deal-poker': [S.roberts, S.shuffle, S.holdem],
};
