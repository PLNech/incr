import { CraftingSystem } from '../systems/CraftingSystem';
import { createMockGameState, advanceTime, resetTime } from './setup';

describe('CraftingSystem', () => {
  let craftingSystem: CraftingSystem;
  let gameState: ReturnType<typeof createMockGameState>;

  beforeEach(() => {
    gameState = createMockGameState();
    craftingSystem = new CraftingSystem();
    resetTime();
  });

  afterEach(() => {
    resetTime();
  });

  describe('Recipe Management', () => {
    it('should load default recipes', () => {
      const recipes = craftingSystem.getAvailableRecipes(gameState);

      expect(recipes.length).toBeGreaterThan(0);
      expect(recipes.some(r => r.id === 'basic_food')).toBe(true);
      expect(recipes.some(r => r.id === 'simple_toy')).toBe(true);
    });

    it('should filter recipes by unlocked status', () => {
      gameState.crafting.unlockedRecipes = ['basic_food'];
      const recipes = craftingSystem.getAvailableRecipes(gameState);

      expect(recipes.length).toBe(1);
      expect(recipes[0].id).toBe('basic_food');
    });

    it('should filter recipes by required level', () => {
      gameState.progression.level = 1;
      gameState.crafting.unlockedRecipes = ['basic_food', 'premium_food', 'gourmet_food'];

      const recipes = craftingSystem.getAvailableRecipes(gameState);

      // Should only show recipes available at level 1
      recipes.forEach(recipe => {
        expect(recipe.requiredLevel).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Resource Requirements', () => {
    it('should check if resources are available for crafting', () => {
      gameState.resources.berries = 5;
      gameState.resources.wood = 2;

      const canCraftBasicFood = craftingSystem.canCraft('basic_food', gameState);
      expect(canCraftBasicFood).toBe(true);

      gameState.resources.berries = 0;
      const cannotCraftBasicFood = craftingSystem.canCraft('basic_food', gameState);
      expect(cannotCraftBasicFood).toBe(false);
    });

    it('should calculate resource requirements for multiple quantities', () => {
      const requirements = craftingSystem.getResourceRequirements('basic_food', 3);

      expect(requirements).toEqual({
        berries: 6, // 2 berries * 3 quantity
        wood: 3    // 1 wood * 3 quantity
      });
    });
  });

  describe('Crafting Queue', () => {
    it('should add items to crafting queue', () => {
      gameState.resources.berries = 10;
      gameState.resources.wood = 10;

      const result = craftingSystem.startCrafting('basic_food', 2, gameState);

      expect(result.success).toBe(true);
      expect(gameState.crafting.queue.length).toBe(1);
      expect(gameState.crafting.queue[0].recipeId).toBe('basic_food');
      expect(gameState.crafting.queue[0].quantity).toBe(2);
    });

    it('should consume resources when starting to craft', () => {
      gameState.resources.berries = 10;
      gameState.resources.wood = 10;

      craftingSystem.startCrafting('basic_food', 2, gameState);

      expect(gameState.resources.berries).toBe(6); // 10 - (2*2)
      expect(gameState.resources.wood).toBe(8);    // 10 - (1*2)
    });

    it('should fail to craft if insufficient resources', () => {
      gameState.resources.berries = 1;
      gameState.resources.wood = 0;

      const result = craftingSystem.startCrafting('basic_food', 2, gameState);

      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toContain('insufficient resources');
      expect(gameState.crafting.queue.length).toBe(0);
    });

    it('should calculate correct completion time', () => {
      gameState.resources.berries = 10;
      gameState.resources.wood = 10;

      const startTime = Date.now();
      craftingSystem.startCrafting('basic_food', 1, gameState);

      const queueItem = gameState.crafting.queue[0];
      expect(queueItem.startTime).toBeGreaterThanOrEqual(startTime);
      expect(queueItem.endTime).toBe(queueItem.startTime + 5000); // 5 second craft time
    });
  });

  describe('Queue Processing', () => {
    it('should complete crafting when time elapsed', () => {
      gameState.resources.berries = 10;
      gameState.resources.wood = 10;

      craftingSystem.startCrafting('basic_food', 1, gameState);
      expect(gameState.crafting.queue.length).toBe(1);

      // Advance time by 6 seconds (more than 5 second craft time)
      advanceTime(6000);

      const completedItems = craftingSystem.processQueue(gameState);

      expect(completedItems.length).toBe(1);
      expect(completedItems[0].recipeId).toBe('basic_food');
      expect(completedItems[0].quantity).toBe(1);
      expect(gameState.crafting.queue.length).toBe(0);
    });

    it('should not complete crafting before time elapsed', () => {
      gameState.resources.berries = 10;
      gameState.resources.wood = 10;

      craftingSystem.startCrafting('basic_food', 1, gameState);

      // Advance time by only 3 seconds
      advanceTime(3000);

      const completedItems = craftingSystem.processQueue(gameState);

      expect(completedItems.length).toBe(0);
      expect(gameState.crafting.queue.length).toBe(1);
    });
  });

  describe('Quality System', () => {
    it('should generate items with quality tiers', () => {
      // Test requires many iterations due to randomness
      const qualities: number[] = [];

      for (let i = 0; i < 100; i++) {
        const quality = craftingSystem.generateItemQuality();
        qualities.push(quality);
      }

      // Should have mostly tier 0 items (90%)
      const tier0Count = qualities.filter(q => q === 0).length;
      const tier1Count = qualities.filter(q => q === 1).length;
      const tier2Count = qualities.filter(q => q === 2).length;
      const tier3Count = qualities.filter(q => q === 3).length;

      expect(tier0Count).toBeGreaterThan(70); // At least 70% tier 0
      expect(tier1Count).toBeGreaterThan(0);  // Should have some tier 1
      expect(tier2Count + tier3Count).toBeLessThan(10); // High tiers should be rare
    });

    it('should apply quality multipliers to item effects', () => {
      const tier0Item = craftingSystem.applyQuality('basic_food', 0);
      const tier1Item = craftingSystem.applyQuality('basic_food', 1);
      const tier2Item = craftingSystem.applyQuality('basic_food', 2);

      expect(tier1Item.effects?.hunger).toBeGreaterThan(tier0Item.effects?.hunger || 0);
      expect(tier2Item.effects?.hunger).toBeGreaterThan(tier1Item.effects?.hunger || 0);
    });
  });

  describe('Automation', () => {
    it('should support automated crafting buildings', () => {
      // This will be implemented when buildings are added
      expect(craftingSystem.getAutomationLevel).toBeDefined();
    });
  });
});