'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameStateManager } from '../../lib/gameStateManager';
import { SlowRoastEngine } from '../../lib/slowRoastUtils';
import { GameState, COFFEE_UPGRADES } from '../../lib/slowRoastTypes';
import {
  ResourceDisplay,
  CoffeeUpgradeInterface,
  MrsGarciaInteraction,
  DailyReview,
  CustomerDemographics,
  AchievementGallery,
  WisdomToast,
  GameEnding
} from '../../components/SlowRoastComponents';
import Link from 'next/link';

export default function SlowRoastPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showWisdom, setShowWisdom] = useState(false);
  const [currentWisdom, setCurrentWisdom] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  // Load game state on mount
  useEffect(() => {
    const gsm = GameStateManager.getInstance();
    const saved = gsm.loadGameState('slow-roast');
    
    if (saved.progress?.day) {
      setGameState(saved.progress as GameState);
      setGameStarted(true);
    }
  }, []);

  // Auto-save every 10 seconds
  const saveGame = useCallback(() => {
    if (!gameState) return;
    
    const gsm = GameStateManager.getInstance();
    gsm.saveGameState('slow-roast', {
      progress: gameState,
      resources: gameState.resources as unknown as Record<string, number>,
      achievements: gameState.achievements.filter(a => a.unlocked).map(a => a.id),
      playerName: gameState.playerName,
    });
  }, [gameState]);

  useEffect(() => {
    if (gameState) {
      const interval = setInterval(saveGame, 10000);
      return () => clearInterval(interval);
    }
  }, [saveGame, gameState]);

  // Daily progression (every 30 seconds = 1 game day)
  useEffect(() => {
    if (!gameState || gameState.currentEnding) return;
    
    const interval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState) return null;
        
        const { newState } = SlowRoastEngine.processDailyEvents(prevState);
        return newState;
      });
    }, 30000); // 30 seconds = 1 game day
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Initialize new game
  const startNewGame = (playerName: string, shopName: string) => {
    const newGameState = SlowRoastEngine.initializeGameState(playerName, shopName);
    setGameState(newGameState);
    setGameStarted(true);
  };

  // Coffee upgrade handler
  const handleCoffeeUpgrade = (upgradeIndex: number) => {
    if (!gameState) return;
    
    const newState = SlowRoastEngine.upgradeCoffee(gameState, upgradeIndex);
    setGameState(newState);
    
    // Show James Hoffman wisdom on upgrade
    const wisdom = SlowRoastEngine.getRandomWisdom();
    setCurrentWisdom(wisdom);
    setShowWisdom(true);
    setTimeout(() => setShowWisdom(false), 4000);
  };

  // Mrs. García help handler
  const handleHelpMrsGarcia = (helpType: 'discount' | 'gift') => {
    if (!gameState) return;
    
    const newState = SlowRoastEngine.helpMrsGarcia(gameState, helpType);
    setGameState(newState);
  };

  // Manual day progression (for testing)
  const advanceDay = () => {
    if (!gameState) return;
    
    const { newState } = SlowRoastEngine.processDailyEvents(gameState);
    setGameState(newState);
  };

  // Restart game
  const restartGame = () => {
    setGameState(null);
    setGameStarted(false);
    
    // Clear save data
    const gsm = GameStateManager.getInstance();
    gsm.saveGameState('slow-roast', {
      progress: null,
      resources: {},
      achievements: [],
      playerName: undefined,
    });
  };

  // Game setup screen
  if (!gameStarted || !gameState) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="btn-secondary">
            ← Back to la incr factory
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold">☕ Slow Roast</h1>
            <p className="text-gray-400">The Coffee Gentrification Simulator</p>
          </div>
          <div></div>
        </div>

        <div className="bg-amber-900 border border-amber-700 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4">🏪 Welcome to Amsterdam!</h3>
          <p className="mb-4">
            You've just signed the lease on a small café space in a charming working-class neighborhood. 
            The locals are skeptical of yet another coffee shop, but you have a vision: to bring the art 
            of slow, specialty coffee to Amsterdam.
          </p>
          <p className="mb-6 text-sm text-yellow-200">
            What could go wrong? After all, you're just sharing your passion for great coffee...
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Your Name:</label>
              <input
                id="player-name"
                type="text"
                placeholder="Coffee Artisan"
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Shop Name:</label>
              <input
                id="shop-name"
                type="text"
                placeholder="The Third Wave"
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
              />
            </div>
            
            <button
              onClick={() => {
                const nameInput = document.querySelector('#player-name') as HTMLInputElement;
                const shopInput = document.querySelector('#shop-name') as HTMLInputElement;
                const playerName = nameInput?.value.trim() || 'Coffee Artisan';
                const shopName = shopInput?.value.trim() || 'The Third Wave';
                startNewGame(playerName, shopName);
              }}
              className="btn-primary w-full"
            >
              Open Your Coffee Shop! ☕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game ending screen
  if (gameState.currentEnding) {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="btn-secondary">
              ← Back to la incr factory
            </Link>
            <div className="text-center">
              <h1 className="text-3xl font-bold">☕ {gameState.shopName}</h1>
              <p className="text-gray-400">Game Complete - Day {gameState.day}</p>
            </div>
            <button onClick={saveGame} className="btn-primary">
              Save Progress
            </button>
          </div>
          
          <ResourceDisplay 
            resources={gameState.resources} 
            day={gameState.day} 
            phase={gameState.phase} 
          />
          
          <div className="text-center py-8">
            <p className="text-xl text-gray-300 mb-4">
              Your coffee shop journey has reached its conclusion...
            </p>
            <p className="text-gray-400">
              The ending screen will appear shortly to reflect on your choices.
            </p>
          </div>
        </div>
        
        <GameEnding 
          endingId={gameState.currentEnding} 
          gameState={gameState}
          onRestart={restartGame}
        />
      </>
    );
  }

  const availableUpgrades = SlowRoastEngine.getAvailableUpgrades(gameState);

  return (
    <div className="space-y-6">
      {/* James Hoffman Wisdom Toast */}
      <WisdomToast wisdom={currentWisdom} visible={showWisdom} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link href="/" className="btn-secondary">
          ← Back to la incr factory
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-bold">☕ {gameState.shopName}</h1>
          <p className="text-gray-400">Owner: {gameState.playerName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={advanceDay} className="btn-secondary text-sm">
            Skip Day (Test)
          </button>
          <button onClick={saveGame} className="btn-primary">
            Save Game
          </button>
        </div>
      </div>

      {/* Resource Display */}
      <ResourceDisplay 
        resources={gameState.resources} 
        day={gameState.day} 
        phase={gameState.phase} 
      />

      {/* Phase-specific intro messages */}
      {gameState.phase === 'innocent' && gameState.day === 2 && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-200">
            ☕ Your first day went well! Maybe you could improve the coffee quality a bit? 
            The locals seem interested in something more sophisticated...
          </p>
        </div>
      )}

      {gameState.phase === 'snobbery' && gameState.currentCoffeeLevel === 2 && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-200">
            🎭 Your coffee is getting quite refined! You're attracting a more... discerning clientele. 
            The neighborhood is starting to take notice.
          </p>
        </div>
      )}

      {gameState.phase === 'realization' && gameState.resources.gentrification >= 15 && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200">
            😬 You're serving excellent coffee, but have you looked around the neighborhood lately? 
            Some familiar faces seem to be... missing.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Main Actions */}
        <div className="space-y-6">
          <CoffeeUpgradeInterface
            currentLevel={gameState.currentCoffeeLevel}
            availableUpgrades={availableUpgrades}
            money={gameState.resources.money}
            onUpgrade={handleCoffeeUpgrade}
          />
          
          <MrsGarciaInteraction
            stage={gameState.mrsGarciaStage}
            interactions={gameState.mrsGarciaInteractions}
            hasHelped={gameState.playerHelpedMrsGarcia}
            onHelp={handleHelpMrsGarcia}
          />
        </div>

        {/* Right Column - Analytics & Events */}
        <div className="space-y-6">
          <DailyReview
            events={gameState.todaysEvents}
            day={gameState.day}
          />
          
          <CustomerDemographics
            segments={gameState.customerSegments}
            gentrification={gameState.resources.gentrification}
            phase={gameState.phase}
          />
          
          <AchievementGallery
            achievements={gameState.achievements}
            isVisible={gameState.phase !== 'setup' && gameState.phase !== 'innocent'}
          />
        </div>
      </div>

      {/* Daily Stats Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold mb-3">📈 Today's Business</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-400">{gameState.dailyCustomers}</div>
            <div className="text-sm text-gray-400">Customers Served</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {SlowRoastEngine.formatCurrency(gameState.dailyRevenue)}
            </div>
            <div className="text-sm text-gray-400">Daily Revenue</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {COFFEE_UPGRADES[gameState.currentCoffeeLevel].name}
            </div>
            <div className="text-sm text-gray-400">Current Coffee</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {SlowRoastEngine.formatCurrency(COFFEE_UPGRADES[gameState.currentCoffeeLevel].price)}
            </div>
            <div className="text-sm text-gray-400">Price per Cup</div>
          </div>
        </div>
      </div>

      {/* Development Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <div>Phase: {gameState.phase}</div>
              <div>Coffee Level: {gameState.currentCoffeeLevel}</div>
              <div>Mrs. García: {gameState.mrsGarciaStage}</div>
              <div>Gentrification: {gameState.resources.gentrification}</div>
              <div>Achievements: {gameState.achievements.filter(a => a.unlocked).length}/{gameState.achievements.length}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}