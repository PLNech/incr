/**
 * SocialSystem - Dynamic group formation and social influence system
 * Creates realistic clubber social behaviors and group dynamics
 */

import { Agent, AgentType } from '../agents/Agent';

export enum GroupType {
  FRIEND_GROUP = 'friend_group',      // Close friends moving together
  FOLLOWER_GROUP = 'follower_group',  // Influencer with followers
  DANCE_CIRCLE = 'dance_circle',      // Temporary dancing group
  QUEUE_GROUP = 'queue_group',        // People waiting together
  CONVERSATION = 'conversation'       // Small chat group
}

export enum GroupRole {
  LEADER = 'leader',
  MEMBER = 'member',
  FOLLOWER = 'follower'
}

export class SocialRelationship {
  public readonly agent1Id: string;
  public readonly agent2Id: string;
  public strength: number = 50; // 0-100
  public compatibility: number = 0;
  public lastInteraction: number = 0;
  public interactionCount: number = 0;
  public interactions: Array<{ timestamp: number; satisfaction: number; context: string }> = [];

  constructor(agent1Id: string, agent2Id: string) {
    this.agent1Id = agent1Id;
    this.agent2Id = agent2Id;
    this.lastInteraction = performance.now();
  }

  public calculateCompatibility(type1: AgentType, type2: AgentType): number {
    // Compatibility matrix based on agent types
    const compatibilityMatrix: Record<AgentType, Record<AgentType, number>> = {
      'authentic': {
        'authentic': 85,
        'regular': 75,
        'curious': 60,
        'tourist': 25,
        'influencer': 15
      },
      'regular': {
        'authentic': 75,
        'regular': 80,
        'curious': 70,
        'tourist': 45,
        'influencer': 35
      },
      'curious': {
        'authentic': 60,
        'regular': 70,
        'curious': 75,
        'tourist': 65,
        'influencer': 55
      },
      'tourist': {
        'authentic': 25,
        'regular': 45,
        'curious': 65,
        'tourist': 80,
        'influencer': 70
      },
      'influencer': {
        'authentic': 15,
        'regular': 35,
        'curious': 55,
        'tourist': 70,
        'influencer': 60
      }
    };

    this.compatibility = compatibilityMatrix[type1][type2];
    return this.compatibility;
  }

  public recordInteraction(satisfaction: number, context: string): void {
    const interaction = {
      timestamp: performance.now(),
      satisfaction,
      context
    };
    
    this.interactions.push(interaction);
    this.interactionCount++;
    this.lastInteraction = interaction.timestamp;
    
    // Update relationship strength based on satisfaction
    const strengthChange = (satisfaction - 50) * 0.2; // ±10 max change
    this.strength = Math.max(0, Math.min(100, this.strength + strengthChange));
    
    // Keep only recent interactions (last 2 hours)
    const cutoffTime = performance.now() - 7200000;
    this.interactions = this.interactions.filter(i => i.timestamp > cutoffTime);
  }

  public getRecentSatisfaction(): number {
    if (this.interactions.length === 0) return 50;
    
    const recentInteractions = this.interactions.slice(-5); // Last 5 interactions
    const avgSatisfaction = recentInteractions.reduce((sum, i) => sum + i.satisfaction, 0) / recentInteractions.length;
    
    return avgSatisfaction;
  }

  public decay(deltaTime: number): void {
    // Relationships decay over time without interaction
    const timeSinceLastInteraction = performance.now() - this.lastInteraction;
    const hoursElapsed = timeSinceLastInteraction / 3600000; // Convert to hours
    
    if (hoursElapsed > 1) {
      const decayRate = 0.5; // Points per hour
      this.strength = Math.max(0, this.strength - (decayRate * hoursElapsed));
    }
  }
}

export class SocialGroup {
  public readonly id: string;
  public readonly type: GroupType;
  public readonly createdAt: number;
  public members: Map<string, GroupRole> = new Map();
  public cohesion: number;
  public maxSize: number;
  public activity: string = 'socializing';
  public location: string = 'dancefloor';
  private experiences: Array<{ timestamp: number; satisfaction: number; context: string }> = [];

  constructor(id: string, type: GroupType) {
    this.id = id;
    this.type = type;
    this.createdAt = performance.now();
    
    // Set type-specific properties
    switch (type) {
      case GroupType.FRIEND_GROUP:
        this.cohesion = 80;
        this.maxSize = 5;
        break;
      case GroupType.FOLLOWER_GROUP:
        this.cohesion = 60;
        this.maxSize = 8;
        break;
      case GroupType.DANCE_CIRCLE:
        this.cohesion = 70;
        this.maxSize = 12;
        break;
      case GroupType.QUEUE_GROUP:
        this.cohesion = 30;
        this.maxSize = 20;
        break;
      case GroupType.CONVERSATION:
        this.cohesion = 75;
        this.maxSize = 4;
        break;
    }
  }

