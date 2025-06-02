'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameStateManager } from '../../lib/gameStateManager';
import Link from 'next/link';

interface Resources {
  beans: number;
  customers: number;
  money: number;
  reputation: number;
  knowledge: number;
  equipment: number;
  influence: number;
  gentrification: number;
}

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  education: number; // 0-100 how educated they are about coffee
  preference: 'instant' | 'chain' | 'specialty' | 'third-wave';
  spendingPower: number;
  gentrificationContribution: number;
}

interface GameState {
  day: number;
  resources: Resources;
  customerSegments: CustomerSegment[];
  unlockedFeatures: string[];
  automation: Record<string, boolean>;
  achievements: string[];
  playerName?: string;
  shopName?: string;
  nextNookEvent: number;
  gamePhase: 'setup' | 'learning' | 'growing' | 'established' | 'empire';
}

const INITIAL_CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'tourists',
    name: 'Tourists',
    size: 45,
    education: 5,
    preference: 'chain',
    spendingPower: 3,
    gentrificationContribution: 0.1
  },
  {
    id: 'locals',
    name: 'Local Residents',
    size: 40,
    education: 15,
    preference: 'instant',
    spendingPower: 2,
    gentrificationContribution: 0
  },
  {
    id: 'students',
    name: 'Students',
    size: 15,
    education: 25,
    preference: 'chain',
    spendingPower: 1,
    gentrificationContribution: 0.05
  }
];

const JAMES_HOFFMAN_WISDOM = [
  "The grind is more important than the machine.",
  "Temperature stability beats temperature accuracy.",
  "Light roasts reveal the coffee's true character.",
  "Sugar masks the coffee's natural complexity.",
  "Every coffee tells the story of its origin.",
  "Extraction is the art of controlled dissolution.",
  "The best coffee is the one you enjoy most... but let me tell you why you're wrong."
];

const NOOK_EVENTS = [
  {
    day: 5,
    message: "A friendly raccoon in a business suit stops by. 'Nook Coffee Supplies here! I see you're getting started. You'll need better equipment soon, yes yes?'",
    unlocks: ['equipment_shop']
  },
  {
    day: 15,
    message: "Tom Nook returns: 'My, my! Business is growing! You know, I have some premium bean suppliers... but they're not cheap, yes yes?'",
    unlocks: ['premium_beans']
  },
  {
    day: 30,
    message: "Nook slides a contract across your counter: 'Exclusive supplier deal! Very beneficial! (For me, mostly.) Sign here!'",
    unlocks: ['nook_contracts']
  }
];

