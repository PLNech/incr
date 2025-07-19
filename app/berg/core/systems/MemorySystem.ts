/**
 * MemorySystem - Agent memory and learning for adaptive behavior
 * Stores location experiences, agent interactions, and significant events
 */

import { Agent, AgentType } from '../agents/Agent';

export enum MemoryType {
  LOCATION = 'location',
  AGENT_INTERACTION = 'agent_interaction', 
  EVENT = 'event'
}

export interface LocationMemory {
  id: string;
  location: string;
  satisfaction: number;
  timestamp: number;
  context: any;
  visitDuration?: number;
  crowdDensity?: number;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  agentType: AgentType;
  satisfaction: number;
  timestamp: number;
  context: string;
  location?: string;
  interactionType?: string;
}

export interface EventMemory {
  id: string;
  eventType: string;
  location: string;
  timestamp: number;
  context: any;
  impact?: number;
}

export interface LocationPreference {
  location: string;
  averageSatisfaction: number;
  visitCount: number;
  lastVisit: number;
  variance: number;
  weightedScore: number;
}

export interface AgentRelationship {
  agentId: string;
  agentType: AgentType;
  relationshipStrength: number;
  interactionCount: number;
  lastInteraction: number;
  averageSatisfaction: number;
  relationshipType: 'positive' | 'neutral' | 'negative';
}

export interface BehaviorInfluence {
  preferredLocations: string[];
  avoidedLocations: string[];
  trustedAgents: string[];
  decisionConfidence: number;
  explorationTendency: number;
}

export class MemorySystem {
  private agent: Agent;
  private locationMemories: LocationMemory[] = [];
  private agentMemories: AgentMemory[] = [];
  private eventMemories: EventMemory[] = [];
  
  // Memory configuration
  private readonly maxLocationMemories: number = 100;
  private readonly maxAgentMemories: number = 50;
  private readonly maxEventMemories: number = 30;
  private readonly memoryRetentionHours: number = 24; // 24 hours
  
  // Learning parameters
  private readonly recentMemoryWeight: number = 2.0; // Recent memories weigh more
  private readonly decayFactor: number = 0.95; // Memory strength decays over time

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public getAgentId(): string {
    return this.agent.id;
  }

  // Location Memory Management
  public recordLocationExperience(
    location: string, 
    satisfaction: number, 
    context: any = {}
  ): void {
    const memory: LocationMemory = {
      id: this.generateMemoryId(),
      location,
      satisfaction: Math.max(0, Math.min(100, satisfaction)),
      timestamp: performance.now(),
      context,
      visitDuration: context.duration,
      crowdDensity: context.crowdDensity
    };

    this.locationMemories.push(memory);
    this.maintainLocationMemoryCapacity();
  }

  public getLocationMemories(): LocationMemory[] {
    return [...this.locationMemories];
  }

  public getLocationPreference(location: string): LocationPreference | null {
    const memories = this.locationMemories.filter(m => m.location === location);
    
    if (memories.length === 0) return null;

    const now = performance.now();
    let totalSatisfaction = 0;
    let weightSum = 0;
    let satisfactionSum = 0;

    for (const memory of memories) {
      // Apply time-based weighting (recent memories weigh more)
      const ageHours = (now - memory.timestamp) / (1000 * 60 * 60);
      const timeWeight = Math.pow(this.decayFactor, ageHours) * this.recentMemoryWeight;
      
      totalSatisfaction += memory.satisfaction * timeWeight;
      weightSum += timeWeight;
      satisfactionSum += memory.satisfaction;
    }

    const averageSatisfaction = satisfactionSum / memories.length;
    const weightedAverage = weightSum > 0 ? totalSatisfaction / weightSum : averageSatisfaction;

    // Calculate variance for confidence assessment
    const variance = memories.reduce((sum, m) => 
      sum + Math.pow(m.satisfaction - averageSatisfaction, 2), 0
    ) / memories.length;

    const lastVisit = Math.max(...memories.map(m => m.timestamp));

    return {
      location,
      averageSatisfaction,
      visitCount: memories.length,
      lastVisit,
      variance,
      weightedScore: weightedAverage
    };
  }

