'use client';

import React, { useState } from 'react';
import { TamaData, TamaGameState } from '../types';

interface TamaCardProps {
  tama: TamaData;
  gameState?: TamaGameState;
  onInteract: (tamaId: string, action: 'feed' | 'play' | 'clean' | 'wakeUp') => void;
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

// Enhanced visual language system for needs
const getNeedEmoji = (need: string, value: number): string => {
  const emojiMaps = {
    hunger: value <= 30 ? '🍽️' : value <= 60 ? '🍎' : '✨',
    happiness: value <= 30 ? '😢' : value <= 60 ? '😊' : '🤩',
    energy: value <= 30 ? '😴' : value <= 60 ? '🌙' : '⚡',
    cleanliness: value <= 30 ? '🧽' : value <= 60 ? '🚿' : '✨'
  };
  return emojiMaps[need as keyof typeof emojiMaps] || '❓';
};

const getNeedColor = (value: number, needType: string, isAsleep: boolean): string => {
  // Special case: energy when sleeping (recovering) - show as recovering instead of urgent
  if (needType === 'energy' && isAsleep) {
    return 'bg-blue-50 text-blue-800 border-blue-200'; // Peaceful blue for sleeping
  }

  if (value <= 30) return 'bg-red-50 text-red-800 border-red-200';
  if (value <= 60) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
  return 'bg-green-50 text-green-800 border-green-200';
};

const getNeedBarColor = (value: number): string => {
  if (value <= 30) return 'bg-red-500';
  if (value <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getNeedStatus = (value: number, needType: string, isAsleep: boolean): string => {
  // Special case: energy when sleeping (recovering)
  if (needType === 'energy' && isAsleep) {
    return 'Recovering...'; // Show as recovering instead of urgent
  }

  if (value <= 30) return 'Urgent!';
  if (value <= 60) return 'Low';
  return 'Good';
};

const getNeedPulse = (value: number, needType: string, isAsleep: boolean): string => {
  // Don't pulse energy when sleeping (it's supposed to be low)
  if (needType === 'energy' && isAsleep) {
    return '';
  }

  if (value <= 30) return 'animate-pulse';
  return '';
};

const formatTimeLived = (hours: number): string => {
  // Convert hours to total seconds for calculations
  const totalSeconds = hours * 3600;

  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)}s`;
  }

  const totalMinutes = totalSeconds / 60;
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)}mn`;
  }

  const totalHours = totalMinutes / 60;
  if (totalHours < 24) {
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }

  const totalDays = totalHours / 24;
  if (totalDays < 7) {
    const d = Math.floor(totalDays);
    const h = Math.round((totalDays - d) * 24);
    return h > 0 ? `${d}day${d > 1 ? 's' : ''}${h}h` : `${d} day${d > 1 ? 's' : ''}`;
  }

  const totalWeeks = totalDays / 7;
  if (totalWeeks < 52) {
    const w = Math.floor(totalWeeks);
    const d = Math.round((totalWeeks - w) * 7);
    return d > 0 ? `${w}week${w > 1 ? 's' : ''}${d}d` : `${w} week${w > 1 ? 's' : ''}`;
  }

  const totalYears = totalWeeks / 52;
  if (totalYears < 10) {
    const y = Math.floor(totalYears);
    const months = Math.round((totalYears - y) * 12);
    return months > 0 ? `${y} year${y > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}` : `${y} year${y > 1 ? 's' : ''}`;
  }

  // For very long times, just show years
  return `${Math.round(totalYears)} years`;
};

const getMoodStatus = (tama: TamaData): string => {
  const avgNeeds = (tama.needs.hunger + tama.needs.happiness + tama.needs.energy + tama.needs.cleanliness) / 4;
  const lowNeeds = Object.values(tama.needs).filter(need => need <= 30).length;

  if (lowNeeds >= 2) return 'needs attention';
  if (avgNeeds >= 85) return 'happy';
  if (avgNeeds >= 60) return 'content';
  return 'okay';
};

