// Autonomous Interaction System - Dwarf Fortress-like idle gameplay
// Tamas interact with each other, form relationships, compete, cooperate, and create emergent stories

import { AdvancedTamaData, TamaRelationship, RelationshipEvent, AutonomousGoal, Activity, GoalType, RelationshipType } from '../types-advanced';
import { TamaGameState } from '../types';

export interface AutonomousEvent {
  id: string;
  timestamp: number;
  type: 'social' | 'conflict' | 'cooperation' | 'discovery' | 'achievement' | 'disaster' | 'romance';
  participantIds: string[];
  location: string;
  description: string;
  impact: EventImpact[];
  significance: 'minor' | 'moderate' | 'major' | 'historic'; // How much this matters to the community

  // Chain reactions - events that might trigger as a result
  potentialConsequences?: {
    probability: number;
    consequenceType: AutonomousEvent['type'];
    description: string;
  }[];
}

export interface EventImpact {
  tamaId: string;
  statChanges?: Partial<AdvancedTamaData['stats']>;
  relationshipChanges?: { targetId: string; change: number; newType?: RelationshipType }[];
  moodChange: number;
  stressChange: number;
  reputationChange: number;
  newGoals?: AutonomousGoal[];
  learnedSkills?: Record<string, number>;
}

export interface SocialDynamics {
  communityMood: number;           // 0-100, overall happiness of all Tamas
  socialCohesion: number;          // 0-100, how well they get along as a group
  leadershipStability: number;     // 0-100, how stable the social hierarchy is
  conflictLevel: number;           // 0-100, how much tension exists

  // Emergent social structures
  socialGroups: SocialGroup[];     // Cliques, gangs, clubs that form naturally
  socialHierarchy: HierarchyLevel[]; // Pecking order based on respect/leadership
  territorialClaims: TerritorialClaim[]; // Who owns what spaces

  // Community events and traditions
  emergentTraditions: CommunityTradition[];
  scheduledEvents: CommunityEvent[];

  // News and gossip system
  rumors: Rumor[];                 // Information that spreads between Tamas
  communityMemory: HistoricalEvent[]; // Things everyone remembers
}

export interface SocialGroup {
  id: string;
  name: string;                    // Auto-generated name based on group characteristics
  memberIds: string[];

  // Group identity and purpose
  groupType: 'friendship' | 'work' | 'hobby' | 'rivalry' | 'romantic' | 'family' | 'protection';
  commonInterests: Activity[];
  groupGoals: AutonomousGoal[];

  // Group dynamics
  cohesion: number;                // 0-100, how tight-knit they are
  exclusivity: number;             // 0-100, how hard it is to join
  stability: number;               // 0-100, how likely to break up
  influence: number;               // 0-100, how much sway they have in community

  // Leadership structure
  leader?: string;                 // Tama who leads this group
  lieutenants: string[];           // Second-in-command Tamas

  // Group activities and meeting patterns
  meetingSpots: string[];          // Where they hang out
  activitySchedule: {
    activity: Activity;
    frequency: 'daily' | 'weekly' | 'monthly' | 'sporadic';
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  }[];

  // Relations with other groups
  alliedGroups: string[];          // Groups they cooperate with
  rivalGroups: string[];           // Groups they compete against
  neutralGroups: string[];        // Groups they ignore
}

export interface HierarchyLevel {
  rank: number;                    // 1 = highest status, higher numbers = lower status
  tamaId: string;
  title: string;                   // Auto-generated based on how they achieved this rank
  respectLevel: number;            // 0-100, how much others defer to them

  // How they maintain/earned their position
  powerBase: 'strength' | 'intelligence' | 'charisma' | 'age' | 'achievement' | 'connections';
  challengeRisk: number;           // 0-100, likelihood someone will try to usurp them

  // Privileges and responsibilities
  privileges: string[];            // What benefits this rank provides
  responsibilities: string[];      // What duties this rank requires
}

export interface TerritorialClaim {
  locationId: string;
  ownerId: string;
  claimType: 'exclusive' | 'priority' | 'shared' | 'contested';

  // Claim details
  claimStrength: number;           // 0-100, how well-established this claim is
  disputeLevel: number;            // 0-100, how much others contest it

  // Usage patterns
  primaryUse: Activity;
  allowedActivities: Activity[];
  forbiddenActivities: Activity[];

