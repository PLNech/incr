import { TamaData, TamaSpecies, TamaTier } from '../types';
import {
  migrateToAdvancedTama,
  migrateAllTamas,
  needsMigration
} from '../utils/tamaDataMigration';
import { AdvancedTamaData, PersonalityArchetype } from '../types-advanced';

// Mock basic Tama data
const createMockBasicTama = (overrides: Partial<TamaData> = {}): TamaData => ({
  id: 'test-tama-1',
  name: 'TestTama',
  species: 'basic' as TamaSpecies,
  tier: 1 as TamaTier,
  level: 5,
  experience: 250,
  genetics: {
    cuteness: 75,
    intelligence: 80,
    energy: 70,
    appetite: 40
  },
  needs: {
    hunger: 85,
    happiness: 70,
    energy: 90,
    cleanliness: 65
  },
  stats: {
    totalInteractions: 15,
    hoursLived: 48,
    jobsCompleted: 3
  },
  skills: {
    caretaking: 10,
    crafting: 5
  },
  createdAt: Date.now() - 172800000, // 2 days ago
  lastInteraction: Date.now() - 3600000, // 1 hour ago
  ...overrides
});

describe('Tama Data Migration', () => {
  describe('needsMigration', () => {
    test('should identify basic Tamas that need migration', () => {
      const basicTama = createMockBasicTama();
      expect(needsMigration(basicTama)).toBe(true);
    });

    test('should identify advanced Tamas that do not need migration', () => {
      const advancedTama = {
        ...createMockBasicTama(),
        rpgStats: { strength: 10 }
      } as any;

      expect(needsMigration(advancedTama)).toBe(false);
    });
  });

  describe('migrateToAdvancedTama', () => {
    let basicTama: TamaData;
    let advancedTama: AdvancedTamaData;

    beforeEach(() => {
      basicTama = createMockBasicTama();
      advancedTama = migrateToAdvancedTama(basicTama);
    });

    test('should preserve all basic Tama properties', () => {
      expect(advancedTama.id).toBe(basicTama.id);
      expect(advancedTama.name).toBe(basicTama.name);
      expect(advancedTama.species).toBe(basicTama.species);
      expect(advancedTama.tier).toBe(basicTama.tier);
      expect(advancedTama.level).toBe(basicTama.level);
      expect(advancedTama.experience).toBe(basicTama.experience);
      expect(advancedTama.needs).toEqual(basicTama.needs);
      expect(advancedTama.stats).toEqual(basicTama.stats);
      expect(advancedTama.createdAt).toBe(basicTama.createdAt);
      expect(advancedTama.lastInteraction).toBe(basicTama.lastInteraction);
    });

    test('should convert genetics to RPG stats', () => {
      expect(advancedTama.rpgStats).toBeDefined();
      expect(advancedTama.rpgStats.strength).toBeGreaterThan(0);
      expect(advancedTama.rpgStats.agility).toBeGreaterThan(0);
      expect(advancedTama.rpgStats.intelligence).toBeGreaterThan(0);
      expect(advancedTama.rpgStats.wisdom).toBeGreaterThan(0);
      expect(advancedTama.rpgStats.charisma).toBeGreaterThan(0);
      expect(advancedTama.rpgStats.constitution).toBeGreaterThan(0);
    });

    test('should generate appropriate personality based on stats', () => {
      expect(advancedTama.personality).toBeDefined();
      expect(advancedTama.personality.archetype).toBeDefined();

      // Personality traits should be within valid ranges
      expect(advancedTama.personality.openness).toBeGreaterThanOrEqual(0);
      expect(advancedTama.personality.openness).toBeLessThanOrEqual(100);
      expect(advancedTama.personality.conscientiousness).toBeGreaterThanOrEqual(0);
      expect(advancedTama.personality.conscientiousness).toBeLessThanOrEqual(100);
      expect(advancedTama.personality.extraversion).toBeGreaterThanOrEqual(0);
      expect(advancedTama.personality.extraversion).toBeLessThanOrEqual(100);
      expect(advancedTama.personality.agreeableness).toBeGreaterThanOrEqual(0);
      expect(advancedTama.personality.agreeableness).toBeLessThanOrEqual(100);
      expect(advancedTama.personality.neuroticism).toBeGreaterThanOrEqual(0);
      expect(advancedTama.personality.neuroticism).toBeLessThanOrEqual(100);
    });

    test('should initialize autonomous behavior properties', () => {
      expect(advancedTama.relationships).toEqual({});
      expect(advancedTama.currentGoals).toEqual([]);
      expect(advancedTama.goalHistory).toEqual([]);
      expect(advancedTama.currentActivity).toBe(null);
      expect(advancedTama.autonomyLevel).toBeGreaterThan(0);
      expect(advancedTama.autonomyLevel).toBeLessThanOrEqual(100);
    });

    test('should calculate derived stats correctly', () => {
      const stats = advancedTama.rpgStats;

      expect(stats.health).toBe(stats.constitution * 10 + basicTama.level * 5);
      expect(stats.mana).toBe(stats.intelligence + stats.wisdom);
      expect(stats.stamina).toBe(stats.constitution + stats.agility);
      expect(stats.armorClass).toBeGreaterThan(10);
      expect(stats.attackBonus).toBeGreaterThan(0);
    });

    test('should initialize mental state based on needs', () => {
      expect(advancedTama.mentalState).toBeDefined();
      expect(advancedTama.mentalState.stress).toBeGreaterThanOrEqual(0);
      expect(advancedTama.mentalState.stress).toBeLessThanOrEqual(100);
      expect(advancedTama.mentalState.confidence).toBeGreaterThan(0);
      expect(advancedTama.mentalState.satisfaction).toBeGreaterThan(0);
    });

    test('should set up social status based on stats and level', () => {
      expect(advancedTama.socialStatus).toBeDefined();
      expect(advancedTama.socialStatus.reputation).toBeGreaterThan(0);
      expect(advancedTama.socialStatus.leadership).toBeGreaterThanOrEqual(0);
      expect(advancedTama.socialStatus.popularity).toBeGreaterThan(0);
      expect(advancedTama.socialStatus.respect).toBeGreaterThan(0);
    });

    test('should initialize territory and possessions', () => {
      expect(advancedTama.territory.favoriteSpots).toContain('garden_center');
      expect(advancedTama.territory.sharedAreas).toContain('garden_center');
      expect(advancedTama.possessions.personalItems).toEqual([]);
      expect(advancedTama.possessions.sharedItems).toEqual([]);
      expect(advancedTama.possessions.treasuredItems).toEqual([]);
    });

    describe('Species-specific stat modifiers', () => {
      test('should apply forest species modifiers', () => {
        const forestTama = migrateToAdvancedTama(createMockBasicTama({ species: 'forest' }));
        const basicTamaStats = migrateToAdvancedTama(createMockBasicTama({ species: 'basic' }));

        // Forest Tamas should have higher AGI and WIS
        expect(forestTama.rpgStats.agility).toBeGreaterThan(basicTamaStats.rpgStats.agility);
        expect(forestTama.rpgStats.wisdom).toBeGreaterThan(basicTamaStats.rpgStats.wisdom);
      });

      test('should apply crystal species modifiers', () => {
        const crystalTama = migrateToAdvancedTama(createMockBasicTama({ species: 'crystal' }));
        const basicTamaStats = migrateToAdvancedTama(createMockBasicTama({ species: 'basic' }));

        // Crystal Tamas should have higher INT and CHA
        expect(crystalTama.rpgStats.intelligence).toBeGreaterThan(basicTamaStats.rpgStats.intelligence);
        expect(crystalTama.rpgStats.charisma).toBeGreaterThan(basicTamaStats.rpgStats.charisma);
      });

      test('should apply shadow species modifiers', () => {
        const shadowTama = migrateToAdvancedTama(createMockBasicTama({ species: 'shadow' }));
        const basicTamaStats = migrateToAdvancedTama(createMockBasicTama({ species: 'basic' }));

        // Shadow Tamas should have higher STR and AGI
        expect(shadowTama.rpgStats.strength).toBeGreaterThan(basicTamaStats.rpgStats.strength);
        expect(shadowTama.rpgStats.agility).toBeGreaterThan(basicTamaStats.rpgStats.agility);
      });
    });

    describe('Tier bonuses', () => {
      test('should apply tier bonuses to stats', () => {
        const tier0Tama = migrateToAdvancedTama(createMockBasicTama({ tier: 0 }));
        const tier2Tama = migrateToAdvancedTama(createMockBasicTama({ tier: 2 }));

        // Higher tier should have better stats
        expect(tier2Tama.rpgStats.strength).toBeGreaterThan(tier0Tama.rpgStats.strength);
        expect(tier2Tama.rpgStats.intelligence).toBeGreaterThan(tier0Tama.rpgStats.intelligence);
        expect(tier2Tama.rpgStats.charisma).toBeGreaterThan(tier0Tama.rpgStats.charisma);
      });
    });

    describe('Personality archetype assignment', () => {
      test('should assign archetype based on dominant stats', () => {
        // Create Tama with high CHA + WIS for leader archetype
        const leaderTama = migrateToAdvancedTama(createMockBasicTama({
          genetics: { cuteness: 90, intelligence: 85, energy: 70, appetite: 30 }
        }));

        expect(leaderTama.personality.archetype).toBeDefined();
        expect(typeof leaderTama.personality.archetype).toBe('string');

        const validArchetypes: PersonalityArchetype[] = [
          'leader', 'warrior', 'scholar', 'artist', 'explorer',
          'caretaker', 'trickster', 'hermit', 'guardian', 'socialite'
        ];
        expect(validArchetypes).toContain(leaderTama.personality.archetype);
      });

      test('should generate appropriate favorite activities based on archetype', () => {
        const advancedTama = migrateToAdvancedTama(createMockBasicTama());

        expect(Array.isArray(advancedTama.personality.favoriteActivities)).toBe(true);
        expect(advancedTama.personality.favoriteActivities.length).toBeGreaterThan(0);

        // Should include basic activities
        const hasBasicActivities = advancedTama.personality.favoriteActivities.some(activity =>
          ['socializing', 'resting', 'training', 'exploring'].includes(activity)
        );
        expect(hasBasicActivities).toBe(true);
      });
    });

    describe('Skill generation', () => {
      test('should generate skills based on stats and level', () => {
        const skills = advancedTama.rpgStats.skills;

        // All skills should be present
        const expectedSkills = [
          'athletics', 'combat', 'stealth', 'survival',
          'academics', 'crafting', 'medicine', 'investigation',
          'persuasion', 'performance', 'insight', 'animalHandling'
        ];

        expectedSkills.forEach(skill => {
          expect(skills[skill as keyof typeof skills]).toBeDefined();
          expect(skills[skill as keyof typeof skills]).toBeGreaterThanOrEqual(0);
        });
      });

      test('should scale skills with level', () => {
        const lowLevelTama = migrateToAdvancedTama(createMockBasicTama({ level: 1 }));
        const highLevelTama = migrateToAdvancedTama(createMockBasicTama({ level: 10 }));

        // Higher level should generally have higher skills
        const lowLevelTotal = Object.values(lowLevelTama.rpgStats.skills).reduce((a, b) => a + b, 0);
        const highLevelTotal = Object.values(highLevelTama.rpgStats.skills).reduce((a, b) => a + b, 0);

        expect(highLevelTotal).toBeGreaterThan(lowLevelTotal);
      });
    });
  });

  describe('migrateAllTamas', () => {
    test('should migrate all basic Tamas in array', () => {
      const basicTamas = [
        createMockBasicTama({ id: 'tama1', name: 'First' }),
        createMockBasicTama({ id: 'tama2', name: 'Second' }),
        createMockBasicTama({ id: 'tama3', name: 'Third' })
      ];

      const migratedTamas = migrateAllTamas(basicTamas);

      expect(migratedTamas).toHaveLength(3);
      migratedTamas.forEach((tama, index) => {
        expect(tama.id).toBe(basicTamas[index].id);
        expect(tama.name).toBe(basicTamas[index].name);
        expect(tama.rpgStats).toBeDefined();
        expect(tama.personality).toBeDefined();
      });
    });

    test('should skip already advanced Tamas', () => {
      const mixedTamas = [
        createMockBasicTama({ id: 'basic1' }),
        {
          ...createMockBasicTama({ id: 'advanced1' }),
          rpgStats: { strength: 10 } // Already has RPG stats
        } as any
      ];

      const result = migrateAllTamas(mixedTamas);

      expect(result).toHaveLength(2);
      expect(result[0].rpgStats).toBeDefined(); // First was migrated
      expect(result[1].id).toBe('advanced1'); // Second was kept as-is
    });

    test('should handle empty array', () => {
      const result = migrateAllTamas([]);
      expect(result).toEqual([]);
    });

    test('should maintain order of Tamas', () => {
      const basicTamas = [
        createMockBasicTama({ id: 'first' }),
        createMockBasicTama({ id: 'second' }),
        createMockBasicTama({ id: 'third' })
      ];

      const result = migrateAllTamas(basicTamas);

      expect(result[0].id).toBe('first');
      expect(result[1].id).toBe('second');
      expect(result[2].id).toBe('third');
    });
  });

  describe('Edge Cases', () => {
    test('should handle Tama with minimal genetics values', () => {
      const minimalTama = createMockBasicTama({
        genetics: { cuteness: 1, intelligence: 1, energy: 1, appetite: 100 }
      });

      const result = migrateToAdvancedTama(minimalTama);

      // Should still produce valid stats
      expect(result.rpgStats.strength).toBeGreaterThan(0);
      expect(result.rpgStats.intelligence).toBeGreaterThan(0);
      expect(result.rpgStats.charisma).toBeGreaterThan(0);
    });

    test('should handle Tama with maximal genetics values', () => {
      const maximalTama = createMockBasicTama({
        genetics: { cuteness: 100, intelligence: 100, energy: 100, appetite: 1 }
      });

      const result = migrateToAdvancedTama(maximalTama);

      // Stats should be boosted but not break the system
      expect(result.rpgStats.strength).toBeLessThan(30); // Reasonable upper bound
      expect(result.rpgStats.intelligence).toBeLessThan(30);
      expect(result.rpgStats.charisma).toBeLessThan(30);
    });

    test('should handle Tama with undefined optional properties', () => {
      const basicTama = createMockBasicTama();
      delete (basicTama as any).skills;
      delete (basicTama as any).sleepState;

      expect(() => {
        const result = migrateToAdvancedTama(basicTama);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should generate different personalities for identical genetics', () => {
      const tama1 = migrateToAdvancedTama(createMockBasicTama({ id: 'twin1' }));
      const tama2 = migrateToAdvancedTama(createMockBasicTama({ id: 'twin2' }));

      // Due to randomness in personality generation, twins should have some differences
      // (This test may occasionally fail due to randomness, but should pass most of the time)
      const personalityDifferences = [
        tama1.personality.openness !== tama2.personality.openness,
        tama1.personality.playfulness !== tama2.personality.playfulness,
        tama1.personality.competitiveness !== tama2.personality.competitiveness
      ];

      const hasDifferences = personalityDifferences.some(diff => diff);
      expect(hasDifferences).toBe(true);
    });
  });
});