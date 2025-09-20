import { TamaGameState, TamaData } from '../types';
import { ADVENTURE_LOCATIONS, AdventureLocation, AdventureReward } from '../data/adventureLocations';

export interface AdventureResult {
  success: boolean;
  message: string;
  rewards?: AdventureReward[];
  experienceGained?: number;
  newAchievements?: string[];
}

export interface ActiveAdventure {
  id: string;
  locationId: string;
  tamaId: string;
  startTime: number;
  endTime: number;
  successRate: number;
  potentialRewards: AdventureReward[];
}

export class AdventureSystem {

  // Get available locations for the current game state
  getAvailableLocations(gameState: TamaGameState): AdventureLocation[] {
    return ADVENTURE_LOCATIONS.filter(location =>
      this.isLocationUnlocked(location, gameState)
    );
  }

  // Check if a location is unlocked
  private isLocationUnlocked(location: AdventureLocation, gameState: TamaGameState): boolean {
    // Check player level requirement
    if (gameState.progression.level < location.requiredLevel) {
      return false;
    }

    // Check unlock conditions
    if (location.unlockConditions) {
      const conditions = location.unlockConditions;

      // Check completed adventures
      if (conditions.completedAdventures) {
        const completedIds = gameState.statistics.completedAdventures || [];
        if (!conditions.completedAdventures.every(id => completedIds.includes(id))) {
          return false;
        }
      }

      // Check minimum Tama level requirement
      if (conditions.minimumTamaLevel) {
        const hasQualifiedTama = gameState.tamas.some(tama =>
          tama.level >= conditions.minimumTamaLevel!
        );
        if (!hasQualifiedTama) {
          return false;
        }
      }

      // Check minimum tier requirement
      if (conditions.minimumTier !== undefined) {
        const hasQualifiedTama = gameState.tamas.some(tama =>
          tama.tier >= conditions.minimumTier!
        );
        if (!hasQualifiedTama) {
          return false;
        }
      }
    }

    return true;
  }

  // Check if a Tama can go on a specific adventure
  canTamaGo(tama: TamaData, location: AdventureLocation, gameState: TamaGameState): {
    canGo: boolean;
    reason?: string;
  } {
    // Check if Tama is already on an adventure
    const activeAdventures = gameState.activeAdventures || [];
    if (activeAdventures.some(adv => adv.tamaId === tama.id)) {
      return { canGo: false, reason: 'Already on an adventure' };
    }

    // Check energy requirement
    if (tama.needs.energy < (location.costs?.energy || 0)) {
      return { canGo: false, reason: 'Not enough energy' };
    }

    // Check if Tama is sleeping
    if (tama.sleepState?.isAsleep) {
      return { canGo: false, reason: 'Tama is sleeping' };
    }

    // Check happiness (need to be reasonably happy for adventures)
    if (tama.needs.happiness < 30) {
      return { canGo: false, reason: 'Tama is too unhappy' };
    }

    // Check location-specific requirements
    if (location.unlockConditions) {
      if (location.unlockConditions.minimumTamaLevel && tama.level < location.unlockConditions.minimumTamaLevel) {
        return { canGo: false, reason: `Tama needs to be Level ${location.unlockConditions.minimumTamaLevel}` };
      }

      if (location.unlockConditions.minimumTier !== undefined && tama.tier < location.unlockConditions.minimumTier) {
        return { canGo: false, reason: `Tama needs to be Tier ${location.unlockConditions.minimumTier}` };
      }
    }

    return { canGo: true };
  }

