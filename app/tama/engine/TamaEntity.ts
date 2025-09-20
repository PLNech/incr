import { TamaData, TamaGenetics, TamaNeeds, TamaStats, TamaTier, TamaMood, TamaSpecies, InteractionResult } from '../types';

export class TamaEntity {
  public id: string;
  public name: string;
  public species: TamaSpecies;
  public tier: TamaTier;
  public level: number;
  public experience: number;
  public genetics: TamaGenetics;
  public needs: TamaNeeds;
  public stats: TamaStats;
  public createdAt: number;
  public lastInteraction: number;
  public sleepState: {
    isAsleep: boolean;
    sleepStartTime: number;
    energyRecoveryRate: number;
    canAutoWakeup: boolean;
  };

  constructor(data: TamaData) {
    this.id = data.id;
    this.name = data.name;
    this.species = data.species;
    this.tier = data.tier;
    this.level = data.level;
    this.experience = data.experience;
    this.genetics = { ...data.genetics };
    this.needs = { ...data.needs };
    this.stats = { ...data.stats };
    this.createdAt = data.createdAt;
    this.lastInteraction = data.lastInteraction;

    // Initialize sleep state
    this.sleepState = data.sleepState || {
      isAsleep: false,
      sleepStartTime: 0,
      energyRecoveryRate: 2, // 2 energy per minute (base rate)
      canAutoWakeup: false  // starts false, unlocked through progression
    };
  }

  static createRandom(name: string): TamaEntity {
    const id = `tama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate random genetics (1-100)
    const genetics: TamaGenetics = {
      cuteness: Math.floor(Math.random() * 100) + 1,
      intelligence: Math.floor(Math.random() * 100) + 1,
      energy: Math.floor(Math.random() * 100) + 1,
      appetite: Math.floor(Math.random() * 100) + 1
    };

    // Calculate tier based on genetics average
    const avgGenetics = Object.values(genetics).reduce((sum, val) => sum + val, 0) / 4;
    const tier = this.calculateTier(avgGenetics);

    const species = this.selectSpecies(tier);

    const data: TamaData = {
      id,
      name,
      species,
      tier,
      level: 1,
      experience: 0,
      genetics,
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
        energyRecoveryRate: 2, // 2 energy per minute (base rate)
        canAutoWakeup: false  // unlocked through progression
      }
    };

    return new TamaEntity(data);
  }

  static createSpecific(name: string, species: TamaSpecies, tier: TamaTier, genetics: TamaGenetics): TamaEntity {
    const id = `tama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const data: TamaData = {
      id,
      name,
      species,
      tier,
      level: 1,
      experience: 0,
      genetics: { ...genetics },
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
        energyRecoveryRate: 2, // 2 energy per minute (base rate)
        canAutoWakeup: false  // unlocked through progression
      }
    };