  public addMember(agentId: string, role: GroupRole): boolean {
    if (this.members.size >= this.maxSize) {
      return false;
    }
    
    this.members.set(agentId, role);
    return true;
  }

  public removeMember(agentId: string): boolean {
    const wasLeader = this.members.get(agentId) === GroupRole.LEADER;
    const removed = this.members.delete(agentId);
    
    // If leader leaves certain group types, group should dissolve
    if (wasLeader && (this.type === GroupType.FOLLOWER_GROUP || this.type === GroupType.QUEUE_GROUP)) {
      this.cohesion = 0; // Mark for dissolution
    }
    
    return removed;
  }

  public hasMember(agentId: string): boolean {
    return this.members.has(agentId);
  }

  public getLeader(): string | null {
    let leader: string | null = null;
    this.members.forEach((role, agentId) => {
      if (role === GroupRole.LEADER && !leader) {
        leader = agentId;
      }
    });
    return leader;
  }

  public getFollowers(): string[] {
    const followers: string[] = [];
    this.members.forEach((role, agentId) => {
      if (role === GroupRole.FOLLOWER) {
        followers.push(agentId);
      }
    });
    return followers;
  }

  public getMembers(): string[] {
    return Array.from(this.members.keys());
  }

  public getGroupType(): GroupType {
    return this.type;
  }

  public recordGroupExperience(context: string, satisfaction: number): void {
    const experience = {
      timestamp: performance.now(),
      satisfaction,
      context
    };
    
    this.experiences.push(experience);
    
    // Update cohesion based on group satisfaction
    const cohesionChange = (satisfaction - 50) * 0.1; // ±5 max change
    this.cohesion = Math.max(0, Math.min(100, this.cohesion + cohesionChange));
    
    // Keep only recent experiences
    const cutoffTime = performance.now() - 3600000; // Last hour
    this.experiences = this.experiences.filter(e => e.timestamp > cutoffTime);
  }

  public shouldMoveAsTogether(): boolean {
    // Groups with high cohesion tend to move together
    switch (this.type) {
      case GroupType.FRIEND_GROUP:
        return this.cohesion > 60;
      case GroupType.FOLLOWER_GROUP:
        return this.cohesion > 40;
      case GroupType.DANCE_CIRCLE:
        return true; // Dance circles always move together
      case GroupType.CONVERSATION:
        return this.cohesion > 70;
      case GroupType.QUEUE_GROUP:
        return true; // Queue groups are inherently together
      default:
        return false;
    }
  }

  public shouldDissolve(): boolean {
    // Groups dissolve when cohesion is too low or too few members
    if (this.members.size < 2) return true;
    if (this.cohesion < 20) return true;
    
    // Time-based dissolution for temporary groups
    const ageHours = (performance.now() - this.createdAt) / 3600000;
    switch (this.type) {
      case GroupType.DANCE_CIRCLE:
        return ageHours > 0.5; // 30 minutes max
      case GroupType.CONVERSATION:
        return ageHours > 0.25; // 15 minutes max
      case GroupType.QUEUE_GROUP:
        return ageHours > 1; // 1 hour max
      default:
        return false;
    }
  }

  public getAverageCohesion(): number {
    return this.cohesion;
  }

  public update(deltaTime: number): void {
    // Natural cohesion decay over time
    const decayRate = 0.1; // Points per second
    this.cohesion = Math.max(0, this.cohesion - (decayRate * deltaTime / 1000));
  }
}

export class SocialSystem {
  private agents: Map<string, Agent> = new Map();
  private groups: Map<string, SocialGroup> = new Map();
  private relationships: Map<string, SocialRelationship> = new Map();
  
  private lastGroupFormationCheck: number = 0;
  private groupFormationInterval: number = 5000; // Check every 5 seconds

  public addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  public removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    
    // Remove from all groups
    this.groups.forEach((group) => {
      group.removeMember(agentId);
    });
    
