// Slow Roast Game Types and Constants

export interface Resources {
  beans: number;
  customers: number;
  money: number;
  reputation: number;
  knowledge: number;
  equipment: number;
  influence: number;
  gentrification: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  education: number; // 0-100 how educated they are about coffee
  preference: 'instant' | 'chain' | 'specialty' | 'third-wave';
  spendingPower: number;
  gentrificationContribution: number;
  description?: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  cost: number;
  beansPerSecond?: number;
  qualityBonus?: number;
  automationLevel?: number;
  emoji: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: (state: SlowRoastGameState) => SlowRoastGameState;
  unlockRequirement?: (state: SlowRoastGameState) => boolean;
  category: 'equipment' | 'training' | 'automation' | 'expansion' | 'research';
  emoji: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: (state: SlowRoastGameState) => boolean;
  reward?: string;
  hidden?: boolean;
  emoji: string;
}

export interface NookEvent {
  day: number;
  message: string;
  unlocks?: string[];
  cost?: number;
  effect?: (state: SlowRoastGameState) => SlowRoastGameState;
}

export interface SlowRoastGameState {
  day: number;
  resources: Resources;
  customerSegments: CustomerSegment[];
  unlockedFeatures: string[];
  automation: Record<string, boolean>;
  achievements: string[];
  playerName?: string;
  shopName?: string;
  nextNookEvent: number;
  gamePhase: 'setup' | 'learning' | 'growing' | 'established' | 'empire';
  purchasedUpgrades: string[];
  dailyEvents: string[];
  gentrificationLevel: number;
}

// Initial customer segments
export const INITIAL_CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'tourists',
    name: 'Tourists',
    size: 45,
    education: 5,
    preference: 'chain',
    spendingPower: 3,
    gentrificationContribution: 0.1,
    description: 'Visitors looking for familiar coffee experiences'
  },
  {
    id: 'locals',
    name: 'Local Residents',
    size: 40,
    education: 15,
    preference: 'instant',
    spendingPower: 2,
    gentrificationContribution: 0,
    description: 'Long-time neighborhood residents with established routines'
  },
  {
    id: 'students',
    name: 'Students',
    size: 15,
    education: 25,
    preference: 'chain',
    spendingPower: 1,
    gentrificationContribution: 0.05,
    description: 'University students on tight budgets but open to new experiences'
  }
];

// James Hoffman wisdom quotes
export const JAMES_HOFFMAN_WISDOM = [
  "The grind is more important than the machine.",
  "Temperature stability beats temperature accuracy.",
  "Light roasts reveal the coffee's true character.",
  "Sugar masks the coffee's natural complexity.",
  "Every coffee tells the story of its origin.",
  "Extraction is the art of controlled dissolution.",
  "The best coffee is the one you enjoy most... but let me tell you why you're wrong.",
  "Espresso is not a roast, it's a brewing method.",
  "The perfect cup doesn't exist, but the pursuit of it is everything.",
  "Coffee is a fruit, and we should treat it with the respect it deserves."
];

// Tom Nook events and interactions
export const NOOK_EVENTS: NookEvent[] = [
  {
    day: 5,
    message: "A friendly raccoon in a business suit stops by. 'Nook Coffee Supplies here! I see you're getting started. You'll need better equipment soon, yes yes?'",
    unlocks: ['equipment_shop']
  },
  {
    day: 15,
    message: "Tom Nook returns: 'My, my! Business is growing! You know, I have some premium bean suppliers... but they're not cheap, yes yes?'",
    unlocks: ['premium_beans']
  },
  {
    day: 30,
    message: "Nook slides a contract across your counter: 'Exclusive supplier deal! Very beneficial! (For me, mostly.) Sign here!'",
    unlocks: ['nook_contracts'],
    cost: 500
  },
  {
    day: 50,
    message: "Nook peers around your bustling café: 'Success! But think bigger, yes yes? Franchise opportunities await!'",
    unlocks: ['franchise_options']
  }
];