export const TamaCard: React.FC<TamaCardProps> = ({ tama, gameState, onInteract }) => {
  const [expanded, setExpanded] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  const moodStatus = getMoodStatus(tama);
  const speciesEmoji = getSpeciesEmoji(tama.species);
  const tierColor = getTierColor(tama.tier);

  // Check if auto-feeder is present to change feed button behavior
  const hasAutoFeeder = gameState?.buildings?.some(b => b.type === 'auto_feeder') || false;

  const handleInteract = (action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    onInteract(tama.id, action);

    // Trigger wiggle animation for interaction feedback
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 600);
  };

  // Check if Tama is asleep
  const isAsleep = tama.sleepState?.isAsleep || false;

  // Smart button styling based on needs and sleep state
  const getActionButtonStyle = (action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    const baseClasses = "flex-1 text-sm py-2 px-3 rounded font-medium btn-animated micro-bounce";

    if (action === 'wakeUp') {
      if (isAsleep) {
        // Wake up button - available when asleep
        return `${baseClasses} text-white bg-indigo-500 hover:bg-indigo-600 animate-pulse shadow-lg border-2 border-indigo-300`;
      } else {
        // Locked/faded when awake
        return `${baseClasses} text-gray-400 bg-gray-200 cursor-not-allowed opacity-50`;
      }
    }

    // Other actions disabled when asleep
    if (isAsleep) {
      return `${baseClasses} text-gray-400 bg-gray-200 cursor-not-allowed opacity-50`;
    }

    // Normal need-based styling when awake
    const needMap = {
      feed: tama.needs.hunger,
      play: tama.needs.happiness,
      clean: tama.needs.cleanliness,
      wakeUp: 100 // Not used
    };

    const needValue = needMap[action];

    if (needValue <= 30) {
      // Urgent - bright, pulsing
      return `${baseClasses} text-white bg-red-500 hover:bg-red-600 animate-pulse shadow-lg border-2 border-red-300`;
    } else if (needValue <= 60) {
      // Recommended - highlighted
      return `${baseClasses} text-white bg-yellow-500 hover:bg-yellow-600 shadow-md border border-yellow-300`;
    } else {
      // Optional - muted
      return `${baseClasses} text-white bg-gray-400 hover:bg-gray-500`;
    }
  };

  const getActionText = (action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    if (action === 'wakeUp') {
      if (isAsleep) {
        return '👁️ Wake Up!';
      } else {
        return '😴 Sleeping'; // Shows when locked/not needed
      }
    }

    // Other actions disabled when asleep
    if (isAsleep) {
      const actionEmoji = {
        feed: '🍎',
        play: '🎾',
        clean: '🧽',
        wakeUp: '👁️'
      };
      return `${actionEmoji[action]} Sleeping...`;
    }

    // Normal need-based text when awake
    const needMap = {
      feed: tama.needs.hunger,
      play: tama.needs.happiness,
      clean: tama.needs.cleanliness,
      wakeUp: 100
    };

    const needValue = needMap[action];

    // Auto-feeder changes feed button to candy button
    const actionEmoji = {
      feed: hasAutoFeeder ? '🍬' : '🍎',
      play: '🎾',
      clean: '🧽',
      wakeUp: '👁️'
    };

    const actionName = action === 'feed' && hasAutoFeeder ? 'Candy' :
                     action.charAt(0).toUpperCase() + action.slice(1);

    if (needValue <= 30) {
      return `${actionEmoji[action]} ${actionName.toUpperCase()}!`;
    } else if (needValue <= 60) {
      return `${actionEmoji[action]} ${actionName}`;
    } else {
      return `${actionEmoji[action]} ${actionName}`;
    }
  };

  const isButtonDisabled = (action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    if (action === 'wakeUp') {
      return !isAsleep; // Disabled when awake
    }
    return isAsleep; // Other actions disabled when asleep
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: 'feed' | 'play' | 'clean' | 'wakeUp') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isButtonDisabled(action)) {
        handleInteract(action);
      }
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 card-hover-lift interactive-glow"
      aria-label={`Tama card for ${tama.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`text-2xl ${isWiggling ? 'tama-wiggle' : ''}`} role="img" aria-label={`${tama.species} tama`}>
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

      {/* Needs - Enhanced Visual Language */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          📊 Needs Status
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(tama.needs).map(([need, value]) => (
            <div key={need} className={`p-3 rounded-lg border-2 text-xs ${getNeedColor(value, need, isAsleep)} ${getNeedPulse(value, need, isAsleep)}`}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-base">{getNeedEmoji(need, value)}</span>
                  <span className="font-medium capitalize">{need}</span>
                </div>
                <span className="font-bold">{Math.round(value)}%</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2 progress-bar">
                  <div
                    className={`h-2 rounded-full progress-bar ${getNeedBarColor(value)} ${value <= 30 ? 'progress-pulse' : ''}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{getNeedStatus(value, need, isAsleep)}</span>
              </div>
              {value <= 30 && !(need === 'energy' && isAsleep) && (
                <div className="text-xs font-medium text-red-600 mt-1">
                  ⚠️ Needs attention!
                </div>
              )}
              {need === 'energy' && isAsleep && (
                <div className="text-xs font-medium text-blue-600 mt-1">
                  😴 Restoring energy...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Genetics - Always visible */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Genetics</h4>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <div>Cuteness: {tama.genetics.cuteness.toFixed(1)}%</div>
          <div>Intelligence: {tama.genetics.intelligence.toFixed(1)}%</div>
          <div>Energy: {tama.genetics.energy.toFixed(1)}%</div>
          <div>Appetite: {tama.genetics.appetite.toFixed(1)}%</div>
        </div>
      </div>

      {/* Expandable Stats */}
      {expanded && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Total Interactions: {tama.stats.totalInteractions}</div>
            <div>Age: {formatTimeLived(tama.stats.hoursLived)}</div>
            <div>Jobs Completed: {tama.stats.jobsCompleted}</div>
          </div>
        </div>
      )}

      {/* Smart Action Buttons - Visual Priority Based on Needs & Sleep State */}
      {isAsleep && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">😴</span>
            <span className="font-medium">{tama.name} is sleeping peacefully...</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Energy is recovering slowly. Wake them up or unlock auto-wakeup through skills!
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => !isButtonDisabled('feed') && handleInteract('feed')}
            onKeyDown={(e) => handleKeyDown(e, 'feed')}
            disabled={isButtonDisabled('feed')}
            aria-label={`Feed ${tama.name} (Hunger: ${Math.round(tama.needs.hunger)}%)`}
            className={getActionButtonStyle('feed')}
            title={isAsleep ? 'Cannot feed while sleeping' : `Hunger: ${Math.round(tama.needs.hunger)}% - ${tama.needs.hunger <= 30 ? 'Urgent!' : tama.needs.hunger <= 60 ? 'Recommended' : 'Optional'}`}
          >
            {getActionText('feed')}
          </button>
          <button
            onClick={() => !isButtonDisabled('play') && handleInteract('play')}
            onKeyDown={(e) => handleKeyDown(e, 'play')}
            disabled={isButtonDisabled('play')}
            aria-label={`Play with ${tama.name} (Happiness: ${Math.round(tama.needs.happiness)}%)`}
            className={getActionButtonStyle('play')}
            title={isAsleep ? 'Cannot play while sleeping' : `Happiness: ${Math.round(tama.needs.happiness)}% - ${tama.needs.happiness <= 30 ? 'Urgent!' : tama.needs.happiness <= 60 ? 'Recommended' : 'Optional'}`}
          >
            {getActionText('play')}
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => !isButtonDisabled('clean') && handleInteract('clean')}
            onKeyDown={(e) => handleKeyDown(e, 'clean')}
            disabled={isButtonDisabled('clean')}
            aria-label={`Clean ${tama.name} (Cleanliness: ${Math.round(tama.needs.cleanliness)}%)`}
            className={getActionButtonStyle('clean')}
            title={isAsleep ? 'Cannot clean while sleeping' : `Cleanliness: ${Math.round(tama.needs.cleanliness)}% - ${tama.needs.cleanliness <= 30 ? 'Urgent!' : tama.needs.cleanliness <= 60 ? 'Recommended' : 'Optional'}`}
          >
            {getActionText('clean')}
          </button>
          <button
            onClick={() => !isButtonDisabled('wakeUp') && handleInteract('wakeUp')}
            onKeyDown={(e) => handleKeyDown(e, 'wakeUp')}
            disabled={isButtonDisabled('wakeUp')}
            aria-label={isAsleep ? `Wake up ${tama.name}` : 'Not sleeping'}
            className={getActionButtonStyle('wakeUp')}
            title={isAsleep ? 'Wake up your sleeping Tama!' : 'Tama is awake - they will sleep automatically when energy is low'}
          >
            {getActionText('wakeUp')}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Hide details' : 'Show more details'}
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded btn-animated micro-bounce"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
    </div>
  );
};