    // Remove relationships
    const toRemove = Array.from(this.relationships.keys()).filter(key => 
      key.includes(agentId)
    );
    toRemove.forEach(key => this.relationships.delete(key));
  }

  public addGroup(group: SocialGroup): void {
    this.groups.set(group.id, group);
  }

  public removeGroup(groupId: string): void {
    this.groups.delete(groupId);
  }

  public update(deltaTime: number): void {
    // Update all groups
    this.groups.forEach((group) => {
      group.update(deltaTime);
      
      // Remove dissolved groups
      if (group.shouldDissolve()) {
        this.removeGroup(group.id);
      }
    });
    
    // Update relationships
    this.relationships.forEach((relationship) => {
      relationship.decay(deltaTime);
    });
    
    // Periodic group formation check
    const now = performance.now();
    if (now - this.lastGroupFormationCheck > this.groupFormationInterval) {
      this.checkForGroupFormation();
      this.lastGroupFormationCheck = now;
    }
  }

  public checkForGroupFormation(): void {
    const agentsList: Agent[] = [];
    this.agents.forEach((agent) => {
      agentsList.push(agent);
    });
    const unGroupedAgents = agentsList.filter(agent => 
      this.getGroupsForAgent(agent.id).length === 0
    );

    if (unGroupedAgents.length < 2) return;

    // Try to form groups based on proximity and compatibility
    for (let i = 0; i < unGroupedAgents.length; i++) {
      const agent = unGroupedAgents[i];
      const nearbyAgents = this.getAgentsInProximity(agent, 3);
      
      if (nearbyAgents.length > 0) {
        // Check if these agents are compatible for group formation
        const compatibleAgents = nearbyAgents.filter(other => 
          this.areCompatibleForGroup(agent, other)
        );
        
        if (compatibleAgents.length > 0) {
          this.formGroup([agent, ...compatibleAgents.slice(0, 3)]);
        }
      }
    }
  }

  private areCompatibleForGroup(agent1: Agent, agent2: Agent): boolean {
    const relationship = this.getOrCreateRelationship(agent1.id, agent2.id);
    const compatibility = relationship.calculateCompatibility(agent1.type as any, agent2.type as any);
    
    return compatibility > 50; // Minimum compatibility threshold
  }

  private formGroup(agents: Agent[]): SocialGroup | null {
    if (agents.length < 2) return null;
    
    // Determine group type based on agent types
    const groupType = this.determineGroupType(agents);
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const group = new SocialGroup(groupId, groupType);
    
    // Assign roles
    const leader = this.selectGroupLeader(agents);
    if (leader) {
      group.addMember(leader.id, GroupRole.LEADER);
      
      for (const agent of agents) {
        if (agent.id !== leader.id) {
          const role = agent.type === 'tourist' || agent.type === 'curious' ? 
                      GroupRole.FOLLOWER : GroupRole.MEMBER;
          group.addMember(agent.id, role);
        }
      }
    } else {
      // No clear leader, everyone is a member
      for (const agent of agents) {
        group.addMember(agent.id, GroupRole.MEMBER);
      }
    }
    
    this.addGroup(group);
    return group;
  }

  private determineGroupType(agents: Agent[]): GroupType {
    const types = agents.map(a => a.type);
    
    // If there's an influencer with tourists/curious, it's a follower group
    if (types.includes('influencer') && (types.includes('tourist') || types.includes('curious'))) {
      return GroupType.FOLLOWER_GROUP;
    }
    
    // If mostly authentic/regular agents, it's a friend group
    const authenticRegular = types.filter(t => t === 'authentic' || t === 'regular').length;
    if (authenticRegular / types.length > 0.6) {
      return GroupType.FRIEND_GROUP;
    }
    
    // Default to dance circle for mixed groups
    return GroupType.DANCE_CIRCLE;
  }

  private selectGroupLeader(agents: Agent[]): Agent | null {
    // Influencers are natural leaders
    const influencer = agents.find(a => a.type === 'influencer');
    if (influencer) return influencer;
    
    // Authentic agents can lead authentic/regular groups
    const authentic = agents.find(a => a.type === 'authentic');
    if (authentic) return authentic;
    
    // Regular agents as backup leaders
    const regular = agents.find(a => a.type === 'regular');
    if (regular) return regular;
    
    return null;
  }

  public getAgentsInProximity(agent: Agent, radius: number): Agent[] {
    const nearby: Agent[] = [];
    
    this.agents.forEach((other) => {
      if (other.id === agent.id) return;
      
      const distance = Math.sqrt(
        Math.pow(other.x - agent.x, 2) + Math.pow(other.y - agent.y, 2)
      );
      
      if (distance <= radius) {
        nearby.push(other);
      }
    });
    
    return nearby;
  }

  public getOrCreateRelationship(agent1Id: string, agent2Id: string): SocialRelationship {
    const key = [agent1Id, agent2Id].sort().join('-');
    
    if (!this.relationships.has(key)) {
      this.relationships.set(key, new SocialRelationship(agent1Id, agent2Id));
    }
    
    return this.relationships.get(key)!;
  }

  public getGroupsForAgent(agentId: string): SocialGroup[] {
    const groups: SocialGroup[] = [];
    
    this.groups.forEach((group) => {
      if (group.hasMember(agentId)) {
        groups.push(group);
      }
    });
    
    return groups;
  }

  public getAllGroups(): SocialGroup[] {
    const groups: SocialGroup[] = [];
    this.groups.forEach((group) => {
      groups.push(group);
    });
    return groups;
  }

  public getGroupInfluenceOnDecision(agentId: string, decisionType: string): any {
    const groups = this.getGroupsForAgent(agentId);
    if (groups.length === 0) return null;
    
    // For location decisions, consider group preferences
    if (decisionType === 'choose_location') {
      const primaryGroup = groups[0]; // Use most important group
      const leader = primaryGroup.getLeader();
      
      return {
        suggestedLocation: 'dancefloor', // Simplified - would use actual group preferences
        influence: primaryGroup.cohesion / 100,
        reason: leader ? 'following_group_leader' : 'group_consensus'
      };
    }
    
    return null;
  }

  public getGroupSatisfactionForAgent(agentId: string): number {
    const groups = this.getGroupsForAgent(agentId);
    if (groups.length === 0) return 0;
    
    // Average satisfaction across all groups
    const avgCohesion = groups.reduce((sum, group) => sum + group.cohesion, 0) / groups.length;
    return avgCohesion;
  }

  public getGroupEntertainmentBonus(agentId: string): number {
    const groups = this.getGroupsForAgent(agentId);
    let bonus = 0;
    
    for (const group of groups) {
      switch (group.type) {
        case GroupType.DANCE_CIRCLE:
          bonus += group.cohesion * 0.3; // Up to 30 point bonus
          break;
        case GroupType.FRIEND_GROUP:
          bonus += group.cohesion * 0.2; // Up to 20 point bonus
          break;
        default:
          bonus += group.cohesion * 0.1; // Up to 10 point bonus
      }
    }
    
    return Math.min(50, bonus); // Cap at 50 point bonus
  }

  public getSocialEnergyBonus(agentId: string): number {
    const groups = this.getGroupsForAgent(agentId);
    let bonus = 0;
    
    for (const group of groups) {
      const members = group.getMembers();
      const groupSize = members.length;
      
      // Larger groups provide more social energy
      bonus += Math.min(20, groupSize * 3);
      
      // High cohesion groups are more satisfying
      bonus += group.cohesion * 0.15;
    }
    
    return Math.min(40, bonus); // Cap at 40 point bonus
  }

  public getInfluenceOnJourney(agentId: string): any {
    const groups = this.getGroupsForAgent(agentId);
    if (groups.length === 0) return null;
    
    const primaryGroup = groups[0];
    const role = primaryGroup.members.get(agentId);
    
    if (role === GroupRole.FOLLOWER) {
      const leader = primaryGroup.getLeader();
      return {
        preferredLocation: 'follow_leader',
        targetAgent: leader,
        influence: primaryGroup.cohesion / 100
      };
    }
    
    if (primaryGroup.shouldMoveAsTogether()) {
      return {
        preferredLocation: primaryGroup.location,
        waitForGroup: true,
        influence: primaryGroup.cohesion / 100
      };
    }
    
    return null;
  }

  public getGroupConsensus(groupId: string, decisionType: string): any {
    const group = this.groups.get(groupId);
    if (!group) return null;
    
    const members = group.getMembers();
    if (members.length === 0) return null;
    
    // Simplified consensus - would involve actual agent preferences
    switch (decisionType) {
      case 'next_location':
        return {
          location: group.type === GroupType.DANCE_CIRCLE ? 'dancefloor' : 'bar',
          confidence: group.cohesion,
          participatingMembers: members.length
        };
      default:
        return null;
    }
  }

  public getDebugInfo(): any {
    return {
      totalAgents: this.agents.size,
      totalGroups: this.groups.size,
      totalRelationships: this.relationships.size,
      groupsByType: Object.fromEntries(
        Object.values(GroupType).map(type => [
          type,
          Array.from(this.groups.values()).filter(g => g.type === type).length
        ])
      ),
      avgGroupSize: this.groups.size > 0 ? 
        Array.from(this.groups.values()).reduce((sum, g) => sum + g.members.size, 0) / this.groups.size : 0,
      avgGroupCohesion: this.groups.size > 0 ?
        Array.from(this.groups.values()).reduce((sum, g) => sum + g.cohesion, 0) / this.groups.size : 0
    };
  }
}