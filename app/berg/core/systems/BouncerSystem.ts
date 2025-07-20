/**
 * BouncerSystem - Inscrutable door policy with tier-based reasoning
 * Manages queue processing and entry decisions for Berghain
 */

import { Agent, AgentType } from '../agents/Agent';
import { ReputationSystem } from './ReputationSystem';

export interface BouncerDecision {
  agentId: string;
  decision: 'accept' | 'reject';
  reason: string;
  waitTime: number;
  confidence: number;
}

export interface QueuePosition {
  agentId: string;
  x: number;
  y: number;
  queueIndex: number;
  joinTime: number;
}

export interface BouncerLogEntry {
  id: string;
  agentName: string;
  agentType: string;
  decision: 'accept' | 'reject';
  reason: string;
  waitTime: number;
  budget: number;
  isGuestList: boolean;
  timestamp: number;
}

export class BouncerSystem {
  private queue: Agent[] = [];
  private queuePositions: Map<string, QueuePosition> = new Map();
  private lastProcessTime: number = 0;
  private currentTier: number = 1;
  private guestListUsed: number = 0; // Track guest list entries this KN
  private decisionLog: BouncerLogEntry[] = [];
  
  // Bouncer position and properties
  public readonly bouncerX: number = 20; // At entrance door
  public readonly bouncerY: number = 27;
  public readonly size: number = 2; // 2x bigger than regular agents
  
  // Queue configuration - positioned at bottom of expanded grid
  private readonly QUEUE_START_X = 25;
  private readonly QUEUE_START_Y = 42;
  private readonly QUEUE_SPACING = 2;
  private readonly QUEUE_BEND_Y = 35;
  private readonly PROCESS_INTERVAL = 3000; // Process every 3 seconds
  private readonly MAX_QUEUE_SIZE = 20;
  
  // Decision factors
  private reputationSystem: ReputationSystem;
  
  constructor(reputationSystem: ReputationSystem) {
    this.reputationSystem = reputationSystem;
    this.lastProcessTime = performance.now();
  }
  
  public addToQueue(agent: Agent): boolean {
    // Check if agent can skip queue (guest list)
    if (agent.isGuestList && this.canUseGuestList()) {
      return this.processGuestListEntry(agent);
    }
    
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      return false; // Queue full
    }
    
    if (this.isInQueue(agent.id)) {
      return false; // Already in queue
    }
    
    this.queue.push(agent);
    agent.state = 'queueing' as any;
    
    // Calculate queue position
    const queueIndex = this.queue.length - 1;
    const position = this.calculateQueuePosition(queueIndex);
    
    this.queuePositions.set(agent.id, {
      agentId: agent.id,
      x: position.x,
      y: position.y,
      queueIndex,
      joinTime: performance.now()
    });
    
    // Move agent to queue position
    agent.setDestination(position.x, position.y);
    
