import { TamaTier } from '../types';

export interface AdventureLocation {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredLevel: number;
  baseDuration: number; // minutes
  baseSuccessRate: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  rewards: {
    common: AdventureReward[];
    uncommon: AdventureReward[];
    rare: AdventureReward[];
  };
  costs?: {
    tamaCoins?: number;
    berries?: number;
    evolutionCrystals?: number;
    energy: number; // Energy cost for the Tama
  };
  unlockConditions?: {
    completedAdventures?: string[]; // Adventure IDs that must be completed
    minimumTamaLevel?: number;
    minimumTier?: TamaTier;
  };
}

export interface AdventureReward {
  type: 'resource' | 'item' | 'experience' | 'achievement';
  id: string;
  quantity: number;
  weight: number; // Higher = more likely
}

export const ADVENTURE_LOCATIONS: AdventureLocation[] = [
  {
    id: 'farm_edge',
    name: 'Farm Edge',
    description: 'Safe exploration around the familiar farm area. Perfect for beginners!',
    icon: '🌾',
    requiredLevel: 1,
    baseDuration: 15, // 15 minutes
    baseSuccessRate: 0.95,
    riskLevel: 'low',
    costs: {
      energy: 20
    },
    rewards: {
      common: [
        { type: 'resource', id: 'berries', quantity: 3, weight: 100 },
        { type: 'resource', id: 'wood', quantity: 1, weight: 80 },
        { type: 'experience', id: 'tama_xp', quantity: 5, weight: 60 }
      ],
      uncommon: [
        { type: 'resource', id: 'berries', quantity: 6, weight: 30 },
        { type: 'resource', id: 'wood', quantity: 2, weight: 25 },
        { type: 'item', id: 'shiny_pebble', quantity: 1, weight: 15 }
      ],
      rare: [
        { type: 'resource', id: 'stone', quantity: 1, weight: 5 },
        { type: 'achievement', id: 'first_explorer', quantity: 1, weight: 3 }
      ]
    }
  },
  {
    id: 'nearby_forest',
    name: 'Nearby Forest',
    description: 'A lush forest with mysterious sounds. More rewards, but watch for wild creatures!',
    icon: '🌲',
    requiredLevel: 3,
    baseDuration: 30,
    baseSuccessRate: 0.80,
    riskLevel: 'medium',
    costs: {
      tamaCoins: 10,
      energy: 35
    },
    rewards: {
      common: [
        { type: 'resource', id: 'wood', quantity: 3, weight: 100 },
        { type: 'resource', id: 'berries', quantity: 5, weight: 70 },
        { type: 'item', id: 'forest_herb', quantity: 1, weight: 40 }
      ],
      uncommon: [
        { type: 'resource', id: 'wood', quantity: 6, weight: 40 },
        { type: 'item', id: 'rare_mushroom', quantity: 1, weight: 25 },
        { type: 'resource', id: 'stone', quantity: 2, weight: 30 }
      ],
      rare: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 1, weight: 8 },
        { type: 'item', id: 'ancient_seed', quantity: 1, weight: 5 }
      ]
    },
    unlockConditions: {
      completedAdventures: ['farm_edge']
    }
  },
  {
    id: 'deep_river',
    name: 'Deep River',
    description: 'Crystal clear waters hide treasures below. Strong currents make this dangerous!',
    icon: '🏞️',
    requiredLevel: 6,
    baseDuration: 45,
    baseSuccessRate: 0.70,
    riskLevel: 'medium',
    costs: {
      tamaCoins: 25,
      berries: 5,
      energy: 50
    },
    rewards: {
      common: [
        { type: 'resource', id: 'stone', quantity: 2, weight: 90 },
        { type: 'item', id: 'river_pearl', quantity: 1, weight: 50 },
        { type: 'experience', id: 'tama_xp', quantity: 15, weight: 70 }
      ],
      uncommon: [
        { type: 'resource', id: 'stone', quantity: 4, weight: 35 },
        { type: 'item', id: 'water_crystal', quantity: 1, weight: 20 },
        { type: 'resource', id: 'happinessStars', quantity: 1, weight: 15 }
      ],
      rare: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 2, weight: 10 },
        { type: 'item', id: 'legendary_scale', quantity: 1, weight: 3 }
      ]
    },
    unlockConditions: {
      completedAdventures: ['nearby_forest'],
      minimumTamaLevel: 3
    }
  },
  {
    id: 'mountain_caves',
    name: 'Mountain Caves',
    description: 'Dark caves filled with precious minerals. Cave-ins and monsters lurk within!',
    icon: '🏔️',
    requiredLevel: 10,
    baseDuration: 60,
    baseSuccessRate: 0.60,
    riskLevel: 'high',
    costs: {
      tamaCoins: 50,
      berries: 10,
      energy: 70
    },
    rewards: {
      common: [
        { type: 'resource', id: 'stone', quantity: 4, weight: 100 },
        { type: 'resource', id: 'tamaCoins', quantity: 30, weight: 80 },
        { type: 'item', id: 'cave_gem', quantity: 1, weight: 60 }
      ],
      uncommon: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 1, weight: 40 },
        { type: 'item', id: 'rare_ore', quantity: 1, weight: 25 },
        { type: 'resource', id: 'happinessStars', quantity: 2, weight: 20 }
      ],
      rare: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 3, weight: 15 },
        { type: 'item', id: 'dragon_egg_fragment', quantity: 1, weight: 5 },
        { type: 'achievement', id: 'cave_explorer', quantity: 1, weight: 8 }
      ]
    },
    unlockConditions: {
      completedAdventures: ['deep_river'],
      minimumTamaLevel: 5,
      minimumTier: 1
    }
  },
  {
    id: 'sky_temple',
    name: 'Sky Temple',
    description: 'An ancient floating temple above the clouds. Only the bravest Tamas dare venture here!',
    icon: '☁️',
    requiredLevel: 15,
    baseDuration: 90,
    baseSuccessRate: 0.45,
    riskLevel: 'extreme',
    costs: {
      tamaCoins: 100,
      berries: 20,
      evolutionCrystals: 1,
      energy: 90
    },
    rewards: {
      common: [
        { type: 'resource', id: 'happinessStars', quantity: 3, weight: 70 },
        { type: 'resource', id: 'evolutionCrystals', quantity: 2, weight: 80 },
        { type: 'experience', id: 'tama_xp', quantity: 50, weight: 90 }
      ],
      uncommon: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 5, weight: 30 },
        { type: 'item', id: 'sky_essence', quantity: 1, weight: 25 },
        { type: 'resource', id: 'tamaCoins', quantity: 200, weight: 35 }
      ],
      rare: [
        { type: 'item', id: 'cosmic_feather', quantity: 1, weight: 10 },
        { type: 'resource', id: 'evolutionCrystals', quantity: 10, weight: 8 },
        { type: 'achievement', id: 'sky_walker', quantity: 1, weight: 5 }
      ]
    },
    unlockConditions: {
      completedAdventures: ['mountain_caves'],
      minimumTamaLevel: 8,
      minimumTier: 2
    }
  },
  {
    id: 'void_rift',
    name: 'Void Rift',
    description: 'A tear in reality itself. Ultimate rewards await those who survive the void...',
    icon: '🌌',
    requiredLevel: 25,
    baseDuration: 120,
    baseSuccessRate: 0.30,
    riskLevel: 'extreme',
    costs: {
      tamaCoins: 500,
      berries: 50,
      evolutionCrystals: 5,
      energy: 100
    },
    rewards: {
      common: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 5, weight: 60 },
        { type: 'resource', id: 'happinessStars', quantity: 10, weight: 70 },
        { type: 'experience', id: 'tama_xp', quantity: 100, weight: 80 }
      ],
      uncommon: [
        { type: 'resource', id: 'evolutionCrystals', quantity: 15, weight: 25 },
        { type: 'item', id: 'void_essence', quantity: 1, weight: 20 },
        { type: 'resource', id: 'tamaCoins', quantity: 1000, weight: 30 }
      ],
      rare: [
        { type: 'item', id: 'reality_shard', quantity: 1, weight: 5 },
        { type: 'resource', id: 'evolutionCrystals', quantity: 50, weight: 3 },
        { type: 'achievement', id: 'void_master', quantity: 1, weight: 2 }
      ]
    },
    unlockConditions: {
      completedAdventures: ['sky_temple'],
      minimumTamaLevel: 15,
      minimumTier: 3
    }
  }
];

