/**
 * JourneySystem - Intelligent agent navigation based on needs and social context
 * Creates purposeful movement patterns that reflect authentic clubber behavior
 */

import { Agent, AgentState, AgentType } from '../agents/Agent';
import { NeedsSystem, NeedType, NeedUrgency } from './NeedsSystem';
import { PathfindingSystem } from '../map/PathfindingSystem';

export enum JourneyGoal {
  RESTORE_STAMINA = 'restore_stamina',
  SEEK_SOCIAL = 'seek_social',
  FIND_ENTERTAINMENT = 'find_entertainment',
  EXPLORE = 'explore',
  FOLLOW_FRIEND = 'follow_friend',
  LEAVE_VENUE = 'leave_venue'
}

export class JourneyStep {
  public readonly location: string;
  public readonly reason: string;
  public readonly priority: number;
  public readonly estimatedDuration: number;
  public startTime: number | null = null;
  public completedTime: number | null = null;

  constructor(location: string, reason: string, priority: number, estimatedDuration: number) {
    this.location = location;
    this.reason = reason;
    this.priority = priority;
    this.estimatedDuration = estimatedDuration;
  }

  public start(): void {
    this.startTime = performance.now();
  }

  public complete(): void {
    this.completedTime = performance.now();
  }

  public getProgress(): number {
    if (!this.startTime) return 0;
    if (this.completedTime) return 1;
    
    const elapsed = performance.now() - this.startTime;
    return Math.min(1, elapsed / this.estimatedDuration);
  }

  public isComplete(): boolean {
    if (this.completedTime) return true;
    if (!this.startTime) return false;
    
    return performance.now() - this.startTime >= this.estimatedDuration;
  }

  public getTimeRemaining(): number {
    if (!this.startTime || this.completedTime) return 0;
    
    const elapsed = performance.now() - this.startTime;
    return Math.max(0, this.estimatedDuration - elapsed);
  }
}

export class JourneyPlan {
  public readonly steps: JourneyStep[];
  public readonly createdAt: number;
  public currentStepIndex: number = 0;

  constructor(steps: JourneyStep[]) {
    this.steps = steps;
    this.createdAt = performance.now();
  }

  public getCurrentStep(): JourneyStep | null {
    if (this.currentStepIndex >= this.steps.length) return null;
    return this.steps[this.currentStepIndex];
  }

  public advanceToNextStep(): boolean {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      return true;
    }
    return false;
  }

  public isComplete(): boolean {
    return this.currentStepIndex >= this.steps.length;
  }

  public getRemainingSteps(): JourneyStep[] {
    return this.steps.slice(this.currentStepIndex + 1);
  }

  public getTotalEstimatedDuration(): number {
    return this.steps.reduce((total, step) => total + step.estimatedDuration, 0);
  }
}

interface LocationVisit {
  location: string;
  duration: number;
  timestamp: number;
  satisfaction: number; // 0-100, inferred from duration vs expected
}

export class JourneySystem {
  private agent: Agent;
  private needsSystem: NeedsSystem;
  private pathfinder: PathfindingSystem | null = null;
  
  private currentPlan: JourneyPlan | null = null;
  private locationHistory: LocationVisit[] = [];
  private locationPreferences: Map<string, number> = new Map();
  private lastPlanTime: number = 0;
  
  // Navigation state
  private currentLocation: string = 'entrance';
  private isNavigating: boolean = false;
  private navigationStartTime: number = 0;

  constructor(agent: Agent, needsSystem: NeedsSystem) {
    this.agent = agent;
    this.needsSystem = needsSystem;
    this.initializeLocationPreferences();
  }

  public setPathfinder(pathfinder: PathfindingSystem): void {
    this.pathfinder = pathfinder;
  }

  private initializeLocationPreferences(): void {
    // Initialize with agent type-based preferences
    const basePreferences = this.getAgentTypePreferences(this.agent.type);
    for (const [location, preference] of basePreferences) {
      this.locationPreferences.set(location, preference);
    }
  }

