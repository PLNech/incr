/**
 * NeedsSystem - Manages agent motivation through stamina, social, and entertainment needs
 * Drives agent decision-making and behavior patterns
 */

import { Agent, AgentState, AgentType } from '../agents/Agent';

export enum NeedType {
  STAMINA = 'stamina',
  SOCIAL = 'social',
  ENTERTAINMENT = 'entertainment'
}

export enum NeedUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export class Need {
  public readonly type: NeedType;
  public currentValue: number;
  public readonly threshold: number;
  public readonly maxValue: number;

  constructor(type: NeedType, currentValue: number, threshold: number, maxValue: number = 100) {
    this.type = type;
    this.currentValue = Math.max(0, Math.min(maxValue, currentValue));
    this.threshold = threshold;
    this.maxValue = maxValue;
  }

  public get urgency(): NeedUrgency {
    if (this.currentValue >= this.threshold) {
      return NeedUrgency.LOW;
    }
    
    const deficitRatio = (this.threshold - this.currentValue) / this.threshold;
    
    if (deficitRatio >= 0.75) {
      return NeedUrgency.HIGH;
    } else if (deficitRatio >= 0.25) {
      return NeedUrgency.MEDIUM;
    } else {
      return NeedUrgency.LOW;
    }
  }

  public get satisfactionLevel(): number {
    return this.currentValue / this.maxValue;
  }

  public get deficitAmount(): number {
    return Math.max(0, this.threshold - this.currentValue);
  }

  public satisfy(amount: number): void {
    this.currentValue = Math.min(this.maxValue, this.currentValue + amount);
  }

  public decay(amount: number): void {
    this.currentValue = Math.max(0, this.currentValue - amount);
  }

  public setValue(value: number): void {
    this.currentValue = Math.max(0, Math.min(this.maxValue, value));
  }

  public isSatisfied(): boolean {
    return this.currentValue >= this.threshold;
  }

  public toString(): string {
    return `${this.type}: ${this.currentValue}/${this.maxValue} (threshold: ${this.threshold}, urgency: ${this.urgency})`;
  }
}

export class NeedsSystem {
  private agent: Agent;
  private needs: Map<NeedType, Need> = new Map();
  private currentLocation: string = 'entrance';
  private lastUpdateTime: number = 0;

  constructor(agent: Agent) {
    this.agent = agent;
    this.initializeNeeds();
    this.lastUpdateTime = performance.now();
  }

  private initializeNeeds(): void {
    const agentType = this.agent.type;
    
    // Create needs with agent-type-specific thresholds
    const staminaThreshold = this.getStaminaThreshold(agentType);
    const socialThreshold = this.getSocialThreshold(agentType);
    const entertainmentThreshold = this.getEntertainmentThreshold(agentType);

    this.needs.set(NeedType.STAMINA, new Need(
      NeedType.STAMINA,
      this.agent.stamina,
      staminaThreshold
    ));

    this.needs.set(NeedType.SOCIAL, new Need(
      NeedType.SOCIAL,
      this.agent.socialEnergy,
      socialThreshold
    ));

    this.needs.set(NeedType.ENTERTAINMENT, new Need(
      NeedType.ENTERTAINMENT,
      this.agent.entertainment,
      entertainmentThreshold
    ));
  }

  private getStaminaThreshold(agentType: AgentType): number {
    switch (agentType) {
      case 'authentic': return 30; // Authentic clubbers pace themselves
      case 'regular': return 35;
      case 'curious': return 40;
      case 'tourist': return 45; // Tourists get tired easier
      case 'influencer': return 50; // Constantly active
      default: return 35;
    }
  }

  private getSocialThreshold(agentType: AgentType): number {
    switch (agentType) {
      case 'authentic': return 20; // Less dependent on others
      case 'regular': return 30;
      case 'curious': return 40;
      case 'tourist': return 50; // Need social validation
      case 'influencer': return 60; // Constantly need attention
      default: return 30;
    }
  }

  private getEntertainmentThreshold(agentType: AgentType): number {
    switch (agentType) {
      case 'authentic': return 25; // Satisfied by the music itself
      case 'regular': return 35;
      case 'curious': return 45;
      case 'tourist': return 55; // Need constant stimulation
      case 'influencer': return 65; // Need content and spectacle
      default: return 35;
    }
  }

  public setCurrentLocation(location: string): void {
    this.currentLocation = location;
  }

  public update(deltaTime: number, agentState: AgentState, nearbyAgents: Agent[] = []): void {
    const now = performance.now();
    const actualDelta = Math.min(deltaTime, now - this.lastUpdateTime);
    
    this.updateStamina(actualDelta, agentState);
    this.updateSocial(actualDelta, nearbyAgents);
    this.updateEntertainment(actualDelta);
    
    this.lastUpdateTime = now;
  }

