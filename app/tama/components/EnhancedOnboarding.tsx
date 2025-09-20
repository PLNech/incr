'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'observe' | 'wait';
    element?: string;
    condition?: () => boolean;
  };
  tips?: string[];
  visual?: React.ReactNode;
}

interface EnhancedOnboardingProps {
  gameState: any;
  engine: any;
  onStepComplete: (stepId: string) => void;
  onComplete: () => void;
}

export const EnhancedOnboarding: React.FC<EnhancedOnboardingProps> = ({
  gameState,
  engine,
  onStepComplete,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Tama Bokujō! 🐾',
      description: 'Your journey as a Tama rancher begins here. Let\'s learn the basics together!',
      visual: (
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐣</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-100 p-2 rounded">🌱 Grow</div>
            <div className="bg-blue-100 p-2 rounded">❤️ Care</div>
            <div className="bg-purple-100 p-2 rounded">⚡ Evolve</div>
            <div className="bg-yellow-100 p-2 rounded">🏆 Achieve</div>
          </div>
        </div>
      ),
      tips: [
        'This is an idle/incremental game - progress continues even when you\'re away!',
        'Every action gives you XP - the more you do, the faster you grow!'
      ]
    },
    {
      id: 'create-first-tama',
      title: 'Create Your First Tama 🐣',
      description: 'Click the "New Tama" button to hatch your first companion!',
      target: 'button:contains("New Tama")',
      action: {
        type: 'observe',
        condition: () => gameState.tamas.length > 0
      },
      tips: [
        'Each Tama has unique needs and personality',
        'Creating a Tama gives you 10 XP instantly!'
      ]
    },
    {
      id: 'understand-needs',
      title: 'Understanding Tama Needs 📊',
      description: 'Tamas have 4 main needs that you must monitor and fulfill.',
      visual: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">🍽️</div>
            <div className="text-left">
              <div className="font-medium">Hunger</div>
              <div className="text-sm text-gray-600">Feed when red/yellow</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">😊</div>
            <div className="text-left">
              <div className="font-medium">Happiness</div>
              <div className="text-sm text-gray-600">Play to cheer them up</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">🧽</div>
            <div className="text-left">
              <div className="font-medium">Cleanliness</div>
              <div className="text-sm text-gray-600">Clean when dirty</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">⚡</div>
            <div className="text-left">
              <div className="font-medium">Energy</div>
              <div className="text-sm text-gray-600">Recovers during sleep</div>
            </div>
          </div>
        </div>
      ),
      tips: [
        'Low needs (red) are urgent - attend to them first!',
        'Happy Tamas grow faster and give more XP'
      ]
    },
    {
      id: 'first-interaction',
      title: 'Your First Interaction 🤝',
      description: 'Try feeding, playing with, or cleaning your Tama. Watch their needs change!',
      action: {
        type: 'observe',
        condition: () => gameState.progression.experience >= 15 // Initial 10 + 5 from action
      },
      tips: [
        'Each action gives 5 XP - that\'s how you level up!',
        'Watch the notification that appears when you act'
      ]
    },
    {
      id: 'xp-and-levels',
      title: 'Experience & Levels 📈',
      description: 'You just earned XP! This is how you unlock new features and abilities.',
      visual: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-bold">XP = Progress</div>
                <div className="text-sm opacity-90">Every action counts!</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-yellow-100 p-2 rounded text-center">
              <div className="font-bold text-yellow-800">Level 2</div>
              <div className="text-yellow-600">🏠 Buildings</div>
            </div>
            <div className="bg-green-100 p-2 rounded text-center">
              <div className="font-bold text-green-800">Level 3</div>
              <div className="text-green-600">🔨 Crafting</div>
            </div>
          </div>
        </div>
      ),
      tips: [
        'Level up to unlock Buildings, Crafting, and more!',
        'Each level gives you skill points to spend'
      ]
    },
    {
      id: 'automation-hint',
      title: 'Idle Growth 🌱',
      description: 'Your Tamas will continue to grow and change even when you\'re away!',
      visual: (
        <div className="text-center">
          <div className="text-4xl mb-3">⏰</div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-bold text-blue-800 mb-2">Idle Mechanics</div>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Tamas age and develop personality</li>
              <li>• Needs decay over time</li>
              <li>• Buildings produce resources</li>
              <li>• Come back to see progress!</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        'Check in regularly to keep Tamas happy',
        'The longer you\'re away, the bigger the welcome back bonus!'
      ]
    },
    {
      id: 'next-steps',
      title: 'Ready to Ranch! 🎯',
      description: 'You\'ve learned the basics. Here\'s what to focus on next:',
      visual: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-green-400 to-blue-400 text-white p-4 rounded-lg">
            <div className="text-center mb-3">
              <span className="text-3xl">🎉</span>
              <div className="font-bold">You\'re Ready!</div>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>Keep caring for your Tamas</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📈</span>
                <span>Work toward Level 2 for buildings</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>Check Help & Tutorial anytime</span>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        'Use the ❓ Help button to replay this tutorial',
        'Join the community to share your ranch progress!'
      ]
    }
  ];

  const currentStep = steps[currentStepIndex];

  const goToNextStep = () => {
    if (currentStep) {
      setCompletedSteps(prev => [...prev, currentStep.id]);
      onStepComplete(currentStep.id);
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Tutorial complete
      setIsVisible(false);
      onComplete();
    }
  };

  const skipTutorial = () => {
    setIsVisible(false);
    onComplete();
  };

  // Check if step conditions are met
  useEffect(() => {
    if (currentStep?.action?.condition && currentStep.action.condition()) {
      // Auto-advance when condition is met
      setTimeout(goToNextStep, 1500); // Small delay for user to see the result
    }
  }, [currentStep, gameState]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentStep.title}</h2>
              <p className="text-gray-600 mt-1">{currentStep.description}</p>
            </div>
            <button
              onClick={skipTutorial}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Skip
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Visual element */}
          {currentStep.visual && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              {currentStep.visual}
            </div>
          )}

          {/* Tips */}
          {currentStep.tips && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Pro Tips</span>
              </h4>
              <ul className="space-y-2">
                {currentStep.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action waiting indicator */}
          {currentStep.action?.condition && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin">⭐</div>
                <div>
                  <div className="font-medium text-blue-800">Try it out!</div>
                  <div className="text-sm text-blue-600">
                    The tutorial will continue automatically when you complete this step.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between">
            <button
              onClick={skipTutorial}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tutorial
            </button>

            {!currentStep.action?.condition && (
              <button
                onClick={goToNextStep}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                {currentStepIndex === steps.length - 1 ? '🎉 Start Playing!' : 'Next Step →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for managing onboarding state
export const useOnboarding = () => {
  const [onboardingStep, setOnboardingStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem('tama_onboarding_completed') || '[]');
    setCompletedSteps(completed);
  }, []);

  const completeStep = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem('tama_onboarding_completed', JSON.stringify(newCompleted));
  };

  const completeOnboarding = () => {
    localStorage.setItem('tama_tutorial_completed', 'true');
    setOnboardingStep(null);
  };

  const shouldShowOnboarding = (gameState: any) => {
    const tutorialCompleted = localStorage.getItem('tama_tutorial_completed');
    const isFirstTime = gameState?.progression.level === 1 &&
                       gameState?.progression.experience <= 10 &&
                       gameState?.tamas.length === 0;

    return !tutorialCompleted && isFirstTime;
  };

  return {
    onboardingStep,
    completedSteps,
    completeStep,
    completeOnboarding,
    shouldShowOnboarding
  };
};