  // Agent Interaction Memory Management
  public recordAgentInteraction(
    otherAgent: Agent,
    satisfaction: number,
    context: string,
    location?: string
  ): void {
    const memory: AgentMemory = {
      id: this.generateMemoryId(),
      agentId: otherAgent.id,
      agentType: otherAgent.type,
      satisfaction: Math.max(0, Math.min(100, satisfaction)),
      timestamp: performance.now(),
      context,
      location,
      interactionType: this.classifyInteraction(satisfaction, context)
    };

    this.agentMemories.push(memory);
    this.maintainAgentMemoryCapacity();
  }

  public getAgentMemories(): AgentMemory[] {
    return [...this.agentMemories];
  }

  public getAgentRelationship(agentId: string): AgentRelationship | null {
    const memories = this.agentMemories.filter(m => m.agentId === agentId);
    
    if (memories.length === 0) return null;

    const averageSatisfaction = memories.reduce((sum, m) => sum + m.satisfaction, 0) / memories.length;
    const lastInteraction = Math.max(...memories.map(m => m.timestamp));
    
    // Calculate relationship strength with recency bias
    const now = performance.now();
    let weightedSatisfaction = 0;
    let weightSum = 0;

    for (const memory of memories) {
      const ageHours = (now - memory.timestamp) / (1000 * 60 * 60);
      const timeWeight = Math.pow(this.decayFactor, ageHours);
      
      weightedSatisfaction += memory.satisfaction * timeWeight;
      weightSum += timeWeight;
    }

    const relationshipStrength = weightSum > 0 ? weightedSatisfaction / weightSum : averageSatisfaction;

    // Classify relationship type
    let relationshipType: 'positive' | 'neutral' | 'negative';
    if (relationshipStrength >= 70) {
      relationshipType = 'positive';
    } else if (relationshipStrength >= 40) {
      relationshipType = 'neutral';
    } else {
      relationshipType = 'negative';
    }

    return {
      agentId,
      agentType: memories[0].agentType,
      relationshipStrength,
      interactionCount: memories.length,
      lastInteraction,
      averageSatisfaction,
      relationshipType
    };
  }

  // Event Memory Management
  public recordEvent(eventType: string, location: string, context: any = {}): void {
    const memory: EventMemory = {
      id: this.generateMemoryId(),
      eventType,
      location,
      timestamp: performance.now(),
      context,
      impact: context.impact || this.calculateEventImpact(eventType, context)
    };

    this.eventMemories.push(memory);
    this.maintainEventMemoryCapacity();
  }

  public getEventMemories(): EventMemory[] {
    return [...this.eventMemories];
  }

  public getEventsByType(eventType: string): EventMemory[] {
    return this.eventMemories.filter(e => e.eventType === eventType);
  }

  // Behavior Influence Analysis
  public getBehaviorInfluence(): BehaviorInfluence {
    const locationPreferences = this.calculateLocationPreferences();
    const agentRelationships = this.calculateAgentRelationships();
    
    return {
      preferredLocations: locationPreferences.preferred,
      avoidedLocations: locationPreferences.avoided,
      trustedAgents: agentRelationships.trusted,
      decisionConfidence: this.calculateDecisionConfidence(),
      explorationTendency: this.calculateExplorationTendency()
    };
  }

  private calculateLocationPreferences(): { preferred: string[]; avoided: string[] } {
    const locationStats = new Map<string, LocationPreference>();
    
    // Get all unique locations from memories
    const uniqueLocations = [...new Set(this.locationMemories.map(m => m.location))];
    
    for (const location of uniqueLocations) {
      const preference = this.getLocationPreference(location);
      if (preference) {
        locationStats.set(location, preference);
      }
    }

    // Sort by weighted score for preferences
    const sortedByScore = Array.from(locationStats.values())
      .sort((a, b) => b.weightedScore - a.weightedScore);

    const preferred = sortedByScore
      .filter(p => p.weightedScore > 70 && p.visitCount >= 2)
      .slice(0, 5)
      .map(p => p.location);

    const avoided = sortedByScore
      .filter(p => p.weightedScore < 40 && p.visitCount >= 2)
      .slice(-3)
      .map(p => p.location);

    return { preferred, avoided };
  }

