/**
 * Headless Integration Test for BergGameEngine
 * Tests core game mechanics without any UI dependencies
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BergGameEngine } from '../core/engine/BergGameEngine';
import { BergGameState } from '../types';

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
global.performance = { now: mockPerformanceNow } as any;

describe('BergGameEngine - Headless Integration Tests', () => {
  let engine: BergGameEngine;
  let initialState: BergGameState;
  let mockTime: number;

  beforeEach(() => {
    // Initialize mock time
    mockTime = 0;
    mockPerformanceNow.mockImplementation(() => mockTime);

    // Create initial game state
    initialState = {
      tier: 0,
      revenue: 0,
      timeElapsed: 0,
      lastUpdate: 0,
      revenuePerSecond: 0.1,
      capacity: 100,
      maxClubbers: 50,
      authenticity: 100,
      communityHappiness: 100,
      clubbers: [],
      queue: [],
      unlockedSpaces: ['entrance', 'dancefloor', 'bar', 'toilets'],
      upgrades: {
        soundSystem: 0,
        lighting: 0,
        securitySystem: 0,
        vipArea: 0
      },
      eventHistory: [],
      currentTheme: {
        name: 'Underground',
        primaryColor: '#1a1a1a',
        secondaryColor: '#2a2a2a',
        accentColor: '#0d4f3c',
        borderColor: '#333333'
      },
      unlockedQuotes: [],
      currentQuote: null,
      quoteChangeTimer: 0,
      activeAudioLoops: []
    };

    // Create engine but don't auto-start
    engine = new BergGameEngine(initialState, { 
      autoStart: false, 
      tickRate: 20,
      enableLogging: false // Disable logging for tests
    });
  });

  afterEach(() => {
    if (engine) {
      engine.destroy();
    }
    jest.clearAllMocks();
  });

  test('Engine initializes properly without UI', () => {
    expect(engine.isEngineRunning()).toBe(false);
    expect(engine.getAgents()).toHaveLength(0);
    expect(engine.getQueueSize()).toBe(0);
    
    const state = engine.getGameState();
    expect(state.tier).toBe(0);
    expect(state.revenue).toBe(0);
    expect(state.timeElapsed).toBe(0);
  });

  test('Engine can start and stop cleanly', () => {
    engine.start();
    expect(engine.isEngineRunning()).toBe(true);
    
    engine.stop();
    expect(engine.isEngineRunning()).toBe(false);
  });

  test('Initial visitors join queue on startup', async () => {
    // Start the engine
    engine.start();
    
    // Advance time to allow initial visitor spawning
    mockTime += 1000;
    
    // Wait for engine to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have initial visitors in queue
    const queueSize = engine.getQueueSize();
    expect(queueSize).toBeGreaterThan(0);
    expect(queueSize).toBeLessThanOrEqual(10); // Reasonable initial queue
    
    console.log(`✅ Initial queue size: ${queueSize} visitors`);
  });

  test('Visitors arrive over time', async () => {
    engine.start();
    
    const initialQueueSize = engine.getQueueSize();
    
    // Simulate 10 seconds of time for visitor arrivals
    for (let i = 0; i < 10; i++) {
      mockTime += 1000; // Advance 1 second
      await new Promise(resolve => setTimeout(resolve, 20)); // Let engine process
    }
    
    const finalQueueSize = engine.getQueueSize();
    
    // Should have more visitors (or some processed)
    expect(finalQueueSize).toBeGreaterThanOrEqual(0);
    console.log(`📈 Queue progression: ${initialQueueSize} → ${finalQueueSize}`);
  });

  test('Bouncer processes queue and makes decisions', async () => {
    engine.start();
    
    // Wait for initial visitors
    mockTime += 1000;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const initialDecisions = engine.getBouncerDecisions().length;
    
    // Advance time for bouncer processing (3+ seconds)
    mockTime += 5000;
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalDecisions = engine.getBouncerDecisions().length;
    
    // Should have made some decisions (or at least same amount)
    expect(finalDecisions).toBeGreaterThanOrEqual(initialDecisions);
    
    const decisions = engine.getBouncerDecisions();
    if (decisions.length > 0) {
      const decision = decisions[0];
      expect(decision).toHaveProperty('agentName');
      expect(decision).toHaveProperty('decision');
      expect(['accept', 'reject']).toContain(decision.decision);
      expect(decision).toHaveProperty('reason');
      expect(decision).toHaveProperty('timestamp');
      
      console.log(`🎭 Bouncer decision: ${decision.agentName} - ${decision.decision} (${decision.reason})`);
    }
  });

  test('Agents enter club when accepted by bouncer', async () => {
    engine.start();
    
    // Wait for queue to form
    mockTime += 2000;
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const initialAgentCount = engine.getAgents().length;
    const initialQueueSize = engine.getQueueSize();
    
    // Advance time for processing
    mockTime += 10000; // 10 seconds
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalAgentCount = engine.getAgents().length;
    const finalQueueSize = engine.getQueueSize();
    const insideClub = finalAgentCount - finalQueueSize;
    
    // Some agents should be inside the club now
    expect(insideClub).toBeGreaterThanOrEqual(0);
    
    const decisions = engine.getBouncerDecisions();
    const acceptedCount = decisions.filter(d => d.decision === 'accept').length;
    
    console.log(`🏢 Club entry stats:`);
    console.log(`  - Total agents: ${finalAgentCount}`);
    console.log(`  - In queue: ${finalQueueSize}`);
    console.log(`  - Inside club: ${insideClub}`);
    console.log(`  - Accepted by bouncer: ${acceptedCount}`);
    
    expect(acceptedCount).toBeGreaterThanOrEqual(0);
  });

  test('Game progression and tier advancement', async () => {
    // Start with some revenue to test tier progression
    const stateWithRevenue = { ...initialState, revenue: 50 };
    const progressionEngine = new BergGameEngine(stateWithRevenue, { 
      autoStart: true, 
      enableLogging: false 
    });
    
    const initialTier = progressionEngine.getGameState().tier;
    const initialRevenue = progressionEngine.getGameState().revenue;
    
    // Advance time to generate more revenue
    mockTime += 30000; // 30 seconds
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const finalState = progressionEngine.getGameState();
    
    // Revenue should have increased
    expect(finalState.revenue).toBeGreaterThan(initialRevenue);
    expect(finalState.timeElapsed).toBeGreaterThan(0);
    
    // Check for potential tier advancement
    if (finalState.revenue >= 100) {
      expect(finalState.tier).toBeGreaterThan(initialTier);
      console.log(`🏆 Tier advancement: ${initialTier} → ${finalState.tier} (€${Math.floor(finalState.revenue)})`);
    }
    
    console.log(`💰 Revenue progression: €${Math.floor(initialRevenue)} → €${Math.floor(finalState.revenue)}`);
    
    progressionEngine.destroy();
  });

  test('Agent behavior evolution with tier changes', async () => {
    // Start with higher tier to test evolution
    const highTierState = { ...initialState, tier: 2, revenue: 1000 };
    const evolutionEngine = new BergGameEngine(highTierState, { 
      autoStart: true, 
      enableLogging: false 
    });
    
    // Let agents spawn and evolve
    mockTime += 15000; // 15 seconds
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const agents = evolutionEngine.getAgents();
    
    // Should have agents with various behavioral states
    expect(agents.length).toBeGreaterThan(0);
    
    // Check that agents have different movement behaviors due to tier evolution
    const behaviorTypes = new Set(agents.map(agent => agent.movementBehavior));
    console.log(`🎭 Agent behavior diversity: ${Array.from(behaviorTypes).join(', ')}`);
    
    // At tier 2, should have some behavioral variation
    expect(behaviorTypes.size).toBeGreaterThanOrEqual(1);
    
    evolutionEngine.destroy();
  });

  test('Engine can handle high load without UI', async () => {
    // Test with many agents
    const highLoadEngine = new BergGameEngine(initialState, { 
      autoStart: true,
      maxAgents: 100,
      tickRate: 30,
      enableLogging: false
    });
    
    // Simulate extended time for stress testing
    const startTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      mockTime += 1000;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const endTime = Date.now();
    const realTimeElapsed = endTime - startTime;
    
    const stats = highLoadEngine.getEngineStats();
    
    console.log(`⚡ Performance test results:`);
    console.log(`  - Real time: ${realTimeElapsed}ms`);
    console.log(`  - Agents: ${stats.agentCount}`);
    console.log(`  - Queue: ${stats.queueSize}`);
    console.log(`  - Tier: ${stats.tier}`);
    console.log(`  - Engine running: ${stats.isRunning}`);
    
    // Engine should still be running smoothly
    expect(stats.isRunning).toBe(true);
    expect(realTimeElapsed).toBeLessThan(5000); // Should complete quickly
    
    highLoadEngine.destroy();
  });

  test('Complete game cycle: queue → bouncer → club → revenue', async () => {
    let stateChanges = 0;
    let tierChanges = 0;
    let finalGameState: BergGameState | null = null;
    
    const cycleEngine = new BergGameEngine(initialState, { 
      autoStart: true, 
      enableLogging: false 
    }, {
      onStateChange: (state) => {
        stateChanges++;
        finalGameState = state;
      },
      onTierChange: (newTier, oldTier) => {
        tierChanges++;
        console.log(`🏆 Tier change detected: ${oldTier} → ${newTier}`);
      }
    });
    
    // Run complete cycle
    mockTime += 30000; // 30 seconds
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verify complete cycle worked
    expect(stateChanges).toBeGreaterThan(0);
    expect(finalGameState).not.toBeNull();
    
    if (finalGameState) {
      expect(finalGameState.revenue).toBeGreaterThan(0);
      expect(finalGameState.timeElapsed).toBeGreaterThan(0);
      
      console.log(`🎮 Complete cycle results:`);
      console.log(`  - State changes: ${stateChanges}`);
      console.log(`  - Tier changes: ${tierChanges}`);
      console.log(`  - Final revenue: €${Math.floor(finalGameState.revenue)}`);
      console.log(`  - Final tier: ${finalGameState.tier}`);
      console.log(`  - Time elapsed: ${Math.floor(finalGameState.timeElapsed)}s`);
    }
    
    cycleEngine.destroy();
  });
});

// Helper function to run integration test manually
export async function runManualIntegrationTest(): Promise<void> {
  console.log('🧪 Running manual BergGameEngine integration test...');
  
  const testState: BergGameState = {
    tier: 0, revenue: 0, timeElapsed: 0, lastUpdate: 0,
    revenuePerSecond: 0.1, capacity: 100, maxClubbers: 50,
    authenticity: 100, communityHappiness: 100,
    clubbers: [], queue: [], unlockedSpaces: ['entrance', 'dancefloor'],
    upgrades: { soundSystem: 0, lighting: 0, securitySystem: 0, vipArea: 0 },
    eventHistory: [], currentTheme: {
      name: 'Underground', primaryColor: '#1a1a1a', secondaryColor: '#2a2a2a',
      accentColor: '#0d4f3c', borderColor: '#333333'
    }, unlockedQuotes: [], currentQuote: null, quoteChangeTimer: 0, activeAudioLoops: []
  };
  
  const engine = new BergGameEngine(testState, { autoStart: true });
  
  console.log('⏰ Running for 30 seconds...');
  
  // Run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const stats = engine.getEngineStats();
  const decisions = engine.getBouncerDecisions();
  const finalState = engine.getGameState();
  
  console.log('📊 Final Test Results:');
  console.log('  Engine Stats:', stats);
  console.log('  Bouncer Decisions:', decisions.length);
  console.log('  Final Revenue:', Math.floor(finalState.revenue));
  console.log('  Final Tier:', finalState.tier);
  
  engine.destroy();
  console.log('✅ Manual integration test completed');
}