'use client';

import React, { useState, useMemo } from 'react';
import { ALL_CRAFTING_ITEMS, CraftingItem } from '../data/japanese-crafting-items';

export default function CraftTreePage() {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CraftingItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'chain'>('tree');

  const allItems = useMemo(() => ALL_CRAFTING_ITEMS, []);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (selectedTier !== 'all' && item.tier !== selectedTier) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [allItems, selectedTier, selectedCategory, searchTerm]);

  const categories = ['all', 'food', 'textile', 'tool', 'decoration', 'medicine', 'toy', 'spiritual', 'seasonal'];

  const tierCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    allItems.forEach(item => counts[item.tier]++);
    return counts;
  }, [allItems]);

  const getTierColor = (tier: number | 'all') => {
    if (tier === 'all') return 'bg-gray-100 text-gray-800';
    switch (tier) {
      case 1: return 'bg-amber-100 text-amber-800 border-amber-300';
      case 2: return 'bg-blue-100 text-blue-800 border-blue-300';
      case 3: return 'bg-purple-100 text-purple-800 border-purple-300';
      case 4: return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-l-gray-400';
      case 'uncommon': return 'border-l-green-400';
      case 'rare': return 'border-l-blue-400';
      case 'legendary': return 'border-l-purple-400';
      default: return 'border-l-gray-400';
    }
  };

  const getIngredientChain = (itemId: string, visited = new Set()): string[] => {
    if (visited.has(itemId)) return [];
    visited.add(itemId);

    const item = allItems.find(i => i.id === itemId);
    if (!item || !item.ingredients) return [itemId];

    const chain = [itemId];
    item.ingredients.forEach(ingredient => {
      const subChain = getIngredientChain(ingredient.itemId, new Set(visited));
      chain.push(...subChain);
    });

    return chain;
  };

  // Enhanced tree structure builder with Unicode box drawing
  const buildCraftingTree = (itemId: string, depth = 0, isLast = true, parentPrefix = ''): { item: CraftingItem; prefix: string; depth: number }[] => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return [];

    const currentPrefix = depth === 0 ? '' : parentPrefix + (isLast ? '└── ' : '├── ');
    const nextPrefix = depth === 0 ? '' : parentPrefix + (isLast ? '    ' : '│   ');

    const result = [{ item, prefix: currentPrefix, depth }];

    if (item.ingredients && item.ingredients.length > 0) {
      item.ingredients.forEach((ingredient, index) => {
        const isLastIngredient = index === item.ingredients!.length - 1;
        const subTree = buildCraftingTree(ingredient.itemId, depth + 1, isLastIngredient, nextPrefix);
        result.push(...subTree);
      });
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🌸 Tama Craft System</h1>
                <p className="text-gray-600 text-sm mt-1">Japanese-inspired 4-tier crafting tree • {allItems.length} total items</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Tier 1: {tierCounts[1]} materials</div>
                <div>Tier 2: {tierCounts[2]} basics</div>
                <div>Tier 3: {tierCounts[3]} advanced</div>
                <div>Tier 4: {tierCounts[4]} masterworks</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Tier Filters */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTier === 'all' ? getTierColor('all') + ' border' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  All Tiers
                </button>
                {[1, 2, 3, 4].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier as 1 | 2 | 3 | 4)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                      selectedTier === tier ? getTierColor(tier) : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    T{tier} ({tierCounts[tier]})
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Items Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md border-l-4 ${getRarityColor(item.rarity)}
                           cursor-pointer transition-all p-4 ${
                  selectedItem?.id === item.id ? 'ring-2 ring-blue-500 transform scale-105' : 'hover:transform hover:scale-102'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className="font-medium text-sm leading-tight mb-2">{item.name}</div>

                  <div className="flex justify-center gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(item.tier)}`}>
                      T{item.tier}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 capitalize">{item.category}</div>
                  {item.tamagotchiClassic && (
                    <div className="text-xs text-pink-600 font-medium mt-1">🎮</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p>No items found matching your filters.</p>
            </div>
          )}
        </div>

        {/* Item Details Sidebar */}
        <div className="w-80 bg-white rounded-xl shadow-sm p-6 sticky top-24 h-fit hidden lg:block">
          {selectedItem ? (
            <div>
              {/* Item Header */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{selectedItem.emoji}</div>
                <h3 className="text-xl font-bold text-gray-800">{selectedItem.name}</h3>
                {selectedItem.tamagotchiClassic && (
                  <div className="text-sm text-pink-600 font-medium mt-1">🎮 Tamagotchi Classic</div>
                )}
              </div>

              {/* Badges */}
              <div className="flex justify-center gap-2 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getTierColor(selectedItem.tier)}`}>
                  Tier {selectedItem.tier}
                </span>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800`}>
                  {selectedItem.rarity.charAt(0).toUpperCase() + selectedItem.rarity.slice(1)}
                </span>
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800">
                  {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}
                </span>
              </div>

              <p className="text-gray-600 text-center text-sm mb-6">{selectedItem.description}</p>

              {/* Recipe */}
              {selectedItem.ingredients && selectedItem.ingredients.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🧪 Recipe</h4>
                  <div className="space-y-3 mb-6">
                    {selectedItem.ingredients.map(ingredient => {
                      const sourceItem = allItems.find(item => item.id === ingredient.itemId);
                      return (
                        <div
                          key={ingredient.itemId}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => {
                            if (sourceItem) setSelectedItem(sourceItem);
                          }}
                        >
                          <span className="text-2xl">{sourceItem?.emoji || '❓'}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {sourceItem?.name || ingredient.itemId}
                            </div>
                            <div className="text-xs text-gray-500">
                              Quantity: {ingredient.quantity} • Tier {sourceItem?.tier || '?'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Enhanced Crafting Tree */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-700 mb-3">🔗 Full Crafting Tree</h5>

                    {/* Tab-like view toggle */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setViewMode('tree')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          viewMode === 'tree'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        🌲 Tree View
                      </button>
                      <button
                        onClick={() => setViewMode('chain')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          viewMode === 'chain'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        📜 Chain View
                      </button>
                    </div>

                    {/* Tree View */}
                    {viewMode === 'tree' && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
                          {buildCraftingTree(selectedItem.id).map((node, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors"
                              onClick={() => setSelectedItem(node.item)}
                            >
                              <span className="text-gray-400 whitespace-pre select-none">
                                {node.prefix}
                              </span>
                              <span className="text-lg">{node.item.emoji}</span>
                              <span className="font-sans font-medium text-gray-800">
                                {node.item.name}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-sans ${getTierColor(node.item.tier)}`}>
                                T{node.item.tier}
                              </span>
                              {node.item.rarity !== 'common' && (
                                <span className="text-xs text-blue-600 font-sans">
                                  ⭐ {node.item.rarity}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                          💡 Click any item in the tree to explore its recipe. Tree shows complete crafting dependency hierarchy.
                        </div>
                      </>
                    )}

                    {/* Chain View */}
                    {viewMode === 'chain' && (
                      <>
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-3 overflow-x-auto pb-2">
                              {getIngredientChain(selectedItem.id).reverse().map((itemId, index, array) => {
                                const chainItem = allItems.find(i => i.id === itemId);
                                if (!chainItem) return null;

                                return (
                                  <div key={itemId} className="flex items-center gap-2 flex-shrink-0">
                                    <div
                                      className="bg-white rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition-all transform hover:scale-105"
                                      onClick={() => setSelectedItem(chainItem)}
                                    >
                                      <div className="text-center">
                                        <div className="text-2xl mb-1">{chainItem.emoji}</div>
                                        <div className="font-medium text-xs text-gray-800 mb-1">
                                          {chainItem.name}
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTierColor(chainItem.tier)}`}>
                                          T{chainItem.tier}
                                        </span>
                                      </div>
                                    </div>

                                    {index < array.length - 1 && (
                                      <div className="text-gray-400 text-lg">
                                        →
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 bg-purple-50 p-2 rounded">
                          🔄 Linear crafting chain from base materials to final product. Click items to jump between them.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">🌿</div>
                  <p className="text-sm">Base Material</p>
                  <p className="text-xs mt-1">Gathered from adventures</p>
                </div>
              )}

              {/* XP Info */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-center text-sm">
                  <div>
                    <div className="text-yellow-600">⭐</div>
                    <div className="font-medium">{selectedItem.discoveryXP} XP</div>
                    <div className="text-xs text-gray-500">Discovery</div>
                  </div>
                  <div>
                    <div className="text-blue-600">🔨</div>
                    <div className="font-medium">{selectedItem.craftingXP} XP</div>
                    <div className="text-xs text-gray-500">Crafting</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-4">👆</div>
              <p>Click an item to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Item Details Modal */}
      {selectedItem && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedItem.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTierColor(selectedItem.tier)}`}>
                        T{selectedItem.tier}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                        {selectedItem.rarity}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">{selectedItem.description}</p>

              {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recipe</h4>
                  <div className="space-y-2">
                    {selectedItem.ingredients.map(ingredient => {
                      const sourceItem = allItems.find(item => item.id === ingredient.itemId);
                      return (
                        <div key={ingredient.itemId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <span className="text-xl">{sourceItem?.emoji || '❓'}</span>
                          <div className="flex-1 text-sm">
                            <div className="font-medium">{sourceItem?.name || ingredient.itemId}</div>
                            <div className="text-xs text-gray-500">Qty: {ingredient.quantity}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}