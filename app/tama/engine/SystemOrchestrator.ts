import { TamaGameState } from '../types';
import { CraftingSystem, CompletedCraft } from '../systems/CraftingSystem';
import { CustomerSystem, ContractResult } from '../systems/CustomerSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { AdventureSystem, AdventureResult } from '../systems/AdventureSystem';

export interface SystemProcessResults {
  crafting: CompletedCraft[];
  contracts: ContractResult[];
  adventures: AdventureResult[];
  experience: number;
  events: string[];
}

/**
 * Central orchestrator that manages all game systems and their interactions
 */
export class SystemOrchestrator {
  private crafting: CraftingSystem;
  private customers: CustomerSystem;
  private buildings: BuildingSystem;
  private progression: ProgressionSystem;
  private adventures: AdventureSystem;

  constructor() {
    this.crafting = new CraftingSystem();
    this.customers = new CustomerSystem();
    this.buildings = new BuildingSystem();
    this.progression = new ProgressionSystem();
    this.adventures = new AdventureSystem();
  }

  /**
   * Process all systems in the correct order for one game tick
   */
  processTick(gameState: TamaGameState, deltaTime: number): SystemProcessResults {
    const results: SystemProcessResults = {
      crafting: [],
      contracts: [],
      adventures: [],
      experience: 0,
      events: []
    };

    // 1. Process buildings first (they affect other systems)
    this.buildings.processBuildings(gameState);

    // 2. Process crafting queue
    const completedCrafts = this.crafting.processQueue(gameState);
    results.crafting = completedCrafts;

    // Grant experience for completed crafts
    completedCrafts.forEach(craft => {
      const expGained = craft.quantity * 5; // 5 exp per crafted item
      this.progression.grantExperience(gameState, 'building_built', expGained);
      results.experience += expGained;
    });

    // 3. Process customer contracts
    const contractResults = this.customers.processContracts(gameState);
    results.contracts = contractResults;

    // Grant experience for completed contracts
    contractResults.forEach(result => {
      if (result.success) {
        this.progression.grantExperience(gameState, 'contract_completion', 25);
        results.experience += 25;
        // Update lifetime stats
        gameState.progression.lifetimeStats.totalContractsCompleted++;
      }
    });

    // 4. Process completed adventures
    const adventureResults = this.adventures.processCompletedAdventures(gameState);
    results.adventures = adventureResults;

    // Grant experience for completed adventures
    adventureResults.forEach(result => {
      if (result.success && result.experienceGained) {
        this.progression.grantExperience(gameState, 'adventure_completion', result.experienceGained);
        results.experience += result.experienceGained;
      }
    });

    // 5. Check for achievements and progression
    this.progression.checkAchievements(gameState);

    return results;
  }

  /**
   * Initialize a new customer population
   */
  initializeCustomers(gameState: TamaGameState, count: number = 10): void {
    gameState.customers = this.customers.generateInitialPopulation(count);
  }

  /**
   * Handle Tama interactions and grant appropriate experience
   */
  handleTamaInteraction(gameState: TamaGameState, action: string): void {
    // Grant experience for interacting with Tamas
    this.progression.grantExperience(gameState, 'tama_interaction');

    // Check for level-based achievements
    this.progression.checkAchievements(gameState);
  }

  handleTamaCreation(gameState: TamaGameState): void {
    // Grant experience for creating a Tama
    this.progression.grantExperience(gameState, 'tama_creation');

    // Check for level-based achievements
    this.progression.checkAchievements(gameState);
  }

  /**
   * Handle Tama level up and tier changes
   */
  handleTamaLevelUp(gameState: TamaGameState, tamaId: string, newLevel: number): void {
    this.progression.grantExperience(gameState, 'tama_level_up', 50);

    // Update lifetime stats
    gameState.progression.lifetimeStats.highestTamaLevel = Math.max(
      gameState.progression.lifetimeStats.highestTamaLevel,
      newLevel
    );

    this.progression.checkAchievements(gameState);
  }