  // Access control
  allowedVisitors: string[];       // Specific Tamas who can visit
  bannedVisitors: string[];        // Specific Tamas who are not welcome
  visitorPolicy: 'open' | 'friends_only' | 'invitation_only' | 'closed';

  // Defense and enforcement
  defenseStrength: number;         // 0-100, how well they can protect this area
  lastDefended: number;            // When they last had to defend it
  allies: string[];                // Tamas who will help defend this area
}

export interface CommunityTradition {
  id: string;
  name: string;
  description: string;

  // How this tradition emerged
  origin: {
    creatorId?: string;             // Tama who started it
    originEvent: string;            // What event led to this tradition
    timestamp: number;              // When it began
  };

  // Tradition details
  frequency: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'annual' | 'special_occasion';
  participationType: 'all' | 'voluntary' | 'invited' | 'elite_only';
  location: string;

  // Tradition activities
  activities: {
    activity: Activity;
    order: number;                  // Sequence in the tradition
    duration: number;               // Minutes for this activity
    requiredParticipants: number;   // Minimum number needed
  }[];

  // Social significance
  importance: number;              // 0-100, how much the community values this
  compliance: number;              // 0-100, how many participate when expected
  enforcement: 'none' | 'social_pressure' | 'exclusion' | 'punishment';

  // Evolution over time
  stability: number;               // 0-100, how resistant to change
  recentChanges: {
    changeDate: number;
    changeDescription: string;
    initiatorId: string;
  }[];
}

export interface CommunityEvent {
  id: string;
  eventType: 'competition' | 'celebration' | 'meeting' | 'ceremony' | 'crisis_response';
  name: string;
  description: string;

  // Scheduling
  scheduledTime: number;
  duration: number;                // Minutes
  location: string;

  // Participation
  organizer: string;               // Tama who arranged this
  expectedParticipants: string[];
  actualParticipants: string[];

  // Event mechanics
  activities: Activity[];
  successConditions: string[];     // What needs to happen for this to be successful
  rewards: EventImpact[];          // What participants gain

  // Community impact
  moodModifier: number;            // How this affects community mood
  cohesionModifier: number;        // How this affects social cohesion
  reputationEffects: Record<string, number>; // How this affects individual reputations
}

export interface Rumor {
  id: string;
  content: string;                 // What the rumor claims
  accuracy: number;                // 0-100, how true this actually is

  // Spread pattern
  sourceId: string;                // Who started this rumor
  currentCarriers: string[];       // Who currently knows/spreads this
  believability: number;           // 0-100, how plausible this seems

  // Impact and consequences
  targetIds: string[];             // Who this rumor is about
  harmfulness: number;             // 0-100, how much damage this could do
  benefits: number;                // 0-100, how much this could help targets

  // Rumor lifecycle
  creationTime: number;
  peakSpreadTime: number;          // When most Tamas knew this
  decayRate: number;               // How quickly this is forgotten
  refutationAttempts: {
    attempterId: string;
    timestamp: number;
    effectiveness: number;          // How well the refutation worked
  }[];
}

export interface HistoricalEvent {
  id: string;
  eventDate: number;
  eventType: 'founding' | 'crisis' | 'achievement' | 'tragedy' | 'discovery' | 'war' | 'celebration';

  // Event details
  summary: string;
  participants: string[];
  location: string;

  // Long-term impact
  communityImpact: number;         // -100 to +100, how this affected everyone
  culturalSignificance: number;    // 0-100, how much this is remembered and referenced
  lessonsLearned: string[];        // What wisdom the community gained

  // Commemorative elements
  isCommemorated: boolean;
  commemorationType?: 'holiday' | 'monument' | 'tradition' | 'story';
  commemorationDetails?: string;
}

export class AutonomousInteractionSystem {
  private gameState: TamaGameState;
  private socialDynamics: SocialDynamics;
  private eventQueue: AutonomousEvent[] = [];
  private lastProcessTime: number = Date.now();

  constructor(gameState: TamaGameState) {
    this.gameState = gameState;
    this.socialDynamics = this.initializeSocialDynamics();
  }

  // ============ MAIN PROCESSING LOOP ============

