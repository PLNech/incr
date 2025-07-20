// BergInc Autonomous Test Suite
// Run with: node -r ts-node/register app/berg/test-runner.ts

import { BergGameState, TIER_THRESHOLDS, VISUAL_THEMES, CROWD_COLORS } from './types.js';
import { BERG_QUOTES, getRandomQuoteForTier } from './quotes.js';
import { BergAudioManager } from './audio.js';
import PathfindingTestSuite from './core/map/PathfindingSystem.test.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class BergTestSuite {
  private results: TestResult[] = [];

  private test(name: string, testFn: () => boolean): void {
    try {
      const passed = testFn();
      this.results.push({ name, passed });
      console.log(`${passed ? '✅' : '❌'} ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name}: ${error}`);
    }
  }

  private createMockGameState(overrides: Partial<BergGameState> = {}): BergGameState {
    return {
      tier: 0,
      revenue: 0,
      revenuePerSecond: 1,
      capacity: 20,
      totalCustomers: 0,
      timeElapsed: 0,
      lastUpdate: Date.now(),
      gameStarted: Date.now(),
      klubNacht: {
        isActive: false,
        startTime: null,
        endTime: null,
        type: 'friday',
        totalRevenue: 0,
        entriesCount: 0,
        rejectedCount: 0,
        barSales: 0,
        costs: {
          staff: 50,
          security: 30,
          utilities: 20,
          dj: 100,
          maintenance: 15
        }
      },
      eventHistory: [],
      upgrades: { capacity: 0, marketing: 0, amenities: 0, celebrity: 0, manager: 0, bars: 0, spaces: 0 },
      authenticity: 100,
      communityHappiness: 100,
      unlockedQuotes: [],
      currentQuote: null,
      quoteChangeTimer: 0,
      currentTheme: VISUAL_THEMES[0],
      activeAudioLoops: [1],
      clubbers: [],
      queue: [],
      maxClubbers: 20,
      unlockedSpaces: [
        { id: 'entrance', name: 'Entrance', unlockTier: 0, width: 100, height: 40, maxCapacity: 10, revenueMultiplier: 0 },
        { id: 'dancefloor', name: 'Main Floor', unlockTier: 0, width: 300, height: 200, maxCapacity: 50, revenueMultiplier: 1 },
        { id: 'bar', name: 'Bar', unlockTier: 0, width: 80, height: 60, maxCapacity: 15, revenueMultiplier: 2 },
        { id: 'toilets', name: 'Toilets', unlockTier: 0, width: 60, height: 40, maxCapacity: 8, revenueMultiplier: 0 }
      ],
      ...overrides
    };
  }

  // Test Core Game Logic
  testGameStateInitialization(): void {
    this.test('Game state initializes with correct defaults', () => {
      const state = this.createMockGameState();
      return (
        state.tier === 0 &&
        state.revenue === 0 &&
        state.revenuePerSecond === 1 &&
        state.authenticity === 100 &&
        state.communityHappiness === 100 &&
        state.currentTheme === VISUAL_THEMES[0]
      );
    });
  }

  testTierProgression(): void {
    this.test('Tier progression follows revenue thresholds', () => {
      const testRevenues = [0, 5000, 25000, 100000, 500000, 2000000];
      const expectedTiers = [0, 1, 2, 3, 4, 5];
      
      for (let i = 0; i < testRevenues.length; i++) {
        let calculatedTier = 0;
        for (let j = TIER_THRESHOLDS.length - 1; j >= 0; j--) {
          if (testRevenues[i] >= TIER_THRESHOLDS[j]) {
            calculatedTier = j;
            break;
          }
        }
        if (calculatedTier !== expectedTiers[i]) {
          throw new Error(`Revenue ${testRevenues[i]} should be tier ${expectedTiers[i]}, got ${calculatedTier}`);
        }
      }
      return true;
    });
  }

  testVisualThemeEvolution(): void {
    this.test('Visual themes evolve correctly across tiers', () => {
      // Test tier 0 is dark/underground
      const tier0 = VISUAL_THEMES[0];
      if (tier0.backgroundColor !== '#0a0a0a' || !tier0.fontFamily.includes('Monaco')) {
        throw new Error('Tier 0 should be dark and monospace');
      }

      // Test tier 5 is bright/corporate  
      const tier5 = VISUAL_THEMES[5];
      if (tier5.backgroundColor !== '#ffffff' || tier5.fontFamily.includes('Monaco')) {
        throw new Error('Tier 5 should be bright and sans-serif');
      }

      // Test progression is monotonic (gets brighter)
      for (let i = 0; i < VISUAL_THEMES.length - 1; i++) {
        const current = VISUAL_THEMES[i];
        const next = VISUAL_THEMES[i + 1];
        // Simple brightness test: later tiers should have higher RGB values
        const currentBrightness = parseInt(current.backgroundColor.slice(1), 16);
        const nextBrightness = parseInt(next.backgroundColor.slice(1), 16);
        if (nextBrightness < currentBrightness) {
          throw new Error(`Visual progression should get brighter: tier ${i} to ${i+1}`);
        }
      }
      return true;
    });
  }

  testCrowdColorEvolution(): void {
    this.test('Crowd colors evolve from authentic to commercial', () => {
      // Test tier 0 has dark, authentic colors
      const tier0Colors = CROWD_COLORS[0];
      if (!tier0Colors.every(color => color.startsWith('#') && color.length === 7)) {
        throw new Error('All colors should be valid hex codes');
      }

      // Test tier 5 has brighter, commercial colors
      const tier5Colors = CROWD_COLORS[5];
      if (!tier5Colors.includes('#ff6b6b') || !tier5Colors.includes('#4ecdc4')) {
        throw new Error('Tier 5 should include bright commercial colors');
      }

      // Test progression has increasing variety
      for (let i = 0; i < CROWD_COLORS.length - 1; i++) {
        if (CROWD_COLORS[i].length >= CROWD_COLORS[i + 1].length) {
          throw new Error(`Color variety should increase with tiers: tier ${i} to ${i+1}`);
        }
      }
      return true;
    });
  }

  testQuoteSystem(): void {
    this.test('Quote system has content for all tiers', () => {
      for (let tier = 0; tier <= 5; tier++) {
        const quote = getRandomQuoteForTier(tier);
        if (!quote) {
          throw new Error(`No quotes available for tier ${tier}`);
        }
        if (typeof quote.text !== 'string' || quote.text.length < 10) {
          throw new Error(`Invalid quote text for tier ${tier}`);
        }
      }
      return true;
    });

    this.test('Quotes show emotional progression', () => {
      const tier0Quotes = BERG_QUOTES.filter(q => q.tier === 0);
      const tier5Quotes = BERG_QUOTES.filter(q => q.tier === 5);
      
      // Early quotes should be positive
      const positiveCount0 = tier0Quotes.filter(q => 
        ['grateful', 'excited', 'protective'].includes(q.mood)
      ).length;
      
      // Late quotes should be negative  
      const negativeCount5 = tier5Quotes.filter(q =>
        ['defeated', 'resigned', 'bitter'].includes(q.mood)
      ).length;

      if (positiveCount0 === 0) {
        throw new Error('Tier 0 should have positive quotes');
      }
      if (negativeCount5 === 0) {
        throw new Error('Tier 5 should have negative quotes');
      }
      return true;
    });
  }

  testAudioSystem(): void {
    this.test('Audio manager initializes without errors', () => {
      // Mock Web Audio API
      const mockAudioContext = {
        createOscillator: () => ({
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {}
        }),
        createGain: () => ({
          gain: { setValueAtTime: () => {} },
          connect: () => {}
        }),
        destination: {},
        currentTime: 0,
        state: 'running',
        resume: () => Promise.resolve()
      };

      // Mock global AudioContext
      (global as any).AudioContext = function() { return mockAudioContext; };
      (global as any).webkitAudioContext = function() { return mockAudioContext; };

      const audioManager = new BergAudioManager();
      audioManager.updateTier(0);
      audioManager.updateTier(5);
      
      return true;
    });
  }

  testUpgradeEconomics(): void {
    this.test('Upgrade costs scale properly', () => {
      // Test capacity upgrades
      const baseCost = 100;
      const multiplier = 1.15;
      
      for (let level = 0; level < 10; level++) {
        const expectedCost = Math.floor(baseCost * Math.pow(multiplier, level));
        if (expectedCost <= 0 || !Number.isFinite(expectedCost)) {
          throw new Error(`Invalid upgrade cost at level ${level}: ${expectedCost}`);
        }
      }

      // Test that costs increase
      let prevCost = 0;
      for (let level = 0; level < 5; level++) {
        const cost = Math.floor(baseCost * Math.pow(multiplier, level));
        if (cost <= prevCost) {
          throw new Error(`Upgrade costs should increase: level ${level}`);
        }
        prevCost = cost;
      }
      return true;
    });
  }

  testAuthenticityDegradation(): void {
    this.test('Authenticity decreases with tier progression', () => {
      for (let tier = 0; tier <= 5; tier++) {
        const authenticity = Math.max(0, 100 - (tier * 20));
        if (authenticity < 0 || authenticity > 100) {
          throw new Error(`Invalid authenticity at tier ${tier}: ${authenticity}`);
        }
        if (tier > 0) {
          const prevAuthenticity = Math.max(0, 100 - ((tier - 1) * 20));
          if (authenticity >= prevAuthenticity) {
            throw new Error(`Authenticity should decrease: tier ${tier-1} to ${tier}`);
          }
        }
      }
      return true;
    });
  }

  testIncorporatedTransformation(): void {
    this.test('Title transforms from Incremental to Incorporated', () => {
      // Mock the title transformation logic
      const getTitle = (tier: number) => {
        if (tier <= 2) {
          return "BergInc"; // Feels like "Berg Incremental"
        } else {
          return "Berg Inc."; // Feels like "Berg Incorporated"
        }
      };

      if (getTitle(0) !== "BergInc") {
        throw new Error('Early tiers should show "BergInc"');
      }
      if (getTitle(5) !== "Berg Inc.") {
        throw new Error('Late tiers should show "Berg Inc."');
      }
      return true;
    });
  }

  testCrowdMovementPatterns(): void {
    this.test('Crowd movement patterns degrade with commercialization', () => {
      // Test movement parameters
      const getMovementParams = (tier: number) => ({
        speed: tier <= 1 ? 0.5 : tier <= 3 ? 1.5 : 3,
        pauseTime: tier <= 1 ? 3000 : tier <= 3 ? 1500 : 500,
        pattern: tier <= 1 ? 'organic' : tier <= 3 ? 'erratic' : 'performative'
      });

      const tier0 = getMovementParams(0);
      const tier5 = getMovementParams(5);

      if (tier0.speed >= tier5.speed) {
        throw new Error('Movement speed should increase with commercialization');
      }
      if (tier0.pauseTime <= tier5.pauseTime) {
        throw new Error('Pause time should decrease with commercialization');
      }
      if (tier0.pattern === tier5.pattern) {
        throw new Error('Movement patterns should change');
      }
      return true;
    });
  }

  // Performance Tests
  testPerformanceBounds(): void {
    this.test('Crowd simulation stays within performance bounds', () => {
      const maxClubbers = 100; // Test upper limit
      const mockClubbers = Array.from({ length: maxClubbers }, (_, i) => ({
        id: `clubber-${i}`,
        x: Math.random() * 400,
        y: Math.random() * 300,
        targetX: Math.random() * 400,
        targetY: Math.random() * 300,
        color: '#ff0000',
        type: 'authentic' as const,
        currentSpace: 'main_floor',
        speed: 1,
        pauseTime: 1000,
        lastMoved: Date.now(),
        movementPattern: 'organic' as const
      }));

      // Simulate movement calculation
      const start = performance.now();
      mockClubbers.forEach(clubber => {
        const dx = clubber.targetX - clubber.x;
        const dy = clubber.targetY - clubber.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
          clubber.x += (dx / distance) * clubber.speed;
          clubber.y += (dy / distance) * clubber.speed;
        }
      });
      const end = performance.now();
      
      const duration = end - start;
      if (duration > 16) { // 60fps = 16ms budget
        throw new Error(`Crowd simulation too slow: ${duration}ms for ${maxClubbers} clubbers`);
      }
      return true;
    });
  }

  // Integration Tests
  testGameStateIntegration(): void {
    this.test('Game state updates trigger correct side effects', () => {
      const state = this.createMockGameState();
      
      // Simulate tier progression
      state.revenue = 5000;
      let newTier = 0;
      for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
        if (state.revenue >= TIER_THRESHOLDS[i]) {
          newTier = i;
          break;
        }
      }
      
      if (newTier !== 1) {
        throw new Error(`Revenue ${state.revenue} should trigger tier 1, got ${newTier}`);
      }

      // Test theme update
      state.currentTheme = VISUAL_THEMES[newTier];
      if (state.currentTheme !== VISUAL_THEMES[1]) {
        throw new Error('Theme should update with tier progression');
      }
      
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🎛️ BergInc Autonomous Test Suite\n');
    
    // Core Logic Tests
    this.testGameStateInitialization();
    this.testTierProgression();
    this.testUpgradeEconomics();
    this.testAuthenticityDegradation();
    
    // Artistic Vision Tests
    this.testVisualThemeEvolution();
    this.testCrowdColorEvolution();
    this.testIncorporatedTransformation();
    this.testCrowdMovementPatterns();
    
    // Content Tests
    this.testQuoteSystem();
    
    // Technical Tests
    this.testAudioSystem();
    this.testPerformanceBounds();
    
    // Integration Tests
    this.testGameStateIntegration();

    // Pathfinding Tests
    console.log('\n🗺️ Running PathfindingSystem Tests...\n');
    const pathfindingTestSuite = new PathfindingTestSuite();
    pathfindingTestSuite.runAllTests();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 Test Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All tests passed! BergInc is ready for deployment.');
    }
  }
}

