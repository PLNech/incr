import { ProgressionSystem } from '../systems/ProgressionSystem';
import { createMockGameState, createMockTama, advanceTime, resetTime } from './setup';

describe('ProgressionSystem', () => {
  let progressionSystem: ProgressionSystem;
  let gameState: ReturnType<typeof createMockGameState>;

  beforeEach(() => {
    gameState = createMockGameState();
    progressionSystem = new ProgressionSystem();
    resetTime();
  });

  afterEach(() => {
    resetTime();
  });

  describe('Experience and Leveling', () => {
    it('should grant experience for various actions', () => {
      const initialExp = gameState.progression.experience;

      progressionSystem.grantExperience(gameState, 'tama_interaction', 5); // 5 base + 5 additional = 16 with prestige bonus

      // With prestige level 1, experience is multiplied by 1.1
      const expectedExp = Math.floor((5 + 5) * 1.1); // 16
      expect(gameState.progression.experience).toBe(initialExp + expectedExp);
    });

    it('should level up when experience threshold is reached', () => {
      gameState.progression.experience = 90;
      gameState.progression.level = 1;

      progressionSystem.grantExperience(gameState, 'tama_interaction', 20);

      expect(gameState.progression.level).toBe(2);
    });

    it('should calculate experience requirements correctly', () => {
      const level1Req = progressionSystem.getExperienceRequiredForLevel(1);
      const level2Req = progressionSystem.getExperienceRequiredForLevel(2);
      const level10Req = progressionSystem.getExperienceRequiredForLevel(10);

      expect(level1Req).toBe(0);
      expect(level2Req).toBeGreaterThan(level1Req);
      expect(level10Req).toBeGreaterThan(level2Req);
    });

    it('should unlock content when leveling up', () => {
      gameState.progression.level = 1;
      gameState.unlocks.buildings = ['basic_habitat'];

      progressionSystem.processLevelUp(gameState, 2);

      // Should unlock level 2 content
      expect(gameState.unlocks.buildings.length).toBeGreaterThan(1);
    });

    it('should grant skill points on level up', () => {
      const initialSkillPoints = gameState.progression.skillPoints;
      gameState.progression.level = 1;

      progressionSystem.processLevelUp(gameState, 2);

      expect(gameState.progression.skillPoints).toBeGreaterThan(initialSkillPoints);
    });

    it('should handle multiple level ups in one experience grant', () => {
      gameState.progression.experience = 0;
      gameState.progression.level = 1;

      // Grant enough experience to jump multiple levels
      progressionSystem.grantExperience(gameState, 'contract_completion', 500);

      expect(gameState.progression.level).toBeGreaterThan(2);
    });
  });

  describe('Skill Tree System', () => {
    it('should allow spending skill points on skills', () => {
      gameState.progression.skillPoints = 10;

      const result = progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');

      expect(result.success).toBe(true);
      expect(gameState.progression.skillPoints).toBeLessThan(10);
    });

    it('should fail to learn skills without enough skill points', () => {
      gameState.progression.skillPoints = 0;

      const result = progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');

      expect(result.success).toBe(false);
      expect(result.message).toContain('skill points');
    });

    it('should prevent learning skills without prerequisites', () => {
      gameState.progression.skillPoints = 10;

      const result = progressionSystem.learnSkill(gameState, 'caretaker', 'master_caretaker');

      expect(result.success).toBe(false);
      expect(result.message).toContain('prerequisite');
    });

    it('should track skill levels correctly', () => {
      gameState.progression.skillPoints = 20;

      progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');
      progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');

      const skillTree = progressionSystem.getSkillTree(gameState);
      expect(skillTree.caretaker.feeding_efficiency.level).toBe(2);
    });

    it('should provide skill bonuses', () => {
      gameState.progression.skillPoints = 10;
      progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');

      const bonuses = progressionSystem.getSkillBonuses(gameState);

      expect(bonuses.feedingEfficiency).toBeGreaterThan(1.0);
    });

    it('should have different skill trees for different specializations', () => {
      gameState.progression.skillPoints = 30;

      progressionSystem.learnSkill(gameState, 'caretaker', 'feeding_efficiency');
      progressionSystem.learnSkill(gameState, 'breeder', 'genetics_knowledge');
      progressionSystem.learnSkill(gameState, 'entrepreneur', 'business_acumen');

      const skillTree = progressionSystem.getSkillTree(gameState);

      expect(skillTree.caretaker.feeding_efficiency.level).toBeGreaterThan(0);
      expect(skillTree.breeder.genetics_knowledge.level).toBeGreaterThan(0);
      expect(skillTree.entrepreneur.business_acumen.level).toBeGreaterThan(0);
    });
  });

  describe('Prestige System', () => {
    it('should allow prestige when conditions are met', () => {
      gameState.progression.level = 50;
      gameState.tamas = [
        createMockTama(), createMockTama(), createMockTama(),
        createMockTama(), createMockTama()
      ]; // 5 Tamas
      gameState.tamas[0].tier = 3; // At least 2 tier 3 Tamas
      gameState.tamas[1].tier = 3;

      const canPrestige = progressionSystem.canPrestige(gameState);

      expect(canPrestige).toBe(true);
    });

    it('should prevent prestige when conditions not met', () => {
      gameState.progression.level = 10; // Too low level

      const canPrestige = progressionSystem.canPrestige(gameState);

      expect(canPrestige).toBe(false);
    });

    it('should calculate prestige points correctly', () => {
      gameState.progression.level = 50;
      gameState.tamas = [createMockTama(), createMockTama()];
      gameState.tamas[0].tier = 3;
      gameState.tamas[1].tier = 2;

      const points = progressionSystem.calculatePrestigePoints(gameState);

      expect(points).toBeGreaterThan(0);
    });

    it('should reset progress but keep prestige benefits', () => {
      const originalResources = { ...gameState.resources };
      gameState.progression.level = 50;
      gameState.tamas = [
        createMockTama(), createMockTama(), createMockTama(),
        createMockTama(), createMockTama()
      ];
      gameState.tamas[0].tier = 3;
      gameState.tamas[1].tier = 3;

      progressionSystem.performPrestige(gameState);

      expect(gameState.progression.level).toBe(1);
      expect(gameState.progression.prestigeLevel).toBeGreaterThan(0);
      expect(gameState.progression.prestigePoints).toBeGreaterThan(0);
      expect(gameState.resources.tamaCoins).toBeLessThan(originalResources.tamaCoins);
    });

    it('should unlock prestige content after first prestige', () => {
      gameState.progression.level = 50;
      gameState.tamas = [
        createMockTama(), createMockTama(), createMockTama(),
        createMockTama(), createMockTama()
      ];
      gameState.tamas[0].tier = 3;
      gameState.tamas[1].tier = 3;

      progressionSystem.performPrestige(gameState);

      expect(gameState.unlocks.buildings).toContain('crystal_generator');
      expect(gameState.unlocks.species).toContain('celestial');
    });

    it('should apply prestige multipliers to gameplay', () => {
      gameState.progression.prestigeLevel = 2;
      gameState.progression.prestigePoints = 100;

      const multipliers = progressionSystem.getPrestigeMultipliers(gameState);

      expect(multipliers.experienceGain).toBeGreaterThan(1.0);
      expect(multipliers.resourceGain).toBeGreaterThan(1.0);
      expect(multipliers.tamaGrowth).toBeGreaterThan(1.0);
    });

    it('should track prestige statistics', () => {
      // Set up conditions for prestige
      gameState.progression.level = 50;
      gameState.tamas = [
        createMockTama(), createMockTama(), createMockTama(),
        createMockTama(), createMockTama()
      ];
      gameState.tamas[0].tier = 3;
      gameState.tamas[1].tier = 3;

      progressionSystem.performPrestige(gameState);

      // Reset conditions for second prestige
      gameState.progression.level = 50;
      gameState.tamas = [
        createMockTama(), createMockTama(), createMockTama(),
        createMockTama(), createMockTama()
      ];
      gameState.tamas[0].tier = 3;
      gameState.tamas[1].tier = 3;

      progressionSystem.performPrestige(gameState);

      const stats = progressionSystem.getPrestigeStats(gameState);

      expect(stats.totalPrestiges).toBe(2);
      expect(stats.totalPrestigePoints).toBeGreaterThan(0);
    });
  });

  describe('Achievement System', () => {
    it('should track achievements automatically', () => {
      gameState.tamas[0].level = 10;

      progressionSystem.checkAchievements(gameState);

      const hasAchievement = gameState.achievements.some(a => a.id === 'first_level_10');
      expect(hasAchievement).toBe(true);
    });

    it('should not duplicate achievements', () => {
      gameState.tamas[0].level = 10;

      progressionSystem.checkAchievements(gameState);
      progressionSystem.checkAchievements(gameState);

      const achievementCount = gameState.achievements.filter(a => a.id === 'first_level_10').length;
      expect(achievementCount).toBe(1);
    });

    it('should grant rewards for achievements', () => {
      const initialCoins = gameState.resources.tamaCoins;
      gameState.tamas[0].level = 10;

      progressionSystem.checkAchievements(gameState);

      expect(gameState.resources.tamaCoins).toBeGreaterThan(initialCoins);
    });

    it('should track complex achievements', () => {
      // Create conditions for complex achievement
      gameState.progression.level = 25;
      for (let i = 0; i < 10; i++) {
        gameState.tamas.push(createMockTama());
      }

      progressionSystem.checkAchievements(gameState);

      const hasAchievement = gameState.achievements.some(a => a.id === 'tama_collector');
      expect(hasAchievement).toBe(true);
    });

    it('should show achievement progress', () => {
      gameState.tamas = [createMockTama(), createMockTama(), createMockTama()];

      const progress = progressionSystem.getAchievementProgress(gameState, 'tama_collector');

      expect(progress.current).toBe(3);
      expect(progress.required).toBe(10);
      expect(progress.percentage).toBeCloseTo(0.3);
    });
  });

  describe('Milestone System', () => {
    it('should define clear progression milestones', () => {
      const milestones = progressionSystem.getMilestones();

      expect(milestones.length).toBeGreaterThan(5);
      expect(milestones[0]).toHaveProperty('level');
      expect(milestones[0]).toHaveProperty('name');
      expect(milestones[0]).toHaveProperty('rewards');
    });

    it('should track milestone completion', () => {
      gameState.progression.level = 10;

      const completedMilestones = progressionSystem.getCompletedMilestones(gameState);

      expect(completedMilestones.length).toBeGreaterThan(0);
      expect(completedMilestones.every(m => m.level <= 10)).toBe(true);
    });

    it('should show next milestone', () => {
      gameState.progression.level = 10;

      const nextMilestone = progressionSystem.getNextMilestone(gameState);

      expect(nextMilestone).toBeTruthy();
      expect(nextMilestone!.level).toBeGreaterThan(10);
    });

    it('should grant milestone rewards', () => {
      gameState.progression.level = 9;
      const initialSkillPoints = gameState.progression.skillPoints;

      // Directly trigger level 10 which has a milestone
      progressionSystem.processLevelUp(gameState, 10);

      // Should have granted milestone rewards (5 skill points from milestone + skill points from leveling)
      expect(gameState.progression.skillPoints).toBeGreaterThan(initialSkillPoints);
    });
  });

  describe('Specialization System', () => {
    it('should allow choosing specialization', () => {
      gameState.progression.level = 5;

      const result = progressionSystem.chooseSpecialization(gameState, 'caretaker');

      expect(result.success).toBe(true);
      expect(gameState.progression.specialization).toBe('caretaker');
    });

    it('should prevent changing specialization without reset', () => {
      gameState.progression.specialization = 'caretaker';

      const result = progressionSystem.chooseSpecialization(gameState, 'breeder');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already chosen');
    });

    it('should provide specialization bonuses', () => {
      gameState.progression.specialization = 'caretaker';

      const bonuses = progressionSystem.getSpecializationBonuses(gameState);

      expect(bonuses.tamaInteractionEfficiency).toBeGreaterThan(1.0);
    });

    it('should unlock specialization-specific content', () => {
      gameState.progression.level = 5;
      progressionSystem.chooseSpecialization(gameState, 'breeder');

      expect(gameState.unlocks.recipes).toContain('genetic_enhancer');
    });
  });

  describe('Progress Tracking', () => {
    it('should track lifetime statistics', () => {
      const stats = progressionSystem.getLifetimeStats(gameState);

      expect(stats).toHaveProperty('totalTamasOwned');
      expect(stats).toHaveProperty('totalContractsCompleted');
      expect(stats).toHaveProperty('totalResourcesEarned');
      expect(stats).toHaveProperty('totalTimePlayedMinutes');
    });

    it('should calculate overall progress percentage', () => {
      gameState.progression.level = 25;
      gameState.progression.prestigeLevel = 1;

      const progress = progressionSystem.getOverallProgress(gameState);

      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should show progression rate', () => {
      const oldExp = gameState.progression.experience;
      advanceTime(60000); // 1 minute
      progressionSystem.grantExperience(gameState, 'tama_interaction', 50);

      const rate = progressionSystem.getProgressionRate(gameState);

      expect(rate.experiencePerMinute).toBeGreaterThan(0);
    });
  });
});