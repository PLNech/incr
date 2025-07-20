/**
 * BergGameEngine - Core game engine separate from UI
 * Handles all game logic, systems coordination, and state management
 * Can run headless for testing or in conjunction with UI
 */

import { Agent, AgentType } from '../agents/Agent';
import { GridMap, TileType } from '../map/GridMap';
import { PathfindingSystem } from '../map/PathfindingSystem';
import { MemorySystem } from '../systems/MemorySystem';
import { VisitorArrivalSystem } from '../systems/VisitorArrivalSystem';
import { TimeSystem, KlubNachtTime } from '../systems/TimeSystem';
import { ReputationSystem } from '../systems/ReputationSystem';
import { NeedsSystem } from '../systems/NeedsSystem';
import { JourneySystem } from '../systems/JourneySystem';
import { SocialSystem } from '../systems/SocialSystem';
import { TransactionSystem } from '../systems/TransactionSystem';
import { QueueFormationSystem } from '../systems/QueueFormationSystem';
import { BouncerSystem, BouncerLogEntry } from '../systems/BouncerSystem';
import { FloorLayout, Floor, AreaID } from '../map/FloorLayout';
import { BergGameState } from '../../types';

export interface GameEngineConfig {
  autoStart?: boolean;
  tickRate?: number; // Game updates per second
  maxAgents?: number;
  enableLogging?: boolean;
}

export interface GameEngineEvents {
  onStateChange?: (state: BergGameState) => void;
  onAgentAdded?: (agent: Agent) => void;
  onAgentRemoved?: (agent: Agent) => void;
  onBouncerDecision?: (decision: BouncerLogEntry) => void;
  onTierChange?: (newTier: number, oldTier: number) => void;
}

export class BergGameEngine {
  // Game State
  private gameState: BergGameState;
  private isRunning: boolean = false;
  private lastUpdateTime: number = 0;
  private gameLoopId: NodeJS.Timeout | null = null;
  
  // Configuration
  private config: Required<GameEngineConfig>;
  private events: GameEngineEvents;
  
  // Systems
  private floorLayout: FloorLayout;
  private pathfinding: PathfindingSystem;
  private reputationSystem: ReputationSystem;
  private visitorArrivalSystem: VisitorArrivalSystem;
  private timeSystem: TimeSystem;
  private socialSystem: SocialSystem;
  private transactionSystem: TransactionSystem;
  private queueSystem: QueueFormationSystem;
  private bouncerSystem: BouncerSystem;
  private needsSystem: NeedsSystem | null = null;
  private journeySystem: JourneySystem | null = null;
  
  // Agent Management
  private agents: Agent[] = [];
  private memorySystemsMap: Map<string, MemorySystem> = new Map();
  private agentLastUpdate: Map<string, number> = new Map();
  
  // Performance Tracking
  private lastVisitorCheck: number = 0;
  private statsUpdateInterval: number = 1000; // 1 second
  private lastStatsUpdate: number = 0;
  
  constructor(initialState: BergGameState, config: GameEngineConfig = {}, events: GameEngineEvents = {}) {
    // Set default config
    this.config = {
      autoStart: config.autoStart ?? false,
      tickRate: config.tickRate ?? 20, // 20 FPS for game logic
      maxAgents: config.maxAgents ?? 200,
      enableLogging: config.enableLogging ?? true
    };
    
    this.events = events;
    this.gameState = { ...initialState };
    this.lastUpdateTime = performance.now();
    this.lastVisitorCheck = performance.now();
    this.lastStatsUpdate = performance.now();
    
    this.initializeSystems();
    
    if (this.config.autoStart) {
      this.start();
    }
  }
  
