'use client';

import React, { useState } from 'react';
import { TamaGameState, Building, TamaData } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { BUILDING_TYPES } from '../data/buildings';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { formatResourceCost } from '../utils/resourceUtils';

interface UnifiedUpgradesModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

type UpgradeCategory = 'buildings' | 'tamas' | 'crafting' | 'facilities';

interface UpgradeOption {
  id: string;
  category: UpgradeCategory;
  name: string;
  description: string;
  emoji: string;
  currentLevel: number;
  maxLevel: number;
  cost: {
    tamaCoins?: number;
    rice_grain?: number;
    bamboo_fiber?: number;
    silk_thread?: number;
    green_tea_leaf?: number;
    spirit_essence?: number;
  };
  benefits: string[];
  canUpgrade: boolean;
  upgradeAction: () => boolean;
}

export const UnifiedUpgradesModal: React.FC<UnifiedUpgradesModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UpgradeCategory>('buildings');

  useEscapeKey(onClose, isVisible);

  if (!isVisible || !engine) return null;


  // Check if player can afford upgrade
  const canAfford = (cost: any): boolean => {
    return (
      (!cost.tamaCoins || gameState.resources.tamaCoins >= cost.tamaCoins) &&
      (!cost.rice_grain || gameState.resources.rice_grain >= cost.rice_grain) &&
      (!cost.bamboo_fiber || gameState.resources.bamboo_fiber >= cost.bamboo_fiber) &&
      (!cost.silk_thread || gameState.resources.silk_thread >= cost.silk_thread) &&
      (!cost.green_tea_leaf || gameState.resources.green_tea_leaf >= cost.green_tea_leaf) &&
      (!cost.spirit_essence || gameState.resources.spirit_essence >= cost.spirit_essence)
    );
  };

  // Generate upgrade options for buildings
  const getBuildingUpgrades = (): UpgradeOption[] => {
    return gameState.buildings.map(building => {
      const buildingType = BUILDING_TYPES.find(bt => bt.id === building.type);
      if (!buildingType || building.level >= buildingType.maxLevel) return null;

      const upgradeCost = {
        tamaCoins: Math.floor(100 * Math.pow(1.5, building.level)),
        bamboo_fiber: Math.floor(5 * Math.pow(1.3, building.level)),
        spirit_essence: building.level >= 3 ? Math.floor(building.level / 3) : 0
      };

      return {
        id: building.id,
        category: 'buildings' as UpgradeCategory,
        name: buildingType.name,
        description: `Upgrade to level ${building.level + 1}/${buildingType.maxLevel}`,
        emoji: '🏗️',
        currentLevel: building.level,
        maxLevel: buildingType.maxLevel,
        cost: upgradeCost,
        benefits: [
          'Increased efficiency',
          'Better automation',
          building.type === 'alchemy_lab' ? '+5% success rate' : 'Enhanced effects'
        ],
        canUpgrade: canAfford(upgradeCost),
        upgradeAction: () => {
          const result = engine.getSystems().buildings.upgradeBuilding(building.id, gameState);
          if (result.success) {
            onNotification(`🔧 ${buildingType.name} upgraded to level ${building.level + 1}!`, 'achievement');
          } else {
            onNotification(`❌ ${result.message}`, 'info');
          }
          return result.success;
        }
      };
    }).filter(Boolean) as UpgradeOption[];
  };

  // Generate upgrade options for Tamas
  const getTamaUpgrades = (): UpgradeOption[] => {
    return gameState.tamas.map(tama => {
      if (tama.tier >= 3) return null; // Max tier reached

      const tierUpCost = {
        tamaCoins: 500 * Math.pow(2, tama.tier),
        rice_grain: 20 * tama.tier,
        green_tea_leaf: 10 * tama.tier,
        spirit_essence: tama.tier * 2
      };

      return {
        id: tama.id,
        category: 'tamas' as UpgradeCategory,
        name: tama.name,
        description: `Evolve to Tier ${tama.tier + 1}`,
        emoji: '🐾',
        currentLevel: tama.tier,
        maxLevel: 3,
        cost: tierUpCost,
        benefits: [
          'Increased stats',
          'New abilities',
          'Higher job success rates',
          'Enhanced autonomy'
        ],
        canUpgrade: canAfford(tierUpCost) && tama.level >= 10,
        upgradeAction: () => {
          // This would need to be implemented in the engine
          onNotification(`🌟 ${tama.name} evolved to Tier ${tama.tier + 1}!`, 'achievement');
          return true;
        }
      };
    }).filter(Boolean) as UpgradeOption[];
  };

  // Generate crafting facility upgrades
  const getCraftingUpgrades = (): UpgradeOption[] => {
    const upgrades: UpgradeOption[] = [];

    // Alchemy Lab special upgrades
    const alchemyLab = gameState.buildings.find(b => b.type === 'alchemy_lab');
    if (alchemyLab && alchemyLab.level < 10) {
      upgrades.push({
        id: 'alchemy_mastery',
        category: 'crafting',
        name: 'Alchemy Mastery',
        description: 'Enhance your alchemy knowledge and equipment',
        emoji: '🧪',
        currentLevel: alchemyLab.level,
        maxLevel: 10,
        cost: {
          tamaCoins: 1000,
          spirit_essence: 3,
          green_tea_leaf: 15
        },
        benefits: [
          '+10% experiment success rate',
          'Unlock rare recipes',
          'Reduced material consumption'
        ],
        canUpgrade: canAfford({
          tamaCoins: 1000,
          spirit_essence: 3,
          green_tea_leaf: 15
        }),
        upgradeAction: () => {
          // For now, we'll use the building upgrade system for alchemy lab
          const result = engine.getSystems().buildings.upgradeBuilding(alchemyLab.id, gameState);
          if (result.success) {
            onNotification('🧪 Alchemy mastery enhanced!', 'achievement');
          }
          return result.success;
        }
      });
    }

    // Recipe Discovery upgrades
    upgrades.push({
      id: 'recipe_research',
      category: 'crafting',
      name: 'Recipe Research',
      description: 'Discover new crafting possibilities',
      emoji: '📜',
      currentLevel: gameState.unlocks.recipes.length,
      maxLevel: 50,
      cost: {
        tamaCoins: 200,
        rice_grain: 10,
        bamboo_fiber: 5
      },
      benefits: [
        'Unlock new recipes',
        'Discover rare combinations',
        'Enhanced crafting knowledge'
      ],
      canUpgrade: canAfford({
        tamaCoins: 200,
        rice_grain: 10,
        bamboo_fiber: 5
      }),
      upgradeAction: () => {
        // This would trigger recipe discovery
        onNotification('📜 New recipes discovered!', 'achievement');
        return true;
      }
    });

    return upgrades;
  };

  // Get all upgrades for selected category
  const getUpgradesByCategory = (): UpgradeOption[] => {
    switch (selectedCategory) {
      case 'buildings':
        return getBuildingUpgrades();
      case 'tamas':
        return getTamaUpgrades();
      case 'crafting':
        return getCraftingUpgrades();
      case 'facilities':
        return [...getBuildingUpgrades(), ...getCraftingUpgrades()];
      default:
        return [];
    }
  };

  const currentUpgrades = getUpgradesByCategory();

  const handleUpgrade = (upgrade: UpgradeOption) => {
    const success = upgrade.upgradeAction();
    if (success) {
      // Force a re-render by not doing anything - the parent will update
    }
  };

  const categories = [
    { id: 'buildings', name: 'Buildings', emoji: '🏗️', count: getBuildingUpgrades().length },
    { id: 'tamas', name: 'Tamas', emoji: '🐾', count: getTamaUpgrades().length },
    { id: 'crafting', name: 'Crafting', emoji: '🧪', count: getCraftingUpgrades().length }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">⚡ Unified Upgrades</h2>
              <p className="text-purple-100 mt-1">Enhance your Tama ranch with Japanese craftsmanship</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-64 bg-gray-50 p-4 border-r overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as UpgradeCategory)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedCategory === category.id
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {category.count > 0 && (
                      <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {category.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Resource Summary */}
            <div className="mt-6 p-3 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">Resources</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>🪙 Coins</span>
                  <span>{gameState.resources.tamaCoins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>🌾 Rice</span>
                  <span>{gameState.resources.rice_grain}</span>
                </div>
                <div className="flex justify-between">
                  <span>🎋 Bamboo</span>
                  <span>{gameState.resources.bamboo_fiber}</span>
                </div>
                <div className="flex justify-between">
                  <span>🧵 Silk</span>
                  <span>{gameState.resources.silk_thread}</span>
                </div>
                <div className="flex justify-between">
                  <span>🍃 Tea</span>
                  <span>{gameState.resources.green_tea_leaf}</span>
                </div>
                <div className="flex justify-between">
                  <span>🔮 Spirit</span>
                  <span>{gameState.resources.spirit_essence}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentUpgrades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-medium mb-2">No upgrades available</h3>
                <p className="text-sm">All items in this category are already maxed out!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentUpgrades.map(upgrade => (
                  <div
                    key={upgrade.id}
                    className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-6"
                  >
                    {/* Upgrade Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{upgrade.emoji}</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{upgrade.name}</h3>
                          <p className="text-sm text-gray-600">{upgrade.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Level</div>
                        <div className="font-bold text-purple-600">
                          {upgrade.currentLevel}/{upgrade.maxLevel}
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Benefits</h4>
                      <ul className="space-y-1">
                        {upgrade.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cost */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Cost</h4>
                      <div className="text-sm text-gray-600">
                        {formatResourceCost(upgrade.cost)}
                      </div>
                    </div>

                    {/* Upgrade Button */}
                    <button
                      onClick={() => handleUpgrade(upgrade)}
                      disabled={!upgrade.canUpgrade}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        upgrade.canUpgrade
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {upgrade.canUpgrade ? '⚡ Upgrade' : '💰 Insufficient Resources'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};