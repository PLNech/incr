// Test setup and utilities for Tama Bokujō
// This file contains test utilities and is not a test suite itself
import { TamaEntity } from '../engine/TamaEntity';
import { TamaData } from '../types';

export const mockTamaData = {
  id: 'test-tama-1',
  name: 'TestTama',
  species: 'basic',
  tier: 0,
  level: 1,
  experience: 0,
  genetics: {
    cuteness: 50,
    intelligence: 50,
    energy: 50,
    appetite: 50
  },
  needs: {
    hunger: 100,
    happiness: 100,
    energy: 100,
    cleanliness: 100
  },
  stats: {
    totalInteractions: 0,
    hoursLived: 0,
    jobsCompleted: 0
  },
  createdAt: Date.now(),
  lastInteraction: Date.now(),
  sleepState: {
    isAsleep: false,
    sleepStartTime: 0,
    energyRecoveryRate: 2,
    canAutoWakeup: false
  }
} as TamaData;

// Function to create a new TamaEntity instance for testing
export const mockTamaEntity = (): TamaEntity => {
  const data = {
    ...mockTamaData,
    createdAt: Date.now(),
    lastInteraction: Date.now()
  };
  return new TamaEntity(data);
};

export const createMockTama = () => ({
  id: 'test-tama-1',
  name: 'TestTama',
  species: 'basic',
  tier: 0,
  level: 1,
  experience: 0,
  genetics: {
    cuteness: 50,
    intelligence: 50,
    energy: 50,
    appetite: 50
  },
  needs: {
    hunger: 100,
    happiness: 100,
    energy: 100,
    cleanliness: 100
  },
  stats: {
    totalInteractions: 0,
    hoursLived: 0,
    jobsCompleted: 0
  },
  createdAt: Date.now(),
  lastInteraction: Date.now(),
  sleepState: {
    isAsleep: false,
    sleepStartTime: 0,
    energyRecoveryRate: 2,
    canAutoWakeup: false
  }
});

export const createMockGameState = () => ({
  resources: {
    tamaCoins: 1000,
    berries: 100,
    wood: 50,
    stone: 20,
    happinessStars: 0,
    evolutionCrystals: 10
  },
  tamas: [createMockTama()],
  buildings: [],
  customers: [],
  activeContracts: [],
  crafting: {
    queue: [],
    unlockedRecipes: ['basic_food', 'simple_toy']
  },
  progression: {
    level: 5,
    experience: 0,
    prestigeLevel: 1,
    prestigePoints: 0,
    skillPoints: 0,
    skillTree: {
      caretaker: {},
      breeder: {},
      entrepreneur: {}
    },
    lifetimeStats: {
      totalTamasOwned: 0,
      totalContractsCompleted: 0,
      totalResourcesEarned: 0,
      totalTimePlayedMinutes: 0,
      highestTamaLevel: 0,
      prestigeCount: 0
    }
  },
  unlocks: {
    buildings: ['basic_habitat', 'crafting_workshop', 'berry_farm', 'auto_feeder', 'auto_workshop', 'crystal_generator'],
    recipes: ['basic_food'],
    species: ['basic']
  },
  achievements: [],
  settings: {
    autoSave: true,
    notifications: true
  },
  lastUpdate: Date.now()
});

export const advanceTime = (milliseconds: number) => {
  const now = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(now + milliseconds);
  return now + milliseconds;
};

export const resetTime = () => {
  jest.restoreAllMocks();
};

// Dummy test to prevent Jest from complaining about empty test file
describe('setup utilities', () => {
  it('should export test utilities', () => {
    expect(createMockTama).toBeDefined();
    expect(createMockGameState).toBeDefined();
    expect(advanceTime).toBeDefined();
    expect(resetTime).toBeDefined();
  });
});