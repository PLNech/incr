/**
 * VisitorArrivalSystem Tests - Testing realistic queue formation
 */

import { VisitorArrivalSystem, ArrivalFactors } from './VisitorArrivalSystem';

describe('VisitorArrivalSystem', () => {
  let system: VisitorArrivalSystem;

  beforeEach(() => {
    system = new VisitorArrivalSystem();
  });

  test('should generate initial queue with 1-3 groups', () => {
    const initialQueue = system.getInitialQueue(0);
    
    expect(initialQueue.length).toBeGreaterThanOrEqual(1);
    expect(initialQueue.length).toBeLessThanOrEqual(3);
    
    // Check each group has valid properties
    initialQueue.forEach(group => {
      expect(group.size).toBeGreaterThanOrEqual(1);
      expect(group.size).toBeLessThanOrEqual(6);
      expect(['authentic', 'regular', 'curious', 'tourist', 'influencer']).toContain(group.type);
      expect(group.groupMood).toBeGreaterThanOrEqual(0.5);
      expect(group.groupMood).toBeLessThanOrEqual(1.0);
    });
  });

  test('should generate more arrivals on weekend nights', () => {
    const weekdayFactors: ArrivalFactors = {
      dayOfWeek: 2, // Wednesday
      hourOfNight: 1, // 1am
      currentOccupancy: 50,
      maxCapacity: 100,
      lineupQuality: 10,
      tier: 0
    };
    
    const weekendFactors: ArrivalFactors = {
      ...weekdayFactors,
      dayOfWeek: 5 // Friday
    };
    
    // Generate arrivals over 60 seconds
    const weekdayArrivals = system.generateArrivals(weekdayFactors, 60000);
    const weekendArrivals = system.generateArrivals(weekendFactors, 60000);
    
    // Weekend should generally have more arrivals (statistical test)
    const weekdayTotal = weekdayArrivals.reduce((sum, g) => sum + g.size, 0);
    const weekendTotal = weekendArrivals.reduce((sum, g) => sum + g.size, 0);
    
    // This might occasionally fail due to randomness, but should usually pass
    expect(weekendTotal).toBeGreaterThanOrEqual(weekdayTotal);
  });

  test('should generate different visitor types based on tier', () => {
    const earlyTierFactors: ArrivalFactors = {
      dayOfWeek: 5,
      hourOfNight: 2,
      currentOccupancy: 30,
      maxCapacity: 100,
      lineupQuality: 15,
      tier: 0
    };
    
    const lateTierFactors: ArrivalFactors = {
      ...earlyTierFactors,
      tier: 4
    };
    
    // Generate many groups to test distribution
    const earlyGroups = [];
    const lateGroups = [];
    
    for (let i = 0; i < 20; i++) {
      earlyGroups.push(...system.generateArrivals(earlyTierFactors, 1000));
      lateGroups.push(...system.generateArrivals(lateTierFactors, 1000));
    }
    
    // Count types
    const earlyAuthentic = earlyGroups.filter(g => g.type === 'authentic').length;
    const lateAuthentic = lateGroups.filter(g => g.type === 'authentic').length;
    const lateTourists = lateGroups.filter(g => g.type === 'tourist' || g.type === 'influencer').length;
    
    // Early tier should have more authentic visitors
    expect(earlyAuthentic).toBeGreaterThan(0);
    expect(lateTourists).toBeGreaterThan(0);
    
    // Proportion of authentic should be higher in early tiers
    const earlyAuthenticRatio = earlyAuthentic / earlyGroups.length;
    const lateAuthenticRatio = lateAuthentic / lateGroups.length;
    expect(earlyAuthenticRatio).toBeGreaterThan(lateAuthenticRatio);
  });

  test('should respond to lineup quality', () => {
    const badLineupFactors: ArrivalFactors = {
      dayOfWeek: 5,
      hourOfNight: 2,
      currentOccupancy: 50,
      maxCapacity: 100,
      lineupQuality: 5, // Poor lineup
      tier: 1
    };
    
    const goodLineupFactors: ArrivalFactors = {
      ...badLineupFactors,
      lineupQuality: 19 // Excellent lineup
    };
    
    // Generate arrivals over multiple intervals
    let badLineupTotal = 0;
    let goodLineupTotal = 0;
    
    for (let i = 0; i < 10; i++) {
      const badArrivals = system.generateArrivals(badLineupFactors, 10000);
      const goodArrivals = system.generateArrivals(goodLineupFactors, 10000);
      
      badLineupTotal += badArrivals.reduce((sum, g) => sum + g.size, 0);
      goodLineupTotal += goodArrivals.reduce((sum, g) => sum + g.size, 0);
    }
    
    // Good lineup should attract more people on average
    expect(goodLineupTotal).toBeGreaterThan(badLineupTotal);
  });

  test('should generate Klubnacht surge', () => {
    const baseFactors: ArrivalFactors = {
      dayOfWeek: 6, // Saturday
      hourOfNight: 0, // Midnight
      currentOccupancy: 200,
      maxCapacity: 500,
      lineupQuality: 15,
      tier: 2
    };
    
    const surge = system.generateKlubnachtSurge(baseFactors);
    
    // Should generate 5-15 extra groups
    expect(surge.length).toBeGreaterThanOrEqual(5);
    expect(surge.length).toBeLessThanOrEqual(15);
    
    // All should have high mood (special event excitement)
    surge.forEach(group => {
      expect(group.groupMood).toBeGreaterThanOrEqual(0.5);
    });
  });

  test('should reduce arrivals when too crowded', () => {
    const notCrowdedFactors: ArrivalFactors = {
      dayOfWeek: 5,
      hourOfNight: 2,
      currentOccupancy: 70,
      maxCapacity: 100,
      lineupQuality: 12,
      tier: 1
    };
    
    const overCrowdedFactors: ArrivalFactors = {
      ...notCrowdedFactors,
      currentOccupancy: 95 // 95% full
    };
    
    // Generate many samples
    let normalTotal = 0;
    let crowdedTotal = 0;
    
    for (let i = 0; i < 20; i++) {
      const normalArrivals = system.generateArrivals(notCrowdedFactors, 5000);
      const crowdedArrivals = system.generateArrivals(overCrowdedFactors, 5000);
      
      normalTotal += normalArrivals.length;
      crowdedTotal += crowdedArrivals.length;
    }
    
    // When overcrowded, fewer people should arrive
    expect(crowdedTotal).toBeLessThanOrEqual(normalTotal);
  });

  test('should generate valid group sizes', () => {
    const factors: ArrivalFactors = {
      dayOfWeek: 5,
      hourOfNight: 2,
      currentOccupancy: 50,
      maxCapacity: 100,
      lineupQuality: 12,
      tier: 1
    };
    
    // Generate many groups
    const groups = [];
    for (let i = 0; i < 100; i++) {
      groups.push(...system.generateArrivals(factors, 1000));
    }
    
    // Count group sizes
    const solos = groups.filter(g => g.size === 1).length;
    const pairs = groups.filter(g => g.size === 2).length;
    const small = groups.filter(g => g.size === 3).length;
    const large = groups.filter(g => g.size >= 4).length;
    
    // Most should be solo or pairs
    expect(solos + pairs).toBeGreaterThan(small + large);
    
    // All sizes should be reasonable
    groups.forEach(group => {
      expect(group.size).toBeGreaterThanOrEqual(1);
      expect(group.size).toBeLessThanOrEqual(6);
    });
  });
});