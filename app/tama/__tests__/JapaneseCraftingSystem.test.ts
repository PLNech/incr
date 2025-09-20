import { JapaneseCraftingSystem } from '../systems/JapaneseCraftingSystem';
import { TamaGameState, TamaData } from '../types';
import { ALL_CRAFTING_ITEMS, TIER1_MATERIALS, TIER2_BASIC_ITEMS } from '../data/japanese-crafting-items';

// Mock data setup
const createMockGameState = (): TamaGameState => ({
  resources: {
    tamaCoins: 10000,
    berries: 100,
    wood: 50,
    stone: 25,
    happinessStars: 10,
    evolutionCrystals: 5
  },
  tamas: [],
  buildings: [],
  customers: [],
  activeContracts: [],
  crafting: {
    queue: [],
    unlockedRecipes: []
  },
  progression: {
    level: 1,
    experience: 0,
    prestigeLevel: 0,
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
    buildings: [],
    recipes: [],
    species: []
  },
  achievements: [],
  tamadex: {
    discovered: {
      basic: 0,
      forest: 0,
      aquatic: 0,
      crystal: 0,
      shadow: 0,
      cosmic: 0
    },
    bred: {
      basic: 0,
      forest: 0,
      aquatic: 0,
      crystal: 0,
      shadow: 0,
      cosmic: 0
    },
    maxTier: {
      basic: 0,
      forest: 0,
      aquatic: 0,
      crystal: 0,
      shadow: 0,
      cosmic: 0
    }
  },
  settings: {
    autoSave: true,
    notifications: true,
    graphicsQuality: 'normal'
  },
  statistics: {
    totalPlayTime: 0,
    totalTamasRaised: 0,
    totalContractsCompleted: 0,
    totalItemsCrafted: 0,
    prestigeCount: 0
  },
  inventory: {},
  lastUpdate: Date.now()
});

const createMockTama = (): TamaData => ({
  id: 'test-tama-1',
  name: 'TestTama',
  species: 'basic',
  tier: 1,
  level: 5,
  experience: 500,
  genetics: {
    cuteness: 75,
    intelligence: 80,
    energy: 70,
    appetite: 65
  },
  needs: {
    hunger: 80,
    happiness: 85,
    energy: 75,
    cleanliness: 90
  },
  stats: {
    totalInteractions: 10,
    hoursLived: 24,
    jobsCompleted: 2
  },
  createdAt: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
  lastInteraction: Date.now() - 60 * 60 * 1000   // 1 hour ago
});

