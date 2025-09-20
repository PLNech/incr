'use client';

import React, { useState, useMemo } from 'react';
import { TamaGameState } from '../types';
import { ALL_CRAFTING_ITEMS, CraftingItem } from '../data/japanese-crafting-items';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CraftbookModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  onCraftItem: (itemId: string, quantity: number) => void;
}

export const CraftbookModal: React.FC<CraftbookModalProps> = ({
  isVisible,
  onClose,
  gameState,
  onCraftItem
}) => {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CraftingItem | null>(null);

  useEscapeKey(onClose, isVisible);

  // Get all crafting items
  const allCraftingItems = useMemo(() => {
    return ALL_CRAFTING_ITEMS;
  }, []);

  // Filter discovered items (for now, show all - later integrate with actual discovery system)
  const discoveredItems = useMemo(() => {
    return allCraftingItems.filter(item => {
      // Basic tier and category filtering
      if (item.tier !== selectedTier) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // TODO: Add actual discovery check based on gameState.discoveredRecipes
      return true;
    });
  }, [allCraftingItems, selectedTier, selectedCategory]);

  const categories = ['all', 'food', 'textile', 'tool', 'decoration', 'medicine', 'toy', 'spiritual', 'seasonal'];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-800 border-green-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'legendary': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-amber-100 text-amber-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCraft = (item: CraftingItem): boolean => {
    if (!item.ingredients || item.ingredients.length === 0) return false;

    return item.ingredients.every(ingredient => {
      const available = gameState.inventory?.[ingredient.itemId] || 0;
      return available >= ingredient.quantity;
    });
  };

  const getIngredientStatus = (itemId: string, required: number) => {
    const available = gameState.inventory?.[itemId] || 0;
    return { available, required, canMake: available >= required };
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex modal-content">
        {/* Left Panel - Item Grid */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📚 Craftbook</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl btn-animated micro-bounce"
              >
                ×
              </button>
            </div>

            {/* Tier Selector */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier as 1 | 2 | 3 | 4)}
                  className={`px-4 py-2 rounded font-medium btn-animated ${
                    selectedTier === tier
                      ? getTierColor(tier) + ' border border-current'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tier {tier}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Item Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-4 gap-4">
              {discoveredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg btn-animated ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${getRarityColor(item.rarity)}`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <div className="font-medium text-sm leading-tight">{item.name}</div>
                    {item.tamagotchiClassic && (
                      <div className="text-xs text-pink-600 font-medium mt-1">🎮 Classic</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {discoveredItems.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">🔍</div>
                <p>No items discovered in this category yet.</p>
                <p className="text-sm mt-2">Explore and craft to discover new recipes!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Item Details */}
        <div className="w-80 flex flex-col bg-gray-50">
          {selectedItem ? (
            <>
              {/* Item Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{selectedItem.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedItem.name}</h3>
                  {selectedItem.tamagotchiClassic && (
                    <div className="text-sm text-pink-600 font-medium mt-1">🎮 Tamagotchi Classic</div>
                  )}
                </div>

                <div className="flex justify-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(selectedItem.tier)}`}>
                    Tier {selectedItem.tier}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getRarityColor(selectedItem.rarity)}`}>
                    {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}
                  </span>
                </div>

                <p className="text-gray-600 text-center text-sm">{selectedItem.description}</p>
              </div>

              {/* Recipe & Crafting */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 ? (
                  <>
                    <h4 className="font-semibold text-gray-800 mb-3">🧪 Recipe</h4>
                    <div className="space-y-3 mb-6">
                      {selectedItem.ingredients.map(ingredient => {
                        const sourceItem = allCraftingItems.find(item => item.id === ingredient.itemId);
                        const status = getIngredientStatus(ingredient.itemId, ingredient.quantity);

                        return (
                          <div
                            key={ingredient.itemId}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              status.canMake ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <span className="text-2xl">{sourceItem?.emoji || '❓'}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {sourceItem?.name || ingredient.itemId}
                              </div>
                              <div className={`text-xs ${status.canMake ? 'text-green-600' : 'text-red-600'}`}>
                                {status.available}/{ingredient.quantity}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Craft Button */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="number"
                          min="1"
                          max={canCraft(selectedItem) ? 10 : 0}
                          defaultValue="1"
                          className="w-16 px-2 py-1 border rounded text-sm"
                          id={`craft-quantity-${selectedItem.id}`}
                          disabled={!canCraft(selectedItem)}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`craft-quantity-${selectedItem.id}`) as HTMLInputElement;
                            const quantity = parseInt(input.value) || 1;
                            onCraftItem(selectedItem.id, quantity);
                          }}
                          disabled={!canCraft(selectedItem)}
                          className={`flex-1 py-2 px-4 rounded font-medium btn-animated ${
                            canCraft(selectedItem)
                              ? 'bg-blue-500 hover:bg-blue-600 text-white btn-success'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canCraft(selectedItem) ? '🔨 Craft' : '❌ Missing Materials'}
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>🎯 Crafting XP: {selectedItem.craftingXP}</div>
                        <div>⭐ Discovery XP: {selectedItem.discoveryXP}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-3xl mb-2">🌿</div>
                    <p className="text-sm">Basic Material</p>
                    <p className="text-xs mt-1">Gathered from adventures</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">📖</div>
                <p>Select an item to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};