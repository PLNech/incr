/**
 * ReputationSystem - Club scene reputation and social status tracking
 * Manages agent standing in different categories with witness-based validation
 */

import { Agent, AgentType } from '../agents/Agent';

export enum ReputationCategory {
  SCENE = 'scene',           // Overall scene credibility and coolness
  SOCIAL = 'social',         // Social skills and likability
  CULTURAL = 'cultural',     // Understanding of club culture and etiquette
  MUSICAL = 'musical',       // Musical taste and dance skills
  ECONOMIC = 'economic'      // Spending power and generosity
}

export interface ReputationEvent {
  id: string;
  agentId: string;
  category: ReputationCategory;
  impact: number;
  reason: string;
  timestamp: number;
  witnesses: string[];
  location: string;
  metadata?: any;
}

export interface ReputationModifier {
  category: ReputationCategory;
  multiplier: number;
  reason: string;
  duration: number;
  source: string;
  timestamp: number;
}

export interface AgentReputation {
  agentId: string;
  agentType: AgentType;
  overall: number;
  scene: number;
  social: number;
  cultural: number;
  musical: number;
  economic: number;
  lastActivity: number;
  eventCount: number;
}

export interface LocationReputation {
  location: string;
  overall: number;
  scene: number;
  social: number;
  cultural: number;
  musical: number;
  economic: number;
  eventCount: number;
}

export interface WitnessInsight {
  witnessId: string;
  targetAgentId: string;
  confidence: number;
  reliability: number;
  observationCount: number;
  lastSeen: number;
}

export interface ReputationComparison {
  agent1Id: string;
  agent2Id: string;
  agent1Better: number;
  agent2Better: number;
  categories: Record<ReputationCategory, 'agent1' | 'agent2' | 'tied'>;
}

export interface ReputationLeader {
  agentId: string;
  agentType: AgentType;
  score: number;
  category: ReputationCategory;
}

export class ReputationSystem {
  private reputations: Map<string, AgentReputation> = new Map();
  private events: ReputationEvent[] = [];
  private modifiers: Map<string, ReputationModifier[]> = new Map();
  private witnessInsights: Map<string, WitnessInsight[]> = new Map();
  private locationReputations: Map<string, Map<string, LocationReputation>> = new Map();
  
  // Configuration
  private readonly baseReputation: number = 50;
  private readonly maxReputation: number = 100;
  private readonly minReputation: number = 0;
  private readonly decayRate: number = 0.02; // Per hour
  private readonly witnessMultiplier: number = 0.2; // Per witness
  private readonly maxEvents: number = 1000;

  public getAgentReputation(agentId: string): AgentReputation | null {
    if (!this.reputations.has(agentId)) {
      // Create initial reputation for new agent
      this.initializeAgentReputation(agentId);
    }
    
    return this.reputations.get(agentId) || null;
  }

  private initializeAgentReputation(agentId: string, agentType?: AgentType): void {
    // Base reputation varies by agent type
    const baseValues = this.getInitialReputationByType(agentType);
    
    const reputation: AgentReputation = {
      agentId,
      agentType: agentType || 'regular',
      overall: baseValues.overall,
      scene: baseValues.scene,
      social: baseValues.social,
      cultural: baseValues.cultural,
      musical: baseValues.musical,
      economic: baseValues.economic,
      lastActivity: performance.now(),
      eventCount: 0
    };

    this.reputations.set(agentId, reputation);
  }

  private getInitialReputationByType(agentType?: AgentType): Omit<AgentReputation, 'agentId' | 'agentType' | 'lastActivity' | 'eventCount'> {
    const base = this.baseReputation;
    
    switch (agentType) {
      case 'authentic':
        return {
          overall: base + 10,
          scene: base + 20,
          social: base + 5,
          cultural: base + 25,
          musical: base + 15,
          economic: base - 5
        };
      case 'regular':
        return {
          overall: base,
          scene: base + 5,
          social: base + 10,
          cultural: base + 10,
          musical: base + 5,
          economic: base
        };
      case 'curious':
        return {
          overall: base - 5,
          scene: base - 10,
          social: base,
          cultural: base - 5,
          musical: base,
          economic: base + 5
        };
      case 'tourist':
        return {
          overall: base - 15,
          scene: base - 25,
          social: base - 10,
          cultural: base - 20,
          musical: base - 10,
          economic: base + 15
        };
      case 'influencer':
        return {
          overall: base - 5,
          scene: base + 10,
          social: base + 15,
          cultural: base - 15,
          musical: base - 5,
          economic: base + 20
        };
      default:
        return {
          overall: base,
          scene: base,
          social: base,
          cultural: base,
          musical: base,
          economic: base
        };
    }
  }

