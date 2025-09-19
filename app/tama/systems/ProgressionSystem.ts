import {
  TamaGameState,
  Achievement,
  Milestone,
  SkillTree,
  PrestigeMultipliers,
  ProgressionStats,
  AchievementProgress
} from '../types';
import {
  ACHIEVEMENTS,
  MILESTONES,
  SKILL_TREES,
  EXPERIENCE_SOURCES,
  PRESTIGE_REQUIREMENTS,
  EXPERIENCE_CURVE_BASE,
  EXPERIENCE_CURVE_MULTIPLIER,
  PRESTIGE_POINT_MULTIPLIER
} from '../data/progression';

export interface ProgressionResult {
  success: boolean;
  message: string;
  rewards?: {
    experience?: number;
    skillPoints?: number;
    resources?: Record<string, number>;
  };
}

export interface ProgressionRate {
  experiencePerMinute: number;
  levelsPerHour: number;
}

export class ProgressionSystem {
  private achievements: Achievement[];
  private milestones: Milestone[];
  private skillTrees: any;

  constructor() {
    this.achievements = [...ACHIEVEMENTS];
    this.milestones = [...MILESTONES];
    this.skillTrees = { ...SKILL_TREES };
  }

  // Experience and Leveling
  grantExperience(gameState: TamaGameState, source: keyof typeof EXPERIENCE_SOURCES, amount: number): void {
    const experienceSource = EXPERIENCE_SOURCES[source];
    if (!experienceSource) return;

    const baseExp = experienceSource.base;
    const prestigeMultiplier = this.getPrestigeMultipliers(gameState).experienceGain;
    const finalExp = Math.floor((baseExp + amount) * prestigeMultiplier);

    const oldLevel = gameState.progression.level;
    gameState.progression.experience += finalExp;

    // Check for level ups
    this.checkLevelUp(gameState, oldLevel);
  }

  private checkLevelUp(gameState: TamaGameState, oldLevel: number): void {
    const newLevel = this.calculateLevelFromExperience(gameState.progression.experience);

    if (newLevel > oldLevel) {
      for (let level = oldLevel + 1; level <= newLevel; level++) {
        this.processLevelUp(gameState, level);
      }
      gameState.progression.level = newLevel;
    }
  }

  processLevelUp(gameState: TamaGameState, newLevel: number): void {
    // Grant skill points
    const skillPointsGranted = this.calculateSkillPointsForLevel(newLevel);
    gameState.progression.skillPoints += skillPointsGranted;

    // Check for milestone rewards
    const milestone = this.milestones.find(m => m.level === newLevel);
    if (milestone) {
      this.processMilestoneRewards(gameState, milestone);
    }

    // Unlock content based on level
    this.unlockContentForLevel(gameState, newLevel);

    // Check achievements
    this.checkAchievements(gameState);
  }


  getExperienceRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(EXPERIENCE_CURVE_BASE * Math.pow(level - 1, EXPERIENCE_CURVE_MULTIPLIER));
  }

  private calculateLevelFromExperience(experience: number): number {
    if (experience <= 0) return 1;

    // Calculate level based on experience using inverse of the curve
    // For early levels, use simplified calculation
    let level = 1;
    while (this.getExperienceRequiredForLevel(level + 1) <= experience) {
      level++;
      // Safety check to prevent infinite loops
      if (level > 100) break;
    }
    return level;
  }

  private calculateSkillPointsForLevel(level: number): number {
    if (level <= 5) return 1;
    if (level <= 15) return 2;
    if (level <= 35) return 3;
    return 5;
  }

  private processMilestoneRewards(gameState: TamaGameState, milestone: Milestone): void {
    gameState.progression.skillPoints += milestone.rewards.skillPoints;

    if (milestone.rewards.tamaCoins) {
      gameState.resources.tamaCoins += milestone.rewards.tamaCoins;
    }

    if (milestone.rewards.unlocks) {
      milestone.rewards.unlocks.forEach(unlock => {
        if (unlock.includes('habitat') || unlock.includes('workshop') || unlock.includes('generator')) {
          if (!gameState.unlocks.buildings.includes(unlock)) {
            gameState.unlocks.buildings.push(unlock);
          }
        } else if (unlock.includes('recipe')) {
          if (!gameState.unlocks.recipes.includes(unlock)) {
            gameState.unlocks.recipes.push(unlock);
          }
        } else {
          // Assume it's a species
          if (!gameState.unlocks.species.includes(unlock as any)) {
            gameState.unlocks.species.push(unlock as any);
          }
        }
      });
    }
  }

  private unlockContentForLevel(gameState: TamaGameState, level: number): void {
    // Unlock buildings based on level
    if (level >= 2 && !gameState.unlocks.buildings.includes('crafting_workshop')) {
      gameState.unlocks.buildings.push('crafting_workshop');
    }
    if (level >= 3 && !gameState.unlocks.buildings.includes('auto_feeder')) {
      gameState.unlocks.buildings.push('auto_feeder');
    }
    if (level >= 4 && !gameState.unlocks.buildings.includes('auto_workshop')) {
      gameState.unlocks.buildings.push('auto_workshop');
    }

    // Unlock recipes
    if (level >= 3 && !gameState.unlocks.recipes.includes('premium_food')) {
      gameState.unlocks.recipes.push('premium_food');
    }
  }

  // Skill Tree System
  learnSkill(gameState: TamaGameState, tree: string, skillId: string): ProgressionResult {
    const skillData = this.skillTrees[tree]?.[skillId];
    if (!skillData) {
      return {
        success: false,
        message: `Skill ${skillId} not found in ${tree} tree`
      };
    }

    // Initialize skill tree if needed
    if (!gameState.progression.skillTree[tree]) {
      gameState.progression.skillTree[tree] = {};
    }

    const currentSkill = gameState.progression.skillTree[tree][skillId] || {
      ...skillData,
      level: 0
    };

    if (currentSkill.level >= skillData.maxLevel) {
      return {
        success: false,
        message: `${skillData.name} is already at maximum level`
      };
    }

    const cost = skillData.cost + currentSkill.level;
    if (gameState.progression.skillPoints < cost) {
      return {
        success: false,
        message: `Not enough skill points. Need ${cost}, have ${gameState.progression.skillPoints}`
      };
    }

    // Check prerequisites
    if (skillData.prerequisites) {
      for (const prereq of skillData.prerequisites) {
        const prereqSkill = gameState.progression.skillTree[tree][prereq];
        if (!prereqSkill || prereqSkill.level === 0) {
          return {
            success: false,
            message: `Missing prerequisite: ${prereq}`
          };
        }
      }
    }

    // Learn the skill
    gameState.progression.skillPoints -= cost;
    currentSkill.level++;
    gameState.progression.skillTree[tree][skillId] = currentSkill;

    return {
      success: true,
      message: `Learned ${skillData.name} level ${currentSkill.level}`
    };
  }

  getSkillTree(gameState: TamaGameState): SkillTree {
    // Merge default skill trees with player progress
    const playerSkillTree: SkillTree = { caretaker: {}, breeder: {}, entrepreneur: {} };

    Object.keys(this.skillTrees).forEach(treeKey => {
      playerSkillTree[treeKey] = {};
      Object.keys(this.skillTrees[treeKey]).forEach(skillKey => {
        const baseSkill = this.skillTrees[treeKey][skillKey];
        const playerSkill = gameState.progression.skillTree[treeKey]?.[skillKey];

        playerSkillTree[treeKey][skillKey] = {
          ...baseSkill,
          level: playerSkill?.level || 0
        };
      });
    });

    return playerSkillTree;
  }

  getSkillBonuses(gameState: TamaGameState): Record<string, number> {
    const bonuses: Record<string, number> = {
      feedingEfficiency: 1.0,
      happinessBonus: 1.0,
      contractPaymentBonus: 1.0,
      resourceBonus: 1.0,
      geneticsBonus: 1.0
    };

    Object.keys(gameState.progression.skillTree).forEach(treeKey => {
      Object.keys(gameState.progression.skillTree[treeKey]).forEach(skillKey => {
        const skill = gameState.progression.skillTree[treeKey][skillKey];
        if (skill && skill.level > 0) {
          Object.keys(skill.effects).forEach(effectKey => {
            const effectValue = skill.effects[effectKey] * skill.level;

            switch (effectKey) {
              case 'feedingBonus':
                bonuses.feedingEfficiency += effectValue;
                break;
              case 'happinessBonus':
                bonuses.happinessBonus += effectValue;
                break;
              case 'contractPaymentBonus':
                bonuses.contractPaymentBonus += effectValue;
                break;
              case 'resourceBonus':
                bonuses.resourceBonus += effectValue;
                break;
              case 'geneticsBonus':
                bonuses.geneticsBonus += effectValue;
                break;
            }
          });
        }
      });
    });

    return bonuses;
  }

  // Prestige System
  canPrestige(gameState: TamaGameState): boolean {
    if (gameState.progression.level < PRESTIGE_REQUIREMENTS.minLevel) return false;
    if (gameState.tamas.length < PRESTIGE_REQUIREMENTS.minTamaCount) return false;

    const tier3Count = gameState.tamas.filter(tama => tama.tier >= 3).length;
    if (tier3Count < PRESTIGE_REQUIREMENTS.minTier3Count) return false;

    return true;
  }

  calculatePrestigePoints(gameState: TamaGameState): number {
    let points = 0;

    // Base points from level
    points += Math.floor(gameState.progression.level * PRESTIGE_POINT_MULTIPLIER);

    // Bonus points from high-tier Tamas
    gameState.tamas.forEach(tama => {
      if (tama.tier >= 2) points += tama.tier * 5;
    });

    // Bonus from completed achievements
    points += gameState.achievements.filter(a => a.unlocked).length * 2;

    return Math.floor(points);
  }

  performPrestige(gameState: TamaGameState): ProgressionResult {
    if (!this.canPrestige(gameState)) {
      return {
        success: false,
        message: 'Prestige requirements not met'
      };
    }

    const prestigePoints = this.calculatePrestigePoints(gameState);

    // Store current stats in lifetime stats
    gameState.progression.lifetimeStats.totalTamasOwned += gameState.tamas.length;
    gameState.progression.lifetimeStats.prestigeCount++;

    // Reset progress
    gameState.progression.level = 1;
    gameState.progression.experience = 0;
    gameState.progression.prestigeLevel++;
    gameState.progression.prestigePoints += prestigePoints;
    gameState.progression.skillPoints = 0;
    gameState.progression.skillTree = { caretaker: {}, breeder: {}, entrepreneur: {} };

    // Reset resources (keep some based on prestige level)
    const keepRatio = Math.min(0.1 + (gameState.progression.prestigeLevel * 0.05), 0.5);
    gameState.resources.tamaCoins = Math.floor(gameState.resources.tamaCoins * keepRatio);
    gameState.resources.berries = Math.floor(gameState.resources.berries * keepRatio);
    gameState.resources.wood = Math.floor(gameState.resources.wood * keepRatio);
    gameState.resources.stone = Math.floor(gameState.resources.stone * keepRatio);

    // Clear Tamas and buildings
    gameState.tamas = [];
    gameState.buildings = [];
    gameState.customers = [];
    gameState.activeContracts = [];

    // Reset unlocks but keep prestige unlocks
    gameState.unlocks.buildings = ['basic_habitat'];
    gameState.unlocks.recipes = ['basic_food'];
    gameState.unlocks.species = ['basic'];

    // Unlock prestige content
    this.unlockPrestigeContent(gameState);

    return {
      success: true,
      message: `Prestiged! Gained ${prestigePoints} prestige points`,
      rewards: {
        experience: 0
      }
    };
  }

  private unlockPrestigeContent(gameState: TamaGameState): void {
    if (gameState.progression.prestigeLevel >= 1) {
      if (!gameState.unlocks.buildings.includes('crystal_generator')) {
        gameState.unlocks.buildings.push('crystal_generator');
      }
      if (!gameState.unlocks.species.includes('celestial' as any)) {
        gameState.unlocks.species.push('celestial' as any);
      }
    }
  }

  getPrestigeMultipliers(gameState: TamaGameState): PrestigeMultipliers {
    const baseMultiplier = 1.0;
    const prestigeBonus = gameState.progression.prestigeLevel * 0.1;
    const pointBonus = gameState.progression.prestigePoints * 0.01;

    return {
      experienceGain: baseMultiplier + prestigeBonus + pointBonus,
      resourceGain: baseMultiplier + prestigeBonus * 0.5 + pointBonus * 0.5,
      tamaGrowth: baseMultiplier + prestigeBonus * 0.3 + pointBonus * 0.3,
      contractPayment: baseMultiplier + prestigeBonus * 0.8 + pointBonus * 0.2
    };
  }

  getPrestigeStats(gameState: TamaGameState): { totalPrestiges: number; totalPrestigePoints: number } {
    return {
      totalPrestiges: gameState.progression.lifetimeStats.prestigeCount,
      totalPrestigePoints: gameState.progression.prestigePoints
    };
  }

  // Achievement System
  checkAchievements(gameState: TamaGameState): void {
    this.achievements.forEach(achievement => {
      if (!this.isAchievementUnlocked(gameState, achievement.id)) {
        if (this.checkAchievementCondition(gameState, achievement)) {
          this.unlockAchievement(gameState, achievement);
        }
      }
    });
  }

  private isAchievementUnlocked(gameState: TamaGameState, achievementId: string): boolean {
    return gameState.achievements.some(a => a.id === achievementId && a.unlocked);
  }

  private checkAchievementCondition(gameState: TamaGameState, achievement: Achievement): boolean {
    switch (achievement.id) {
      case 'first_level_10':
        return gameState.tamas.some(tama => tama.level >= 10);
      case 'tama_collector':
        return gameState.tamas.length >= 10;
      case 'contract_master':
        return gameState.progression.lifetimeStats.totalContractsCompleted >= 100;
      case 'first_prestige':
        return gameState.progression.prestigeLevel >= 1;
      case 'tier_3_master':
        return gameState.tamas.some(tama => tama.tier >= 3);
      default:
        return false;
    }
  }

  private unlockAchievement(gameState: TamaGameState, achievement: Achievement): void {
    const unlockedAchievement: Achievement = {
      ...achievement,
      unlocked: true,
      unlockedAt: Date.now()
    };

    gameState.achievements.push(unlockedAchievement);

    // Grant rewards
    if (achievement.rewards.tamaCoins) {
      gameState.resources.tamaCoins += achievement.rewards.tamaCoins;
    }
    if (achievement.rewards.skillPoints) {
      gameState.progression.skillPoints += achievement.rewards.skillPoints;
    }
    if (achievement.rewards.unlocks) {
      achievement.rewards.unlocks.forEach(unlock => {
        if (!gameState.unlocks.buildings.includes(unlock)) {
          gameState.unlocks.buildings.push(unlock);
        }
      });
    }
  }

  getAchievementProgress(gameState: TamaGameState, achievementId: string): AchievementProgress {
    switch (achievementId) {
      case 'tama_collector':
        return {
          current: gameState.tamas.length,
          required: 10,
          percentage: Math.min(gameState.tamas.length / 10, 1.0)
        };
      case 'contract_master':
        return {
          current: gameState.progression.lifetimeStats.totalContractsCompleted,
          required: 100,
          percentage: Math.min(gameState.progression.lifetimeStats.totalContractsCompleted / 100, 1.0)
        };
      default:
        return { current: 0, required: 1, percentage: 0 };
    }
  }

  // Milestone System
  getMilestones(): Milestone[] {
    return [...this.milestones];
  }

  getCompletedMilestones(gameState: TamaGameState): Milestone[] {
    return this.milestones.filter(milestone => gameState.progression.level >= milestone.level);
  }

  getNextMilestone(gameState: TamaGameState): Milestone | null {
    return this.milestones.find(milestone => gameState.progression.level < milestone.level) || null;
  }

  // Specialization System
  chooseSpecialization(gameState: TamaGameState, specialization: 'caretaker' | 'breeder' | 'entrepreneur'): ProgressionResult {
    if (gameState.progression.level < 5) {
      return {
        success: false,
        message: 'Must be level 5 to choose specialization'
      };
    }

    if (gameState.progression.specialization) {
      return {
        success: false,
        message: 'Specialization already chosen'
      };
    }

    gameState.progression.specialization = specialization;

    // Unlock specialization-specific content
    this.unlockSpecializationContent(gameState, specialization);

    return {
      success: true,
      message: `Chosen specialization: ${specialization}`
    };
  }

  private unlockSpecializationContent(gameState: TamaGameState, specialization: string): void {
    switch (specialization) {
      case 'breeder':
        if (!gameState.unlocks.recipes.includes('genetic_enhancer')) {
          gameState.unlocks.recipes.push('genetic_enhancer');
        }
        break;
      case 'entrepreneur':
        if (!gameState.unlocks.buildings.includes('business_center')) {
          gameState.unlocks.buildings.push('business_center');
        }
        break;
      case 'caretaker':
        if (!gameState.unlocks.buildings.includes('care_center')) {
          gameState.unlocks.buildings.push('care_center');
        }
        break;
    }
  }

  getSpecializationBonuses(gameState: TamaGameState): Record<string, number> {
    const bonuses: Record<string, number> = {
      tamaInteractionEfficiency: 1.0,
      breedingSuccessRate: 1.0,
      contractPaymentBonus: 1.0
    };

    if (gameState.progression.specialization === 'caretaker') {
      bonuses.tamaInteractionEfficiency = 1.2;
    } else if (gameState.progression.specialization === 'breeder') {
      bonuses.breedingSuccessRate = 1.3;
    } else if (gameState.progression.specialization === 'entrepreneur') {
      bonuses.contractPaymentBonus = 1.25;
    }

    return bonuses;
  }

  // Progress Tracking
  getLifetimeStats(gameState: TamaGameState): ProgressionStats {
    return { ...gameState.progression.lifetimeStats };
  }

  getOverallProgress(gameState: TamaGameState): number {
    let progress = 0;

    // Level progress (0-40 points)
    progress += Math.min(gameState.progression.level / 100 * 40, 40);

    // Prestige progress (0-30 points)
    progress += Math.min(gameState.progression.prestigeLevel / 10 * 30, 30);

    // Achievement progress (0-20 points)
    const achievementRatio = gameState.achievements.filter(a => a.unlocked).length / this.achievements.length;
    progress += achievementRatio * 20;

    // Skill progress (0-10 points)
    const totalSkillLevels = Object.values(gameState.progression.skillTree).reduce((total, tree) => {
      return total + Object.values(tree).reduce((treeTotal, skill: any) => {
        return treeTotal + (skill.level || 0);
      }, 0);
    }, 0);
    progress += Math.min(totalSkillLevels / 50 * 10, 10);

    return Math.floor(progress);
  }

  getProgressionRate(gameState: TamaGameState): ProgressionRate {
    // This would be calculated based on recent experience gains
    // For now, return simple estimates
    return {
      experiencePerMinute: 50, // This would be tracked over time
      levelsPerHour: 0.5
    };
  }
}