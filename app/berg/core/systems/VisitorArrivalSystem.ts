/**
 * VisitorArrivalSystem - Models realistic queue formation at Berghain
 * Uses Poisson distribution to simulate visitor arrivals based on multiple factors
 */

import { AgentType } from '../agents/Agent';

export interface ArrivalFactors {
  dayOfWeek: number; // 0-6 (0 = Monday, 5 = Friday, 6 = Saturday)
  hourOfNight: number; // 22-10 (22:00 to 10:00)
  currentOccupancy: number; // Number of people inside
  maxCapacity: number;
  lineupQuality: number; // 1-20 (D20 roll for DJ quality)
  tier: number; // Game tier affects crowd type
  weatherCondition?: 'good' | 'bad' | 'neutral';
}

export interface VisitorGroup {
  size: number;
  type: AgentType;
  arrivalTime: number;
  groupMood: number; // 0-1, affects entry chance
}

export class VisitorArrivalSystem {
  private lastArrivalTime: number = 0;
  private baseArrivalRate: number = 0.5; // Base visitors per second
  
  // Peak hours for Berghain (midnight to 4am on weekends)
  private readonly PEAK_HOURS = {
    weekday: { start: 23, end: 2 },
    weekend: { start: 0, end: 6 } // Midnight to 6am
  };
  
  // Day factors (Friday/Saturday are peak)
  private readonly DAY_FACTORS = [
    0.2,  // Monday
    0.3,  // Tuesday
    0.4,  // Wednesday
    0.5,  // Thursday
    1.5,  // Friday
    2.0,  // Saturday
    0.8   // Sunday
  ];
  
  constructor() {
    this.lastArrivalTime = Date.now();
  }
  
  /**
   * Calculate arrival rate using Poisson distribution parameters
   */
  private calculateArrivalRate(factors: ArrivalFactors): number {
    let rate = this.baseArrivalRate;
    
    // Day of week factor
    const dayFactor = this.DAY_FACTORS[factors.dayOfWeek] || 0.5;
    rate *= dayFactor;
    
    // Time of night factor
    const timeFactor = this.getTimeFactor(factors.hourOfNight, factors.dayOfWeek);
    rate *= timeFactor;
    
    // Lineup quality (good DJs attract more people)
    const lineupFactor = 0.5 + (factors.lineupQuality / 40); // 0.5 to 1.0
    rate *= lineupFactor;
    
    // Occupancy factor (word spreads when it's good inside)
    const occupancyRatio = factors.currentOccupancy / factors.maxCapacity;
    let occupancyFactor = 1.0;
    
    if (occupancyRatio < 0.3) {
      occupancyFactor = 0.7; // Too empty, less attractive
    } else if (occupancyRatio > 0.7 && occupancyRatio < 0.9) {
      occupancyFactor = 1.3; // Good vibe, attracts more
    } else if (occupancyRatio >= 0.9) {
      occupancyFactor = 0.8; // Too full, people might not bother
    }
    
    rate *= occupancyFactor;
    
    // Tier-based adjustments
    if (factors.tier >= 3) {
      rate *= 1.5; // More mainstream = more visitors
    }
    
    // Weather (optional)
    if (factors.weatherCondition === 'bad') {
      rate *= 0.7;
    } else if (factors.weatherCondition === 'good') {
      rate *= 1.1;
    }
    
    return Math.max(0.1, rate); // Minimum rate
  }
  
  /**
   * Get time-based factor for arrival rate
   */
  private getTimeFactor(hour: number, dayOfWeek: number): number {
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    
    if (isWeekend) {
      // Weekend patterns
      if (hour >= 0 && hour <= 6) return 1.5;   // Peak hours
      if (hour >= 23 || hour <= 1) return 1.2;  // Building up
      if (hour >= 6 && hour <= 8) return 0.8;   // Winding down
      if (hour >= 8 && hour <= 10) return 0.4;  // Late stragglers
      return 0.3; // Off hours
    } else {
      // Weekday patterns
      if (hour >= 23 || hour <= 2) return 1.0;  // Modest peak
      if (hour >= 2 && hour <= 4) return 0.6;   // Tapering off
      return 0.2; // Very quiet
    }
  }
  
