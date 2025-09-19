'use client';

import React, { useState } from 'react';

interface WelcomeTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({
  isVisible,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Welcome to Tama Bokujō! 🐾',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Welcome to your virtual Tama ranch! Here you'll raise adorable creatures,
            build structures, and grow your operation.
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">🎯 Your Goal</h4>
            <p className="text-green-700">
              Raise happy, healthy Tamas while expanding your ranch and unlocking new features!
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Creating Your First Tama 🐣',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Let's start by creating your first Tama! Click the <span className="bg-green-100 px-2 py-1 rounded font-medium">+ New Tama</span> button.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">💡 Tama Basics</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Feed when hunger is low (yellow/red)</li>
              <li>• Play when happiness drops</li>
              <li>• Clean when cleanliness is poor</li>
              <li>• Each action gives you XP!</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Progression & Experience ⭐',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Every action you take earns Experience (XP) and helps you level up!
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-1">📈 Level Up</h4>
              <p className="text-sm text-purple-700">Gain skill points and unlock new features</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-800 mb-1">🌟 Skills</h4>
              <p className="text-sm text-green-700">Spend points to improve efficiency</p>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-bold text-yellow-800 mb-2">🎯 Early Milestones</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Level 2: 🏠 Buildings unlock</li>
              <li>• Level 3: 🔨 Crafting unlocks</li>
              <li>• Level 5: ⚡ Choose specialization</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Skills & Specialization 🎓',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Use skill points (earned by leveling up) to unlock powerful bonuses!
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-1">📚 Caretaker</h4>
              <p className="text-sm text-blue-700">Better at feeding, playing, and caring for Tamas</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-800 mb-1">🧬 Breeder</h4>
              <p className="text-sm text-green-700">Genetics expert, helps Tamas grow stronger</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-yellow-800 mb-1">💼 Entrepreneur</h4>
              <p className="text-sm text-yellow-700">Business focused, better contract payments</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Ready to Begin! 🚀',
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            You're all set to start your Tama ranch adventure!
          </p>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-800 mb-3">🎯 Next Steps</h4>
            <ol className="text-green-700 space-y-2">
              <li className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">1</span>
                <span>Create your first Tama</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">2</span>
                <span>Feed, play, and care for it</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">3</span>
                <span>Watch your XP and level grow</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">4</span>
                <span>Spend skill points to improve</span>
              </li>
            </ol>
          </div>
          <p className="text-center text-gray-600 italic">
            Remember: You can reopen this tutorial anytime from the Help menu!
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {tutorialSteps[currentStep].title}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-green-100 text-sm">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <button
                onClick={skipTutorial}
                className="text-green-100 hover:text-white text-sm underline"
              >
                Skip
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {tutorialSteps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-green-500'
                    : index < currentStep
                    ? 'bg-green-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all"
          >
            {currentStep === tutorialSteps.length - 1 ? "Let's Begin!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};