  processTick(deltaTime: number): AutonomousEvent[] {
    // For now, skip processing until we implement the RPG stat system
    // This prevents build errors while we transition
    return [];

    /* TODO: Uncomment after implementing AdvancedTamaData migration
    const tamas = this.gameState.tamas as AdvancedTamaData[];
    const newEvents: AutonomousEvent[] = [];

    // Process each Tama's autonomous behavior
    for (const tama of tamas) {
      // Update current goals and activities
      this.updateTamaGoals(tama);
      this.processTamaActivity(tama, deltaTime);

      // Check for spontaneous interactions with other Tamas
      const interactionEvent = this.checkForSpontaneousInteractions(tama, tamas);
      if (interactionEvent) {
        newEvents.push(interactionEvent);
      }

      // Check for autonomous goal completion
      const goalEvents = this.checkGoalCompletion(tama);
      newEvents.push(...goalEvents);
    }

    // Process community-level events
    const communityEvents = this.processCommunityEvents(tamas, deltaTime);
    newEvents.push(...communityEvents);

    // Update social dynamics
    this.updateSocialDynamics(tamas, newEvents);

    // Process rumor spread
    this.processRumorSpread(tamas);

    // Check for emergent social structures
    this.checkEmergentSocialStructures(tamas);

    return newEvents;
    */
  }

  // ============ INDIVIDUAL TAMA BEHAVIOR ============

  private updateTamaGoals(tama: AdvancedTamaData): void {
    // Remove completed or impossible goals
    tama.currentGoals = tama.currentGoals.filter(goal =>
      this.isGoalStillValid(goal, tama)
    );

    // Add new goals based on personality and situation
    if (tama.currentGoals.length < 3) { // Each Tama can have up to 3 active goals
      const newGoal = this.generateGoalForTama(tama);
      if (newGoal) {
        tama.currentGoals.push(newGoal);
      }
    }

    // Prioritize goals based on personality and current needs
    tama.currentGoals.sort((a, b) => this.calculateGoalPriority(b, tama) - this.calculateGoalPriority(a, tama));
  }

  private generateGoalForTama(tama: AdvancedTamaData): AutonomousGoal | null {
    // Goals are generated based on personality, relationships, and current state
    const possibleGoals: { type: GoalType; weight: number }[] = [];

    // Personality-driven goals
    if (tama.personality.extraversion > 70) {
      possibleGoals.push({ type: 'socialize', weight: tama.personality.extraversion });
    }

    if (tama.personality.competitiveness > 60) {
      possibleGoals.push({ type: 'compete', weight: tama.personality.competitiveness });
    }

    if (tama.personality.curiosity > 50) {
      possibleGoals.push({ type: 'explore', weight: tama.personality.curiosity });
      possibleGoals.push({ type: 'train_skill', weight: tama.personality.curiosity });
    }

    // Relationship-driven goals
    const hasEnemies = Object.values(tama.relationships).some(rel => rel.strength < -20);
    if (hasEnemies && tama.personality.agreeableness > 60) {
      possibleGoals.push({ type: 'resolve_conflict', weight: 80 });
    }

    const hasFriends = Object.values(tama.relationships).some(rel => rel.strength > 60);
    if (hasFriends) {
      possibleGoals.push({ type: 'bond', weight: 50 });
    }

    // Need-driven goals
    if (tama.mentalState.stress > 60) {
      possibleGoals.push({ type: 'rest', weight: tama.mentalState.stress });
    }

    if (tama.mentalState.satisfaction < 40) {
      possibleGoals.push({ type: 'seek_stimulation', weight: 100 - tama.mentalState.satisfaction });
    }

    // Select goal randomly based on weights
    if (possibleGoals.length === 0) return null;

    const totalWeight = possibleGoals.reduce((sum, goal) => sum + goal.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const goalOption of possibleGoals) {
      currentWeight += goalOption.weight;
      if (random <= currentWeight) {
        return this.createSpecificGoal(goalOption.type, tama);
      }
    }

    return null;
  }

  private createSpecificGoal(type: GoalType, tama: AdvancedTamaData): AutonomousGoal {
    // Create specific goal instances based on type
    const baseGoal: Partial<AutonomousGoal> = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: Math.floor(Math.random() * 5) + 3, // 3-7 priority
    };

