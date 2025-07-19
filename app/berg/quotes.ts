// Authentic quotes from Berlin's techno community - organized by tier progression

import { Quote } from './types';

export const BERG_QUOTES: Quote[] = [
  // TIER 0: Underground Era (1995-2000) - Pure Authenticity
  {
    id: 'underground-saved-life',
    type: 'regular',
    tier: 0,
    text: 'This place saved my life. Finally somewhere I can be myself.',
    mood: 'grateful',
    source: 'Community sentiment'
  },
  {
    id: 'underground-not-social',
    type: 'regular',
    tier: 0,
    text: 'It was not about dress code, it was not a social happening, it was not about straight girls and boys to feel cool.',
    mood: 'protective',
    source: 'Berlin local'
  },
  {
    id: 'underground-gay-club',
    type: 'regular',
    tier: 0,
    text: 'You need to remember that Berghain used to be a gay club.',
    mood: 'protective',
    source: 'Regular explaining origins'
  },
  {
    id: 'underground-beautiful',
    type: 'regular',
    tier: 0,
    text: 'I know that I had some of the best days of my entire life behind me and I had them there. It was a really, really beautiful place.',
    mood: 'nostalgic',
    source: 'Jake the Rapper about Bar25'
  },
  {
    id: 'underground-liberation',
    type: 'critic',
    tier: 0,
    text: 'It must have also been quite liberating, dancing in places where previously you might have been shot for trespassing.',
    mood: 'grateful',
    source: 'Cultural observer'
  },
  {
    id: 'underground-political',
    type: 'critic',
    tier: 0,
    text: 'In its early days, before it was gentrified by finance bros on a lads trip, techno was political and totally against the system.',
    mood: 'protective',
    source: 'DJ HELL'
  },

  // TIER 1: Word of Mouth (2001-2005) - Growing Recognition
  {
    id: 'wordofmouth-belonging',
    type: 'regular',
    tier: 1,
    text: 'The sense of belonging, which is both ephemeral for a single night yet enduring across lifetimes, often described as "family," remains one of Techno\'s defining elements.',
    mood: 'excited',
    source: 'UNESCO application'
  },
  {
    id: 'wordofmouth-freedom',
    type: 'visitor',
    tier: 1,
    text: 'Berlin is an extraordinary place. People wanted to celebrate this freedom together; they wanted to party.',
    mood: 'excited',
    source: 'Cultural analysis'
  },
  {
    id: 'wordofmouth-defined-by-people',
    type: 'staff',
    tier: 1,
    text: 'It\'s defined by the people in it. It\'s not the same thing every night.',
    mood: 'excited',
    source: 'Regular explaining culture'
  },
  {
    id: 'wordofmouth-reggae-comparison',
    type: 'critic',
    tier: 1,
    text: 'To put it in one sentence would be - techno, to Berlin, is as important as reggae is to Kingston. It\'s really the soundtrack of the city.',
    mood: 'excited',
    source: 'Tobias Rapp'
  },
  {
    id: 'wordofmouth-soundtrack-liberation',
    type: 'critic',
    tier: 1,
    text: 'And this is rooted in the years after the wall came down, when this music was the soundtrack of liberation.',
    mood: 'nostalgic',
    source: 'Tobias Rapp'
  },

  // TIER 2: Rising Fame (2006-2010) - International Attention
  {
    id: 'rising-creativity-hub',
    type: 'critic',
    tier: 2,
    text: 'Berlin has gained a reputation as a hub of creativity, attracting individuals who seek to be a part of or just visit a city that celebrates individuality.',
    mood: 'concerned',
    source: 'Academic analysis'
  },
  {
    id: 'rising-spilling-secrets',
    type: 'visitor',
    tier: 2,
    text: 'Armed with sunglasses and Berghain entry tips, the new wave ravers are spilling all the secrets on social media.',
    mood: 'concerned',
    source: 'The Face magazine'
  },
  {
    id: 'rising-bar25-tears',
    type: 'regular',
    tier: 2,
    text: 'There were tears. There were tears every time. It was the perfect storm of things that just can\'t be recreated.',
    mood: 'nostalgic',
    source: 'Jake Basker about Bar25 closure'
  },
  {
    id: 'rising-commercial-success',
    type: 'critic',
    tier: 2,
    text: 'This music drastically and very, very quickly changed from an underground phenomenon to a huge commercial success.',
    mood: 'concerned',
    source: 'Tobias Rapp'
  },
  {
    id: 'rising-not-sustainable',
    type: 'critic',
    tier: 2,
    text: 'But the thing was that this commercialization was not sustainable. This music grew and grew and grew and grew. The scene got tons of money. There were huge amounts of drugs around. And it wasn\'t sustainable.',
    mood: 'concerned',
    source: 'Tobias Rapp'
  },

  // TIER 3: Tourist Magnet (2011-2015) - Mass Tourism Era
  {
    id: 'tourist-not-last-decade',
    type: 'regular',
    tier: 3,
    text: 'I\'ve been to a lot of amazing parties, just not in the last decade.',
    mood: 'defeated',
    source: 'Old grizzled timer'
  },
  {
    id: 'tourist-berlin-over',
    type: 'visitor',
    tier: 3,
    text: 'Berlin is over. Fuck all of this Instagram shit. It used to be about the music, about having fun.',
    mood: 'frustrated',
    source: 'Man at Internet Xplorer'
  },
  {
    id: 'tourist-hard-to-teach',
    type: 'regular',
    tier: 3,
    text: 'When you start getting huge turnover in a club, it becomes more and more difficult for those who have been there for a long time to teach the newcomers how to behave.',
    mood: 'frustrated',
    source: 'Luis-Manuel Garcia, ethnomusicologist'
  },
  {
    id: 'tourist-english-lads',
    type: 'critic',
    tier: 3,
    text: 'The groups of English lads blowing their gaskets on coke and molly share DNA with the day glo bros at Electric Daisy Carnival.',
    mood: 'frustrated',
    source: 'T.M. Brown'
  },
  {
    id: 'tourist-tiktok-queue',
    type: 'visitor',
    tier: 3,
    text: 'Recently, I was queuing to enter a club which starts with a \'B\' and ends in \'erghain\'... a group of youths in front of me began \'composing\' a TikTok about getting into the club.',
    mood: 'frustrated',
    source: 'Writer observing queue'
  },
  {
    id: 'tourist-friday-saturday',
    type: 'critic',
    tier: 3,
    text: 'Gradually, Garcia says, Berghain regulars stopped coming Fridays and Saturdays because those nights became dominated by tourists.',
    mood: 'analytical',
    source: 'Rolling Stone'
  },
  {
    id: 'tourist-irish-ketamine',
    type: 'regular',
    tier: 3,
    text: 'On techno sites, like Bodytonic, locals complain that the club has become an attraction \'filled with Irish techno tourists on ketamine.\'',
    mood: 'frustrated',
    source: 'Rolling Stone'
  },
  {
    id: 'tourist-85000-checkins',
    type: 'critic',
    tier: 3,
    text: 'When Berghain opened, there were no smartphones. Now over 85,000 people have checked in at Berghain on Facebook and despite the club\'s no-photography policy, a search for #berghain on Instagram reveals nearly 12,000 posts.',
    mood: 'analytical',
    source: 'Rolling Stone'
  },

  // TIER 4: Brand Empire (2016-2020) - Full Commercialization
  {
    id: 'brand-dont-recognize',
    type: 'regular',
    tier: 4,
    text: 'I don\'t recognize half these faces anymore. Where did everyone go?',
    mood: 'defeated',
    source: 'Community sentiment'
  },
  {
    id: 'brand-inauthentic-tiktok',
    type: 'visitor',
    tier: 4,
    text: 'Making a TikTok is a very inauthentic process to witness.',
    mood: 'frustrated',
    source: 'The Face analysis'
  },
  {
    id: 'brand-becoming-difficult',
    type: 'regular',
    tier: 4,
    text: 'I don\'t want it to end because it\'s a beautiful thing, but all signs point to it becoming more and more difficult to really have the kind of freedom necessary to celebrate our diversity through dance.',
    mood: 'resigned',
    source: 'Jake Basker'
  },
  {
    id: 'brand-authenticity-emotional',
    type: 'critic',
    tier: 4,
    text: 'Debates in Berlin about whether Berghain\'s hype is deserved get emotional quite quickly. The authenticity question looms large.',
    mood: 'analytical',
    source: 'Irish Times'
  },
  {
    id: 'brand-theme-park',
    type: 'critic',
    tier: 4,
    text: 'Ever get the feeling that Berlin is turning into a theme park?',
    mood: 'frustrated',
    source: 'Exberliner magazine'
  },
  {
    id: 'brand-not-zoo',
    type: 'critic',
    tier: 4,
    text: 'Berghain is not a zoo!',
    mood: 'frustrated',
    source: 'Irish Times headline'
  },
  {
    id: 'brand-199-euros',
    type: 'visitor',
    tier: 4,
    text: 'For just €199, the latter-day saviour reportedly offered secure passage to the clubbers\' promised land with a combination of costume, connections and coaching.',
    mood: 'frustrated',
    source: 'Airbnb Berghain entry service'
  },

  // TIER 4-5: #BerghainFits Era - TikTok/Social Media Culture
  {
    id: 'fits-rejected-300',
    type: 'visitor',
    tier: 4,
    text: 'Got rejected from Berghain in my €300 designer harness... guess money can\'t buy authenticity',
    mood: 'bitter',
    source: 'Rejection culture'
  },
  {
    id: 'fits-outfit-formula',
    type: 'visitor',
    tier: 4,
    text: 'Berghain outfit formula: All black + leather accessory + combat boots + \'I don\'t care\' attitude',
    mood: 'obsessive',
    source: 'Social media advice'
  },
  {
    id: 'fits-matrix-sexy',
    type: 'visitor',
    tier: 4,
    text: 'Berghain dress code is basically: dress like you\'re in The Matrix but make it sexy',
    mood: 'obsessive',
    source: 'Social media advice'
  },
  {
    id: 'fits-spent-more-time',
    type: 'visitor',
    tier: 4,
    text: 'Spent more time planning my Berghain outfit than my actual vacation itinerary',
    mood: 'obsessive',
    source: 'Tourist culture'
  },
  {
    id: 'fits-amazon-concerning',
    type: 'visitor',
    tier: 4,
    text: 'Amazon \'Berghain outfit\' search results are... concerning. Please just wear normal black clothes, guys.',
    mood: 'frustrated',
    source: 'Shopping culture'
  },

  // TIER 5: Corporate Asset (2021+) - Full Sell-Out
  {
    id: 'corporate-gentrification-zapped',
    type: 'critic',
    tier: 5,
    text: 'The effects of gentrification – namely, ever-rising rents due to property speculation – as well as the long tail of the pandemic have zapped much local creative power.',
    mood: 'defeated',
    source: 'Lonely Planet analysis'
  },
  {
    id: 'corporate-100-venues',
    type: 'regular',
    tier: 5,
    text: 'Already, some 100 nightlife venues in Berlin have fallen victim to these unwelcome trends.',
    mood: 'defeated',
    source: 'Clubcommission data'
  },
  {
    id: 'corporate-clubsterben',
    type: 'critic',
    tier: 5,
    text: 'The German media has dubbed the phenomenon Clubsterben (club death), with Berlin\'s nightlife association, Clubcommission, citing gentrification as a principal factor.',
    mood: 'defeated',
    source: 'Lonely Planet'
  },
  {
    id: 'corporate-100-to-500',
    type: 'visitor',
    tier: 5,
    text: 'When I got to Berlin 20 years ago you could get a room in a shared flat for €100. That same room now would be €500.',
    mood: 'defeated',
    source: 'Economic reality'
  },
  {
    id: 'corporate-customer-guidelines',
    type: 'staff',
    tier: 5,
    text: 'Corporate sent down new \'customer experience guidelines.\' I miss when this was about music.',
    mood: 'resigned',
    source: 'Staff sentiment'
  },
  {
    id: 'corporate-business-techno',
    type: 'critic',
    tier: 5,
    text: 'Critics decry that \'business techno\' – clubs that put profits ahead of a commitment to the artistic value of emancipation for marginalized people – contributes to ever-rising club-ticket prices.',
    mood: 'analytical',
    source: 'Lonely Planet'
  },
  {
    id: 'corporate-aesthetic-not-political',
    type: 'critic',
    tier: 5,
    text: 'Berlin\'s got this anti-capitalist stance of anti-fashion, but now people see it as an aesthetic rather than a political viewpoint.',
    mood: 'resigned',
    source: 'Cultural analysis'
  },
  {
    id: 'corporate-shein-kit',
    type: 'visitor',
    tier: 5,
    text: 'Nothing says \'authentic Berlin techno scene\' like buying a pre-made Berghain outfit kit on Shein',
    mood: 'sarcastic',
    source: 'Commercialization critique'
  },
  {
    id: 'corporate-20-years',
    type: 'visitor',
    tier: 5,
    text: 'From punk anti-fashion statement to Amazon bestseller \'Berghain starter pack\' in just 20 years',
    mood: 'resigned',
    source: 'Evolution composite'
  },

  // Existential/Philosophical
  {
    id: 'existential-underground-world',
    type: 'critic',
    tier: 3,
    text: 'What does it mean for a club to be underground when the entire world wants to dance there?',
    mood: 'concerned',
    source: 'Rolling Stone'
  },
  {
    id: 'existential-tiktok-ruining',
    type: 'visitor',
    tier: 4,
    text: 'Is TikTok ruining the Berlin club scene? Armed with sunglasses and Berghain entry tips, the new wave ravers are spilling all the secrets on social media.',
    mood: 'frustrated',
    source: 'The Face headline'
  },
  {
    id: 'existential-commodification',
    type: 'critic',
    tier: 5,
    text: 'The commodification of Berghain aesthetics perfectly captures how capitalism absorbs and sells back even its own critique',
    mood: 'resigned',
    source: 'Critical theory'
  },

  // Hope/Resistance
  {
    id: 'hope-pushing-culture',
    type: 'regular',
    tier: 3,
    text: 'Groups, like that behind Kater Blau, are still pushing to keep the culture alive despite the obstacles in its way.',
    mood: 'hopeful',
    source: 'Berlin Beyond Borders'
  },
  {
    id: 'hope-dance-floor',
    type: 'critic',
    tier: 4,
    text: 'Yet some hope remains on the dance floor, thanks to a few new moves on the scene.',
    mood: 'hopeful',
    source: 'Lonely Planet'
  }
];

// Helper function to get quotes for current tier
export const getQuotesForTier = (tier: number): Quote[] => {
  return BERG_QUOTES.filter(quote => quote.tier <= tier);
};

// Helper function to get random quote for tier
export const getRandomQuoteForTier = (tier: number): Quote | null => {
  const availableQuotes = getQuotesForTier(tier);
  if (availableQuotes.length === 0) return null;
  return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
};

// Helper function to get quote by mood
export const getQuoteByMood = (tier: number, mood: Quote['mood']): Quote | null => {
  const availableQuotes = getQuotesForTier(tier).filter(q => q.mood === mood);
  if (availableQuotes.length === 0) return null;
  return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
};