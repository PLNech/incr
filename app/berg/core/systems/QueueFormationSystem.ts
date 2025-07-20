/**
 * QueueFormationSystem - Enhanced queue mechanics with realistic rejection handling
 * Integrates with TransactionSystem to create authentic Berghain queue experience
 */

import { Agent, AgentType } from '../agents/Agent';
import { TransactionSystem, QueueSystem, BouncerDecision } from './TransactionSystem';
import { SocialSystem, SocialGroup, GroupType } from './SocialSystem';
import { getRandomQuoteForTier, getQuoteByMood } from '../../quotes';

export interface QueuePosition {
  agent: Agent;
  position: number; // 0 = front of queue
  arrivalTime: number;
  groupMembers?: Agent[];
  previousRejections: number;
  confidence: number; // How confident they feel about getting in
  mood: 'hopeful' | 'nervous' | 'confident' | 'desperate' | 'resigned';
}

export interface RejectionEvent {
  agent: Agent;
  reason: string;
  timestamp: number;
  witnessAgents: Agent[];
  impactRadius: number;
  quote?: string;
}

export interface QueueStats {
  totalLength: number;
  averageWaitTime: number;
  rejectionRate: number;
  currentThroughput: number; // agents processed per hour
  moodDistribution: Record<string, number>;
}

export class QueueFormationSystem {
  private queuePositions: Map<string, QueuePosition> = new Map();
  private recentRejections: RejectionEvent[] = [];
  private entranceX: number = 0;
  private entranceY: number = 0;
  private queueFormationRadius: number = 8;
  private lastProcessingTime: number = 0;
  private processingInterval: number = 45000; // Process every 45 seconds (realistic Berghain pace)
  
  constructor(
    private transactionSystem: TransactionSystem,
    private socialSystem: SocialSystem,
    entranceX: number = 0,
    entranceY: number = 0
  ) {
    this.entranceX = entranceX;
    this.entranceY = entranceY;
    this.lastProcessingTime = performance.now();
  }

  public update(deltaTime: number, allAgents: Agent[]): void {
    // Check for new agents wanting to join queue
    this.checkForNewQueueJoiners(allAgents);
    
    // Update existing queue positions and patience
    this.updateQueueDynamics(deltaTime);
    
    // Process queue at realistic intervals
    const now = performance.now();
    if (now - this.lastProcessingTime > this.processingInterval) {
      this.processNextInQueue();
      this.lastProcessingTime = now;
    }
    
    // Clean up old rejection events (keep last 30 minutes)
    const cutoffTime = now - 1800000;
    this.recentRejections = this.recentRejections.filter(r => r.timestamp > cutoffTime);
  }

  private checkForNewQueueJoiners(allAgents: Agent[]): void {
    for (const agent of allAgents) {
      if (this.queuePositions.has(agent.id)) continue;
      
      // Check if agent is near entrance and wants to join queue
      const distanceToEntrance = Math.sqrt(
        Math.pow(agent.x - this.entranceX, 2) + Math.pow(agent.y - this.entranceY, 2)
      );
      
      if (distanceToEntrance <= this.queueFormationRadius && this.shouldJoinQueue(agent)) {
        this.addAgentToQueue(agent);
      }
    }
  }

  private shouldJoinQueue(agent: Agent): boolean {
    // Agents with high entertainment needs are more likely to queue
    if (agent.entertainment < 30) return true;
    
    // Check recent rejections in area - might discourage some agents
    const recentLocalRejections = this.recentRejections.filter(r => 
      r.timestamp > performance.now() - 300000 && // Last 5 minutes
      Math.sqrt(Math.pow(r.agent.x - agent.x, 2) + Math.pow(r.agent.y - agent.y, 2)) < 5
    );
    
    // Agent type affects willingness to queue after seeing rejections
    switch (agent.type) {
      case 'authentic':
        return recentLocalRejections.length < 3; // More resilient
      case 'regular':
        return recentLocalRejections.length < 2;
      case 'curious':
        return recentLocalRejections.length < 1;
      case 'tourist':
        return recentLocalRejections.length === 0; // Easily discouraged
      case 'influencer':
        return true; // Always try, regardless of rejections
      default:
        return Math.random() > 0.5;
    }
  }

