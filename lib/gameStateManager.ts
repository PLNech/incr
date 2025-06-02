// Shared game state management system
interface GameState {
  gameId: string;
  playerName?: string;
  resources: Record<string, number>;
  achievements: string[];
  progress: Record<string, any>;
  lastPlayed: number;
  version: string;
}

interface GlobalState {
  globalAchievements: string[];
  crossGameUnlocks: string[];
  totalPlaytime: number;
  gamesPlayed: string[];
}

class GameStateManager {
  private static instance: GameStateManager;
  private readonly STORAGE_PREFIX = 'incr_games_';
  private readonly GLOBAL_KEY = 'global_state';

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  // Save game state
  saveGameState(gameId: string, state: Partial<GameState>): void {
    const existing = this.loadGameState(gameId);
    const newState: GameState = {
      ...existing,
      ...state,
      gameId,
      lastPlayed: Date.now(),
      version: '1.0.0'
    };

    localStorage.setItem(
      `${this.STORAGE_PREFIX}${gameId}`,
      JSON.stringify(newState)
    );

    // Update global state
    this.updateGlobalState(gameId);
  }

  // Load game state
  loadGameState(gameId: string): GameState {
    const saved = localStorage.getItem(`${this.STORAGE_PREFIX}${gameId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(`Failed to parse save for ${gameId}:`, e);
      }
    }

    // Return default state
    return {
      gameId,
      resources: {},
      achievements: [],
      progress: {},
      lastPlayed: Date.now(),
      version: '1.0.0'
    };
  }

  // Get global state
  getGlobalState(): GlobalState {
    const saved = localStorage.getItem(`${this.STORAGE_PREFIX}${this.GLOBAL_KEY}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse global state:', e);
      }
    }

    return {
      globalAchievements: [],
      crossGameUnlocks: [],
      totalPlaytime: 0,
      gamesPlayed: []
    };
  }

  // Update global state
  private updateGlobalState(gameId: string): void {
    const global = this.getGlobalState();
    
    if (!global.gamesPlayed.includes(gameId)) {
      global.gamesPlayed.push(gameId);
    }

    localStorage.setItem(
      `${this.STORAGE_PREFIX}${this.GLOBAL_KEY}`,
      JSON.stringify(global)
    );
  }

  // Check if achievement is unlocked globally
  hasGlobalAchievement(achievement: string): boolean {
    return this.getGlobalState().globalAchievements.includes(achievement);
  }

  // Unlock global achievement
  unlockGlobalAchievement(achievement: string): void {
    const global = this.getGlobalState();
    if (!global.globalAchievements.includes(achievement)) {
      global.globalAchievements.push(achievement);
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${this.GLOBAL_KEY}`,
        JSON.stringify(global)
      );
    }
  }

  // Check cross-game unlocks
  hasCrossGameUnlock(unlock: string): boolean {
    return this.getGlobalState().crossGameUnlocks.includes(unlock);
  }

  // Get player name from any game (for cross-game features)
  getPlayerName(): string | undefined {
    const games = this.getAllGameStates();
    for (const game of games) {
      if (game.playerName) {
        return game.playerName;
      }
    }
    return undefined;
  }

  // Get all saved games
  getAllGameStates(): GameState[] {
    const games: GameState[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX) && !key.includes(this.GLOBAL_KEY)) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            games.push(JSON.parse(saved));
          } catch (e) {
            console.warn(`Failed to parse save for ${key}:`, e);
          }
        }
      }
    }
    return games;
  }

  // Export all data for backup
  exportAllData(): string {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.setItem(key, value as string);
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
}

export { GameStateManager, type GameState, type GlobalState };