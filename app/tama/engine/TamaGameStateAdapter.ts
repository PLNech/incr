import { TamaGameState } from '../types';
import { GameStateManager } from '../../../lib/gameStateManager';

interface GameState {
  gameId: string;
  playerName?: string;
  resources: Record<string, number>;
  achievements: string[];
  progress: Record<string, any>;
  lastPlayed: number;
  version: string;
}

/**
 * Adapter to integrate TamaGameState with the existing GameStateManager
 */
export class TamaGameStateAdapter {
  private gameStateManager: any; // Using any to avoid importing the class directly
  private readonly GAME_ID = 'tama-bokujo';

  constructor() {
    // Get the singleton instance
    this.gameStateManager = (GameStateManager as any).getInstance();
  }

  /**
   * Convert TamaGameState to generic GameState format
   */
  private tamaStateToGeneric(tamaState: TamaGameState): Partial<GameState> {
    const achievementIds = tamaState.achievements
      .filter(a => a.unlocked)
      .map(a => a.id);

    return {
      gameId: this.GAME_ID,
      resources: {
        tamaCoins: tamaState.resources.tamaCoins,
        berries: tamaState.resources.berries,
        wood: tamaState.resources.wood,
        stone: tamaState.resources.stone,
        happinessStars: tamaState.resources.happinessStars,
        evolutionCrystals: tamaState.resources.evolutionCrystals
      },
      achievements: achievementIds,
      progress: {
        // Core progression
        level: tamaState.progression.level,
        experience: tamaState.progression.experience,
        prestigeLevel: tamaState.progression.prestigeLevel,
        prestigePoints: tamaState.progression.prestigePoints,
        skillPoints: tamaState.progression.skillPoints,
        specialization: tamaState.progression.specialization,

        // Statistics for cross-game features
        totalPlayTime: tamaState.statistics.totalPlayTime,
        totalTamasRaised: tamaState.statistics.totalTamasRaised,
        totalContractsCompleted: tamaState.statistics.totalContractsCompleted,
        totalItemsCrafted: tamaState.statistics.totalItemsCrafted,
        prestigeCount: tamaState.statistics.prestigeCount,

        // Current game state (compressed)
        tamaCount: tamaState.tamas.length,
        buildingCount: tamaState.buildings.length,
        activeContractCount: tamaState.activeContracts.length,
        highestTamaLevel: Math.max(...tamaState.tamas.map(t => t.level), 0),
        highestTamaTier: Math.max(...tamaState.tamas.map(t => t.tier), 0),

        // Full state (for save/load)
        fullGameState: tamaState
      },
      lastPlayed: tamaState.lastUpdate,
      version: '1.0.0'
    };
  }

  /**
   * Merge saved progress back into TamaGameState
   */
  private mergeGenericToTamaState(tamaState: TamaGameState, genericState: GameState): TamaGameState {
    // If we have a full game state saved, use that
    if (genericState.progress.fullGameState) {
      const savedState = genericState.progress.fullGameState as TamaGameState;

      // Update last played time
      savedState.lastUpdate = genericState.lastPlayed;

      // Validate the saved state structure
      if (this.validateTamaGameState(savedState)) {
        return savedState;
      } else {
        console.warn('Saved game state is invalid, using default state');
      }
    }

    // Otherwise, merge what we can into the default state
    if (genericState.resources) {
      Object.assign(tamaState.resources, genericState.resources);
    }

    if (genericState.progress) {
      const p = genericState.progress;

      // Restore progression data
      if (p.level) tamaState.progression.level = p.level;
      if (p.experience) tamaState.progression.experience = p.experience;
      if (p.prestigeLevel) tamaState.progression.prestigeLevel = p.prestigeLevel;
      if (p.prestigePoints) tamaState.progression.prestigePoints = p.prestigePoints;
      if (p.skillPoints) tamaState.progression.skillPoints = p.skillPoints;
      if (p.specialization) tamaState.progression.specialization = p.specialization;

      // Restore statistics
      if (p.totalPlayTime) tamaState.statistics.totalPlayTime = p.totalPlayTime;
      if (p.totalTamasRaised) tamaState.statistics.totalTamasRaised = p.totalTamasRaised;
      if (p.totalContractsCompleted) tamaState.statistics.totalContractsCompleted = p.totalContractsCompleted;
      if (p.totalItemsCrafted) tamaState.statistics.totalItemsCrafted = p.totalItemsCrafted;
      if (p.prestigeCount) tamaState.statistics.prestigeCount = p.prestigeCount;
    }

    // Mark achievements as unlocked based on saved achievement IDs
    if (genericState.achievements) {
      tamaState.achievements.forEach(achievement => {
        if (genericState.achievements.includes(achievement.id)) {
          achievement.unlocked = true;
        }
      });
    }

    tamaState.lastUpdate = genericState.lastPlayed;

    return tamaState;
  }