  private getAgentTypePreferences(agentType: AgentType): Map<string, number> {
    const preferences = new Map<string, number>();
    
    switch (agentType) {
      case 'authentic':
        preferences.set('dancefloor', 85);
        preferences.set('bar', 60);
        preferences.set('toilets', 70);
        preferences.set('panorama_bar', 40);
        break;
        
      case 'regular':
        preferences.set('dancefloor', 75);
        preferences.set('bar', 70);
        preferences.set('toilets', 65);
        preferences.set('panorama_bar', 55);
        break;
        
      case 'curious':
        preferences.set('dancefloor', 60);
        preferences.set('bar', 65);
        preferences.set('toilets', 50);
        preferences.set('panorama_bar', 70);
        break;
        
      case 'tourist':
        preferences.set('dancefloor', 55);
        preferences.set('bar', 80);
        preferences.set('toilets', 45);
        preferences.set('panorama_bar', 85);
        break;
        
      case 'influencer':
        preferences.set('dancefloor', 70);
        preferences.set('bar', 85);
        preferences.set('toilets', 40);
        preferences.set('panorama_bar', 90);
        break;
        
      default:
        preferences.set('dancefloor', 50);
        preferences.set('bar', 50);
        preferences.set('toilets', 50);
        preferences.set('panorama_bar', 50);
    }
    
    return preferences;
  }

  public createJourneyPlan(nearbyAgents: Agent[] = []): JourneyPlan | null {
    const steps: JourneyStep[] = [];
    const urgentNeeds = this.needsSystem.getUnsatisfiedNeeds();
    
    if (urgentNeeds.length === 0) {
      // No urgent needs, create exploration or social plan
      const explorationStep = this.createExplorationStep(nearbyAgents);
      if (explorationStep) {
        steps.push(explorationStep);
      }
    } else {
      // Address needs in order of urgency
      const sortedNeeds = urgentNeeds.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });

      for (const need of sortedNeeds) {
        const step = this.createStepForNeed(need, nearbyAgents);
        if (step && !this.isLocationInPlan(steps, step.location)) {
          steps.push(step);
        }
      }
    }

    // Optimize step order for efficiency
    const optimizedSteps = this.optimizeStepOrder(steps);
    
    this.lastPlanTime = performance.now();
    return optimizedSteps.length > 0 ? new JourneyPlan(optimizedSteps) : null;
  }

  private createStepForNeed(need: any, nearbyAgents: Agent[]): JourneyStep | null {
    switch (need.type) {
      case NeedType.STAMINA:
        return this.createStaminaStep(need.urgency);
        
      case NeedType.SOCIAL:
        return this.createSocialStep(need.urgency, nearbyAgents);
        
      case NeedType.ENTERTAINMENT:
        return this.createEntertainmentStep(need.urgency);
        
      default:
        return null;
    }
  }

  private createStaminaStep(urgency: NeedUrgency): JourneyStep {
    const priority = urgency === NeedUrgency.HIGH ? 100 : urgency === NeedUrgency.MEDIUM ? 80 : 60;
    const duration = this.getStaminaRestDuration(urgency);
    
    return new JourneyStep(
      'toilets',
      urgency === NeedUrgency.HIGH ? 'Critical rest needed' : 'Restore energy',
      priority,
      duration
    );
  }

  private createSocialStep(urgency: NeedUrgency, nearbyAgents: Agent[]): JourneyStep {
    const priority = urgency === NeedUrgency.HIGH ? 85 : urgency === NeedUrgency.MEDIUM ? 65 : 45;
    
    // Choose location based on social context and preferences
    let location = 'bar'; // Default
    let reason = 'Seek social interaction';
    
    if (nearbyAgents.length > 0) {
      // Join where compatible agents are
      location = 'dancefloor';
      reason = 'Join the crowd';
    } else if (this.isRecentlyVisited('bar', 300000)) { // 5 minutes
      // Avoid recently visited bar
      location = 'dancefloor';
      reason = 'Find people on dancefloor';
    }

    const duration = this.getSocialDuration(urgency, this.agent.type);
    
    return new JourneyStep(location, reason, priority, duration);
  }

  private createEntertainmentStep(urgency: NeedUrgency): JourneyStep {
    const priority = urgency === NeedUrgency.HIGH ? 90 : urgency === NeedUrgency.MEDIUM ? 70 : 50;
    
    // Choose best entertainment location
    let location = 'dancefloor';
    let reason = 'Experience the music';
    
    // Consider agent preferences and recent visits
    if (this.isRecentlyVisited('dancefloor', 600000)) { // 10 minutes
      location = 'panorama_bar';
      reason = 'Change of scenery';
    }

    const duration = this.getEntertainmentDuration(urgency, this.agent.type);
    
    return new JourneyStep(location, reason, priority, duration);
  }

  private createExplorationStep(nearbyAgents: Agent[]): JourneyStep | null {
    // Choose location based on preferences and social context
    const availableLocations = ['dancefloor', 'bar', 'panorama_bar'];
    const unvisitedLocations = availableLocations.filter(loc => 
      !this.isRecentlyVisited(loc, 300000)
    );

    if (unvisitedLocations.length === 0) {
      return null; // Nowhere new to explore
    }

    // Pick location with highest preference that hasn't been visited recently
    let bestLocation = unvisitedLocations[0];
    let bestScore = this.locationPreferences.get(bestLocation) || 0;

    for (const location of unvisitedLocations) {
      const preference = this.locationPreferences.get(location) || 0;
      if (preference > bestScore) {
        bestLocation = location;
        bestScore = preference;
      }
    }

    const duration = this.getExplorationDuration(this.agent.type);
    
    return new JourneyStep(
      bestLocation,
      'Explore and enjoy',
      30,
      duration
    );
  }

  private getStaminaRestDuration(urgency: NeedUrgency): number {
    const baseDuration = urgency === NeedUrgency.HIGH ? 120000 : // 2 minutes
                        urgency === NeedUrgency.MEDIUM ? 90000 : // 1.5 minutes
                        60000; // 1 minute

    // Agent type modifiers
    switch (this.agent.type) {
      case 'authentic':
      case 'regular':
        return baseDuration * 0.8; // Efficient resters
      case 'tourist':
      case 'influencer':
        return baseDuration * 1.2; // Need more time
      default:
        return baseDuration;
    }
  }

  private getSocialDuration(urgency: NeedUrgency, agentType: AgentType): number {
    const baseDuration = urgency === NeedUrgency.HIGH ? 300000 : // 5 minutes
                        urgency === NeedUrgency.MEDIUM ? 180000 : // 3 minutes
                        120000; // 2 minutes

    switch (agentType) {
      case 'authentic':
        return baseDuration * 0.7; // Efficient socializers
      case 'influencer':
        return baseDuration * 1.5; // Need lots of attention
      case 'tourist':
        return baseDuration * 1.2; // Need validation
      default:
        return baseDuration;
    }
  }

  private getEntertainmentDuration(urgency: NeedUrgency, agentType: AgentType): number {
    const baseDuration = urgency === NeedUrgency.HIGH ? 600000 : // 10 minutes
                        urgency === NeedUrgency.MEDIUM ? 360000 : // 6 minutes
                        240000; // 4 minutes

    switch (agentType) {
      case 'authentic':
        return baseDuration * 1.5; // Deep music appreciation
      case 'influencer':
        return baseDuration * 0.6; // Short attention span
      case 'tourist':
        return baseDuration * 0.8; // Easily satisfied
      default:
        return baseDuration;
    }
  }

  private getExplorationDuration(agentType: AgentType): number {
    switch (agentType) {
      case 'authentic': return 180000; // 3 minutes
      case 'regular': return 240000; // 4 minutes
      case 'curious': return 300000; // 5 minutes
      case 'tourist': return 120000; // 2 minutes
      case 'influencer': return 90000; // 1.5 minutes
      default: return 180000;
    }
  }

  private isLocationInPlan(steps: JourneyStep[], location: string): boolean {
    return steps.some(step => step.location === location);
  }

  private optimizeStepOrder(steps: JourneyStep[]): JourneyStep[] {
    // Sort by priority first, then by logical flow
    const sorted = [...steps].sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Logical ordering: toilets first if urgent, entertainment last
      const locationOrder = { toilets: 0, bar: 1, panorama_bar: 2, dancefloor: 3 };
      const aOrder = locationOrder[a.location as keyof typeof locationOrder] || 2;
      const bOrder = locationOrder[b.location as keyof typeof locationOrder] || 2;
      
      return aOrder - bOrder;
    });

    return sorted;
  }

  public startJourney(plan: JourneyPlan): void {
    this.currentPlan = plan;
    const firstStep = plan.getCurrentStep();
    if (firstStep) {
      firstStep.start();
      this.navigateToLocation(firstStep.location);
    }
  }

  public update(deltaTime: number): void {
    if (!this.currentPlan) return;

    const currentStep = this.currentPlan.getCurrentStep();
    if (!currentStep) {
      // Journey complete
      this.currentPlan = null;
      return;
    }

    // Check if current step is complete
    if (currentStep.isComplete()) {
      this.recordLocationVisit(
        currentStep.location,
        currentStep.estimatedDuration
      );
      
      currentStep.complete();
      
      if (this.currentPlan.advanceToNextStep()) {
        // Start next step
        const nextStep = this.currentPlan.getCurrentStep();
        if (nextStep) {
          nextStep.start();
          this.navigateToLocation(nextStep.location);
        }
      } else {
        // Journey complete
        this.currentPlan = null;
      }
    }
  }

  public navigateToLocation(location: string): boolean {
    if (!this.pathfinder) return false;

    // Get location coordinates (simplified - would use actual map data)
    const locationCoords = this.getLocationCoordinates(location);
    if (!locationCoords) return false;

    // Set destination for agent
    const success = this.agent.setDestination(locationCoords.x, locationCoords.y);
    if (success) {
      this.isNavigating = true;
      this.navigationStartTime = performance.now();
      this.setCurrentLocation(location);
    }
    
    return success;
  }

  private getLocationCoordinates(location: string): { x: number; y: number } | null {
    // Simplified location mapping - in real implementation would use GridMap
    const locations: Record<string, { x: number; y: number }> = {
      'entrance': { x: 10, y: 19 },
      'bar': { x: 3, y: 2 },
      'toilets': { x: 17, y: 2 },
      'dancefloor': { x: 10, y: 10 },
      'panorama_bar': { x: 15, y: 15 }
    };
    
    return locations[location] || null;
  }

  public setCurrentLocation(location: string): void {
    this.currentLocation = location;
    this.needsSystem.setCurrentLocation(location);
  }

  public getCurrentLocation(): string {
    return this.currentLocation;
  }

  public recordLocationVisit(location: string, duration: number): void {
    const satisfaction = this.calculateVisitSatisfaction(location, duration);
    
    const visit: LocationVisit = {
      location,
      duration,
      timestamp: performance.now(),
      satisfaction
    };
    
    this.locationHistory.push(visit);
    
    // Keep only recent history (last 2 hours)
    const cutoffTime = performance.now() - 7200000;
    this.locationHistory = this.locationHistory.filter(v => v.timestamp > cutoffTime);
    
    // Update preferences based on satisfaction
    this.updateLocationPreference(location, satisfaction);
  }

  private calculateVisitSatisfaction(location: string, duration: number): number {
    // Calculate satisfaction based on duration vs expectation and current needs
    const expectedDuration = this.getExpectedDuration(location);
    const durationRatio = duration / expectedDuration;
    
    // Longer visits generally indicate satisfaction (up to a point)
    let satisfaction = Math.min(100, durationRatio * 60);
    
    // Add need-based satisfaction
    const needSatisfaction = this.getNeedSatisfactionForLocation(location);
    satisfaction = (satisfaction + needSatisfaction) / 2;
    
    return Math.max(0, Math.min(100, satisfaction));
  }

  private getExpectedDuration(location: string): number {
    switch (location) {
      case 'toilets': return 90000; // 1.5 minutes
      case 'bar': return 180000; // 3 minutes
      case 'dancefloor': return 300000; // 5 minutes
      case 'panorama_bar': return 240000; // 4 minutes
      default: return 180000;
    }
  }

  private getNeedSatisfactionForLocation(location: string): number {
    // Simplified - real implementation would track need changes during visit
    switch (location) {
      case 'toilets': return 80; // Usually satisfying for stamina
      case 'dancefloor': return 75; // Usually satisfying for entertainment
      case 'bar': return 70; // Usually satisfying for social
      case 'panorama_bar': return 65; // Moderate satisfaction
      default: return 50;
    }
  }

  private updateLocationPreference(location: string, satisfaction: number): void {
    const currentPreference = this.locationPreferences.get(location) || 50;
    const newPreference = (currentPreference * 0.9) + (satisfaction * 0.1); // Gradual learning
    this.locationPreferences.set(location, newPreference);
  }

  public shouldReplanJourney(): boolean {
    if (!this.currentPlan) return false;
    
    // Replan if urgent need emerges
    const urgentNeeds = this.needsSystem.getNeedsByUrgency(NeedUrgency.HIGH);
    if (urgentNeeds.length > 0) {
      const currentStep = this.currentPlan.getCurrentStep();
      if (currentStep) {
        // Check if current step addresses the urgent need
        const addressesUrgentNeed = this.stepAddressesNeed(currentStep, urgentNeeds[0]);
        return !addressesUrgentNeed;
      }
    }
    
    return false;
  }

  private stepAddressesNeed(step: JourneyStep, need: any): boolean {
    switch (need.type) {
      case NeedType.STAMINA:
        return step.location === 'toilets';
      case NeedType.SOCIAL:
        return step.location === 'bar' || step.location === 'dancefloor';
      case NeedType.ENTERTAINMENT:
        return step.location === 'dancefloor' || step.location === 'panorama_bar';
      default:
        return false;
    }
  }

  public replanJourney(): JourneyPlan | null {
    const newPlan = this.createJourneyPlan();
    if (newPlan) {
      this.currentPlan = newPlan;
      this.startJourney(newPlan);
    }
    return newPlan;
  }

  public isOnJourney(): boolean {
    return this.currentPlan !== null && !this.currentPlan.isComplete();
  }

  public getCurrentStep(): JourneyStep | null {
    return this.currentPlan?.getCurrentStep() || null;
  }

  public isRecentlyVisited(location: string, timeWindow: number): boolean {
    const cutoffTime = performance.now() - timeWindow;
    return this.locationHistory.some(visit => 
      visit.location === location && visit.timestamp > cutoffTime
    );
  }

  public getRecentLocationHistory(): LocationVisit[] {
    const cutoffTime = performance.now() - 3600000; // Last hour
    return this.locationHistory.filter(visit => visit.timestamp > cutoffTime);
  }

  public getLocationPreferences(): Map<string, number> {
    return new Map(this.locationPreferences);
  }

  public shouldFollowAgent(other: Agent, otherLocation: string): boolean {
    // Simplified social following logic
    if (this.agent.type === 'curious') {
      if (other.type === 'influencer' || other.type === 'authentic') {
        return Math.random() < 0.3; // 30% chance to follow interesting agents
      }
    }
    
    if (this.agent.type === 'tourist') {
      if (other.type === 'influencer') {
        return Math.random() < 0.5; // 50% chance to follow influencers
      }
    }
    
    return false;
  }

  public getDebugInfo(): any {
    return {
      agentId: this.agent.id,
      currentLocation: this.currentLocation,
      isOnJourney: this.isOnJourney(),
      currentStep: this.getCurrentStep()?.location || null,
      planStepsRemaining: this.currentPlan?.getRemainingSteps().length || 0,
      recentVisits: this.getRecentLocationHistory().slice(-3),
      preferences: Object.fromEntries(this.locationPreferences),
      shouldReplan: this.shouldReplanJourney()
    };
  }
}