// Available equipment upgrades
export const EQUIPMENT_CATALOG: Equipment[] = [
  {
    id: 'burr_grinder',
    name: 'Burr Grinder',
    description: 'Consistent grind size improves extraction quality',
    cost: 150,
    qualityBonus: 0.2,
    emoji: '⚙️'
  },
  {
    id: 'espresso_machine',
    name: 'Espresso Machine',
    description: 'Serve espresso drinks to discerning customers',
    cost: 800,
    beansPerSecond: 0.5,
    qualityBonus: 0.5,
    emoji: '🤖'
  },
  {
    id: 'pour_over_station',
    name: 'Pour Over Station',
    description: 'Manual brewing station for specialty coffee education',
    cost: 200,
    qualityBonus: 0.3,
    emoji: '☕'
  },
  {
    id: 'roasting_setup',
    name: 'Small Batch Roaster',
    description: 'Roast your own beans for ultimate quality control',
    cost: 2000,
    beansPerSecond: 2,
    qualityBonus: 1.0,
    emoji: '🔥'
  }
];

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_day',
    name: 'First Day',
    description: 'Open your coffee shop',
    requirement: (state) => state.day >= 1,
    emoji: '🎉'
  },
  {
    id: 'first_customer',
    name: 'First Customer',
    description: 'Serve your first customer',
    requirement: (state) => state.resources.customers >= 1,
    emoji: '👋'
  },
  {
    id: 'coffee_educator',
    name: 'Coffee Educator',
    description: 'Educate 10 customers about specialty coffee',
    requirement: (state) => state.customerSegments.reduce((sum, seg) => sum + seg.education, 0) >= 100,
    emoji: '🎓'
  },
  {
    id: 'neighborhood_favorite',
    name: 'Neighborhood Favorite',
    description: 'Reach 50 reputation points',
    requirement: (state) => state.resources.reputation >= 50,
    emoji: '⭐'
  },
  {
    id: 'nook_victim',
    name: 'Nook Customer',
    description: 'Make your first purchase from Nook Coffee Supplies',
    requirement: (state) => state.unlockedFeatures.includes('equipment_shop'),
    emoji: '🦝',
    hidden: true
  },
  {
    id: 'coffee_snob',
    name: 'Coffee Snob',
    description: 'Refuse to add sugar to any drinks for 10 days straight',
    requirement: (state) => state.achievements.includes('no_sugar_streak'),
    emoji: '😤',
    hidden: true
  },
  {
    id: 'gentrification_catalyst',
    name: 'Neighborhood Change',
    description: 'Reach 25 gentrification points',
    requirement: (state) => state.resources.gentrification >= 25,
    emoji: '🏗️',
    hidden: true,
    reward: 'Unlock "Premium Neighborhood" customer segment'
  }
];

// Utility functions for game mechanics
export const calculateCustomerVisits = (segment: CustomerSegment, reputation: number): number => {
  const educationFactor = Math.min(segment.education / 100, 0.8);
  const reputationFactor = Math.min(reputation / 100, 0.5);
  const baseVisitChance = 0.1 + educationFactor + reputationFactor;
  
  return Math.floor(segment.size * baseVisitChance * (0.5 + Math.random() * 0.5));
};

export const calculateRevenue = (visitors: number, segment: CustomerSegment, reputation: number): number => {
  const reputationBonus = 1 + Math.min(reputation / 100, 0.5);
  return visitors * segment.spendingPower * reputationBonus;
};

export const getGentrificationMessages = (level: number): string[] => {
  if (level < 10) return ["The neighborhood feels familiar and cozy."];
  if (level < 25) return [
    "You notice more young professionals walking by.",
    "A new boutique opened down the street."
  ];
  if (level < 50) return [
    "Property values are rising in the area.",
    "Some longtime residents seem concerned about changes.",
    "The local newspaper mentions 'revitalization efforts.'"
  ];
  if (level < 75) return [
    "Several traditional shops have closed recently.",
    "New high-end restaurants are opening nearby.",
    "You overhear complaints about rising rents."
  ];
  return [
    "The neighborhood is barely recognizable.",
    "Most original residents have moved away.",
    "Your coffee shop is now considered 'authentic local character.'"
  ];
};