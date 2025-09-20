'use client';

import React from 'react';
import { TamaGameState } from '../types';

interface NextGoalIndicatorProps {
  gameState: TamaGameState;
  onSkillsClick?: () => void;
}

interface Goal {
  title: string;
  description: string;
  icon: string;
  priority: number;
  completed: boolean;
  actionText?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export const NextGoalIndicator: React.FC<NextGoalIndicatorProps> = ({ gameState, onSkillsClick }) => {
  const getNextGoals = (): Goal[] => {
    const goals: Goal[] = [];

    // No Tamas - highest priority
    if (gameState.tamas.length === 0) {
      goals.push({
        title: 'Create Your First Tama',
        description: 'Click the "+ New Tama" button to get started!',
        icon: '🐣',
        priority: 1,
        completed: false,
        actionText: 'Click + New Tama'
      });
    }

    // Low-maintenance Tamas
    const needyCamas = gameState.tamas.filter(tama =>
      tama.needs.hunger < 30 || tama.needs.happiness < 30 || tama.needs.cleanliness < 30
    );
    if (needyCamas.length > 0) {
      goals.push({
        title: 'Care for Your Tamas',
        description: `${needyCamas.length} Tama${needyCamas.length > 1 ? 's' : ''} need attention!`,
        icon: '💚',
        priority: 2,
        completed: false,
        actionText: 'Feed, Play, or Clean'
      });
    }

    // Skill points available
    if (gameState.progression.skillPoints > 0) {
      goals.push({
        title: 'Spend Skill Points',
        description: `You have ${gameState.progression.skillPoints} skill points to spend!`,
        icon: '🌟',
        priority: 3,
        completed: false,
        actionText: 'Spend your skill points',
        clickable: true,
        onClick: onSkillsClick
      });
    }

    // Level 2 - Buildings unlock
    if (gameState.progression.level === 1) {
      const expNeeded = 25 - gameState.progression.experience; // Level 2 requires 25 XP
      goals.push({
        title: 'Reach Level 2',
        description: `${expNeeded} more XP to unlock buildings!`,
        icon: '🏠',
        priority: 4,
        completed: false,
        actionText: 'Interact with Tamas for XP'
      });
    }

    // Level 3 - Crafting unlock
    if (gameState.progression.level === 2) {
      goals.push({
        title: 'Reach Level 3',
        description: 'Unlock crafting system and better items!',
        icon: '🔨',
        priority: 4,
        completed: false,
        actionText: 'Keep caring for Tamas'
      });
    }

    // Level 5 - Specialization
    if (gameState.progression.level >= 3 && gameState.progression.level < 5) {
      goals.push({
        title: 'Reach Level 5',
        description: 'Choose your specialization path!',
        icon: '⚡',
        priority: 4,
        completed: false,
        actionText: 'Continue gaining XP'
      });
    }

    // Specialization choice
    if (gameState.progression.level >= 5 && !gameState.progression.specialization) {
      goals.push({
        title: 'Choose Specialization',
        description: 'Pick Caretaker, Breeder, or Entrepreneur!',
        icon: '🎓',
        priority: 2,
        completed: false,
        actionText: 'Choose your specialization',
        clickable: true,
        onClick: onSkillsClick
      });
    }

    // More Tamas for contracts
    if (gameState.progression.level >= 5 && gameState.tamas.length < 3) {
      goals.push({
        title: 'Raise More Tamas',
        description: `Need ${3 - gameState.tamas.length} more Tamas to unlock contracts!`,
        icon: '📋',
        priority: 5,
        completed: false,
        actionText: 'Create more Tamas'
      });
    }

    // Tama levels
    const lowLevelTamas = gameState.tamas.filter(tama => tama.level < 5);
    if (lowLevelTamas.length > 0 && gameState.progression.level >= 3) {
      goals.push({
        title: 'Level Up Your Tamas',
        description: `${lowLevelTamas.length} Tama${lowLevelTamas.length > 1 ? 's' : ''} can grow stronger!`,
        icon: '📈',
        priority: 6,
        completed: false,
        actionText: 'Keep caring for them'
      });
    }

    // Prestige preparation
    if (gameState.progression.level >= 25) {
      const tier3Count = gameState.tamas.filter(t => t.tier >= 3).length;
      if (gameState.progression.level < 50 || gameState.tamas.length < 5 || tier3Count < 2) {
        goals.push({
          title: 'Prepare for Prestige',
          description: `Need Level 50, 5 Tamas, and 2 Tier 3+ Tamas`,
          icon: '✨',
          priority: 7,
          completed: false,
          actionText: 'Keep growing your ranch'
        });
      }
    }

    return goals.sort((a, b) => a.priority - b.priority);
  };

  const goals = getNextGoals();
  const topGoal = goals[0];

  if (!topGoal) {
    return (
      <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🎉</span>
          <div>
            <h3 className="font-bold text-green-800">Great job!</h3>
            <p className="text-sm text-green-700">You're doing well! Keep caring for your Tamas and exploring new features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{topGoal.icon}</span>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Next Goal</h3>
            <h4 className="font-semibold text-blue-800">{topGoal.title}</h4>
          </div>
        </div>
        {goals.length > 1 && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            +{goals.length - 1} more
          </div>
        )}
      </div>

      <p className="text-sm text-gray-700 mb-3">{topGoal.description}</p>

      {topGoal.actionText && (
        <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
          {topGoal.clickable && topGoal.onClick ? (
            <button
              onClick={topGoal.onClick}
              className="text-xs font-medium text-blue-800 hover:text-blue-900 underline cursor-pointer transition-colors"
            >
              💡 {topGoal.actionText}
            </button>
          ) : (
            <p className="text-xs font-medium text-blue-800">💡 {topGoal.actionText}</p>
          )}
        </div>
      )}

      {/* Show additional goals if there are multiple */}
      {goals.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Other Goals:</p>
          <div className="space-y-1">
            {goals.slice(1, 3).map((goal, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <span className="mr-2">{goal.icon}</span>
                <span>{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};