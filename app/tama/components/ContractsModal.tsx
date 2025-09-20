'use client';

import React, { useState } from 'react';
import { TamaGameState, Customer, Contract } from '../types';
import { TamaEngine } from '../engine/TamaEngine';

interface ContractsModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const ContractsModal: React.FC<ContractsModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedTab, setSelectedTab] = useState<'customers' | 'active' | 'history'>('customers');

  if (!isVisible) return null;

  const handleCreateContract = (customerId: string) => {
    if (!engine) return;

    const customer = gameState.customers.find(c => c.id === customerId);
    if (!customer) return;

    const contract = engine.getSystems().customers.generateContract(customer, gameState);
    gameState.activeContracts.push(contract);

    const result = { success: true, payment: contract.payment.baseAmount, message: 'Contract created' };

    if (result.success) {
      onNotification(`📋 New contract created! Payment: ${result.payment} 🪙`, 'info');
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const handleAssignTama = (contractId: string, tamaId: string) => {
    if (!engine) return;

    const result = engine.getSystems().customers.assignTamaToContract(contractId, tamaId, gameState);

    if (result.success) {
      onNotification('✅ Tama assigned to contract!', 'info');
    } else {
      onNotification(`❌ ${result.message}`, 'info');
    }
  };

  const getCustomerArchetypeColor = (archetype: string): string => {
    switch (archetype) {
      case 'demanding': return 'text-red-600 bg-red-50';
      case 'wealthy': return 'text-purple-600 bg-purple-50';
      case 'collector': return 'text-blue-600 bg-blue-50';
      case 'breeder': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCustomerArchetypeIcon = (archetype: string): string => {
    switch (archetype) {
      case 'demanding': return '⚡';
      case 'wealthy': return '💎';
      case 'collector': return '🏆';
      case 'breeder': return '🌱';
      default: return '👤';
    }
  };

  const formatTimeRemaining = (endTime: number): string => {
    const remaining = Math.max(0, endTime - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canAccessContracts = gameState.progression.level >= 5 && gameState.tamas.length >= 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Contracts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {!canAccessContracts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <span>⚠️</span>
              <div>
                <div className="font-medium">Contracts Locked</div>
                <div className="text-sm">
                  Requires: Level 5 + 3 Tamas
                  {gameState.progression.level < 5 && ` (Currently Level ${gameState.progression.level})`}
                  {gameState.tamas.length < 3 && ` • Need ${3 - gameState.tamas.length} more Tamas`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'customers', label: 'Customers', count: gameState.customers.length },
            { id: 'active', label: 'Active Contracts', count: gameState.activeContracts.length },
            { id: 'history', label: 'Completed', count: 0 }
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
          {selectedTab === 'customers' && (
            <div>
              {gameState.customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium mb-2">No customers yet</h3>
                  <p className="text-sm">Customers will appear automatically as you level up!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gameState.customers.map(customer => {
                    const hasActiveContract = gameState.activeContracts.some(c => c.customerId === customer.id);

                    return (
                      <div key={customer.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-800">{customer.name}</h4>
                            <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${getCustomerArchetypeColor(customer.archetype)}`}>
                              <span>{getCustomerArchetypeIcon(customer.archetype)}</span>
                              <span>{customer.archetype}</span>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-500">Reputation</div>
                            <div className={`font-medium ${
                              customer.reputation >= 80 ? 'text-green-600' :
                              customer.reputation >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {customer.reputation}/100
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 mb-3">
                          <div className="mb-1">
                            <span className="font-medium">Prefers:</span> {customer.preferences.preferredSpecies.join(', ')}
                          </div>
                          <div className="mb-1">
                            <span className="font-medium">Min Tier:</span> {customer.preferences.minTier}
                          </div>
                          <div className="mb-1">
                            <span className="font-medium">Payment:</span> {Math.round(customer.paymentMultiplier * 100)}% base rate
                          </div>
                          <div>
                            <span className="font-medium">Patience:</span> {customer.patience} days
                          </div>
                        </div>

                        <button
                          onClick={() => handleCreateContract(customer.id)}
                          disabled={!canAccessContracts || hasActiveContract}
                          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                            !canAccessContracts
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : hasActiveContract
                              ? 'bg-yellow-200 text-yellow-700 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {!canAccessContracts ? '🔒 Contracts Locked' :
                           hasActiveContract ? '⏳ Contract Active' :
                           '📋 Create Contract'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'active' && (
            <div>
              {gameState.activeContracts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium mb-2">No active contracts</h3>
                  <p className="text-sm">Create contracts with customers to start earning!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gameState.activeContracts.map(contract => {
                    const customer = gameState.customers.find(c => c.id === contract.customerId);
                    const assignedTama = contract.tamaId ?
                      gameState.tamas.find(t => t.id === contract.tamaId) : null;

                    if (!customer) return null;

                    return (
                      <div key={contract.id} className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium text-gray-800">Contract with {customer.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getCustomerArchetypeColor(customer.archetype)}`}>
                                {getCustomerArchetypeIcon(customer.archetype)} {customer.archetype}
                              </span>
                              <span className="text-xs text-gray-500">
                                Payment: {contract.payment.baseAmount} 🪙
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-500">Status</div>
                            <div className={`font-medium ${
                              contract.status === 'active' ? 'text-green-600' :
                              contract.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {contract.status}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Requirements</h5>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Duration: {Math.floor(contract.requirements.duration / 1000)}s</div>
                              <div>Care Level: {contract.requirements.careLevel}/10</div>
                              <div>Special: {contract.requirements.specialRequests.join(', ') || 'None'}</div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2">Assigned Tama</h5>
                            {assignedTama ? (
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <div className="text-sm font-medium text-green-800">
                                  {assignedTama.name}
                                </div>
                                <div className="text-xs text-green-600">
                                  {assignedTama.species} • Tier {assignedTama.tier} • Level {assignedTama.level}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <select
                                  className="w-full p-2 border rounded text-sm mb-2"
                                  onChange={(e) => e.target.value && handleAssignTama(contract.id, e.target.value)}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select a Tama...</option>
                                  {gameState.tamas.map(tama => (
                                    <option key={tama.id} value={tama.id}>
                                      {tama.name} - {tama.species} T{tama.tier} L{tama.level}
                                    </option>
                                  ))}
                                </select>
                                <div className="text-xs text-gray-500">
                                  Choose a Tama that matches the requirements
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-lg font-medium mb-2">Contract History</h3>
              <p className="text-sm">Completed contracts will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};