  private initializeSystems(): void {
    try {
      // Initialize floor layout
      this.floorLayout = new FloorLayout();
      
      // Initialize pathfinding on ground floor
      const groundFloorPlan = this.floorLayout.getFloorPlan(Floor.GROUND);
      if (!groundFloorPlan) {
        throw new Error('No ground floor plan found');
      }
      
      this.pathfinding = new PathfindingSystem(groundFloorPlan.gridMap);
      
      // Initialize all game systems
      this.reputationSystem = new ReputationSystem();
      this.bouncerSystem = new BouncerSystem(this.reputationSystem);
      this.socialSystem = new SocialSystem();
      this.transactionSystem = new TransactionSystem();
      this.visitorArrivalSystem = new VisitorArrivalSystem();
      this.timeSystem = new TimeSystem();
      
      // Initialize queue system
      const entranceArea = this.floorLayout.getArea(AreaID.ENTRANCE);
      if (entranceArea) {
        this.queueSystem = new QueueFormationSystem(
          entranceArea.bounds.x + entranceArea.bounds.width / 2,
          entranceArea.bounds.y + entranceArea.bounds.height + 2
        );
      } else {
        this.queueSystem = new QueueFormationSystem(20, 30); // Default position
      }
      
      this.log('✅ All game systems initialized successfully');
    } catch (error) {
      this.log('❌ System initialization failed:', error);
      throw error;
    }
  }
  
