// Slow Roast v2.0 - Satirical Coffee Gentrification Simulator Types

export interface Resources {
  money: number;
  reputation: number;
  gentrification: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  education: number;
  preference: string;
  spendingPower: number;
  gentrificationContribution: number;
  description: string;
}

export interface CoffeeUpgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  gentrificationImpact: number;
  unlockDay: number;
  satiricalNote: string;
}

export interface DailyEvent {
  type: 'review' | 'news' | 'customer' | 'achievement';
  title: string;
  content: string;
  tone: 'positive' | 'neutral' | 'concerning';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  satiricalName: string;
  requirement: (state: GameState) => boolean;
  unlocked: boolean;
}

export interface GameState {
  // Core progression
  day: number;
  phase: 'setup' | 'innocent' | 'snobbery' | 'realization' | 'ending';
  
  // Resources
  resources: Resources;
  
  // Coffee business
  currentCoffeeLevel: number;
  unlockedUpgrades: string[];
  
  // Customer data
  customerSegments: CustomerSegment[];
  dailyCustomers: number;
  dailyRevenue: number;
  
  // Mrs. García arc
  mrsGarciaStage: 'regular' | 'hesitant' | 'explains' | 'gone';
  mrsGarciaInteractions: number;
  playerHelpedMrsGarcia: boolean;
  
  // Daily events
  todaysEvents: DailyEvent[];
  
  // Achievements & endings
  achievements: Achievement[];
  currentEnding: string | null;
  
  // Player identity
  playerName?: string;
  shopName?: string;
}

// Coffee Snobbery Ladder
export const COFFEE_UPGRADES: CoffeeUpgrade[] = [
  {
    id: 'basic_coffee',
    name: 'Basic Coffee',
    description: 'Simple, honest coffee. Nothing fancy.',
    price: 2,
    cost: 0,
    gentrificationImpact: 0,
    unlockDay: 1,
    satiricalNote: 'Affordable for everyone. How naive.'
  },
  {
    id: 'v60_pourover',
    name: 'V60 Pour-over',
    description: 'Hand-crafted precision brewing.',
    price: 4,
    cost: 150,
    gentrificationImpact: 0.5,
    unlockDay: 3,
    satiricalNote: 'Artisanal excellence. Only €4!'
  },
  {
    id: 'chemex_filtered',
    name: 'Chemex Filtered',
    description: 'Clean, bright, sophisticated.',
    price: 6,
    cost: 300,
    gentrificationImpact: 1.0,
    unlockDay: 6,
    satiricalNote: 'Scientific brewing for cultured palates.'
  },
  {
    id: 'single_origin',
    name: 'Single Origin Ethiopian',
    description: 'Traceable to the exact farm. Ethical sourcing.',
    price: 8,
    cost: 500,
    gentrificationImpact: 1.5,
    unlockDay: 10,
    satiricalNote: 'Supporting farmers! (Just not local ones.)'
  },
  {
    id: 'geisha_varietal',
    name: 'Geisha Varietal',
    description: 'Rare, delicate, transcendent. For true connoisseurs.',
    price: 12,
    cost: 800,
    gentrificationImpact: 2.0,
    unlockDay: 15,
    satiricalNote: 'Exclusivity breeds excellence. And displacement.'
  },
  {
    id: 'competition_grade',
    name: 'Competition Grade',
    description: 'Award-winning beans. Coffee perfection achieved.',
    price: 15,
    cost: 1200,
    gentrificationImpact: 2.5,
    unlockDay: 20,
    satiricalNote: 'When your coffee costs more than minimum wage.'
  },
  {
    id: 'nitrogen_reserve',
    name: 'Nitrogen-Flushed Reserve',
    description: 'Scientifically preserved. Ultimate freshness.',
    price: 20,
    cost: 2000,
    gentrificationImpact: 3.0,
    unlockDay: 25,
    satiricalNote: 'Space-age coffee for earthbound gentrifiers.'
  }
];

// Initial customer segments
export const INITIAL_CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'locals',
    name: 'Local Residents',
    size: 40,
    education: 15,
    preference: 'basic',
    spendingPower: 2,
    gentrificationContribution: 0,
    description: 'Long-time neighborhood residents with established routines'
  },
  {
    id: 'students',
    name: 'Students',
    size: 25,
    education: 25,
    preference: 'chain',
    spendingPower: 1.5,
    gentrificationContribution: 0.1,
    description: 'University students on tight budgets but open to new experiences'
  },
  {
    id: 'tourists',
    name: 'Tourists',
    size: 20,
    education: 10,
    preference: 'chain',
    spendingPower: 3,
    gentrificationContribution: 0.2,
    description: 'Visitors looking for authentic local experiences'
  },
  {
    id: 'young_professionals',
    name: 'Young Professionals',
    size: 15,
    education: 35,
    preference: 'specialty',
    spendingPower: 5,
    gentrificationContribution: 0.5,
    description: 'Tech workers and creatives with disposable income'
  }
];

