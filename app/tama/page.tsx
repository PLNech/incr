'use client';

import React from 'react';
import { GameProvider, useGameContext } from './providers/GameProvider';
import { ResourceBar } from './components/ResourceBar';
import { TamaCard } from './components/TamaCard';

function TamaGameContent() {
  const { gameState, engine, isLoaded } = useGameContext();

  const handleTamaInteract = (tamaId: string, action: 'feed' | 'play' | 'clean') => {
    if (engine && isLoaded) {
      engine.interactWithTama(tamaId, action);
    }
  };

  const handleCreateTama = () => {
    if (engine && isLoaded) {
      const name = prompt('What would you like to name your new Tama?') || 'Buddy';
      engine.createTama(name);
    }
  };

  if (!isLoaded) {
    return (
      <div className="text-center text-gray-600">
        <p>Your virtual Tama ranch is loading...</p>
        <div className="mt-4 animate-pulse">
          <div className="w-16 h-16 bg-green-200 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="text-center text-red-600">
        <p>Failed to load game state. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource Bar */}
      <ResourceBar resources={gameState.resources} />

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tama Collection */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Your Tamas</h2>
            <button
              onClick={handleCreateTama}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + New Tama
            </button>
          </div>

          {gameState.tamas.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Tamas yet!</h3>
              <p className="text-gray-600 mb-4">
                Create your first Tama to start your ranch adventure.
              </p>
              <button
                onClick={handleCreateTama}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Tama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.tamas.map((tama) => (
                <TamaCard
                  key={tama.id}
                  tama={tama}
                  onInteract={handleTamaInteract}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Player Progress */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Level:</span>
                <span className="font-medium">{gameState.progression.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience:</span>
                <span className="font-medium">{gameState.progression.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prestige Level:</span>
                <span className="font-medium">{gameState.progression.prestigeLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skill Points:</span>
                <span className="font-medium">{gameState.progression.skillPoints}</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tamas Raised:</span>
                <span className="font-medium">{gameState.statistics.totalTamasRaised}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contracts Done:</span>
                <span className="font-medium">{gameState.statistics.totalContractsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items Crafted:</span>
                <span className="font-medium">{gameState.statistics.totalItemsCrafted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Play Time:</span>
                <span className="font-medium">
                  {Math.floor(gameState.statistics.totalPlayTime / 60000)}m
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
                onClick={() => engine?.save()}
              >
                💾 Save Game
              </button>
              <button
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded text-sm transition-colors"
                onClick={() => alert('🏠 Build Structures\n\nRequires: Level 2\nUnlock: Habitats & Workshops\n\nBuild Basic Habitat (50 🪙, 3 🪵) to house more Tamas, or Crafting Workshop for automation!')}
              >
                🏠 Build
              </button>
              <button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm transition-colors"
                onClick={() => alert('🔨 Craft Items\n\nRequires: Level 3 + Crafting Workshop\nCost: 100 🪙, 5 🪵, 2 🪨\n\nUnlock basic recipes like Berry Snacks and Premium Food to keep your Tamas well-fed!')}
              >
                🔨 Craft Items
              </button>
              <button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded text-sm transition-colors"
                onClick={() => alert('📋 View Contracts\n\nRequires: Level 5 + 3 Tamas\nUnlock: Customer relationships\n\nEarn bonus 🪙 by completing jobs for various customers. Each customer has different preferences and payment rates!')}
              >
                📋 View Contracts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TamaGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-800">
          🐾 Tama Bokujō 🏡
        </h1>
        <GameProvider>
          <TamaGameContent />
        </GameProvider>
      </div>
    </div>
  );
}