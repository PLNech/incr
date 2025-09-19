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
}

export interface InteractionResult {
  success: boolean;
  message: string;
  experienceGained: number;
  needsChanged: Partial<TamaNeeds>;
}

// Resources
export interface GameResources {
  tamaCoins: number;
  berries: number;
  wood: number;
  stone: number;
  happinessStars: number;
  evolutionCrystals: number;
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
  category: 'habitat' | 'workshop' | 'automation' | 'decoration' | 'prestige';
  cost: Record<string, number>;
  effects: {
    tamaCapacity?: number;
    craftingSpeedMultiplier?: number;
    passiveIncome?: Record<string, number>;
    globalMultiplier?: number;
    automation?: string[];
  };
  maxLevel: number;
  requiredLevel: number;
  requiredPrestige?: number;
  unlockConditions?: string[];
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

// Buildings
export interface Building {
  id: string;
  type: 'habitat' | 'workshop' | 'farm' | 'automation';
  name: string;
  level: number;
  capacity: number;
  effects: {
    happinessBonus?: number;
    productionMultiplier?: number;
    automationLevel?: number; // 0-3 (none, basic, advanced, full)
  };
  assignedTamas: string[]; // Tama IDs working here
  position?: { x: number; y: number };
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
  };
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