  public recordEvent(agentId: string, event: Omit<ReputationEvent, 'id' | 'agentId' | 'timestamp'>): void {
    const fullEvent: ReputationEvent = {
      id: this.generateEventId(),
      agentId,
      timestamp: performance.now(),
      ...event
    };

    this.events.push(fullEvent);
    this.maintainEventCapacity();

    // Apply reputation change
    this.applyReputationChange(agentId, fullEvent);
    
    // Update witness insights
    this.updateWitnessInsights(fullEvent);
    
    // Update location-specific reputation
    this.updateLocationReputation(agentId, fullEvent);
  }

  private applyReputationChange(agentId: string, event: ReputationEvent): void {
    const reputation = this.getAgentReputation(agentId);
    if (!reputation) return;

    // Calculate impact with witness multiplier
    const witnessMultiplier = 1 + (event.witnesses.length * this.witnessMultiplier);
    let adjustedImpact = event.impact * witnessMultiplier;

    // Apply active modifiers
    const activeModifiers = this.getActiveModifiers(agentId);
    const categoryModifier = activeModifiers.find(m => m.category === event.category);
    if (categoryModifier) {
      adjustedImpact *= categoryModifier.multiplier;
    }

    // Apply change to specific category
    const oldValue = reputation[event.category];
    const newValue = Math.max(
      this.minReputation, 
      Math.min(this.maxReputation, oldValue + adjustedImpact)
    );
    
    (reputation as any)[event.category] = newValue;

    // Update overall reputation (weighted average)
    reputation.overall = this.calculateOverallReputation(reputation);
    reputation.lastActivity = performance.now();
    reputation.eventCount++;

    this.reputations.set(agentId, reputation);
  }

  private calculateOverallReputation(reputation: AgentReputation): number {
    // Weighted average with cultural and scene having higher importance in club context
    const weights = {
      scene: 0.3,
      cultural: 0.25,
      social: 0.2,
      musical: 0.15,
      economic: 0.1
    };

    const weighted = 
      reputation.scene * weights.scene +
      reputation.cultural * weights.cultural +
      reputation.social * weights.social +
      reputation.musical * weights.musical +
      reputation.economic * weights.economic;

    return Math.max(this.minReputation, Math.min(this.maxReputation, weighted));
  }

  private updateWitnessInsights(event: ReputationEvent): void {
    for (const witnessId of event.witnesses) {
      if (!this.witnessInsights.has(witnessId)) {
        this.witnessInsights.set(witnessId, []);
      }
      
      const insights = this.witnessInsights.get(witnessId)!;
      let existing = insights.find(i => i.targetAgentId === event.agentId);
      
      if (!existing) {
        existing = {
          witnessId,
          targetAgentId: event.agentId,
          confidence: 0.5,
          reliability: 0.5,
          observationCount: 0,
          lastSeen: performance.now()
        };
        insights.push(existing);
      }
      
      // Update insight based on observation
      existing.observationCount++;
      existing.lastSeen = performance.now();
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      existing.reliability = Math.min(1.0, existing.reliability + 0.05);
    }
  }

  private updateLocationReputation(agentId: string, event: ReputationEvent): void {
    if (!this.locationReputations.has(agentId)) {
      this.locationReputations.set(agentId, new Map());
    }
    
    const agentLocationReps = this.locationReputations.get(agentId)!;
    
    if (!agentLocationReps.has(event.location)) {
      agentLocationReps.set(event.location, {
        location: event.location,
        overall: this.baseReputation,
        scene: this.baseReputation,
        social: this.baseReputation,
        cultural: this.baseReputation,
        musical: this.baseReputation,
        economic: this.baseReputation,
        eventCount: 0
      });
    }
    
    const locationRep = agentLocationReps.get(event.location)!;
    
    // Apply same logic as global reputation but location-specific
    const oldValue = (locationRep as any)[event.category];
    const newValue = Math.max(
      this.minReputation, 
      Math.min(this.maxReputation, oldValue + event.impact)
    );
    
    (locationRep as any)[event.category] = newValue;
    locationRep.overall = this.calculateLocationOverallReputation(locationRep);
    locationRep.eventCount++;
  }

