// BergInc Types - Berghain Incremental Game

export interface BergGameState {
  // Core progression
  tier: number; // 0-5
  revenue: number;
  revenuePerSecond: number;
  capacity: number;
  totalCustomers: number;
  
  // Game metadata
  timeElapsed: number; // seconds since start
  lastUpdate: number;
  gameStarted: number;
  
  // KlubNacht system
  klubNacht: KlubNachtState;
  eventHistory: KlubNachtSummary[];
  
  // Upgrades
  upgrades: {
    capacity: number;
    marketing: number;
    amenities: number;
    celebrity: number;
    manager: number; // Automates KlubNacht starting
    bars: number; // Additional bars for revenue
    spaces: number; // Additional spaces (second floor, etc.)
  };
  
  // Cultural metrics (hidden from player)
  authenticity: number; // decreases with tier
  communityHappiness: number;
  
  // Quote system
  unlockedQuotes: Quote[];
  currentQuote: Quote | null;
  quoteChangeTimer: number;
  
  // Visual/Audio state
  currentTheme: VisualTheme;
  activeAudioLoops: number[];
  
  // Multi-space crowd simulation
  clubbers: Clubber[];
  queue: QueuedPerson[];
  maxClubbers: number;
  unlockedSpaces: ClubSpace[];
}

export interface Quote {
  id: string;
  type: 'regular' | 'visitor' | 'staff' | 'dj' | 'critic' | 'influencer';
  tier: number;
  text: string;
  mood: 'grateful' | 'protective' | 'excited' | 'nostalgic' | 'concerned' | 
        'frustrated' | 'resigned' | 'defeated' | 'commercial' | 'sarcastic' | 
        'analytical' | 'hopeful' | 'bitter' | 'anxious' | 'obsessive';
  source?: string;
  unlockCondition?: (state: BergGameState) => boolean;
}

// Journey step type for proper typing
export type JourneyStep = 'entrance' | 'dancefloor' | 'bar' | 'dark_room' | 'panorama_bar' | 'kantine' | 'outdoor' | 'vip' | 'toilets' | 'exit';

export interface Clubber {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  type: 'authentic' | 'curious' | 'tourist' | 'influencer' | 'corporate';
  currentSpace: string;
  journey: JourneyStep[];
  journeyStep: number;
  spentMoney: number;
  entryFee: number;
  timeInClub: number;
  stamina: number; // 0-100, regenerates in toilets
  tiredness: number; // 0-100, increases over time, affects leaving probability
  speed: number;
  pauseTime: number;
  lastMoved: number;
  movementPattern: 'organic' | 'erratic' | 'performative';
}

export interface VisualTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  fontFamily: string;
  lighting: 'dim' | 'mixed' | 'bright';
}

export interface Upgrade {
  id: string;
  name: string;
  category: 'capacity' | 'marketing' | 'amenities' | 'celebrity';
  baseCost: number;
  effect: string;
  warning: string;
  unlockTier: number;
  owned: number;
  maxLevel?: number;
}

export interface ClubSpace {
  id: string;
  name: string;
  unlockTier: number;
  width: number;
  height: number;
  maxCapacity: number;
  revenueMultiplier: number;
}

// Tier definitions
export const TIER_NAMES = [
  'Underground', // 0
  'Word of Mouth', // 1
  'Rising Fame', // 2
  'Tourist Magnet', // 3
  'Brand Empire', // 4
  'Corporate Asset' // 5
];

export const TIER_YEARS = [
  '1995-2000',
  '2001-2005', 
  '2006-2010',
  '2011-2015',
  '2016-2020',
  '2021+'
];

// Theme evolution by tier
export const VISUAL_THEMES: VisualTheme[] = [
  // Tier 0: Underground
  {
    backgroundColor: '#0a0a0a',
    textColor: '#666666', 
    accentColor: '#333333',
    borderColor: '#1a1a1a',
    fontFamily: 'Monaco, "Courier New", monospace',
    lighting: 'dim'
  },
  // Tier 1: Word of Mouth
  {
    backgroundColor: '#0f0f0f',
    textColor: '#777777',
    accentColor: '#404040',
    borderColor: '#2a2a2a',
    fontFamily: 'Monaco, "Courier New", monospace',
    lighting: 'dim'
  },
  // Tier 2: Rising Fame
  {
    backgroundColor: '#1a1a1a',
    textColor: '#888888',
    accentColor: '#0d4f3c',
    borderColor: '#2d2d2d',
    fontFamily: '"Consolas", "Monaco", monospace',
    lighting: 'mixed'
  },
  // Tier 3: Tourist Magnet
  {
    backgroundColor: '#2d2d2d',
    textColor: '#aaaaaa',
    accentColor: '#1a472a',
    borderColor: '#404040',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    lighting: 'mixed'
  },
  // Tier 4: Brand Empire
  {
    backgroundColor: '#f0f0f0',
    textColor: '#333333',
    accentColor: '#ff6b6b',
    borderColor: '#cccccc',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    lighting: 'bright'
  },
  // Tier 5: Corporate Asset
  {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#4ecdc4',
    borderColor: '#e0e0e0',
    fontFamily: '"Arial", "Helvetica", sans-serif',
    lighting: 'bright'
  }
];

