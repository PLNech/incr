'use client';

import { useEffect, useState } from 'react';
import { GameStateManager } from '../lib/gameStateManager';
import Link from 'next/link';

interface GameInfo {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: 'available' | 'locked' | 'coming-soon';
  unlockRequirement?: string;
}

const GAMES: GameInfo[] = [
  {
    id: 'slow-roast',
    title: 'Slow Roast',
    description: 'Build a specialty coffee empire in Amsterdam. Educate customers, perfect your craft, and navigate the complexities of neighborhood change.',
    emoji: '☕',
    status: 'available'
  },
  {
    id: 'city-builder',
    title: 'City Builder',
    description: 'Build and manage your own city from the ground up.',
    emoji: '🏙️',
    status: 'locked',
    unlockRequirement: 'Open 5 coffee shops in Slow Roast'
  },
  {
    id: 'space-miner',
    title: 'Space Miner',
    description: 'Mine asteroids and explore the galaxy.',
    emoji: '🚀',
    status: 'coming-soon'
  }
];

export default function HomePage() {
  const [gameStates, setGameStates] = useState<any[]>([]);
  const [globalState, setGlobalState] = useState<any>({});

  useEffect(() => {
    const gsm = GameStateManager.getInstance();
    setGameStates(gsm.getAllGameStates());
    setGlobalState(gsm.getGlobalState());
  }, []);

  const isGameUnlocked = (game: GameInfo): boolean => {
    if (game.status === 'available') return true;
    if (game.status === 'coming-soon') return false;
    
    // Check unlock requirements
    if (game.id === 'city-builder') {
      const slowRoastGame = gameStates.find(g => g.gameId === 'slow-roast');
      return slowRoastGame?.progress?.shopsOpened >= 5 || false;
    }
    
    return false;
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Factory! 🏭</h1>
        <p className="text-xl text-gray-300 mb-6">
          Build, automate, and progress through interconnected incremental games
        </p>
        
        {globalState.gamesPlayed?.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Your Progress</h3>
            <p className="text-gray-300">Games Played: {globalState.gamesPlayed.length}</p>
            <p className="text-gray-300">Global Achievements: {globalState.globalAchievements?.length || 0}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Available Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const unlocked = isGameUnlocked(game);
            const gameState = gameStates.find(g => g.gameId === game.id);
            
            return (
              <div key={game.id} className="game-card">
                <div className="text-4xl mb-4">{game.emoji}</div>
                <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                <p className="text-gray-300 mb-4">{game.description}</p>
                
                {gameState && (
                  <div className="mb-4 p-3 bg-gray-700 rounded">
                    <p className="text-sm text-gray-300">
                      Last played: {new Date(gameState.lastPlayed).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-300">
                      Achievements: {gameState.achievements?.length || 0}
                    </p>
                  </div>
                )}
                
                {unlocked ? (
                  <Link href={`/${game.id}`} className="btn-primary block text-center">
                    {gameState ? 'Continue' : 'Start Game'}
                  </Link>
                ) : game.status === 'coming-soon' ? (
                  <div className="btn-secondary opacity-50 cursor-not-allowed text-center">
                    Coming Soon
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="btn-secondary opacity-50 cursor-not-allowed mb-2">
                      Locked
                    </div>
                    <p className="text-xs text-gray-400">{game.unlockRequirement}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Cross-Game Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-2">🏆 Shared Achievements</h3>
            <p>Unlock achievements that persist across all games and unlock special bonuses.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">🔄 Resource Sharing</h3>
            <p>Some resources and upgrades from one game can benefit others.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">👤 Persistent Identity</h3>
            <p>Your name and progress carry forward between games.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">🔓 Progressive Unlocks</h3>
            <p>Master one game to unlock the next in the series.</p>
          </div>
        </div>
      </section>
    </div>
  );
}