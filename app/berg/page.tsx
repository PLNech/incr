'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameStateManager } from '../../lib/gameStateManager';
import Link from 'next/link';
import { 
  BergGameState, 
  Quote, 
  Clubber, 
  JourneyStep,
  TIER_NAMES, 
  TIER_YEARS, 
  VISUAL_THEMES, 
  CROWD_COLORS,
  TIER_THRESHOLDS 
} from './types';
import { BERG_QUOTES, getRandomQuoteForTier } from './quotes';
import { BergAudioManager } from './audio';

// Agent System Imports
import { Agent, AgentType } from './core/agents/Agent';
import { GridMap, TileType } from './core/map/GridMap';
import { PathfindingSystem } from './core/map/PathfindingSystem';
import { MemorySystem } from './core/systems/MemorySystem';
import { VisitorArrivalSystem } from './core/systems/VisitorArrivalSystem';
import { TimeSystem, KlubNachtTime } from './core/systems/TimeSystem';
import { ReputationSystem } from './core/systems/ReputationSystem';
import { NeedsSystem } from './core/systems/NeedsSystem';
import { JourneySystem } from './core/systems/JourneySystem';
import { SocialSystem } from './core/systems/SocialSystem';
import { TransactionSystem } from './core/systems/TransactionSystem';
import { QueueFormationSystem } from './core/systems/QueueFormationSystem';
import { BouncerSystem, BouncerLogEntry } from './core/systems/BouncerSystem';
import { FloorLayout, Floor, AreaID } from './core/map/FloorLayout';
import { FloorRenderer } from './core/rendering/FloorRenderer';
import { CoordinateSystem, GridCoordinates } from './core/utils/CoordinateSystem';

// Initial game state
const createInitialGameState = (): BergGameState => ({
  tier: 0,
  revenue: 100, // Start with some money for first KlubNacht
  revenuePerSecond: 0, // No passive income - revenue comes from events
  capacity: 20,
  totalCustomers: 0,
  timeElapsed: 0,
  lastUpdate: Date.now(),
  gameStarted: Date.now(),
  klubNacht: {
    isActive: false,
    startTime: null,
    endTime: null,
    type: 'friday',
    totalRevenue: 0,
    entriesCount: 0,
    rejectedCount: 0,
    barSales: 0,
    costs: {
      staff: 50,
      security: 30,
      utilities: 20,
      dj: 100,
      maintenance: 15
    }
  },
  eventHistory: [],
  upgrades: {
    capacity: 0,
    marketing: 0,
    amenities: 0,
    celebrity: 0,
    manager: 0,
    bars: 0,
    spaces: 0
  },
  authenticity: 100,
  communityHappiness: 100,
  unlockedQuotes: BERG_QUOTES.filter(q => q.tier === 0),
  currentQuote: getRandomQuoteForTier(0),
  quoteChangeTimer: 0,
  currentTheme: VISUAL_THEMES[0],
  activeAudioLoops: [1],
  clubbers: [],
  queue: [],
  maxClubbers: 20,
  unlockedSpaces: [
    { id: 'entrance', name: 'Entrance', unlockTier: 0, width: 100, height: 40, maxCapacity: 10, revenueMultiplier: 0 },
    { id: 'dancefloor', name: 'Main Floor', unlockTier: 0, width: 300, height: 200, maxCapacity: 50, revenueMultiplier: 1 },
    { id: 'bar', name: 'Bar', unlockTier: 0, width: 80, height: 60, maxCapacity: 15, revenueMultiplier: 2 },
    { id: 'toilets', name: 'Toilets', unlockTier: 0, width: 60, height: 40, maxCapacity: 8, revenueMultiplier: 0 }
  ]
});

// Ensure loaded game state has all required properties
const ensureCompleteGameState = (loaded: any): BergGameState => {
  const defaults = createInitialGameState();
  
  if (!loaded) return defaults;
  
  return {
    ...defaults,
    ...loaded,
    klubNacht: {
      ...defaults.klubNacht,
      ...(loaded.klubNacht || {}),
      costs: {
        ...defaults.klubNacht.costs,
        ...(loaded.klubNacht?.costs || {})
      }
    },
    eventHistory: loaded.eventHistory || [],
    upgrades: {
      ...defaults.upgrades,
      ...(loaded.upgrades || {})
    },
    clubbers: loaded.clubbers || [],
    queue: loaded.queue || [],
    unlockedSpaces: loaded.unlockedSpaces || [
      { id: 'entrance', name: 'Entrance', unlockTier: 0, width: 100, height: 40, maxCapacity: 10, revenueMultiplier: 0 },
      { id: 'dancefloor', name: 'Main Floor', unlockTier: 0, width: 300, height: 200, maxCapacity: 50, revenueMultiplier: 1 },
      { id: 'bar', name: 'Bar', unlockTier: 0, width: 80, height: 60, maxCapacity: 15, revenueMultiplier: 2 },
      { id: 'toilets', name: 'Toilets', unlockTier: 0, width: 60, height: 40, maxCapacity: 8, revenueMultiplier: 0 }
    ],
    currentTheme: loaded.currentTheme || defaults.currentTheme,
    unlockedQuotes: loaded.unlockedQuotes || defaults.unlockedQuotes,
    currentQuote: loaded.currentQuote || defaults.currentQuote,
    activeAudioLoops: loaded.activeAudioLoops || defaults.activeAudioLoops
  };
};