  private calculateLocationOverallReputation(locationRep: LocationReputation): number {
    // Same weighted calculation as overall reputation
    const weights = { scene: 0.3, cultural: 0.25, social: 0.2, musical: 0.15, economic: 0.1 };
    
    return Math.max(this.minReputation, Math.min(this.maxReputation,
      locationRep.scene * weights.scene +
      locationRep.cultural * weights.cultural +
      locationRep.social * weights.social +
      locationRep.musical * weights.musical +
      locationRep.economic * weights.economic
    ));
  }

  public addModifier(agentId: string, modifier: Omit<ReputationModifier, 'timestamp'>): void {
    const fullModifier: ReputationModifier = {
      ...modifier,
      timestamp: performance.now()
    };

    if (!this.modifiers.has(agentId)) {
      this.modifiers.set(agentId, []);
    }

    this.modifiers.get(agentId)!.push(fullModifier);
  }

  public getActiveModifiers(agentId: string): ReputationModifier[] {
    const agentModifiers = this.modifiers.get(agentId) || [];
    const now = performance.now();
    
    return agentModifiers.filter(modifier => 
      now < modifier.timestamp + modifier.duration
    );
  }

  public cleanExpiredModifiers(): void {
    const now = performance.now();
    
    for (const [agentId, modifiers] of this.modifiers.entries()) {
      const activeModifiers = modifiers.filter(modifier => 
        now < modifier.timestamp + modifier.duration
      );
      
      if (activeModifiers.length !== modifiers.length) {
        this.modifiers.set(agentId, activeModifiers);
      }
    }
  }

  public processDecay(deltaTime: number): void {
    const decayAmount = this.decayRate * (deltaTime / (1000 * 60 * 60)); // Per hour
    const now = performance.now();
    
    for (const [agentId, reputation] of this.reputations.entries()) {
      // Slower decay for recently active agents
      const timeSinceActivity = now - reputation.lastActivity;
      const activityBonus = Math.max(0.3, Math.exp(-timeSinceActivity / (1000 * 60 * 60))); // Exponential decay over hours
      const adjustedDecay = decayAmount * (2 - activityBonus); // Active agents decay at 30% rate
      
      // Move all values toward baseline (50)
      reputation.scene = this.decayValue(reputation.scene, adjustedDecay);
      reputation.social = this.decayValue(reputation.social, adjustedDecay);
      reputation.cultural = this.decayValue(reputation.cultural, adjustedDecay);
      reputation.musical = this.decayValue(reputation.musical, adjustedDecay);
      reputation.economic = this.decayValue(reputation.economic, adjustedDecay);
      reputation.overall = this.calculateOverallReputation(reputation);
    }
  }

  private decayValue(current: number, decayAmount: number): number {
    const baseline = this.baseReputation;
    
    if (current > baseline) {
      // Decay toward baseline from above
      return Math.max(baseline, current - decayAmount);
    } else if (current < baseline) {
      // Decay toward baseline from below
      return Math.min(baseline, current + decayAmount);
    }
    
    return current;
  }

  public getWitnessInsight(witnessId: string, targetAgentId: string): WitnessInsight | null {
    const insights = this.witnessInsights.get(witnessId);
    if (!insights) return null;
    
    return insights.find(i => i.targetAgentId === targetAgentId) || null;
  }

  public getLocationReputation(agentId: string, location: string): LocationReputation | null {
    const agentLocationReps = this.locationReputations.get(agentId);
    if (!agentLocationReps) return null;
    
    return agentLocationReps.get(location) || null;
  }

  public compareAgents(agent1Id: string, agent2Id: string): ReputationComparison | null {
    const rep1 = this.getAgentReputation(agent1Id);
    const rep2 = this.getAgentReputation(agent2Id);
    
    if (!rep1 || !rep2) return null;

    const categories: Record<ReputationCategory, 'agent1' | 'agent2' | 'tied'> = {} as any;
    let agent1Better = 0;
    let agent2Better = 0;

    for (const category of Object.values(ReputationCategory)) {
      const val1 = (rep1 as any)[category];
      const val2 = (rep2 as any)[category];
      
      if (val1 > val2 + 2) { // Small threshold for ties
        categories[category] = 'agent1';
        agent1Better++;
      } else if (val2 > val1 + 2) {
        categories[category] = 'agent2';
        agent2Better++;
      } else {
        categories[category] = 'tied';
      }
    }

    return {
      agent1Id,
      agent2Id,
      agent1Better,
      agent2Better,
      categories
    };
  }