    return new TamaEntity(data);
  }

  private static calculateTier(avgGenetics: number): TamaTier {
    const roll = Math.random() * 100;

    // Base probability distribution: 90% / 9% / 0.9% / 0.09%
    // Higher genetics slightly increase chance of higher tiers
    const geneticsBonus = (avgGenetics - 50) * 0.001; // Very small bonus

    if (roll < 90 + geneticsBonus) return 0;
    if (roll < 99 + geneticsBonus) return 1;
    if (roll < 99.9 + geneticsBonus) return 2;
    return 3;
  }

  private static selectSpecies(tier: TamaTier): TamaSpecies {
    const speciesByTier: Record<TamaTier, TamaSpecies[]> = {
      0: ['basic', 'forest'],
      1: ['aquatic', 'forest'],
      2: ['crystal', 'shadow'],
      3: ['cosmic', 'crystal']
    };

    const availableSpecies = speciesByTier[tier];
    return availableSpecies[Math.floor(Math.random() * availableSpecies.length)];
  }

  updateNeeds(): void {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastInteraction;
    const hoursElapsed = timeSinceLastUpdate / (1000 * 60 * 60);

    // Update hours lived
    this.stats.hoursLived += hoursElapsed;

    // Check if Tama should fall asleep automatically
    this.checkAutoSleep();

    // Process sleep recovery if asleep
    this.processSleepRecovery();

    // Calculate decay rates (per hour) - modified when sleeping
    const hungerDecayRate = 50 + (this.genetics.appetite / 5); // 60-70 per hour
    let energyDecayRate = 40 + (100 - this.genetics.energy) / 5; // 40-60 per hour

    // Slower decay when sleeping (except energy which recovers)
    if (this.sleepState.isAsleep) {
      energyDecayRate = 0; // No energy decay while sleeping - it's recovering instead
    }
    const cleanlinessDecayRate = 30; // 30 per hour

    // Apply decay
    this.needs.hunger = Math.max(0, this.needs.hunger - (hungerDecayRate * hoursElapsed));
    this.needs.energy = Math.max(0, this.needs.energy - (energyDecayRate * hoursElapsed));
    this.needs.cleanliness = Math.max(0, this.needs.cleanliness - (cleanlinessDecayRate * hoursElapsed));

    // Happiness decays based on other needs
    const needsAverage = (this.needs.hunger + this.needs.energy + this.needs.cleanliness) / 3;
    const happinessTarget = Math.max(20, needsAverage);

    if (this.needs.happiness > happinessTarget) {
      this.needs.happiness = Math.max(happinessTarget, this.needs.happiness - (2 * hoursElapsed));
    }

    this.lastInteraction = now;
  }

  feed(foodType: string): InteractionResult {
    const foodEffects: Record<string, { hunger: number; happiness: number; experience: number }> = {
      'basic_food': { hunger: 30, happiness: 5, experience: 1 },
      'premium_food': { hunger: 50, happiness: 15, experience: 3 },
      'gourmet_food': { hunger: 70, happiness: 25, experience: 5 }
    };

    const food = foodEffects[foodType] || foodEffects['basic_food'];

    this.needs.hunger = Math.min(100, this.needs.hunger + food.hunger);
    this.needs.happiness = Math.min(100, this.needs.happiness + food.happiness);

    this.gainExperience(food.experience);
    this.stats.totalInteractions++;
    this.lastInteraction = Date.now();

    return {
      success: true,
      message: `${this.name} was fed and looks content! 🍎`,
      experienceGained: food.experience,
      needsChanged: { hunger: food.hunger, happiness: food.happiness }
    };
  }

  play(toyType: string): InteractionResult {
    const toyEffects: Record<string, { happiness: number; energy: number; experience: number }> = {
      'ball': { happiness: 25, energy: -10, experience: 2 },
      'puzzle': { happiness: 15, energy: -5, experience: 4 },
      'music_box': { happiness: 30, energy: 5, experience: 1 }
    };

    const toy = toyEffects[toyType] || toyEffects['ball'];

    this.needs.happiness = Math.min(100, this.needs.happiness + toy.happiness);
    this.needs.energy = Math.max(0, this.needs.energy + toy.energy);

    this.gainExperience(toy.experience);
    this.stats.totalInteractions++;
    this.lastInteraction = Date.now();

    return {
      success: true,
      message: `${this.name} is happy after playing! 🎾`,
      experienceGained: toy.experience,
      needsChanged: { happiness: toy.happiness, energy: toy.energy }
    };
  }

  clean(): InteractionResult {
    const cleanlinessGain = 40 + Math.random() * 20; // 40-60
    const happinessGain = 10;
    const experience = 1;

    this.needs.cleanliness = Math.min(100, this.needs.cleanliness + cleanlinessGain);
    this.needs.happiness = Math.min(100, this.needs.happiness + happinessGain);

    this.gainExperience(experience);
    this.stats.totalInteractions++;
    this.lastInteraction = Date.now();

    return {
      success: true,
      message: `${this.name} is squeaky clean! ✨`,
      experienceGained: experience,
      needsChanged: { cleanliness: cleanlinessGain, happiness: happinessGain }
    };
  }

  // Passive sleep system - Tamas fall asleep automatically when tired
  private checkAutoSleep(): void {
    // Fall asleep if energy is very low and not already asleep
    if (!this.sleepState.isAsleep && this.needs.energy <= 20) {
      this.sleepState.isAsleep = true;
      this.sleepState.sleepStartTime = Date.now();
    }
  }

  private processSleepRecovery(): void {
    if (!this.sleepState.isAsleep) return;

    const now = Date.now();
    const sleepDurationMinutes = (now - this.sleepState.sleepStartTime) / (1000 * 60);

    // Calculate energy recovery
    const energyRecovered = sleepDurationMinutes * this.sleepState.energyRecoveryRate;
    this.needs.energy = Math.min(100, this.needs.energy + energyRecovered);

    // Auto wake up conditions
    if (this.sleepState.canAutoWakeup) {
      // Auto wake up when fully rested (if skill unlocked)
      if (this.needs.energy >= 95) {
        this.sleepState.isAsleep = false;
      }
    } else {
      // Manual wake up only in early game - energy recovers slower
      // Player needs to manually wake them up or use skills/items to enable auto-wakeup
    }
  }

  // Manual wake up method (replaces rest button)
  wakeUp(): InteractionResult {
    if (!this.sleepState.isAsleep) {
      return {
        success: false,
        message: `${this.name} is already awake! 👁️`,
        experienceGained: 0,
        needsChanged: {}
      };
    }

    // Process any remaining sleep recovery
    this.processSleepRecovery();

    this.sleepState.isAsleep = false;
    this.stats.totalInteractions++;
    this.lastInteraction = Date.now();

    return {
      success: true,
      message: `${this.name} wakes up refreshed! 😊`,
      experienceGained: 1,
      needsChanged: {}
    };
  }

  // Method to upgrade sleep abilities through skills/items
  public upgradeSleep(recoveryRate?: number, autoWakeup?: boolean): void {
    if (recoveryRate) {
      this.sleepState.energyRecoveryRate = recoveryRate;
    }
    if (autoWakeup !== undefined) {
      this.sleepState.canAutoWakeup = autoWakeup;
    }
  }

  gainExperience(amount: number): void {
    this.experience += amount;

    // Check for level up
    const requiredExp = this.getExperienceToNextLevel();
    if (this.experience >= requiredExp) {
      this.experience -= requiredExp;
      this.level++;
    }
  }

  getExperienceToNextLevel(): number {
    // Exponential scaling: level^2 * 10
    return Math.floor(Math.pow(this.level, 2) * 10);
  }

  getMood(): TamaMood {
    const needsAverage = (this.needs.hunger + this.needs.happiness + this.needs.energy + this.needs.cleanliness) / 4;

    if (needsAverage >= 90) return 'ecstatic';
    if (needsAverage >= 75) return 'happy';
    if (needsAverage >= 55) return 'content';
    if (needsAverage >= 35) return 'okay';
    if (needsAverage >= 20) return 'sad';
    return 'miserable';
  }

  isReadyForJob(): boolean {
    return this.needs.energy >= 50 &&
           this.needs.happiness >= 30 &&
           this.needs.hunger >= 30;
  }

  getJobEfficiency(): number {
    // Based on needs, level, and genetics
    const needsMultiplier = (this.needs.energy + this.needs.happiness + this.needs.hunger) / 300;
    const levelMultiplier = 1 + (this.level * 0.1);
    const geneticsMultiplier = (this.genetics.intelligence + this.genetics.energy) / 200;

    return Math.min(2.0, needsMultiplier * levelMultiplier * geneticsMultiplier);
  }

  serialize(): TamaData {
    return {
      id: this.id,
      name: this.name,
      species: this.species,
      tier: this.tier,
      level: this.level,
      experience: this.experience,
      genetics: { ...this.genetics },
      needs: { ...this.needs },
      stats: { ...this.stats },
      createdAt: this.createdAt,
      lastInteraction: this.lastInteraction,
      sleepState: { ...this.sleepState }
    };
  }
}