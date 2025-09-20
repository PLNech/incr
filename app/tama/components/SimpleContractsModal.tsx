'use client';

import React, { useState, useEffect } from 'react';
import { SimpleContract } from '../types-simple-contracts';
import { TamaGameState } from '../types';

interface SimpleContractsModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  onAcceptContract: (contractId: string) => void;
  onSellResources: (contractId: string, resourceType: string, quantity: number) => void;
  onSubmitCraftedItem: (contractId: string, itemId: string, quantity: number) => void;
  availableContracts: SimpleContract[];
  activeContracts: SimpleContract[];
}

export const SimpleContractsModal: React.FC<SimpleContractsModalProps> = ({
  isVisible,
  onClose,
  gameState,
  onAcceptContract,
  onSellResources,
  onSubmitCraftedItem,
  availableContracts,
  activeContracts
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  if (!isVisible) return null;

  const renderAvailableContract = (contract: SimpleContract) => (
    <div key={contract.id} className="border border-gray-300 rounded-lg p-4 mb-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-gray-800">{contract.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              contract.type === 'sales' ? 'bg-green-100 text-green-800' :
              contract.type === 'crafting' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {contract.type.charAt(0).toUpperCase() + contract.type.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              {Math.floor(contract.timeLimit)} hours remaining
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{contract.description}</p>

      {/* Requirements */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h5 className="font-semibold text-gray-800 mb-2">📋 What you need to do:</h5>
        {contract.type === 'sales' && contract.requirements.sell && (
          <div className="space-y-1">
            {Object.entries(contract.requirements.sell).map(([resource, quantity]) => {
              // Handle both number and array cases
              const displayQuantity = typeof quantity === 'number' ? quantity : `${quantity.length} items`;
              const resourceName = typeof quantity === 'number' ? resource : `${resource} items`;

              return (
                <div key={resource} className="flex justify-between">
                  <span>Sell {displayQuantity} {resourceName}</span>
                  <span className="text-sm text-gray-600">
                    (You have: {(gameState.resources as any)[resource] || 0})
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {contract.type === 'crafting' && contract.requirements.craft && (
          <div>
            <div className="flex justify-between">
              <span>Craft {contract.requirements.craft.quantity} {contract.requirements.craft.itemId.replace('_', ' ')}</span>
            </div>
          </div>
        )}
        {contract.type === 'care' && contract.requirements.care && (
          <div className="space-y-1">
            <div>Keep {contract.requirements.care.minimumTamas} Tama{contract.requirements.care.minimumTamas > 1 ? 's' : ''}</div>
            <div>At {contract.requirements.care.minimumHappiness}% happiness minimum</div>
            <div>At {contract.requirements.care.minimumHealth}% health minimum</div>
            <div>For {contract.requirements.care.duration} hours straight</div>
          </div>
        )}
      </div>

      {/* Rewards */}
      <div className="bg-green-50 p-3 rounded-lg mb-4">
        <h5 className="font-semibold text-green-800 mb-2">💰 Your reward:</h5>
        <div className="flex flex-wrap gap-3">
          <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
            💰 {contract.reward.tamaCoins} coins
          </span>
          {contract.reward.rice_grain && (
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-medium">
              🌾 {contract.reward.rice_grain} rice grain
            </span>
          )}
          {contract.reward.bamboo_fiber && (
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-medium">
              🎋 {contract.reward.bamboo_fiber} bamboo fiber
            </span>
          )}
          {contract.reward.silk_thread && (
            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-sm font-medium">
              🧵 {contract.reward.silk_thread} silk thread
            </span>
          )}
          {contract.reward.green_tea_leaf && (
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm font-medium">
              🍃 {contract.reward.green_tea_leaf} tea leaf
            </span>
          )}
          {contract.reward.spirit_essence && (
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm font-medium">
              🔮 {contract.reward.spirit_essence} spirit essence
            </span>
          )}
          {contract.reward.experience && (
            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-sm font-medium">
              ⭐ {contract.reward.experience} XP
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onAcceptContract(contract.id)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium btn-animated btn-success"
      >
        Accept Contract
      </button>
    </div>
  );

  const renderActiveContract = (contract: SimpleContract) => (
    <div key={contract.id} className="border border-blue-300 rounded-lg p-4 mb-4 bg-blue-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-gray-800">{contract.title}</h4>
          <span className="text-sm text-blue-600 font-medium">Active Contract</span>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{contract.description}</p>

      {/* Progress */}
      <div className="bg-white p-3 rounded-lg mb-4">
        <h5 className="font-semibold text-gray-800 mb-2">📊 Progress:</h5>

        {contract.type === 'sales' && contract.requirements.sell && contract.progress?.sold && (
          <div className="space-y-2">
            {Object.entries(contract.requirements.sell).map(([resource, required]) => {
              const requiredAmount = typeof required === 'number' ? required : required.length;
              const sold = (contract.progress?.sold as any)?.[resource] || 0;
              const remaining = requiredAmount - sold;

              return (
                <div key={resource} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{resource}: {sold}/{requiredAmount}</span>
                    <div className="flex items-center gap-2">
                      {remaining > 0 && (
                        <>
                          <input
                            type="number"
                            min="1"
                            max={Math.min(remaining, (gameState.resources as any)[resource] || 0)}
                            className="w-16 px-2 py-1 border rounded text-sm"
                            id={`sell-${contract.id}-${resource}`}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`sell-${contract.id}-${resource}`) as HTMLInputElement;
                              const quantity = parseInt(input.value) || 0;
                              if (quantity > 0) {
                                onSellResources(contract.id, resource, quantity);
                                input.value = '';
                              }
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm btn-animated btn-success"
                          >
                            Sell
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(sold / requiredAmount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {contract.type === 'crafting' && contract.requirements.craft && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>
                {contract.requirements.craft.itemId.replace('_', ' ')}:
                {contract.progress?.crafted?.quantity || 0}/{contract.requirements.craft.quantity}
              </span>
              <div className="flex items-center gap-2">
                {(() => {
                  const itemId = contract.requirements.craft!.itemId;
                  const currentInventory = gameState.inventory?.[itemId] || 0;
                  const remainingNeeded = contract.requirements.craft!.quantity - (contract.progress?.crafted?.quantity || 0);
                  const maxSubmittable = Math.min(remainingNeeded, currentInventory);

                  return (
                    <>
                      <span className="text-xs text-gray-600">
                        (Have: {currentInventory})
                      </span>
                      <input
                        type="number"
                        min="1"
                        max={maxSubmittable}
                        className="w-16 px-2 py-1 border rounded text-sm"
                        id={`craft-${contract.id}`}
                        disabled={currentInventory === 0}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`craft-${contract.id}`) as HTMLInputElement;
                          const quantity = parseInt(input.value) || 0;
                          if (quantity > 0) {
                            onSubmitCraftedItem(contract.id, contract.requirements.craft!.itemId, quantity);
                            input.value = '';
                          }
                        }}
                        disabled={currentInventory === 0}
                        className={`px-2 py-1 rounded text-sm btn-animated ${
                          currentInventory > 0
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Submit
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((contract.progress?.crafted?.quantity || 0) / contract.requirements.craft.quantity) * 100}%`
                }}
              />
            </div>
            {(() => {
              const itemId = contract.requirements.craft!.itemId;
              const currentInventory = gameState.inventory?.[itemId] || 0;
              if (currentInventory === 0) {
                return (
                  <div className="text-amber-600 text-sm font-medium">
                    ⚠️ No {itemId.replace('_', ' ')} in inventory - craft some first!
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {contract.type === 'care' && contract.requirements.care && contract.progress?.care && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Time:</span> {contract.progress.care.hoursCompleted.toFixed(1)}/{contract.requirements.care.duration}h
              </div>
              <div>
                <span className="font-medium">Happiness:</span> {contract.progress.care.currentAverageHappiness.toFixed(1)}%
                (need {contract.requirements.care.minimumHappiness}%+)
              </div>
              <div>
                <span className="font-medium">Health:</span> {contract.progress.care.currentAverageHealth.toFixed(1)}%
                (need {contract.requirements.care.minimumHealth}%+)
              </div>
              <div>
                <span className="font-medium">Tamas:</span> {gameState.tamas.length}/{contract.requirements.care.minimumTamas}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(contract.progress.care.hoursCompleted / contract.requirements.care.duration) * 100}%`
                }}
              />
            </div>
            {(contract.progress.care.currentAverageHappiness < contract.requirements.care.minimumHappiness ||
              contract.progress.care.currentAverageHealth < contract.requirements.care.minimumHealth ||
              gameState.tamas.length < contract.requirements.care.minimumTamas) && (
              <div className="text-amber-600 text-sm font-medium">
                ⚠️ Requirements not met - progress paused
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col modal-content">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Contracts</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl btn-animated micro-bounce"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded font-medium btn-animated tab-slide-indicator ${
                activeTab === 'available'
                  ? 'bg-blue-500 text-white active'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Available ({availableContracts.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded font-medium btn-animated tab-slide-indicator ${
                activeTab === 'active'
                  ? 'bg-blue-500 text-white active'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active ({activeContracts.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'available' && (
            <div>
              {availableContracts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No contracts available right now.</p>
                  <p className="text-sm mt-2">Check back later for new opportunities!</p>
                </div>
              ) : (
                availableContracts.map(renderAvailableContract)
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div>
              {activeContracts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>You don't have any active contracts.</p>
                  <p className="text-sm mt-2">Accept some contracts from the Available tab!</p>
                </div>
              ) : (
                activeContracts.map(renderActiveContract)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};