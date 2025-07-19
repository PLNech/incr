// Safe Game State Utilities for BergInc
import { BergGameState, VISUAL_THEMES } from './types';

// Safe game state accessor with fallbacks
export function safeGameState(gameState: BergGameState | null): Required<BergGameState> {
  const defaults: Required<BergGameState> = {
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
    ]
  };

  if (!gameState) return defaults;

  return {
    tier: gameState.tier ?? defaults.tier,
    revenue: gameState.revenue ?? defaults.revenue,
    revenuePerSecond: gameState.revenuePerSecond ?? defaults.revenuePerSecond,
    capacity: gameState.capacity ?? defaults.capacity,
    totalCustomers: gameState.totalCustomers ?? defaults.totalCustomers,
    timeElapsed: gameState.timeElapsed ?? defaults.timeElapsed,
    lastUpdate: gameState.lastUpdate ?? defaults.lastUpdate,
    gameStarted: gameState.gameStarted ?? defaults.gameStarted,
    klubNacht: gameState.klubNacht ?? defaults.klubNacht,
    eventHistory: gameState.eventHistory ?? defaults.eventHistory,
    upgrades: {
      capacity: gameState.upgrades?.capacity ?? defaults.upgrades.capacity,
      marketing: gameState.upgrades?.marketing ?? defaults.upgrades.marketing,
      amenities: gameState.upgrades?.amenities ?? defaults.upgrades.amenities,
      celebrity: gameState.upgrades?.celebrity ?? defaults.upgrades.celebrity,
      manager: gameState.upgrades?.manager ?? defaults.upgrades.manager,
      bars: gameState.upgrades?.bars ?? defaults.upgrades.bars,
      spaces: gameState.upgrades?.spaces ?? defaults.upgrades.spaces
    },
    authenticity: gameState.authenticity ?? defaults.authenticity,
    communityHappiness: gameState.communityHappiness ?? defaults.communityHappiness,
    unlockedQuotes: gameState.unlockedQuotes ?? defaults.unlockedQuotes,
    currentQuote: gameState.currentQuote ?? defaults.currentQuote,
    quoteChangeTimer: gameState.quoteChangeTimer ?? defaults.quoteChangeTimer,
    currentTheme: gameState.currentTheme ?? defaults.currentTheme,
    activeAudioLoops: gameState.activeAudioLoops ?? defaults.activeAudioLoops,
    clubbers: gameState.clubbers ?? defaults.clubbers,
    queue: gameState.queue ?? defaults.queue,
    maxClubbers: gameState.maxClubbers ?? defaults.maxClubbers,
    unlockedSpaces: gameState.unlockedSpaces ?? defaults.unlockedSpaces
  };
}

// Runtime validation functions
export function validateGameState(gameState: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!gameState) {
    errors.push('Game state is null or undefined');
    return { isValid: false, errors };
  }

  // Check required numeric properties
  const numericProps = ['tier', 'revenue', 'revenuePerSecond', 'capacity', 'authenticity', 'communityHappiness'];
  numericProps.forEach(prop => {
    if (typeof gameState[prop] !== 'number' || !Number.isFinite(gameState[prop])) {
      errors.push(`${prop} must be a finite number, got: ${typeof gameState[prop]}`);
    }
  });

  // Check upgrades object
  if (!gameState.upgrades || typeof gameState.upgrades !== 'object') {
    errors.push('upgrades must be an object');
  } else {
    const upgradeProps = ['capacity', 'marketing', 'amenities', 'celebrity'];
    upgradeProps.forEach(prop => {
      if (typeof gameState.upgrades[prop] !== 'number') {
        errors.push(`upgrades.${prop} must be a number, got: ${typeof gameState.upgrades[prop]}`);
      }
    });
  }

  // Check arrays
  if (!Array.isArray(gameState.clubbers)) {
    errors.push('clubbers must be an array');
  }

  if (!Array.isArray(gameState.unlockedQuotes)) {
    errors.push('unlockedQuotes must be an array');
  }

  // Check theme object
  if (!gameState.currentTheme || typeof gameState.currentTheme !== 'object') {
    errors.push('currentTheme must be an object');
  }

  return { isValid: errors.length === 0, errors };
}

// Error boundary utility for React components (not a HOC)
export function createGameStateErrorBoundary() {
  return function GameStateErrorBoundary({ 
    gameState, 
    children 
  }: { 
    gameState: BergGameState | null; 
    children: React.ReactNode 
  }) {
    const validation = validateGameState(gameState);
    
    if (!validation.isValid) {
      console.error('🚨 Game State Validation Failed:', validation.errors);
      
      return null; // Return null for now to avoid JSX compilation issues
    }

    return children as JSX.Element;
  };
}

// Development-only runtime checks
export function addRuntimeChecks(gameState: BergGameState | null, context: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  const validation = validateGameState(gameState);
  if (!validation.isValid) {
    console.group(`🚨 Runtime Check Failed: ${context}`);
    validation.errors.forEach(error => console.error(error));
    console.groupEnd();
    
    // Add to global error tracking
    if (typeof window !== 'undefined') {
      (window as any).bergErrors = (window as any).bergErrors || [];
      (window as any).bergErrors.push({
        context,
        errors: validation.errors,
        timestamp: Date.now(),
        gameState: gameState
      });
    }
  }
}

// Automated test runner for development
export function runAutomatedTests(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  console.group('🎛️ BergInc Automated Tests');
  
  const tests = [
    {
      name: 'Safe game state handles null input',
      test: () => {
        const safe = safeGameState(null);
        return safe.tier === 0 && safe.revenue === 0 && safe.upgrades.capacity === 0;
      }
    },
    {
      name: 'Safe game state preserves valid properties',
      test: () => {
        const input = { tier: 3, revenue: 50000, upgrades: { capacity: 5 } } as any;
        const safe = safeGameState(input);
        return safe.tier === 3 && safe.revenue === 50000 && safe.upgrades.capacity === 5;
      }
    },
    {
      name: 'Validation catches missing upgrades',
      test: () => {
        const invalid = { tier: 0, revenue: 0 };
        const validation = validateGameState(invalid);
        return !validation.isValid && validation.errors.some(e => e.includes('upgrades'));
      }
    },
    {
      name: 'Validation passes complete state',
      test: () => {
        const complete = safeGameState(null);
        const validation = validateGameState(complete);
        return validation.isValid;
      }
    }
  ];

  let passed = 0;
  tests.forEach(test => {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error}`);
    }
  });

  console.log(`📊 Tests: ${passed}/${tests.length} passed`);
  console.groupEnd();

  // Add test results to global debug
  (window as any).bergTestResults = { passed, total: tests.length, timestamp: Date.now() };
}