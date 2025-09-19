'use client';

import React from 'react';
import { GameResources } from '../types';

interface ResourceBarProps {
  resources: GameResources;
  compact?: boolean;
}

interface ResourceConfig {
  key: keyof GameResources;
  name: string;
  icon: string;
  priority: number;
  lowThreshold: number;
}

const resourceConfigs: ResourceConfig[] = [
  { key: 'tamaCoins', name: 'Tama Coins', icon: '🪙', priority: 1, lowThreshold: 100 },
  { key: 'berries', name: 'Berries', icon: '🍎', priority: 2, lowThreshold: 10 },
  { key: 'wood', name: 'Wood', icon: '🪵', priority: 3, lowThreshold: 5 },
  { key: 'stone', name: 'Stone', icon: '🪨', priority: 4, lowThreshold: 5 },
  { key: 'happinessStars', name: 'Happiness Stars', icon: '⭐', priority: 5, lowThreshold: 0 },
  { key: 'evolutionCrystals', name: 'Evolution Crystals', icon: '💎', priority: 6, lowThreshold: 0 }
];

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const getResourceColor = (value: number, threshold: number): string => {
  if (value <= threshold) return 'text-red-600';
  if (value <= threshold * 3) return 'text-yellow-600';
  return 'text-green-600';
};

export const ResourceBar: React.FC<ResourceBarProps> = ({ resources, compact = false }) => {
  const displayResources = compact
    ? resourceConfigs.filter(config => config.priority <= 4) // Show top 4 in compact mode
    : resourceConfigs;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${compact ? 'py-1 px-2' : 'py-3 px-4'}`}
      role="region"
      aria-label="Current resources and inventory"
    >
      <div className="sr-only">Current resources</div>

      <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-6 gap-4'} items-center`}>
        {displayResources.map((config, index) => {
          const value = resources[config.key];
          const colorClass = getResourceColor(value, config.lowThreshold);
          const isPrimary = config.priority <= 2;

          return (
            <div
              key={config.key}
              className={`
                flex items-center space-x-1
                ${isPrimary && !compact ? 'border-r border-gray-200 pr-4' : ''}
                ${index === 1 && !compact ? 'border-r-0' : ''}
                ${compact ? 'text-sm' : ''}
              `}
              aria-label={`${config.name}: ${formatNumber(value)}`}
            >
              <span
                className={`${compact ? 'text-lg' : 'text-xl'}`}
                role="img"
                aria-label={config.name}
              >
                {config.icon}
              </span>
              <div className={`${compact ? 'min-w-0' : ''}`}>
                {!compact && (
                  <div className="text-xs text-gray-500 font-medium">
                    {config.name}
                  </div>
                )}
                <div className={`font-bold ${colorClass} ${compact ? 'text-sm' : 'text-lg'}`}>
                  {formatNumber(value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};