'use client';

import React, { useState } from 'react';
import { TamaData } from '../types';

interface TamaCardProps {
  tama: TamaData;
  onInteract: (tamaId: string, action: 'feed' | 'play' | 'clean') => void;
}

const getSpeciesEmoji = (species: string): string => {
  const emojiMap: Record<string, string> = {
    basic: '🐾',
    forest: '🌲',
    aquatic: '🌊',
    crystal: '💎',
    shadow: '🌙',
    cosmic: '⭐'
  };
  return emojiMap[species] || '🐾';
};

const getTierColor = (tier: number): string => {
  const colorMap: Record<number, string> = {
    0: 'text-gray-600',
    1: 'text-blue-600',
    2: 'text-purple-600',
    3: 'text-gold-600'
  };
  return colorMap[tier] || 'text-gray-600';
};

const getNeedColor = (value: number): string => {
  if (value <= 30) return 'bg-red-50 text-red-800';
  if (value <= 60) return 'bg-yellow-50 text-yellow-800';
  return 'bg-green-50 text-green-800';
};

const getNeedBarColor = (value: number): string => {
  if (value <= 30) return 'bg-red-500';
  if (value <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getMoodStatus = (tama: TamaData): string => {
  const avgNeeds = (tama.needs.hunger + tama.needs.happiness + tama.needs.energy + tama.needs.cleanliness) / 4;
  const lowNeeds = Object.values(tama.needs).filter(need => need <= 30).length;

  if (lowNeeds >= 2) return 'needs attention';
  if (avgNeeds >= 85) return 'happy';
  if (avgNeeds >= 60) return 'content';
  return 'okay';
};

export const TamaCard: React.FC<TamaCardProps> = ({ tama, onInteract }) => {
  const [expanded, setExpanded] = useState(false);

  const moodStatus = getMoodStatus(tama);
  const speciesEmoji = getSpeciesEmoji(tama.species);
  const tierColor = getTierColor(tama.tier);

  const handleInteract = (action: 'feed' | 'play' | 'clean') => {
    onInteract(tama.id, action);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: 'feed' | 'play' | 'clean') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleInteract(action);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
      aria-label={`Tama card for ${tama.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label={`${tama.species} tama`}>
            {speciesEmoji}
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{tama.name}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {tama.species} • <span className={tierColor}>Tier {tama.tier}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">Level {tama.level}</div>
          <div className="text-xs text-gray-500">
            Status: <span className="capitalize">{moodStatus}</span>
          </div>
        </div>
      </div>

      {/* Needs */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Needs</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(tama.needs).map(([need, value]) => (
            <div key={need} className={`p-2 rounded text-xs ${getNeedColor(value)}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium capitalize">{need}</span>
                <span>{value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${getNeedBarColor(value)}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genetics - Always visible */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Genetics</h4>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <div>Cuteness: {tama.genetics.cuteness}</div>
          <div>Intelligence: {tama.genetics.intelligence}</div>
          <div>Energy: {tama.genetics.energy}</div>
          <div>Appetite: {tama.genetics.appetite}</div>
        </div>
      </div>

      {/* Expandable Stats */}
      {expanded && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Total Interactions: {tama.stats.totalInteractions}</div>
            <div>Hours Lived: {tama.stats.hoursLived}</div>
            <div>Jobs Completed: {tama.stats.jobsCompleted}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => handleInteract('feed')}
          onKeyDown={(e) => handleKeyDown(e, 'feed')}
          aria-label={`Feed ${tama.name}`}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          🍎 Feed
        </button>
        <button
          onClick={() => handleInteract('play')}
          onKeyDown={(e) => handleKeyDown(e, 'play')}
          aria-label={`Play with ${tama.name}`}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          🎾 Play
        </button>
        <button
          onClick={() => handleInteract('clean')}
          onKeyDown={(e) => handleKeyDown(e, 'clean')}
          aria-label={`Clean ${tama.name}`}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          🧽 Clean
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Hide details' : 'Show more details'}
          className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
    </div>
  );
};