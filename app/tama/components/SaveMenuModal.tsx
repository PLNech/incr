'use client';

import React, { useState } from 'react';
import { TamaEngine } from '../engine/TamaEngine';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface SaveMenuModalProps {
  isVisible: boolean;
  onClose: () => void;
  engine: TamaEngine | null;
  onNotification: (message: string, type?: 'info' | 'xp' | 'levelup' | 'achievement') => void;
}

export const SaveMenuModal: React.FC<SaveMenuModalProps> = ({
  isVisible,
  onClose,
  engine,
  onNotification
}) => {
  const [importText, setImportText] = useState<string>('');
  const [showImportArea, setShowImportArea] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEscapeKey(onClose, isVisible);

  if (!isVisible) return null;

  const handleSaveGame = () => {
    if (!engine) return;

    try {
      engine.save();
      onNotification('💾 Game saved successfully!', 'info');
    } catch (error) {
      onNotification('❌ Failed to save game', 'info');
      console.error('Save error:', error);
    }
  };

  const handleExportSave = () => {
    if (!engine) return;

    try {
      const saveData = engine.exportSaveData();
      const base64Data = btoa(saveData);

      // Copy to clipboard
      navigator.clipboard.writeText(base64Data).then(() => {
        onNotification('📋 Save data copied to clipboard! (Base64)', 'info');
      }).catch(() => {
        // Fallback: show in a text area
        const textarea = document.createElement('textarea');
        textarea.value = base64Data;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        onNotification('📋 Save data copied to clipboard!', 'info');
      });
    } catch (error) {
      onNotification('❌ Failed to export save', 'info');
      console.error('Export error:', error);
    }
  };

  const handleImportSave = () => {
    if (!engine || !importText.trim()) return;

    try {
      // Try to decode base64 first
      let saveData = importText.trim();
      try {
        saveData = atob(saveData);
      } catch {
        // If base64 decode fails, assume it's already decoded JSON
      }

      // Validate JSON
      const parsedData = JSON.parse(saveData);

      if (!parsedData.tamas || !parsedData.resources || !parsedData.progression) {
        throw new Error('Invalid save format');
      }

      engine.importSaveData(saveData);
      onNotification('📥 Save imported successfully!', 'info');
      setImportText('');
      setShowImportArea(false);
      onClose();

      // Reload the page to ensure all systems are properly updated
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      onNotification('❌ Failed to import save - Invalid format', 'info');
      console.error('Import error:', error);
    }
  };

  const handleResetGame = () => {
    if (!engine) return;

    try {
      // Clear localStorage for this game
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tama_') || key.startsWith('incr_games_tama')) {
          localStorage.removeItem(key);
        }
      });

      onNotification('🔄 Game reset successfully!', 'info');
      onClose();

      // Reload the page to start fresh
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      onNotification('❌ Failed to reset game', 'info');
      console.error('Reset error:', error);
    }
  };

  const getSaveInfo = () => {
    if (!engine) return null;

    try {
      const saveData = engine.exportSaveData();
      const size = new Blob([saveData]).size;
      const sizeKB = Math.round(size / 1024 * 100) / 100;
      return { size: sizeKB, lastSaved: new Date().toLocaleString() };
    } catch {
      return null;
    }
  };

  const saveInfo = getSaveInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">💾 Save Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {saveInfo && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
            <div className="text-gray-600">Current Save:</div>
            <div className="font-medium">Size: {saveInfo.size} KB</div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleSaveGame}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            💾 Save Game
          </button>

          <button
            onClick={handleExportSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            📤 Export Save (Base64)
          </button>

          <button
            onClick={() => setShowImportArea(!showImportArea)}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            📥 Import Save
          </button>

          {showImportArea && (
            <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your Base64 save data here..."
                className="w-full h-32 p-3 border rounded-lg resize-none text-xs font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleImportSave}
                  disabled={!importText.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2 px-3 rounded font-medium transition-colors"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportArea(false);
                    setImportText('');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            🔄 Reset Game
          </button>

          {showResetConfirm && (
            <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> This will permanently delete all your progress, Tamas, buildings, and resources. This cannot be undone!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetGame}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded font-medium transition-colors"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Export your save regularly to backup your progress!
          </p>
        </div>
      </div>
    </div>
  );
};