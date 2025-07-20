/**
 * TransactionSystem - Economic mechanics with authentic Berghain bouncer criteria
 * Implements "inscrutable criteria", dynamic pricing, and realistic revenue generation
 */

import { Agent, AgentType } from '../agents/Agent';
import { NeedsSystem, NeedType } from './NeedsSystem';

export enum TransactionType {
  ENTRY = 'entry',
  DRINK = 'drink',
  FOOD = 'food',
  MERCHANDISE = 'merchandise',
  COAT_CHECK = 'coat_check'
}

export interface Transaction {
  id: string;
  agentId: string;
  type: TransactionType;
  amount: number;
  timestamp: number;
  location: string;
  details?: any;
}

export interface BouncerDecision {
  allowed: boolean;
  reason: string;
  confidence: number; // 0-100, how certain the bouncer is
  waitTime?: number; // Additional wait time if uncertain
}

export interface QueueEntry {
  agent: Agent;
  joinTime: number;
  patience: number; // 0-100, decreases over time
  hasLeft: boolean;
}

export interface PricingConditions {
  dayOfWeek: string;
  timeOfDay: string;
  currentCapacity: number;
  maxCapacity: number;
  specialEvent?: boolean;
}

export interface SpendingPrediction {
  averagePerHour: number;
  preferredItems: string[];
  spendingConfidence: number;
}

export class QueueSystem {
  private queue: QueueEntry[] = [];
  private leftQueue: Agent[] = [];

  public addToQueue(agent: Agent): void {
    const patience = this.calculateInitialPatience(agent);
    this.queue.push({
      agent,
      joinTime: performance.now(),
      patience,
      hasLeft: false
    });
  }

  private calculateInitialPatience(agent: Agent): number {
    // Agent type affects patience
    switch (agent.type) {
      case 'authentic': return 90; // Very patient
      case 'regular': return 75;
      case 'curious': return 60;
      case 'tourist': return 45; // Impatient
      case 'influencer': return 30; // Very impatient
      default: return 60;
    }
  }

  public updateWaitingTimes(deltaTime: number): void {
    const patienceDecayRate = deltaTime / 300000; // Patience decreases over 5 minutes
    
    for (const entry of this.queue) {
      if (entry.hasLeft) continue;
      
      // Patience decreases faster for some agent types
      let personalDecayRate = patienceDecayRate;
      if (entry.agent.type === 'tourist' || entry.agent.type === 'influencer') {
        personalDecayRate *= 1.5; // 50% faster patience decay
      }
      
      entry.patience = Math.max(0, entry.patience - personalDecayRate);
      
      // Leave if patience runs out
      if (entry.patience <= 0) {
        entry.hasLeft = true;
        this.leftQueue.push(entry.agent);
      }
    }
    
    // Remove agents who left
    this.queue = this.queue.filter(entry => !entry.hasLeft);
  }

  public getNextInQueue(): Agent | null {
    return this.queue.length > 0 ? this.queue[0].agent : null;
  }