  // Start an adventure
  startAdventure(tamaId: string, locationId: string, gameState: TamaGameState): AdventureResult {
    const location = ADVENTURE_LOCATIONS.find(loc => loc.id === locationId);
    const tama = gameState.tamas.find(t => t.id === tamaId);

    if (!location || !tama) {
      return {
        success: false,
        message: 'Invalid adventure or Tama not found'
      };
    }

    // Check if we can afford the adventure
    if (!this.canAffordAdventure(location, gameState)) {
      return {
        success: false,
        message: 'Not enough resources for this adventure'
      };
    }

    // Check if Tama can go
    const canGo = this.canTamaGo(tama, location, gameState);
    if (!canGo.canGo) {
      return {
        success: false,
        message: canGo.reason || 'Tama cannot go on this adventure'
      };
    }

    // Consume resources and energy
    this.consumeAdventureCosts(location, gameState);
    tama.needs.energy -= location.costs?.energy || 0;

    // Calculate success rate based on Tama's attributes
    const successRate = this.calculateSuccessRate(tama, location);

    // Create active adventure
    const startTime = Date.now();
    const endTime = startTime + (location.baseDuration * 60 * 1000); // Convert minutes to ms

    const adventure: ActiveAdventure = {
      id: `adventure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      locationId: location.id,
      tamaId: tama.id,
      startTime,
      endTime,
      successRate,
      potentialRewards: this.generatePotentialRewards(location)
    };

    // Add to active adventures
    if (!gameState.activeAdventures) {
      gameState.activeAdventures = [];
    }
    gameState.activeAdventures.push(adventure);

    return {
      success: true,
      message: `${tama.name} has begun their adventure to ${location.name}!`
    };
  }

  // Process completed adventures
  processCompletedAdventures(gameState: TamaGameState): AdventureResult[] {
    const results: AdventureResult[] = [];
    const now = Date.now();

    if (!gameState.activeAdventures) {
      gameState.activeAdventures = [];
    }

    const completedAdventures = gameState.activeAdventures.filter(adv => adv.endTime <= now);
    const remainingAdventures = gameState.activeAdventures.filter(adv => adv.endTime > now);

    for (const adventure of completedAdventures) {
      const result = this.resolveAdventure(adventure, gameState);
      results.push(result);
    }

    gameState.activeAdventures = remainingAdventures;
    return results;
  }

  // Resolve a completed adventure
  private resolveAdventure(adventure: ActiveAdventure, gameState: TamaGameState): AdventureResult {
    const location = ADVENTURE_LOCATIONS.find(loc => loc.id === adventure.locationId);
    const tama = gameState.tamas.find(t => t.id === adventure.tamaId);

    if (!location || !tama) {
      return {
        success: false,
        message: 'Adventure resolution failed - missing data'
      };
    }

    // Roll for success
    const roll = Math.random();
    const success = roll < adventure.successRate;

    if (!success) {
      // Failed adventure - minor penalties
      const energyLoss = Math.floor((location.costs?.energy || 0) * 0.5);
      tama.needs.energy = Math.max(0, tama.needs.energy - energyLoss);
      tama.needs.happiness = Math.max(0, tama.needs.happiness - 10);

      return {
        success: false,
        message: `${tama.name}'s adventure to ${location.name} failed! They return tired and disappointed.`,
        experienceGained: 1 // Small consolation XP
      };
    }

    // Successful adventure - give rewards
    const actualRewards = this.rollForRewards(adventure.potentialRewards);
    this.grantRewards(actualRewards, gameState, tama);

    // Grant adventure completion tracking
    if (!gameState.statistics.completedAdventures) {
      gameState.statistics.completedAdventures = [];
    }
    if (!gameState.statistics.completedAdventures.includes(location.id)) {
      gameState.statistics.completedAdventures.push(location.id);
    }

    // Boost Tama happiness and experience
    tama.needs.happiness = Math.min(100, tama.needs.happiness + 20);
    const expGain = 5 + Math.floor(location.requiredLevel / 2);
    tama.experience += expGain;

