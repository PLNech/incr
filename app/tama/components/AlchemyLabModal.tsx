'use client';

import React, { useState, useMemo } from 'react';
import { TamaGameState, TamaData } from '../types';
import { JapaneseCraftingSystem } from '../systems/JapaneseCraftingSystem';

interface AlchemyLabModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const AlchemyLabModal: React.FC<AlchemyLabModalProps> = ({
  isVisible,
  onClose,
  gameState,
  onNotification
}) => {
  const [selectedTama, setSelectedTama] = useState<TamaData | null>(null);
  const [isExperimenting, setIsExperimenting] = useState(false);

  const craftingSystem = useMemo(() => new JapaneseCraftingSystem(), []);
  const crafting = craftingSystem.getCraftingProgress(gameState);

  const availableTamas = gameState.tamas.filter(tama =>
    tama.needs.energy > 30 && tama.needs.happiness > 50
  );

  const getLabLevel = (): number => {
    const lab = gameState.buildings.find(b => b.type === 'alchemy_lab');
    return lab?.level || 1;
  };

  const calculateSuccessRate = (tama: TamaData): number => {
    const labLevel = getLabLevel();

    // Intelligence is the primary factor (0-100 → 0-25 bonus points)
    const intelligenceBonus = (tama.genetics.intelligence / 100) * 25;

    // Energy affects focus and precision (0-100 → 0-10 bonus points)
    const energyBonus = (tama.needs.energy / 100) * 10;

    // Experience matters (level + jobs completed)
    const experienceBonus = (tama.level * 0.8) + (tama.stats.jobsCompleted * 1.2);

    // Happiness affects confidence and willingness to take risks (0-100 → 0-8 bonus)
    const happinessBonus = (tama.needs.happiness / 100) * 8;

    // Lab level provides base safety and equipment quality
    const labBonus = labLevel * 6;

    // Base success rate starts low for safety
    const baseRate = 10 + labBonus + intelligenceBonus + energyBonus + experienceBonus + happinessBonus;

    return Math.min(85, Math.max(5, Math.round(baseRate)));
  };

  const handleExperiment = async (tama: TamaData) => {
    if (isExperimenting) return;

    setIsExperimenting(true);

    // Add suspense with timing
    setTimeout(() => {
      const result = craftingSystem.experimentInAlchemyLab(gameState, tama.id);

      if (result.success) {
        if (result.itemId) {
          onNotification(`🎉 ${tama.name} discovered ${result.itemId.replace('_', ' ')}! (+${result.xp} XP)`, 'achievement');
        } else {
          onNotification(`✅ Experiment successful! ${tama.name} gained ${result.xp} XP!`, 'xp');
        }
      } else {
        onNotification(`💥 Experiment failed! ${tama.name} is a bit shaken but learned something (+${result.xp} XP)`, 'info');
      }

      setIsExperimenting(false);
    }, 2000); // 2 second experiment animation
  };

  const getExperimentRisk = (successRate: number): { color: string; text: string } => {
    if (successRate >= 70) return { color: 'text-green-600', text: 'Low Risk' };
    if (successRate >= 40) return { color: 'text-yellow-600', text: 'Medium Risk' };
    return { color: 'text-red-600', text: 'High Risk' };
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex modal-content">

        {/* Left Panel - Lab Status */}
        <div className="w-80 bg-gradient-to-b from-purple-50 to-purple-100 p-6 border-r border-purple-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-purple-800">🧪 Alchemy Lab</h2>
            <button
              onClick={onClose}
              className="text-purple-400 hover:text-purple-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Lab Stats */}
          <div className="bg-white rounded-lg p-4 mb-6 border border-purple-200">
            <h3 className="font-semibold text-purple-700 mb-3">Lab Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Lab Level:</span>
                <span className="font-medium text-purple-700">{getLabLevel()}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Crafting XP:</span>
                <span className="font-medium text-blue-600">{crafting.craftingXP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipes Known:</span>
                <span className="font-medium text-green-600">{crafting.discoveredRecipes.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categories:</span>
                <span className="font-medium text-indigo-600">{crafting.unlockedCategories.size}</span>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm font-medium text-yellow-700">Safety Notice</span>
            </div>
            <p className="text-xs text-yellow-600">
              Experiments may fail! Higher level labs and experienced Tamas have better success rates.
              Failed experiments still provide some XP but no discoveries.
            </p>
          </div>

          {/* Progress Indicator */}
          {isExperimenting && (
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl mb-2 animate-bounce">🔬</div>
                <div className="text-sm font-medium text-purple-700">Experimenting...</div>
                <div className="text-xs text-purple-600 mt-1">Stand back!</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Tama Selection & Experiment */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Research Assistant</h3>
            <p className="text-sm text-gray-600">Choose a Tama to conduct experiments. Higher level Tamas with more job experience have better success rates.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {availableTamas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">😴</div>
                <p className="font-medium mb-2">No Tamas Available</p>
                <p className="text-sm">Your Tamas need at least 30% energy and 50% happiness to safely conduct experiments.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {availableTamas.map(tama => {
                  const successRate = calculateSuccessRate(tama);
                  const risk = getExperimentRisk(successRate);
                  const isSelected = selectedTama?.id === tama.id;

                  return (
                    <div
                      key={tama.id}
                      onClick={() => setSelectedTama(tama)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center mb-3">
                        <div className="text-2xl mb-1">🐾</div>
                        <div className="font-medium text-gray-800">{tama.name}</div>
                        <div className="text-xs text-gray-500">Level {tama.level} • Jobs: {tama.stats.jobsCompleted}</div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">🧠 Intelligence:</span>
                          <span className="font-medium text-blue-600">{tama.genetics.intelligence.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">⚡ Energy:</span>
                          <span className="font-medium text-green-600">{tama.needs.energy.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">😊 Happiness:</span>
                          <span className="font-medium text-yellow-600">{tama.needs.happiness.toFixed(1)}%</span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 mt-2">
                          <div className="flex justify-between font-medium">
                            <span className="text-purple-700">Success Rate:</span>
                            <span className="text-purple-600">{successRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Level:</span>
                            <span className={`font-medium ${risk.color}`}>{risk.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-between text-xs">
                        <div className={`px-2 py-1 rounded ${tama.needs.energy > 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          ⚡ {Math.round(tama.needs.energy)}%
                        </div>
                        <div className={`px-2 py-1 rounded ${tama.needs.happiness > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          😊 {Math.round(tama.needs.happiness)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Panel */}
          {selectedTama && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-800">{selectedTama.name} is ready!</h4>
                  <p className="text-sm text-gray-600">
                    Success Rate: {calculateSuccessRate(selectedTama)}% •
                    XP Reward: {calculateSuccessRate(selectedTama) > 50 ? '50' : '10-50'}
                  </p>
                </div>
                <button
                  onClick={() => handleExperiment(selectedTama)}
                  disabled={isExperimenting}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    isExperimenting
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isExperimenting ? '🔬 Experimenting...' : '🧪 Start Experiment'}
                </button>
              </div>

              <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                <strong>Experiment Notes:</strong> {selectedTama.name} will attempt to combine unknown materials and discover new recipes.
                Higher success rates lead to recipe discoveries and more XP. Failed experiments still provide learning experience!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};