    return true;
  }
  
  private calculateQueuePosition(queueIndex: number): { x: number; y: number } {
    // Arrange people two by two in pairs
    const pairIndex = Math.floor(queueIndex / 2);
    const sideOffset = (queueIndex % 2) * 2 - 1; // -1 for left, 1 for right
    
    const straightLineLength = 6; // First 6 pairs (12 people) form straight line
    
    if (pairIndex < straightLineLength) {
      // Straight line towards entrance, two by two
      return {
        x: this.QUEUE_START_X + sideOffset,
        y: this.QUEUE_START_Y - (pairIndex * this.QUEUE_SPACING)
      };
    } else {
      // 90-degree bend, forming horizontal line, two by two
      const bendIndex = pairIndex - straightLineLength;
      return {
        x: this.QUEUE_START_X - ((bendIndex + 1) * this.QUEUE_SPACING),
        y: this.QUEUE_BEND_Y + sideOffset
      };
    }
  }
  
  public isInQueue(agentId: string): boolean {
    return this.queue.some(agent => agent.id === agentId);
  }
  
  public removeFromQueue(agentId: string): boolean {
    const index = this.queue.findIndex(agent => agent.id === agentId);
    if (index === -1) return false;
    
    this.queue.splice(index, 1);
    this.queuePositions.delete(agentId);
    
    // Recalculate positions for remaining agents
    this.updateQueuePositions();
    
    return true;
  }
  
  private updateQueuePositions(): void {
    this.queue.forEach((agent, index) => {
      const position = this.calculateQueuePosition(index);
      const queuePos = this.queuePositions.get(agent.id);
      
      if (queuePos) {
        queuePos.queueIndex = index;
        queuePos.x = position.x;
        queuePos.y = position.y;
        
        // Move agent to new position
        agent.setDestination(position.x, position.y);
      }
    });
  }
  
  public update(deltaTime: number): void {
    const now = performance.now();
    
    if (now - this.lastProcessTime >= this.PROCESS_INTERVAL) {
      this.processQueue();
      this.lastProcessTime = now;
    }
  }
  
  private processQueue(): void {
    if (this.queue.length === 0) return;
    
    // Process front of queue (first person)
    const frontAgent = this.queue[0];
    const decision = this.makeBouncerDecision(frontAgent);
    
    if (decision.decision === 'accept') {
      this.acceptAgent(frontAgent);
    } else {
      this.rejectAgent(frontAgent, decision.reason);
    }
  }
  
  private makeBouncerDecision(agent: Agent): BouncerDecision {
    const reputation = this.reputationSystem.getAgentReputation(agent.id);
    const waitTime = performance.now() - (this.queuePositions.get(agent.id)?.joinTime || performance.now());
    
    // Base rejection probability (Berghain is notorious for rejections)
    let acceptProbability = 0.3;
    
    // Factors that increase acceptance chance
    if (agent.isGuestList) {
      acceptProbability += 0.6; // VIPs have much higher chance
    }
    
    if (reputation) {
      // Higher scene reputation = better chance
      acceptProbability += (reputation.scene - 50) / 200; // -0.25 to +0.25
      acceptProbability += (reputation.cultural - 50) / 300; // Cultural understanding matters
      
      // Economic status matters in higher tiers
      if (this.currentTier >= 2) {
        acceptProbability += (reputation.economic - 50) / 400;
      }
    }
    
    // Agent type modifiers
    switch (agent.type) {
      case 'authentic':
        acceptProbability += 0.2;
        break;
      case 'regular':
        acceptProbability += 0.1;
        break;
      case 'tourist':
        acceptProbability -= 0.3;
        break;
      case 'influencer':
        acceptProbability -= 0.2;
        break;
    }
    
    // Budget considerations (higher tiers are more lenient with money)
    if (this.currentTier >= 3 && agent.budget > 200) {
      acceptProbability += 0.15;
    }
    
    // Time-based factors
    const waitMinutes = waitTime / (1000 * 60);
    if (waitMinutes > 30) {
      acceptProbability += 0.1; // Slight pity bonus for long waits
    }
    
    // Randomness - the inscrutable bouncer logic
    const randomFactor = (Math.random() - 0.5) * 0.4; // ±0.2 random variance
    acceptProbability += randomFactor;
    
    // Clamp between 0 and 1
    acceptProbability = Math.max(0, Math.min(1, acceptProbability));
    
    const decision = Math.random() < acceptProbability ? 'accept' : 'reject';
    
    return {
      agentId: agent.id,
      decision,
      reason: this.generateRejectionReason(agent, acceptProbability),
      waitTime,
      confidence: acceptProbability
    };
  }
  
  private generateRejectionReason(agent: Agent, probability: number): string {
    const reasons = [
      'Wrong vibe',
      'Not tonight',
      'Dress code',
      'Too early',
      'Members only',
      'Private event',
      'At capacity',
      'Come back later'
    ];
    
    if (agent.type === 'tourist') {
      return 'Tourist energy detected';
    }
    
    if (agent.type === 'influencer') {
      return 'No phones inside';
    }
    
    if (probability < 0.2) {
      return 'Definitely not';
    }
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
  
  private acceptAgent(agent: Agent): void {
    const queuePos = this.queuePositions.get(agent.id);
    const waitTime = queuePos ? performance.now() - queuePos.joinTime : 0;
    
    // Log the decision
    this.decisionLog.push({
      id: `decision-${Date.now()}-${Math.random()}`,
      agentName: agent.getFullName(),
      agentType: agent.type,
      decision: 'accept',
      reason: 'Accepted by bouncer',
      waitTime,
      budget: agent.budget,
      isGuestList: agent.isGuestList,
      timestamp: Date.now()
    });
    
    this.removeFromQueue(agent.id);
    
    // Record successful entry in reputation system
    this.reputationSystem.recordEvent(agent.id, {
      category: 'scene' as any,
      impact: 2,
      reason: 'Accepted by bouncer',
      witnesses: [],
      location: 'entrance'
    });
    
    // Move agent to lobby
    agent.setDestination(20, 15); // Lobby area
    agent.state = 'idle' as any;
    
    console.log(`✅ ${agent.getFullName()} accepted into club`);
  }
  
  private rejectAgent(agent: Agent, reason: string): void {
    const queuePos = this.queuePositions.get(agent.id);
    const waitTime = queuePos ? performance.now() - queuePos.joinTime : 0;
    
    // Log the decision
    this.decisionLog.push({
      id: `decision-${Date.now()}-${Math.random()}`,
      agentName: agent.getFullName(),
      agentType: agent.type,
      decision: 'reject',
      reason,
      waitTime,
      budget: agent.budget,
      isGuestList: agent.isGuestList,
      timestamp: Date.now()
    });
    
    this.removeFromQueue(agent.id);
    
    // Record rejection in reputation system
    this.reputationSystem.recordEvent(agent.id, {
      category: 'scene' as any,
      impact: -1,
      reason: `Rejected: ${reason}`,
      witnesses: this.queue.slice(0, 3).map(a => a.id), // Front few people witness
      location: 'entrance'
    });
    
    // Move agent away from club
    agent.setDestination(10, 40); // Off to the side
    agent.state = 'leaving' as any;
    
    console.log(`❌ ${agent.getFullName()} rejected: ${reason}`);
  }
  
  public setTier(tier: number): void {
    this.currentTier = tier;
  }
  
  private canUseGuestList(): boolean {
    const limit = this.getGuestListLimit();
    return this.guestListUsed < limit;
  }
  
  private getGuestListLimit(): number {
    switch (this.currentTier) {
      case 1: return 10; // DJ friends
      case 2: return 20; // Friends of friends
      case 3: return 50; // Crazy out of hand
      default: return 0; // Tier 4+ requires payment (handled elsewhere)
    }
  }
  
  private processGuestListEntry(agent: Agent): boolean {
    if (this.currentTier >= 4) {
      // At tier 4+, guest list costs double entrance fee
      const entranceFee = 20; // Base entrance fee
      const guestListFee = entranceFee * 2;
      
      if (agent.budget < guestListFee) {
        // Not enough money, join regular queue
        return false;
      }
      
      // Deduct guest list fee
      agent.budget -= guestListFee;
    }
    
    this.guestListUsed++;
    
    // Log guest list entry
    this.decisionLog.push({
      id: `decision-${Date.now()}-${Math.random()}`,
      agentName: agent.getFullName(),
      agentType: agent.type,
      decision: 'accept',
      reason: 'Guest List Entry',
      waitTime: 0,
      budget: agent.budget,
      isGuestList: agent.isGuestList,
      timestamp: Date.now()
    });
    
    // Skip queue and enter directly
    this.acceptAgent(agent);
    
    console.log(`👑 ${agent.getFullName()} entered via guest list (${this.guestListUsed}/${this.getGuestListLimit()})`);
    
    return true;
  }
  
  public resetGuestListCount(): void {
    this.guestListUsed = 0;
  }
  
  public getDecisionLog(): BouncerLogEntry[] {
    return [...this.decisionLog].reverse(); // Most recent first
  }
  
  public clearDecisionLog(): void {
    this.decisionLog = [];
  }
  
  public getQueueSize(): number {
    return this.queue.length;
  }
  
  public getQueuePositions(): QueuePosition[] {
    return Array.from(this.queuePositions.values());
  }
  
  public getBouncerPosition(): { x: number; y: number; size: number } {
    return {
      x: this.bouncerX,
      y: this.bouncerY,
      size: this.size
    };
  }
  
  public getQueueStats(): any {
    const now = performance.now();
    const avgWaitTime = this.queue.reduce((sum, agent) => {
      const pos = this.queuePositions.get(agent.id);
      if (!pos) return sum;
      return sum + (now - pos.joinTime);
    }, 0) / Math.max(1, this.queue.length);
    
    const typeDistribution = this.queue.reduce((dist, agent) => {
      dist[agent.type] = (dist[agent.type] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    return {
      queueSize: this.queue.length,
      averageWaitTime: avgWaitTime / (1000 * 60), // in minutes
      typeDistribution,
      acceptanceRate: this.calculateRecentAcceptanceRate(),
      guestList: {
        used: this.guestListUsed,
        limit: this.getGuestListLimit(),
        available: this.getGuestListLimit() - this.guestListUsed
      }
    };
  }
  
  private calculateRecentAcceptanceRate(): number {
    // This would track recent decisions in a real implementation
    // For now, return estimated rate based on current tier
    return Math.max(0.2, Math.min(0.8, 0.3 + (this.currentTier * 0.1)));
  }
}