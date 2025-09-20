import { BuildingType } from '../types';

export const BUILDING_TYPES: BuildingType[] = [
  {
    id: 'basic_habitat',
    name: 'Basic Habitat',
    description: 'A simple habitat that increases Tama capacity',
    category: 'habitat',
    cost: {
      tamaCoins: 50,
      wood: 3
    },
    effects: {
      tamaCapacity: 2
    },
    maxLevel: 5,
    requiredLevel: 1,
    unlockConditions: []
  },
  {
    id: 'luxury_habitat',
    name: 'Luxury Habitat',
    description: 'A premium habitat that greatly increases Tama capacity',
    category: 'habitat',
    cost: {
      tamaCoins: 200,
      wood: 8,
      stone: 4
    },
    effects: {
      tamaCapacity: 5
    },
    maxLevel: 5,
    requiredLevel: 5,
    unlockConditions: []
  },
  {
    id: 'crafting_workshop',
    name: 'Crafting Workshop',
    description: 'Increases crafting speed for all recipes',
    category: 'workshop',
    cost: {
      tamaCoins: 100,
      wood: 5,
      stone: 2
    },
    effects: {
      craftingSpeedMultiplier: 1.5
    },
    maxLevel: 3,
    requiredLevel: 2,
    unlockConditions: []
  },
  {
    id: 'auto_workshop',
    name: 'Auto Workshop',
    description: 'Automatically crafts selected recipes',
    category: 'automation',
    cost: {
      tamaCoins: 300,
      wood: 10,
      stone: 5
    },
    effects: {
      automation: ['auto_craft']
    },
    maxLevel: 3,
    requiredLevel: 4,
    unlockConditions: []
  },
  {
    id: 'berry_farm',
    name: 'Berry Farm',
    description: 'Generates berries over time',
    category: 'workshop',
    cost: {
      tamaCoins: 80,
      wood: 4,
      stone: 1
    },
    effects: {
      passiveIncome: {
        berries: 1 // per minute
      }
    },
    maxLevel: 5,
    requiredLevel: 2,
    unlockConditions: []
  },
  {
    id: 'auto_feeder',
    name: 'Auto Feeder',
    description: 'Automatically feeds hungry Tamas',
    category: 'automation',
    cost: {
      tamaCoins: 150,
      wood: 6,
      stone: 2,
      berries: 20
    },
    effects: {
      automation: ['auto_feed']
    },
    maxLevel: 3,
    requiredLevel: 3,
    unlockConditions: []
  },
  {
    id: 'crystal_generator',
    name: 'Crystal Generator',
    description: 'A prestige building that provides global multipliers',
    category: 'prestige',
    cost: {
      tamaCoins: 2000,
      evolutionCrystals: 5,
      happinessStars: 50
    },
    effects: {
      globalMultiplier: 1.5
    },
    maxLevel: 10,
    requiredLevel: 1,
    requiredPrestige: 1,
    unlockConditions: []
  }
];

export const UPGRADE_COST_MULTIPLIER = 1.8; // Each level costs 80% more
export const BUILDING_DECAY_RATE = 0.1; // Buildings lose 0.1% condition per hour
export const REPAIR_COST_MULTIPLIER = 0.3; // Repairs cost 30% of original building cost
export const DEMOLISH_REFUND_RATE = 0.5; // Get 50% of resources back when demolishing