// Core type definitions for Tama Bokujō

export type TamaTier = 0 | 1 | 2 | 3; // 90% | 9% | 0.9% | 0.09%
export type TamaMood = 'ecstatic' | 'happy' | 'content' | 'okay' | 'sad' | 'miserable';
export type TamaSpecies = 'basic' | 'forest' | 'aquatic' | 'crystal' | 'shadow' | 'cosmic';

export interface TamaGenetics {
  cuteness: number;    // 1-100, affects customer appeal
  intelligence: number; // 1-100, affects job performance
  energy: number;      // 1-100, affects stamina and job duration
  appetite: number;    // 1-100, affects food consumption rate
}

export interface TamaNeeds {
  hunger: number;      // 0-100, decays over time
  happiness: number;   // 0-100, affected by interactions and other needs
  energy: number;      // 0-100, decays over time, restored by rest
  cleanliness: number; // 0-100, decays over time
}

export interface TamaStats {
  totalInteractions: number;
  hoursLived: number;
  jobsCompleted: number;
}

export interface TamaPersonality {
  traits: string[];
  preferences: {
    favoriteFood: string[];
    favoriteToys: string[];
    socialLevel: number; // 1-10, how much they like other Tamas
  };
}

export interface TamaData {
  id: string;
  name: string;
  species: TamaSpecies;
  tier: TamaTier;
  level: number;
  experience: number;
  genetics: TamaGenetics;
  needs: TamaNeeds;
  stats: TamaStats;
  personality?: TamaPersonality;
  skills?: Record<string, number>;
  createdAt: number;
  lastInteraction: number;
  sleepState?: {
    isAsleep: boolean;
    sleepStartTime: number;
    energyRecoveryRate: number; // energy per minute while sleeping
    canAutoWakeup: boolean; // unlocked through skills/upgrades
  };
}

export interface InteractionResult {
  success: boolean;
  message: string;
  experienceGained: number;
  needsChanged: Partial<TamaNeeds>;
}

// Resources - Redesigned around Japanese Crafting System
export interface GameResources {
  // Primary currency
  tamaCoins: number;

  // Japanese crafting materials (Tier 1 base materials)
  rice_grain: number;        // Food crafting base (replaces berries)
  bamboo_fiber: number;      // Structure/tool base (replaces wood)
  silk_thread: number;       // Textile crafting base
  green_tea_leaf: number;    // Medicine/spiritual base

  // Special resources
  spirit_essence: number;    // High-tier crafting (replaces stone + evolution crystals)
  happinessStars: number;    // Social/prestige purchases (keep)
}

// Crafting
export interface Recipe {
  id: string;
  name: string;
  ingredients: { itemId: string; quantity: number }[];
  outputs: { itemId: string; quantity: number }[];
  craftTime: number; // milliseconds
  requiredLevel: number;
  category: 'food' | 'toy' | 'equipment' | 'building';
}

export interface CraftingQueue {
  id: string;
  recipeId: string;
  startTime: number;
  endTime: number;
  quantity: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'equipment' | 'material';
  tier: TamaTier;
  effects?: {
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
    experienceMultiplier?: number;
  };
  description: string;
}

export interface Building {
  id: string;
  type: string;
  level: number;
  position?: { x: number; y: number };
  condition: number; // 0-100, affects efficiency
  lastProcessed: number;
  config?: {
    autoCraftRecipe?: string;
    targetTamaId?: string;
  };
}

