'use client';

import React, { useState, useEffect } from 'react';
import { TamaGameState } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { ADVENTURE_LOCATIONS, ADVENTURE_ITEMS } from '../data/adventureLocations';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { formatResourceCost } from '../utils/resourceUtils';

interface AdventureModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const AdventureModal: React.FC<AdventureModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedTab, setSelectedTab] = useState<'locations' | 'active' | 'inventory'>('locations');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  useEscapeKey(onClose, isVisible);

  // Process completed adventures on component load
  useEffect(() => {
    if (!engine || !isVisible) return;

    const results = engine.getSystems().adventures.processCompletedAdventures(gameState);
    results.forEach(result => {
      if (result.success) {
        const rewards = result.rewards?.length ?
          ` Rewards: ${result.rewards.map(r => `${r.quantity}x ${r.id}`).join(', ')}` : '';
        onNotification(`🎒 ${result.message}${rewards}`, 'achievement');
      } else {
        onNotification(`😞 ${result.message}`, 'info');
      }
    });
  }, [isVisible, engine]);

  if (!isVisible) return null;

  const handleStartAdventure = (locationId: string, tamaId: string) => {
    if (!engine) return;

    const result = engine.getSystems().adventures.startAdventure(tamaId, locationId, gameState);

    if (result.success) {
      onNotification(`🗺️ ${result.message}`, 'info');
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const canAffordLocation = (location: any): boolean => {
    if (!location.costs) return true;

    return (
      (!location.costs.tamaCoins || gameState.resources.tamaCoins >= location.costs.tamaCoins) &&
      (!location.costs.rice_grain || gameState.resources.rice_grain >= location.costs.rice_grain) &&
      (!location.costs.bamboo_fiber || gameState.resources.bamboo_fiber >= location.costs.bamboo_fiber) &&
      (!location.costs.silk_thread || gameState.resources.silk_thread >= location.costs.silk_thread) &&
      (!location.costs.green_tea_leaf || gameState.resources.green_tea_leaf >= location.costs.green_tea_leaf) &&
      (!location.costs.spirit_essence || gameState.resources.spirit_essence >= location.costs.spirit_essence)
    );
  };

  const formatAdventureCost = (costs: any): string => {
    if (!costs) return 'Free';

    // Handle special adventure costs like energy
    const energyCost = costs.energy ? `${costs.energy} ⚡ Energy` : '';
    const resourceCost = formatResourceCost(costs);

    const parts = [resourceCost, energyCost].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Free';
  };

  const formatTimeRemaining = (endTime: number): string => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatRewards = (rewards: any): string => {
    const common = rewards.common.slice(0, 2).map((r: any) => `${r.quantity}x ${r.id.replace('_', ' ')}`);
    const hasMore = rewards.common.length + rewards.uncommon.length + rewards.rare.length > 2;
    return common.join(', ') + (hasMore ? ', ...' : '');
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'extreme': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const availableLocations = engine?.getSystems().adventures.getAvailableLocations(gameState) || [];
  const activeAdventures = gameState.activeAdventures || [];
  const inventory = gameState.inventory || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🗺️ Adventures</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'locations', label: 'Locations', count: availableLocations.length },
            { id: 'active', label: 'Active', count: activeAdventures.length },
            { id: 'inventory', label: 'Inventory', count: Object.keys(inventory).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedTab === 'locations' && (
            <div>
              {availableLocations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className="text-lg font-medium mb-2">No locations available</h3>
                  <p className="text-sm">Complete adventures and level up to unlock new locations!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableLocations.map(location => {
                    const canAfford = canAffordLocation(location);

                    return (
                      <div key={location.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{location.icon}</div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{location.name}</h4>
                              <div className={`text-xs px-2 py-1 rounded-full border inline-flex items-center mt-1 ${getRiskColor(location.riskLevel)}`}>
                                {location.riskLevel} risk
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <div>Level {location.requiredLevel}+</div>
                            <div>{location.baseDuration}m</div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{location.description}</p>

                        <div className="text-xs text-gray-600 mb-3 space-y-1">
                          <div><strong>Cost:</strong> {formatAdventureCost(location.costs)}</div>
                          <div><strong>Success Rate:</strong> {Math.round(location.baseSuccessRate * 100)}% base</div>
                          <div><strong>Rewards:</strong> {formatRewards(location.rewards)}</div>
                        </div>

                        <div className="space-y-2">
                          {gameState.tamas.map(tama => {
                            const canGo = engine?.getSystems().adventures.canTamaGo(tama, location, gameState);
                            const isOnAdventure = activeAdventures.some(adv => adv.tamaId === tama.id);

                            return (
                              <button
                                key={tama.id}
                                onClick={() => handleStartAdventure(location.id, tama.id)}
                                disabled={!canGo?.canGo || !canAfford || isOnAdventure}
                                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                  canGo?.canGo && canAfford && !isOnAdventure
                                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                    : 'bg-gray-50 text-gray-500 border border-gray-200 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{tama.name}</span>
                                  <span className="text-xs">
                                    {isOnAdventure ? '🎒 Adventuring' :
                                     !canGo?.canGo ? canGo?.reason :
                                     !canAfford ? 'Cannot afford' :
                                     '🚀 Send'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  L{tama.level} T{tama.tier} | ⚡{Math.round(tama.needs.energy)}% | 😊{Math.round(tama.needs.happiness)}%
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'active' && (
            <div>
              {activeAdventures.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎒</div>
                  <h3 className="text-lg font-medium mb-2">No active adventures</h3>
                  <p className="text-sm">Send your Tamas on adventures to see their progress here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAdventures.map(adventure => {
                    const location = ADVENTURE_LOCATIONS.find(loc => loc.id === adventure.locationId);
                    const tama = gameState.tamas.find(t => t.id === adventure.tamaId);
                    const progress = engine?.getSystems().adventures.getAdventureProgress(adventure) || 0;
                    const timeRemaining = formatTimeRemaining(adventure.endTime);

                    if (!location || !tama) return null;

                    return (
                      <div key={adventure.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{location.icon}</div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{tama.name} at {location.name}</h4>
                              <div className="text-sm text-gray-600">
                                Success Rate: {Math.round(adventure.successRate * 100)}%
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium text-blue-600">
                              {progress >= 100 ? 'Completed!' : timeRemaining}
                            </div>
                            <div className="text-gray-500">{Math.round(progress)}%</div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        {progress >= 100 && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                            🎉 Adventure completed! Results will appear when you refresh or change tabs.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'inventory' && (
            <div>
              {Object.keys(inventory).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🎒</div>
                  <h3 className="text-lg font-medium mb-2">Empty inventory</h3>
                  <p className="text-sm">Items found during adventures will appear here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(inventory).map(([itemId, quantity]) => {
                    const itemInfo = ADVENTURE_ITEMS[itemId as keyof typeof ADVENTURE_ITEMS];

                    return (
                      <div key={itemId} className="bg-white border rounded-lg p-3 text-center">
                        <div className="text-2xl mb-2">📦</div>
                        <h4 className="font-medium text-sm text-gray-800 mb-1">
                          {itemInfo?.name || itemId.replace('_', ' ')}
                        </h4>
                        <div className="text-xs text-gray-600 mb-2">
                          x{quantity}
                        </div>
                        {itemInfo && (
                          <>
                            <p className="text-xs text-gray-500 mb-2">{itemInfo.description}</p>
                            <div className="text-xs font-medium text-green-600">
                              Value: {itemInfo.sellValue} 🪙
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};