  public removeFromQueue(agentId: string): boolean {
    const index = this.queue.findIndex(entry => entry.agent.id === agentId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getAgentPatience(agentId: string): number {
    const entry = this.queue.find(e => e.agent.id === agentId);
    return entry ? entry.patience : 0;
  }

  public getAgentsWhoLeft(): Agent[] {
    return [...this.leftQueue];
  }

  public getAverageWaitTime(): number {
    const now = performance.now();
    if (this.queue.length === 0) return 0;
    
    const totalWaitTime = this.queue.reduce((sum, entry) => 
      sum + (now - entry.joinTime), 0
    );
    
    return totalWaitTime / this.queue.length;
  }
}

export class TransactionSystem {
  private transactions: Transaction[] = [];
  private queueSystem: QueueSystem = new QueueSystem();
  private currentRevenue: number = 0;
  private revenueByType: Map<TransactionType, number> = new Map();

  constructor() {
    // Initialize revenue tracking
    Object.values(TransactionType).forEach(type => {
      this.revenueByType.set(type, 0);
    });
  }

  /**
   * The "inscrutable criteria" bouncer evaluation system
   * Based on real Berghain review insights
   */
  public evaluateEntry(
    agent: Agent, 
    groupMembers: Agent[] = [], 
    context: any = {}
  ): BouncerDecision {
    let score = 50; // Base score
    let reasons: string[] = [];

    // Agent type heavily influences entry
    switch (agent.type) {
      case 'authentic':
        score += 35;
        reasons.push('authentic_vibe');
        break;
      case 'regular':
        score += 20;
        reasons.push('regular_patron');
        break;
      case 'curious':
        score += 10;
        reasons.push('curious_newcomer');
        break;
      case 'tourist':
        score -= 15;
        reasons.push('tourist_detected');
        break;
      case 'influencer':
        score -= 5; // Sometimes useful for scene
        reasons.push('potential_publicity');
        break;
    }

    // "NO GROUPS OF BLOKES" - Group composition matters
    if (groupMembers.length > 1) {
      const allMale = groupMembers.every(member => 
        // Simplified gender check based on agent type patterns
        member.type === 'tourist' || member.type === 'regular'
      );
      
      if (allMale && groupMembers.length >= 3) {
        score -= 25;
        reasons.push('group_of_blokes');
      }
      
      if (groupMembers.length > 4) {
        score -= 15;
        reasons.push('group_too_large');
      }
    }

    // "ABSOLUTELY DO NOT DRESS UP" - Appearance matters
    if (context.appearance) {
      switch (context.appearance) {
        case 'overdressed':
          score -= 20;
          reasons.push('overdressed');
          break;
        case 'casual':
          score += 10;
          reasons.push('appropriate_attire');
          break;
        case 'too_fancy':
          score -= 15;
          reasons.push('wrong_aesthetic');
          break;
      }
    }

    // Language and local connections
    if (context.spokenLanguage === 'english' && !context.hasLocalFriend) {
      score -= 10;
      reasons.push('foreign_tourist');
    } else if (context.spokenLanguage === 'german') {
      score += 5;
      reasons.push('local_language');
    } else if (context.hasLocalFriend) {
      score += 8;
      reasons.push('vouched_by_local');
    }

    // Attitude and behavior
    if (context.attitude) {
      switch (context.attitude) {
        case 'excited':
        case 'eager':
          score -= 8;
          reasons.push('too_enthusiastic');
          break;
        case 'calm':
        case 'confident':
          score += 5;
          reasons.push('good_energy');
          break;
        case 'arrogant':
          score -= 20;
          reasons.push('bad_attitude');
          break;
      }
    }

    // Time-based factors
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 10) { // Sunday morning magic
      score += 10;
      reasons.push('sunday_morning_dedication');
    }

    // Random inscrutable factor (15% weight)
    const inscrutabilityFactor = (Math.random() - 0.5) * 30;
    score += inscrutabilityFactor;
    if (Math.abs(inscrutabilityFactor) > 10) {
      reasons.push('inscrutable_criteria');
    }

    // Final decision
    const finalScore = Math.max(0, Math.min(100, score));
    const allowed = finalScore > 45; // Threshold for entry
    
    // Create human-readable reason
    const primaryReason = this.generateBouncerReason(allowed, reasons, agent.type);

    return {
      allowed,
      reason: primaryReason,
      confidence: finalScore,
      waitTime: allowed ? 0 : Math.random() * 300000 // Up to 5 min additional wait
    };
  }

  private generateBouncerReason(allowed: boolean, factors: string[], agentType: AgentType): string {
    if (allowed) {
      if (factors.includes('authentic_vibe')) {
        return "Nods approvingly - you belong here";
      } else if (factors.includes('sunday_morning_dedication')) {
        return "Respects your commitment to the marathon";
      } else if (factors.includes('vouched_by_local')) {
        return "Your friend speaks for you";
      } else {
        return "Gives subtle approval gesture";
      }
    } else {
      if (factors.includes('group_of_blokes')) {
        return "Sorry, not tonight - groups of guys don't fit the vibe";
      } else if (factors.includes('overdressed')) {
        return "This isn't a fashion show - try somewhere else";
      } else if (factors.includes('tourist_detected')) {
        return "Shakes head - you don't get it";
      } else if (factors.includes('bad_attitude')) {
        return "Check your attitude at the door first";
      } else {
        return "Not tonight"; // Classic inscrutable rejection
      }
    }
  }

  public createEntryTransaction(agent: Agent, amount: number): Transaction {
    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      type: TransactionType.ENTRY,
      amount,
      timestamp: performance.now(),
      location: 'entrance',
      details: {
        agentType: agent.type,
        coverCharge: amount
      }
    };
  }

