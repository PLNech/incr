'use client';

import React from 'react';
import { GameResources } from '../types';
import { RESOURCE_CONFIGS, ResourceConfig } from '../utils/resourceUtils';

interface ResourceBarProps {
  resources: GameResources;
  compact?: boolean;
}


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
    ? RESOURCE_CONFIGS.filter(config => config.priority <= 5) // Show top 5 in compact mode (coin + 4 materials)
    : RESOURCE_CONFIGS;

  return (
    <div
      className={`bg-gradient-to-r from-amber-50 via-green-50 to-purple-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden ${compact ? 'py-2 px-3' : 'py-3 px-4'}`}
      role="region"
      aria-label="Japanese crafting materials and resources"
    >
      <div className="sr-only">Current resources</div>

      <div className={`grid ${compact ? 'grid-cols-5 gap-2' : 'grid-cols-7 gap-3'} items-center`}>
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
                <div
                  className={`font-bold ${colorClass} ${compact ? 'text-sm' : 'text-lg'} resource-increment`}
                  data-increment=""
                >
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