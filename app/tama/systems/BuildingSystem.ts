import { TamaGameState, Building, BuildingType, BuildingEffects } from '../types';
import { BUILDING_TYPES, UPGRADE_COST_MULTIPLIER, BUILDING_DECAY_RATE, REPAIR_COST_MULTIPLIER, DEMOLISH_REFUND_RATE } from '../data/buildings';

export interface BuildingResult {
  success: boolean;
  message: string;
  buildingId?: string;
}

export interface BuildingStats {
  totalBuildings: number;
  buildingTypes: string[];
  totalValue: number;
}

export class BuildingSystem {
  private buildingTypes: BuildingType[];

  constructor() {
    this.buildingTypes = [...BUILDING_TYPES];
  }

  // Building placement
  placeBuilding(buildingTypeId: string, gameState: TamaGameState): BuildingResult {
    const buildingType = this.getBuildingType(buildingTypeId);
    if (!buildingType) {
      return {
        success: false,
        message: `Building type ${buildingTypeId} not found`
      };
    }

    // Check if building is available
    if (!this.isBuildingAvailable(buildingTypeId, gameState)) {
      return {
        success: false,
        message: `${buildingType.name} is not available`
      };
    }

    // Check resources
    if (!this.canAffordBuilding(buildingTypeId, gameState)) {
      return {
        success: false,
        message: `Insufficient resources for ${buildingType.name}`
      };
    }

    // Consume resources
    this.consumeBuildingCost(buildingType.cost, gameState);

    // Create building
    const building: Building = {
      id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: buildingTypeId,
      level: 1,
      condition: 100,
      lastProcessed: Date.now()
    };

    gameState.buildings.push(building);

    return {
      success: true,
      message: `${buildingType.name} built successfully`,
      buildingId: building.id
    };
  }

  // Building upgrades
  upgradeBuilding(buildingId: string, gameState: TamaGameState): BuildingResult {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) {
      return {
        success: false,
        message: 'Building not found'
      };
    }

    const buildingType = this.getBuildingType(building.type);
    if (!buildingType) {
      return {
        success: false,
        message: 'Building type not found'
      };
    }

    if (building.level >= buildingType.maxLevel) {
      return {
        success: false,
        message: 'Building is already at maximum level'
      };
    }

    const upgradeCost = this.getUpgradeCost(buildingId, gameState);
    if (!this.canAffordCost(upgradeCost, gameState)) {
      return {
        success: false,
        message: 'Insufficient resources for upgrade'
      };
    }

    // Consume resources
    this.consumeBuildingCost(upgradeCost, gameState);

    // Upgrade building
    building.level++;

