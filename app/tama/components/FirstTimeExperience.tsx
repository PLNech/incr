'use client';

import React, { useState, useEffect } from 'react';

interface FirstTimeExperienceProps {
  gameState: any;
  engine: any;
  onCreateTama: (name?: string) => void;
  onComplete: () => void;
}

export const FirstTimeExperience: React.FC<FirstTimeExperienceProps> = ({
  gameState,
  engine,
  onCreateTama,
  onComplete
}) => {
  const [step, setStep] = useState<'welcome' | 'create' | 'first-action' | 'complete'>('welcome');
  const [tamaName, setTamaName] = useState('');
  const [createdTamaId, setCreatedTamaId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Check if tutorial should be shown
  useEffect(() => {
    if (gameState) {
      const tutorialCompleted = localStorage.getItem('tama_tutorial_completed');
      const isFirstTime = gameState.progression.level === 1 &&
                         gameState.progression.experience <= 10 &&
                         gameState.tamas.length === 0;

      if (!tutorialCompleted && isFirstTime) {
        setTimeout(() => setIsVisible(true), 1000); // Show after 1 second delay
      }
    }
  }, [gameState]);

  // Monitor for Tama creation
  useEffect(() => {
    if (step === 'create' && gameState.tamas.length > 0) {
      const newTama = gameState.tamas[gameState.tamas.length - 1];
      setCreatedTamaId(newTama.id);
      setStep('first-action');
    }
  }, [gameState.tamas, step]);

  // Monitor for first interaction
  useEffect(() => {
    if (step === 'first-action' && gameState.progression.experience >= 15) {
      setStep('complete');
      setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem('tama_tutorial_completed', 'true');
        onComplete();
      }, 2000); // Auto-complete after showing success
    }
  }, [gameState.progression.experience, step, onComplete]);

  const handleCreateTama = () => {
    const name = tamaName.trim() || 'Buddy';
    if (engine) {
      engine.createTama(name);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="text-8xl animate-bounce">🐣</div>
        <h2 className="text-3xl font-bold text-green-800">Welcome to Tama Bokujō!</h2>
        <p className="text-lg text-gray-700 max-w-md mx-auto">
          Ready to start your virtual ranch? Let's begin by creating your first Tama companion!
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl border border-green-200">
        <h3 className="text-xl font-semibold text-green-800 mb-4">What you'll learn:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-red-500">🍽️</span>
              <span>Feeding & Care</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📈</span>
              <span>Leveling Up</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-purple-500">🏠</span>
              <span>Building Ranch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⚡</span>
              <span>Automation</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStep('create')}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
      >
        🎉 Let's Start!
      </button>
    </div>
  );

  const renderCreateStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">🥚</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Create Your First Tama</h2>
        <p className="text-gray-700">
          Give your new companion a name! Don't worry, you can always create more later.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tama Name:
          </label>
          <input
            type="text"
            value={tamaName}
            onChange={(e) => setTamaName(e.target.value)}
            placeholder="Enter a name..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg"
            maxLength={20}
            autoFocus
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span>💡</span>
            <span>Quick Tips</span>
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Each Tama has unique personality and needs</li>
            <li>• Creating a Tama gives you 10 XP instantly!</li>
            <li>• You can have multiple Tamas on your ranch</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setStep('welcome')}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleCreateTama}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span>🐣</span>
          <span>Hatch Tama!</span>
          <span className="text-xs bg-green-400 px-2 py-0.5 rounded-full">+10 XP</span>
        </button>
      </div>
    </div>
  );

  const renderFirstActionStep = () => {
    const tama = gameState.tamas.find((t: any) => t.id === createdTamaId);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            {tama?.name || 'Your Tama'} has hatched!
          </h2>
          <p className="text-gray-700">
            Now let's try your first interaction. Look at your Tama's needs and help them out!
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-dashed border-yellow-300">
          <h3 className="font-bold text-yellow-800 mb-4 text-center text-lg">🎯 Your First Mission</h3>

          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <div className="font-medium text-gray-800 mb-2">Choose an action:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">🍽️</span>
                  <span>Feed if hungry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">🎾</span>
                  <span>Play if sad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">🧽</span>
                  <span>Clean if dirty</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">👁️</span>
                  <span>Wake if sleeping</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-blue-800">
                <div className="animate-spin">⭐</div>
                <span className="font-medium">Waiting for your first action...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">🚀 What happens next?</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• You'll earn +5 XP from your action</li>
            <li>• Your Tama's needs will improve</li>
            <li>• You'll see a notification showing your progress</li>
            <li>• The tutorial will complete automatically!</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <div className="text-8xl animate-bounce">🌟</div>
        <h2 className="text-3xl font-bold text-green-800">Perfect! You're a natural!</h2>
        <p className="text-lg text-gray-700">
          You've learned the basics. Your Tama ranch journey has begun!
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-xl border border-green-200">
        <h3 className="text-xl font-semibold text-green-800 mb-4">🎯 What's Next?</h3>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div className="text-left">
              <div className="font-medium">Keep leveling up</div>
              <div className="text-gray-600">Each action gives XP - Level 2 unlocks Buildings!</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <div className="text-left">
              <div className="font-medium">Need help?</div>
              <div className="text-gray-600">Click "Help & Tutorial" button anytime</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="text-sm text-yellow-800">
          <strong>🎮 Pro Tip:</strong> This is an idle game - your Tamas continue growing even when you're away!
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900/90 to-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {step === 'welcome' && renderWelcomeStep()}
          {step === 'create' && renderCreateStep()}
          {step === 'first-action' && renderFirstActionStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};