  /**
   * Generate arrivals using Poisson process
   */
  public generateArrivals(factors: ArrivalFactors, deltaTime: number): VisitorGroup[] {
    const arrivals: VisitorGroup[] = [];
    const arrivalRate = this.calculateArrivalRate(factors);
    
    // Expected arrivals in this time period
    const lambda = arrivalRate * (deltaTime / 1000); // Convert to seconds
    
    // Sample from Poisson distribution
    const numArrivals = this.poissonSample(lambda);
    
    for (let i = 0; i < numArrivals; i++) {
      arrivals.push(this.generateVisitorGroup(factors));
    }
    
    return arrivals;
  }
  
  /**
   * Generate a single visitor group with characteristics
   */
  private generateVisitorGroup(factors: ArrivalFactors): VisitorGroup {
    // Group size distribution (most come in small groups)
    const groupSizeRoll = Math.random();
    let size = 1;
    
    if (groupSizeRoll < 0.4) {
      size = 1; // 40% solo
    } else if (groupSizeRoll < 0.7) {
      size = 2; // 30% pairs
    } else if (groupSizeRoll < 0.9) {
      size = 3; // 20% small groups
    } else {
      size = 4 + Math.floor(Math.random() * 3); // 10% larger groups (4-6)
    }
    
    // Determine visitor type based on tier and time
    let type: AgentType = 'regular';
    
    if (factors.tier <= 1) {
      // Early tiers: mostly authentic crowd
      const typeRoll = Math.random();
      if (typeRoll < 0.7) type = 'authentic';
      else if (typeRoll < 0.9) type = 'regular';
      else type = 'curious';
    } else if (factors.tier <= 3) {
      // Mid tiers: mixed crowd
      const typeRoll = Math.random();
      if (typeRoll < 0.3) type = 'authentic';
      else if (typeRoll < 0.5) type = 'regular';
      else if (typeRoll < 0.8) type = 'curious';
      else type = 'tourist';
    } else {
      // Late tiers: tourist heavy
      const typeRoll = Math.random();
      if (typeRoll < 0.1) type = 'authentic';
      else if (typeRoll < 0.2) type = 'regular';
      else if (typeRoll < 0.4) type = 'curious';
      else if (typeRoll < 0.7) type = 'tourist';
      else type = 'influencer';
    }
    
    // Group mood affects entry chance
    const groupMood = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    
    return {
      size,
      type,
      arrivalTime: Date.now(),
      groupMood
    };
  }
  
  /**
   * Sample from Poisson distribution
   */
  private poissonSample(lambda: number): number {
    if (lambda < 0) return 0;
    
    // For small lambda, use Knuth's algorithm
    if (lambda < 30) {
      let L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      
      return k - 1;
    }
    
    // For larger lambda, use transformed rejection method
    // Approximation using normal distribution
    const g = lambda + 0.5;
    const sqrt2 = Math.sqrt(2 * lambda);
    let em;
    
    do {
      const y = Math.tan(Math.PI * Math.random());
      em = sqrt2 * y + lambda;
    } while (em < 0);
    
    return Math.floor(em);
  }
  
  /**
   * Get initial queue for game start
   */
  public getInitialQueue(tier: number): VisitorGroup[] {
    const initialGroups: VisitorGroup[] = [];
    const numGroups = 1 + Math.floor(Math.random() * 3); // 1-3 groups
    
    for (let i = 0; i < numGroups; i++) {
      initialGroups.push(this.generateVisitorGroup({
        dayOfWeek: 5, // Friday
        hourOfNight: 23, // 11pm
        currentOccupancy: 0,
        maxCapacity: 100,
        lineupQuality: 10 + Math.floor(Math.random() * 10),
        tier
      }));
    }
    
    return initialGroups;
  }
  
  /**
   * Simulate a "Klubnacht" surge (special events)
   */
  public generateKlubnachtSurge(baseFactor: ArrivalFactors): VisitorGroup[] {
    const surgeGroups: VisitorGroup[] = [];
    const surgeSize = 5 + Math.floor(Math.random() * 10); // 5-15 extra groups
    
    for (let i = 0; i < surgeSize; i++) {
      surgeGroups.push(this.generateVisitorGroup({
        ...baseFactor,
        lineupQuality: 18 + Math.floor(Math.random() * 3) // Exceptional lineup
      }));
    }
    
    return surgeGroups;
  }
}