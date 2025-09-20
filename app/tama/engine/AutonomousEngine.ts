import {
  AdvancedTamaData,
  AutonomousGoal,
  GoalType,
  Activity,
  RelationshipType,
  TamaRelationship,
  CompletedGoal,
  RelationshipEvent
} from '../types-advanced';
import { TamaGameState } from '../types';

/**
 * Engine for autonomous Tama behavior, goal generation, and social interactions
 */
export class AutonomousEngine {
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly GOAL_COMPLETION_CHANCE = 0.3; // 30% chance to complete a goal per update

  /**
   * Update autonomous behaviors for all Tamas
   */
  updateAutonomousBehavior(gameState: TamaGameState, advancedTamas: AdvancedTamaData[]): void {
    const now = Date.now();

    if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
      return; // Not time for update yet
    }

    advancedTamas.forEach(tama => {
      this.updateTamaGoals(tama, advancedTamas, gameState);
      this.processCurrentActivity(tama, advancedTamas, gameState);
      this.updateRelationships(tama, advancedTamas);
    });

    this.lastUpdate = now;
  }

  /**
   * Update and generate goals for a specific Tama
   */
  private updateTamaGoals(tama: AdvancedTamaData, allTamas: AdvancedTamaData[], gameState: TamaGameState): void {
    // Remove completed or expired goals
    tama.currentGoals = tama.currentGoals.filter(goal => {
      // Extract timestamp from goal ID if it follows the pattern, otherwise use creation time heuristic
      let goalCreationTime;
      if (goal.id.includes('_')) {
        const timestampPart = goal.id.split('_').pop();
        goalCreationTime = timestampPart && !isNaN(Number(timestampPart)) ? Number(timestampPart) : Date.now();
      } else {
        // Fallback: assume recent if we can't parse timestamp
        goalCreationTime = Date.now() - 60000; // 1 minute ago
      }

      const isExpired = Date.now() - goalCreationTime > 300000; // 5 minutes max
      if (isExpired) {
        this.completeGoal(tama, goal, false, "Goal expired");
      }
      return !isExpired;
    });

    // Generate new goals if we have less than 3
    while (tama.currentGoals.length < 3) {
      const newGoal = this.generateGoal(tama, allTamas, gameState);
      if (newGoal) {
        tama.currentGoals.push(newGoal);
      } else {
        break; // No more goals can be generated
      }
    }

    // Sort goals by priority
    tama.currentGoals.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate a new goal for a Tama based on their personality and needs
   */
  private generateGoal(tama: AdvancedTamaData, allTamas: AdvancedTamaData[], gameState: TamaGameState): AutonomousGoal | null {
    const goalTypes = this.getAvailableGoalTypes(tama, allTamas, gameState);
    if (goalTypes.length === 0) return null;

    const goalType = goalTypes[Math.floor(Math.random() * goalTypes.length)];
    return this.createGoalOfType(goalType, tama, allTamas, gameState);
  }

  /**
   * Get available goal types based on Tama's current state
   */
  private getAvailableGoalTypes(tama: AdvancedTamaData, allTamas: AdvancedTamaData[], gameState: TamaGameState): GoalType[] {
    const available: GoalType[] = [];
    const personality = tama.personality;
    const needs = tama.needs;

    // Basic needs-driven goals (highest priority)
    if (needs.hunger < 60) available.push('gather_resources');
    if (needs.energy < 50) available.push('rest');  // More generous threshold for tests
    if (needs.happiness < 50) available.push('seek_stimulation');

    // Personality-driven goals
    if (personality.favoriteActivities.includes('training')) available.push('train_skill');
    if (personality.favoriteActivities.includes('socializing') && allTamas.length > 1) available.push('socialize');
    if (personality.favoriteActivities.includes('crafting')) available.push('create');
    if (personality.favoriteActivities.includes('exploring')) available.push('explore');
    if (personality.favoriteActivities.includes('teaching') && this.canTeach(tama, allTamas)) available.push('teach');
    if (personality.favoriteActivities.includes('competing') && allTamas.length > 1) available.push('compete');

    // Social goals based on relationships
    if (this.hasConflictingRelationships(tama)) available.push('resolve_conflict');
    if (this.hasFriendsToBond(tama, allTamas)) available.push('bond');
    if (personality.compatibilityFactors.needsSocializing && allTamas.length > 1) available.push('socialize');

    // Territory and resource goals
    if (tama.territory.claimedAreas.length === 0) available.push('establish_territory');

    // Ensure socialites get social goals
    if (personality.archetype === 'socialite' && allTamas.length > 1) {
      available.push('socialize');
    }

    // Always have a fallback option
    if (available.length === 0) {
      available.push('rest');
    }

    return available;
  }

  /**
   * Create a specific goal based on type
   */
  private createGoalOfType(type: GoalType, tama: AdvancedTamaData, allTamas: AdvancedTamaData[], gameState: TamaGameState): AutonomousGoal {
    const baseGoal = {
      id: `${type}_${tama.id}_${Date.now()}`,
      type,
      priority: this.calculateGoalPriority(type, tama),
      timeRequired: 5, // 5 minutes base
      rewards: {
        moodChange: 5,
        statGains: {},
        skillExperience: {},
        relationshipChanges: [],
        items: []
      },
      failureEffects: {
        moodChange: -2,
        stressIncrease: 5,
        statLoss: {},
        relationshipDamage: []
      },
      availabilityConditions: {
        minimumStats: {},
        requiredRelationships: [],
        requiredItems: [],
        forbiddenActivities: []
      }
    };

    switch (type) {
      case 'socialize':
        const socialTarget = this.findSocialTarget(tama, allTamas);
        return {
          ...baseGoal,
          targetId: socialTarget?.id,
          skillCheck: { skill: 'persuasion', difficulty: 12, criticalSuccess: 18 },
          rewards: {
            ...baseGoal.rewards,
            moodChange: 10,
            skillExperience: { persuasion: 2, insight: 1 },
            relationshipChanges: socialTarget ? [{ targetId: socialTarget.id, change: 5 }] : []
          }
        };

      case 'train_skill':
        const skillToTrain = this.chooseSkillToTrain(tama);
        return {
          ...baseGoal,
          skillCheck: { skill: skillToTrain, difficulty: 10, criticalSuccess: 16 },
          rewards: {
            ...baseGoal.rewards,
            skillExperience: { [skillToTrain]: 3 },
            moodChange: 8
          },
          timeRequired: 10
        };

      case 'explore':
        return {
          ...baseGoal,
          skillCheck: { skill: 'survival', difficulty: 11, criticalSuccess: 17 },
          rewards: {
            ...baseGoal.rewards,
            moodChange: 12,
            skillExperience: { survival: 2, investigation: 1 },
            items: Math.random() < 0.3 ? ['exploration_token'] : []
          }
        };

      case 'rest':
        return {
          ...baseGoal,
          priority: tama.needs.energy < 30 ? 9 : 5,
          timeRequired: 15,
          rewards: {
            ...baseGoal.rewards,
            moodChange: 3,
            statGains: { stamina: 2 }
          }
        };

      case 'compete':
        const competitor = this.findCompetitor(tama, allTamas);
        return {
          ...baseGoal,
          targetId: competitor?.id,
          skillCheck: { skill: 'combat', difficulty: 13, criticalSuccess: 19 },
          rewards: {
            ...baseGoal.rewards,
            moodChange: 15,
            skillExperience: { combat: 3 },
            relationshipChanges: competitor ? [{ targetId: competitor.id, change: -2 }] : []
          },
          failureEffects: {
            ...baseGoal.failureEffects,
            moodChange: -8,
            relationshipDamage: competitor ? [{ targetId: competitor.id, damage: 3 }] : []
          }
        };

      default:
        return baseGoal;
    }
  }

  /**
   * Calculate goal priority based on Tama's needs and personality
   */
  private calculateGoalPriority(type: GoalType, tama: AdvancedTamaData): number {
    const needs = tama.needs;
    const personality = tama.personality;

    switch (type) {
      case 'rest': return needs.energy < 30 ? 10 : needs.energy < 50 ? 8 : 3;
      case 'gather_resources': return needs.hunger < 40 ? 9 : needs.hunger < 60 ? 6 : 2;
      case 'seek_stimulation': return needs.happiness < 30 ? 8 : needs.happiness < 50 ? 6 : 3;
      case 'socialize': return personality.extraversion > 60 ? 7 : 4;
      case 'train_skill': return personality.conscientiousness > 50 ? 6 : 4;
      case 'explore': return personality.openness > 60 ? 6 : 3;
      case 'compete': return personality.competitiveness > 60 ? 5 : 2;
      default: return 4;
    }
  }

  /**
   * Process current activity and attempt to complete goals
   */
  private processCurrentActivity(tama: AdvancedTamaData, allTamas: AdvancedTamaData[], gameState: TamaGameState): void {
    if (tama.currentGoals.length === 0) {
      tama.currentActivity = 'resting';
      return;
    }

    const currentGoal = tama.currentGoals[0]; // Highest priority goal
    tama.currentActivity = this.goalTypeToActivity(currentGoal.type);

    // Check if enough time has passed and attempt completion
    const timeSinceStart = Date.now() - tama.activityStartTime;
    const requiredTime = currentGoal.timeRequired * 60000; // Convert to milliseconds

    if (timeSinceStart >= requiredTime && Math.random() < this.GOAL_COMPLETION_CHANCE) {
      const success = this.attemptGoalCompletion(tama, currentGoal, allTamas);
      this.completeGoal(tama, currentGoal, success, success ? "Goal completed successfully" : "Failed to complete goal");
    }
  }

  /**
   * Convert goal type to activity for display
   */
  private goalTypeToActivity(goalType: GoalType): Activity {
    switch (goalType) {
      case 'socialize': return 'socializing';
      case 'train_skill': return 'training';
      case 'explore': return 'exploring';
      case 'rest': return 'resting';
      case 'compete': return 'competing';
      case 'create': return 'crafting';
      case 'teach': return 'teaching';
      case 'gather_resources': return 'exploring';
      default: return 'resting';
    }
  }

  /**
   * Attempt to complete a goal with skill checks
   */
  private attemptGoalCompletion(tama: AdvancedTamaData, goal: AutonomousGoal, allTamas: AdvancedTamaData[]): boolean {
    if (!goal.skillCheck) return true; // Auto-success if no check required

    const skill = goal.skillCheck.skill;
    const skillValue = tama.rpgStats.skills[skill];
    const roll = Math.floor(Math.random() * 20) + 1 + skillValue;

    const success = roll >= goal.skillCheck.difficulty;
    const criticalSuccess = roll >= goal.skillCheck.criticalSuccess;

    // Apply bonus effects for critical success
    if (criticalSuccess) {
      goal.rewards.moodChange = Math.floor(goal.rewards.moodChange * 1.5);
      Object.keys(goal.rewards.skillExperience || {}).forEach(sk => {
        goal.rewards.skillExperience![sk] *= 2;
      });
    }

    return success;
  }

  /**
   * Complete a goal and apply its effects
   */
  private completeGoal(tama: AdvancedTamaData, goal: AutonomousGoal, success: boolean, description: string): void {
    // Remove from current goals
    tama.currentGoals = tama.currentGoals.filter(g => g.id !== goal.id);

    // Apply effects
    const effects = success ? goal.rewards : goal.failureEffects;

    tama.needs.happiness = Math.max(0, Math.min(100, tama.needs.happiness + effects.moodChange));
    tama.mentalState.stress = Math.max(0, tama.mentalState.stress + (effects.stressIncrease || 0));

    // Apply skill experience
    if (effects.skillExperience) {
      Object.entries(effects.skillExperience).forEach(([skill, exp]) => {
        if (skill in tama.rpgStats.skills) {
          (tama.rpgStats.skills as any)[skill] += exp;
        }
      });
    }

    // Apply relationship changes
    if ('relationshipChanges' in effects && effects.relationshipChanges) {
      effects.relationshipChanges.forEach(change => {
        this.modifyRelationship(tama, change.targetId, change.change, goal.type);
      });
    }

    // Apply relationship damage (for failures)
    if ('relationshipDamage' in effects && effects.relationshipDamage) {
      effects.relationshipDamage.forEach(damage => {
        this.modifyRelationship(tama, damage.targetId, -damage.damage, goal.type);
      });
    }

    // Add to history
    const completedGoal: CompletedGoal = {
      ...goal,
      completionTime: Date.now(),
      success,
      outcomeDescription: description,
      actualRewards: effects
    };

    tama.goalHistory.push(completedGoal);

    // Keep only last 20 completed goals
    if (tama.goalHistory.length > 20) {
      tama.goalHistory = tama.goalHistory.slice(-20);
    }

    // Reset activity timer
    tama.activityStartTime = Date.now();
  }

  /**
   * Update relationships between Tamas based on proximity and interactions
   */
  private updateRelationships(tama: AdvancedTamaData, allTamas: AdvancedTamaData[]): void {
    allTamas.forEach(otherTama => {
      if (otherTama.id === tama.id) return;

      if (!tama.relationships[otherTama.id]) {
        // Initialize new relationship
        tama.relationships[otherTama.id] = this.createNewRelationship(otherTama.id);
      }

      const relationship = tama.relationships[otherTama.id];

      // Decay relationship strength over time if not interacting
      const daysSinceInteraction = (Date.now() - relationship.lastInteraction) / (1000 * 60 * 60 * 24);
      if (daysSinceInteraction > 1) {
        relationship.strength = Math.max(-100, relationship.strength - Math.floor(daysSinceInteraction));
      }

      // Random chance for spontaneous interaction
      if (Math.random() < 0.05) { // 5% chance per update
        this.simulateInteraction(tama, otherTama, allTamas);
      }
    });
  }

  /**
   * Create a new relationship between Tamas
   */
  private createNewRelationship(targetId: string): TamaRelationship {
    return {
      targetId,
      relationshipType: 'stranger',
      strength: 0,
      trust: 50,
      respect: 50,
      history: [],
      interactionFrequency: 0.1,
      cooperationLevel: 50,
      conflictLevel: 10,
      personalityCompatibility: 50,
      statComplementarity: 50,
      sharedInterests: 50,
      lastInteraction: Date.now(),
      relationshipStability: 50
    };
  }

  /**
   * Simulate an interaction between two Tamas
   */
  private simulateInteraction(tama1: AdvancedTamaData, tama2: AdvancedTamaData, allTamas: AdvancedTamaData[]): void {
    const relationship1 = tama1.relationships[tama2.id];
    const relationship2 = tama2.relationships[tama1.id] || this.createNewRelationship(tama1.id);

    // Ensure both sides have the relationship
    if (!tama2.relationships[tama1.id]) {
      tama2.relationships[tama1.id] = this.createNewRelationship(tama1.id);
    }

    const compatibility = this.calculateCompatibility(tama1, tama2);
    const interactionType = this.determineInteractionType(tama1, tama2, compatibility);

    // Apply interaction effects
    const impact = Math.floor(Math.random() * 10) + 1;
    let strengthChange = 0;

    switch (interactionType) {
      case 'cooperation':
        strengthChange = impact;
        relationship1.trust += Math.floor(impact / 2);
        break;
      case 'conflict':
        strengthChange = -impact;
        relationship1.trust -= Math.floor(impact / 3);
        break;
      case 'teaching':
        strengthChange = Math.floor(impact / 2);
        relationship1.respect += impact;
        break;
      case 'bonding':
        strengthChange = impact;
        break;
      default:
        strengthChange = Math.floor(impact / 3);
    }

    // Update relationship strength and ensure bounds
    relationship1.strength = Math.max(-100, Math.min(100, relationship1.strength + strengthChange));
    relationship1.trust = Math.max(0, Math.min(100, relationship1.trust));
    relationship1.respect = Math.max(0, Math.min(100, relationship1.respect));

    // Update relationship type based on strength
    relationship1.relationshipType = this.determineRelationshipType(relationship1.strength, relationship1.trust, relationship1.respect);

    // Record the event
    const event: RelationshipEvent = {
      timestamp: Date.now(),
      eventType: interactionType,
      impact: strengthChange,
      description: this.generateInteractionDescription(tama1.name, tama2.name, interactionType, strengthChange > 0),
      witnessIds: allTamas.filter(t => t.id !== tama1.id && t.id !== tama2.id).map(t => t.id)
    };

    relationship1.history.push(event);
    relationship1.lastInteraction = Date.now();

    // Mirror the relationship (mutual effect)
    relationship2.strength = Math.max(-100, Math.min(100, relationship2.strength + strengthChange));
    relationship2.history.push(event);
    relationship2.lastInteraction = Date.now();
  }

  // Helper methods for relationship system
  private calculateCompatibility(tama1: AdvancedTamaData, tama2: AdvancedTamaData): number {
    const p1 = tama1.personality;
    const p2 = tama2.personality;

    // Calculate personality compatibility based on Big 5 traits
    const traitDifferences = [
      Math.abs(p1.openness - p2.openness),
      Math.abs(p1.conscientiousness - p2.conscientiousness),
      Math.abs(p1.extraversion - p2.extraversion),
      Math.abs(p1.agreeableness - p2.agreeableness),
      Math.abs(p1.neuroticism - p2.neuroticism)
    ];

    const avgDifference = traitDifferences.reduce((a, b) => a + b, 0) / traitDifferences.length;
    return Math.max(0, 100 - avgDifference);
  }

  private determineInteractionType(tama1: AdvancedTamaData, tama2: AdvancedTamaData, compatibility: number): RelationshipEvent['eventType'] {
    if (compatibility > 70) return 'bonding';
    if (compatibility < 30) return 'conflict';
    if (tama1.personality.competitiveness > 60 && tama2.personality.competitiveness > 60) return 'competition';
    if (Math.random() < 0.3) return 'cooperation';
    return 'bonding';
  }

  private determineRelationshipType(strength: number, trust: number, respect: number): RelationshipType {
    if (strength > 80 && trust > 80) return 'best_friend';
    if (strength > 50 && trust > 60) return 'friend';
    if (strength < -50) return 'enemy';
    if (strength < -20 && respect > 60) return 'rival';
    if (respect > 80 && strength > 20) return 'mentor';
    if (strength > 20) return 'acquaintance';
    return 'stranger';
  }

  private generateInteractionDescription(name1: string, name2: string, type: RelationshipEvent['eventType'], positive: boolean): string {
    const descriptions = {
      cooperation: positive ? `${name1} and ${name2} worked together successfully` : `${name1} and ${name2} struggled to cooperate`,
      conflict: positive ? `${name1} and ${name2} resolved their differences` : `${name1} and ${name2} had a disagreement`,
      bonding: positive ? `${name1} and ${name2} grew closer` : `${name1} and ${name2} drifted apart`,
      teaching: positive ? `${name1} helped ${name2} learn something new` : `${name1}'s teaching didn't resonate with ${name2}`,
      competition: positive ? `${name1} and ${name2} had a friendly competition` : `${name1} and ${name2} competed intensely`
    };
    return descriptions[type] || `${name1} and ${name2} interacted`;
  }

  // Helper methods for goal generation
  private findSocialTarget(tama: AdvancedTamaData, allTamas: AdvancedTamaData[]): AdvancedTamaData | null {
    const candidates = allTamas.filter(t => t.id !== tama.id);
    if (candidates.length === 0) return null;

    // Prefer Tamas with positive relationships
    const friends = candidates.filter(t =>
      tama.relationships[t.id] && tama.relationships[t.id].strength > 0
    );

    return friends.length > 0 ? friends[Math.floor(Math.random() * friends.length)] :
           candidates[Math.floor(Math.random() * candidates.length)];
  }

  private findCompetitor(tama: AdvancedTamaData, allTamas: AdvancedTamaData[]): AdvancedTamaData | null {
    const candidates = allTamas.filter(t =>
      t.id !== tama.id && t.personality.competitiveness > 40
    );
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  }

  private chooseSkillToTrain(tama: AdvancedTamaData): keyof typeof tama.rpgStats.skills {
    const skills = Object.keys(tama.rpgStats.skills) as (keyof typeof tama.rpgStats.skills)[];

    // Prefer skills that align with personality
    const preferredSkills = skills.filter(skill => {
      if (tama.personality.favoriteActivities.includes('training') && ['athletics', 'combat'].includes(skill)) return true;
      if (tama.personality.favoriteActivities.includes('studying') && ['academics', 'investigation'].includes(skill)) return true;
      if (tama.personality.favoriteActivities.includes('socializing') && ['persuasion', 'performance'].includes(skill)) return true;
      return false;
    });

    const skillsToChoose = preferredSkills.length > 0 ? preferredSkills : skills;
    return skillsToChoose[Math.floor(Math.random() * skillsToChoose.length)];
  }

  private canTeach(tama: AdvancedTamaData, allTamas: AdvancedTamaData[]): boolean {
    return allTamas.some(other =>
      other.id !== tama.id &&
      other.level < tama.level - 2
    );
  }

  private hasConflictingRelationships(tama: AdvancedTamaData): boolean {
    return Object.values(tama.relationships).some(rel => rel.strength < -30);
  }

  private hasFriendsToBond(tama: AdvancedTamaData, allTamas: AdvancedTamaData[]): boolean {
    return Object.values(tama.relationships).some(rel =>
      rel.strength > 20 && rel.strength < 80
    );
  }

  /**
   * Modify relationship between two Tamas
   */
  private modifyRelationship(tama: AdvancedTamaData, targetId: string, change: number, context: GoalType): void {
    if (!tama.relationships[targetId]) {
      tama.relationships[targetId] = this.createNewRelationship(targetId);
    }

    const relationship = tama.relationships[targetId];
    relationship.strength = Math.max(-100, Math.min(100, relationship.strength + change));
    relationship.lastInteraction = Date.now();

    // Update relationship type based on new strength
    relationship.relationshipType = this.determineRelationshipType(
      relationship.strength,
      relationship.trust,
      relationship.respect
    );

    // Add event to history
    const event: RelationshipEvent = {
      timestamp: Date.now(),
      eventType: change > 0 ? 'bonding' : 'conflict',
      impact: change,
      description: `Relationship changed due to ${context} activity`,
      witnessIds: []
    };

    relationship.history.push(event);
  }

  /**
   * Get current activity summary for all Tamas
   */
  getActivitySummary(advancedTamas: AdvancedTamaData[]): Record<string, { activity: Activity; goals: number; relationships: number }> {
    const summary: Record<string, { activity: Activity; goals: number; relationships: number }> = {};

    advancedTamas.forEach(tama => {
      summary[tama.id] = {
        activity: tama.currentActivity || 'resting',
        goals: tama.currentGoals.length,
        relationships: Object.keys(tama.relationships).length
      };
    });

    return summary;
  }
}