export interface BuildingType {
  id: string;
  name: string;
  description: string;
  category: 'habitat' | 'workshop' | 'automation' | 'decoration' | 'prestige' | 'business' | 'adventure' | 'training' | 'social' | 'management' | 'production' | 'breeding' | 'research';
  cost: Record<string, number>;
  effects: {
    tamaCapacity?: number;
    craftingSpeedMultiplier?: number;
    passiveIncome?: Record<string, number>;
    globalMultiplier?: number;
    automation?: string[];

    // Contract system effects
    contractRewardMultiplier?: number;
    contractDiscoveryRate?: number;
    salesContractBonus?: number;
    bulkContractChance?: number;

    // Adventure system effects
    adventureSuccessRate?: number;
    adventureCooldownReduction?: number;
    adventureRewardMultiplier?: number;
    treasureStorage?: number;

    // Training system effects
    statTrainingEnabled?: boolean;
    skillTrainingEnabled?: boolean;
    trainingSpeedMultiplier?: number;
    experienceBonus?: number;
    specializationUnlock?: boolean;

    // Social system effects
    relationshipGrowthRate?: number;
    socialBonusMultiplier?: number;
    happinessPassiveBonus?: number;
    stressReduction?: number;
    groupActivityBonus?: number;

    // Management effects
    jobAssignmentEnabled?: boolean;
    managementEfficiencyBonus?: number;
    automationLevelIncrease?: number;

    // Production bonuses
    woodCraftingBonus?: number;
    stoneCraftingBonus?: number;

    // Alchemy Lab effects
    alchemyExperimentationEnabled?: boolean;
    recipeDiscoveryRate?: number;
    experimentSuccessBonus?: number;

    // Breeding system effects
    breedingBonus?: number;
    speciesUnlock?: number;
    tierBonusRate?: number;
  };
  jobSlots?: number; // How many Tamas can be assigned to work here
  maxLevel: number;
  requiredLevel: number;
  requiredPrestige?: number;
  unlockConditions?: string[];
}

// JOB ASSIGNMENT SYSTEM
export type TamaJobType =
  | 'trainer'           // Training Ground - improves stat/skill training
  | 'teacher'           // Academy - boosts learning and XP
  | 'social_coordinator' // Social Center - manages relationships
  | 'lumberjack'        // Lumber Mill - increases wood production
  | 'miner'             // Stone Quarry - increases stone production
  | 'manager'           // Employment Center - oversees other jobs
  | 'unemployed';       // Not assigned to any building

export interface TamaJob {
  tamaId: string;
  jobType: TamaJobType;
  buildingId: string;
  startTime: number;
  experience: number;    // Job experience (separate from main XP)
  level: number;         // Job level (1-5)
  efficiency: number;    // How well they perform (0.5-2.0 multiplier)
}

export interface JobEffects {
  // Trainer effects (Training Ground)
  trainer?: {
    statTrainingBonus: number;        // 1.1-1.5x training speed
    trainingQualityBonus: number;     // Better stat gains
  };

  // Teacher effects (Academy)
  teacher?: {
    experienceBonus: number;          // 1.1-1.4x XP for all Tamas
    skillLearningBonus: number;       // Faster skill development
    specializationSlots: number;      // Extra specialization slots
  };

  // Social Coordinator effects (Social Center)
  social_coordinator?: {
    relationshipBonus: number;        // 1.2-1.6x relationship growth
    happinessAura: number;           // +1-3 happiness per hour for all
    conflictReduction: number;       // Reduces negative relationship events
  };

  // Lumberjack effects (Lumber Mill)
  lumberjack?: {
    woodProductionBonus: number;     // 1.2-1.8x wood generation
    craftingWoodBonus: number;       // Cheaper wood costs for crafting
  };

  // Miner effects (Stone Quarry)
  miner?: {
    stoneProductionBonus: number;    // 1.2-1.8x stone generation
    buildingStoneBonus: number;      // Cheaper stone costs for buildings
  };

  // Manager effects (Employment Center)
  manager?: {
    globalEfficiencyBonus: number;   // 1.1-1.3x all job effectiveness
    jobSlotIncrease: number;         // +1 job slot for some buildings
    automationBonus: number;         // Enhanced automation effects
  };
}

export interface BuildingEffects {
  tamaCapacity: number;
  craftingSpeedMultiplier: number;
  globalMultiplier: number;
  passiveIncome: Record<string, number>;
  automation: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'care' | 'breeding' | 'crafting' | 'business' | 'collection' | 'prestige';
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  rewards: {
    tamaCoins?: number;
    skillPoints?: number;
    prestigePoints?: number;
    unlocks?: string[];
  };
}

export interface Milestone {
  level: number;
  name: string;
  description: string;
  rewards: {
    skillPoints: number;
    unlocks?: string[];
    tamaCoins?: number;
    rice_grain?: number;
    bamboo_fiber?: number;
    silk_thread?: number;
    green_tea_leaf?: number;
    spirit_essence?: number;
    happinessStars?: number;
  };
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  prerequisites?: string[];
  effects: Record<string, number>;
}

