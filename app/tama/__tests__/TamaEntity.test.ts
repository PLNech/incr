import { TamaEntity } from '../engine/TamaEntity';
import { mockTamaEntity, advanceTime, resetTime } from './setup';

describe('TamaEntity', () => {
  afterEach(() => {
    resetTime();
  });

  describe('Creation', () => {
    it('should create a Tama with random genetics within valid ranges', () => {
      const tama = TamaEntity.createRandom('Testie');

      expect(tama.name).toBe('Testie');
      expect(tama.id).toBeDefined();
      expect(tama.species).toBeDefined();
      expect(tama.tier).toBeGreaterThanOrEqual(0);
      expect(tama.tier).toBeLessThanOrEqual(3);
      expect(tama.level).toBe(1);
      expect(tama.experience).toBe(0);

      // Genetics should be within 1-100 range
      Object.values(tama.genetics).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(100);
      });

      // Needs should start at 100 (full)
      Object.values(tama.needs).forEach(value => {
        expect(value).toBe(100);
      });
    });

    it('should assign tier based on genetics (90%-9%-0.9%-0.09%)', () => {
      // Test tier distribution over many generations
      const tiers = [0, 0, 0, 0]; // Count of each tier
      const samples = 1000;

      for (let i = 0; i < samples; i++) {
        const tama = TamaEntity.createRandom(`Test${i}`);
        tiers[tama.tier]++;
      }

      // Should follow roughly 90%-9%-0.9%-0.09% distribution
      expect(tiers[0]).toBeGreaterThan(samples * 0.8); // ~90% should be tier 0
      expect(tiers[1]).toBeGreaterThan(samples * 0.05); // ~9% should be tier 1
      expect(tiers[2]).toBeLessThan(samples * 0.05); // <5% should be tier 2+
    });
  });

  describe('Need Decay', () => {
    it('should decay needs over time when not cared for', () => {
      const tama = new TamaEntity(mockTamaEntity);
      const initialNeeds = { ...tama.needs };

      // Advance time by 1 hour
      advanceTime(60 * 60 * 1000);
      tama.updateNeeds();

      expect(tama.needs.hunger).toBeLessThan(initialNeeds.hunger);
      expect(tama.needs.energy).toBeLessThan(initialNeeds.energy);
      expect(tama.needs.cleanliness).toBeLessThan(initialNeeds.cleanliness);
      // Happiness should decay when other needs are low
    });

    it('should have different decay rates for different needs', () => {
      const tama = new TamaEntity(mockTamaEntity);

      advanceTime(30 * 60 * 1000); // 30 minutes
      tama.updateNeeds();

      const hungerDecay = 100 - tama.needs.hunger;
      const energyDecay = 100 - tama.needs.energy;
      const cleanlinessDecay = 100 - tama.needs.cleanliness;

      expect(hungerDecay).toBeGreaterThan(0);
      expect(energyDecay).toBeGreaterThan(0);
      expect(cleanlinessDecay).toBeGreaterThan(0);

      // Hunger should decay faster than cleanliness
      expect(hungerDecay).toBeGreaterThan(cleanlinessDecay);
    });
  });

  describe('Interactions', () => {
    it('should increase hunger when fed', () => {
      const tama = new TamaEntity(mockTamaEntity);
      tama.needs.hunger = 50;

      const result = tama.feed('basic_food');

      expect(result.success).toBe(true);
      expect(tama.needs.hunger).toBeGreaterThan(50);
      expect(result.message).toContain('fed');
      expect(tama.stats.totalInteractions).toBe(1);
    });

    it('should increase happiness when played with', () => {
      const tama = new TamaEntity(mockTamaEntity);
      tama.needs.happiness = 60;

      const result = tama.play('ball');

      expect(result.success).toBe(true);
      expect(tama.needs.happiness).toBeGreaterThan(60);
      expect(result.message).toContain('happy');
      expect(tama.stats.totalInteractions).toBe(1);
    });

    it('should increase cleanliness when cleaned', () => {
      const tama = new TamaEntity(mockTamaEntity);
      tama.needs.cleanliness = 30;

      const result = tama.clean();

      expect(result.success).toBe(true);
      expect(tama.needs.cleanliness).toBeGreaterThan(30);
      expect(result.message).toContain('clean');
      expect(tama.stats.totalInteractions).toBe(1);
    });

    it('should cap needs at 100', () => {
      const tama = new TamaEntity(mockTamaEntity);
      tama.needs.hunger = 95;

      tama.feed('premium_food');

      expect(tama.needs.hunger).toBe(100);
    });
  });

  describe('Experience and Leveling', () => {
    it('should gain experience from interactions', () => {
      const tama = new TamaEntity(mockTamaEntity);
      const initialExp = tama.experience;

      tama.feed('basic_food');

      expect(tama.experience).toBeGreaterThan(initialExp);
    });

    it('should level up when reaching experience threshold', () => {
      const tama = new TamaEntity(mockTamaEntity);

      // Force enough experience for level up
      tama.gainExperience(100);

      expect(tama.level).toBe(2);
      expect(tama.experience).toBeLessThan(100); // Should reset with overflow
    });

    it('should calculate experience requirements exponentially', () => {
      const tama = new TamaEntity(mockTamaEntity);

      const level1Req = tama.getExperienceToNextLevel();
      tama.level = 2;
      const level2Req = tama.getExperienceToNextLevel();

      expect(level2Req).toBeGreaterThan(level1Req * 1.5); // Should scale up
    });
  });

  describe('Mood and Status', () => {
    it('should calculate mood based on overall needs', () => {
      const tama = new TamaEntity(mockTamaEntity);

      // Happy tama
      expect(tama.getMood()).toBe('ecstatic');

      // Reduce some needs - avg will be (30+40+100+100)/4 = 67.5
      tama.needs.hunger = 30;
      tama.needs.happiness = 40;
      expect(tama.getMood()).toBe('content'); // 67.5 > 55

      // Very low needs - avg will be (10+5+15+100)/4 = 32.5
      tama.needs.hunger = 10;
      tama.needs.happiness = 5;
      tama.needs.energy = 15;
      expect(tama.getMood()).toBe('sad'); // 32.5 > 20 but < 35
    });

    it('should be ready for jobs only when needs are adequate', () => {
      const tama = new TamaEntity(mockTamaEntity);

      expect(tama.isReadyForJob()).toBe(true);

      tama.needs.energy = 20;
      expect(tama.isReadyForJob()).toBe(false);

      tama.needs.energy = 100;
      tama.needs.happiness = 10;
      expect(tama.isReadyForJob()).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = new TamaEntity(mockTamaEntity);
      original.gainExperience(50);
      original.feed('basic_food');

      const serialized = original.serialize();
      const deserialized = new TamaEntity(serialized);

      expect(deserialized.id).toBe(original.id);
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.experience).toBe(original.experience);
      expect(deserialized.needs.hunger).toBe(original.needs.hunger);
      expect(deserialized.stats.totalInteractions).toBe(original.stats.totalInteractions);
    });
  });
});