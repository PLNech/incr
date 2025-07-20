/**
 * Agent - Base class for autonomous clubbers in BergInc
 * Handles movement, pathfinding, stamina, and social interactions
 */

import { GridMap, Position } from '../map/GridMap';
import { PathfindingSystem } from '../map/PathfindingSystem';
import { nameGenerator } from '../utils/NameGenerator';

export enum AgentState {
  IDLE = 'idle',
  MOVING = 'moving',
  INTERACTING = 'interacting',
  QUEUEING = 'queueing',
  LEAVING = 'leaving'
}

export enum MovementBehavior {
  ORGANIC = 'organic',      // Slow, deliberate, longer pauses - authentic clubbers
  ERRATIC = 'erratic',      // Medium speed, random direction changes - curious visitors
  PERFORMATIVE = 'performative' // Fast, direct, short pauses - influencer/tourist behavior
}

export type AgentType = 'authentic' | 'regular' | 'curious' | 'tourist' | 'influencer';

export interface AgentConfig {
  type: AgentType;
  movementBehavior?: MovementBehavior;
  stamina?: number;
  socialEnergy?: number;
  entertainment?: number;
  color?: string;
  customName?: { firstName: string; lastName: string; origin: string };
}

export class Agent {
  public readonly id: string;
  public x: number;
  public y: number;
  public state: AgentState = AgentState.IDLE;
  
  // Agent properties
  public readonly type: AgentType;
  public movementBehavior: MovementBehavior;
  public stamina: number = 100;
  public socialEnergy: number = 50;
  public entertainment: number = 50;
  public color: string;
  public isGuestList: boolean = false;
  
  // Personal info
  public firstName: string;
  public lastName: string;
  public origin: string;
  public entryTime: number;
  public mood: string = 'curious';
  public preferredPartner?: Agent;
  public budget: number = 0;

  // Movement state
  private destination: Position | null = null;
  private currentPath: Position[] | null = null;
  private pathIndex: number = 0;
  private lastMoveTime: number = 0;
  private movementSpeed: number = 1.0;
  
  // Systems
  private pathfinder: PathfindingSystem | null = null;
  private map: GridMap | null = null;

  // Internal state
  private lastStaminaUpdate: number = 0;
  private pauseUntil: number = 0;
  private metadata: Map<string, any> = new Map();
  
  // Floor tracking
  public currentFloor: number = 1; // Start on First Floor (Berghain main)

  constructor(id: string, x: number, y: number, config: AgentConfig) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = config.type;
    
    // Set defaults based on agent type
    this.movementBehavior = config.movementBehavior ?? this.getDefaultMovementBehavior(config.type);
    this.stamina = config.stamina ?? 100;
    this.socialEnergy = config.socialEnergy ?? this.getDefaultSocialEnergy(config.type);
    this.entertainment = config.entertainment ?? 50;
    this.color = config.color ?? this.getDefaultColor(config.type);
    
    // Generate personal info
    if (config.customName) {
      this.firstName = config.customName.firstName;
      this.lastName = config.customName.lastName;
      this.origin = config.customName.origin;
    } else {
      const nameData = nameGenerator.generateName();
      this.firstName = nameData.firstName;
      this.lastName = nameData.lastName;
      this.origin = nameData.origin;
    }
    
    this.entryTime = Date.now();
    this.mood = this.generateMood();
    
    // Generate random budget between 15-500€
    this.budget = 15 + Math.random() * 485; // 15 to 500

