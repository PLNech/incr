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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioManagerRef = useRef<BergAudioManager | null>(null);

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new BergAudioManager();
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.stopAudio();
      }
    };
  }, []);

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
        canvas.width = Math.min(400, rect.width - 20);
        canvas.height = Math.min(300, (canvas.width * 3) / 4);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Spawn clubbers if below capacity
    const spawnClubbers = () => {
      setGameState(prevState => {
        if (!prevState || prevState.clubbers.length >= prevState.maxClubbers) return prevState;

        const newClubbers = [...prevState.clubbers];
        while (newClubbers.length < Math.min(prevState.maxClubbers, prevState.capacity)) {
          const tierColors = CROWD_COLORS[prevState.tier];
          newClubbers.push({
            id: `clubber-${Date.now()}-${Math.random()}`,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            targetX: Math.random() * canvas.width,
            targetY: Math.random() * canvas.height,
            color: tierColors[Math.floor(Math.random() * tierColors.length)],
            type: prevState.tier <= 1 ? 'authentic' : prevState.tier <= 3 ? 'curious' : 'tourist',
            currentSpace: 'dancefloor',
            journey: ['entrance', 'dancefloor', 'bar', 'toilets', 'exit'] as JourneyStep[],
            journeyStep: 1, // Start at dancefloor
            spentMoney: 0,
            entryFee: prevState.tier < 6 ? [5, 8, 12, 18, 25, 30][prevState.tier] : 30,
            timeInClub: 0,
            stamina: Math.random() * 50 + 50, // Start with 50-100% stamina
            tiredness: 0,
            speed: prevState.tier <= 1 ? 0.5 : prevState.tier <= 3 ? 1.5 : 3,
            pauseTime: prevState.tier <= 1 ? 3000 : prevState.tier <= 3 ? 1500 : 500,
            lastMoved: Date.now(),
            movementPattern: prevState.tier <= 1 ? 'organic' : prevState.tier <= 3 ? 'erratic' : 'performative'
          });
        }

        return { ...prevState, clubbers: newClubbers };
      });
    };

    // Animation loop for crowd simulation
    const animate = () => {
      if (!ctx || !gameState) return;

      ctx.fillStyle = gameState.currentTheme?.backgroundColor || '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw clubbers
      gameState.clubbers.forEach(clubber => {
        const now = Date.now();
        
        // Movement logic based on tier and pattern
        if (now - clubber.lastMoved > clubber.pauseTime) {
          const dx = clubber.targetX - clubber.x;
          const dy = clubber.targetY - clubber.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 5) {
            // Reached target, choose new one based on tier
            if (gameState.tier <= 1) {
              // COLLECTIVE TRANCE: Move as a unified organism
              const others = gameState.clubbers.filter(c => c.id !== clubber.id);
              if (others.length > 0 && Math.random() < 0.9) {
                // Follow the crowd - move near center of mass
                const centerX = others.reduce((sum, c) => sum + c.x, 0) / others.length;
                const centerY = others.reduce((sum, c) => sum + c.y, 0) / others.length;
                clubber.targetX = centerX + (Math.random() - 0.5) * 60;
                clubber.targetY = centerY + (Math.random() - 0.5) * 60;
              } else {
                // Occasional individual exploration
                clubber.targetX = Math.random() * canvas.width;
                clubber.targetY = Math.random() * canvas.height;
              }
            } else if (gameState.tier <= 2) {
              // MIXED: Some collective, some individual
              const others = gameState.clubbers.filter(c => c.id !== clubber.id);
              if (others.length > 0 && Math.random() < 0.5) {
                const target = others[Math.floor(Math.random() * others.length)];
                clubber.targetX = target.x + (Math.random() - 0.5) * 120;
                clubber.targetY = target.y + (Math.random() - 0.5) * 120;
              } else {
                clubber.targetX = Math.random() * canvas.width;
                clubber.targetY = Math.random() * canvas.height;
              }
            } else if (gameState.tier <= 3) {
              // TOURIST ERA: Erratic, photo-spot seeking
              if (Math.random() < 0.3) {
                // Move to "photo spots" (corners and edges)
                const spots = [
                  { x: 50, y: 50 }, { x: canvas.width - 50, y: 50 },
                  { x: 50, y: canvas.height - 50 }, { x: canvas.width - 50, y: canvas.height - 50 },
                  { x: canvas.width / 2, y: 50 }
                ];
                const spot = spots[Math.floor(Math.random() * spots.length)];
                clubber.targetX = spot.x + (Math.random() - 0.5) * 40;
                clubber.targetY = spot.y + (Math.random() - 0.5) * 40;
              } else {
                clubber.targetX = Math.random() * canvas.width;
                clubber.targetY = Math.random() * canvas.height;
              }
            } else {
              // PERFORMATIVE: Isolated, lone trajectories
              // Each person is in their own bubble
              clubber.targetX = Math.random() * canvas.width;
              clubber.targetY = Math.random() * canvas.height;
              
              // Avoid others - individualistic behavior
              const others = gameState.clubbers.filter(c => c.id !== clubber.id);
              others.forEach(other => {
                const otherDx = other.x - clubber.targetX;
                const otherDy = other.y - clubber.targetY;
                const otherDistance = Math.sqrt(otherDx * otherDx + otherDy * otherDy);
                if (otherDistance < 50) {
                  // Move away from others
                  clubber.targetX -= (otherDx / otherDistance) * 30;
                  clubber.targetY -= (otherDy / otherDistance) * 30;
                }
              });
            }
          } else {
            // Move towards target
            let moveX = (dx / distance) * clubber.speed;
            let moveY = (dy / distance) * clubber.speed;
            
            // Add synchronization effect for early tiers
            if (gameState.tier <= 1) {
              // Add subtle wave motion for collective trance
              const waveTime = Date.now() / 2000;
              moveX += Math.sin(waveTime + clubber.x * 0.01) * 0.1;
              moveY += Math.cos(waveTime + clubber.y * 0.01) * 0.1;
            }
            
            clubber.x += moveX;
            clubber.y += moveY;
          }
          
          clubber.lastMoved = now;
        }

        // Draw clubber with subtle glow effect for early tiers
        ctx.fillStyle = clubber.color;
        if (gameState.tier <= 1) {
          // Add subtle glow for collective trance
          ctx.shadowColor = clubber.color;
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(clubber.x, clubber.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial spawn and start animation
    spawnClubbers();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

  // Mouse tracking for cursor glow
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const root = document.documentElement;
      root.style.setProperty('--mouse-x', e.clientX + 'px');
      root.style.setProperty('--mouse-y', e.clientY + 'px');
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
    console.log(  'Starting new game...');
    const newGameState = createInitialGameState();
    console.log('New game state:', newGameState);
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
        
        getGameState: () => gameState,
        
        testAudio: () => {
          if (audioManagerRef.current) {
            audioManagerRef.current.togglePlayback();
            console.log('🔊 Audio toggled');
          }
        },
        
        spawnClubbers: (count: number) => {
          if (!gameState) return;
          const newClubbers = Array.from({ length: count }, (_, i) => ({
            id: `debug-${Date.now()}-${i}`,
            x: Math.random() * 400,
            y: Math.random() * 300,
            targetX: Math.random() * 400,
            targetY: Math.random() * 300,
            color: CROWD_COLORS[gameState.tier][Math.floor(Math.random() * CROWD_COLORS[gameState.tier].length)],
            type: 'authentic' as const,
            currentSpace: 'dancefloor',
            journey: ['entrance', 'dancefloor', 'bar', 'toilets', 'exit'] as JourneyStep[],
            journeyStep: 1,
            spentMoney: 0,
            entryFee: gameState.tier < 6 ? [5, 8, 12, 18, 25, 30][gameState.tier] : 30,
            timeInClub: 0,
            stamina: Math.random() * 50 + 50,
            tiredness: 0,
            speed: gameState.tier <= 1 ? 0.5 : gameState.tier <= 3 ? 1.5 : 3,
            pauseTime: gameState.tier <= 1 ? 3000 : gameState.tier <= 3 ? 1500 : 500,
            lastMoved: Date.now(),
            movementPattern: gameState.tier <= 1 ? 'organic' as const : gameState.tier <= 3 ? 'erratic' as const : 'performative' as const
          }));
          setGameState(prev => prev ? { ...prev, clubbers: [...prev.clubbers, ...newClubbers] } : null);
          console.log(`🕺 Spawned ${count} clubbers`);
        }
      };
      
      console.log('🛠️ BergInc debug tools loaded. Try: window.bergDebug.fastForward(3)');
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
      className="min-h-screen p-4 transition-all duration-1000 cursor-none"
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
        * {
          cursor: none !important;
        }
        
        button, a, [role="button"] {
          cursor: none !important;
        }
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
          </div>
        </div>

        {/* Stats Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Club Simulation */}
          <div 
            className="border rounded p-4"
            style={{ borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})` }}
          >
            <h3 className="text-lg font-semibold mb-4">Main Floor</h3>
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="w-full h-auto border rounded"
              style={{ 
                borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})`,
                backgroundColor: `var(--berg-bg, ${gameState.currentTheme?.backgroundColor})`
              }}
            />
            <p className="text-sm opacity-60 mt-2">
              {gameState.tier <= 1 
                ? "Dancers move together in collective trance..." 
                : gameState.tier <= 3 
                ? "Movement becomes more erratic and individual..."
                : "Everyone dances alone, taking selfies..."
              }
            </p>
          </div>

          {/* Upgrades */}
          <div 
            className="border rounded p-4"
            style={{ borderColor: `var(--berg-border, ${gameState.currentTheme?.borderColor})` }}
          >
            <h3 className="text-lg font-semibold mb-4">Club Management</h3>
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
      </div>
    </div>
  );
}