    switch (type) {
      case 'socialize':
        return {
          ...baseGoal,
          timeRequired: 30 + Math.random() * 60, // 30-90 minutes
          rewards: {
            moodChange: 15,
            relationshipChanges: [{ targetId: 'ANY', change: 5 }]
          },
          failureEffects: {
            moodChange: -5,
            stressIncrease: 10
          },
          availabilityConditions: {}
        } as AutonomousGoal;

      case 'train_skill':
        const skills = Object.keys(tama.rpgStats.skills);
        const randomSkill = skills[Math.floor(Math.random() * skills.length)] as keyof AdvancedTamaData['rpgStats']['skills'];

        return {
          ...baseGoal,
          timeRequired: 60 + Math.random() * 120, // 1-3 hours
          skillCheck: {
            skill: randomSkill,
            difficulty: 15,
            criticalSuccess: 20
          },
          rewards: {
            skillExperience: { [randomSkill]: 10 },
            moodChange: 10
          },
          failureEffects: {
            moodChange: -3,
            stressIncrease: 5
          },
          availabilityConditions: {}
        } as AutonomousGoal;

      default:
        return {
          ...baseGoal,
          timeRequired: 30,
          rewards: { moodChange: 5 },
          failureEffects: { moodChange: -2, stressIncrease: 3 },
          availabilityConditions: {}
        } as AutonomousGoal;
    }
  }

  // ============ SOCIAL INTERACTION DETECTION ============

  private checkForSpontaneousInteractions(activeTama: AdvancedTamaData, allTamas: AdvancedTamaData[]): AutonomousEvent | null {
    // Tamas might spontaneously interact based on proximity, relationships, and personality

    // Find other Tamas in the same location
    const nearbyTamas = allTamas.filter(tama =>
      tama.id !== activeTama.id &&
      tama.activityLocation === activeTama.activityLocation &&
      tama.currentActivity !== null // Both must be doing something
    );

    if (nearbyTamas.length === 0) return null;

    // Calculate interaction probabilities
    const interactionChances: { tama: AdvancedTamaData; probability: number; type: 'friendly' | 'competitive' | 'romantic' | 'conflict' }[] = [];

    for (const nearbyTama of nearbyTamas) {
      const relationship = activeTama.relationships[nearbyTama.id];
      const baseChance = this.calculateInteractionProbability(activeTama, nearbyTama);

      let interactionType: 'friendly' | 'competitive' | 'romantic' | 'conflict' = 'friendly';

      if (relationship) {
        if (relationship.strength < -30) interactionType = 'conflict';
        else if (relationship.relationshipType === 'romantic') interactionType = 'romantic';
        else if (relationship.relationshipType === 'rival') interactionType = 'competitive';
      }

      interactionChances.push({
        tama: nearbyTama,
        probability: baseChance,
        type: interactionType
      });
    }

    // Roll for interaction
    for (const chance of interactionChances) {
      if (Math.random() < chance.probability / 100) {
        return this.createInteractionEvent(activeTama, chance.tama, chance.type);
      }
    }

    return null;
  }

  private calculateInteractionProbability(tama1: AdvancedTamaData, tama2: AdvancedTamaData): number {
    let probability = 5; // Base 5% chance

    // Personality factors
    if (tama1.personality.extraversion > 60) probability += 10;
    if (tama2.personality.extraversion > 60) probability += 10;
    if (tama1.personality.agreeableness > 60) probability += 5;
    if (tama2.personality.agreeableness > 60) probability += 5;

    // Relationship history
    const relationship = tama1.relationships[tama2.id];
    if (relationship) {
      if (relationship.strength > 0) probability += Math.min(relationship.strength / 2, 20);
      else probability += Math.max(relationship.strength / 4, -15); // Negative relationships can still lead to interactions (conflicts)
    }

    // Activity compatibility
    if (tama1.currentActivity === tama2.currentActivity) probability += 15;

    // Stress and mood effects
    if (tama1.mentalState.stress > 70) probability -= 10;
    if (tama2.mentalState.stress > 70) probability -= 10;

    return Math.max(0, Math.min(50, probability)); // Cap at 0-50%
  }

  private createInteractionEvent(tama1: AdvancedTamaData, tama2: AdvancedTamaData, type: 'friendly' | 'competitive' | 'romantic' | 'conflict'): AutonomousEvent {
    const eventDescriptions = {
      friendly: [
        `${tama1.name} and ${tama2.name} had a pleasant conversation`,
        `${tama1.name} helped ${tama2.name} with their activity`,
        `${tama1.name} and ${tama2.name} shared a funny moment together`
      ],
      competitive: [
        `${tama1.name} challenged ${tama2.name} to a friendly competition`,
        `${tama1.name} and ${tama2.name} tried to outdo each other`,
        `${tama1.name} and ${tama2.name} engaged in a spirited rivalry`
      ],
      romantic: [
        `${tama1.name} and ${tama2.name} shared a romantic moment`,
        `${tama1.name} gave ${tama2.name} a thoughtful gift`,
        `${tama1.name} and ${tama2.name} went on a cute adventure together`
      ],
      conflict: [
        `${tama1.name} and ${tama2.name} had a heated argument`,
        `${tama1.name} and ${tama2.name} couldn't see eye to eye`,
        `Tensions flared between ${tama1.name} and ${tama2.name}`
      ]
    };

    const description = eventDescriptions[type][Math.floor(Math.random() * eventDescriptions[type].length)];

    // Calculate impacts based on interaction type
    const impacts: EventImpact[] = [];

    const relationshipChange = type === 'friendly' ? 5 : type === 'romantic' ? 10 : type === 'competitive' ? 2 : -8;

    impacts.push({
      tamaId: tama1.id,
      relationshipChanges: [{ targetId: tama2.id, change: relationshipChange }],
      moodChange: type === 'conflict' ? -5 : type === 'romantic' ? 15 : 5,
      stressChange: type === 'conflict' ? 10 : -2,
      reputationChange: 0
    });

    impacts.push({
      tamaId: tama2.id,
      relationshipChanges: [{ targetId: tama1.id, change: relationshipChange }],
      moodChange: type === 'conflict' ? -5 : type === 'romantic' ? 15 : 5,
      stressChange: type === 'conflict' ? 10 : -2,
      reputationChange: 0
    });

    return {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'social',
      participantIds: [tama1.id, tama2.id],
      location: tama1.activityLocation || 'unknown',
      description,
      impact: impacts,
      significance: type === 'romantic' || type === 'conflict' ? 'moderate' : 'minor'
    };
  }

  // ============ SOCIAL DYNAMICS MANAGEMENT ============

  private updateSocialDynamics(tamas: AdvancedTamaData[], events: AutonomousEvent[]): void {
    // Update community mood based on recent events and individual moods
    const averageMood = tamas.reduce((sum, tama) => sum + (tama.needs.happiness || 50), 0) / tamas.length;
    this.socialDynamics.communityMood = averageMood;

    // Update social cohesion based on relationship strengths
    const allRelationships = tamas.flatMap(tama => Object.values(tama.relationships));
    const averageRelationshipStrength = allRelationships.length > 0
      ? allRelationships.reduce((sum, rel) => sum + rel.strength, 0) / allRelationships.length
      : 0;

    this.socialDynamics.socialCohesion = Math.max(0, 50 + averageRelationshipStrength);

    // Update conflict level based on negative relationships
    const negativeRelationships = allRelationships.filter(rel => rel.strength < 0);
    this.socialDynamics.conflictLevel = Math.min(100, negativeRelationships.length * 10);

    // Check for new social groups forming
    this.detectEmergentSocialGroups(tamas);
  }

  private detectEmergentSocialGroups(tamas: AdvancedTamaData[]): void {
    // Look for groups of Tamas with strong mutual relationships
    // This is a simplified version - a full implementation would use graph analysis

    for (const tama of tamas) {
      const strongFriends = Object.entries(tama.relationships)
        .filter(([_, rel]) => rel.strength > 60)
        .map(([id, _]) => id);

      if (strongFriends.length >= 2) {
        // Check if these friends also like each other
        const mutualFriendships = strongFriends.filter(friendId => {
          const friendTama = tamas.find(t => t.id === friendId);
          if (!friendTama) return false;

          return strongFriends.every(otherFriendId =>
            otherFriendId === friendId ||
            (friendTama.relationships[otherFriendId]?.strength || 0) > 40
          );
        });

        if (mutualFriendships.length >= 2 && !this.isAlreadyInGroup([tama.id, ...mutualFriendships])) {
          // Create new social group
          this.createSocialGroup([tama.id, ...mutualFriendships], 'friendship');
        }
      }
    }
  }

  private isAlreadyInGroup(tamaIds: string[]): boolean {
    return this.socialDynamics.socialGroups.some(group =>
      tamaIds.every(id => group.memberIds.includes(id))
    );
  }

  private createSocialGroup(memberIds: string[], type: SocialGroup['groupType']): void {
    const newGroup: SocialGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateGroupName(memberIds, type),
      memberIds,
      groupType: type,
      commonInterests: [], // Would analyze member preferences
      groupGoals: [],
      cohesion: 70, // Start with good cohesion
      exclusivity: 30, // Start moderately exclusive
      stability: 60, // Moderately stable
      influence: 20, // Start with low influence
      lieutenants: [],
      meetingSpots: [],
      activitySchedule: [],
      alliedGroups: [],
      rivalGroups: [],
      neutralGroups: []
    };

    this.socialDynamics.socialGroups.push(newGroup);
  }

  private generateGroupName(memberIds: string[], type: SocialGroup['groupType']): string {
    // Simple name generation - a full system would be more sophisticated
    const typeNames = {
      friendship: ['Friends', 'Buddies', 'Pals', 'Crew'],
      work: ['Workers', 'Team', 'Guild', 'Union'],
      hobby: ['Club', 'Society', 'Circle', 'Group'],
      rivalry: ['Rivals', 'Opposition', 'Competitors'],
      romantic: ['Lovers', 'Couples', 'Partners'],
      family: ['Family', 'Clan', 'House', 'Lineage'],
      protection: ['Guards', 'Protectors', 'Watch', 'Defenders']
    };

    const baseName = typeNames[type][Math.floor(Math.random() * typeNames[type].length)];
    return `The ${baseName}`;
  }

  // ============ UTILITY METHODS ============

  private isGoalStillValid(goal: AutonomousGoal, tama: AdvancedTamaData): boolean {
    // Check if goal is still achievable and relevant
    return true; // Simplified for now
  }

  private calculateGoalPriority(goal: AutonomousGoal, tama: AdvancedTamaData): number {
    // Calculate goal priority based on personality and current state
    return goal.priority; // Simplified for now
  }

  private processTamaActivity(tama: AdvancedTamaData, deltaTime: number): void {
    // Update current activity progress
    // This would handle time-based goal completion
  }

  private checkGoalCompletion(tama: AdvancedTamaData): AutonomousEvent[] {
    // Check if any goals have been completed
    return []; // Simplified for now
  }

  private processCommunityEvents(tamas: AdvancedTamaData[], deltaTime: number): AutonomousEvent[] {
    // Generate community-wide events
    return []; // Simplified for now
  }

  private processRumorSpread(tamas: AdvancedTamaData[]): void {
    // Handle rumor propagation through the community
    // Simplified for now
  }

  private checkEmergentSocialStructures(tamas: AdvancedTamaData[]): void {
    // Look for new social hierarchies, territories, traditions
    // Simplified for now
  }

  private initializeSocialDynamics(): SocialDynamics {
    return {
      communityMood: 50,
      socialCohesion: 50,
      leadershipStability: 50,
      conflictLevel: 10,
      socialGroups: [],
      socialHierarchy: [],
      territorialClaims: [],
      emergentTraditions: [],
      scheduledEvents: [],
      rumors: [],
      communityMemory: []
    };
  }

  // ============ PUBLIC ACCESS METHODS ============

  getSocialDynamics(): SocialDynamics {
    return this.socialDynamics;
  }

  getRecentEvents(hours: number = 24): AutonomousEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.eventQueue.filter(event => event.timestamp >= cutoff);
  }

  getTamaRelationshipNetwork(tamaId: string): { relationships: TamaRelationship[]; indirectConnections: string[] } {
    // TODO: Enable after implementing AdvancedTamaData migration
    return { relationships: [], indirectConnections: [] };

    /*
    const tama = this.gameState.tamas.find(t => t.id === tamaId) as AdvancedTamaData;
    if (!tama) return { relationships: [], indirectConnections: [] };

    const directRelationships = Object.values(tama.relationships);

    // Find indirect connections (friends of friends)
    const indirectConnections = new Set<string>();
    for (const rel of directRelationships) {
      if (rel.strength > 30) { // Only through positive relationships
        const friendTama = this.gameState.tamas.find(t => t.id === rel.targetId) as AdvancedTamaData;
        if (friendTama) {
          Object.keys(friendTama.relationships)
            .filter(id => id !== tamaId && !tama.relationships[id])
            .forEach(id => indirectConnections.add(id));
        }
      }
    }

    return {
      relationships: directRelationships,
      indirectConnections: Array.from(indirectConnections)
    };
    */
  }
}