  public createDrinkTransaction(agent: Agent, item: string, location: string): Transaction {
    const price = this.calculateDrinkPrice(agent, item, location);
    
    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      type: TransactionType.DRINK,
      amount: price,
      timestamp: performance.now(),
      location,
      details: {
        item,
        agentType: agent.type,
        basePrice: this.getBaseDrinkPrice(item)
      }
    };
  }

  private calculateDrinkPrice(agent: Agent, item: string, location: string): number {
    let basePrice = this.getBaseDrinkPrice(item);
    
    // Location modifier
    const locationMultiplier = {
      'bar': 1.0,
      'panorama_bar': 1.3, // Premium location
      'dancefloor': 1.1 // Convenience premium
    }[location] || 1.0;
    
    // Agent type pricing (tourists pay premium)
    const agentMultiplier = {
      'authentic': 0.9, // Local discount
      'regular': 1.0,
      'curious': 1.05,
      'tourist': 1.25, // Tourist tax
      'influencer': 0.8 // Sometimes get perks
    }[agent.type] || 1.0;
    
    return Math.round(basePrice * locationMultiplier * agentMultiplier);
  }

  private getBaseDrinkPrice(item: string): number {
    const prices: Record<string, number> = {
      'beer': 4,
      'water': 3,
      'banana_cherry_juice': 7, // "great staple"
      'chia_pudding': 12, // "a tad pricey but totally worth it"
      'cocktail': 9,
      'energy_drink': 6,
      'club_mate': 5, // Berlin staple
      'wine': 8,
      'shot': 5
    };
    
    return prices[item] || 5;
  }

  public getEntryPrice(agent: Agent, conditions: PricingConditions): number {
    let basePrice = 20; // Base entry fee
    
    // Time-based pricing
    if (conditions.dayOfWeek === 'friday' || conditions.dayOfWeek === 'saturday') {
      basePrice += 5; // Weekend premium
    }
    
    if (conditions.timeOfDay === 'peak') {
      basePrice += 10;
    }
    
    // Capacity-based surge pricing
    const capacityRatio = conditions.currentCapacity / conditions.maxCapacity;
    if (capacityRatio > 0.8) {
      basePrice += Math.round(10 * (capacityRatio - 0.8) / 0.2); // Up to €10 surge
    }
    
    // Agent type pricing
    const agentMultiplier = {
      'authentic': 0.8,
      'regular': 1.0,
      'curious': 1.1,
      'tourist': 1.4,
      'influencer': 0.3 // Often get heavily discounted/free entry
    }[agent.type] || 1.0;
    
    // Special event pricing
    if (conditions.specialEvent) {
      basePrice *= 1.5;
    }
    
    return Math.round(basePrice * agentMultiplier);
  }

  public predictAgentSpending(agent: Agent, location: string): SpendingPrediction {
    let baseSpending = 15; // Base €15/hour
    let preferredItems: string[] = [];
    
    // Agent type spending patterns
    switch (agent.type) {
      case 'authentic':
        baseSpending = 12;
        preferredItems = ['beer', 'club_mate', 'water'];
        break;
      case 'regular':
        baseSpending = 18;
        preferredItems = ['beer', 'cocktail', 'banana_cherry_juice'];
        break;
      case 'curious':
        baseSpending = 22;
        preferredItems = ['cocktail', 'chia_pudding', 'energy_drink'];
        break;
      case 'tourist':
        baseSpending = 35;
        preferredItems = ['cocktail', 'chia_pudding', 'wine', 'shots'];
        break;
      case 'influencer':
        baseSpending = 45;
        preferredItems = ['premium_cocktail', 'champagne', 'instagram_worthy_drinks'];
        break;
    }
    
    // Location affects spending
    const locationMultiplier = {
      'bar': 1.0,
      'panorama_bar': 1.4,
      'dancefloor': 0.7, // Less drinking while dancing
      'toilets': 0.1 // Minimal spending
    }[location] || 1.0;
    
    // Agent's current stamina affects spending (tired agents buy more recovery items)
    if (agent.stamina < 40) {
      baseSpending *= 1.3;
      preferredItems.unshift('banana_cherry_juice', 'chia_pudding', 'energy_drink');
    }
    
    return {
      averagePerHour: Math.round(baseSpending * locationMultiplier),
      preferredItems,
      spendingConfidence: 85
    };
  }

  public recommendPurchase(agent: Agent, needsSystem: NeedsSystem, location: string): any {
    const staminaNeed = needsSystem.getNeed(NeedType.STAMINA);
    const socialNeed = needsSystem.getNeed(NeedType.SOCIAL);
    const entertainmentNeed = needsSystem.getNeed(NeedType.ENTERTAINMENT);
    
    // Recommend based on most urgent need
    if (staminaNeed && staminaNeed.currentValue < 30) {
      return {
        item: 'banana_cherry_juice',
        reason: 'Restore energy for dancing',
        urgency: 'high',
        expectedSatisfaction: 25
      };
    }
    
    if (staminaNeed && staminaNeed.currentValue < 50) {
      return {
        item: 'chia_pudding',
        reason: 'Sustenance for the long haul',
        urgency: 'medium',
        expectedSatisfaction: 20
      };
    }
    
    if (socialNeed && socialNeed.currentValue < 40 && location === 'bar') {
      return {
        item: 'cocktail',
        reason: 'Social lubricant',
        urgency: 'medium',
        expectedSatisfaction: 15
      };
    }
    
    // Default recommendation based on agent type
    const prediction = this.predictAgentSpending(agent, location);
    return {
      item: prediction.preferredItems[0],
      reason: 'Type preference',
      urgency: 'low',
      expectedSatisfaction: 10
    };
  }

  public processTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
    this.currentRevenue += transaction.amount;
    
    const currentTypeRevenue = this.revenueByType.get(transaction.type) || 0;
    this.revenueByType.set(transaction.type, currentTypeRevenue + transaction.amount);
  }

  public getTotalRevenue(): number {
    return this.currentRevenue;
  }

  public getRevenueByType(): Record<string, number> {
    const result: Record<string, number> = {};
    this.revenueByType.forEach((amount, type) => {
      result[type] = amount;
    });
    return result;
  }

  public getAgentTransactionHistory(agentId: string): Transaction[] {
    return this.transactions.filter(tx => tx.agentId === agentId);
  }

  public getAgentTotalSpending(agentId: string): number {
    return this.getAgentTransactionHistory(agentId)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  public getQueueSystem(): QueueSystem {
    return this.queueSystem;
  }

  public getHourlyRevenue(): number {
    const oneHourAgo = performance.now() - 3600000;
    return this.transactions
      .filter(tx => tx.timestamp > oneHourAgo)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  public getRevenueAnalytics(): any {
    return {
      totalRevenue: this.currentRevenue,
      revenueByType: this.getRevenueByType(),
      hourlyRevenue: this.getHourlyRevenue(),
      averageTransactionSize: this.transactions.length > 0 ? 
        this.currentRevenue / this.transactions.length : 0,
      transactionCount: this.transactions.length,
      topSpendingAgents: this.getTopSpendingAgents(5)
    };
  }

  private getTopSpendingAgents(limit: number): Array<{ agentId: string; totalSpent: number }> {
    const spendingMap = new Map<string, number>();
    
    for (const tx of this.transactions) {
      const current = spendingMap.get(tx.agentId) || 0;
      spendingMap.set(tx.agentId, current + tx.amount);
    }
    
    return Array.from(spendingMap.entries())
      .map(([agentId, totalSpent]) => ({ agentId, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  public getDebugInfo(): any {
    return {
      totalRevenue: this.currentRevenue,
      transactionCount: this.transactions.length,
      queueLength: this.queueSystem.getQueueLength(),
      averageWaitTime: this.queueSystem.getAverageWaitTime(),
      recentTransactions: this.transactions.slice(-5),
      revenueByType: this.getRevenueByType()
    };
  }
}