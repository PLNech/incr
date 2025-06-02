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
    id: 'mystery-game',
    title: '???',
    description: 'might reveal more if you play Slow Roast...',
    emoji: '🌫️',
    status: 'locked',
    unlockRequirement: 'Complete Slow Roast'
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
    if (game.id === 'mystery-game') return false; // Always locked for now
    return false;
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4">la incr factory 🏭</h1>        
        {globalState.gamesPlayed?.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="font-semibold mb-2">ton incr aventure</h3>
            <p className="text-gray-300">Au moins {globalState.gamesPlayed.length} expérience{globalState.globalAchievements?.length > 1 ? "s":""} incr</p>
            <p className="text-gray-300">Dont t'as gardé {globalState.globalAchievements?.length || 0} souvenirs</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">incr experiences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const unlocked = isGameUnlocked(game);
            const gameState = gameStates.find(g => g.gameId === game.id);
            
            return (
              <div key={game.id} className={`game-card ${game.id === 'mystery-game' ? 'opacity-50 blur-sm' : ''}`}>
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
                ) : (
                  <div className="text-center">
                    <div className="btn-secondary opacity-50 cursor-not-allowed mb-2">
                      mystère...
                    </div>
                    <p className="text-xs text-gray-400">{game.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}