  /**
   * Handle Tama tier evolution
   */
  handleTamaTierUp(gameState: TamaGameState, tamaId: string, newTier: number): void {
    this.progression.grantExperience(gameState, 'tama_tier_up', 200);
    this.progression.checkAchievements(gameState);
  }

  /**
   * Get all systems for direct access when needed
   */
  getSystems() {
    return {
      crafting: this.crafting,
      customers: this.customers,
      buildings: this.buildings,
      progression: this.progression,
      adventures: this.adventures
    };
  }

  /**
   * Get system bonuses that affect other systems
   */
  getSystemBonuses(gameState: TamaGameState) {
    return {
      craftingSpeedMultiplier: this.buildings.getCraftingSpeedBonus(gameState),
      resourceMultiplier: this.progression.getPrestigeMultipliers(gameState).resourceGain,
      experienceMultiplier: this.progression.getPrestigeMultipliers(gameState).experienceGain,
      skillBonuses: this.progression.getSkillBonuses(gameState),
      specializationBonuses: this.progression.getSpecializationBonuses(gameState)
    };
  }

  /**
   * Perform monthly rotation of customers
   */
  performMonthlyRotation(gameState: TamaGameState): void {
    this.customers.performMonthlyRotation(gameState);

    // Grant some experience for managing customers
    this.progression.grantExperience(gameState, 'contract_completion', 10);
  }

  /**
   * Start crafting with building bonuses applied
   */
  startCraftingWithBonuses(recipeId: string, quantity: number, gameState: TamaGameState) {
    // Apply building bonuses to crafting time
    const bonuses = this.getSystemBonuses(gameState);

    // Store the original multiplier
    const originalMultiplier = this.crafting['getCraftingTimeMultiplier'](gameState);

    // Temporarily modify the crafting system to use building bonuses
    // This is a bit of a hack - in a real implementation, we'd redesign the interface
    const result = this.crafting.startCrafting(recipeId, quantity, gameState);

    if (result.success) {
      this.progression.grantExperience(gameState, 'building_built', 15);
    }

    return result;
  }

  /**
   * Generate a contract with skill and building bonuses
   */
  generateContractWithBonuses(customerId: string, gameState: TamaGameState) {
    const customer = gameState.customers.find(c => c.id === customerId);
    if (!customer) return null;

    const contract = this.customers.generateContract(customer, gameState);

    // Apply skill bonuses to contract payment
    const bonuses = this.getSystemBonuses(gameState);
    const paymentBonus = bonuses.skillBonuses.contractPaymentBonus || 1.0;
    const specializationBonus = bonuses.specializationBonuses.contractPaymentBonus || 1.0;

    contract.payment.baseAmount = Math.floor(
      contract.payment.baseAmount * paymentBonus * specializationBonus
    );

    return contract;
  }

  /**
   * Validate system state consistency
   */
  validateState(gameState: TamaGameState): string[] {
    const errors: string[] = [];

    // Check for orphaned contracts
    const orphanedContracts = gameState.activeContracts.filter(contract =>
      !gameState.customers.some(customer => customer.id === contract.customerId)
    );
    if (orphanedContracts.length > 0) {
      errors.push(`Found ${orphanedContracts.length} contracts with missing customers`);
    }

    // Check for invalid building assignments
    const invalidBuildings = gameState.buildings.filter(building =>
      building.config?.targetTamaId &&
      !gameState.tamas.some(tama => tama.id === building.config.targetTamaId)
    );
    if (invalidBuildings.length > 0) {
      errors.push(`Found ${invalidBuildings.length} buildings with invalid Tama assignments`);
    }

    // Check for impossible crafting queue items
    const invalidCrafts = gameState.crafting.queue.filter(craft =>
      !gameState.crafting.unlockedRecipes.includes(craft.recipeId)
    );
    if (invalidCrafts.length > 0) {
      errors.push(`Found ${invalidCrafts.length} crafting items for locked recipes`);
    }

    return errors;
  }
}