  private calculateAgentRelationships(): { trusted: string[] } {
    const relationships = this.agentMemories.reduce((acc, memory) => {
      const existing = acc.get(memory.agentId);
      if (!existing) {
        acc.set(memory.agentId, []);
      }
      acc.get(memory.agentId)!.push(memory);
      return acc;
    }, new Map<string, AgentMemory[]>());

    const trusted: string[] = [];

    for (const [agentId, memories] of relationships.entries()) {
      const relationship = this.getAgentRelationship(agentId);
      if (relationship && 
          relationship.relationshipStrength > 75 && 
          relationship.interactionCount >= 3) {
        trusted.push(agentId);
      }
    }

    return { trusted };
  }

  private calculateDecisionConfidence(): number {
    const totalMemories = this.locationMemories.length + this.agentMemories.length;
    
    if (totalMemories === 0) return 0.3; // Low confidence with no experience
    
    // More memories generally increase confidence
    const experienceBonus = Math.min(0.4, totalMemories * 0.01);
    
    // Consistent positive experiences increase confidence
    const recentLocationMemories = this.locationMemories
      .filter(m => (performance.now() - m.timestamp) < 3600000); // Last hour
    
    const recentSatisfactionAvg = recentLocationMemories.length > 0 
      ? recentLocationMemories.reduce((sum, m) => sum + m.satisfaction, 0) / recentLocationMemories.length
      : 50;
    
    const satisfactionBonus = (recentSatisfactionAvg - 50) / 100; // -0.5 to +0.5
    
    return Math.max(0.1, Math.min(1.0, 0.5 + experienceBonus + satisfactionBonus));
  }

  private calculateExplorationTendency(): number {
    // Agent type affects base exploration tendency
    let baseTendency: number;
    switch (this.agent.type) {
      case 'curious': baseTendency = 0.8; break;
      case 'tourist': baseTendency = 0.7; break;
      case 'regular': baseTendency = 0.4; break;
      case 'authentic': baseTendency = 0.3; break;
      case 'influencer': baseTendency = 0.6; break;
      default: baseTendency = 0.5;
    }

    // Recent negative experiences increase exploration
    const recentNegativeEvents = this.eventMemories
      .filter(e => (performance.now() - e.timestamp) < 1800000 && // Last 30 minutes
                   (e.eventType === 'entry_rejection' || e.impact && e.impact < 0));
    
    const frustrationBonus = recentNegativeEvents.length * 0.15;
    
    return Math.max(0.1, Math.min(1.0, baseTendency + frustrationBonus));
  }

  // Memory Maintenance
  public cleanOldMemories(): void {
    const cutoffTime = performance.now() - (this.memoryRetentionHours * 60 * 60 * 1000);
    
    this.locationMemories = this.locationMemories.filter(m => m.timestamp > cutoffTime);
    this.agentMemories = this.agentMemories.filter(m => m.timestamp > cutoffTime);
    this.eventMemories = this.eventMemories.filter(m => m.timestamp > cutoffTime);
  }

  private maintainLocationMemoryCapacity(): void {
    if (this.locationMemories.length <= this.maxLocationMemories) return;

    // Sort by importance (satisfaction + recency)
    const now = performance.now();
    this.locationMemories.sort((a, b) => {
      const aScore = a.satisfaction + ((now - a.timestamp) / (1000 * 60 * 60) * -2); // Recent = higher score
      const bScore = b.satisfaction + ((now - b.timestamp) / (1000 * 60 * 60) * -2);
      return bScore - aScore;
    });

    // Keep only the most important memories
    this.locationMemories = this.locationMemories.slice(0, this.maxLocationMemories);
  }