    return {
      success: true,
      message: `${buildingType.name} upgraded to level ${building.level}`
    };
  }

  // Building effects
  getTamaCapacity(gameState: TamaGameState): number {
    let capacity = 3; // Base capacity

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType?.effects.tamaCapacity) {
        const efficiency = this.getBuildingEfficiency(building);
        capacity += Math.floor(buildingType.effects.tamaCapacity * building.level * efficiency);
      }
    });

    return capacity;
  }

  getCraftingSpeedBonus(gameState: TamaGameState): number {
    let multiplier = 1.0;

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType?.effects.craftingSpeedMultiplier) {
        const efficiency = this.getBuildingEfficiency(building);
        const bonus = (buildingType.effects.craftingSpeedMultiplier - 1) * building.level * efficiency;
        multiplier += bonus;
      }
    });

    return multiplier;
  }

  // Building processing
  processBuildings(gameState: TamaGameState): void {
    const now = Date.now();

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (!buildingType) return;

      const timeSinceLastProcess = now - building.lastProcessed;
      const efficiency = this.getBuildingEfficiency(building);

      // Process passive income
      if (buildingType.effects.passiveIncome) {
        this.processPassiveIncome(building, buildingType, timeSinceLastProcess, efficiency, gameState);
      }

      // Process automation
      if (buildingType.effects.automation) {
        this.processAutomation(building, buildingType, efficiency, gameState);
      }

      // Decay building condition
      this.processBuildingDecay(building, timeSinceLastProcess);

      building.lastProcessed = now;
    });
  }

  private processPassiveIncome(
    building: Building,
    buildingType: BuildingType,
    timeDelta: number,
    efficiency: number,
    gameState: TamaGameState
  ): void {
    if (!buildingType.effects.passiveIncome) return;

    const minutesElapsed = timeDelta / 60000;

    Object.entries(buildingType.effects.passiveIncome).forEach(([resource, baseRate]) => {
      const amount = Math.floor(baseRate * building.level * efficiency * minutesElapsed);
      if (amount > 0 && resource in gameState.resources) {
        (gameState.resources as any)[resource] += amount;
      }
    });
  }

  private processAutomation(
    building: Building,
    buildingType: BuildingType,
    efficiency: number,
    gameState: TamaGameState
  ): void {
    if (!buildingType.effects.automation) return;

    buildingType.effects.automation.forEach(automationType => {
      switch (automationType) {
        case 'auto_feed':
          this.processAutoFeeding(building, efficiency, gameState);
          break;
        case 'auto_craft':
          this.processAutoCrafting(building, efficiency, gameState);
          break;
      }
    });
  }

  private processAutoFeeding(building: Building, efficiency: number, gameState: TamaGameState): void {
    // Find hungry Tamas and feed them if we have berries
    const hungryTamas = gameState.tamas.filter(tama => tama.needs.hunger < 70);
    const maxFeeds = Math.floor(building.level * efficiency);

    let feedsPerformed = 0;
    for (const tama of hungryTamas) {
      if (feedsPerformed >= maxFeeds || gameState.resources.berries < 1) break;

      gameState.resources.berries--;
      tama.needs.hunger = Math.min(100, tama.needs.hunger + 20);
      feedsPerformed++;
    }
  }

  private processAutoCrafting(building: Building, efficiency: number, gameState: TamaGameState): void {
    if (!building.config?.autoCraftRecipe) return;

    // This would integrate with CraftingSystem - for now just simulate basic resource consumption
    const recipe = building.config.autoCraftRecipe;
    if (recipe === 'basic_food' && gameState.resources.berries >= 2 && gameState.resources.wood >= 1) {
      const craftCount = Math.floor(building.level * efficiency);
      if (craftCount > 0) {
        gameState.resources.berries -= 2 * craftCount;
        gameState.resources.wood -= 1 * craftCount;
        // Would add crafted items to inventory when inventory system is implemented
      }
    }
  }

  private processBuildingDecay(building: Building, timeDelta: number): void {
    const hoursElapsed = timeDelta / 3600000;
    const decay = BUILDING_DECAY_RATE * hoursElapsed;
    building.condition = Math.max(0, building.condition - decay);
  }

  // Building management
  removeBuilding(buildingId: string, gameState: TamaGameState): BuildingResult {
    const buildingIndex = gameState.buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex === -1) {
      return {
        success: false,
        message: 'Building not found'
      };
    }

    const building = gameState.buildings[buildingIndex];
    const buildingType = this.getBuildingType(building.type);
    if (!buildingType) {
      return {
        success: false,
        message: 'Building type not found'
      };
    }

    // Refund partial resources
    const totalCost = this.calculateTotalBuildingCost(building, buildingType);
    Object.entries(totalCost).forEach(([resource, amount]) => {
      const refund = Math.floor(amount * DEMOLISH_REFUND_RATE);
      if (resource in gameState.resources) {
        (gameState.resources as any)[resource] += refund;
      }
    });

    // Remove building
    gameState.buildings.splice(buildingIndex, 1);

    return {
      success: true,
      message: `${buildingType.name} demolished`
    };
  }

  repairBuilding(buildingId: string, gameState: TamaGameState): BuildingResult {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) {
      return {
        success: false,
        message: 'Building not found'
      };
    }

    if (building.condition >= 100) {
      return {
        success: false,
        message: 'Building is already in perfect condition'
      };
    }

    const buildingType = this.getBuildingType(building.type);
    if (!buildingType) {
      return {
        success: false,
        message: 'Building type not found'
      };
    }

    const repairCost = this.calculateRepairCost(buildingType, building.condition);
    if (!this.canAffordCost(repairCost, gameState)) {
      return {
        success: false,
        message: 'Insufficient resources for repair'
      };
    }

    // Consume resources
    this.consumeBuildingCost(repairCost, gameState);

    // Repair building
    building.condition = 100;

    return {
      success: true,
      message: `${buildingType.name} repaired`
    };
  }

  // Information methods
  getAvailableBuildings(gameState: TamaGameState): BuildingType[] {
    return this.buildingTypes.filter(buildingType =>
      this.isBuildingAvailable(buildingType.id, gameState)
    );
  }

  getAllBuildingTypes(): BuildingType[] {
    return [...this.buildingTypes];
  }

  getBuildingType(buildingTypeId: string): BuildingType | null {
    return this.buildingTypes.find(b => b.id === buildingTypeId) || null;
  }

  getUpgradeCost(buildingId: string, gameState: TamaGameState): Record<string, number> {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) return {};

    const buildingType = this.getBuildingType(building.type);
    if (!buildingType) return {};

    const cost: Record<string, number> = {};
    const multiplier = Math.pow(UPGRADE_COST_MULTIPLIER, building.level);

    Object.entries(buildingType.cost).forEach(([resource, amount]) => {
      cost[resource] = Math.floor(amount * multiplier);
    });

    return cost;
  }

  getTotalBuildingEffects(gameState: TamaGameState): BuildingEffects {
    const effects: BuildingEffects = {
      tamaCapacity: this.getTamaCapacity(gameState),
      craftingSpeedMultiplier: this.getCraftingSpeedBonus(gameState),
      globalMultiplier: this.getGlobalMultiplier(gameState),
      passiveIncome: this.getTotalPassiveIncome(gameState),
      automation: this.getActiveAutomation(gameState)
    };

    return effects;
  }

  getBuildingStats(gameState: TamaGameState): BuildingStats {
    const buildingTypes = [...new Set(gameState.buildings.map(b => b.type))];

    return {
      totalBuildings: gameState.buildings.length,
      buildingTypes,
      totalValue: this.calculateTotalBuildingValue(gameState)
    };
  }

  // Automation configuration
  setAutoCraftingRecipe(buildingId: string, recipeId: string, gameState: TamaGameState): BuildingResult {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) {
      return {
        success: false,
        message: 'Building not found'
      };
    }

    const buildingType = this.getBuildingType(building.type);
    if (!buildingType?.effects.automation?.includes('auto_craft')) {
      return {
        success: false,
        message: 'Building does not support auto crafting'
      };
    }

    if (!building.config) {
      building.config = {};
    }

    building.config.autoCraftRecipe = recipeId;

    return {
      success: true,
      message: 'Auto crafting recipe set'
    };
  }

  // Helper methods
  private isBuildingAvailable(buildingTypeId: string, gameState: TamaGameState): boolean {
    const buildingType = this.getBuildingType(buildingTypeId);
    if (!buildingType) return false;

    // Check unlocks
    if (!gameState.unlocks.buildings.includes(buildingTypeId)) return false;

    // Check level requirement
    if (gameState.progression.level < buildingType.requiredLevel) return false;

    // Check prestige requirement
    if (buildingType.requiredPrestige && gameState.progression.prestigeLevel < buildingType.requiredPrestige) {
      return false;
    }

    return true;
  }

  private canAffordBuilding(buildingTypeId: string, gameState: TamaGameState): boolean {
    const buildingType = this.getBuildingType(buildingTypeId);
    if (!buildingType) return false;

    return this.canAffordCost(buildingType.cost, gameState);
  }

  private canAffordCost(cost: Record<string, number>, gameState: TamaGameState): boolean {
    for (const [resource, amount] of Object.entries(cost)) {
      if (resource in gameState.resources) {
        if ((gameState.resources as any)[resource] < amount) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }

  private consumeBuildingCost(cost: Record<string, number>, gameState: TamaGameState): void {
    Object.entries(cost).forEach(([resource, amount]) => {
      if (resource in gameState.resources) {
        (gameState.resources as any)[resource] -= amount;
      }
    });
  }

  private getBuildingEfficiency(building: Building): number {
    return building.condition / 100;
  }

  private getGlobalMultiplier(gameState: TamaGameState): number {
    let multiplier = 1.0;

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType?.effects.globalMultiplier) {
        const efficiency = this.getBuildingEfficiency(building);
        const bonus = (buildingType.effects.globalMultiplier - 1) * building.level * efficiency;
        multiplier += bonus;
      }
    });

    return multiplier;
  }

  private getTotalPassiveIncome(gameState: TamaGameState): Record<string, number> {
    const income: Record<string, number> = {};

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType?.effects.passiveIncome) {
        const efficiency = this.getBuildingEfficiency(building);

        Object.entries(buildingType.effects.passiveIncome).forEach(([resource, baseRate]) => {
          const amount = baseRate * building.level * efficiency;
          income[resource] = (income[resource] || 0) + amount;
        });
      }
    });

    return income;
  }

  private getActiveAutomation(gameState: TamaGameState): string[] {
    const automation: Set<string> = new Set();

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType?.effects.automation) {
        const efficiency = this.getBuildingEfficiency(building);
        if (efficiency > 0) {
          buildingType.effects.automation.forEach(auto => automation.add(auto));
        }
      }
    });

    return Array.from(automation);
  }

  private calculateTotalBuildingCost(building: Building, buildingType: BuildingType): Record<string, number> {
    const totalCost: Record<string, number> = {};

    // Base cost
    Object.entries(buildingType.cost).forEach(([resource, amount]) => {
      totalCost[resource] = amount;
    });

    // Add upgrade costs
    for (let level = 2; level <= building.level; level++) {
      const multiplier = Math.pow(UPGRADE_COST_MULTIPLIER, level - 1);

      Object.entries(buildingType.cost).forEach(([resource, amount]) => {
        totalCost[resource] = (totalCost[resource] || 0) + Math.floor(amount * multiplier);
      });
    }

    return totalCost;
  }

  private calculateRepairCost(buildingType: BuildingType, condition: number): Record<string, number> {
    const repairCost: Record<string, number> = {};
    const repairRatio = (100 - condition) / 100;

    Object.entries(buildingType.cost).forEach(([resource, amount]) => {
      repairCost[resource] = Math.floor(amount * REPAIR_COST_MULTIPLIER * repairRatio);
    });

    return repairCost;
  }

  private calculateTotalBuildingValue(gameState: TamaGameState): number {
    let totalValue = 0;

    gameState.buildings.forEach(building => {
      const buildingType = this.getBuildingType(building.type);
      if (buildingType) {
        const totalCost = this.calculateTotalBuildingCost(building, buildingType);
        const coinValue = totalCost.tamaCoins || 0;
        totalValue += coinValue;
      }
    });

    return totalValue;
  }
}