    this.lastMoveTime = performance.now();
    this.lastStaminaUpdate = performance.now();
  }
  
  private generateMood(): string {
    const moods = ['excited', 'curious', 'chill', 'energetic', 'contemplative', 'social', 'focused', 'euphoric'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  private getDefaultMovementBehavior(type: AgentType): MovementBehavior {
    switch (type) {
      case 'authentic':
      case 'regular':
        return MovementBehavior.ORGANIC;
      case 'curious':
        return MovementBehavior.ERRATIC;
      case 'tourist':
      case 'influencer':
        return MovementBehavior.PERFORMATIVE;
      default:
        return MovementBehavior.ORGANIC;
    }
  }

  private getDefaultSocialEnergy(type: AgentType): number {
    switch (type) {
      case 'authentic': return 80;
      case 'regular': return 70;
      case 'curious': return 60;
      case 'tourist': return 40;
      case 'influencer': return 30;
      default: return 50;
    }
  }

  private getDefaultColor(type: AgentType): string {
    switch (type) {
      case 'authentic': return '#2a2a2a';
      case 'regular': return '#404040';
      case 'curious': return '#0d4f3c';
      case 'tourist': return '#ff6b6b';
      case 'influencer': return '#4ecdc4';
      default: return '#666666';
    }
  }

  public setPathfinder(pathfinder: PathfindingSystem): void {
    this.pathfinder = pathfinder;
    this.map = (pathfinder as any).map; // Access private map through pathfinder
    
    // Register initial position
    this.registerPosition();
  }

  private registerPosition(): void {
    if (!this.map) return;
    
    const gridX = Math.floor(this.x);
    const gridY = Math.floor(this.y);
    
    try {
      if (!this.map.isOccupied(gridX, gridY)) {
        this.map.setOccupant(gridX, gridY, this.id);
      }
    } catch (error) {
      // Position might be out of bounds or already occupied
      console.warn(`Agent ${this.id} could not register position (${gridX}, ${gridY}):`, error);
    }
  }

  private clearPosition(): void {
    if (!this.map) return;
    
    const gridX = Math.floor(this.x);
    const gridY = Math.floor(this.y);
    
    try {
      if (this.map.getOccupant(gridX, gridY) === this.id) {
        this.map.clearOccupant(gridX, gridY);
      }
    } catch (error) {
      // Position might be out of bounds
      console.warn(`Agent ${this.id} could not clear position (${gridX}, ${gridY}):`, error);
    }
  }

  public setDestination(x: number, y: number): boolean {
    if (!this.pathfinder) {
      console.warn(`Agent ${this.id} has no pathfinder`);
      return false;
    }

    // Clear current position and find path
    this.clearPosition();
    
    const path = this.pathfinder.findPath(
      Math.floor(this.x), 
      Math.floor(this.y), 
      Math.floor(x), 
      Math.floor(y),
      { considerCrowdDensity: true }
    );

    if (!path) {
      // Re-register current position if pathfinding failed
      this.registerPosition();
      return false;
    }

    this.destination = { x, y };
    this.currentPath = path;
    this.pathIndex = 0;
    this.state = AgentState.MOVING;
    
    return true;
  }

  public hasDestination(): boolean {
    return this.destination !== null;
  }

  public getMovementSpeed(): number {
    let baseSpeed: number;
    
    switch (this.movementBehavior) {
      case MovementBehavior.ORGANIC:
        baseSpeed = 1.0;
        break;
      case MovementBehavior.ERRATIC:
        baseSpeed = 1.8;
        break;
      case MovementBehavior.PERFORMATIVE:
        baseSpeed = 2.5;
        break;
      default:
        baseSpeed = 1.0;
    }

    // Apply stamina modifier
    const staminaMultiplier = Math.max(0.3, this.stamina / 100);
    
    return baseSpeed * staminaMultiplier;
  }

  private getPauseDuration(): number {
    switch (this.movementBehavior) {
      case MovementBehavior.ORGANIC:
        return 2000 + Math.random() * 3000; // 2-5 seconds
      case MovementBehavior.ERRATIC:
        return 500 + Math.random() * 1500; // 0.5-2 seconds
      case MovementBehavior.PERFORMATIVE:
        return 100 + Math.random() * 400; // 0.1-0.5 seconds
      default:
        return 1000;
    }
  }

  public update(deltaTime: number, currentTier: number = 0): void {
    const now = performance.now();
    
    // Update stamina
    this.updateStamina(deltaTime);
    
    // Check if in pause
    if (now < this.pauseUntil) {
      return;
    }

    // Handle movement with tier-adjusted behavior
    if (this.state === AgentState.MOVING && this.currentPath) {
      this.updateMovement(deltaTime, currentTier);
    }

    // Random pause behavior for organic movement (tier-adjusted)
    if (this.state === AgentState.IDLE && this.movementBehavior === MovementBehavior.ORGANIC) {
      const pauseChance = Math.max(0.0005, 0.001 - (currentTier * 0.0001)); // Less pause at higher tiers
      if (Math.random() < pauseChance) {
        this.pauseUntil = now + this.getTierAdjustedPauseDuration(currentTier);
      }
    }
  }

  private updateStamina(deltaTime: number): void {
    const now = performance.now();
    const timeSinceLastUpdate = now - this.lastStaminaUpdate;
    
    if (timeSinceLastUpdate > 1000) { // Update every second
      if (this.state === AgentState.MOVING) {
        // Decrease stamina while moving
        const staminaLoss = 0.5 + (this.getMovementSpeed() * 0.2);
        this.stamina = Math.max(0, this.stamina - staminaLoss);
      } else {
        // Slowly recover stamina while idle
        this.stamina = Math.min(100, this.stamina + 0.1);
      }
      
      this.lastStaminaUpdate = now;
    }
  }

  private updateMovement(deltaTime: number, currentTier: number = 0): void {
    if (!this.currentPath || this.pathIndex >= this.currentPath.length) {
      this.reachDestination(currentTier);
      return;
    }

    const target = this.currentPath[this.pathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // Reached current waypoint
      this.pathIndex++;
      
      if (this.pathIndex >= this.currentPath.length) {
        this.reachDestination(currentTier);
        return;
      }
      
      // Add random pause between waypoints (tier-adjusted)
      if (Math.random() < 0.3) {
        this.pauseUntil = performance.now() + this.getTierAdjustedPauseDuration(currentTier) * 0.5;
        return;
      }
    } else {
      // Move towards target with tier-adjusted speed
      const speed = this.getTierAdjustedSpeed(currentTier);
      const moveDistance = speed * (deltaTime / 1000);
      
      this.clearPosition();
      
      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
      
      this.registerPosition();
    }
  }

  private reachDestination(currentTier: number = 0): void {
    this.state = AgentState.IDLE;
    this.destination = null;
    this.currentPath = null;
    this.pathIndex = 0;
    
    // Add pause after reaching destination (tier-adjusted)
    this.pauseUntil = performance.now() + this.getTierAdjustedPauseDuration(currentTier);
  }

  public getNearbyAgents(allAgents: Agent[], radius: number): Agent[] {
    return allAgents.filter(agent => {
      if (agent.id === this.id) return false;
      
      const dx = agent.x - this.x;
      const dy = agent.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= radius;
    });
  }

  public getDistanceTo(other: Agent): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public cleanup(): void {
    this.clearPosition();
    this.state = AgentState.IDLE;
    this.destination = null;
    this.currentPath = null;
  }
  
  public getTooltipInfo(): string {
    const timeInClub = Math.floor((Date.now() - this.entryTime) / 60000); // minutes
    const staminaIcon = this.stamina > 70 ? '💪' : this.stamina > 30 ? '😐' : '😴';
    const socialIcon = this.socialEnergy > 70 ? '🎉' : this.socialEnergy > 30 ? '🙂' : '😕';
    const entertainmentIcon = this.entertainment > 70 ? '✨' : this.entertainment > 30 ? '🎵' : '😑';
    
    return `${this.firstName} ${this.lastName}
📍 ${this.origin} · ${this.type}
😌 ${this.mood} · ${timeInClub}min in club
${staminaIcon} Energy: ${Math.floor(this.stamina)}%
${socialIcon} Social: ${Math.floor(this.socialEnergy)}%  
${entertainmentIcon} Vibe: ${Math.floor(this.entertainment)}%
💰 Budget: €${Math.floor(this.budget)}
${this.isGuestList ? '👑 Guest List' : '🎫 Regular Entry'}`;
  }
  
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Utility methods for debugging and visualization
  public getDebugInfo(): any {
    return {
      id: this.id,
      position: { x: this.x, y: this.y },
      floor: this.currentFloor,
      state: this.state,
      type: this.type,
      movementBehavior: this.movementBehavior,
      stamina: this.stamina,
      socialEnergy: this.socialEnergy,
      entertainment: this.entertainment,
      hasDestination: this.hasDestination(),
      destination: this.destination,
      pathLength: this.currentPath?.length ?? 0,
      pathIndex: this.pathIndex
    };
  }

  public toString(): string {
    return `Agent[${this.id}](${this.x.toFixed(1)}, ${this.y.toFixed(1)}) - ${this.state} - ${this.type}`;
  }

  // Metadata management for multi-floor navigation
  public setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  public getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  public hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  public clearMetadata(key: string): void {
    this.metadata.delete(key);
  }

  public clearAllMetadata(): void {
    this.metadata.clear();
  }

  // Floor management
  public setFloor(floor: number): void {
    this.currentFloor = floor;
  }

  public getFloor(): number {
    return this.currentFloor;
  }

  // Tier-based movement evolution
  public evolveForTier(tier: number): void {
    // Agent behavior evolves based on club's tier progression
    const originalBehavior = this.getDefaultMovementBehavior(this.type);
    
    // Calculate evolution factor (0 = no change, 1 = complete transformation)
    const evolutionFactor = Math.min(1, tier / 5); // Fully evolved at tier 5
    
    // Agents become more performative and less authentic as tier increases
    if (originalBehavior === MovementBehavior.ORGANIC) {
      if (tier >= 2 && Math.random() < evolutionFactor * 0.3) {
        this.movementBehavior = MovementBehavior.ERRATIC; // Some authentic people become erratic
      }
      if (tier >= 4 && Math.random() < evolutionFactor * 0.2) {
        this.movementBehavior = MovementBehavior.PERFORMATIVE; // Few become performative
      }
    } else if (originalBehavior === MovementBehavior.ERRATIC) {
      if (tier >= 3 && Math.random() < evolutionFactor * 0.4) {
        this.movementBehavior = MovementBehavior.PERFORMATIVE; // Curious people become performative
      }
    }
    
    // Tier-based stamina drain (higher tiers are more exhausting)
    const tierStress = tier * 0.1;
    this.stamina = Math.max(10, this.stamina - tierStress);
    
    // Social energy changes based on tier and agent type
    if (this.type === 'authentic' || this.type === 'regular') {
      // Authentic people lose social energy in commercialized environments
      this.socialEnergy = Math.max(10, this.socialEnergy - (tier * 2));
    } else if (this.type === 'tourist' || this.type === 'influencer') {
      // Tourists/influencers gain energy in commercialized environments
      this.socialEnergy = Math.min(100, this.socialEnergy + (tier * 1.5));
    }
    
    // Entertainment changes based on personal preferences vs tier
    if (this.type === 'authentic') {
      // Authentic people are less entertained by commercial tiers
      this.entertainment = Math.max(10, this.entertainment - (tier * 3));
    } else if (this.type === 'tourist' || this.type === 'influencer') {
      // Tourists love the spectacle of higher tiers
      this.entertainment = Math.min(100, this.entertainment + (tier * 2));
    }
  }
  
  // Get tier-responsive movement speed
  public getTierAdjustedSpeed(tier: number): number {
    const baseSpeed = this.getMovementSpeed();
    
    // Higher tiers create more frantic energy
    const tierMultiplier = 1 + (tier * 0.1); // 10% faster per tier
    
    // But authentic agents resist this pressure
    let resistanceFactor = 1;
    if (this.type === 'authentic') {
      resistanceFactor = Math.max(0.7, 1 - (tier * 0.1)); // Get slower as tier increases
    } else if (this.type === 'tourist' || this.type === 'influencer') {
      resistanceFactor = 1 + (tier * 0.05); // Get faster with tier
    }
    
    return baseSpeed * tierMultiplier * resistanceFactor;
  }
  
  // Get tier-responsive pause duration
  public getTierAdjustedPauseDuration(tier: number): number {
    const basePause = this.getPauseDuration();
    
    // Higher tiers = less contemplative time
    const tierFactor = Math.max(0.3, 1 - (tier * 0.15)); // Shorter pauses at higher tiers
    
    // Agent type resistance
    let typeFactor = 1;
    if (this.type === 'authentic') {
      typeFactor = 1 + (tier * 0.1); // Authentic people take longer pauses to resist the pace
    } else if (this.type === 'performative' || this.type === 'influencer') {
      typeFactor = Math.max(0.2, 1 - (tier * 0.2)); // Very short pauses for performative types
    }
    
    return basePause * tierFactor * typeFactor;
  }
}