  private maintainAgentMemoryCapacity(): void {
    if (this.agentMemories.length <= this.maxAgentMemories) return;

    // Sort by importance (satisfaction + recency + interaction count)
    const agentCounts = new Map<string, number>();
    for (const memory of this.agentMemories) {
      agentCounts.set(memory.agentId, (agentCounts.get(memory.agentId) || 0) + 1);
    }

    const now = performance.now();
    this.agentMemories.sort((a, b) => {
      const aCount = agentCounts.get(a.agentId) || 1;
      const bCount = agentCounts.get(b.agentId) || 1;
      const aScore = a.satisfaction + Math.log(aCount) * 10 + ((now - a.timestamp) / (1000 * 60 * 60) * -1);
      const bScore = b.satisfaction + Math.log(bCount) * 10 + ((now - b.timestamp) / (1000 * 60 * 60) * -1);
      return bScore - aScore;
    });

    this.agentMemories = this.agentMemories.slice(0, this.maxAgentMemories);
  }

  private maintainEventMemoryCapacity(): void {
    if (this.eventMemories.length <= this.maxEventMemories) return;

    // Sort by impact and recency
    const now = performance.now();
    this.eventMemories.sort((a, b) => {
      const aScore = (a.impact || 0) + ((now - a.timestamp) / (1000 * 60 * 60) * -1);
      const bScore = (b.impact || 0) + ((now - b.timestamp) / (1000 * 60 * 60) * -1);
      return bScore - aScore;
    });

    this.eventMemories = this.eventMemories.slice(0, this.maxEventMemories);
  }

  // Utility Methods
  private generateMemoryId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private classifyInteraction(satisfaction: number, context: string): string {
    if (satisfaction >= 80) return 'very_positive';
    if (satisfaction >= 60) return 'positive';
    if (satisfaction >= 40) return 'neutral';
    if (satisfaction >= 20) return 'negative';
    return 'very_negative';
  }

  private calculateEventImpact(eventType: string, context: any): number {
    switch (eventType) {
      case 'entry_success': return 20;
      case 'entry_rejection': return -15;
      case 'great_music_moment': return 25;
      case 'crowd_conflict': return -10;
      case 'made_new_friend': return 30;
      case 'lost_in_crowd': return -5;
      default: return context.impact || 0;
    }
  }

  // Debug and Analytics
  public getMemoryStats(): any {
    return {
      agentId: this.agent.id,
      agentType: this.agent.type,
      totalMemories: this.locationMemories.length + this.agentMemories.length + this.eventMemories.length,
      locationMemories: this.locationMemories.length,
      agentMemories: this.agentMemories.length,
      eventMemories: this.eventMemories.length,
      uniqueLocationsVisited: new Set(this.locationMemories.map(m => m.location)).size,
      uniqueAgentsInteracted: new Set(this.agentMemories.map(m => m.agentId)).size,
      averageLocationSatisfaction: this.locationMemories.length > 0 
        ? this.locationMemories.reduce((sum, m) => sum + m.satisfaction, 0) / this.locationMemories.length 
        : 0,
      decisionConfidence: this.calculateDecisionConfidence(),
      explorationTendency: this.calculateExplorationTendency()
    };
  }

  public getDetailedAnalysis(): any {
    const behaviorInfluence = this.getBehaviorInfluence();
    const stats = this.getMemoryStats();
    
    return {
      ...stats,
      behaviorInfluence,
      topLocations: behaviorInfluence.preferredLocations.slice(0, 3),
      avoidedLocations: behaviorInfluence.avoidedLocations,
      socialConnections: behaviorInfluence.trustedAgents.length,
      memoryDistribution: {
        recentMemories: this.getRecentMemoryCount(),
        oldMemories: this.getOldMemoryCount()
      }
    };
  }

  private getRecentMemoryCount(): number {
    const cutoff = performance.now() - (1000 * 60 * 60); // Last hour
    return (
      this.locationMemories.filter(m => m.timestamp > cutoff).length +
      this.agentMemories.filter(m => m.timestamp > cutoff).length +
      this.eventMemories.filter(m => m.timestamp > cutoff).length
    );
  }

  private getOldMemoryCount(): number {
    const cutoff = performance.now() - (1000 * 60 * 60); // Last hour
    return (
      this.locationMemories.filter(m => m.timestamp <= cutoff).length +
      this.agentMemories.filter(m => m.timestamp <= cutoff).length +
      this.eventMemories.filter(m => m.timestamp <= cutoff).length
    );
  }
}