// Achievements with satirical corporate speak
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_upgrade',
    name: 'Coffee Elevation',
    description: 'Upgrade from basic coffee',
    satiricalName: 'Market Differentiation Specialist',
    requirement: (state) => state.currentCoffeeLevel > 0,
    unlocked: false
  },
  {
    id: 'price_out_locals',
    name: 'Neighborhood Optimization',
    description: 'Coffee price exceeds local comfort zone',
    satiricalName: 'Community Value Enhancement Director',
    requirement: (state) => {
      const currentCoffee = COFFEE_UPGRADES[state.currentCoffeeLevel];
      return currentCoffee?.price >= 6;
    },
    unlocked: false
  },
  {
    id: 'mrs_garcia_gone',
    name: 'Customer Retention Challenge',
    description: 'Lost a longtime customer',
    satiricalName: 'Demographic Transition Facilitator',
    requirement: (state) => state.mrsGarciaStage === 'gone',
    unlocked: false
  },
  {
    id: 'high_gentrification',
    name: 'Neighborhood Transformation',
    description: 'Significantly impact local culture',
    satiricalName: 'Cultural Landscape Architect',
    requirement: (state) => state.resources.gentrification >= 20,
    unlocked: false
  },
  {
    id: 'coffee_moses',
    name: 'Coffee Enlightenment',
    description: 'Reach maximum coffee sophistication',
    satiricalName: 'Artisanal Authenticity Prophet',
    requirement: (state) => state.currentCoffeeLevel >= 6,
    unlocked: false
  }
];

// James Hoffman wisdom quotes
export const COFFEE_WISDOM = [
  "The grind is more important than the machine.",
  "Temperature stability beats temperature accuracy.",
  "Light roasts reveal the coffee's true character.",
  "Sugar masks the coffee's natural complexity.",
  "Every coffee tells the story of its origin.",
  "Extraction is the art of controlled dissolution.",
  "The best coffee is the one you enjoy most... but let me tell you why you're wrong.",
  "Espresso is not a roast, it's a brewing method.",
  "The perfect cup doesn't exist, but the pursuit of it is everything."
];

// Daily review content templates
export const REVIEW_TEMPLATES = {
  yelpReviews: [
    "★★★★★ 'This place is transforming the neighborhood! Finally, quality coffee!'",
    "★★★★★ 'Love how this spot brings culture to the area. Worth every euro!'",
    "★★★★★ 'Amazing single-origin! This neighborhood is really up-and-coming!'",
    "★★★★★ 'Perfect coffee for the creative professional. Neighborhood character!'",
    "★★★★☆ 'Great coffee but getting expensive. Still worth it for the experience.'"
  ],
  newsHeadlines: [
    "Local Coffee Shop Brings Artisanal Culture to Historic Neighborhood",
    "Property Values Rise 15% in Coffee District",
    "Traditional Bakery Closes After 30 Years, Cites Rising Rent",
    "Amsterdam Coffee Scene: From Working Class to World Class",
    "Neighborhood Revitalization: Coffee Shop Leads Cultural Renaissance"
  ],
  instagramCaptions: [
    "Perfect latte art in our little corner of Amsterdam ☕ #CommunitySpace",
    "Single-origin Ethiopian bringing authentic culture to the neighborhood ✨",
    "Nothing like hand-crafted coffee to build real community connections ❤️",
    "This neighborhood's coffee game is seriously leveling up 🚀",
    "Artisanal brewing where tradition meets innovation 🎨"
  ]
};

// Ending paths
export const ENDING_PATHS = {
  sellout: {
    name: 'The Sellout',
    description: 'Full corporate expansion, maximum profit',
    satiricalTitle: 'Caffeine Capitalist - Professional Level'
  },
  purist: {
    name: 'The Purist', 
    description: 'Artisan to the end, cultural destruction through quality',
    satiricalTitle: 'Authentic Authenticity Destroyer'
  },
  hypocrite: {
    name: 'The Hypocrite',
    description: 'Community values rhetoric, elite pricing reality',
    satiricalTitle: 'Sustainable Sustainability Theater Director'
  },
  awakened: {
    name: 'The Awakened',
    description: 'Realizes the problem, limited power to change',
    satiricalTitle: 'Conscious Gentrification Facilitator'
  },
  escape: {
    name: 'The Escape',
    description: 'Abandons before becoming the problem',
    satiricalTitle: 'Ethical Exit Strategy Implementer'
  }
};