  private addAgentToQueue(agent: Agent): void {
    // Check if agent is part of a group
    const groups = this.socialSystem.getGroupsForAgent(agent.id);
    const groupMembers = groups.length > 0 ? 
      groups[0].getMembers().map(id => this.findAgentById(id)).filter(a => a !== null) as Agent[] : 
      undefined;

    // Calculate initial confidence based on agent type and recent observations
    const initialConfidence = this.calculateInitialConfidence(agent, groupMembers);
    
    const position: QueuePosition = {
      agent,
      position: this.queuePositions.size,
      arrivalTime: performance.now(),
      groupMembers,
      previousRejections: 0,
      confidence: initialConfidence,
      mood: this.determineInitialMood(agent, initialConfidence)
    };

    this.queuePositions.set(agent.id, position);
    
    // Add to transaction system queue as well
    this.transactionSystem.getQueueSystem().addToQueue(agent);
  }

  private calculateInitialConfidence(agent: Agent, groupMembers?: Agent[]): number {
    let confidence = 50; // Base confidence

    // Agent type affects confidence
    switch (agent.type) {
      case 'authentic': confidence += 30; break;
      case 'regular': confidence += 15; break;
      case 'curious': confidence += 5; break;
      case 'tourist': confidence -= 15; break;
      case 'influencer': confidence += 10; break;
    }

    // Group composition affects confidence
    if (groupMembers && groupMembers.length > 1) {
      const allMale = groupMembers.every(m => m.type === 'tourist' || m.type === 'regular');
      if (allMale && groupMembers.length >= 3) {
        confidence -= 25; // "NO GROUPS OF BLOKES"
      }
      
      if (groupMembers.length > 4) {
        confidence -= 15; // Large groups are problematic
      }
      
      // Having authentic agents in group helps
      const authenticCount = groupMembers.filter(m => m.type === 'authentic').length;
      confidence += authenticCount * 8;
    }

    // Recent rejections in area affect confidence
    const recentRejections = this.recentRejections.filter(r => 
      r.timestamp > performance.now() - 600000 // Last 10 minutes
    );
    confidence -= recentRejections.length * 5;

    return Math.max(10, Math.min(90, confidence));
  }

  private determineInitialMood(agent: Agent, confidence: number): QueuePosition['mood'] {
    if (confidence > 70) return 'confident';
    if (confidence > 50) return 'hopeful';
    if (confidence > 30) return 'nervous';
    if (agent.type === 'tourist' || agent.type === 'influencer') return 'desperate';
    return 'resigned';
  }

  private updateQueueDynamics(deltaTime: number): void {
    this.queuePositions.forEach((position, agentId) => {
      if (!position.agent) return;

      // Update mood based on waiting time and observations
      this.updateAgentMood(position, deltaTime);
      
      // Check if agent gets discouraged and leaves
      if (this.shouldLeaveQueue(position, deltaTime)) {
        this.removeAgentFromQueue(agentId, 'impatience');
      }
    });

    // Update positions in queue
    this.reorderQueue();
  }

  private updateAgentMood(position: QueuePosition, deltaTime: number): void {
    const waitTimeMinutes = (performance.now() - position.arrivalTime) / 60000;
    
    // Mood deteriorates with waiting time
    if (waitTimeMinutes > 60) { // After 1 hour
      if (position.agent.type === 'tourist' || position.agent.type === 'influencer') {
        position.mood = 'desperate';
      } else {
        position.mood = 'resigned';
      }
    } else if (waitTimeMinutes > 30) { // After 30 minutes
      if (position.mood === 'confident' || position.mood === 'hopeful') {
        position.mood = 'nervous';
      }
    }

    // Recent rejections affect mood
    const recentNearbyRejections = this.recentRejections.filter(r => 
      r.timestamp > performance.now() - 300000 && // Last 5 minutes
      r.witnessAgents.includes(position.agent)
    );

    if (recentNearbyRejections.length > 2) {
      position.mood = 'nervous';
      position.confidence = Math.max(10, position.confidence - 10);
    }
  }

