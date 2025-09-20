import { TamaGameState, GameEvent, GameEventCallback, TamaData, TamaTier } from '../types';
import { TamaEntity } from './TamaEntity';
import { SystemOrchestrator } from './SystemOrchestrator';
import { TamaGameStateAdapter } from './TamaGameStateAdapter';

export class TamaEngine {
  private gameState: TamaGameState;
  private eventCallbacks: GameEventCallback[] = [];
  private gameLoop: NodeJS.Timeout | null = null;
  private readonly TICK_INTERVAL = 500; // 0.5 seconds for 2x speed
  private systemOrchestrator: SystemOrchestrator;
  private stateAdapter: TamaGameStateAdapter;

  constructor(initialState?: Partial<TamaGameState>) {
    this.systemOrchestrator = new SystemOrchestrator();
    this.stateAdapter = new TamaGameStateAdapter();

    // Load saved state or use provided initial state
    if (!initialState) {
      const defaultState = this.createInitialState();
      this.gameState = this.stateAdapter.loadState(defaultState);
    } else {
      this.gameState = this.createInitialState(initialState);
    }

    // Initialize customers if none exist
    if (this.gameState.customers.length === 0) {
      this.systemOrchestrator.initializeCustomers(this.gameState);
    }

    this.startGameLoop();
  }

