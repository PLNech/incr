'use client';

import React, { useState } from 'react';
import { TamaGameState, SkillTree } from '../types';
import { TamaEngine } from '../engine/TamaEngine';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface SkillsModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  engine: TamaEngine | null;
  onNotification: (message: string, type: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

interface SkillNodeDisplay {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  effects: Record<string, number>;
  prerequisites?: string[];
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  isVisible,
  onClose,
  gameState,
  engine,
  onNotification
}) => {
  const [selectedTree, setSelectedTree] = useState<'caretaker' | 'breeder' | 'entrepreneur'>('caretaker');

  useEscapeKey(onClose, isVisible);

  if (!isVisible || !engine) return null;

  const skillTree = engine.getSystems().progression.getSkillTree(gameState);
  const canChooseSpecialization = gameState.progression.level >= 5 && !gameState.progression.specialization;

  const handleLearnSkill = (treeKey: string, skillId: string) => {
    const result = engine.getSystems().progression.learnSkill(gameState, treeKey, skillId);
    if (result.success) {
      onNotification(`Learned ${skillId}! ${result.message}`, 'info');
    } else {
      onNotification(result.message, 'info');
    }
  };

  const handleChooseSpecialization = (specialization: 'caretaker' | 'breeder' | 'entrepreneur') => {
    const result = engine.getSystems().progression.chooseSpecialization(gameState, specialization);
    if (result.success) {
      onNotification(`Specialization chosen: ${specialization}!`, 'levelup');
      onClose();
    } else {
      onNotification(result.message, 'info');
    }
  };

  const getSkillColorClasses = (treeKey: string) => {
    switch (treeKey) {
      case 'caretaker': return {
        border: 'border-blue-500',
        borderLight: 'border-blue-300',
        borderHover: 'hover:border-blue-400',
        bg: 'bg-blue-50',
        bgTab: 'bg-blue-100',
        borderTab: 'border-blue-500',
        text: 'text-blue-800',
        textLight: 'text-blue-700',
        textTab: 'text-blue-700',
        bgBadge: 'bg-blue-100',
        borderBadge: 'border-blue-200',
        button: 'bg-blue-500 hover:bg-blue-600',
        textButton: 'text-blue-600'
      };
      case 'breeder': return {
        border: 'border-green-500',
        borderLight: 'border-green-300',
        borderHover: 'hover:border-green-400',
        bg: 'bg-green-50',
        bgTab: 'bg-green-100',
        borderTab: 'border-green-500',
        text: 'text-green-800',
        textLight: 'text-green-700',
        textTab: 'text-green-700',
        bgBadge: 'bg-green-100',
        borderBadge: 'border-green-200',
        button: 'bg-green-500 hover:bg-green-600',
        textButton: 'text-green-600'
      };
      case 'entrepreneur': return {
        border: 'border-yellow-500',
        borderLight: 'border-yellow-300',
        borderHover: 'hover:border-yellow-400',
        bg: 'bg-yellow-50',
        bgTab: 'bg-yellow-100',
        borderTab: 'border-yellow-500',
        text: 'text-yellow-800',
        textLight: 'text-yellow-700',
        textTab: 'text-yellow-700',
        bgBadge: 'bg-yellow-100',
        borderBadge: 'border-yellow-200',
        button: 'bg-yellow-500 hover:bg-yellow-600',
        textButton: 'text-yellow-600'
      };
      default: return {
        border: 'border-gray-500',
        borderLight: 'border-gray-300',
        borderHover: 'hover:border-gray-400',
        bg: 'bg-gray-50',
        bgTab: 'bg-gray-100',
        borderTab: 'border-gray-500',
        text: 'text-gray-800',
        textLight: 'text-gray-700',
        textTab: 'text-gray-700',
        bgBadge: 'bg-gray-100',
        borderBadge: 'border-gray-200',
        button: 'bg-gray-500 hover:bg-gray-600',
        textButton: 'text-gray-600'
      };
    }
  };

  const getSkillIcon = (treeKey: string) => {
    switch (treeKey) {
      case 'caretaker': return '📚';
      case 'breeder': return '🧬';
      case 'entrepreneur': return '💼';
      default: return '⭐';
    }
  };

  const canLearnSkill = (skill: SkillNodeDisplay, treeKey: string): boolean => {
    if (skill.level >= skill.maxLevel) return false;
    if (gameState.progression.skillPoints < (skill.cost + skill.level)) return false;

    if (skill.prerequisites) {
      for (const prereq of skill.prerequisites) {
        const prereqSkill = skillTree[treeKey as keyof SkillTree][prereq];
        if (!prereqSkill || prereqSkill.level === 0) return false;
      }
    }

    return true;
  };

  const renderSkillTree = (treeKey: keyof SkillTree) => {
    const tree = skillTree[treeKey];
    const colors = getSkillColorClasses(treeKey as string);
    const skills = Object.values(tree) as SkillNodeDisplay[];

    return (
      <div className="space-y-3">
        {skills.map((skill) => {
          const canLearn = canLearnSkill(skill, treeKey as string);
          const cost = skill.cost + skill.level;
          const isMaxLevel = skill.level >= skill.maxLevel;

          return (
            <div
              key={skill.id}
              className={`p-4 rounded-lg border-2 ${
                skill.level > 0
                  ? `${colors.border} ${colors.bg}`
                  : canLearn
                  ? `${colors.borderLight} bg-white ${colors.borderHover}`
                  : 'border-gray-300 bg-gray-50'
              } transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-bold ${skill.level > 0 ? colors.text : 'text-gray-800'}`}>
                      {skill.name}
                    </h4>
                    <div className="flex space-x-1">
                      {Array.from({ length: skill.maxLevel }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < skill.level ? colors.border.replace('border-', 'bg-') : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className={`text-sm ${skill.level > 0 ? colors.textLight : 'text-gray-600'} mb-2`}>
                    {skill.description}
                  </p>

                  {/* Current Effect */}
                  {skill.level > 0 && (
                    <div className={`text-xs p-2 ${colors.bgBadge} rounded ${colors.borderBadge} border`}>
                      <span className={`font-medium ${colors.text}`}>Current Bonus:</span>
                      <span className={`${colors.textLight} ml-1`}>
                        {Object.entries(skill.effects).map(([key, value]) =>
                          `${Math.round((value * skill.level) * 100)}% ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`
                        ).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {skill.prerequisites && skill.prerequisites.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Requires: {skill.prerequisites.join(', ')}
                    </div>
                  )}
                </div>

                <div className="ml-4 text-center">
                  <div className={`text-lg font-bold ${skill.level > 0 ? colors.textButton : 'text-gray-600'} mb-1`}>
                    {skill.level}/{skill.maxLevel}
                  </div>
                  {!isMaxLevel && (
                    <button
                      onClick={() => handleLearnSkill(treeKey as string, skill.id)}
                      disabled={!canLearn}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        canLearn
                          ? `${colors.button} text-white`
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {cost} pts
                    </button>
                  )}
                  {isMaxLevel && (
                    <span className={`text-xs font-medium ${colors.textButton}`}>MAX</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">🌟 Skills & Specialization</h2>
              <p className="text-purple-100">
                Skill Points: <span className="font-bold text-white">{gameState.progression.skillPoints}</span>
                {gameState.progression.specialization && (
                  <span className="ml-4">Specialization: <span className="font-bold">{gameState.progression.specialization}</span></span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-purple-100 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Specialization Selection */}
        {canChooseSpecialization && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="font-bold text-yellow-800 mb-2">⚡ Choose Your Specialization (Level 5+)</h3>
            <p className="text-yellow-700 text-sm mb-3">
              Select your path to unlock unique bonuses and focus your skill development!
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleChooseSpecialization('caretaker')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📚 Caretaker
              </button>
              <button
                onClick={() => handleChooseSpecialization('breeder')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🧬 Breeder
              </button>
              <button
                onClick={() => handleChooseSpecialization('entrepreneur')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                💼 Entrepreneur
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {(['caretaker', 'breeder', 'entrepreneur'] as const).map((tree) => {
            const colors = getSkillColorClasses(tree);
            return (
              <button
                key={tree}
                onClick={() => setSelectedTree(tree)}
                className={`flex-1 px-6 py-3 font-medium capitalize transition-colors ${
                  selectedTree === tree
                    ? `${colors.bgTab} border-b-2 ${colors.borderTab} ${colors.textTab}`
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {getSkillIcon(tree)} {tree}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {selectedTree && (
            <div>
              <div className="mb-4 text-center">
                <h3 className={`text-xl font-bold ${getSkillColorClasses(selectedTree).text} mb-2`}>
                  {getSkillIcon(selectedTree)} {selectedTree.charAt(0).toUpperCase() + selectedTree.slice(1)} Skills
                </h3>
                <p className="text-gray-600 text-sm">
                  {selectedTree === 'caretaker' && 'Focus on caring for your Tamas more effectively'}
                  {selectedTree === 'breeder' && 'Specialize in genetics and Tama development'}
                  {selectedTree === 'entrepreneur' && 'Master the business side of ranch management'}
                </p>
              </div>
              {renderSkillTree(selectedTree)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Earn skill points by leveling up, reaching milestones, and completing achievements!
          </p>
        </div>
      </div>
    </div>
  );
};