'use client';

import React, { useState, useEffect } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CompensationMessage {
  title: string;
  message: string;
}

interface CompensationModalProps {
  isVisible: boolean;
  onClose: () => void;
  compensationData: {
    message: CompensationMessage;
    rewards: {
      resources: Record<string, number>;
      tamaName: string;
      tamaSpecies: string;
      tamaTier: number;
    };
  };
}

export const CompensationModal: React.FC<CompensationModalProps> = ({
  isVisible,
  onClose,
  compensationData
}) => {
  const [showRewards, setShowRewards] = useState(false);

  useEscapeKey(onClose, isVisible);

  // Auto-show rewards after 3 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowRewards(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowRewards(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const { message, rewards } = compensationData;

  const getResourceIcon = (resourceKey: string) => {
    const icons: Record<string, string> = {
      tamaCoins: '🪙',
      berries: '🍎',
      wood: '🪵',
      stone: '🪨',
      happinessStars: '⭐',
      evolutionCrystals: '💎'
    };
    return icons[resourceKey] || '📦';
  };

  const formatResourceName = (resourceKey: string) => {
    const names: Record<string, string> = {
      tamaCoins: 'Tama Coins',
      berries: 'Berries',
      wood: 'Wood',
      stone: 'Stone',
      happinessStars: 'Happiness Stars',
      evolutionCrystals: 'Evolution Crystals'
    };
    return names[resourceKey] || resourceKey;
  };

  const getTierColor = (tier: number) => {
    const colors = ['text-gray-600', 'text-green-600', 'text-blue-600', 'text-purple-600'];
    return colors[tier] || 'text-gray-600';
  };

  const getTierName = (tier: number) => {
    const names = ['Common', 'Uncommon', 'Rare', 'Epic'];
    return names[tier] || 'Common';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce">🎭</div>
              <div>
                <h2 className="text-2xl font-bold">{message.title}</h2>
                <p className="text-blue-100 text-sm mt-1">The Department of Digital Affairs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-xl p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Message */}
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed text-lg">
              {message.message}
            </p>
          </div>

          {/* Compensation Package */}
          <div className={`transition-all duration-500 ${
            showRewards ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🎁</div>
                <h3 className="text-xl font-bold text-gray-800">Compensation Package</h3>
              </div>

              {/* Resources */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(rewards.resources).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3 border border-yellow-200 text-center">
                    <div className="text-2xl mb-1">{getResourceIcon(key)}</div>
                    <div className="font-bold text-lg text-gray-800">{value.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">{formatResourceName(key)}</div>
                  </div>
                ))}
              </div>

              {/* Special Tama */}
              <div className="bg-white rounded-lg p-4 border-2 border-yellow-300 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  BONUS!
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🐾</div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">Special Compensation Tama</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{rewards.tamaName}</span>
                      <span className="text-gray-500">•</span>
                      <span className="capitalize">{rewards.tamaSpecies}</span>
                      <span className="text-gray-500">•</span>
                      <span className={`font-medium ${getTierColor(rewards.tamaTier)}`}>
                        {getTierName(rewards.tamaTier)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      High stats, great personality, and definitely not involved in any
                      {rewards.tamaTier >= 2 ? ' classified experiments' : ' suspicious activities'}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Message */}
          {showRewards && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Remember:</span> Progress is the enemy of perfection,
                but perfection is the enemy of getting anything done at all.
              </p>
              <p className="text-blue-600 text-xs mt-2">
                — The Philosophers' Guild of Software Development
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {showRewards ? 'Your compensation has been applied' : 'Calculating compensation...'}
            </div>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {showRewards ? '🎉 Awesome!' : '⏳ Processing...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};