  private createInitialState(overrides?: Partial<TamaGameState>): TamaGameState {
    const defaultState: TamaGameState = {
      resources: {
        tamaCoins: 100,
        berries: 10,
        wood: 5,
        stone: 2,
        happinessStars: 0,
        evolutionCrystals: 0
      },
      tamas: [],
      buildings: [],
      customers: [],
      activeContracts: [],
      crafting: {
        queue: [],
        unlockedRecipes: ['basic_food', 'simple_toy']
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
        buildings: ['basic_habitat'],
        recipes: ['basic_food', 'simple_toy'],
        species: ['basic']
      },
      achievements: [],
      tamadex: {
        discovered: { basic: 0, forest: 0, aquatic: 0, crystal: 0, shadow: 0, cosmic: 0 },
        bred: { basic: 0, forest: 0, aquatic: 0, crystal: 0, shadow: 0, cosmic: 0 },
        maxTier: { basic: 0, forest: 0, aquatic: 0, crystal: 0, shadow: 0, cosmic: 0 }
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
      lastUpdate: Date.now()
    };

    return { ...defaultState, ...overrides };
  }

  // Event system
  addEventListener(callback: GameEventCallback): void {
    this.eventCallbacks.push(callback);
  }

  removeEventListener(callback: GameEventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  private emitEvent(event: GameEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  // Game loop
  private startGameLoop(): void {
    if (this.gameLoop) return;

    this.gameLoop = setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL);
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = now - this.gameState.lastUpdate;

    // Update Tama needs
    this.updateTamas(deltaTime);

    // Process all game systems through orchestrator
    const systemResults = this.systemOrchestrator.processTick(this.gameState, deltaTime);

    // Emit events for system results
    if (systemResults.crafting.length > 0) {
      systemResults.crafting.forEach(craft => {
        this.emitEvent({
          id: `craft-complete-${craft.queueId}`,
          type: 'interaction',
          message: `Crafting completed! +${craft.quantity} ${craft.recipeId}`,
          timestamp: now,
          data: { craft }
        });
      });
    }

    if (systemResults.contracts.length > 0) {
      systemResults.contracts.forEach(contract => {
        this.emitEvent({
          id: `contract-${contract.contractId}`,
          type: 'contract',
          message: contract.success ?
            `Contract completed! Earned ${contract.payment} coins` :
            `Contract failed: ${contract.message}`,
          timestamp: now,
          data: { contract }
        });
      });
    }

    // Update play time
    this.gameState.statistics.totalPlayTime += deltaTime;
    this.gameState.progression.lifetimeStats.totalTimePlayedMinutes = Math.floor(this.gameState.statistics.totalPlayTime / 60000);

    // Update last update time
    this.gameState.lastUpdate = now;

    // Validate system state periodically
    if (this.gameState.statistics.totalPlayTime % 30000 < this.TICK_INTERVAL) {
      const errors = this.systemOrchestrator.validateState(this.gameState);
      if (errors.length > 0) {
        console.warn('System validation errors:', errors);
      }
    }

    // Auto-save every 10 seconds
    if (this.gameState.settings.autoSave && this.gameState.statistics.totalPlayTime % 10000 < this.TICK_INTERVAL) {
      this.stateAdapter.saveState(this.gameState);
    }
  }

  private updateTamas(deltaTime: number): void {
    this.gameState.tamas.forEach((tamaData, index) => {
      const oldLevel = tamaData.level;
      const oldTier = tamaData.tier;

      const tama = new TamaEntity(tamaData);
      tama.updateNeeds();

      // Update the game state with the updated tama
      this.gameState.tamas[index] = tama.serialize();

      // Check for level/tier changes and grant experience
      if (tama.level > oldLevel) {
        this.systemOrchestrator.handleTamaLevelUp(this.gameState, tama.id, tama.level);
      }
      if (tama.tier > oldTier) {
        this.systemOrchestrator.handleTamaTierUp(this.gameState, tama.id, tama.tier);
      }

      // Check for notifications
      if (tama.needs.hunger < 30 && Math.random() < 0.1) {
        this.emitEvent({
          id: `hunger-${tama.id}-${Date.now()}`,
          type: 'interaction',
          message: `${tama.name} is getting hungry! 🍎`,
          timestamp: Date.now(),
          data: { tamaId: tama.id, need: 'hunger', value: tama.needs.hunger }
        });
      }
    });
  }

  // Public API methods
  getGameState(): TamaGameState {
    return { ...this.gameState };
  }

  createTama(name: string): TamaData {
    const tama = TamaEntity.createRandom(name);
    const tamaData = tama.serialize();

    this.gameState.tamas.push(tamaData);
    this.gameState.statistics.totalTamasRaised++;

    // Update Tamadex
    this.gameState.tamadex.discovered[tamaData.species]++;
    this.gameState.tamadex.bred[tamaData.species]++;
    this.gameState.tamadex.maxTier[tamaData.species] = Math.max(
      this.gameState.tamadex.maxTier[tamaData.species],
      tamaData.tier
    ) as TamaTier;

    this.emitEvent({
      id: `tama-created-${tamaData.id}`,
      type: 'discovery',
      message: `Welcome ${name}! A ${tamaData.species} Tama joined your ranch! 🐾`,
      timestamp: Date.now(),
      data: { tama: tamaData }
    });

    return tamaData;
  }

  interactWithTama(tamaId: string, action: 'feed' | 'play' | 'clean' | 'rest', item?: string): boolean {
    const tamaIndex = this.gameState.tamas.findIndex(t => t.id === tamaId);
    if (tamaIndex === -1) return false;

    const oldTama = this.gameState.tamas[tamaIndex];
    const tama = new TamaEntity(oldTama);
    let result;

    switch (action) {
      case 'feed':
        result = tama.feed(item || 'basic_food');
        break;
      case 'play':
        result = tama.play(item || 'ball');
        break;
      case 'clean':
        result = tama.clean();
        break;
      case 'rest':
        result = tama.rest(item || 'basic_bed');
        break;
    }

    if (result && result.success) {
      const newTamaData = tama.serialize();
      this.gameState.tamas[tamaIndex] = newTamaData;

      // Grant experience and check achievements through orchestrator
      this.systemOrchestrator.handleTamaInteraction(this.gameState, action);

      // Check for level/tier changes
      if (newTamaData.level > oldTama.level) {
        this.systemOrchestrator.handleTamaLevelUp(this.gameState, tamaId, newTamaData.level);
      }
      if (newTamaData.tier > oldTama.tier) {
        this.systemOrchestrator.handleTamaTierUp(this.gameState, tamaId, newTamaData.tier);
      }

      this.emitEvent({
        id: `interaction-${tamaId}-${Date.now()}`,
        type: 'interaction',
        message: result.message,
        timestamp: Date.now(),
        data: { tamaId, action, result }
      });

      return true;
    }

    return false;
  }

  addResources(resources: Partial<typeof this.gameState.resources>): void {
    Object.entries(resources).forEach(([key, value]) => {
      if (key in this.gameState.resources && typeof value === 'number') {
        (this.gameState.resources as any)[key] += value;
      }
    });
  }

  spendResources(resources: Partial<typeof this.gameState.resources>): boolean {
    // Check if we have enough resources
    for (const [key, value] of Object.entries(resources)) {
      if (key in this.gameState.resources && typeof value === 'number') {
        if ((this.gameState.resources as any)[key] < value) {
          return false;
        }
      }
    }

    // Spend the resources
    Object.entries(resources).forEach(([key, value]) => {
      if (key in this.gameState.resources && typeof value === 'number') {
        (this.gameState.resources as any)[key] -= value;
      }
    });

    return true;
  }

  save(): void {
    this.stateAdapter.saveState(this.gameState);
  }

  load(): boolean {
    try {
      const defaultState = this.createInitialState();
      this.gameState = this.stateAdapter.loadState(defaultState);
      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  // Export/import methods for backup functionality
  exportSaveData(): string {
    return this.stateAdapter.exportSaveData();
  }

  importSaveData(saveData: string): boolean {
    const success = this.stateAdapter.importSaveData(saveData);
    if (success) {
      // Reload the game state after successful import
      this.load();
    }
    return success;
  }

  // Cross-game integration methods
  getPlayerName(): string | undefined {
    return this.stateAdapter.getPlayerName();
  }

  setPlayerName(name: string): void {
    this.stateAdapter.setPlayerName(name);
  }

  getCrossGameData() {
    return this.stateAdapter.getCrossGameData();
  }

  // System access methods
  getSystems() {
    return this.systemOrchestrator.getSystems();
  }

  getSystemBonuses() {
    return this.systemOrchestrator.getSystemBonuses(this.gameState);
  }

  startCrafting(recipeId: string, quantity: number = 1) {
    return this.systemOrchestrator.startCraftingWithBonuses(recipeId, quantity, this.gameState);
  }

  generateContract(customerId: string) {
    return this.systemOrchestrator.generateContractWithBonuses(customerId, this.gameState);
  }

  assignContract(contractId: string, tamaId: string) {
    return this.getSystems().customers.assignTamaToContract(contractId, tamaId, this.gameState);
  }

  placeBuilding(buildingType: string) {
    return this.getSystems().buildings.placeBuilding(buildingType, this.gameState);
  }

  performPrestige() {
    return this.getSystems().progression.performPrestige(this.gameState);
  }

  learnSkill(tree: string, skillId: string) {
    return this.getSystems().progression.learnSkill(this.gameState, tree, skillId);
  }

  chooseSpecialization(specialization: 'caretaker' | 'breeder' | 'entrepreneur') {
    return this.getSystems().progression.chooseSpecialization(this.gameState, specialization);
  }

  destroy(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.eventCallbacks = [];
  }
}