  /**
   * Basic validation of TamaGameState structure
   */
  private validateTamaGameState(state: any): state is TamaGameState {
    return (
      state &&
      typeof state === 'object' &&
      state.resources &&
      state.tamas &&
      Array.isArray(state.tamas) &&
      state.buildings &&
      Array.isArray(state.buildings) &&
      state.progression &&
      state.statistics &&
      typeof state.lastUpdate === 'number'
    );
  }

  /**
   * Save TamaGameState using GameStateManager
   */
  saveState(tamaState: TamaGameState): void {
    const genericState = this.tamaStateToGeneric(tamaState);

    // Add player name if available from other games
    const existingState = this.gameStateManager.loadGameState(this.GAME_ID);
    if (existingState.playerName) {
      genericState.playerName = existingState.playerName;
    }

    this.gameStateManager.saveGameState(this.GAME_ID, genericState);

    // Update global statistics
    this.updateGlobalStats(tamaState);
  }

  /**
   * Load TamaGameState using GameStateManager
   */
  loadState(defaultState: TamaGameState): TamaGameState {
    const genericState = this.gameStateManager.loadGameState(this.GAME_ID);

    // If this is the first load, return default state
    if (!genericState.progress || Object.keys(genericState.progress).length === 0) {
      return defaultState;
    }

    return this.mergeGenericToTamaState(defaultState, genericState);
  }

  /**
   * Get player name from cross-game data
   */
  getPlayerName(): string | undefined {
    const globalState = this.gameStateManager.getGlobalState();

    // Try to get player name from any game
    for (const gameId of globalState.gamesPlayed || []) {
      const gameState = this.gameStateManager.loadGameState(gameId);
      if (gameState.playerName) {
        return gameState.playerName;
      }
    }

    return undefined;
  }

  /**
   * Set player name (shared across games)
   */
  setPlayerName(name: string): void {
    const currentState = this.gameStateManager.loadGameState(this.GAME_ID);
    this.gameStateManager.saveGameState(this.GAME_ID, {
      ...currentState,
      playerName: name
    });
  }

  /**
   * Get cross-game achievements and unlocks
   */
  getCrossGameData() {
    const globalState = this.gameStateManager.getGlobalState();
    return {
      globalAchievements: globalState.globalAchievements || [],
      crossGameUnlocks: globalState.crossGameUnlocks || [],
      totalPlaytime: globalState.totalPlaytime || 0,
      gamesPlayed: globalState.gamesPlayed || []
    };
  }

  /**
   * Update global statistics with Tama-specific data
   */
  private updateGlobalStats(tamaState: TamaGameState): void {
    // This would contribute to global play time and unlock cross-game features
    const globalState = this.gameStateManager.getGlobalState();

    // Add achievements that should be global
    const globalAchievements = [...(globalState.globalAchievements || [])];

    // Add significant Tama achievements to global list
    const significantAchievements = ['first_prestige', 'tier_3_master', 'tama_collector'];
    tamaState.achievements
      .filter(a => a.unlocked && significantAchievements.includes(a.id))
      .forEach(achievement => {
        const globalId = `tama_${achievement.id}`;
        if (!globalAchievements.includes(globalId)) {
          globalAchievements.push(globalId);
        }
      });

    // Contribute to total playtime
    const totalPlaytime = (globalState.totalPlaytime || 0) + (tamaState.statistics.totalPlayTime || 0);

    // This would normally call gameStateManager.updateGlobalState, but we'll just log for now
    console.log('Would update global stats:', {
      totalPlaytime,
      globalAchievements: globalAchievements.length
    });
  }

  /**
   * Export game state for backup
   */
  exportSaveData(): string {
    const gameState = this.gameStateManager.loadGameState(this.GAME_ID);
    return JSON.stringify({
      ...gameState,
      exportedAt: Date.now(),
      gameType: 'tama-bokujo',
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * Import game state from backup
   */
  importSaveData(saveData: string): boolean {
    try {
      const importedData = JSON.parse(saveData);

      // Validate it's a Tama save
      if (importedData.gameType !== 'tama-bokujo') {
        console.error('Invalid save data: not a Tama Bokujo save');
        return false;
      }

      // Validate the structure
      if (!importedData.progress || !importedData.progress.fullGameState) {
        console.error('Invalid save data: missing game state');
        return false;
      }

      // Save the imported data
      this.gameStateManager.saveGameState(this.GAME_ID, {
        ...importedData,
        lastPlayed: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }
}