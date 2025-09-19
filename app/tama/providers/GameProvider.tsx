'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TamaEngine } from '../engine/TamaEngine';
import { TamaGameState, GameEvent } from '../types';

interface GameContextType {
  gameState: TamaGameState | null;
  engine: TamaEngine | null;
  isLoaded: boolean;
  events: GameEvent[];
}

const GameContext = createContext<GameContextType | null>(null);

export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<TamaGameState | null>(null);
  const [engine, setEngine] = useState<TamaEngine | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Initialize the game engine
        const gameEngine = new TamaEngine();

        // Set up event listener for game state updates
        const handleGameEvent = (event: GameEvent) => {
          setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
          // Update game state whenever there's an event
          const currentState = gameEngine.getGameState();
          setGameState(currentState);
        };

        gameEngine.addEventListener(handleGameEvent);

        // Set up periodic state sync
        const syncInterval = setInterval(() => {
          const currentState = gameEngine.getGameState();
          setGameState(currentState);
        }, 1000);

        // Get initial game state
        const initialState = gameEngine.getGameState();
        setGameState(initialState);
        setEngine(gameEngine);
        setIsLoaded(true);

        // Cleanup function
        return () => {
          clearInterval(syncInterval);
          gameEngine.removeEventListener(handleGameEvent);
          gameEngine.destroy();
        };
      } catch (error) {
        console.error('Failed to initialize game engine:', error);
        // Still set loaded to true with a basic state so UI doesn't hang
        setIsLoaded(true);
      }
    };

    const cleanup = initializeGame();

    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const value: GameContextType = {
    gameState,
    engine,
    isLoaded,
    events
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};