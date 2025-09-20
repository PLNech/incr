'use client';

import React, { useState, useEffect } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  modalType: 'buildings' | 'crafting' | 'contracts' | 'adventures' | 'skills';
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isVisible,
  onClose,
  steps,
  modalType
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  useEscapeKey(onClose, isVisible);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setHighlightedElement(null);
      return;
    }

    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [isVisible, currentStep, steps]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getModalIcon = () => {
    switch (modalType) {
      case 'buildings': return '🏠';
      case 'crafting': return '🔨';
      case 'contracts': return '📋';
      case 'adventures': return '🗺️';
      case 'skills': return '🌟';
      default: return '❓';
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'buildings': return 'Buildings';
      case 'crafting': return 'Crafting';
      case 'contracts': return 'Contracts';
      case 'adventures': return 'Adventures';
      case 'skills': return 'Skills';
      default: return 'Tutorial';
    }
  };

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[100]" />

      {/* Highlight for targeted element */}
      {highlightedElement && (
        <div
          className="fixed pointer-events-none z-[105] border-4 border-yellow-400 rounded-lg shadow-lg"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tutorial modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border-2 border-yellow-400">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getModalIcon()}</span>
              <h2 className="text-xl font-bold text-gray-800">
                {getModalTitle()} Tutorial
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isFirstStep
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-yellow-500'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium transition-colors"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>

          {/* Footer tip */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Press ESC to close this tutorial at any time
            </p>
          </div>
        </div>
      </div>
    </>
  );
};