// Crowd colors by tier
export const CROWD_COLORS = [
  // Tier 0: Dark, authentic
  ['#1a1a1a', '#2d2d2d', '#404040'],
  // Tier 1: Slightly more variety
  ['#1a1a1a', '#2d2d2d', '#404040', '#0d4f3c'],
  // Tier 2: Mixed crowd
  ['#2d2d2d', '#404040', '#1a1349', '#1a472a'],
  // Tier 3: Tourist invasion
  ['#404040', '#0d4f3c', '#9465e3', '#ff6b6b'],
  // Tier 4: Instagram crowd
  ['#0d4f3c', '#1a472a', '#ff6b6b', '#4ecdc4'],
  // Tier 5: Corporate/performative
  ['#ff6b6b', '#4ecdc4', '#8039f1', '#96ceb4']
];

// Revenue thresholds for tier progression
export const TIER_THRESHOLDS = [
  0,      // Tier 0 (start)
  5000,   // Tier 1
  25000,  // Tier 2
  100000, // Tier 3
  500000, // Tier 4
  2000000 // Tier 5
];

// KlubNacht System Types

export interface KlubNachtState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  type: 'friday' | 'saturday' | 'monday_closing' | 'thursday' | 'wednesday_vip';
  totalRevenue: number;
  entriesCount: number;
  rejectedCount: number;
  barSales: number;
  costs: KlubNachtCosts;
}

export interface KlubNachtCosts {
  staff: number;
  security: number;
  utilities: number;
  dj: number;
  maintenance: number;
}

export interface KlubNachtSummary {
  date: number;
  type: KlubNachtState['type'];
  duration: number; // minutes
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  entriesCount: number;
  rejectedCount: number;
  barSales: number;
  tier: number;
  authenticity: number;
}

export interface QueuedPerson {
  id: string;
  type: Clubber['type'];
  color: string;
  arrivalTime: number;
  willingness: number; // 0-100, how much they want to get in
  rejectionThreshold: number; // based on tier
}

// Space definitions by tier
export const CLUB_SPACES: Record<number, ClubSpace[]> = {
  0: [
    { id: 'entrance', name: 'Entrance', unlockTier: 0, width: 100, height: 40, maxCapacity: 10, revenueMultiplier: 0 },
    { id: 'dancefloor', name: 'Main Floor', unlockTier: 0, width: 300, height: 200, maxCapacity: 50, revenueMultiplier: 1 },
    { id: 'bar', name: 'Bar', unlockTier: 0, width: 80, height: 60, maxCapacity: 15, revenueMultiplier: 2 },
    { id: 'toilets', name: 'Toilets', unlockTier: 0, width: 60, height: 40, maxCapacity: 8, revenueMultiplier: 0 }
  ],
  1: [
    { id: 'dark_room', name: 'Dark Room', unlockTier: 1, width: 120, height: 80, maxCapacity: 20, revenueMultiplier: 0.5 }
  ],
  2: [
    { id: 'panorama_bar', name: 'Panorama Bar', unlockTier: 2, width: 200, height: 120, maxCapacity: 40, revenueMultiplier: 3 }
  ],
  3: [
    { id: 'kantine', name: 'Berghain Kantine', unlockTier: 3, width: 150, height: 100, maxCapacity: 30, revenueMultiplier: 4 }
  ],
  4: [
    { id: 'outdoor', name: 'Outdoor Area', unlockTier: 4, width: 180, height: 140, maxCapacity: 35, revenueMultiplier: 2.5 }
  ],
  5: [
    { id: 'vip', name: 'VIP Section', unlockTier: 5, width: 100, height: 80, maxCapacity: 15, revenueMultiplier: 8 },
    { id: 'gift_shop', name: 'Gift Shop', unlockTier: 5, width: 60, height: 40, maxCapacity: 8, revenueMultiplier: 10 }
  ]
};

// Entry fee progression by tier
export const ENTRY_FEES = [5, 8, 12, 18, 25, 30]; // €

// Rejection rates by tier (% of queue rejected)
export const REJECTION_RATES = [5, 15, 30, 45, 25, 10]; // %