  private updateStamina(deltaTime: number, agentState: AgentState): void {
    const staminaNeed = this.needs.get(NeedType.STAMINA)!;
    const secondsElapsed = deltaTime / 1000;

    if (this.currentLocation === 'toilets') {
      // Rapid stamina restoration in toilets
      const restoreRate = 15; // points per second
      staminaNeed.satisfy(restoreRate * secondsElapsed);
    } else {
      // Stamina decay based on activity
      let decayRate: number;
      
      switch (agentState) {
        case AgentState.MOVING:
          decayRate = 2.0; // Active movement
          break;
        case AgentState.INTERACTING:
          decayRate = 1.0; // Social interaction
          break;
        case AgentState.QUEUEING:
          decayRate = 1.5; // Standing in queue
          break;
        case AgentState.IDLE:
          decayRate = 0.5; // Minimal decay while idle
          break;
        default:
          decayRate = 0.8;
      }

      // Apply agent type modifiers
      switch (this.agent.type) {
        case 'authentic':
        case 'regular':
          decayRate *= 0.8; // More resilient
          break;
        case 'tourist':
        case 'influencer':
          decayRate *= 1.2; // Less resilient
          break;
      }

      staminaNeed.decay(decayRate * secondsElapsed);
    }
  }

  private updateSocial(deltaTime: number, nearbyAgents: Agent[]): void {
    const socialNeed = this.needs.get(NeedType.SOCIAL)!;
    const secondsElapsed = deltaTime / 1000;

    if (nearbyAgents.length > 0) {
      // Social satisfaction based on nearby agents
      let satisfactionRate = 0;
      
      // Base satisfaction from any social contact
      satisfactionRate += 2.0; // points per second
      
      // Bonus for multiple people
      satisfactionRate += Math.min(nearbyAgents.length * 0.5, 3.0);
      
      // Quality bonus for compatible agent types
      const compatibilityBonus = this.calculateSocialCompatibility(nearbyAgents);
      satisfactionRate += compatibilityBonus;
      
      socialNeed.satisfy(satisfactionRate * secondsElapsed);
    } else {
      // Social decay when alone
      let decayRate: number;
      
      switch (this.agent.type) {
        case 'authentic':
          decayRate = 0.5; // Comfortable alone
          break;
        case 'regular':
          decayRate = 0.8;
          break;
        case 'curious':
          decayRate = 1.2;
          break;
        case 'tourist':
          decayRate = 1.8; // Get lonely quickly
          break;
        case 'influencer':
          decayRate = 2.5; // Need constant attention
          break;
        default:
          decayRate = 1.0;
      }
      
      socialNeed.decay(decayRate * secondsElapsed);
    }
  }

  private calculateSocialCompatibility(nearbyAgents: Agent[]): number {
    let compatibilityBonus = 0;
    
    for (const other of nearbyAgents) {
      switch (this.agent.type) {
        case 'authentic':
          if (other.type === 'authentic' || other.type === 'regular') {
            compatibilityBonus += 1.0; // Likes similar people
          } else if (other.type === 'tourist' || other.type === 'influencer') {
            compatibilityBonus -= 0.5; // Dislikes tourists
          }
          break;
          
        case 'regular':
          if (other.type === 'authentic' || other.type === 'regular') {
            compatibilityBonus += 0.8;
          } else if (other.type === 'curious') {
            compatibilityBonus += 0.5;
          }
          break;
          
        case 'curious':
          compatibilityBonus += 0.6; // Generally likes everyone
          break;
          
        case 'tourist':
          if (other.type === 'tourist' || other.type === 'influencer') {
            compatibilityBonus += 0.8; // Likes other tourists
          } else {
            compatibilityBonus += 0.3; // Neutral to locals
          }
          break;
          
        case 'influencer':
          if (other.type === 'tourist') {
            compatibilityBonus += 1.2; // Loves tourist attention
          } else if (other.type === 'authentic') {
            compatibilityBonus -= 0.3; // Authentic people ignore them
          } else {
            compatibilityBonus += 0.4;
          }
          break;
      }
    }
    
    return Math.max(0, compatibilityBonus);
  }

