import { BuildingSystem } from '../systems/BuildingSystem';
import { createMockGameState, advanceTime, resetTime } from './setup';

describe('BuildingSystem', () => {
  let buildingSystem: BuildingSystem;
  let gameState: ReturnType<typeof createMockGameState>;

  beforeEach(() => {
    gameState = createMockGameState();
    buildingSystem = new BuildingSystem();
    resetTime();
  });

  afterEach(() => {
    resetTime();
  });

  describe('Building Placement', () => {
    it('should place buildings in available slots', () => {
      const result = buildingSystem.placeBuilding('basic_habitat', gameState);

      expect(result.success).toBe(true);
      expect(gameState.buildings.length).toBe(1);
      expect(gameState.buildings[0].type).toBe('basic_habitat');
      expect(gameState.buildings[0].level).toBe(1);
    });

    it('should fail to place building if insufficient resources', () => {
      gameState.resources.tamaCoins = 0;
      gameState.resources.bamboo_fiber = 0;

      const result = buildingSystem.placeBuilding('basic_habitat', gameState);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient resources');
      expect(gameState.buildings.length).toBe(0);
    });

    it('should fail to place building if not unlocked', () => {
      const result = buildingSystem.placeBuilding('luxury_habitat', gameState);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not available');
      expect(gameState.buildings.length).toBe(0);
    });

    it('should consume resources when placing buildings', () => {
      const initialCoins = gameState.resources.tamaCoins;
      const initialBamboo = gameState.resources.bamboo_fiber;

      buildingSystem.placeBuilding('basic_habitat', gameState);

      expect(gameState.resources.tamaCoins).toBeLessThan(initialCoins);
      expect(gameState.resources.bamboo_fiber).toBeLessThan(initialBamboo);
    });
  });

  describe('Building Upgrades', () => {
    it('should upgrade buildings to higher levels', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;

      const result = buildingSystem.upgradeBuilding(buildingId, gameState);

      expect(result.success).toBe(true);
      expect(gameState.buildings[0].level).toBe(2);
    });

    it('should fail to upgrade if insufficient resources', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;

      // Drain resources
      gameState.resources.tamaCoins = 0;
      gameState.resources.bamboo_fiber = 0;

      const result = buildingSystem.upgradeBuilding(buildingId, gameState);

      expect(result.success).toBe(false);
      expect(gameState.buildings[0].level).toBe(1);
    });

    it('should apply upgrade cost multipliers', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;

      const coinsBeforeUpgrade = gameState.resources.tamaCoins;
      buildingSystem.upgradeBuilding(buildingId, gameState);

      const level2Cost = coinsBeforeUpgrade - gameState.resources.tamaCoins;

      // Upgrade to level 3 - should cost more
      const coinsBeforeSecondUpgrade = gameState.resources.tamaCoins;
      buildingSystem.upgradeBuilding(buildingId, gameState);

      const level3Cost = coinsBeforeSecondUpgrade - gameState.resources.tamaCoins;

      expect(level3Cost).toBeGreaterThan(level2Cost);
    });

    it('should cap building levels at maximum', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;

      // Try to upgrade beyond max level (should be 5)
      for (let i = 0; i < 10; i++) {
        buildingSystem.upgradeBuilding(buildingId, gameState);
      }

      expect(gameState.buildings[0].level).toBeLessThanOrEqual(5);
    });
  });

  describe('Building Effects', () => {
    it('should apply habitat capacity bonuses', () => {
      const initialCapacity = buildingSystem.getTamaCapacity(gameState);

      buildingSystem.placeBuilding('basic_habitat', gameState);

      const newCapacity = buildingSystem.getTamaCapacity(gameState);
      expect(newCapacity).toBeGreaterThan(initialCapacity);
    });

    it('should apply crafting speed bonuses from workshops', () => {
      // crafting_workshop is already in unlocks from setup
      const result = buildingSystem.placeBuilding('crafting_workshop', gameState);
      expect(result.success).toBe(true);

      const speedBonus = buildingSystem.getCraftingSpeedBonus(gameState);
      expect(speedBonus).toBeGreaterThan(1.0); // 1.0 = no bonus, >1.0 = faster
    });

    it('should generate passive income from income buildings', () => {
      // berry_farm is already in unlocks from setup
      const result = buildingSystem.placeBuilding('berry_farm', gameState);
      expect(result.success).toBe(true);

      const initialRice = gameState.resources.rice_grain;

      // Advance time for passive income
      advanceTime(60000); // 1 minute
      buildingSystem.processBuildings(gameState);

      expect(gameState.resources.rice_grain).toBeGreaterThan(initialRice);
    });

    it('should stack effects from multiple buildings', () => {
      // crafting_workshop is already in unlocks from setup
      buildingSystem.placeBuilding('crafting_workshop', gameState);
      const singleBonus = buildingSystem.getCraftingSpeedBonus(gameState);

      buildingSystem.placeBuilding('crafting_workshop', gameState);
      const doubleBonus = buildingSystem.getCraftingSpeedBonus(gameState);

      expect(doubleBonus).toBeGreaterThan(singleBonus);
    });
  });

  describe('Automation Systems', () => {
    it('should auto-feed Tamas from feeding stations', () => {
      // auto_feeder is already in unlocks from setup
      const result = buildingSystem.placeBuilding('auto_feeder', gameState);
      expect(result.success).toBe(true);

      // Create a hungry Tama
      gameState.tamas[0].needs.hunger = 30;
      const initialHunger = gameState.tamas[0].needs.hunger;

      advanceTime(30000); // 30 seconds
      buildingSystem.processBuildings(gameState);

      expect(gameState.tamas[0].needs.hunger).toBeGreaterThan(initialHunger);
    });

    it('should auto-craft items from workshops', () => {
      // auto_workshop is already in unlocks from setup
      gameState.resources.rice_grain = 100;
      gameState.resources.bamboo_fiber = 100;

      const result = buildingSystem.placeBuilding('auto_workshop', gameState);
      expect(result.success).toBe(true);

      const buildingId = gameState.buildings.find(b => b.type === 'auto_workshop')?.id;
      expect(buildingId).toBeDefined();

      buildingSystem.setAutoCraftingRecipe(buildingId!, 'basic_food', gameState);

      const initialRice = gameState.resources.rice_grain;

      advanceTime(120000); // 2 minutes
      buildingSystem.processBuildings(gameState);

      // Should have consumed resources and created items
      expect(gameState.resources.rice_grain).toBeLessThan(initialRice);
    });

    it('should respect resource limits for automation', () => {
      // auto_feeder is already in unlocks from setup
      const result = buildingSystem.placeBuilding('auto_feeder', gameState);
      expect(result.success).toBe(true);

      // No rice available
      gameState.resources.rice_grain = 0;
      gameState.tamas[0].needs.hunger = 30;
      const initialHunger = gameState.tamas[0].needs.hunger;

      buildingSystem.processBuildings(gameState);

      // Should not feed without rice
      expect(gameState.tamas[0].needs.hunger).toBe(initialHunger);
    });
  });

  describe('Building Information', () => {
    it('should provide available building types', () => {
      const available = buildingSystem.getAvailableBuildings(gameState);

      expect(available.length).toBeGreaterThan(0);
      expect(available[0]).toHaveProperty('id');
      expect(available[0]).toHaveProperty('name');
      expect(available[0]).toHaveProperty('cost');
      expect(available[0]).toHaveProperty('effects');
    });

    it('should filter buildings by unlock status', () => {
      const allBuildings = buildingSystem.getAllBuildingTypes();
      const availableBuildings = buildingSystem.getAvailableBuildings(gameState);

      expect(availableBuildings.length).toBeLessThanOrEqual(allBuildings.length);
    });

    it('should provide building upgrade costs', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;

      const upgradeCost = buildingSystem.getUpgradeCost(buildingId, gameState);

      expect(upgradeCost).toHaveProperty('tamaCoins');
      expect(upgradeCost.tamaCoins).toBeGreaterThan(0);
    });

    it('should calculate total building effects', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      buildingSystem.placeBuilding('basic_habitat', gameState);

      const effects = buildingSystem.getTotalBuildingEffects(gameState);

      expect(effects).toHaveProperty('tamaCapacity');
      expect(effects.tamaCapacity).toBeGreaterThan(0);
    });
  });

  describe('Building Management', () => {
    it('should remove buildings and refund partial resources', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const buildingId = gameState.buildings[0].id;
      const coinsBeforeRemoval = gameState.resources.tamaCoins;

      const result = buildingSystem.removeBuilding(buildingId, gameState);

      expect(result.success).toBe(true);
      expect(gameState.buildings.length).toBe(0);
      expect(gameState.resources.tamaCoins).toBeGreaterThan(coinsBeforeRemoval);
    });

    it('should handle building repairs when damaged', () => {
      buildingSystem.placeBuilding('basic_habitat', gameState);
      const building = gameState.buildings[0];

      // Simulate building damage
      building.condition = 50;

      const result = buildingSystem.repairBuilding(building.id, gameState);

      expect(result.success).toBe(true);
      expect(building.condition).toBeGreaterThan(50);
    });

    it('should track building statistics', () => {
      // berry_farm is already in unlocks from setup
      buildingSystem.placeBuilding('basic_habitat', gameState);
      buildingSystem.placeBuilding('berry_farm', gameState);

      const stats = buildingSystem.getBuildingStats(gameState);

      expect(stats.totalBuildings).toBe(2);
      expect(stats.buildingTypes).toContain('basic_habitat');
      expect(stats.buildingTypes).toContain('berry_farm');
    });
  });

  describe('Prestige Buildings', () => {
    it('should unlock prestige buildings after reset', () => {
      gameState.progression.prestigeLevel = 1;
      gameState.unlocks.buildings.push('crystal_generator');

      const available = buildingSystem.getAvailableBuildings(gameState);
      const hasPrestigeBuilding = available.some(b => b.id === 'crystal_generator');

      expect(hasPrestigeBuilding).toBe(true);
    });

    it('should provide massive bonuses for prestige buildings', () => {
      gameState.progression.prestigeLevel = 1;
      gameState.unlocks.buildings.push('crystal_generator');
      gameState.resources.spirit_essence = 10;

      buildingSystem.placeBuilding('crystal_generator', gameState);

      const effects = buildingSystem.getTotalBuildingEffects(gameState);
      expect(effects.globalMultiplier).toBeGreaterThan(1.0);
    });
  });
});