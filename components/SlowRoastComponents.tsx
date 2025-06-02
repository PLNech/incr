// Reusable components for Slow Roast game

import { CustomerSegment, SlowRoastGameState } from '../lib/slowRoastTypes';

interface ResourceDisplayProps {
  resources: SlowRoastGameState['resources'];
}

export function ResourceDisplay({ resources }: ResourceDisplayProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="resource-display">
        <div className="text-lg font-bold">{Math.floor(resources.beans)}</div>
        <div className="text-sm text-gray-400">Coffee Beans</div>
      </div>
      <div className="resource-display">
        <div className="text-lg font-bold">€{Math.floor(resources.money)}</div>
        <div className="text-sm text-gray-400">Money</div>
      </div>
      <div className="resource-display">
        <div className="text-lg font-bold">{Math.floor(resources.reputation)}</div>
        <div className="text-sm text-gray-400">Reputation</div>
      </div>
      <div className="resource-display">
        <div className="text-lg font-bold">{Math.floor(resources.knowledge)}</div>
        <div className="text-sm text-gray-400">Coffee Knowledge</div>
      </div>
    </div>
  );
}

interface CustomerSegmentCardProps {
  segment: CustomerSegment;
  onEducate: (segmentId: string) => void;
  canEducate: boolean;
}

export function CustomerSegmentCard({ segment, onEducate, canEducate }: CustomerSegmentCardProps) {
  const getPreferenceColor = (preference: string) => {
    switch (preference) {
      case 'instant': return 'text-red-400';
      case 'chain': return 'text-yellow-400';
      case 'specialty': return 'text-green-400';
      case 'third-wave': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getEducationDescription = (education: number) => {
    if (education < 20) return 'No coffee knowledge';
    if (education < 40) return 'Basic coffee awareness';
    if (education < 60) return 'Growing interest';
    if (education < 80) return 'Coffee enthusiast';
    return 'Coffee connoisseur';
  };

  return (
    <div className="game-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{segment.name}</h3>
        <span className="text-sm text-gray-400">{segment.size} people</span>
      </div>
      
      {segment.description && (
        <p className="text-xs text-gray-500 mb-2">{segment.description}</p>
      )}
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Coffee Education:</span>
          <div className="progress-bar mt-1">
            <div 
              className="progress-fill" 
              style={{ width: `${segment.education}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{getEducationDescription(segment.education)}</span>
            <span className="text-gray-500">{segment.education}/100</span>
          </div>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Prefers:</span>
          <span className={getPreferenceColor(segment.preference)}>
            {segment.preference}
          </span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Spending Power:</span>
          <span className="text-green-400">€{segment.spendingPower}/visit</span>
        </div>
      </div>
      
      <button
        onClick={() => onEducate(segment.id)}
        disabled={!canEducate}
        className={`btn-secondary w-full mt-3 text-sm ${
          !canEducate ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Educate About Coffee (-5 knowledge)
      </button>
    </div>
  );
}

interface DailyLogProps {
  events: string[];
  maxEvents?: number;
}

export function DailyLog({ events, maxEvents = 10 }: DailyLogProps) {
  const displayEvents = events.slice(0, maxEvents);
  
  return (
    <div className="game-card">
      <h3 className="font-semibold mb-3">📰 Daily News</h3>
      <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
        {displayEvents.length > 0 ? (
          displayEvents.map((event, index) => (
            <div key={index} className="text-gray-300 border-b border-gray-700 pb-1 last:border-b-0">
              {event}
            </div>
          ))
        ) : (
          <p className="text-gray-400 italic">Waiting for customers...</p>
        )}
      </div>
    </div>
  );
}

interface WisdomToastProps {
  wisdom: string;
  visible: boolean;
}

export function WisdomToast({ wisdom, visible }: WisdomToastProps) {
  if (!visible) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-blue-900 border border-blue-600 rounded-lg p-4 max-w-sm z-50 animate-pulse">
      <p className="text-sm font-semibold">☕ James Hoffman says:</p>
      <p className="text-xs mt-1 italic">"{wisdom}"</p>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  cost?: number;
  currentMoney?: number;
  children: React.ReactNode;
  className?: string;
}

export function ActionButton({ 
  onClick, 
  disabled = false, 
  cost, 
  currentMoney, 
  children, 
  className = "btn-primary w-full" 
}: ActionButtonProps) {
  const canAfford = cost ? (currentMoney || 0) >= cost : true;
  const isDisabled = disabled || !canAfford;
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
      {cost && <span className="text-xs block">€{cost}</span>}
    </button>
  );
}

interface ShopSetupProps {
  onSetupComplete: (playerName: string, shopName: string) => void;
}

export function ShopSetup({ onSetupComplete }: ShopSetupProps) {
  const handleSubmit = () => {
    const nameInput = document.querySelector('#player-name') as HTMLInputElement;
    const shopInput = document.querySelector('#shop-name') as HTMLInputElement;
    
    const playerName = nameInput?.value.trim() || 'Coffee Artisan';
    const shopName = shopInput?.value.trim() || 'The Third Wave';
    
    onSetupComplete(playerName, shopName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="bg-amber-900 border border-amber-700 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">🏪 Welcome to Amsterdam!</h3>
      <p className="mb-4">
        You've just signed the lease on a small café space in a charming neighborhood. 
        The locals are skeptical of yet another coffee shop, but you have a vision: 
        to bring the art of slow, specialty coffee to Amsterdam.
      </p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Your Name:</label>
          <input
            id="player-name"
            type="text"
            placeholder="Coffee Artisan"
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1">Shop Name:</label>
          <input
            id="shop-name"
            type="text"
            placeholder="The Third Wave"
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 w-full"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <button onClick={handleSubmit} className="btn-primary w-full">
          Open Your Coffee Shop! ☕
        </button>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function ProgressBar({ 
  current, 
  max, 
  label, 
  showNumbers = true, 
  color = 'blue' 
}: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">{label}</span>
          {showNumbers && (
            <span className="text-gray-500">{Math.floor(current)}/{max}</span>
          )}
        </div>
      )}
      <div className="progress-bar">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface GamePhaseIndicatorProps {
  phase: SlowRoastGameState['gamePhase'];
  day: number;
}

export function GamePhaseIndicator({ phase, day }: GamePhaseIndicatorProps) {
  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'setup':
        return { emoji: '🏗️', name: 'Setting Up', color: 'text-gray-400' };
      case 'learning':
        return { emoji: '📚', name: 'Learning', color: 'text-blue-400' };
      case 'growing':
        return { emoji: '🌱', name: 'Growing', color: 'text-green-400' };
      case 'established':
        return { emoji: '⭐', name: 'Established', color: 'text-yellow-400' };
      case 'empire':
        return { emoji: '👑', name: 'Coffee Empire', color: 'text-purple-400' };
      default:
        return { emoji: '☕', name: 'Unknown', color: 'text-gray-400' };
    }
  };

  const phaseInfo = getPhaseInfo(phase);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-lg">{phaseInfo.emoji}</span>
      <span className={phaseInfo.color}>{phaseInfo.name}</span>
      <span className="text-gray-500">• Day {day}</span>
    </div>
  );
}