  private shouldLeaveQueue(position: QueuePosition, deltaTime: number): boolean {
    const waitTimeMinutes = (performance.now() - position.arrivalTime) / 60000;
    
    // Base probability of leaving based on agent type and wait time
    let leaveChance = 0;
    
    switch (position.agent.type) {
      case 'authentic':
        leaveChance = Math.max(0, (waitTimeMinutes - 90) * 0.01); // Very patient
        break;
      case 'regular':
        leaveChance = Math.max(0, (waitTimeMinutes - 60) * 0.02);
        break;
      case 'curious':
        leaveChance = Math.max(0, (waitTimeMinutes - 45) * 0.03);
        break;
      case 'tourist':
        leaveChance = Math.max(0, (waitTimeMinutes - 30) * 0.05); // Impatient
        break;
      case 'influencer':
        leaveChance = Math.max(0, (waitTimeMinutes - 20) * 0.08); // Very impatient
        break;
    }

    // Mood affects leaving probability
    switch (position.mood) {
      case 'desperate': leaveChance *= 1.5; break;
      case 'resigned': leaveChance *= 1.2; break;
      case 'nervous': leaveChance *= 1.1; break;
      case 'confident': leaveChance *= 0.7; break;
    }

    // Low confidence increases leave chance
    leaveChance *= (100 - position.confidence) / 100;

    return Math.random() < leaveChance * (deltaTime / 60000); // Convert to per-frame probability
  }

  private processNextInQueue(): void {
    if (this.queuePositions.size === 0) return;

    // Get agent at front of queue
    const frontPosition = Array.from(this.queuePositions.values())
      .sort((a, b) => a.position - b.position)[0];
    
    if (!frontPosition) return;

    this.processAgentEntry(frontPosition);
  }

  private processAgentEntry(position: QueuePosition): void {
    const { agent, groupMembers } = position;
    
    // Prepare context for bouncer evaluation
    const context = this.buildBouncerContext(position);
    
    // Get bouncer decision
    const decision = this.transactionSystem.evaluateEntry(agent, groupMembers, context);
    
    if (decision.allowed) {
      this.handleSuccessfulEntry(position, decision);
    } else {
      this.handleRejection(position, decision);
    }
  }

  private buildBouncerContext(position: QueuePosition): any {
    const agent = position.agent;
    
    return {
      appearance: this.determineAppearance(agent),
      attitude: this.determineAttitude(position),
      spokenLanguage: agent.type === 'tourist' ? 'english' : 'german',
      hasLocalFriend: position.groupMembers?.some(m => m.type === 'authentic' || m.type === 'regular') || false,
      waitTime: performance.now() - position.arrivalTime,
      previousRejections: position.previousRejections,
      queueBehavior: this.observeQueueBehavior(position)
    };
  }

  private determineAppearance(agent: Agent): string {
    // Simplified appearance determination based on agent type
    switch (agent.type) {
      case 'authentic': return 'casual';
      case 'regular': return 'appropriate';
      case 'curious': return 'trying_too_hard';
      case 'tourist': return Math.random() > 0.5 ? 'overdressed' : 'tourist_obvious';
      case 'influencer': return 'too_fancy';
      default: return 'casual';
    }
  }

  private determineAttitude(position: QueuePosition): string {
    switch (position.mood) {
      case 'confident': return 'confident';
      case 'hopeful': return 'calm';
      case 'nervous': return 'nervous';
      case 'desperate': return 'eager';
      case 'resigned': return 'tired';
      default: return 'calm';
    }
  }

  private observeQueueBehavior(position: QueuePosition): string {
    // Behavior observations based on agent type and mood
    if (position.agent.type === 'tourist' && position.mood === 'desperate') {
      return 'overly_friendly';
    }
    if (position.agent.type === 'influencer') {
      return 'entitled';
    }
    if (position.mood === 'confident' && position.agent.type === 'authentic') {
      return 'natural';
    }
    return 'normal';
  }