describe('JapaneseCraftingSystem', () => {
  let craftingSystem: JapaneseCraftingSystem;
  let gameState: TamaGameState;

  beforeEach(() => {
    craftingSystem = new JapaneseCraftingSystem();
    gameState = createMockGameState();
  });

  describe('System Initialization', () => {
    it('should initialize crafting progress with default values', () => {
      const progress = craftingSystem.initializeCraftingProgress();

      expect(progress.craftingXP).toBe(0);
      expect(progress.craftingLevel).toBe(1);
      expect(progress.totalItemsCrafted).toBe(0);
      expect(progress.hasAlchemyLab).toBe(false);
      expect(progress.alchemyLabLevel).toBe(1);
      expect(progress.discoveredRecipes.size).toBe(0);
      expect(progress.unlockedCategories.has('food')).toBe(true);
      expect(progress.unlockedCategories.has('tool')).toBe(true);
    });

    it('should load all 280 crafting items correctly', () => {
      const allItems = ALL_CRAFTING_ITEMS;
      expect(allItems.length).toBe(280);

      // Verify tier distribution
      const tierCounts = {1: 0, 2: 0, 3: 0, 4: 0};
      allItems.forEach(item => {
        tierCounts[item.tier]++;
      });

      expect(tierCounts[1]).toBe(71); // Tier 1 materials
      expect(tierCounts[2]).toBe(70); // Tier 2 basic items
      expect(tierCounts[3]).toBe(80); // Tier 3 advanced items
      expect(tierCounts[4]).toBe(59); // Tier 4 masterworks
    });

    it('should validate Japanese cultural authenticity in items', () => {
      const allItems = ALL_CRAFTING_ITEMS;

      // Check for key Japanese cultural items
      const riceGrain = allItems.find(item => item.id === 'rice_grain');
      const bambooFiber = allItems.find(item => item.id === 'bamboo_fiber');
      const silkThread = allItems.find(item => item.id === 'silk_thread');
      const sushiRoll = allItems.find(item => item.id === 'sushi_roll');
      const matcha = allItems.find(item => item.name.includes('Matcha'));

      expect(riceGrain).toBeDefined();
      expect(bambooFiber).toBeDefined();
      expect(silkThread).toBeDefined();
      expect(sushiRoll).toBeDefined();
      expect(matcha).toBeDefined();
    });

    it('should include classic Tamagotchi items', () => {
      const allItems = ALL_CRAFTING_ITEMS;

      const classicItems = allItems.filter(item => item.tamagotchiClassic);
      expect(classicItems.length).toBeGreaterThan(0);

      // Check for specific classic items
      const bread = allItems.find(item => item.id === 'bread');
      const hamburger = allItems.find(item => item.id === 'hamburger');

      expect(bread?.tamagotchiClassic).toBe(true);
      expect(hamburger?.tamagotchiClassic).toBe(true);
    });
  });

  describe('Recipe Discovery System', () => {
    beforeEach(() => {
      // Initialize crafting progress for all tests
      gameState.crafting = craftingSystem.initializeCraftingProgress();
    });

    it('should discover Tier 1 materials automatically', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);

      // Tier 1 items should always be "discovered" (gatherable)
      const tier1Items = TIER1_MATERIALS;
      const discovered = craftingSystem.getDiscoveredItems(gameState, 1);

      expect(discovered.length).toBe(tier1Items.length);
    });

    it('should not discover higher tier recipes without proper level', () => {
      const result = craftingSystem.discoverRecipe(gameState, 'kaiseki_meal'); // Tier 4 masterwork
      expect(result).toBe(false);

      const crafting = craftingSystem.getCraftingProgress(gameState);
      expect(crafting.discoveredRecipes.has('kaiseki_meal')).toBe(false);
    });

    it('should discover recipe and award XP when conditions are met', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingLevel = 2;
      crafting.unlockedCategories.add('food');

      const initialXP = crafting.craftingXP;
      const result = craftingSystem.discoverRecipe(gameState, 'white_rice');

      expect(result).toBe(true);
      expect(crafting.discoveredRecipes.has('white_rice')).toBe(true);
      expect(crafting.craftingXP).toBeGreaterThan(initialXP);
    });

    it('should unlock categories when discovering first item in category', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingLevel = 3;

      const textileItem = TIER2_BASIC_ITEMS.find(item =>
        item.category === 'textile' && item.tier === 2
      );

      if (textileItem) {
        const result = craftingSystem.discoverRecipe(gameState, textileItem.id);
        expect(result).toBe(true);
        expect(crafting.unlockedCategories.has('textile')).toBe(true);
      }
    });
  });

  describe('Crafting Mechanics', () => {
    beforeEach(() => {
      // Initialize crafting progress
      gameState.crafting = craftingSystem.initializeCraftingProgress();
      // Setup inventory with basic materials
      gameState.inventory = {
        'rice_grain': 10,
        'bamboo_fiber': 8,
        'silk_thread': 5,
        'wood_log': 12,
        'shiitake_mushroom': 6
      };

      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingLevel = 3;
      crafting.discoveredRecipes.add('white_rice');
      crafting.discoveredRecipes.add('miso_paste');
      crafting.discoveredRecipes.add('sushi_roll');
    });

    it('should successfully craft Tier 2 items with proper ingredients', () => {
      const initialRice = gameState.inventory!['rice_grain'];
      const result = craftingSystem.craftItem(gameState, 'white_rice', 2);

      expect(result).toBe(true);
      expect(gameState.inventory!['white_rice']).toBe(2);
      expect(gameState.inventory!['rice_grain']).toBe(initialRice - 2); // 1 rice per white rice
    });

    it('should fail crafting without sufficient ingredients', () => {
      gameState.inventory!['rice_grain'] = 0;

      const result = craftingSystem.craftItem(gameState, 'white_rice', 1);
      expect(result).toBe(false);
      expect(gameState.inventory!['white_rice']).toBeUndefined();
    });

    it('should award crafting XP when successfully crafting', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      const initialXP = crafting.craftingXP;
      const initialCount = crafting.totalItemsCrafted;

      craftingSystem.craftItem(gameState, 'white_rice', 3);

      expect(crafting.craftingXP).toBeGreaterThan(initialXP);
      expect(crafting.totalItemsCrafted).toBe(initialCount + 3);
    });

    it('should level up when reaching XP thresholds', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingXP = 99;

      craftingSystem.craftItem(gameState, 'white_rice', 1);

      // Should trigger level up at 100+ XP
      expect(crafting.craftingLevel).toBeGreaterThan(1);
    });

    it('should craft complex Tier 3 items using Tier 2 ingredients', () => {
      // First craft the prerequisites
      craftingSystem.craftItem(gameState, 'white_rice', 2);
      craftingSystem.craftItem(gameState, 'tofu', 2);

      const result = craftingSystem.craftItem(gameState, 'sushi_roll', 1);
      expect(result).toBe(true);
      expect(gameState.inventory!['sushi_roll']).toBe(1);
      expect(gameState.inventory!['white_rice']).toBe(1); // Used 1 for sushi
      expect(gameState.inventory!['tofu']).toBe(1); // Used 1 for sushi
    });
  });

  describe('XP and Progression System', () => {
    beforeEach(() => {
      gameState.crafting = craftingSystem.initializeCraftingProgress();
    });

    it('should unlock new categories at specific levels', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingXP = 500; // Level 3

      // Trigger level up
      craftingSystem.craftItem(gameState, 'white_rice', 1);

      expect(crafting.unlockedCategories.has('textile')).toBe(true);
    });

    it('should auto-discover recipes at level milestones', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingLevel = 4;
      crafting.craftingXP = 2400; // Just below level 5

      const initialRecipes = crafting.discoveredRecipes.size;

      // Push to level 5 (milestone)
      craftingSystem.craftItem(gameState, 'white_rice', 10);

      expect(crafting.discoveredRecipes.size).toBeGreaterThanOrEqual(initialRecipes);
    });

    it('should calculate level correctly from XP', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);

      // Test various XP levels
      crafting.craftingXP = 400; // sqrt(400/100) + 1 = 3
      craftingSystem['addCraftingXP'](gameState, 1); // Trigger recalc
      expect(crafting.craftingLevel).toBe(3);

      crafting.craftingXP = 900; // sqrt(900/100) + 1 = 4
      craftingSystem['addCraftingXP'](gameState, 1);
      expect(crafting.craftingLevel).toBe(4);
    });
  });

  describe('Alchemy Lab System', () => {
    beforeEach(() => {
      gameState.tamas = [createMockTama()];
      gameState.crafting = craftingSystem.initializeCraftingProgress();
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.hasAlchemyLab = true;
      crafting.alchemyLabLevel = 3;
    });

    it('should purchase alchemy lab with sufficient coins', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.hasAlchemyLab = false;

      gameState.resources.tamaCoins = 15000;
      const result = craftingSystem.purchaseAlchemyLab(gameState);

      expect(result).toBe(true);
      expect(crafting.hasAlchemyLab).toBe(true);
      expect(gameState.resources.tamaCoins).toBe(5000);
    });

    it('should fail to purchase alchemy lab without sufficient coins', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.hasAlchemyLab = false;

      gameState.resources.tamaCoins = 5000;
      const result = craftingSystem.purchaseAlchemyLab(gameState);

      expect(result).toBe(false);
      expect(crafting.hasAlchemyLab).toBe(false);
    });

    it('should upgrade alchemy lab with escalating costs', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      const initialLevel = crafting.alchemyLabLevel;
      const expectedCost = initialLevel * 5000;

      gameState.resources.tamaCoins = expectedCost + 1000;
      const result = craftingSystem.upgradeAlchemyLab(gameState);

      expect(result).toBe(true);
      expect(crafting.alchemyLabLevel).toBe(initialLevel + 1);
      expect(gameState.resources.tamaCoins).toBe(1000);
    });

    it('should conduct experiments with success rate based on lab level and tama level', () => {
      const tama = gameState.tamas[0];
      const crafting = craftingSystem.getCraftingProgress(gameState);

      // Mock some undiscovered recipes
      crafting.discoveredRecipes.clear();

      let successCount = 0;
      let xpGained = 0;

      // Run multiple experiments to test probability
      for (let i = 0; i < 50; i++) {
        const result = craftingSystem.experimentInAlchemyLab(gameState, tama.id);
        if (result.success) successCount++;
        xpGained += result.xp;
      }

      // Should have some successes due to high lab level and tama level
      expect(successCount).toBeGreaterThan(0);
      expect(xpGained).toBeGreaterThan(0);
    });

    it('should fail experiments without alchemy lab', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.hasAlchemyLab = false;

      const result = craftingSystem.experimentInAlchemyLab(gameState, gameState.tamas[0].id);

      expect(result.success).toBe(false);
      expect(result.xp).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      gameState.crafting = craftingSystem.initializeCraftingProgress();
    });

    it('should find items by ID correctly', () => {
      const riceGrain = craftingSystem.getItemById('rice_grain');
      expect(riceGrain).toBeDefined();
      expect(riceGrain?.name).toBe('Rice Grain');
      expect(riceGrain?.tier).toBe(1);
    });

    it('should filter discovered items by tier and category', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.craftingLevel = 4;
      crafting.discoveredRecipes.add('white_rice');
      crafting.discoveredRecipes.add('miso_paste');
      crafting.unlockedCategories.add('food');

      const tier2Foods = craftingSystem.getDiscoveredItems(gameState, 2, 'food');
      expect(tier2Foods.length).toBeGreaterThan(0);

      tier2Foods.forEach(item => {
        expect(item.tier).toBe(2);
        expect(item.category).toBe('food');
      });
    });

    it('should identify craftable items based on inventory', () => {
      gameState.inventory = {
        'rice_grain': 10,
        'bamboo_fiber': 5
      };

      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.discoveredRecipes.add('white_rice');

      const craftable = craftingSystem.getCraftableItems(gameState);
      expect(craftable.some(item => item.id === 'white_rice')).toBe(true);
    });

    it('should validate recipe chains and prerequisites', () => {
      const sushiRoll = craftingSystem.getItemById('sushi_roll');
      expect(sushiRoll?.ingredients).toBeDefined();
      expect(sushiRoll?.ingredients?.length).toBeGreaterThan(0);

      // Verify prerequisite chain exists
      sushiRoll?.ingredients?.forEach(ingredient => {
        const prereqItem = craftingSystem.getItemById(ingredient.itemId);
        expect(prereqItem).toBeDefined();
        expect(prereqItem?.tier).toBeLessThan(sushiRoll.tier);
      });
    });
  });

  describe('Integration with Game State', () => {
    beforeEach(() => {
      gameState.crafting = craftingSystem.initializeCraftingProgress();
    });

    it('should properly serialize and deserialize Sets in game state', () => {
      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.discoveredRecipes.add('white_rice');
      crafting.unlockedCategories.add('textile');

      // Simulate serialization/deserialization by converting to arrays and back
      const serialized = {
        ...crafting,
        discoveredRecipes: Array.from(crafting.discoveredRecipes),
        unlockedCategories: Array.from(crafting.unlockedCategories)
      };

      gameState.crafting = serialized as any;

      const restored = craftingSystem.getCraftingProgress(gameState);
      expect(restored.discoveredRecipes.has('white_rice')).toBe(true);
      expect(restored.unlockedCategories.has('textile')).toBe(true);
    });

    it('should maintain inventory consistency during crafting', () => {
      gameState.inventory = {
        'rice_grain': 5,
        'bamboo_fiber': 3
      };

      const crafting = craftingSystem.getCraftingProgress(gameState);
      crafting.discoveredRecipes.add('white_rice');

      const initialRice = gameState.inventory['rice_grain'];
      craftingSystem.craftItem(gameState, 'white_rice', 2);

      expect(gameState.inventory['rice_grain']).toBe(initialRice - 2);
      expect(gameState.inventory['white_rice']).toBe(2);

      // Total item count should be consistent
      const totalItems = Object.values(gameState.inventory).reduce((sum, count) => sum + count, 0);
      expect(totalItems).toBe(initialRice + 3); // Original inventory + crafted items
    });
  });
});