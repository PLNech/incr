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
  githubUrl?: string;
  url?: string;
}

const GAMES: GameInfo[] = [
  {
    id: 'slow-roast',
    title: 'Slow Roast',
    description: 'Build a specialty coffee empire in Amsterdam. Educate customers, perfect your craft, and navigate the complexities of neighborhood change.',
    emoji: '☕',
    status: 'available',
    githubUrl: 'https://github.com/PLNech/incr/',
    url: '/slow-roast'
  },
  {
    id: 'berg-inc',
    title: 'BergInc',
    description: 'Experience the evolution of Berlin\'s techno scene from underground sanctuary to corporate asset. Watch as growth destroys the very culture it claims to celebrate.',
    emoji: '🎛️',
    status: 'available',
    githubUrl: 'https://github.com/PLNech/incr/',
    url: '/berg'
  },
  {
    id: 'mystery-game',
    title: '???',
    description: 'might reveal more if you play Slow Roast...',
    emoji: '🌫️',
    status: 'locked',
    unlockRequirement: 'Complete Slow Roast',
    githubUrl: 'https://github.com/example/mystery-game',
    url: '/mystery-game'
  },
{
  id: 'strudle-idle',
  title: 'StrudleIdle',
  description: 'Livecoding as an idle game 🎛️🎮',
  emoji: '🥨',
  status: 'available',
  githubUrl: 'https://github.com/PLNech/StrudleIdle',
  url: 'https://plnech.github.io/StrudelIdle/'
},
{
  id: 'le-dernier-code',
  title: 'Le Dernier Code',
  description: 'En 2025, plus tu codes, moins tu codes.',
  emoji: '💻',
  status: 'available',
  githubUrl: 'https://github.com/plnech/DernierCode',
  url: 'https://dernier-code.vercel.app/'
},
{
  id: 'propagation-inc',
  title: 'Propagation Inc.',
  description: 'Manage a network of information and watch it spread. Make strategic decisions to control the narrative and achieve global influence.',
  emoji: '🌐',
  status: 'available',
  githubUrl: 'https://github.com/PLNech/Propagation',
  url: 'https://propagation.vercel.app/'
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

      <section className="py-8 bg-gray-800 rounded-lg mb-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-yellow-400">Highlight: StrudleIdle 🎛️🥨🔊</h2>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-lg text-gray-300 mb-4">
            Become the ultimate pastry chef in this incr' game. Bake <i>delicious</i> strudels...<br />
            AH WAIT NO! IT'S <b>ALGORAVE IDLE</b> 🎉 <br />
            Unlock samples, buy upgrades that make better patterns, and idle rock the party!
          </p>
          <Link href="https://plnech.github.io/StrudelIdle/" className="btn-primary inline-block">
            Jam on StrudleIdle 🔊
          </Link>
        </div>
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
                  <Link href={game.url} className="btn-primary block text-center">
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