  private handleSuccessfulEntry(position: QueuePosition, decision: BouncerDecision): void {
    const { agent } = position;
    
    // Create entry transaction
    const entryPrice = this.transactionSystem.getEntryPrice(agent, {
      dayOfWeek: 'saturday', // Simplified
      timeOfDay: 'night',
      currentCapacity: 200, // Simplified
      maxCapacity: 1000
    });
    
    const transaction = this.transactionSystem.createEntryTransaction(agent, entryPrice);
    this.transactionSystem.processTransaction(transaction);
    
    // Remove from queue
    this.removeAgentFromQueue(agent.id, 'successful_entry');
    
    // Positive effect on nearby agents' confidence
    this.influenceNearbyAgentsPositively(agent);
  }

  private handleRejection(position: QueuePosition, decision: BouncerDecision): void {
    const { agent, groupMembers } = position;
    
    // Find appropriate quote for rejection
    const rejectionQuote = this.findRejectionQuote(decision.reason, agent.type);
    
    // Create rejection event
    const rejectionEvent: RejectionEvent = {
      agent,
      reason: decision.reason,
      timestamp: performance.now(),
      witnessAgents: this.getWitnessAgents(agent, 6),
      impactRadius: 6,
      quote: rejectionQuote?.text
    };
    
    this.recentRejections.push(rejectionEvent);
    
    // Update agent's rejection count
    position.previousRejections++;
    
    // Handle group rejection if applicable
    if (groupMembers && groupMembers.length > 1) {
      this.handleGroupRejection(groupMembers, decision);
    }
    
    // Decide if agent tries again or leaves
    if (this.shouldRetryAfterRejection(position, decision)) {
      this.moveToBackOfQueue(agent.id);
    } else {
      this.removeAgentFromQueue(agent.id, 'rejection_departure');
    }
    
    // Negative effect on nearby agents
    this.influenceNearbyAgentsNegatively(rejectionEvent);
  }

  private findRejectionQuote(reason: string, agentType: AgentType): any {
    // Find relevant quote based on rejection reason
    if (reason.includes('group') || reason.includes('blokes')) {
      return getRandomQuoteForTier(3); // Get tourist-era quote about groups
    }
    if (reason.includes('overdressed') || reason.includes('fashion')) {
      return getRandomQuoteForTier(3);
    }
    if (reason.includes('tourist') || reason.includes('english')) {
      return getRandomQuoteForTier(3);
    }
    
    return getQuoteByMood(2, 'frustrated'); // Generic rejection quote
  }

  private shouldRetryAfterRejection(position: QueuePosition, decision: BouncerDecision): boolean {
    const { agent } = position;
    
    // Base retry probability by agent type
    let retryChance = 0;
    switch (agent.type) {
      case 'authentic': retryChance = 0.8; break;
      case 'regular': retryChance = 0.6; break;
      case 'curious': retryChance = 0.4; break;
      case 'tourist': retryChance = 0.2; break;
      case 'influencer': retryChance = 0.9; break; // Persistent
    }
    
    // Reduce retry chance with each rejection
    retryChance *= Math.pow(0.5, position.previousRejections);
    
    // Low confidence reduces retry chance
    retryChance *= position.confidence / 100;
    
    return Math.random() < retryChance;
  }

  private getWitnessAgents(rejectedAgent: Agent, radius: number): Agent[] {
    const witnesses: Agent[] = [];
    
    this.queuePositions.forEach((position, _) => {
      if (position.agent.id === rejectedAgent.id) return;
      
      const distance = Math.sqrt(
        Math.pow(position.agent.x - rejectedAgent.x, 2) + 
        Math.pow(position.agent.y - rejectedAgent.y, 2)
      );
      
      if (distance <= radius) {
        witnesses.push(position.agent);
      }
    });
    
    return witnesses;
  }