export default function BergIncPage() {
  const [gameState, setGameState] = useState<BergGameState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [currentTime, setCurrentTime] = useState<KlubNachtTime | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [currentFloor, setCurrentFloor] = useState<Floor>(Floor.FIRST);
  const [showQueueLog, setShowQueueLog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioManagerRef = useRef<BergAudioManager | null>(null);
  
  // Agent System Refs
  const floorLayoutRef = useRef<FloorLayout | null>(null);
  const floorRendererRef = useRef<FloorRenderer | null>(null);
  const pathfindingRef = useRef<PathfindingSystem | null>(null);
  const agentsRef = useRef<Agent[]>([]);
  const memorySystemsRef = useRef<Map<string, MemorySystem>>(new Map());
  const reputationSystemRef = useRef<ReputationSystem | null>(null);
  const socialSystemRef = useRef<SocialSystem | null>(null);
  const transactionSystemRef = useRef<TransactionSystem | null>(null);
  const queueSystemRef = useRef<QueueFormationSystem | null>(null);
  const bouncerSystemRef = useRef<BouncerSystem | null>(null);
  const visitorArrivalSystemRef = useRef<VisitorArrivalSystem | null>(null);
  const timeSystemRef = useRef<TimeSystem | null>(null);
  const systemsInitializedRef = useRef<boolean>(false);
  const vipAgentsRef = useRef<Agent[]>([]);
  const agentLastUpdateRef = useRef<Map<string, number>>(new Map());
  const lastVisitorCheckRef = useRef<number>(Date.now());
  
  // Performance optimization refs
  const lastGameLoopRef = useRef<number>(Date.now());
  const lastRenderRef = useRef<number>(Date.now());
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasNeedsRedrawRef = useRef<boolean>(true);
  const coordinateSystemRef = useRef<CoordinateSystem | null>(null);

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new BergAudioManager();
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.stopAudio();
      }
    };
  }, []);

  // Initialize agent systems - runs when canvas becomes available
  useEffect(() => {
    if (!canvasRef.current || !gameState || systemsInitializedRef.current) {
      return;
    }
    
    try {
      systemsInitializedRef.current = true;
      
      // Create multi-floor layout
      const floorLayout = new FloorLayout();
      floorLayoutRef.current = floorLayout;
      
      // Create floor renderer
      floorRendererRef.current = new FloorRenderer(canvasRef.current, floorLayout);
      
      // Get current floor's grid map for pathfinding
      const currentFloorPlan = floorLayout.getFloorPlan(Floor.GROUND);
      if (!currentFloorPlan) {
        console.error('❌ No floor plan found for Ground floor');
        return;
      }
      
      // Initialize systems
      pathfindingRef.current = new PathfindingSystem(currentFloorPlan.gridMap);
      reputationSystemRef.current = new ReputationSystem();
      bouncerSystemRef.current = new BouncerSystem(reputationSystemRef.current);
      socialSystemRef.current = new SocialSystem();
      transactionSystemRef.current = new TransactionSystem();
      visitorArrivalSystemRef.current = new VisitorArrivalSystem();
      timeSystemRef.current = new TimeSystem();
      
      // Get entrance area for queue system
      const entranceArea = floorLayout.getArea(AreaID.ENTRANCE);
      if (entranceArea) {
        const entranceX = entranceArea.bounds.x + Math.floor(entranceArea.bounds.width / 2);
        const entranceY = entranceArea.bounds.y + Math.floor(entranceArea.bounds.height / 2);
        queueSystemRef.current = new QueueFormationSystem(
          transactionSystemRef.current,
          socialSystemRef.current,
          entranceX, entranceY
        );
      }
      
      // Create VIP regular agents - Josh and Francesca
      // Position them properly inside the main dancefloor
      const dancefloorArea = floorLayout.getArea(AreaID.BERGHAIN_DANCEFLOOR);
      if (dancefloorArea) {
        const vipData = [
          { name: 'Josh', lastName: 'Morgan', origin: 'American' },
          { name: 'Francesca', lastName: 'Dubois', origin: 'French' }
        ];
        
        vipData.forEach((vip, i) => {
          // Position VIPs in the dancefloor area with proper coordinate conversion
          const gridX = dancefloorArea.bounds.x + 5 + (i * 3); // Spread them out a bit
          const gridY = dancefloorArea.bounds.y + 5;
          const canvasX = (gridX / 50) * canvasRef.current!.width; // Convert to canvas coordinates
          const canvasY = (gridY / 45) * canvasRef.current!.height;
          
          const agent = new Agent(
            `vip-regular-${vip.name.toLowerCase()}`,
            canvasX,
            canvasY,
            {
              type: 'regular' as AgentType,
              stamina: 100,
              socialEnergy: 100,
              entertainment: 100,
              customName: {
                firstName: vip.name,
                lastName: vip.lastName,
                origin: vip.origin
              }
            }
          );
          agent.isGuestList = true;
          agent.setFloor(dancefloorArea.floor); // Set them on the correct floor (First Floor)
          
          // Set pathfinder for VIPs too
          if (pathfindingRef.current) {
            agent.setPathfinder(pathfindingRef.current);
          }
          
          vipAgentsRef.current.push(agent);
          agentsRef.current.push(agent);
        });
      }
      
      // Set up Josh and Francesca as preferred partners
      if (vipAgentsRef.current.length === 2) {
        vipAgentsRef.current[0].preferredPartner = vipAgentsRef.current[1];
        vipAgentsRef.current[1].preferredPartner = vipAgentsRef.current[0];
      }
      
    } catch (error) {
      console.error('❌ System initialization failed:', error);
      console.error('Stack trace:', error.stack);
      systemsInitializedRef.current = false; // Reset on error
    }
    
    return () => {
      // Cleanup agents
      if (agentsRef.current) {
        agentsRef.current.forEach(agent => agent.cleanup());
        agentsRef.current = [];
      }
      memorySystemsRef.current.clear();
      vipAgentsRef.current = [];
      systemsInitializedRef.current = false; // Reset for next initialization
    };
  }, [gameState]); // Run when gameState becomes available

  // Load game state on mount
  useEffect(() => {
    const gsm = GameStateManager.getInstance();
    const saved = gsm.loadGameState('berg');
    
    if (saved.progress) {
      setGameState(ensureCompleteGameState(saved.progress));
      setGameStarted(true);
    }
  }, []);

  // Update audio when tier changes
  useEffect(() => {
    if (gameState && audioManagerRef.current) {
      audioManagerRef.current.updateTier(gameState.tier);
    }
  }, [gameState?.tier]);

  // Auto-save every 10 seconds
  const saveGame = useCallback(() => {
    if (!gameState) return;
    
    const gsm = GameStateManager.getInstance();
    gsm.saveGameState('berg', {
      progress: gameState,
      resources: { revenue: gameState.revenue },
      achievements: [],
      playerName: 'Club Manager',
    });
  }, [gameState]);

  // Export save data
  const exportSave = useCallback(() => {
    const gsm = GameStateManager.getInstance();
    const data = gsm.exportAllData();
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berginc-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 Save exported successfully');
  }, []);

  // Import save data
  const importSave = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = e.target.result;
          const gsm = GameStateManager.getInstance();
          
          if (gsm.importData(data)) {
            // Reload the game state
            const saved = gsm.loadGameState('berg');
            if (saved.progress) {
              setGameState(ensureCompleteGameState(saved.progress));
              setGameStarted(true);
              console.log('📥 Save imported successfully');
              
              // Show success feedback
              const originalButtonText = 'Import';
              const importButton = document.querySelector('[data-import-button]');
              if (importButton) {
                importButton.textContent = '✅ Imported!';
                setTimeout(() => {
                  importButton.textContent = originalButtonText;
                }, 2000);
              }
            }
          } else {
            console.error('❌ Failed to import save file');
            alert('Failed to import save file. Please check the file format.');
          }
        } catch (error) {
          console.error('❌ Error importing save:', error);
          alert('Error importing save file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  useEffect(() => {
    if (gameState) {
      const interval = setInterval(saveGame, 10000);
      return () => clearInterval(interval);
    }
  }, [saveGame, gameState]);


  // Achievement checking
  const checkAchievements = useCallback(() => {
    if (!gameState) return;

    const gsm = GameStateManager.getInstance();
    
    // Underground Purist - Stay at Tier 0 for 5 minutes
    if (gameState.tier === 0 && gameState.timeElapsed > 300) {
      gsm.unlockGlobalAchievement('berg_underground_purist');
    }
    
    // Culture Destroyer - Reach Tier 5
    if (gameState.tier >= 5) {
      gsm.unlockGlobalAchievement('berg_culture_destroyer');
    }
    
    // Authenticity Keeper - Keep authenticity above 80% for 10 minutes
    if (gameState.authenticity >= 80 && gameState.timeElapsed > 600) {
      gsm.unlockGlobalAchievement('berg_authenticity_keeper');
    }
    
    // Corporate Sellout - Have all upgrades at max level
    const totalUpgrades = Object.values(gameState.upgrades).reduce((sum, level) => sum + level, 0);
    if (totalUpgrades >= 20) {
      gsm.unlockGlobalAchievement('berg_corporate_sellout');
    }
  }, [gameState]);

  // Game loop moved to separate useEffect
  useEffect(() => {
    if (!gameState) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - gameState.lastUpdate) / 1000; // seconds

      setGameState(prevState => {
        if (!prevState) return null;

        const newRevenue = prevState.revenue + (prevState.revenuePerSecond * deltaTime);
        const newTimeElapsed = prevState.timeElapsed + deltaTime;
        
        // Check for tier progression
        let newTier = prevState.tier;
        for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
          if (newRevenue >= TIER_THRESHOLDS[i]) {
            newTier = i;
            break;
          }
        }

        // Update theme if tier changed
        const newTheme = newTier !== prevState.tier ? VISUAL_THEMES[newTier] : prevState.currentTheme;
        
        // Unlock new areas if tier changed
        if (newTier !== prevState.tier && floorLayoutRef.current && floorRendererRef.current) {
          const areasToUnlock = floorLayoutRef.current.getAreasForTier(newTier);
          areasToUnlock.forEach(areaId => {
            if (floorLayoutRef.current!.unlockArea(areaId)) {
              // Trigger reveal animation for newly unlocked area
              floorRendererRef.current!.revealArea(areaId, 2000); // 2 second reveal animation
              console.log(`🔓 Unlocked area: ${areaId} at tier ${newTier}`);
            }
          });
          
          // Zoom out slightly to reveal more of the map when new areas unlock
          if (areasToUnlock.length > 0) {
            floorRendererRef.current.zoomOut(0.9);
          }
        }
        
        // Update quotes if tier changed
        let newUnlockedQuotes = prevState.unlockedQuotes;
        let newCurrentQuote = prevState.currentQuote;
        if (newTier !== prevState.tier) {
          newUnlockedQuotes = BERG_QUOTES.filter(q => q.tier <= newTier);
          newCurrentQuote = getRandomQuoteForTier(newTier);
        }
        
        // Quote rotation timer (every 20 seconds)
        let updatedQuoteTimer = prevState.quoteChangeTimer + deltaTime;
        if (updatedQuoteTimer >= 20) {
          newCurrentQuote = getRandomQuoteForTier(newTier);
          updatedQuoteTimer = 0;
        }
        
        // Update crowd colors and behavior if tier changed
        let newClubbers = prevState.clubbers;
        if (newTier !== prevState.tier) {
          newClubbers = prevState.clubbers.map(clubber => ({
            ...clubber,
            color: CROWD_COLORS[newTier][Math.floor(Math.random() * CROWD_COLORS[newTier].length)],
            movementPattern: newTier <= 1 ? 'organic' : newTier <= 3 ? 'erratic' : 'performative',
            speed: newTier <= 1 ? 0.5 : newTier <= 3 ? 1.5 : 3,
            pauseTime: newTier <= 1 ? 3000 : newTier <= 3 ? 1500 : 500
          }));
        }

        return {
          ...prevState,
          revenue: newRevenue,
          timeElapsed: newTimeElapsed,
          lastUpdate: now,
          tier: newTier,
          currentTheme: newTheme,
          unlockedQuotes: newUnlockedQuotes,
          currentQuote: newCurrentQuote,
          quoteChangeTimer: updatedQuoteTimer,
          clubbers: newClubbers,
          authenticity: Math.max(0, 100 - (newTier * 20)),
          communityHappiness: Math.max(0, 100 - (newTier * 15))
        };
      });

      // Check achievements after state update
      setTimeout(checkAchievements, 100);
    };

    const interval = setInterval(gameLoop, 100); // Update 10 times per second
    return () => clearInterval(interval);
  }, [gameState, checkAchievements]);


  // Crowd simulation
  useEffect(() => {
    if (!gameState || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const targetWidth = Math.min(1200, rect.width - 40);
        const targetHeight = Math.min(800, targetWidth * 0.6);
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Update canvas style to ensure proper display
        canvas.style.width = targetWidth + 'px';
        canvas.style.height = targetHeight + 'px';
        
        // Initialize or update coordinate system
        if (!coordinateSystemRef.current) {
          coordinateSystemRef.current = new CoordinateSystem(targetWidth, targetHeight);
        } else {
          coordinateSystemRef.current.updateCanvasDimensions(targetWidth, targetHeight);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Spawn agents if below capacity
    const spawnAgents = () => {
      if (!gameState || !floorLayoutRef.current || !pathfindingRef.current || !floorRendererRef.current || !coordinateSystemRef.current) return;
      if (agentsRef.current.length >= gameState.maxClubbers) return;

      while (agentsRef.current.length < Math.min(gameState.maxClubbers, gameState.capacity)) {
        const agentType: AgentType = gameState.tier <= 1 ? 'authentic' : 
                                   gameState.tier <= 2 ? 'regular' :
                                   gameState.tier <= 3 ? 'curious' : 
                                   gameState.tier <= 4 ? 'tourist' : 'influencer';
        
        // Get entrance area from floor layout
        const entranceArea = floorLayoutRef.current.getArea(AreaID.ENTRANCE);
        if (!entranceArea) return;
        
        // Use proper grid coordinates (0-49, 0-44)
        const gridX = entranceArea.bounds.x + Math.floor(Math.random() * entranceArea.bounds.width);
        const gridY = entranceArea.bounds.y + Math.floor(Math.random() * entranceArea.bounds.height);
        
        // Add small random variation within the grid cell
        const finalGridX = Math.max(0, Math.min(49, gridX + (Math.random() - 0.5) * 0.8));
        const finalGridY = Math.max(0, Math.min(44, gridY + (Math.random() - 0.5) * 0.8));
        
        const agent = new Agent(
          `agent-${Date.now()}-${Math.random()}`,
          finalGridX, // Use grid coordinates directly
          finalGridY,
          {
            type: agentType,
            stamina: 80 + Math.random() * 20,
            socialEnergy: 60 + Math.random() * 40,
            entertainment: 50 + Math.random() * 50
          }
        );
        
        // Set initial floor based on entrance area (Ground Floor = 0)
        agent.setFloor(entranceArea.floor);
        
        // Initialize agent systems
        const memorySystem = new MemorySystem(agent);
        memorySystemsRef.current.set(agent.id, memorySystem);
        
        // Set up agent pathfinding
        if (pathfindingRef.current) {
          agent.setPathfinder(pathfindingRef.current);
        }
        
        // Initialize agent reputation
        if (reputationSystemRef.current) {
          reputationSystemRef.current.getAgentReputation(agent.id);
        }
        
        agentsRef.current.push(agent);
      }

      // Update gameState with agent-derived clubbers for stats display
      setGameState(prevState => {
        if (!prevState) return null;
        
        const clubbers = agentsRef.current.map(agent => ({
          id: agent.id,
          x: agent.x,
          y: agent.y,
          targetX: agent.x,
          targetY: agent.y,
          color: CROWD_COLORS[prevState.tier][Math.floor(Math.random() * CROWD_COLORS[prevState.tier].length)],
          type: agent.type === 'regular' ? 'authentic' : agent.type as 'authentic' | 'curious' | 'tourist' | 'influencer' | 'corporate',
          currentSpace: 'dancefloor',
          journey: ['entrance', 'dancefloor', 'bar', 'toilets', 'exit'] as JourneyStep[],
          journeyStep: 1,
          spentMoney: 0,
          entryFee: prevState.tier < 6 ? [5, 8, 12, 18, 25, 30][prevState.tier] : 30,
          timeInClub: 0,
          stamina: agent.stamina,
          tiredness: 100 - agent.stamina,
          speed: prevState.tier <= 1 ? 0.5 : prevState.tier <= 3 ? 1.5 : 3,
          pauseTime: prevState.tier <= 1 ? 3000 : prevState.tier <= 3 ? 1500 : 500,
          lastMoved: Date.now(),
          movementPattern: prevState.tier <= 1 ? 'organic' as const : prevState.tier <= 3 ? 'erratic' as const : 'performative' as const
        }));
        
        return { ...prevState, clubbers };
      });
    };

    // PERFORMANCE OPTIMIZED: Separate game logic from rendering
    
    // Game Logic Loop - runs at 20fps for heavy computation
    const gameLogicLoop = () => {
      if (!gameState || !pathfindingRef.current || !floorRendererRef.current) return;
      
      const now = Date.now();
      const deltaTime = now - lastGameLoopRef.current;
      lastGameLoopRef.current = now;
      
      // Update bouncer system
      if (bouncerSystemRef.current) {
        const queueSizeBefore = bouncerSystemRef.current.getQueueSize();
        bouncerSystemRef.current.update(deltaTime);
        bouncerSystemRef.current.setTier(gameState.tier);
        const queueSizeAfter = bouncerSystemRef.current.getQueueSize();
        
        // Log when bouncer processes someone
        if (queueSizeBefore > queueSizeAfter) {
          console.log(`🎭 Bouncer processed someone: queue ${queueSizeBefore} -> ${queueSizeAfter}`);
          canvasNeedsRedrawRef.current = true;
        }
      }
      
      // Check for new visitor arrivals (every 5 seconds, more frequent for testing)
      if (now - lastVisitorCheckRef.current > 5000 && visitorArrivalSystemRef.current) {
        lastVisitorCheckRef.current = now;
        
        const dayOfWeek = new Date().getDay();
        const hour = new Date().getHours();
        const lineup = 10 + Math.floor(Math.random() * 11);
        
        const arrivalFactors = {
          dayOfWeek: dayOfWeek === 0 ? 6 : dayOfWeek - 1,
          hourOfNight: hour >= 22 ? hour - 22 : hour + 2,
          currentOccupancy: agentsRef.current.length,
          maxCapacity: gameState.capacity,
          lineupQuality: lineup,
          tier: gameState.tier
        };
        
        console.log('🕒 Checking for arrivals:', arrivalFactors);
        const newArrivals = visitorArrivalSystemRef.current.generateArrivals(arrivalFactors, 5000); // Pass 5 seconds in ms
        console.log('👥 Generated arrivals:', newArrivals.length);
        
        // Convert visitor groups to agents and add to bouncer queue
        if (bouncerSystemRef.current && newArrivals.length > 0) {
          let totalNewArrivals = 0;
          
          newArrivals.forEach(group => {
            for (let i = 0; i < group.size; i++) {
              const isGuestList = Math.random() < 0.1;
              
              // Position visitors outside the club in queue area (grid coordinates)
              const queueGridX = 25 + (Math.random() - 0.5) * 4; // Around queue area
              const queueGridY = 40 + Math.random() * 4; // Outside entrance
              
              const agent = new Agent(
                `visitor-${Date.now()}-${Math.random()}`,
                Math.max(0, Math.min(49, queueGridX)), // Clamp to grid bounds
                Math.max(0, Math.min(44, queueGridY)),
                {
                  type: group.type as AgentType,
                  stamina: 80 + Math.random() * 20,
                  socialEnergy: 60 + Math.random() * 40,
                  entertainment: 50 + Math.random() * 50
                }
              );
              
              agent.isGuestList = isGuestList;
              agent.setFloor(Floor.GROUND);
              
              // Initialize systems
              const memorySystem = new MemorySystem(agent);
              memorySystemsRef.current.set(agent.id, memorySystem);
              
              if (pathfindingRef.current) {
                agent.setPathfinder(pathfindingRef.current);
              }
              
              if (reputationSystemRef.current) {
                reputationSystemRef.current.getAgentReputation(agent.id);
              }
              
              if (bouncerSystemRef.current.addToQueue(agent)) {
                agentsRef.current.push(agent);
                totalNewArrivals++;
                console.log(`✅ Added ${agent.getFullName()} to queue (${isGuestList ? 'guest list' : 'regular'})`);
              } else {
                console.log(`❌ Failed to add ${agent.getFullName()} to queue`);
              }
            }
          });
          
          if (totalNewArrivals > 0) {
            console.log(`🚶 ${totalNewArrivals} new visitors joined queue (queue size: ${bouncerSystemRef.current.getQueueSize()})`);
            canvasNeedsRedrawRef.current = true;
          }
        }
        
        lastVisitorCheckRef.current = now;
      }
      
      // Batch agent updates - only update a subset each frame for performance
      const AGENTS_PER_FRAME = Math.max(1, Math.ceil(agentsRef.current.length / 4));
      const startIndex = (Math.floor(now / 50) * AGENTS_PER_FRAME) % agentsRef.current.length;
      
      for (let i = 0; i < AGENTS_PER_FRAME && i + startIndex < agentsRef.current.length; i++) {
        const agent = agentsRef.current[i + startIndex];
        
        // Check if agent is in queue - different behavior for queue vs inside club
        const isInQueue = bouncerSystemRef.current?.isInQueue(agent.id) || false;
        
        if (isInQueue) {
          // Queue agents: minimal behavior, stay in position
          agent.update(deltaTime); // Just basic movement toward queue position
        } else {
          // Club agents: full AI behavior
          // Simple needs decay
          agent.stamina = Math.max(0, agent.stamina - (deltaTime / 10000));
          agent.entertainment = Math.max(0, agent.entertainment - (deltaTime / 8000));
          agent.socialEnergy = Math.max(0, agent.socialEnergy - (deltaTime / 12000));
          
          // Agent AI update - only every 2 seconds per agent
          const lastUpdate = agentLastUpdateRef.current.get(agent.id) || 0;
          if (now - lastUpdate > 2000) {
            updateAgentAI(agent, gameState, canvas);
            agentLastUpdateRef.current.set(agent.id, now);
            canvasNeedsRedrawRef.current = true;
          }
          
          // Update agent movement (lightweight)
          agent.update(deltaTime);
        }
      }
    };
    
    // Optimized agent AI update function
    const updateAgentAI = (agent: Agent, gameState: BergGameState, canvas: HTMLCanvasElement) => {
      if (!floorLayoutRef.current) return;
      
      let targetLocation = 'dancefloor';
      
      if (agent.stamina < 30) {
        targetLocation = 'toilets';
      } else if (agent.entertainment < 40) {
        targetLocation = 'dancefloor';
      } else if (agent.socialEnergy < 50 && Math.random() < 0.6) {
        targetLocation = 'bar';
      }
      
      let targetArea: AreaID = AreaID.BERGHAIN_DANCEFLOOR;
      
      switch (targetLocation) {
        case 'bar':
          if (gameState.tier >= 2 && floorLayoutRef.current.getArea(AreaID.PANORAMA_BAR)?.isUnlocked) {
            targetArea = AreaID.PANORAMA_BAR;
          } else if (gameState.tier >= 1 && floorLayoutRef.current.getArea(AreaID.BAR_MEZZANINE)?.isUnlocked) {
            targetArea = AreaID.BAR_MEZZANINE;
          } else {
            targetArea = AreaID.BAR_MAIN;
          }
          break;
        case 'toilets':
          const agentFloor = agent.getFloor();
          if (agentFloor === Floor.SECOND && floorLayoutRef.current.getArea(AreaID.BATHROOMS_SECOND)?.isUnlocked) {
            targetArea = AreaID.BATHROOMS_SECOND;
          } else {
            targetArea = AreaID.BATHROOMS_FIRST;
          }
          break;
        case 'dancefloor':
        default:
          if (gameState.tier >= 2 && floorLayoutRef.current.getArea(AreaID.PANORAMA_DANCEFLOOR)?.isUnlocked && Math.random() < 0.4) {
            targetArea = AreaID.PANORAMA_DANCEFLOOR;
          } else {
            targetArea = AreaID.BERGHAIN_DANCEFLOOR;
          }
          break;
      }
      
      const finalArea = floorLayoutRef.current.getArea(targetArea);
      if (finalArea?.isUnlocked) {
        const agentCurrentFloor = agent.getFloor();
        const targetFloor = finalArea.floor;
        
        if (agentCurrentFloor !== targetFloor) {
          // Handle floor transitions (simplified)
          const connections = floorLayoutRef.current.getConnectionsBetweenFloors(agentCurrentFloor, targetFloor);
          if (connections.length > 0) {
            const stairArea = floorLayoutRef.current.getArea(connections[0]);
            if (stairArea?.isUnlocked) {
              const stairX = (stairArea.bounds.x / 50) * canvas.width;
              const stairY = (stairArea.bounds.y / 45) * canvas.height;
              agent.setDestination(stairX, stairY);
            }
          }
        } else {
          // Same floor movement
          const targetX = ((finalArea.bounds.x + Math.random() * finalArea.bounds.width) / 50) * canvas.width;
          const targetY = ((finalArea.bounds.y + Math.random() * finalArea.bounds.height) / 45) * canvas.height;
          agent.setDestination(targetX, targetY);
        }
      }
    };

    // Lightweight render loop - only redraws when needed
    const renderLoop = () => {
      if (!ctx || !gameState || !floorRendererRef.current) {
        animationRef.current = requestAnimationFrame(renderLoop);
        return;
      }
      
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderRef.current;
      
      // Only redraw if needed and limit to 30fps max
      if (canvasNeedsRedrawRef.current || timeSinceLastRender > 33) {
        // Clear and redraw  
        floorRendererRef.current.render(gameState.tier, currentFloor);
        
        // Draw agents (current floor + queue agents which are always visible)
        const currentFloorForRendering = currentFloor;
        const coordinateSystem = coordinateSystemRef.current;
        
        if (coordinateSystem) {
          agentsRef.current.forEach(agent => {
            // Always render queue agents (they're outside) or agents on current floor
            const isQueueAgent = bouncerSystemRef.current?.isInQueue(agent.id) || false;
            const shouldRender = isQueueAgent || agent.getFloor() === currentFloorForRendering;
            
            if (!shouldRender) return;
            
            // Convert grid coordinates to canvas coordinates
            const canvasPos = coordinateSystem.gridToCanvas({ x: agent.x, y: agent.y });
            
            let color: string;
            if (agent.isGuestList) {
              const vipColors = ['#9932cc', '#8a2be2'];
              const vipIndex = vipAgentsRef.current.indexOf(agent);
              color = vipColors[vipIndex] || '#9932cc';
            } else {
              const tierColors = CROWD_COLORS[gameState.tier];
              color = tierColors[Math.floor(Math.random() * tierColors.length)];
            }
            
            ctx.fillStyle = color;
            
            if (gameState.tier <= 1) {
              ctx.shadowColor = color;
              ctx.shadowBlur = 4;
            } else if (gameState.tier >= 4) {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 2;
            } else {
              ctx.shadowBlur = 0;
            }
            
            ctx.beginPath();
            const radius = gameState.tier <= 1 ? 3 : gameState.tier <= 3 ? 3.5 : 4;
            ctx.arc(canvasPos.x, canvasPos.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // VIP crown for guest list members
            if (agent.isGuestList) {
              ctx.fillStyle = '#FFD700';
              ctx.font = '12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('👑', canvasPos.x, canvasPos.y - 8);
            }
          });
        }
        
        // Draw bouncer (always visible - he's outside)
        if (bouncerSystemRef.current && coordinateSystem) {
          const bouncer = bouncerSystemRef.current.getBouncerPosition();
          const bouncerCanvasPos = coordinateSystem.gridToCanvas({ x: bouncer.x, y: bouncer.y });
          
          ctx.fillStyle = '#ff0000';
          ctx.shadowColor = '#ff0000';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(bouncerCanvasPos.x, bouncerCanvasPos.y, bouncer.size * 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        canvasNeedsRedrawRef.current = false;
        lastRenderRef.current = now;
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    // Start both loops
    gameLoopIntervalRef.current = setInterval(gameLogicLoop, 50); // 20fps for game logic
    renderLoop(); // 30fps max for rendering

    // Initial spawn
    spawnAgents();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameState]);

  // Apply theme to page
  useEffect(() => {
    if (!gameState) return;

    const root = document.documentElement;
    root.style.setProperty('--berg-bg', gameState.currentTheme?.backgroundColor || '#0a0a0a');
    root.style.setProperty('--berg-text', gameState.currentTheme?.textColor || '#666666');
    root.style.setProperty('--berg-accent', gameState.currentTheme?.accentColor || '#333333');
    root.style.setProperty('--berg-border', gameState.currentTheme?.borderColor || '#1a1a1a');
    root.style.setProperty('--berg-font', gameState.currentTheme?.fontFamily || 'Monaco, "Courier New", monospace');
  }, [gameState?.currentTheme]);

  // Mouse tracking for cursor glow and floor switching controls
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const root = document.documentElement;
      root.style.setProperty('--mouse-x', e.clientX + 'px');
      root.style.setProperty('--mouse-y', e.clientY + 'px');
    };
    
    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Check if mouse is over any agent
      const currentFloorForHover = currentFloor;
      const coordinateSystem = coordinateSystemRef.current;
      let foundAgent: Agent | null = null;
      
      if (coordinateSystem) {
        for (const agent of agentsRef.current) {
          // Check queue agents (always visible) or agents on current floor
          const isQueueAgent = bouncerSystemRef.current?.isInQueue(agent.id) || false;
          const shouldCheck = isQueueAgent || agent.getFloor() === currentFloorForHover;
          
          if (!shouldCheck) continue;
          
          // Convert agent grid position to canvas position
          const agentCanvasPos = coordinateSystem.gridToCanvas({ x: agent.x, y: agent.y });
          
          const agentRadius = 8; // Agent visual radius
          const distance = Math.sqrt(
            Math.pow(mouseX - agentCanvasPos.x, 2) + Math.pow(mouseY - agentCanvasPos.y, 2)
          );
          
          if (distance <= agentRadius) {
            foundAgent = agent;
            break;
          }
        }
      }
      
      setHoveredAgent(foundAgent);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!floorRendererRef.current || !floorLayoutRef.current) return;
      
      switch (e.key) {
        case '1':
          // Check if Ground floor is unlocked
          const groundArea = floorLayoutRef.current.getArea(AreaID.ENTRANCE);
          if (groundArea?.isUnlocked) {
            floorRendererRef.current.switchFloor(Floor.GROUND);
            setCurrentFloor(Floor.GROUND);
            canvasNeedsRedrawRef.current = true;
          }
          break;
        case '2':
          // Check if First floor is unlocked
          const firstArea = floorLayoutRef.current.getArea(AreaID.BERGHAIN_DANCEFLOOR);
          if (firstArea?.isUnlocked) {
            floorRendererRef.current.switchFloor(Floor.FIRST);
            setCurrentFloor(Floor.FIRST);
            canvasNeedsRedrawRef.current = true;
          }
          break;
        case '3':
          // Check if Second floor is unlocked
          const secondArea = floorLayoutRef.current.getArea(AreaID.PANORAMA_DANCEFLOOR);
          if (secondArea?.isUnlocked) {
            floorRendererRef.current.switchFloor(Floor.SECOND);
            setCurrentFloor(Floor.SECOND);
            canvasNeedsRedrawRef.current = true;
          }
          break;
        case '+':
        case '=':
          floorRendererRef.current.zoomIn(currentFloor === Floor.GROUND ? 1.2 : 1.1);
          canvasNeedsRedrawRef.current = true;
          break;
        case '-':
          floorRendererRef.current.zoomOut(0.8);
          canvasNeedsRedrawRef.current = true;
          break;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);
    
    // Add canvas-specific mouse event
    if (canvasRef.current) {
      canvasRef.current.addEventListener('mousemove', handleCanvasMouseMove);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleCanvasMouseMove);
      }
    };
  }, []);

  // Audio control
  const toggleAudio = () => {
    if (audioManagerRef.current) {
      const playing = audioManagerRef.current.togglePlayback();
      setAudioEnabled(playing);
    }
  };

  // Start new game
  const startNewGame = () => {
    console.log('Starting new game...');
    const newGameState = createInitialGameState();
    console.log('New game state:', newGameState);
    
    // Initialize queue with some initial visitors
    if (visitorArrivalSystemRef.current && bouncerSystemRef.current) {
      console.log('🎬 Adding initial visitors to queue...');
      const initialGroups = visitorArrivalSystemRef.current.getInitialQueue(0);
      console.log('👥 Initial groups:', initialGroups.length);
      
      // Add initial visitors directly to bouncer queue
      initialGroups.forEach(group => {
        for (let i = 0; i < group.size; i++) {
          const isGuestList = Math.random() < 0.05; // Lower chance for initial visitors
          
          // Position initial visitors in queue area (grid coordinates)
          const queueGridX = 25 + (Math.random() - 0.5) * 4; // Around queue area
          const queueGridY = 40 + Math.random() * 4; // Outside entrance
          
          const agent = new Agent(
            `initial-${Date.now()}-${Math.random()}`,
            Math.max(0, Math.min(49, queueGridX)), // Clamp to grid bounds
            Math.max(0, Math.min(44, queueGridY)),
            {
              type: group.type as AgentType,
              stamina: 80 + Math.random() * 20,
              socialEnergy: 60 + Math.random() * 40,
              entertainment: 50 + Math.random() * 50
            }
          );
          
          agent.isGuestList = isGuestList;
          agent.setFloor(Floor.GROUND);
          
          // Initialize systems
          const memorySystem = new MemorySystem(agent);
          memorySystemsRef.current.set(agent.id, memorySystem);
          
          if (pathfindingRef.current) {
            agent.setPathfinder(pathfindingRef.current);
          }
          
          if (reputationSystemRef.current) {
            reputationSystemRef.current.getAgentReputation(agent.id);
          }
          
          if (bouncerSystemRef.current!.addToQueue(agent)) {
            agentsRef.current.push(agent);
            console.log(`🚶 Added initial visitor ${agent.getFullName()} to queue`);
          }
        }
      });
      
      console.log(`🎯 Initial queue size: ${bouncerSystemRef.current.getQueueSize()}`);
      
      const initialQueue: Clubber[] = [];
      
      initialGroups.forEach(group => {
        for (let i = 0; i < group.size; i++) {
          initialQueue.push({
            id: `initial-${Date.now()}-${Math.random()}`,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            color: CROWD_COLORS[0][0],
            type: group.type as any,
            currentSpace: 'queue',
            journey: ['queue', 'entrance', 'dancefloor', 'bar', 'toilets', 'exit'] as JourneyStep[],
            journeyStep: 0,
            spentMoney: 0,
            entryFee: 10,
            timeInClub: 0,
            stamina: 100,
            tiredness: 0,
            speed: 1,
            pauseTime: 2000,
            lastMoved: Date.now(),
            movementPattern: 'organic' as const
          });
        }
      });
      
      newGameState.queue = initialQueue;
      console.log(`🚶 Initialized queue with ${initialQueue.length} clubbers`);
    }
    
    setGameState(newGameState);
    setGameStarted(true);
  };

  // Debug tools for development
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).bergDebug = {
        fastForward: (targetTier: number) => {
          if (!gameState) return;
          const revenue = TIER_THRESHOLDS[targetTier] || 0;
          setGameState(prev => prev ? { ...prev, revenue } : null);
          console.log(`🚀 Fast forwarded to tier ${targetTier} with €${revenue}`);
        },
        
        getGameState: () => {
          console.log('📊 Current Game State:', {
            tier: gameState?.tier,
            revenue: gameState?.revenue,
            capacity: gameState?.capacity,
            agents: agentsRef.current.length,
            queue: gameState?.queue?.length || 0,
            totalCustomers: gameState?.totalCustomers
          });
          return gameState;
        },
        
        testAudio: () => {
          if (audioManagerRef.current) {
            audioManagerRef.current.togglePlayback();
            console.log('🔊 Audio toggled');
          }
        },
        
        spawnAgents: (count: number) => {
          if (!gameState || !canvasRef.current) return;
          const canvas = canvasRef.current;
          
          for (let i = 0; i < count; i++) {
            const agentType: AgentType = gameState.tier <= 1 ? 'authentic' : 
                                       gameState.tier <= 2 ? 'regular' :
                                       gameState.tier <= 3 ? 'curious' : 
                                       gameState.tier <= 4 ? 'tourist' : 'influencer';
            
            const agent = new Agent(
              `debug-agent-${Date.now()}-${i}`,
              Math.random() * canvas.width,
              Math.random() * canvas.height,
              {
                type: agentType,
                stamina: 80 + Math.random() * 20,
                socialEnergy: 60 + Math.random() * 40,
                entertainment: 50 + Math.random() * 50
              }
            );
            
            // Initialize agent systems
            const memorySystem = new MemorySystem(agent);
            memorySystemsRef.current.set(agent.id, memorySystem);
            
            if (reputationSystemRef.current) {
              reputationSystemRef.current.getAgentReputation(agent.id);
            }
            
            agentsRef.current.push(agent);
          }
          
          console.log(`🕺 Spawned ${count} intelligent agents`);
        },
        
        getAgentStats: () => {
          const stats = agentsRef.current.map(agent => ({
            id: agent.id,
            type: agent.type,
            floor: agent.getFloor(),
            position: { x: Math.floor(agent.x), y: Math.floor(agent.y) },
            needs: {
              stamina: Math.floor(agent.stamina),
              social: Math.floor(agent.socialEnergy),
              entertainment: Math.floor(agent.entertainment)
            }
          }));
          console.table(stats);
          return stats;
        },
        
        getFloorStats: () => {
          const floorCounts = [0, 1, 2].map(floor => ({
            floor: ['Ground', 'Berghain', 'Panorama'][floor],
            agents: agentsRef.current.filter(a => a.getFloor() === floor).length
          }));
          console.table(floorCounts);
          return floorCounts;
        },
        
        // Rendering debug tools
        debugRendering: () => {
          console.log('🎨 Rendering Debug:', {
            canvas: !!canvasRef.current,
            context: !!canvasRef.current?.getContext('2d'),
            floorRenderer: !!floorRendererRef.current,
            floorLayout: !!floorLayoutRef.current,
            currentFloor: floorRendererRef.current?.getCurrentFloor(),
            animationRunning: !!animationRef.current
          });
          
          if (floorLayoutRef.current) {
            const floors = [0, 1, 2].map(f => {
              const plan = floorLayoutRef.current!.getFloorPlan(f);
              const unlockedAreas = plan?.areas?.filter(a => a.isUnlocked) || [];
              return {
                floor: f,
                plan: !!plan,
                areas: plan?.areas?.length || 0,
                unlockedAreas: unlockedAreas.length,
                unlockedList: unlockedAreas.map(a => a.id),
                gridSize: plan ? `${plan.width}x${plan.height}` : 'none'
              };
            });
            console.log('🏢 Floor Plans:', floors);
          }
          
          if (floorRendererRef.current && canvasRef.current) {
            console.log('🎨 FloorRenderer test render...');
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              // Clear canvas first
              ctx.fillStyle = '#ff0000';
              ctx.fillRect(0, 0, 100, 100);
              console.log('🔴 Drew red test square');
            }
            floorRendererRef.current.render(gameState?.tier || 0);
          }
        },
        
        toggleGrid: () => {
          if (floorRendererRef.current) {
            floorRendererRef.current.setRenderOptions({ showGrid: true });
            console.log('🔲 Grid visibility enabled');
          }
        },
        
        switchFloor: (floor: number) => {
          if (floorRendererRef.current && floor >= 0 && floor <= 2) {
            floorRendererRef.current.switchFloor(floor);
            console.log(`🏢 Switched to floor ${floor}`);
          }
        },
        
        addRegulars: () => {
          if (!gameState || !canvasRef.current) return;
          
          // Add VIP regular pair
          const vipTypes = ['regular', 'regular'] as AgentType[];
          const colors = ['#9932cc', '#8a2be2']; // Two shades of purple
          
          vipTypes.forEach((type, i) => {
            const agent = new Agent(
              `vip-regular-${i}`,
              50 + i * 20, // Fixed positions near entrance
              50,
              {
                type,
                stamina: 100,
                socialEnergy: 100,
                entertainment: 100
              }
            );
            agent.isGuestList = true;
            agentsRef.current.push(agent);
          });
          
          console.log('👑 Added 2 guest list regulars (purple shades)');
        },
        
        renderFallback: () => {
          if (!canvasRef.current) return;
          
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          
          // Clear canvas
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw fallback layout
          ctx.strokeStyle = '#333333';
          ctx.fillStyle = '#1a1a1a';
          ctx.lineWidth = 2;
          
          // Draw rooms
          const rooms = [
            { x: 50, y: 50, w: 100, h: 80, label: 'Entrance' },
            { x: 200, y: 50, w: 150, h: 120, label: 'Berghain' },
            { x: 400, y: 50, w: 100, h: 80, label: 'Bar' },
            { x: 200, y: 200, w: 200, h: 100, label: 'Panorama' }
          ];
          
          rooms.forEach(room => {
            ctx.fillRect(room.x, room.y, room.w, room.h);
            ctx.strokeRect(room.x, room.y, room.w, room.h);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(room.label, room.x + 10, room.y + 20);
            ctx.fillStyle = '#1a1a1a';
          });
          
          console.log('🎨 Fallback layout rendered');
        },
        
        getTimeInfo: () => {
          if (timeSystemRef.current) {
            const time = timeSystemRef.current.getCurrentTime();
            const timeString = timeSystemRef.current.getTimeString();
            console.log('⏰ Time System:', { time, timeString });
            return { time, timeString };
          }
        },
        
        revenue: {
          add: (amount: number) => {
            setGameState(prev => prev ? { ...prev, revenue: prev.revenue + amount } : null);
            console.log(`💰 Added €${amount} revenue`);
          },
          set: (amount: number) => {
            setGameState(prev => prev ? { ...prev, revenue: amount } : null);
            console.log(`💰 Set revenue to €${amount}`);
          }
        },
        
        testCanvas: () => {
          if (!canvasRef.current) {
            console.log('❌ No canvas found');
            return;
          }
          
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) {
            console.log('❌ No context found');
            return;
          }
          
          // Clear and draw test pattern
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw grid
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvasRef.current.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasRef.current.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvasRef.current.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasRef.current.width, y);
            ctx.stroke();
          }
          
          // Draw test shapes
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(50, 50, 100, 100);
          
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(200, 50, 100, 100);
          
          ctx.fillStyle = '#0000ff';
          ctx.fillRect(350, 50, 100, 100);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px monospace';
          ctx.fillText('CANVAS TEST', 50, 200);
          
          console.log('✅ Canvas test pattern drawn');
        }
      };
      
      console.log('🛠️ BergInc debug tools loaded. Try:');
      console.log('  window.bergDebug.debugRendering()  // Debug rendering issues');
      console.log('  window.bergDebug.testCanvas()      // Test canvas drawing');
      console.log('  window.bergDebug.renderFallback()  // Draw fallback layout');
      console.log('  window.bergDebug.switchFloor(1)    // Switch to floor 1');
      console.log('  window.bergDebug.fastForward(3)    // Fast forward to tier 3');
    }
  }, [gameState]);

  // Upgrade functions
  const upgradeCapacity = () => {
    if (!gameState) return;
    const cost = Math.floor(100 * Math.pow(1.15, gameState.upgrades.capacity));
    if (gameState.revenue >= cost) {
      setGameState(prev => ({
        ...prev!,
        revenue: prev!.revenue - cost,
        capacity: prev!.capacity + 10,
        maxClubbers: prev!.maxClubbers + 5,
        upgrades: { ...prev!.upgrades, capacity: prev!.upgrades.capacity + 1 },
        authenticity: Math.max(0, prev!.authenticity - 5)
      }));
    }
  };

  const upgradeMarketing = () => {
    if (!gameState) return;
    const cost = Math.floor(250 * Math.pow(1.2, gameState.upgrades.marketing));
    if (gameState.revenue >= cost) {
      setGameState(prev => ({
        ...prev!,
        revenue: prev!.revenue - cost,
        revenuePerSecond: prev!.revenuePerSecond * 1.5,
        upgrades: { ...prev!.upgrades, marketing: prev!.upgrades.marketing + 1 },
        authenticity: Math.max(0, prev!.authenticity - 10)
      }));
    }
  };

  const upgradeAmenities = () => {
    if (!gameState) return;
    const cost = Math.floor(500 * Math.pow(1.25, gameState.upgrades.amenities));
    if (gameState.revenue >= cost) {
      setGameState(prev => ({
        ...prev!,
        revenue: prev!.revenue - cost,
        revenuePerSecond: prev!.revenuePerSecond * 1.3,
        upgrades: { ...prev!.upgrades, amenities: prev!.upgrades.amenities + 1 },
        authenticity: Math.max(0, prev!.authenticity - 15),
        communityHappiness: Math.max(0, prev!.communityHappiness - 10)
      }));
    }
  };

  const upgradeCelebrity = () => {
    if (!gameState) return;
    const cost = Math.floor(2000 * Math.pow(1.5, gameState.upgrades.celebrity));
    if (gameState.revenue >= cost && gameState.tier >= 2) {
      setGameState(prev => ({
        ...prev!,
        revenue: prev!.revenue - cost,
        revenuePerSecond: prev!.revenuePerSecond * 3,
        upgrades: { ...prev!.upgrades, celebrity: prev!.upgrades.celebrity + 1 },
        authenticity: Math.max(0, prev!.authenticity - 25),
        communityHappiness: Math.max(0, prev!.communityHappiness - 20)
      }));
    }
  };

  // Game setup screen
  if (!gameStarted || !gameState) {
    return (
      <div className="min-h-screen bg-black text-gray-300 p-6" style={{ fontFamily: 'Monaco, "Courier New", monospace' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to la incr factory
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-wider">BergInc</h1>
              <p className="text-sm text-gray-500 mt-1">The Berghain Incremental</p>
            </div>
            <div></div>
          </div>

          <div className="border border-gray-800 bg-gray-900 p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">Welcome to Berlin, 1995</h2>
            <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto">
              The Wall has fallen. The city is full of empty spaces and endless possibilities. 
              You've found an abandoned building in Friedrichshain - a former GDR factory 
              that could become something special.
            </p>
            <p className="text-gray-400 leading-relaxed max-w-2xl mx-auto">
              You have a vision: to create a sanctuary for Berlin's underground techno community. 
              A place where people can be free, where music matters more than money, 
              where the dancefloor becomes a space of liberation.
            </p>
            <p className="text-sm text-yellow-400 italic">
              Every choice you make will shape not just your club, but the culture around it...
            </p>
            
            <button
              onClick={startNewGame}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-8 py-3 text-lg transition-colors"
            >
              Open Your Club
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get the dynamic title based on tier
  const getTitle = () => {
    if (gameState.tier <= 2) {
      return "BergInc"; // Feels like "Berg Incremental"
    } else {
      return "Berg Inc."; // Feels like "Berg Incorporated"
    }
  };

  // Main game interface
  return (
    <div 
      className="min-h-screen p-4 transition-all duration-1000"
      style={{ 
        backgroundColor: `var(--berg-bg, ${gameState.currentTheme?.backgroundColor || '#0a0a0a'})`,
        color: `var(--berg-text, ${gameState.currentTheme?.textColor || '#666666'})`,
        fontFamily: `var(--berg-font, ${gameState.currentTheme?.fontFamily || 'Monaco, "Courier New", monospace'})`,
        position: 'relative'
      }}
    >
      {/* Cursor glow effect */}
      <div 
        className="fixed pointer-events-none z-50 transition-opacity duration-300"
        style={{
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.05) 60%, transparent 80%)`,
          borderRadius: '50%',
          filter: 'blur(12px)',
          transform: 'translate(-50%, -50%)',
          left: 'var(--mouse-x, 50%)',
          top: 'var(--mouse-y, 50%)'
        }}
      />
      
      <style jsx global>{`
        /* Keep normal cursor behavior */
      `}</style>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: `var(--berg-text, ${gameState.currentTheme?.textColor})` }}
          >
            ← Back to la incr factory
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-wider">{getTitle()}</h1>
            <p className="text-sm opacity-60">
              Tier {gameState.tier}: {TIER_NAMES[gameState.tier]} ({TIER_YEARS[gameState.tier]})
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={toggleAudio} 
              className="opacity-60 hover:opacity-100 transition-opacity text-sm"
              title="Toggle audio"
            >
              {audioEnabled ? '🔊' : '🔇'}
            </button>
            <button onClick={saveGame} className="opacity-60 hover:opacity-100 transition-opacity">
              Save
            </button>
            <button onClick={exportSave} className="opacity-60 hover:opacity-100 transition-opacity text-sm" title="Export save file">
              💾 Export
            </button>
            <button onClick={importSave} className="opacity-60 hover:opacity-100 transition-opacity text-sm" data-import-button title="Import save file">
              📥 Import
            </button>
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">€{Math.floor(gameState.revenue)}</div>
            <div className="text-sm opacity-60">Revenue</div>
          </div>
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">€{gameState.revenuePerSecond.toFixed(1)}/s</div>
            <div className="text-sm opacity-60">Per Second</div>
          </div>
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">{gameState.clubbers.length}/{gameState.capacity}</div>
            <div className="text-sm opacity-60">Capacity</div>
          </div>
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">{Math.floor(gameState.authenticity)}%</div>
            <div className="text-sm opacity-60">Authenticity</div>
          </div>
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">{Math.floor(gameState.communityHappiness)}%</div>
            <div className="text-sm opacity-60">Community</div>
          </div>
          <div 
            className="p-4 border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
            }}
          >
            <div className="text-lg font-bold">
              {timeSystemRef.current ? timeSystemRef.current.getTimeString() : 'Loading...'}
            </div>
            <div className="text-sm opacity-60">Klubnacht Time</div>
          </div>
        </div>

        {/* Management Controls */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowQueueLog(!showQueueLog)}
            className="px-4 py-2 border rounded transition-colors"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: showQueueLog ? `var(--berg-accent, ${gameState.currentTheme?.accentColor})` : 'transparent'
            }}
          >
            {showQueueLog ? 'Close Queue Log' : 'Open Queue Log'}
          </button>
          <button
            onClick={() => setShowManagement(!showManagement)}
            className="px-4 py-2 border rounded transition-colors"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: showManagement ? `var(--berg-accent, ${gameState.currentTheme?.accentColor})` : 'transparent'
            }}
          >
            {showManagement ? 'Close Management' : 'Open Management'}
          </button>
        </div>

        {/* Full-Width Club Layout */}
        <div 
          className="border rounded p-4 mb-6"
          style={{ borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})` }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold">Berghain</h3>
              <div className="flex gap-2 text-sm">
                {[
                  { id: 0, name: 'Ground', areaId: AreaID.ENTRANCE },
                  { id: 1, name: 'Berghain', areaId: AreaID.BERGHAIN_DANCEFLOOR },
                  { id: 2, name: 'Panorama', areaId: AreaID.PANORAMA_DANCEFLOOR }
                ].map(floor => {
                  const isUnlocked = floorLayoutRef.current?.getArea(floor.areaId)?.isUnlocked || false;
                  const isActive = currentFloor === floor.id;
                  
                  return (
                    <button
                      key={floor.id}
                      disabled={!isUnlocked}
                      className={`px-3 py-1 border rounded transition-colors ${
                        isActive 
                          ? 'bg-white text-black' 
                          : isUnlocked 
                          ? 'border-gray-600 hover:border-gray-400' 
                          : 'border-gray-800 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (floorRendererRef.current && isUnlocked) {
                          floorRendererRef.current.switchFloor(floor.id);
                          setCurrentFloor(floor.id);
                          canvasNeedsRedrawRef.current = true;
                        }
                      }}
                    >
                      [{floor.id}] {floor.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-6 text-sm opacity-60">
              <span>Press 1-3 for floors, +/- to zoom</span>
              <span>Queue: {gameState.queue.length} | 
                0: Ground ({agentsRef.current.filter(a => a.getFloor() === 0).length}) | 
                1: Berghain ({agentsRef.current.filter(a => a.getFloor() === 1).length}) | 
                2: Panorama ({agentsRef.current.filter(a => a.getFloor() === 2).length})
              </span>
            </div>
          </div>
          
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full border rounded"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-bg, ${gameState.currentTheme?.backgroundColor})`,
              height: '60vh',
              minHeight: '400px'
            }}
          />
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-4 text-sm opacity-60">
              <span>0: Queue ({gameState.queue.length})</span>
              <span>1: Ground ({agentsRef.current.filter(a => a.getFloor() === 0).length})</span>
              <span>2: Berghain ({agentsRef.current.filter(a => a.getFloor() === 1).length})</span>
              <span>3: Panorama ({agentsRef.current.filter(a => a.getFloor() === 2).length})</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="opacity-60">Total Inside: {agentsRef.current.length}</span>
              <span className="text-green-400">€{gameState.revenuePerSecond.toFixed(1)}/s</span>
            </div>
          </div>
          
          <p className="text-center text-sm opacity-60 mt-2">
            {gameState.tier <= 1 
              ? "Collective trance movement in the underground sanctuary..." 
              : gameState.tier <= 3 
              ? "Erratic individual dancing as curiosity brings new faces..."
              : "Performative selfie-taking as the space becomes commercialized..."
            }
          </p>
        </div>

        {/* Management Modal */}
        {showManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="bg-black border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              style={{ 
                borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
                backgroundColor: `var(--berg-bg, ${gameState.currentTheme?.backgroundColor})`
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Club Management</h3>
                <button
                  onClick={() => setShowManagement(false)}
                  className="text-xl opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Expand Capacity</span>
                  <span>€{Math.floor(100 * Math.pow(1.15, gameState.upgrades.capacity))}</span>
                </div>
                <button
                  onClick={upgradeCapacity}
                  disabled={gameState.revenue < Math.floor(100 * Math.pow(1.15, gameState.upgrades.capacity))}
                  className="w-full p-2 border rounded disabled:opacity-50 hover:bg-opacity-20 transition-colors"
                  style={{ 
                    borderColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})`,
                    backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
                  }}
                >
                  Upgrade (Level {gameState.upgrades.capacity})
                </button>
                <p className="text-xs opacity-60 mt-1">⚠️ More people means... different vibes</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Marketing Campaign</span>
                  <span>€{Math.floor(250 * Math.pow(1.2, gameState.upgrades.marketing))}</span>
                </div>
                <button
                  onClick={upgradeMarketing}
                  disabled={gameState.revenue < Math.floor(250 * Math.pow(1.2, gameState.upgrades.marketing))}
                  className="w-full p-2 border rounded disabled:opacity-50 hover:bg-opacity-20 transition-colors"
                  style={{ 
                    borderColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})`,
                    backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
                  }}
                >
                  Upgrade (Level {gameState.upgrades.marketing})
                </button>
                <p className="text-xs opacity-60 mt-1">⚠️ Broader audience, different crowd</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>VIP Amenities</span>
                  <span>€{Math.floor(500 * Math.pow(1.25, gameState.upgrades.amenities))}</span>
                </div>
                <button
                  onClick={upgradeAmenities}
                  disabled={gameState.revenue < Math.floor(500 * Math.pow(1.25, gameState.upgrades.amenities))}
                  className="w-full p-2 border rounded disabled:opacity-50 hover:bg-opacity-20 transition-colors"
                  style={{ 
                    borderColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})`,
                    backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
                  }}
                >
                  Upgrade (Level {gameState.upgrades.amenities})
                </button>
                <p className="text-xs opacity-60 mt-1">⚠️ Comfort zones change the energy</p>
              </div>

              {gameState.tier >= 2 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Celebrity Bookings</span>
                    <span>€{Math.floor(2000 * Math.pow(1.5, gameState.upgrades.celebrity))}</span>
                  </div>
                  <button
                    onClick={upgradeCelebrity}
                    disabled={gameState.revenue < Math.floor(2000 * Math.pow(1.5, gameState.upgrades.celebrity))}
                    className="w-full p-2 border rounded disabled:opacity-50 hover:bg-opacity-20 transition-colors"
                    style={{ 
                      borderColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})`,
                      backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})20`
                    }}
                  >
                    Upgrade (Level {gameState.upgrades.celebrity})
                  </button>
                  <p className="text-xs opacity-60 mt-1">⚠️ Fame attracts the wrong crowd</p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Queue Log Modal */}
        {showQueueLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="bg-black border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              style={{ 
                borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
                backgroundColor: `var(--berg-bg, ${gameState.currentTheme?.backgroundColor})`
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Bouncer Decision Log</h3>
                <button
                  onClick={() => setShowQueueLog(false)}
                  className="text-xl opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 border rounded" style={{ borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})` }}>
                  {(() => {
                    const log = bouncerSystemRef.current?.getDecisionLog() || [];
                    const accepted = log.filter(entry => entry.decision === 'accept').length;
                    const rejected = log.filter(entry => entry.decision === 'reject').length;
                    const acceptanceRate = log.length > 0 ? ((accepted / log.length) * 100).toFixed(1) : '0';
                    
                    return (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-400">{accepted}</div>
                          <div className="text-sm opacity-60">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{rejected}</div>
                          <div className="text-sm opacity-60">Rejected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{acceptanceRate}%</div>
                          <div className="text-sm opacity-60">Acceptance Rate</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Decision Log */}
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    const log = bouncerSystemRef.current?.getDecisionLog() || [];
                    
                    if (log.length === 0) {
                      return (
                        <div className="text-center py-8 opacity-60">
                          No bouncer decisions yet. Wait for people to join the queue!
                        </div>
                      );
                    }
                    
                    return log.map((entry: BouncerLogEntry) => (
                      <div 
                        key={entry.id}
                        className={`p-3 border rounded mb-2 ${entry.decision === 'accept' ? 'border-green-800 bg-green-900 bg-opacity-20' : 'border-red-800 bg-red-900 bg-opacity-20'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${entry.decision === 'accept' ? 'text-green-400' : 'text-red-400'}`}>
                                {entry.decision === 'accept' ? '✅' : '❌'} {entry.agentName}
                              </span>
                              <span className="text-xs opacity-60 px-2 py-1 rounded" style={{ backgroundColor: 'var(--berg-accent, #333)' }}>
                                {entry.agentType}
                              </span>
                              {entry.isGuestList && (
                                <span className="text-xs text-purple-400 px-2 py-1 rounded bg-purple-900 bg-opacity-30">
                                  👑 Guest List
                                </span>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="opacity-80">Reason: </span>
                              <span className={entry.decision === 'accept' ? 'text-green-300' : 'text-red-300'}>
                                {entry.reason}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs opacity-60">
                              <span>Wait: {Math.floor(entry.waitTime / 1000)}s</span>
                              <span>Budget: €{Math.floor(entry.budget)}</span>
                              <span>Time: {new Date(entry.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Clear Log Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (bouncerSystemRef.current) {
                        bouncerSystemRef.current.clearDecisionLog();
                      }
                    }}
                    className="px-4 py-2 border rounded opacity-60 hover:opacity-100 transition-colors"
                    style={{ borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})` }}
                  >
                    Clear Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Quote */}
        {gameState.currentQuote && (
          <div 
            className="border rounded p-6 italic text-center transition-all duration-500"
            style={{ 
              borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
              backgroundColor: `var(--berg-accent, ${gameState.currentTheme?.accentColor})10`
            }}
          >
            <div className="flex items-center justify-start mb-2 text-xs opacity-60">
              <span className={`px-2 py-1 rounded mr-2 ${
                gameState.currentQuote.mood === 'grateful' || gameState.currentQuote.mood === 'excited' || gameState.currentQuote.mood === 'hopeful' ? 'bg-green-900 text-green-300' :
                gameState.currentQuote.mood === 'concerned' || gameState.currentQuote.mood === 'frustrated' || gameState.currentQuote.mood === 'analytical' ? 'bg-yellow-900 text-yellow-300' :
                gameState.currentQuote.mood === 'defeated' || gameState.currentQuote.mood === 'resigned' || gameState.currentQuote.mood === 'bitter' ? 'bg-red-900 text-red-300' :
                'bg-gray-800 text-gray-400'
              }`}>
                {gameState.currentQuote.type}
              </span>
              <span>({gameState.currentQuote.mood})</span>
            </div>
            <p className="mb-3 text-lg leading-relaxed">
              "{gameState.currentQuote.text}"
            </p>
            <p className="text-sm opacity-60">
              — {gameState.currentQuote.source}
            </p>
          </div>
        )}
        
        {/* Agent Tooltip */}
        {hoveredAgent && mousePos && (
          <div 
            className="fixed z-50 bg-black border border-gray-600 rounded p-3 text-sm pointer-events-none shadow-lg"
            style={{
              left: mousePos.x + 15,
              top: mousePos.y - 10,
              whiteSpace: 'pre-line',
              fontFamily: 'Monaco, "Courier New", monospace'
            }}
          >
            {hoveredAgent.getTooltipInfo()}
          </div>
        )}
      </div>
    </div>
  );
}