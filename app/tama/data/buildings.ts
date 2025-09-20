import { BuildingType } from '../types';

export const BUILDING_TYPES: BuildingType[] = [
  // Tama Creation Enhancement Buildings
  {
    id: 'nursery',
    name: 'Nursery',
    description: 'Advanced breeding facility that enhances Tama creation with extra trait points',
    category: 'breeding',
    cost: {
      tamaCoins: 300,
      bamboo_fiber: 10,
      silk_thread: 5
    },
    effects: {
      tamaCapacity: 1,
      breedingBonus: 1
    },
    maxLevel: 10,
    requiredLevel: 4,
    unlockConditions: []
  },
  {
    id: 'research_lab',
    name: 'Research Lab',
    description: 'Unlocks rare species and tier bonuses for Tama creation',
    category: 'research',
    cost: {
      tamaCoins: 500,
      bamboo_fiber: 8,
      spirit_essence: 3
    },
    effects: {
      speciesUnlock: 1,
      tierBonusRate: 0.1
    },
    maxLevel: 5,
    requiredLevel: 6,
    unlockConditions: []
  },
  {
    id: 'basic_habitat',
    name: 'Basic Habitat',
    description: 'A simple habitat that increases Tama capacity',
    category: 'habitat',
    cost: {
      tamaCoins: 50,
      bamboo_fiber: 3
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
      bamboo_fiber: 8,
      spirit_essence: 2
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
      bamboo_fiber: 5,
      silk_thread: 3
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
    id: 'rice_farm',
    name: 'Rice Farm',
    description: 'Traditional rice paddies that generate rice grain over time',
    category: 'workshop',
    cost: {
      tamaCoins: 80,
      rice_grain: 15,
      bamboo_fiber: 4
    },
    effects: {
      passiveIncome: {
        rice_grain: 1 // per minute
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
  },

  // CONTRACT SYSTEM BUILDINGS
  {
    id: 'business_office',
    name: 'Business Office',
    description: 'Attracts better contract opportunities and increases contract rewards',
    category: 'business',
    cost: {
      tamaCoins: 250,
      wood: 8,
      stone: 3
    },
    effects: {
      contractRewardMultiplier: 1.3,
      contractDiscoveryRate: 2 // 2x more contract offers
    },
    maxLevel: 5,
    requiredLevel: 3,
    unlockConditions: []
  },
  {
    id: 'market_stall',
    name: 'Market Stall',
    description: 'Improves sales contract prices and attracts bulk buyers',
    category: 'business',
    cost: {
      tamaCoins: 180,
      wood: 6,
      berries: 30
    },
    effects: {
      salesContractBonus: 1.4, // 40% better prices for sales contracts
      bulkContractChance: 0.2 // 20% chance for bulk sales contracts
    },
    maxLevel: 4,
    requiredLevel: 2,
    unlockConditions: []
  },

  // ADVENTURE SYSTEM BUILDINGS
  {
    id: 'expedition_lodge',
    name: 'Expedition Lodge',
    description: 'Provides rest and preparation bonuses for adventures',
    category: 'adventure',
    cost: {
      tamaCoins: 320,
      wood: 12,
      stone: 6
    },
    effects: {
      adventureSuccessRate: 1.25, // 25% better success rates
      adventureCooldownReduction: 0.3 // 30% faster cooldowns
    },
    maxLevel: 4,
    requiredLevel: 4,
    unlockConditions: []
  },
  {
    id: 'treasure_vault',
    name: 'Treasure Vault',
    description: 'Safely stores and multiplies adventure rewards',
    category: 'adventure',
    cost: {
      tamaCoins: 500,
      stone: 15,
      happinessStars: 20
    },
    effects: {
      adventureRewardMultiplier: 1.5,
      treasureStorage: 100 // Can store extra valuable items
    },
    maxLevel: 3,
    requiredLevel: 6,
    unlockConditions: []
  },

  // TRAINING SYSTEM BUILDINGS
  {
    id: 'training_ground',
    name: 'Training Ground',
    description: 'Allows Tamas to train and improve their physical stats',
    category: 'training',
    cost: {
      tamaCoins: 200,
      wood: 8,
      stone: 4
    },
    effects: {
      statTrainingEnabled: true,
      trainingSpeedMultiplier: 1.0
    },
    jobSlots: 2, // Can assign 2 Tamas as trainers
    maxLevel: 5,
    requiredLevel: 3,
    unlockConditions: []
  },
  {
    id: 'academy',
    name: 'Tama Academy',
    description: 'Advanced learning center for skill development and specialization',
    category: 'training',
    cost: {
      tamaCoins: 400,
      wood: 15,
      stone: 8,
      happinessStars: 10
    },
    effects: {
      skillTrainingEnabled: true,
      experienceBonus: 1.2, // 20% more XP from all sources
      specializationUnlock: true
    },
    jobSlots: 1, // Can assign 1 Tama as head teacher
    maxLevel: 4,
    requiredLevel: 5,
    unlockConditions: []
  },

  // RELATIONSHIP SYSTEM BUILDINGS
  {
    id: 'social_center',
    name: 'Social Center',
    description: 'Helps Tamas form stronger relationships and provides social bonuses',
    category: 'social',
    cost: {
      tamaCoins: 280,
      wood: 10,
      berries: 40
    },
    effects: {
      relationshipGrowthRate: 1.5, // 50% faster relationship building
      socialBonusMultiplier: 1.3 // Better bonuses from relationships
    },
    jobSlots: 1, // Can assign 1 Tama as social coordinator
    maxLevel: 4,
    requiredLevel: 4,
    unlockConditions: []
  },
  {
    id: 'community_garden',
    name: 'Community Garden',
    description: 'Peaceful space where Tamas can relax and bond together',
    category: 'social',
    cost: {
      tamaCoins: 350,
      wood: 12,
      stone: 5,
      berries: 50
    },
    effects: {
      happinessPassiveBonus: 2, // +2 happiness per hour for all Tamas
      stressReduction: 1.4, // 40% stress reduction
      groupActivityBonus: 1.2
    },
    maxLevel: 5,
    requiredLevel: 5,
    unlockConditions: []
  },

  // EMPLOYMENT/MANAGEMENT BUILDING (Pole Emploi style)
  {
    id: 'employment_center',
    name: 'Employment Center',
    description: 'Assigns Tamas to building management roles, automating various functions',
    category: 'management',
    cost: {
      tamaCoins: 500,
      wood: 20,
      stone: 10,
      happinessStars: 15
    },
    effects: {
      jobAssignmentEnabled: true,
      managementEfficiencyBonus: 1.25,
      automationLevelIncrease: 1
    },
    maxLevel: 3,
    requiredLevel: 6,
    unlockConditions: []
  },

  // CRAFTING SYSTEM BUILDINGS
  {
    id: 'alchemy_lab',
    name: 'Alchemy Lab',
    description: 'Experimental laboratory where Tamas can discover new recipes through dangerous experiments',
    category: 'workshop',
    cost: {
      tamaCoins: 10000,
      bamboo_fiber: 20,
      spirit_essence: 5,
      silk_thread: 10
    },
    effects: {
      alchemyExperimentationEnabled: true,
      recipeDiscoveryRate: 1.0,
      experimentSuccessBonus: 0.1 // 10% base success rate bonus
    },
    jobSlots: 3, // Can assign 3 Tamas as lab assistants
    maxLevel: 10,
    requiredLevel: 5,
    unlockConditions: []
  },

  // SPECIALIZED PRODUCTION BUILDINGS
  {
    id: 'lumber_mill',
    name: 'Lumber Mill',
    description: 'Processes wood more efficiently and generates passive wood income',
    category: 'production',
    cost: {
      tamaCoins: 300,
      wood: 25,
      stone: 8
    },
    effects: {
      passiveIncome: {
        wood: 0.5 // per minute
      },
      woodCraftingBonus: 1.3
    },
    jobSlots: 1,
    maxLevel: 4,
    requiredLevel: 4,
    unlockConditions: []
  },
  {
    id: 'stone_quarry',
    name: 'Stone Quarry',
    description: 'Extracts and processes stone for construction projects',
    category: 'production',
    cost: {
      tamaCoins: 450,
      wood: 15,
      stone: 20
    },
    effects: {
      passiveIncome: {
        stone: 0.3 // per minute
      },
      stoneCraftingBonus: 1.4
    },
    jobSlots: 2,
    maxLevel: 4,
    requiredLevel: 5,
    unlockConditions: []
  }
];

export const UPGRADE_COST_MULTIPLIER = 1.8; // Each level costs 80% more
export const BUILDING_DECAY_RATE = 0.1; // Buildings lose 0.1% condition per hour
export const REPAIR_COST_MULTIPLIER = 0.3; // Repairs cost 30% of original building cost
export const DEMOLISH_REFUND_RATE = 0.5; // Get 50% of resources back when demolishing