  private influenceNearbyAgentsPositively(successfulAgent: Agent): void {
    this.queuePositions.forEach((position, _) => {
      const distance = Math.sqrt(
        Math.pow(position.agent.x - successfulAgent.x, 2) + 
        Math.pow(position.agent.y - successfulAgent.y, 2)
      );
      
      if (distance <= 5) { // Nearby agents
        position.confidence = Math.min(90, position.confidence + 5);
        if (position.mood === 'nervous') position.mood = 'hopeful';
      }
    });
  }

  private influenceNearbyAgentsNegatively(rejectionEvent: RejectionEvent): void {
    for (const witness of rejectionEvent.witnessAgents) {
      const position = this.queuePositions.get(witness.id);
      if (!position) continue;
      
      // Reduce confidence
      position.confidence = Math.max(10, position.confidence - 8);
      
      // Worsen mood
      switch (position.mood) {
        case 'confident': position.mood = 'hopeful'; break;
        case 'hopeful': position.mood = 'nervous'; break;
        case 'nervous': position.mood = 'resigned'; break;
      }
    }
  }

  private handleGroupRejection(groupMembers: Agent[], decision: BouncerDecision): void {
    // Remove entire group from queue
    for (const member of groupMembers) {
      if (this.queuePositions.has(member.id)) {
        this.removeAgentFromQueue(member.id, 'group_rejection');
      }
    }
  }

  private moveToBackOfQueue(agentId: string): void {
    const position = this.queuePositions.get(agentId);
    if (!position) return;
    
    // Move to back of queue
    position.position = this.queuePositions.size;
    position.arrivalTime = performance.now(); // Reset wait time
    position.mood = 'resigned';
  }

  private removeAgentFromQueue(agentId: string, reason: string): void {
    this.queuePositions.delete(agentId);
    this.transactionSystem.getQueueSystem().removeFromQueue(agentId);
    this.reorderQueue();
  }

  private reorderQueue(): void {
    const positions = Array.from(this.queuePositions.values())
      .sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    positions.forEach((position, index) => {
      position.position = index;
    });
  }

  private findAgentById(id: string): Agent | null {
    let foundAgent: Agent | null = null;
    this.queuePositions.forEach((position, _) => {
      if (position.agent.id === id && !foundAgent) {
        foundAgent = position.agent;
      }
    });
    return foundAgent;
  }

  // Public interface methods
  
  public getQueueStats(): QueueStats {
    const positions = Array.from(this.queuePositions.values());
    const now = performance.now();
    
    const totalWaitTime = positions.reduce((sum, pos) => 
      sum + (now - pos.arrivalTime), 0
    );
    
    const moodCounts = positions.reduce((counts, pos) => {
      counts[pos.mood] = (counts[pos.mood] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const recentRejectionsCount = this.recentRejections.filter(r => 
      r.timestamp > now - 3600000 // Last hour
    ).length;
    
    return {
      totalLength: positions.length,
      averageWaitTime: positions.length > 0 ? totalWaitTime / positions.length : 0,
      rejectionRate: recentRejectionsCount / Math.max(1, positions.length + recentRejectionsCount),
      currentThroughput: 60000 / this.processingInterval, // agents per hour
      moodDistribution: moodCounts
    };
  }

  public getQueuePositions(): QueuePosition[] {
    return Array.from(this.queuePositions.values())
      .sort((a, b) => a.position - b.position);
  }

  public getRecentRejections(): RejectionEvent[] {
    return [...this.recentRejections];
  }

  public isAgentInQueue(agentId: string): boolean {
    return this.queuePositions.has(agentId);
  }

  public getAgentQueuePosition(agentId: string): number | null {
    return this.queuePositions.get(agentId)?.position ?? null;
  }

  public getDebugInfo(): any {
    const stats = this.getQueueStats();
    
    return {
      queueLength: stats.totalLength,
      averageWaitMinutes: stats.averageWaitTime / 60000,
      rejectionRate: `${(stats.rejectionRate * 100).toFixed(1)}%`,
      processingRate: `${stats.currentThroughput.toFixed(1)} agents/hour`,
      moodBreakdown: stats.moodDistribution,
      recentRejections: this.recentRejections.length,
      entranceLocation: { x: this.entranceX, y: this.entranceY }
    };
  }
}