'use client';

import React, { useState, useEffect } from 'react';
import { TamaGameState } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { RECIPES } from '../data/recipes';

interface CraftingModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [craftQuantity, setCraftQuantity] = useState<number>(1);

  if (!isVisible) return null;

  const handleCraftItem = (recipeId: string, quantity: number = 1) => {
    if (!engine) return;

    const result = engine.getSystems().crafting.startCrafting(recipeId, quantity, gameState);

    if (result.success) {
      onNotification(`🔨 Started crafting ${quantity}x ${recipeId.replace('_', ' ')}!`, 'info');
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const canAffordRecipe = (recipe: any): boolean => {
    return recipe.ingredients.every((ingredient: any) => {
      const resourceKey = ingredient.itemId === 'berries' ? 'berries' :
                         ingredient.itemId === 'wood' ? 'wood' :
                         ingredient.itemId === 'stone' ? 'stone' :
                         ingredient.itemId === 'tamaCoins' ? 'tamaCoins' :
                         ingredient.itemId === 'happinessStars' ? 'happinessStars' :
                         ingredient.itemId === 'evolutionCrystals' ? 'evolutionCrystals' : null;

      if (!resourceKey) return false;
      return (gameState.resources as any)[resourceKey] >= ingredient.quantity * craftQuantity;
    });
  };

  const isUnlocked = (recipe: any): boolean => {
    return gameState.progression.level >= recipe.requiredLevel &&
           gameState.crafting.unlockedRecipes.includes(recipe.id);
  };

  const formatIngredients = (ingredients: any[]): string => {
    return ingredients.map(ing => {
      const emoji = ing.itemId === 'berries' ? '🍎' :
                   ing.itemId === 'wood' ? '🪵' :
                   ing.itemId === 'stone' ? '🪨' :
                   ing.itemId === 'tamaCoins' ? '🪙' :
                   ing.itemId === 'happinessStars' ? '⭐' :
                   ing.itemId === 'evolutionCrystals' ? '💎' : '❓';
      return `${ing.quantity * craftQuantity} ${emoji}`;
    }).join(', ');
  };

  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const availableRecipes = RECIPES.filter(recipe =>
    selectedCategory === 'all' || recipe.category === selectedCategory
  );

  const categories = ['all', ...Array.from(new Set(RECIPES.map(r => r.category)))];

  // Check if player has crafting workshop
  const hasCraftingWorkshop = gameState.buildings.some(b => b.type === 'crafting_workshop');
  const canCraft = gameState.progression.level >= 3 && hasCraftingWorkshop;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔨 Crafting</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {!canCraft && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⚠️</span>
              <div>
                <div className="font-medium">Crafting Locked</div>
                <div className="text-sm">
                  Requires: Level 3 + Crafting Workshop building
                  {gameState.progression.level < 3 && ` (Currently Level ${gameState.progression.level})`}
                  {!hasCraftingWorkshop && ' • Missing Crafting Workshop'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Crafting Queue */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-3">Crafting Queue</h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
              {gameState.crafting.queue.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🔨</div>
                  <p>No items being crafted</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gameState.crafting.queue.map((item, index) => {
                    const recipe = RECIPES.find(r => r.id === item.recipeId);
                    if (!recipe) return null;

                    const now = Date.now();
                    const totalTime = item.endTime - item.startTime;
                    const progress = Math.min(100, ((now - item.startTime) / totalTime) * 100);
                    const remaining = Math.max(0, item.endTime - now);

                    return (
                      <div key={item.id} className="bg-white rounded-lg p-3 border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-sm">{recipe.name}</div>
                            <div className="text-xs text-gray-500">x{item.quantity}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {index === 0 ? (remaining > 0 ? formatTimeRemaining(remaining) : 'Done!') : 'Queued'}
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recipe Selection */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Available Recipes</h3>
              {selectedRecipe && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={craftQuantity}
                    onChange={(e) => setCraftQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 border rounded text-sm"
                  />
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-4">
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

            {/* Recipes Grid */}
            <div className="overflow-y-auto max-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRecipes.map(recipe => {
                  const unlocked = isUnlocked(recipe);
                  const canAfford = canAffordRecipe(recipe);

                  return (
                    <div
                      key={recipe.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedRecipe === recipe.id
                          ? 'border-blue-500 bg-blue-50'
                          : unlocked && canAfford && canCraft
                          ? 'border-green-200 bg-white hover:border-green-400'
                          : unlocked && canCraft
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                      onClick={() => unlocked && canCraft ? setSelectedRecipe(recipe.id) : null}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800">{recipe.name}</h4>
                        <div className="text-xs text-gray-500">
                          Lv.{recipe.requiredLevel}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        <div className="mb-1">
                          <span className="font-medium">Ingredients:</span> {formatIngredients(recipe.ingredients)}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Craft Time:</span> {formatTimeRemaining(recipe.craftTime)}
                        </div>
                        <div>
                          <span className="font-medium">Output:</span> {recipe.outputs.map(out =>
                            `${out.quantity}x ${out.itemId.replace('_', ' ')}`
                          ).join(', ')}
                        </div>
                      </div>

                      {selectedRecipe === recipe.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCraftItem(recipe.id, craftQuantity);
                          }}
                          disabled={!canAfford || !canCraft}
                          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                            canAfford && canCraft
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          🔨 Craft {craftQuantity > 1 ? `${craftQuantity}x` : ''}
                        </button>
                      )}

                      {!unlocked && (
                        <div className="text-xs text-gray-500 mt-2">
                          🔒 Requires Level {recipe.requiredLevel}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};