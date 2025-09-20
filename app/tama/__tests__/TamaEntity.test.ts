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
      expect(deserialized.sleepState).toEqual(original.sleepState);
    });
  });

  describe('Sleep System', () => {
    it('should have initial sleep state when created', () => {
      const tama = TamaEntity.createRandom('Sleepy');

      expect(tama.sleepState).toBeDefined();
      expect(tama.sleepState.isAsleep).toBe(false);
      expect(tama.sleepState.sleepStartTime).toBe(0);
      expect(tama.sleepState.energyRecoveryRate).toBe(2); // 2 energy per minute
      expect(tama.sleepState.canAutoWakeup).toBe(false);
    });

    it('should automatically fall asleep when energy drops to 20% or below', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 25; // Above threshold

      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(false);

      tama.needs.energy = 20; // At threshold
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);
      expect(tama.sleepState.sleepStartTime).toBeGreaterThan(0);

      tama.needs.energy = 15; // Below threshold
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true); // Should stay asleep
    });

    it('should not fall asleep if already asleep', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;

      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      const originalSleepStartTime = tama.sleepState.sleepStartTime;
      advanceTime(1000); // Advance 1 second

      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);
      expect(tama.sleepState.sleepStartTime).toBe(originalSleepStartTime); // Should not reset
    });

    it('should recover energy while sleeping at the specified rate', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;
      tama.sleepState.energyRecoveryRate = 6; // 6 energy per minute for faster testing

      // Fall asleep
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      // Advance time by 5 minutes (300 seconds)
      advanceTime(5 * 60 * 1000);

      // Update needs should process sleep recovery
      tama.updateNeeds();

      // Should recover 6 * 5 = 30 energy (approximately due to floating point)
      expect(tama.needs.energy).toBeCloseTo(40, 1); // 10 + 30 = 40
    });

    it('should not decay energy while sleeping', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;

      // Fall asleep
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      const sleepStartEnergy = tama.needs.energy;

      // Advance time significantly
      advanceTime(60 * 60 * 1000); // 1 hour

      tama.updateNeeds();

      // Energy should be higher due to recovery, not lower due to decay
      expect(tama.needs.energy).toBeGreaterThanOrEqual(sleepStartEnergy);
    });

    it('should wake up manually when wakeUp() is called', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;

      // Fall asleep
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      // Wake up manually
      const result = tama.wakeUp();

      expect(result.success).toBe(true);
      expect(result.message).toContain('wakes up refreshed');
      expect(result.experienceGained).toBe(1);
      expect(tama.sleepState.isAsleep).toBe(false);
      expect(tama.stats.totalInteractions).toBe(1);
    });

    it('should not wake up if already awake', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 90; // High energy, not sleeping

      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(false);

      const result = tama.wakeUp();

      expect(result.success).toBe(false);
      expect(result.message).toContain('already awake');
      expect(result.experienceGained).toBe(0);
      expect(tama.stats.totalInteractions).toBe(0); // No interaction counted
    });

    it('should auto wake up when energy reaches 95% if canAutoWakeup is enabled', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;
      tama.sleepState.energyRecoveryRate = 20; // Fast recovery for testing
      tama.sleepState.canAutoWakeup = true;

      // Fall asleep
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      // Advance time enough to recover to 95%
      // Need to recover 85 energy at 20/minute = 4.25 minutes
      advanceTime(5 * 60 * 1000); // 5 minutes

      tama.updateNeeds();

      expect(tama.needs.energy).toBeGreaterThanOrEqual(95);
      expect(tama.sleepState.isAsleep).toBe(false); // Should auto wake up
    });

    it('should NOT auto wake up if canAutoWakeup is false, even with high energy', () => {
      const tama = mockTamaEntity();
      tama.needs.energy = 10;
      tama.sleepState.energyRecoveryRate = 20;
      tama.sleepState.canAutoWakeup = false; // Default early game setting

      // Fall asleep
      tama.updateNeeds();
      expect(tama.sleepState.isAsleep).toBe(true);

      // Advance time enough to recover to 100%
      advanceTime(10 * 60 * 1000); // 10 minutes

      tama.updateNeeds();

      expect(tama.needs.energy).toBe(100); // Should be capped at 100
      expect(tama.sleepState.isAsleep).toBe(true); // Should stay asleep (manual wake only)
    });

    it('should upgrade sleep abilities correctly', () => {
      const tama = mockTamaEntity();

      // Test recovery rate upgrade
      tama.upgradeSleep(10, undefined);
      expect(tama.sleepState.energyRecoveryRate).toBe(10);
      expect(tama.sleepState.canAutoWakeup).toBe(false); // Should not change

      // Test auto wakeup upgrade
      tama.upgradeSleep(undefined, true);
      expect(tama.sleepState.energyRecoveryRate).toBe(10); // Should not change
      expect(tama.sleepState.canAutoWakeup).toBe(true);

      // Test both upgrades
      tama.upgradeSleep(15, false);
      expect(tama.sleepState.energyRecoveryRate).toBe(15);
      expect(tama.sleepState.canAutoWakeup).toBe(false);
    });
  });
});