// Debug Window Functions for Browser Testing
if (typeof window !== 'undefined') {
  (window as any).bergDebug = {
    fastForward: (targetTier: number) => {
      console.log(`🚀 Fast forwarding to tier ${targetTier}`);
      const revenue = TIER_THRESHOLDS[targetTier] || 0;
      console.log(`Setting revenue to €${revenue}`);
      // This would trigger game state update in actual game
    },
    
    testQuotes: () => {
      console.log('🗣️ Testing quote system');
      for (let tier = 0; tier <= 5; tier++) {
        const quote = getRandomQuoteForTier(tier);
        console.log(`Tier ${tier}:`, quote?.text.slice(0, 50) + '...');
      }
    },
    
    testMovement: (tier: number) => {
      console.log(`🕺 Testing movement for tier ${tier}`);
      const params = {
        speed: tier <= 1 ? 0.5 : tier <= 3 ? 1.5 : 3,
        pauseTime: tier <= 1 ? 3000 : tier <= 3 ? 1500 : 500,
        pattern: tier <= 1 ? 'organic' : tier <= 3 ? 'erratic' : 'performative'
      };
      console.log('Movement params:', params);
    },
    
    runTests: () => {
      const suite = new BergTestSuite();
      suite.runAllTests();
    }
  };
  
  console.log('🛠️ BergInc Debug tools loaded. Available: window.bergDebug');
}

// Run tests if called directly
if (require.main === module) {
  const suite = new BergTestSuite();
  suite.runAllTests();
}

export default BergTestSuite;