  public getTopAgents(category: ReputationCategory, limit: number = 10): ReputationLeader[] {
    const leaders: ReputationLeader[] = [];
    
    for (const [agentId, reputation] of this.reputations.entries()) {
      leaders.push({
        agentId,
        agentType: reputation.agentType,
        score: (reputation as any)[category],
        category
      });
    }
    
    return leaders
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public getReputationEvents(agentId: string, limit?: number): ReputationEvent[] {
    const agentEvents = this.events
      .filter(e => e.agentId === agentId)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? agentEvents.slice(0, limit) : agentEvents;
  }

  // Utility methods
  private generateEventId(): string {
    return `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private maintainEventCapacity(): void {
    if (this.events.length <= this.maxEvents) return;
    
    // Keep most recent events
    this.events.sort((a, b) => b.timestamp - a.timestamp);
    this.events = this.events.slice(0, this.maxEvents);
  }

  // Analytics and debugging
  public getSystemStats(): any {
    return {
      totalAgents: this.reputations.size,
      totalEvents: this.events.length,
      totalModifiers: Array.from(this.modifiers.values()).reduce((sum, mods) => sum + mods.length, 0),
      averageReputation: this.calculateAverageReputation(),
      categoryDistribution: this.getCategoryDistribution(),
      agentTypeDistribution: this.getAgentTypeDistribution()
    };
  }

  private calculateAverageReputation(): Record<string, number> {
    if (this.reputations.size === 0) return {};
    
    const totals = { overall: 0, scene: 0, social: 0, cultural: 0, musical: 0, economic: 0 };
    
    for (const reputation of this.reputations.values()) {
      totals.overall += reputation.overall;
      totals.scene += reputation.scene;
      totals.social += reputation.social;
      totals.cultural += reputation.cultural;
      totals.musical += reputation.musical;
      totals.economic += reputation.economic;
    }
    
    const count = this.reputations.size;
    return {
      overall: totals.overall / count,
      scene: totals.scene / count,
      social: totals.social / count,
      cultural: totals.cultural / count,
      musical: totals.musical / count,
      economic: totals.economic / count
    };
  }

  private getCategoryDistribution(): Record<ReputationCategory, { high: number; medium: number; low: number }> {
    const distribution = {} as any;
    
    for (const category of Object.values(ReputationCategory)) {
      distribution[category] = { high: 0, medium: 0, low: 0 };
      
      for (const reputation of this.reputations.values()) {
        const value = (reputation as any)[category];
        if (value >= 70) distribution[category].high++;
        else if (value >= 40) distribution[category].medium++;
        else distribution[category].low++;
      }
    }
    
    return distribution;
  }

  private getAgentTypeDistribution(): Record<AgentType, number> {
    const distribution = {} as Record<AgentType, number>;
    
    for (const reputation of this.reputations.values()) {
      distribution[reputation.agentType] = (distribution[reputation.agentType] || 0) + 1;
    }
    
    return distribution;
  }

  public getDetailedAnalysis(): any {
    return {
      systemStats: this.getSystemStats(),
      topPerformers: {
        scene: this.getTopAgents(ReputationCategory.SCENE, 5),
        social: this.getTopAgents(ReputationCategory.SOCIAL, 5),
        cultural: this.getTopAgents(ReputationCategory.CULTURAL, 5)
      },
      recentActivity: this.getRecentActivitySummary(),
      witnessNetwork: this.getWitnessNetworkStats()
    };
  }

  private getRecentActivitySummary(): any {
    const recentCutoff = performance.now() - (1000 * 60 * 60); // Last hour
    const recentEvents = this.events.filter(e => e.timestamp > recentCutoff);
    
    return {
      eventCount: recentEvents.length,
      uniqueAgents: new Set(recentEvents.map(e => e.agentId)).size,
      categoryBreakdown: recentEvents.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageImpact: recentEvents.reduce((sum, e) => sum + e.impact, 0) / Math.max(1, recentEvents.length)
    };
  }

  private getWitnessNetworkStats(): any {
    const totalInsights = Array.from(this.witnessInsights.values())
      .reduce((sum, insights) => sum + insights.length, 0);
    
    const avgReliability = Array.from(this.witnessInsights.values())
      .flat()
      .reduce((sum, insight) => sum + insight.reliability, 0) / Math.max(1, totalInsights);
    
    return {
      totalWitnesses: this.witnessInsights.size,
      totalInsights,
      averageReliability,
      activeWitnesses: Array.from(this.witnessInsights.entries())
        .filter(([_, insights]) => insights.some(i => 
          performance.now() - i.lastSeen < 3600000 // Active in last hour
        )).length
    };
  }
}