  private updateEntertainment(deltaTime: number): void {
    const entertainmentNeed = this.needs.get(NeedType.ENTERTAINMENT)!;
    const secondsElapsed = deltaTime / 1000;

    // Entertainment satisfaction based on location
    let satisfactionRate = 0;
    
    switch (this.currentLocation) {
      case 'dancefloor':
        satisfactionRate = 8.0; // Primary entertainment area
        break;
      case 'panorama_bar':
        satisfactionRate = 4.0; // Social entertainment
        break;
      case 'bar':
        satisfactionRate = 2.0; // Mild entertainment
        break;
      case 'entrance':
      case 'toilets':
        satisfactionRate = 0; // No entertainment
        break;
      default:
        satisfactionRate = 1.0; // Mild ambient entertainment
    }

    // Apply agent type modifiers
    switch (this.agent.type) {
      case 'authentic':
        if (this.currentLocation === 'dancefloor') {
          satisfactionRate *= 1.5; // Deeply appreciates the music
        }
        break;
      case 'influencer':
        satisfactionRate *= 0.7; // Harder to entertain, always seeking novelty
        break;
      case 'tourist':
        satisfactionRate *= 1.2; // Easily entertained by new experiences
        break;
    }

    if (satisfactionRate > 0) {
      entertainmentNeed.satisfy(satisfactionRate * secondsElapsed);
    } else {
      // Slow decay when not being entertained
      const decayRate = 0.8;
      entertainmentNeed.decay(decayRate * secondsElapsed);
    }
  }

  public getNeed(type: NeedType): Need | undefined {
    return this.needs.get(type);
  }

  public getAllNeeds(): Need[] {
    return Array.from(this.needs.values());
  }

  public getMostUrgentNeed(): Need | null {
    const allNeeds = this.getAllNeeds();
    
    // Sort by urgency (HIGH > MEDIUM > LOW) then by deficit amount
    allNeeds.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }
      
      // If same urgency, prioritize by deficit amount
      return b.deficitAmount - a.deficitAmount;
    });
    
    return allNeeds.length > 0 ? allNeeds[0] : null;
  }

  public getNeedsByUrgency(urgency: NeedUrgency): Need[] {
    return this.getAllNeeds().filter(need => need.urgency === urgency);
  }

  public getUnsatisfiedNeeds(): Need[] {
    return this.getAllNeeds().filter(need => !need.isSatisfied());
  }

  public syncToAgent(): void {
    // Update agent properties to match current need values
    const staminaNeed = this.needs.get(NeedType.STAMINA);
    const socialNeed = this.needs.get(NeedType.SOCIAL);
    const entertainmentNeed = this.needs.get(NeedType.ENTERTAINMENT);

    if (staminaNeed) {
      this.agent.stamina = staminaNeed.currentValue;
    }
    if (socialNeed) {
      this.agent.socialEnergy = socialNeed.currentValue;
    }
    if (entertainmentNeed) {
      this.agent.entertainment = entertainmentNeed.currentValue;
    }
  }

  public getLocationSuggestions(): { location: string; reason: string; priority: number }[] {
    const suggestions: { location: string; reason: string; priority: number }[] = [];
    
    const staminaNeed = this.needs.get(NeedType.STAMINA)!;
    const socialNeed = this.needs.get(NeedType.SOCIAL)!;
    const entertainmentNeed = this.needs.get(NeedType.ENTERTAINMENT)!;

    // Stamina-based suggestions
    if (staminaNeed.urgency === NeedUrgency.HIGH) {
      suggestions.push({
        location: 'toilets',
        reason: 'Need to rest and restore stamina',
        priority: 100
      });
    }

    // Social-based suggestions
    if (socialNeed.urgency === NeedUrgency.HIGH || socialNeed.urgency === NeedUrgency.MEDIUM) {
      suggestions.push({
        location: 'bar',
        reason: 'Need social interaction',
        priority: 70
      });
      suggestions.push({
        location: 'dancefloor',
        reason: 'Join the crowd for social energy',
        priority: 60
      });
    }

    // Entertainment-based suggestions
    if (entertainmentNeed.urgency === NeedUrgency.HIGH || entertainmentNeed.urgency === NeedUrgency.MEDIUM) {
      suggestions.push({
        location: 'dancefloor',
        reason: 'Experience the music and energy',
        priority: 80
      });
      suggestions.push({
        location: 'panorama_bar',
        reason: 'Enjoy the atmosphere',
        priority: 50
      });
    }

    // Sort by priority
    suggestions.sort((a, b) => b.priority - a.priority);
    
    return suggestions;
  }

  public getDebugInfo(): any {
    return {
      agentId: this.agent.id,
      agentType: this.agent.type,
      currentLocation: this.currentLocation,
      needs: Object.fromEntries(
        Array.from(this.needs.entries()).map(([type, need]) => [
          type,
          {
            value: need.currentValue,
            threshold: need.threshold,
            urgency: need.urgency,
            satisfied: need.isSatisfied()
          }
        ])
      ),
      mostUrgentNeed: this.getMostUrgentNeed()?.type || 'none',
      suggestions: this.getLocationSuggestions().slice(0, 3)
    };
  }
}