    return {
      success: true,
      message: `${tama.name} successfully completed their adventure to ${location.name}!`,
      rewards: actualRewards,
      experienceGained: 5 + Math.floor(location.requiredLevel / 2)
    };
  }

  // Calculate success rate based on Tama attributes
  private calculateSuccessRate(tama: TamaData, location: AdventureLocation): number {
    let successRate = location.baseSuccessRate;

    // Tama level bonus (each level adds 2%)
    successRate += (tama.level - 1) * 0.02;

    // Tier bonus (each tier adds 5%)
    successRate += tama.tier * 0.05;

    // Genetics bonuses
    const avgGenetics = (tama.genetics.cuteness + tama.genetics.intelligence + tama.genetics.energy) / 3;
    successRate += (avgGenetics - 50) * 0.002; // -0.1 to +0.1 based on genetics

    // Need penalties
    if (tama.needs.energy < 50) successRate -= 0.1;
    if (tama.needs.happiness < 50) successRate -= 0.1;
    if (tama.needs.hunger < 50) successRate -= 0.05;

    // Clamp between 0.1 and 0.95
    return Math.max(0.1, Math.min(0.95, successRate));
  }

  // Generate potential rewards for an adventure
  private generatePotentialRewards(location: AdventureLocation): AdventureReward[] {
    const allRewards = [
      ...location.rewards.common,
      ...location.rewards.uncommon,
      ...location.rewards.rare
    ];

    return allRewards;
  }

  // Roll for actual rewards from potential rewards
  private rollForRewards(potentialRewards: AdventureReward[]): AdventureReward[] {
    const actualRewards: AdventureReward[] = [];

    for (const reward of potentialRewards) {
      const roll = Math.random() * 100;
      if (roll < reward.weight) {
        actualRewards.push({ ...reward });
      }
    }

    return actualRewards;
  }

  // Grant rewards to game state
  private grantRewards(rewards: AdventureReward[], gameState: TamaGameState, tama: TamaData): void {
    for (const reward of rewards) {
      switch (reward.type) {
        case 'resource':
          if (reward.id === 'tama_xp') {
            tama.experience += reward.quantity;
          } else if (gameState.resources[reward.id as keyof typeof gameState.resources] !== undefined) {
            (gameState.resources as any)[reward.id] += reward.quantity;
          }
          break;

        case 'item':
          // Add to inventory (would need inventory system)
          if (!gameState.inventory) gameState.inventory = {};
          gameState.inventory[reward.id] = (gameState.inventory[reward.id] || 0) + reward.quantity;
          break;

        case 'achievement':
          // Find existing achievement and mark as unlocked
          const achievement = gameState.achievements.find(a => a.id === reward.id);
          if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
          }
          break;
      }
    }
  }

  // Check if player can afford adventure
  private canAffordAdventure(location: AdventureLocation, gameState: TamaGameState): boolean {
    if (!location.costs) return true;

    if (location.costs.tamaCoins && gameState.resources.tamaCoins < location.costs.tamaCoins) return false;
    if (location.costs.berries && gameState.resources.berries < location.costs.berries) return false;
    if (location.costs.evolutionCrystals && gameState.resources.evolutionCrystals < location.costs.evolutionCrystals) return false;

    return true;
  }

  // Consume adventure costs
  private consumeAdventureCosts(location: AdventureLocation, gameState: TamaGameState): void {
    if (!location.costs) return;

    if (location.costs.tamaCoins) gameState.resources.tamaCoins -= location.costs.tamaCoins;
    if (location.costs.berries) gameState.resources.berries -= location.costs.berries;
    if (location.costs.evolutionCrystals) gameState.resources.evolutionCrystals -= location.costs.evolutionCrystals;
  }

  // Get time remaining for active adventure
  getTimeRemaining(adventure: ActiveAdventure): number {
    return Math.max(0, adventure.endTime - Date.now());
  }

  // Get adventure progress percentage
  getAdventureProgress(adventure: ActiveAdventure): number {
    const totalTime = adventure.endTime - adventure.startTime;
    const elapsed = Date.now() - adventure.startTime;
    return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  }
}