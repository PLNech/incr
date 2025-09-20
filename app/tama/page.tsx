'use client';

import React, { useState, useEffect } from 'react';
import { GameProvider, useGameContext } from './providers/GameProvider';
import { ResourceBar } from './components/ResourceBar';
import { TamaCard } from './components/TamaCard';
import { NotificationToast } from './components/NotificationToast';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { NextGoalIndicator } from './components/NextGoalIndicator';
import { Tooltip } from './components/Tooltip';
import { SkillsModal } from './components/SkillsModal';
import { BuildingsModal } from './components/BuildingsModal';
import { CraftingModal } from './components/CraftingModal';
import { ContractsModal } from './components/ContractsModal';
import { SaveMenuModal } from './components/SaveMenuModal';
import debugConsole from './debug/DebugConsole';

interface Notification {
  id: string;
  message: string;
  type: 'xp' | 'levelup' | 'achievement' | 'info';
  duration?: number;
}

function TamaGameContent() {
  const { gameState, engine, isLoaded, events } = useGameContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastLevel, setLastLevel] = useState<number>(1);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showSkillsModal, setShowSkillsModal] = useState<boolean>(false);
  const [showBuildingsModal, setShowBuildingsModal] = useState<boolean>(false);
  const [showCraftingModal, setShowCraftingModal] = useState<boolean>(false);
  const [showContractsModal, setShowContractsModal] = useState<boolean>(false);
  const [showSaveMenuModal, setShowSaveMenuModal] = useState<boolean>(false);

  const addNotification = (message: string, type: 'xp' | 'levelup' | 'achievement' | 'info' = 'info', duration = 3000) => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      duration
    };
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleTamaInteract = (tamaId: string, action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    if (engine && isLoaded) {
      engine.interactWithTama(tamaId, action);
      // Show contextual XP gain notification
      const actionEmojis = {
        feed: '🍎',
        play: '🎾',
        clean: '🧽',
        wakeUp: '👁️'
      };
      const xpGain = action === 'wakeUp' ? 1 : 5; // Wake up gives less XP
      addNotification(`${actionEmojis[action]} +${xpGain} XP`, 'xp', 2000);
    }
  };

  const handleCreateTama = () => {
    if (engine && isLoaded) {
      const name = prompt('What would you like to name your new Tama?') || 'Buddy';
      engine.createTama(name);
      // Show celebration notification for creating Tama
      addNotification(`🐣 ${name} hatched! +10 XP`, 'xp', 3000);

      // Show helpful tip for new users
      if (gameState.tamas.length === 0) {
        setTimeout(() => {
          addNotification('💡 Watch your Tama\'s needs and interact when they\'re low!', 'info', 5000);
        }, 2000);
      }
    }
  };

  // Level up detection
  useEffect(() => {
    if (gameState && gameState.progression.level > lastLevel) {
      const newLevel = gameState.progression.level;

      // Calculate skill points gained
      let skillPointsGained = 1; // Base skill points per level
      if (newLevel > 5) skillPointsGained = 2;
      if (newLevel > 15) skillPointsGained = 3;
      if (newLevel > 35) skillPointsGained = 5;

      // Check if this level has a milestone with extra skill points
      const milestone = [
        { level: 2, skillPoints: 1 },
        { level: 3, skillPoints: 1 },
        { level: 4, skillPoints: 2 },
        { level: 5, skillPoints: 3 },
        { level: 10, skillPoints: 5 },
        { level: 25, skillPoints: 10 },
        { level: 50, skillPoints: 20 },
        { level: 75, skillPoints: 25 },
        { level: 100, skillPoints: 50 }
      ].find(m => m.level === newLevel);

      if (milestone) {
        skillPointsGained += milestone.skillPoints;
      }

      addNotification(`🎉 Level ${newLevel}! +${skillPointsGained} skill points`, 'levelup', 4000);

      if (newLevel === 2) {
        addNotification('🏠 Buildings unlocked!', 'info', 4000);
      } else if (newLevel === 3) {
        addNotification('🔨 Crafting unlocked!', 'info', 4000);
      } else if (newLevel === 5) {
        addNotification('⚡ Specialization available!', 'info', 4000);
      }
      setLastLevel(newLevel);
    }
  }, [gameState?.progression.level, lastLevel]);

  // Tutorial system - check if first time user
  useEffect(() => {
    if (isLoaded && gameState && engine) {
      // Set up debug console
      debugConsole.setEngine(engine);

      const tutorialCompleted = localStorage.getItem('tama_tutorial_completed');
      const isFirstTime = gameState.progression.level === 1 &&
                         gameState.progression.experience <= 10 &&
                         gameState.tamas.length === 0;

      if (!tutorialCompleted && isFirstTime) {
        setTimeout(() => setShowTutorial(true), 1000); // Show after 1 second delay
      } else if (!tutorialCompleted) {
        // Show debug info for returning players
        console.log('🐾 Tama Bokujō Debug Console ready! Type "debug.help()" or "tamaDebug.help()" for commands');
      }
    }
  }, [isLoaded, gameState, engine]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('tama_tutorial_completed', 'true');
    addNotification('🎓 Tutorial complete! Ready to start your ranch!', 'info', 4000);
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
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Tamas</h2>
              {gameState.tamas.length > 0 && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const urgentNeeds = gameState.tamas.reduce((count, tama) => {
                      return count + Object.values(tama.needs).filter(need => need <= 30).length;
                    }, 0);

                    if (urgentNeeds > 0) {
                      return (
                        <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm animate-pulse">
                          <span>⚠️</span>
                          <span className="font-medium">{urgentNeeds} urgent need{urgentNeeds > 1 ? 's' : ''}</span>
                        </div>
                      );
                    } else {
                      const lowNeeds = gameState.tamas.reduce((count, tama) => {
                        return count + Object.values(tama.needs).filter(need => need <= 60).length;
                      }, 0);

                      if (lowNeeds > 0) {
                        return (
                          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            <span>⚡</span>
                            <span className="font-medium">{lowNeeds} low need{lowNeeds > 1 ? 's' : ''}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            <span>✨</span>
                            <span className="font-medium">All needs good!</span>
                          </div>
                        );
                      }
                    }
                  })()}
                </div>
              )}
            </div>
            <button
              onClick={handleCreateTama}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              title="Create a new Tama (+10 XP)"
            >
              <span className="text-lg">🐣</span>
              <span>+ New Tama</span>
              <span className="text-xs bg-green-400 px-2 py-0.5 rounded-full">+10 XP</span>
            </button>
          </div>

          {gameState.tamas.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300">
              <div className="text-6xl mb-4 animate-bounce">🐣</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">Ready to start your Tama ranch!</h3>
              <div className="max-w-md mx-auto mb-6">
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">💡 Tama Basics</h4>
                  <div className="text-sm text-gray-700 space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">🍽️</span>
                      <span>Feed when hunger is low (red/yellow)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">🎾</span>
                      <span>Play when happiness drops</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">🧽</span>
                      <span>Clean when cleanliness is poor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-500">👁️</span>
                      <span>Wake up sleeping Tamas (they sleep automatically)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium">Each action gives you XP!</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateTama}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                🐾 Create Your First Tama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.tamas.map((tama) => (
                <TamaCard
                  key={tama.id}
                  tama={tama}
                  gameState={gameState}
                  onInteract={handleTamaInteract}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Next Goal Indicator */}
          <NextGoalIndicator
            gameState={gameState}
            onSkillsClick={() => setShowSkillsModal(true)}
          />

          {/* Player Progress */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Level:</span>
                <span className="font-medium text-gray-800">{gameState.progression.level}</span>
              </div>
              <div className="flex justify-between">
                <Tooltip content="XP gained by caring for Tamas and completing actions">
                  <span className="text-gray-600">Experience:</span>
                </Tooltip>
                <span className="font-medium text-blue-600">{gameState.progression.experience}</span>
              </div>
              <div className="mt-2">
                {(() => {
                  const currentLevel = gameState.progression.level;
                  const currentXP = gameState.progression.experience;
                  const nextLevelXP = engine?.getSystems().progression.getExperienceRequiredForLevel(currentLevel + 1) || 0;
                  const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

                  return (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Next Level: {nextLevelXP - currentXP} XP</span>
                        <span>{Math.floor(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between">
                <Tooltip content="Prestige resets progress but gives permanent bonuses">
                  <span className="text-gray-600">Prestige Level:</span>
                </Tooltip>
                <span className="font-medium text-purple-600">{gameState.progression.prestigeLevel}</span>
              </div>
              <div className="flex justify-between">
                <Tooltip content="Spend on skills to unlock powerful bonuses">
                  <span className="text-gray-600">Skill Points:</span>
                </Tooltip>
                <span className="font-medium text-green-600">{gameState.progression.skillPoints}</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tamas Raised:</span>
                <span className="font-medium text-gray-800">{gameState.statistics.totalTamasRaised}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contracts Done:</span>
                <span className="font-medium text-gray-800">{gameState.statistics.totalContractsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items Crafted:</span>
                <span className="font-medium text-gray-800">{gameState.statistics.totalItemsCrafted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Play Time:</span>
                <span className="font-medium text-gray-800">
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
                onClick={() => setShowSaveMenuModal(true)}
              >
                💾 Save Menu
              </button>
              <button
                className={`w-full py-2 px-3 rounded text-sm transition-colors ${
                  gameState.progression.skillPoints > 0
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => setShowSkillsModal(true)}
              >
                🌟 Skills ({gameState.progression.skillPoints} pts)
              </button>
              <button
                className={`w-full py-2 px-3 rounded text-sm transition-colors ${
                  gameState.progression.level >= 2
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => gameState.progression.level >= 2 ? setShowBuildingsModal(true) : null}
                disabled={gameState.progression.level < 2}
              >
                🏠 Build {gameState.progression.level < 2 ? '(Lv.2 req)' : ''}
              </button>
              <button
                className={`w-full py-2 px-3 rounded text-sm transition-colors ${
                  gameState.progression.level >= 3
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => gameState.progression.level >= 3 ? setShowCraftingModal(true) : null}
                disabled={gameState.progression.level < 3}
              >
                🔨 Craft Items {gameState.progression.level < 3 ? '(Lv.3 req)' : ''}
              </button>
              <button
                className={`w-full py-2 px-3 rounded text-sm transition-colors ${
                  gameState.progression.level >= 5 && gameState.tamas.length >= 3
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => gameState.progression.level >= 5 && gameState.tamas.length >= 3 ? setShowContractsModal(true) : null}
                disabled={gameState.progression.level < 5 || gameState.tamas.length < 3}
              >
                📋 View Contracts {(gameState.progression.level < 5 || gameState.tamas.length < 3) ?
                  `(${gameState.progression.level < 5 ? `Lv.${gameState.progression.level}/5` : `${gameState.tamas.length}/3 Tamas`})` : ''}
              </button>
              <button
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
                onClick={() => setShowTutorial(true)}
              >
                ❓ Help & Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification System */}
      <NotificationToast
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Tutorial System */}
      <WelcomeTutorial
        isVisible={showTutorial}
        onComplete={handleTutorialComplete}
      />

      {/* Skills System */}
      <SkillsModal
        isVisible={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        gameState={gameState}
        engine={engine}
        onNotification={addNotification}
      />

      {/* Buildings System */}
      <BuildingsModal
        isVisible={showBuildingsModal}
        onClose={() => setShowBuildingsModal(false)}
        gameState={gameState}
        engine={engine}
        onNotification={addNotification}
      />

      {/* Crafting System */}
      <CraftingModal
        isVisible={showCraftingModal}
        onClose={() => setShowCraftingModal(false)}
        gameState={gameState}
        engine={engine}
        onNotification={addNotification}
      />

      {/* Contracts System */}
      <ContractsModal
        isVisible={showContractsModal}
        onClose={() => setShowContractsModal(false)}
        gameState={gameState}
        engine={engine}
        onNotification={addNotification}
      />

      {/* Save Management System */}
      <SaveMenuModal
        isVisible={showSaveMenuModal}
        onClose={() => setShowSaveMenuModal(false)}
        engine={engine}
        onNotification={addNotification}
      />
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