export interface SkillTree {
  caretaker: Record<string, SkillNode>;
  breeder: Record<string, SkillNode>;
  entrepreneur: Record<string, SkillNode>;
  [key: string]: Record<string, SkillNode>;
}

export interface PrestigeMultipliers {
  experienceGain: number;
  resourceGain: number;
  tamaGrowth: number;
  contractPayment: number;
}

export interface ProgressionStats {
  totalTamasOwned: number;
  totalContractsCompleted: number;
  totalResourcesEarned: number;
  totalTimePlayedMinutes: number;
  highestTamaLevel: number;
  prestigeCount: number;
}

export interface AchievementProgress {
  current: number;
  required: number;
  percentage: number;
}

// Customers and Contracts
export interface Customer {
  id: string;
  name: string;
  archetype: 'casual' | 'demanding' | 'wealthy' | 'collector' | 'breeder';
  preferences: {
    preferredSpecies: TamaSpecies[];
    minTier: TamaTier;
    careRequirements: ('fed' | 'happy' | 'clean' | 'energized')[];
  };
  patience: number; // 1-10, how long they wait
  paymentMultiplier: number; // 0.5-3.0
  reputation: number; // Increases with successful contracts
  lastVisit: number;
}

export interface Contract {
  id: string;
  customerId: string;
  tamaId?: string; // Assigned tama
  requirements: {
    duration: number; // milliseconds
    careLevel: number; // 1-10
    specialRequests: string[];
  };
  payment: {
    baseAmount: number;
    bonuses: { condition: string; amount: number }[];
  };
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

// Progression
export interface PlayerProgression {
  level: number;
  experience: number;
  prestigeLevel: number;
  prestigePoints: number;
  skillPoints: number;
  specialization?: 'caretaker' | 'breeder' | 'entrepreneur';
  skillTree: SkillTree;
  lifetimeStats: ProgressionStats;
}

// Progression system interfaces

// Main game state
export interface TamaGameState {
  resources: GameResources;
  tamas: TamaData[];
  buildings: Building[];
  customers: Customer[];
  activeContracts: Contract[];
  crafting: {
    queue: CraftingQueue[];
    unlockedRecipes: string[];
    // Japanese Crafting System integration
    discoveredRecipes?: Set<string>;
    craftingXP?: number;
    craftingLevel?: number;
    totalItemsCrafted?: number;
    unlockedCategories?: Set<string>;
    hasAlchemyLab?: boolean;
    alchemyLabLevel?: number;
  };
  progression: PlayerProgression;
  unlocks: {
    buildings: string[];
    recipes: string[];
    species: TamaSpecies[];
  };
  achievements: Achievement[];
  tamadex: {
    discovered: Record<TamaSpecies, number>; // Count of each species encountered
    bred: Record<TamaSpecies, number>; // Count bred/created by player
    maxTier: Record<TamaSpecies, TamaTier>; // Highest tier achieved per species
  };
  settings: {
    autoSave: boolean;
    notifications: boolean;
    graphicsQuality: 'minimal' | 'normal' | 'high';
  };
  statistics: {
    totalPlayTime: number;
    totalTamasRaised: number;
    totalContractsCompleted: number;
    totalItemsCrafted: number;
    prestigeCount: number;
    completedAdventures?: string[]; // Adventure location IDs
  };
  inventory?: Record<string, number>; // Adventure items and other inventory
  activeAdventures?: ActiveAdventure[]; // Currently running adventures
  lastUpdate: number;
}

// Event system
export interface GameEvent {
  id: string;
  type: 'interaction' | 'contract' | 'achievement' | 'discovery' | 'news';
  message: string;
  timestamp: number;
  data?: any;
}

export type GameEventCallback = (event: GameEvent) => void;

// Adventure system types
export interface ActiveAdventure {
  id: string;
  locationId: string;
  tamaId: string;
  startTime: number;
  endTime: number;
  successRate: number;
  potentialRewards: AdventureReward[];
}

export interface AdventureReward {
  type: 'resource' | 'item' | 'experience' | 'achievement';
  id: string;
  quantity: number;
  weight: number;
}