  public start(): void {
    if (this.isRunning) {
      this.log('⚠️ Game engine already running');
      return;
    }
    
    this.isRunning = true;
    this.lastUpdateTime = performance.now();
    
    // Start game loop
    const tickInterval = 1000 / this.config.tickRate;
    this.gameLoopId = setInterval(() => {
      this.update();
    }, tickInterval);
    
    // Add some initial visitors
    this.addInitialVisitors();
    
    this.log(`🎮 BergGameEngine started at ${this.config.tickRate} FPS`);
  }
  
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.gameLoopId) {
      clearInterval(this.gameLoopId);
      this.gameLoopId = null;
    }
    
    this.log('⏹️ BergGameEngine stopped');
  }
  
  private update(): void {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Update game revenue and time
    this.updateGameProgression(deltaTime);
    
    // Update bouncer system
    this.bouncerSystem.update(deltaTime);
    this.bouncerSystem.setTier(this.gameState.tier);
    
    // Check for new visitor arrivals
    this.updateVisitorArrivals(deltaTime);
    
    // Update agents
    this.updateAgents(deltaTime);
    
    // Update game statistics
    this.updateGameStatistics(deltaTime);
    
    // Notify UI of state changes
    if (this.events.onStateChange) {
      this.events.onStateChange({ ...this.gameState });
    }
  }
  
  private updateGameProgression(deltaTime: number): void {
    const oldTier = this.gameState.tier;
    
    // Update revenue
    this.gameState.revenue += this.gameState.revenuePerSecond * (deltaTime / 1000);
    this.gameState.timeElapsed += deltaTime / 1000;
    this.gameState.lastUpdate = performance.now();
    
    // Check tier progression
    const tierThresholds = [0, 100, 500, 2000, 8000, 20000, 50000];
    let newTier = 0;
    for (let i = tierThresholds.length - 1; i >= 0; i--) {
      if (this.gameState.revenue >= tierThresholds[i]) {
        newTier = i;
        break;
      }
    }
    
    if (newTier !== oldTier) {
      this.gameState.tier = newTier;
      this.gameState.authenticity = Math.max(0, 100 - (newTier * 20));
      this.gameState.communityHappiness = Math.max(0, 100 - (newTier * 15));
      
      // Unlock new areas
      const areasToUnlock = this.floorLayout.getAreasForTier(newTier);
      areasToUnlock.forEach(areaId => {
        this.floorLayout.unlockArea(areaId);
        this.log(`🔓 Unlocked area: ${areaId} at tier ${newTier}`);
      });
      
      if (this.events.onTierChange) {
        this.events.onTierChange(newTier, oldTier);
      }
      
      this.log(`🏆 Tier progression: ${oldTier} → ${newTier} (€${Math.floor(this.gameState.revenue)})`);
    }
  }
  
  private updateVisitorArrivals(deltaTime: number): void {
    const now = performance.now();
    
    // Check for new arrivals every 5 seconds
    if (now - this.lastVisitorCheck > 5000) {
      this.lastVisitorCheck = now;
      
      const dayOfWeek = new Date().getDay();
      const hour = new Date().getHours();
      const lineup = 10 + Math.floor(Math.random() * 11);
      
      const arrivalFactors = {
        dayOfWeek: dayOfWeek === 0 ? 6 : dayOfWeek - 1,
        hourOfNight: hour >= 22 ? hour - 22 : hour + 2,
        currentOccupancy: this.agents.length,
        maxCapacity: this.gameState.capacity,
        lineupQuality: lineup,
        tier: this.gameState.tier
      };
      
      const newArrivals = this.visitorArrivalSystem.generateArrivals(arrivalFactors, 5000);
      
      newArrivals.forEach(group => {
        for (let i = 0; i < group.size; i++) {
          this.addVisitorToQueue(group.type as AgentType);
        }
      });
      
      if (newArrivals.length > 0) {
        this.log(`🚶 ${newArrivals.reduce((sum, g) => sum + g.size, 0)} new visitors arrived`);
      }
    }
  }
  
  private updateAgents(deltaTime: number): void {
    const now = performance.now();
    
    // Update agents in batches for performance
    const batchSize = Math.ceil(this.agents.length / 4);
    const startIndex = (Math.floor(now / 50) % 4) * batchSize;
    const endIndex = Math.min(startIndex + batchSize, this.agents.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const agent = this.agents[i];
      if (!agent) continue;
      
      const lastUpdate = this.agentLastUpdate.get(agent.id) || now - deltaTime;
      const agentDelta = now - lastUpdate;
      
      // Check if agent is in queue
      const isInQueue = this.bouncerSystem.isInQueue(agent.id);
      
      if (isInQueue) {
        // Minimal updates for queue agents
        agent.update(agentDelta, this.gameState.tier);
      } else {
        // Full AI for club agents
        this.updateClubAgent(agent, agentDelta);
      }
      
      this.agentLastUpdate.set(agent.id, now);
    }
  }
  
  private updateClubAgent(agent: Agent, deltaTime: number): void {
    // Tier-based stress
    const tierStress = 1 + (this.gameState.tier * 0.1);
    agent.stamina = Math.max(0, agent.stamina - (deltaTime / 10000) * tierStress);
    agent.entertainment = Math.max(0, agent.entertainment - (deltaTime / 8000) * tierStress);
    agent.socialEnergy = Math.max(0, agent.socialEnergy - (deltaTime / 12000) * tierStress);
    
    // Gradual tier evolution
    if (Math.random() < 0.01) { // 1% chance per update
      agent.evolveForTier(this.gameState.tier);
    }
    
    // Update agent movement and AI
    agent.update(deltaTime, this.gameState.tier);
  }
  
  private updateGameStatistics(deltaTime: number): void {
    const now = performance.now();
    
    if (now - this.lastStatsUpdate > this.statsUpdateInterval) {
      // Update clubber count
      this.gameState.clubbers = this.agents
        .filter(agent => !this.bouncerSystem.isInQueue(agent.id))
        .map(agent => this.agentToClubber(agent));
      
      // Update revenue per second based on current situation
      const insideCount = this.agents.length - this.bouncerSystem.getQueueSize();
      this.gameState.revenuePerSecond = Math.max(0.1, insideCount * 0.05 * (1 + this.gameState.tier * 0.1));
      
      this.lastStatsUpdate = now;
    }
  }
  
  private addVisitorToQueue(type: AgentType): void {
    if (this.agents.length >= this.config.maxAgents) {
      return; // At capacity
    }
    
    const isGuestList = Math.random() < 0.1;
    
    // Position in queue area
    const queueX = 25 + (Math.random() - 0.5) * 4;
    const queueY = 40 + Math.random() * 4;
    
    const agent = new Agent(
      `visitor-${Date.now()}-${Math.random()}`,
      Math.max(0, Math.min(49, queueX)),
      Math.max(0, Math.min(44, queueY)),
      {
        type,
        stamina: 80 + Math.random() * 20,
        socialEnergy: 60 + Math.random() * 40,
        entertainment: 50 + Math.random() * 50
      }
    );
    
    agent.isGuestList = isGuestList;
    agent.setFloor(Floor.GROUND);
    
    // Initialize agent systems
    const memorySystem = new MemorySystem(agent);
    this.memorySystemsMap.set(agent.id, memorySystem);
    
    if (this.pathfinding) {
      agent.setPathfinder(this.pathfinding);
    }
    
    this.reputationSystem.getAgentReputation(agent.id);
    
    // Add to bouncer queue
    if (this.bouncerSystem.addToQueue(agent)) {
      this.agents.push(agent);
      
      if (this.events.onAgentAdded) {
        this.events.onAgentAdded(agent);
      }
      
      this.log(`✅ Added ${agent.getFullName()} to queue (${isGuestList ? 'guest list' : 'regular'})`);
    }
  }
  
  private addInitialVisitors(): void {
    const initialGroups = this.visitorArrivalSystem.getInitialQueue(this.gameState.tier);
    
    initialGroups.forEach(group => {
      for (let i = 0; i < group.size; i++) {
        this.addVisitorToQueue(group.type as AgentType);
      }
    });
    
    this.log(`🎯 Added ${initialGroups.reduce((sum, g) => sum + g.size, 0)} initial visitors to queue`);
  }
  
  private agentToClubber(agent: Agent): any {
    return {
      id: agent.id,
      x: agent.x,
      y: agent.y,
      targetX: agent.x,
      targetY: agent.y,
      color: agent.color,
      type: agent.type,
      currentSpace: 'dancefloor',
      journey: ['entrance', 'dancefloor', 'bar', 'toilets', 'exit'],
      journeyStep: 1,
      spentMoney: 0,
      entryFee: [5, 8, 12, 18, 25, 30][Math.min(5, this.gameState.tier)],
      timeInClub: (Date.now() - agent.entryTime) / 1000,
      stamina: agent.stamina,
      tiredness: 100 - agent.stamina,
      speed: agent.getTierAdjustedSpeed(this.gameState.tier),
      pauseTime: agent.getTierAdjustedPauseDuration(this.gameState.tier),
      lastMoved: Date.now(),
      movementPattern: agent.movementBehavior
    };
  }
  
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[BergGameEngine]', ...args);
    }
  }
  
  // Public API
  public getGameState(): BergGameState {
    return { ...this.gameState };
  }
  
  public getAgents(): Agent[] {
    return [...this.agents];
  }
  
  public getQueueSize(): number {
    return this.bouncerSystem.getQueueSize();
  }
  
  public getBouncerDecisions(): BouncerLogEntry[] {
    return this.bouncerSystem.getDecisionLog();
  }
  
  public getFloorLayout(): FloorLayout {
    return this.floorLayout;
  }
  
  public isEngineRunning(): boolean {
    return this.isRunning;
  }
  
  public getEngineStats(): any {
    return {
      isRunning: this.isRunning,
      tickRate: this.config.tickRate,
      agentCount: this.agents.length,
      queueSize: this.bouncerSystem.getQueueSize(),
      tier: this.gameState.tier,
      revenue: this.gameState.revenue,
      uptime: this.gameState.timeElapsed
    };
  }
  
  // Cleanup
  public destroy(): void {
    this.stop();
    this.agents.forEach(agent => agent.cleanup());
    this.agents = [];
    this.memorySystemsMap.clear();
    this.agentLastUpdate.clear();
    this.log('🗑️ Game engine destroyed');
  }
}