export const ADVENTURE_ITEMS = {
  'shiny_pebble': { name: 'Shiny Pebble', description: 'A pretty pebble that sparkles in the light', sellValue: 5 },
  'forest_herb': { name: 'Forest Herb', description: 'A healing herb found in deep woods', sellValue: 15 },
  'rare_mushroom': { name: 'Rare Mushroom', description: 'A valuable fungus with magical properties', sellValue: 25 },
  'ancient_seed': { name: 'Ancient Seed', description: 'A seed from a long-extinct plant', sellValue: 100 },
  'river_pearl': { name: 'River Pearl', description: 'A lustrous pearl from the deep waters', sellValue: 20 },
  'water_crystal': { name: 'Water Crystal', description: 'A crystal that holds the essence of pure water', sellValue: 40 },
  'legendary_scale': { name: 'Legendary Scale', description: 'Scale from a mythical river dragon', sellValue: 200 },
  'cave_gem': { name: 'Cave Gem', description: 'A precious gem found deep underground', sellValue: 35 },
  'rare_ore': { name: 'Rare Ore', description: 'Valuable metallic ore with unknown properties', sellValue: 60 },
  'dragon_egg_fragment': { name: 'Dragon Egg Fragment', description: 'A piece of an ancient dragon egg', sellValue: 500 },
  'sky_essence': { name: 'Sky Essence', description: 'Bottled essence of the heavens themselves', sellValue: 150 },
  'cosmic_feather': { name: 'Cosmic Feather', description: 'A feather from a celestial being', sellValue: 1000 },
  'void_essence': { name: 'Void Essence', description: 'Pure essence of the void between worlds', sellValue: 500 },
  'reality_shard': { name: 'Reality Shard', description: 'A fragment of reality itself - immensely valuable', sellValue: 5000 }
};