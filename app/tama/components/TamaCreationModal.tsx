'use client';

import React, { useState, useEffect } from 'react';
import { TamaGameState, TamaSpecies, TamaTier, TamaGenetics } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { formatResourceCost } from '../utils/resourceUtils';
import { useButtonDebounce } from '../utils/debounce';

interface TamaCreationModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

interface CreationUpgrade {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  level: number;
  maxLevel: number;
}

interface TamaPreset {
  species: TamaSpecies;
  cost: {
    tamaCoins?: number;
    rice_grain?: number;
    bamboo_fiber?: number;
    [key: string]: number | undefined;
  };
  traitPoints: number;
  rarityBonus: number;
  description: string;
}

const SPECIES_THEMES = {
  basic: { primary: 'bg-amber-500', secondary: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  forest: { primary: 'bg-green-500', secondary: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  aquatic: { primary: 'bg-blue-500', secondary: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  crystal: { primary: 'bg-purple-500', secondary: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  shadow: { primary: 'bg-gray-700', secondary: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
  cosmic: { primary: 'bg-indigo-500', secondary: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' }
};

const RARITY_EFFECTS = {
  0: { name: 'Common', glow: '', bonus: '+0%', color: 'text-gray-600' },
  1: { name: 'Uncommon', glow: 'shadow-md', bonus: '+10%', color: 'text-green-600' },
  2: { name: 'Rare', glow: 'shadow-lg shadow-blue-200', bonus: '+25%', color: 'text-blue-600' },
  3: { name: 'Epic', glow: 'shadow-xl shadow-purple-300 animate-pulse', bonus: '+50%', color: 'text-purple-600' }
};

export const TamaCreationModal: React.FC<TamaCreationModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<TamaSpecies>('basic');
  const [selectedTier, setSelectedTier] = useState<TamaTier>(0);
  const [tamaName, setTamaName] = useState('');
  const [traits, setTraits] = useState<TamaGenetics>({
    cuteness: 50,
    intelligence: 50,
    energy: 50,
    appetite: 50
  });
  const [quantity, setQuantity] = useState(1);
  const [traitPoints, setTraitPoints] = useState(0);

  useEscapeKey(onClose, isVisible);

  // Calculate available upgrades based on buildings and progression
  const getCreationUpgrades = (): CreationUpgrade[] => {
    const upgrades: CreationUpgrade[] = [];

    // Nursery building upgrades
    const nursery = gameState.buildings.find(b => b.type === 'nursery');
    if (nursery) {
      upgrades.push({
        id: 'advanced_genetics',
        name: 'Advanced Genetics',
        description: '+10 trait points per nursery level',
        unlocked: true,
        level: nursery.level,
        maxLevel: 10
      });
    }

    // Research Lab upgrades
    const researchLab = gameState.buildings.find(b => b.type === 'research_lab');
    if (researchLab) {
      upgrades.push({
        id: 'species_mastery',
        name: 'Species Mastery',
        description: 'Unlock rare species and tier bonuses',
        unlocked: true,
        level: researchLab.level,
        maxLevel: 5
      });
    }

    // Progression-based upgrades
    if (gameState.progression.level >= 5) {
      upgrades.push({
        id: 'bulk_creation',
        name: 'Bulk Creation',
        description: 'Create multiple Tamas at once with discounts',
        unlocked: true,
        level: Math.min(Math.floor(gameState.progression.level / 5), 3),
        maxLevel: 3
      });
    }

    return upgrades;
  };

  // Calculate available trait points
  const getAvailableTraitPoints = (): number => {
    let basePoints = 20; // Base trait points for customization

    const nursery = gameState.buildings.find(b => b.type === 'nursery');
    if (nursery) {
      basePoints += nursery.level * 10; // +10 per nursery level
    }

    // Tier bonus
    basePoints += selectedTier * 15;

    return basePoints;
  };

  // Calculate creation cost
  const getCreationCost = () => {
    let baseCost = {
      tamaCoins: 100 + (selectedTier * 200),
      rice_grain: 10 + (selectedTier * 5),
      bamboo_fiber: 5 + (selectedTier * 3)
    };

    // Species-specific costs
    const speciesMultiplier = {
      basic: 1,
      forest: 1.2,
      aquatic: 1.3,
      crystal: 1.5,
      shadow: 1.8,
      cosmic: 2.0
    };

    const multiplier = speciesMultiplier[selectedSpecies];

    // Bulk discount
    const bulkDiscount = quantity > 1 ? Math.max(0.7, 1 - (quantity * 0.05)) : 1;

    return {
      tamaCoins: Math.floor(baseCost.tamaCoins * multiplier * quantity * bulkDiscount),
      rice_grain: Math.floor(baseCost.rice_grain * multiplier * quantity * bulkDiscount),
      bamboo_fiber: Math.floor(baseCost.bamboo_fiber * multiplier * quantity * bulkDiscount)
    };
  };

  // Get available species based on progression
  const getAvailableSpecies = (): TamaSpecies[] => {
    const available: TamaSpecies[] = ['basic'];

    if (gameState.progression.level >= 3) available.push('forest');
    if (gameState.progression.level >= 5) available.push('aquatic');
    if (gameState.progression.level >= 8) available.push('crystal');
    if (gameState.progression.level >= 12) available.push('shadow');
    if (gameState.progression.level >= 15) available.push('cosmic');

    return available;
  };

  // Get maximum bulk quantity
  const getMaxBulkQuantity = (): number => {
    const bulkUpgrade = getCreationUpgrades().find(u => u.id === 'bulk_creation');
    if (bulkUpgrade && bulkUpgrade.level > 0) {
      return Math.min(10, 2 + bulkUpgrade.level * 2);
    }
    return 1;
  };

  // Check if can afford creation
  const canAfford = (cost: any): boolean => {
    return (
      gameState.resources.tamaCoins >= (cost.tamaCoins || 0) &&
      gameState.resources.rice_grain >= (cost.rice_grain || 0) &&
      gameState.resources.bamboo_fiber >= (cost.bamboo_fiber || 0)
    );
  };

  // Handle trait adjustment
  const adjustTrait = (trait: keyof TamaGenetics, delta: number) => {
    const currentTotal = Object.values(traits).reduce((sum, val) => sum + val, 0);
    const availablePoints = getAvailableTraitPoints();
    const baseTraitTotal = 200; // 50 * 4 traits

    const newValue = Math.max(1, Math.min(100, traits[trait] + delta));
    const newTotal = currentTotal - traits[trait] + newValue;

    if (newTotal <= baseTraitTotal + availablePoints) {
      setTraits(prev => ({ ...prev, [trait]: newValue }));
    }
  };

  // Handle Tama creation with debouncing
  const handleCreateTama = useButtonDebounce(() => {
    if (!engine) return;

    const cost = getCreationCost();
    if (!canAfford(cost)) {
      onNotification('❌ Insufficient resources!', 'info');
      return;
    }

    // Deduct resources
    gameState.resources.tamaCoins -= cost.tamaCoins;
    gameState.resources.rice_grain -= cost.rice_grain || 0;
    gameState.resources.bamboo_fiber -= cost.bamboo_fiber || 0;

    // Create Tamas
    for (let i = 0; i < quantity; i++) {
      const nameToUse = quantity === 1 ? tamaName || `${selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)} Tama` :
                       `${selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)} #${i + 1}`;

      engine.createTama(nameToUse, selectedSpecies, selectedTier, traits);
    }

    onNotification(
      `🐾 Created ${quantity} ${selectedSpecies} Tama${quantity > 1 ? 's' : ''}!`,
      'achievement'
    );

    // Reset form
    setTamaName('');
    setTraits({ cuteness: 50, intelligence: 50, energy: 50, appetite: 50 });
    setQuantity(1);
    onClose();
  }, 800);

  useEffect(() => {
    const available = getAvailableTraitPoints();
    setTraitPoints(available);
  }, [selectedTier, gameState.buildings]);

  if (!isVisible) return null;

  const theme = SPECIES_THEMES[selectedSpecies];
  const rarityEffect = RARITY_EFFECTS[selectedTier];
  const cost = getCreationCost();
  const availableSpecies = getAvailableSpecies();
  const maxBulkQuantity = getMaxBulkQuantity();

  const usedTraitPoints = Object.values(traits).reduce((sum, val) => sum + val, 0) - 200;
  const remainingTraitPoints = traitPoints - usedTraitPoints;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${theme.primary} p-6 text-white`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">🐣 Create New Tama</h2>
              <p className="text-white text-opacity-80 mt-1">
                Design your perfect companion with advanced genetics
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Creation Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Species Selection */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Species Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSpecies.map(species => {
                  const speciesTheme = SPECIES_THEMES[species];
                  const isSelected = selectedSpecies === species;
                  return (
                    <button
                      key={species}
                      onClick={() => setSelectedSpecies(species)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${speciesTheme.primary} text-white ${speciesTheme.border}`
                          : `${speciesTheme.secondary} ${speciesTheme.text} ${speciesTheme.border} hover:${speciesTheme.primary} hover:text-white`
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {species === 'basic' ? '🐾' :
                         species === 'forest' ? '🌿' :
                         species === 'aquatic' ? '🌊' :
                         species === 'crystal' ? '💎' :
                         species === 'shadow' ? '🌙' : '⭐'}
                      </div>
                      <div className="font-semibold capitalize">{species}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rarity/Tier Selection */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Rarity & Tier</h3>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map(tier => {
                  const rarity = RARITY_EFFECTS[tier as TamaTier];
                  const isSelected = selectedTier === tier;
                  const isUnlocked = tier === 0 || gameState.progression.level >= (tier * 3);

                  return (
                    <button
                      key={tier}
                      onClick={() => isUnlocked && setSelectedTier(tier as TamaTier)}
                      disabled={!isUnlocked}
                      className={`p-3 rounded-lg border-2 transition-all ${rarity.glow} ${
                        !isUnlocked
                          ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                          : isSelected
                            ? `bg-gradient-to-br from-yellow-400 to-yellow-500 text-white border-yellow-400`
                            : `bg-white border-gray-300 hover:border-yellow-400 ${rarity.color}`
                      }`}
                    >
                      <div className="text-lg font-bold">{rarity.name}</div>
                      <div className="text-sm opacity-75">
                        {isUnlocked ? rarity.bonus : `Lv.${tier * 3} req`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            {quantity === 1 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tama Name</h3>
                <input
                  type="text"
                  value={tamaName}
                  onChange={(e) => setTamaName(e.target.value)}
                  placeholder={`My ${selectedSpecies} friend`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Trait Allocation */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Trait Allocation</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  remainingTraitPoints > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {remainingTraitPoints} points remaining
                </div>
              </div>

              {Object.entries(traits).map(([trait, value]) => (
                <div key={trait} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold capitalize text-gray-700">
                      {trait.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className="text-lg font-bold text-gray-800">{value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustTrait(trait as keyof TamaGenetics, -5)}
                      className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      disabled={value <= 5}
                    >
                      -
                    </button>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${theme.primary}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <button
                      onClick={() => adjustTrait(trait as keyof TamaGenetics, 5)}
                      className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      disabled={value >= 100 || remainingTraitPoints < 5}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bulk Creation */}
            {maxBulkQuantity > 1 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Bulk Creation</h3>
                <div className="flex items-center gap-4">
                  <label className="font-semibold text-gray-700">Quantity:</label>
                  <input
                    type="range"
                    min="1"
                    max={maxBulkQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-gray-800 w-8">{quantity}</span>
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-green-600 mt-2">
                    💰 Bulk discount: {Math.round((1 - Math.max(0.7, 1 - (quantity * 0.05))) * 100)}% off per Tama
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Preview & Creation Panel */}
          <div className="w-80 bg-gray-50 p-6 border-l">
            {/* Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Preview</h3>
              <div className={`p-4 rounded-lg border-2 ${theme.border} ${theme.secondary} ${rarityEffect.glow}`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {selectedSpecies === 'basic' ? '🐾' :
                     selectedSpecies === 'forest' ? '🌿' :
                     selectedSpecies === 'aquatic' ? '🌊' :
                     selectedSpecies === 'crystal' ? '💎' :
                     selectedSpecies === 'shadow' ? '🌙' : '⭐'}
                  </div>
                  <div className="font-bold text-lg text-gray-800">
                    {quantity === 1 ? (tamaName || `${selectedSpecies} Tama`) : `${quantity}x ${selectedSpecies}`}
                  </div>
                  <div className={`text-sm ${rarityEffect.color} font-semibold`}>
                    {rarityEffect.name} • Tier {selectedTier}
                  </div>
                </div>

                {/* Trait Preview */}
                <div className="mt-4 space-y-1">
                  {Object.entries(traits).map(([trait, value]) => (
                    <div key={trait} className="flex justify-between text-sm">
                      <span className="capitalize">{trait}:</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Cost</h3>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm text-gray-600 mb-2">
                  {formatResourceCost(cost)}
                </div>
                {quantity > 1 && (
                  <div className="text-xs text-green-600">
                    💰 Save {Math.round((getCreationCost().tamaCoins / quantity * quantity - getCreationCost().tamaCoins))} coins with bulk discount
                  </div>
                )}
              </div>
            </div>

            {/* Creation Button */}
            <button
              onClick={handleCreateTama}
              disabled={!canAfford(cost)}
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                canAfford(cost)
                  ? `${theme.primary} text-white hover:scale-105 shadow-lg hover:shadow-xl`
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {canAfford(cost)
                ? `🐣 Create ${quantity > 1 ? `${quantity} ` : ''}Tama${quantity > 1 ? 's' : ''}!`
                : '💰 Insufficient Resources'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};