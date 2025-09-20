'use client';

import React, { useState } from 'react';
import { TamaGameState, Building, BuildingType } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { BUILDING_TYPES } from '../data/buildings';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { TutorialOverlay } from './TutorialOverlay';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { AlchemyLabModal } from './AlchemyLabModal';
import { formatResourceCost } from '../utils/resourceUtils';

interface BuildingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const BuildingsModal: React.FC<BuildingsModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showAlchemyLab, setShowAlchemyLab] = useState<boolean>(false);

  useEscapeKey(onClose, isVisible);

  if (!isVisible) return null;

  const handleBuildBuilding = (buildingTypeId: string) => {
    if (!engine) return;

    const result = engine.getSystems().buildings.placeBuilding(buildingTypeId, gameState);

    if (result.success) {
      onNotification(`🏗️ ${buildingTypeId.replace('_', ' ')} built successfully!`, 'info');
      // Update the UI by triggering a re-render
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const handleUpgradeBuilding = (buildingId: string) => {
    if (!engine) return;

    const result = engine.getSystems().buildings.upgradeBuilding(buildingId, gameState);

    if (result.success) {
      onNotification('🔧 Building upgraded!', 'info');
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const canAffordBuilding = (buildingType: BuildingType): boolean => {
    const cost = buildingType.cost;
    return (
      (cost.tamaCoins || 0) <= gameState.resources.tamaCoins &&
      (cost.rice_grain || 0) <= gameState.resources.rice_grain &&
      (cost.bamboo_fiber || 0) <= gameState.resources.bamboo_fiber &&
      (cost.silk_thread || 0) <= gameState.resources.silk_thread &&
      (cost.green_tea_leaf || 0) <= gameState.resources.green_tea_leaf &&
      (cost.spirit_essence || 0) <= gameState.resources.spirit_essence &&
      (cost.happinessStars || 0) <= gameState.resources.happinessStars
    );
  };

  const isUnlocked = (buildingType: BuildingType): boolean => {
    return gameState.progression.level >= buildingType.requiredLevel &&
           gameState.unlocks.buildings.includes(buildingType.id);
  };


  const availableBuildings = BUILDING_TYPES.filter(building =>
    selectedCategory === 'all' || building.category === selectedCategory
  );

  const categories = ['all', ...Array.from(new Set(BUILDING_TYPES.map(b => b.category)))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🏗️ Buildings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50"
              title="Show tutorial"
            >
              ❓ Help
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4" data-tutorial="building-categories">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            {/* Current Buildings */}
            {gameState.buildings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Your Buildings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {gameState.buildings.map(building => {
                    const buildingType = BUILDING_TYPES.find(bt => bt.id === building.type);
                    if (!buildingType) return null;

                    return (
                      <div key={building.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">{buildingType.name}</h4>
                            <p className="text-sm text-gray-600">Level {building.level}/{buildingType.maxLevel}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Condition</div>
                            <div className={`font-medium ${
                              building.condition > 80 ? 'text-green-600' :
                              building.condition > 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {Math.round(building.condition)}%
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 mb-3">{buildingType.description}</p>

                        {/* Special Alchemy Lab Controls */}
                        {buildingType.id === 'alchemy_lab' && (
                          <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-purple-700">🧪 Lab Status</span>
                              <span className="text-xs text-purple-600">Level {building.level}/10</span>
                            </div>
                            <div className="text-xs text-purple-600 mb-2">
                              Success Rate: ~{Math.min(85, 20 + (building.level * 5))}% (with skilled Tama)
                            </div>
                            <button
                              onClick={() => setShowAlchemyLab(true)}
                              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded text-xs transition-colors"
                            >
                              🔬 Start Experiments
                            </button>
                          </div>
                        )}

                        {building.level < buildingType.maxLevel && (
                          <button
                            onClick={() => handleUpgradeBuilding(building.id)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors"
                          >
                            🔧 Upgrade ({buildingType.id === 'alchemy_lab' ? `+5% success rate` : 'Improve'})
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Buildings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Available Buildings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableBuildings.map(buildingType => {
                  const unlocked = isUnlocked(buildingType);
                  const canAfford = canAffordBuilding(buildingType);
                  const owned = gameState.buildings.some(b => b.type === buildingType.id);

                  return (
                    <div
                      key={buildingType.id}
                      className={`border rounded-lg p-4 ${
                        unlocked && canAfford
                          ? 'border-green-200 bg-white'
                          : unlocked
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{buildingType.name}</h4>
                        <div className="text-xs text-gray-500">
                          Req: Lv.{buildingType.requiredLevel}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{buildingType.description}</p>

                      <div className="text-xs text-gray-500 mb-3">
                        <div data-tutorial="building-cost">Cost: {formatResourceCost(buildingType.cost)}</div>
                        <div className="mt-1" data-tutorial="building-effects">
                          Effects: {Object.entries(buildingType.effects).map(([key, value]) =>
                            `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: +${value}`
                          ).join(', ')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuildBuilding(buildingType.id)}
                        disabled={!unlocked || !canAfford || owned}
                        className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                          !unlocked
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : !canAfford
                            ? 'bg-red-200 text-red-600 cursor-not-allowed'
                            : owned
                            ? 'bg-green-200 text-green-700 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {!unlocked ? `🔒 Requires Level ${buildingType.requiredLevel}` :
                         owned ? '✅ Built' :
                         !canAfford ? '💰 Insufficient Resources' :
                         '🏗️ Build'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isVisible={showTutorial}
        onClose={() => setShowTutorial(false)}
        steps={TUTORIAL_STEPS.buildings}
        modalType="buildings"
      />

      {/* Alchemy Lab Modal */}
      <AlchemyLabModal
        isVisible={showAlchemyLab}
        onClose={() => setShowAlchemyLab(false)}
        gameState={gameState}
        onNotification={onNotification}
      />
    </div>
  );
};