export default function SlowRoastPage() {
  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    resources: {
      beans: 50,
      customers: 0,
      money: 100,
      reputation: 0,
      knowledge: 10,
      equipment: 1,
      influence: 0,
      gentrification: 0
    },
    customerSegments: INITIAL_CUSTOMER_SEGMENTS,
    unlockedFeatures: ['manual_brewing'],
    automation: {},
    achievements: [],
    nextNookEvent: 5,
    gamePhase: 'setup'
  });

  const [selectedCustomerSegment, setSelectedCustomerSegment] = useState<string | null>(null);
  const [dailyLog, setDailyLog] = useState<string[]>([]);
  const [showWisdom, setShowWisdom] = useState(false);

  // Load game state
  useEffect(() => {
    const gsm = GameStateManager.getInstance();
    const saved = gsm.loadGameState('slow-roast');
    
    if (saved.progress?.day) {
      setGameState(prev => ({
        ...prev,
        ...saved.progress,
        resources: {
          ...prev.resources,
          ...(saved.resources as Resources)
        },
        achievements: saved.achievements || [],
        playerName: saved.playerName,
      }));
    }
  }, []);

  // Save game state
  const saveGame = useCallback(() => {
    const gsm = GameStateManager.getInstance();
    gsm.saveGameState('slow-roast', {
      progress: gameState,
      resources: gameState.resources,
      achievements: gameState.achievements,
      playerName: gameState.playerName,
    });
  }, [gameState]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(saveGame, 10000);
    return () => clearInterval(interval);
  }, [saveGame]);

  // Daily progression (every 30 seconds = 1 day)
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const newDay = prev.day + 1;
        const newState = { ...prev, day: newDay };
        
        // Process daily events
        const dailyEvents = processDailyEvents(newState);
        setDailyLog(prev => [...dailyEvents, ...prev].slice(0, 10));
        
        // Check for Nook events
        const nookEvent = NOOK_EVENTS.find(event => event.day === newDay);
        if (nookEvent) {
          setDailyLog(prev => [nookEvent.message, ...prev].slice(0, 10));
          newState.unlockedFeatures = [...newState.unlockedFeatures, ...nookEvent.unlocks];
        }
        
        return newState;
      });
    }, 30000); // 30 seconds = 1 game day
    
    return () => clearInterval(interval);
  }, []);

  const processDailyEvents = (state: GameState): string[] => {
    const events: string[] = [];
    const newResources = { ...state.resources };
    
    // Customer visits and coffee sales
    let totalCustomers = 0;
    let totalRevenue = 0;
    
    state.customerSegments.forEach(segment => {
      const educationFactor = Math.min(segment.education / 100, 0.8);
      const reputationFactor = Math.min(state.resources.reputation / 100, 0.5);
      const visitChance = 0.1 + educationFactor + reputationFactor;
      
      const dailyVisitors = Math.floor(segment.size * visitChance * Math.random());
      if (dailyVisitors > 0) {
        totalCustomers += dailyVisitors;
        const revenue = dailyVisitors * segment.spendingPower * (1 + reputationFactor);
        totalRevenue += revenue;
        
        // Consume beans
        newResources.beans = Math.max(0, newResources.beans - dailyVisitors * 0.5);
      }
    });
    
    if (totalCustomers > 0) {
      newResources.customers += totalCustomers;
      newResources.money += totalRevenue;
      events.push(`Day ${state.day}: Served ${totalCustomers} customers, earned €${totalRevenue.toFixed(2)}`);
      
      if (newResources.beans < 10) {
        events.push("⚠️ Running low on coffee beans!");
      }
    }
    
    // Update resources
    setGameState(prev => ({ ...prev, resources: newResources }));
    
    return events;
  };

  const brewCoffee = () => {
    if (gameState.resources.beans >= 1) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          beans: prev.resources.beans - 1,
          reputation: prev.resources.reputation + 0.1,
          knowledge: prev.resources.knowledge + 0.05,
        }
      }));
    }
  };

  const educateCustomer = (segmentId: string) => {
    if (gameState.resources.knowledge >= 5) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          knowledge: prev.resources.knowledge - 5,
        },
        customerSegments: prev.customerSegments.map(segment =>
          segment.id === segmentId
            ? { ...segment, education: Math.min(100, segment.education + 2) }
            : segment
        )
      }));
    }
  };

  const buyBeans = () => {
    const cost = 20;
    if (gameState.resources.money >= cost) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          money: prev.resources.money - cost,
          beans: prev.resources.beans + 25,
        }
      }));
    }
  };

  const unlockUpgrades = () => {
    const cost = 50;
    if (gameState.resources.money >= cost && !gameState.unlockedFeatures.includes('upgrades_menu')) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          money: prev.resources.money - cost,
        },
        unlockedFeatures: [...prev.unlockedFeatures, 'upgrades_menu']
      }));
    }
  };

  const showRandomWisdom = () => {
    setShowWisdom(true);
    setTimeout(() => setShowWisdom(false), 4000);
  };

  const canAfford = (cost: number) => gameState.resources.money >= cost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link href="/" className="btn-secondary">
          ← Back to Games
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold">☕ Slow Roast</h1>
          <p className="text-gray-400">Day {gameState.day} • Amsterdam Coffee Culture</p>
        </div>
        <button onClick={saveGame} className="btn-primary">
          Save Game
        </button>
      </div>

      {/* Shop Setup */}
      {!gameState.shopName && (
        <div className="bg-amber-900 border border-amber-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🏪 Welcome to Amsterdam!</h3>
          <p className="mb-4">You've just signed the lease on a small café space in a charming neighborhood. The locals are skeptical of yet another coffee shop, but you have a vision: to bring the art of slow, specialty coffee to Amsterdam.</p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Your Name:</label>
              <input
                type="text"
                placeholder="Coffee Artisan"
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value;
                    if (name) setGameState(prev => ({ ...prev, playerName: name }));
                  }
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Shop Name:</label>
              <input
                type="text"
                placeholder="The Third Wave"
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = (e.target as HTMLInputElement).value;
                    if (name) setGameState(prev => ({ ...prev, shopName: name }));
                  }
                }}
              />
            </div>
            
            <button
              onClick={() => {
                const nameInput = document.querySelectorAll('input')[0] as HTMLInputElement;
                const shopInput = document.querySelectorAll('input')[1] as HTMLInputElement;
                setGameState(prev => ({
                  ...prev,
                  playerName: nameInput.value || 'Coffee Artisan',
                  shopName: shopInput.value || 'The Third Wave'
                }));
              }}
              className="btn-primary w-full"
            >
              Open Your Coffee Shop! ☕
            </button>
          </div>
        </div>
      )}

      {/* James Hoffman Wisdom */}
      {showWisdom && (
        <div className="fixed top-4 right-4 bg-blue-900 border border-blue-600 rounded-lg p-4 max-w-sm z-50 animate-pulse">
          <p className="text-sm font-semibold">☕ James Hoffman says:</p>
          <p className="text-xs mt-1 italic">
            "{JAMES_HOFFMAN_WISDOM[Math.floor(Math.random() * JAMES_HOFFMAN_WISDOM.length)]}"
          </p>
        </div>
      )}

      {gameState.shopName && (
        <>
          {/* Resource Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="resource-display">
              <div className="text-lg font-bold">{Math.floor(gameState.resources.beans)}</div>
              <div className="text-sm text-gray-400">Coffee Beans</div>
            </div>
            <div className="resource-display">
              <div className="text-lg font-bold">€{Math.floor(gameState.resources.money)}</div>
              <div className="text-sm text-gray-400">Money</div>
            </div>
            <div className="resource-display">
              <div className="text-lg font-bold">{Math.floor(gameState.resources.reputation)}</div>
              <div className="text-sm text-gray-400">Reputation</div>
            </div>
            <div className="resource-display">
              <div className="text-lg font-bold">{Math.floor(gameState.resources.knowledge)}</div>
              <div className="text-sm text-gray-400">Coffee Knowledge</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Daily Operations</h2>
              
              <div className="game-card">
                <h3 className="font-semibold mb-3">☕ Manual Brewing</h3>
                <p className="text-sm text-gray-300 mb-3">Carefully craft each cup by hand. Slow, but builds reputation and knowledge.</p>
                <button
                  onClick={brewCoffee}
                  disabled={gameState.resources.beans < 1}
                  className={`btn-primary w-full ${gameState.resources.beans < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Brew Coffee (-1 bean, +reputation)
                </button>
              </div>

              <div className="game-card">
                <h3 className="font-semibold mb-3">🌱 Buy Coffee Beans</h3>
                <p className="text-sm text-gray-300 mb-3">Source quality beans from local suppliers.</p>
                <button
                  onClick={buyBeans}
                  disabled={!canAfford(20)}
                  className={`btn-primary w-full ${!canAfford(20) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Buy Beans (€20 for 25 beans)
                </button>
              </div>

              {!gameState.unlockedFeatures.includes('upgrades_menu') && (
                <div className="game-card bg-yellow-900 border-yellow-700">
                  <h3 className="font-semibold mb-3">🔓 Unlock Shop Improvements</h3>
                  <p className="text-sm text-gray-300 mb-3">Invest in your shop's potential. This will unlock the ability to purchase equipment, training, and automation.</p>
                  <button
                    onClick={unlockUpgrades}
                    disabled={!canAfford(50)}
                    className={`btn-primary w-full ${!canAfford(50) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Unlock Upgrades Menu (€50)
                  </button>
                </div>
              )}

              <div className="game-card">
                <h3 className="font-semibold mb-3">📚 Channel James Hoffman</h3>
                <p className="text-sm text-gray-300 mb-3">Gain wisdom from the coffee master himself.</p>
                <button
                  onClick={showRandomWisdom}
                  className="btn-secondary w-full"
                >
                  Seek Coffee Wisdom
                </button>
              </div>
            </div>

            {/* Customer Analytics */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Neighborhood Analysis</h2>
              
              <div className="space-y-3">
                {gameState.customerSegments.map(segment => (
                  <div key={segment.id} className="game-card">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{segment.name}</h3>
                      <span className="text-sm text-gray-400">{segment.size} people</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Coffee Education:</span>
                        <div className="progress-bar mt-1">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${segment.education}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{segment.education}/100</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Prefers: {segment.preference}</span>
                        <span>Spending: €{segment.spendingPower}/visit</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => educateCustomer(segment.id)}
                      disabled={gameState.resources.knowledge < 5}
                      className={`btn-secondary w-full mt-3 text-sm ${gameState.resources.knowledge < 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Educate About Coffee (-5 knowledge)
                    </button>
                  </div>
                ))}
              </div>

              {/* Daily Log */}
              <div className="game-card">
                <h3 className="font-semibold mb-3">📰 Daily News</h3>
                <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                  {dailyLog.length > 0 ? (
                    dailyLog.map((log, index) => (
                      <div key={index} className="text-gray-300 border-b border-gray-700 pb-1">
                        {log}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">Waiting for customers...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}