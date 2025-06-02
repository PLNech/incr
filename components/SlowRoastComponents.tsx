// Slow Roast v2.0 - UI Components

import { GameState, DailyEvent, CustomerSegment, Achievement } from '../lib/slowRoastTypes';
import { COFFEE_UPGRADES, ENDING_PATHS } from '../lib/slowRoastTypes';
import { SlowRoastEngine } from '../lib/slowRoastUtils';

interface ResourceDisplayProps {
  resources: GameState['resources'];
  day: number;
  phase: GameState['phase'];
}

export function ResourceDisplay({ resources, day, phase }: ResourceDisplayProps) {
  const phaseEmoji = {
    setup: '🏗️',
    innocent: '☕',
    snobbery: '🎭',
    realization: '😬',
    ending: '🎬'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="resource-display">
        <div className="text-lg font-bold">Day {day}</div>
        <div className="text-sm text-gray-400 flex items-center gap-1">
          {phaseEmoji[phase]} {phase}
        </div>
      </div>
      <div className="resource-display">
        <div className="text-lg font-bold">{SlowRoastEngine.formatCurrency(resources.money)}</div>
        <div className="text-sm text-gray-400">Capital</div>
      </div>
      <div className="resource-display">
        <div className="text-lg font-bold">{Math.round(resources.reputation)}</div>
        <div className="text-sm text-gray-400">Coffee Cred</div>
      </div>
      <div className={`resource-display ${resources.gentrification > 15 ? 'border-red-500' : resources.gentrification > 8 ? 'border-yellow-500' : ''}`}>
        <div className="text-lg font-bold">{Math.round(resources.gentrification * 10) / 10}</div>
        <div className="text-sm text-gray-400">Neighborhood "Enhancement"</div>
      </div>
    </div>
  );
}

interface CoffeeUpgradeProps {
  currentLevel: number;
  availableUpgrades: typeof COFFEE_UPGRADES;
  money: number;
  onUpgrade: (upgradeIndex: number) => void;
}

export function CoffeeUpgradeInterface({ currentLevel, availableUpgrades, money, onUpgrade }: CoffeeUpgradeProps) {
  const currentCoffee = COFFEE_UPGRADES[currentLevel];
  
  return (
    <div className="game-card">
      <h3 className="font-semibold mb-4 text-center">☕ Coffee Excellence Ladder</h3>
      
      {/* Current Coffee Display */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
        <h4 className="font-bold text-lg">{currentCoffee.name}</h4>
        <p className="text-sm text-gray-300 mb-2">{currentCoffee.description}</p>
        <div className="flex justify-between text-sm">
          <span className="text-green-400">Price: {SlowRoastEngine.formatCurrency(currentCoffee.price)}</span>
          <span className="text-red-400">Impact: +{currentCoffee.gentrificationImpact}</span>
        </div>
        <p className="text-xs text-yellow-300 italic mt-2">"{currentCoffee.satiricalNote}"</p>
      </div>
      
      {/* Available Upgrades */}
      <div className="space-y-3">
        {availableUpgrades.filter(upgrade => COFFEE_UPGRADES.indexOf(upgrade) > currentLevel).slice(0, 2).map((upgrade, index) => {
          const upgradeIndex = COFFEE_UPGRADES.indexOf(upgrade);
          const canAfford = money >= upgrade.cost;
          
          return (
            <div key={upgrade.id} className={`border rounded-lg p-3 ${canAfford ? 'border-green-600 bg-green-900/20' : 'border-gray-600 bg-gray-800/50'}`}>
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-semibold">{upgrade.name}</h5>
                <span className="text-green-400 font-bold">{SlowRoastEngine.formatCurrency(upgrade.price)}/cup</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{upgrade.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-400">Gentrification: +{upgrade.gentrificationImpact}</span>
                <button
                  onClick={() => onUpgrade(upgradeIndex)}
                  disabled={!canAfford}
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    canAfford 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Upgrade ({SlowRoastEngine.formatCurrency(upgrade.cost)})
                </button>
              </div>
              <p className="text-xs text-yellow-300 italic mt-2">"{upgrade.satiricalNote}"</p>
            </div>
          );
        })}
        
        {availableUpgrades.filter(upgrade => COFFEE_UPGRADES.indexOf(upgrade) > currentLevel).length === 0 && (
          <div className="text-center text-gray-400 italic py-4">
            Coffee perfection achieved. What have you done?
          </div>
        )}
      </div>
    </div>
  );
}

interface MrsGarciaProps {
  stage: GameState['mrsGarciaStage'];
  interactions: number;
  hasHelped: boolean;
  onHelp: (helpType: 'discount' | 'gift') => void;
}

export function MrsGarciaInteraction({ stage, interactions, hasHelped, onHelp }: MrsGarciaProps) {
  const dialogue = SlowRoastEngine.getMrsGarciaDialogue(stage);
  
  if (stage === 'gone') {
    return (
      <div className="game-card border-red-700 bg-red-900/20">
        <h3 className="font-semibold mb-3 text-red-300">👵 Mrs. García</h3>
        <p className="text-gray-300 italic">{dialogue.text}</p>
        <div className="mt-3 text-xs text-gray-400">
          She was a regular for over 40 years. The neighborhood won't be the same.
        </div>
      </div>
    );
  }
  
  return (
    <div className={`game-card ${stage === 'explains' ? 'border-yellow-700 bg-yellow-900/20' : stage === 'hesitant' ? 'border-orange-700 bg-orange-900/20' : ''}`}>
      <h3 className="font-semibold mb-3">👵 Mrs. García</h3>
      <p className="text-gray-300 mb-3">"{dialogue.text}"</p>
      
      {dialogue.canHelp && !hasHelped && (
        <div className="flex gap-2">
          <button
            onClick={() => onHelp('discount')}
            className="btn-secondary text-sm flex-1"
          >
            Offer discount
          </button>
          <button
            onClick={() => onHelp('gift')}
            className="btn-secondary text-sm flex-1"
          >
            Gift coffee (€10)
          </button>
        </div>
      )}
      
      {hasHelped && (
        <div className="text-xs text-blue-300 italic">
          You tried to help, but some forces are bigger than individual kindness...
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Interactions: {interactions} • Stage: {stage}
      </div>
    </div>
  );
}

interface DailyReviewProps {
  events: DailyEvent[];
  day: number;
}

export function DailyReview({ events, day }: DailyReviewProps) {
  const getEventIcon = (type: DailyEvent['type']) => {
    switch (type) {
      case 'review': return '⭐';
      case 'news': return '📰';
      case 'customer': return '👥';
      case 'achievement': return '🏆';
      default: return '📝';
    }
  };
  
  const getEventColor = (tone: DailyEvent['tone']) => {
    switch (tone) {
      case 'positive': return 'text-green-300';
      case 'concerning': return 'text-red-300';
      default: return 'text-gray-300';
    }
  };
  
  return (
    <div className="game-card">
      <h3 className="font-semibold mb-4">📱 Daily Wrap - Day {day}</h3>
      
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {events.length > 0 ? (
          events.map((event, index) => (
            <div key={index} className={`border-l-2 pl-3 py-2 ${
              event.tone === 'positive' ? 'border-green-500' : 
              event.tone === 'concerning' ? 'border-red-500' : 'border-gray-500'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{event.title}</div>
                  <div className={`text-sm ${getEventColor(event.tone)}`}>
                    {event.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic text-center py-4">
            A quiet day in the neighborhood...
          </div>
        )}
      </div>
    </div>
  );
}

interface CustomerDemographicsProps {
  segments: CustomerSegment[];
  gentrification: number;
  phase: GameState['phase'];
}

export function CustomerDemographics({ segments, gentrification, phase }: CustomerDemographicsProps) {
  const shouldShowData = phase !== 'setup' && phase !== 'innocent';
  
  return (
    <div className="game-card">
      <h3 className="font-semibold mb-4">📊 Neighborhood Analytics</h3>
      
      {!shouldShowData ? (
        <div className="text-gray-400 italic text-center py-4">
          Customer data will unlock as your business grows...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gentrification Overview */}
          <div className="bg-gray-800 rounded p-3">
            <div className="text-sm font-semibold mb-2">Neighborhood "Enhancement" Level</div>
            <div className="progress-bar">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  gentrification > 20 ? 'bg-red-600' : 
                  gentrification > 10 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(100, (gentrification / 30) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Impact Score: {Math.round(gentrification * 10) / 10} / 30
            </div>
          </div>
          
          {/* Customer Segments */}
          {segments.map(segment => (
            <div key={segment.id} className="border border-gray-700 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{segment.name}</h4>
                <span className={`text-sm font-bold ${
                  segment.id === 'locals' && segment.size < 25 ? 'text-red-400' :
                  segment.id === 'young_professionals' && segment.size > 25 ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {segment.size} people
                </span>
              </div>
              
              <div className="text-xs text-gray-400 mb-2">{segment.description}</div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Coffee Ed:</span>
                  <span className="ml-1">{segment.education}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Spending:</span>
                  <span className="ml-1">{SlowRoastEngine.formatCurrency(segment.spendingPower)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Prefers:</span>
                  <span className="ml-1">{segment.preference}</span>
                </div>
                <div>
                  <span className="text-gray-400">Impact:</span>
                  <span className="ml-1">+{segment.gentrificationContribution}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Concerning trends */}
          {gentrification > 10 && (
            <div className="bg-red-900/30 border border-red-700 rounded p-3">
              <div className="text-red-300 font-semibold text-sm mb-1">⚠️ Demographic Shifts Detected</div>
              <div className="text-xs text-red-200">
                Original residents: {segments.find(s => s.id === 'locals')?.size || 0} remaining
                <br />
                New demographics emerging in response to "cultural enhancement"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AchievementGalleryProps {
  achievements: Achievement[];
  isVisible: boolean;
}

export function AchievementGallery({ achievements, isVisible }: AchievementGalleryProps) {
  if (!isVisible) {
    return (
      <div className="game-card opacity-50">
        <h3 className="font-semibold mb-3">🏆 Professional Development</h3>
        <div className="text-gray-400 italic text-center py-4">
          Unlock achievements as you build your coffee empire...
        </div>
      </div>
    );
  }
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  
  return (
    <div className="game-card">
      <h3 className="font-semibold mb-3">🏆 Professional Development ({unlockedCount}/{achievements.length})</h3>
      
      <div className="space-y-2">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`border rounded p-3 ${
              achievement.unlocked 
                ? 'border-yellow-600 bg-yellow-900/20' 
                : 'border-gray-600 bg-gray-800/50 opacity-50'
            }`}
          >
            <div className="font-semibold text-sm">
              {achievement.unlocked ? '✅' : '🔒'} {achievement.satiricalName}
            </div>
            <div className="text-xs text-gray-400">{achievement.description}</div>
          </div>
        ))}
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

interface GameEndingProps {
  endingId: string;
  gameState: GameState;
  onRestart: () => void;
}

export function GameEnding({ endingId, gameState, onRestart }: GameEndingProps) {
  const ending = ENDING_PATHS[endingId as keyof typeof ENDING_PATHS];
  
  if (!ending) return null;
  
  const getEndingAnalysis = () => {
    switch (endingId) {
      case 'sellout':
        return `You built a coffee empire, but at what cost? The neighborhood is now unrecognizable, a sterile playground for the wealthy. Mrs. García and countless others were priced out to make room for €20 nitrogen-flushed coffee experiences.`;
      
      case 'purist':
        return `You maintained your artisanal principles, serving "only" €8 single-origin coffee. While you never went full corporate, you still contributed to pricing out the community that made this neighborhood special in the first place.`;
      
      case 'awakened':
        return `You tried to help Mrs. García, but individual kindness couldn't overcome systemic forces. Your "conscious" approach to gentrification still displaced the very people you claimed to care about.`;
      
      case 'hypocrite':
        return `You talked about community values while serving €12 Geisha varietals. Your coffee shop became a symbol of "authentic neighborhood character" while erasing the actual characters who built it.`;
      
      case 'escape':
        return `You recognized the problem and stepped away, but the forces you set in motion continued without you. Someone else opened a specialty coffee shop in your place.`;
      
      default:
        return `The neighborhood changed, as neighborhoods do. The question is: did you help or hurt the community you claimed to serve?`;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-2xl mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">{ending.name}</h2>
        <div className="text-center mb-6">
          <div className="text-yellow-400 font-semibold text-lg">"{ending.satiricalTitle}"</div>
          <div className="text-gray-400 text-sm mt-1">{ending.description}</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            {getEndingAnalysis()}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm mb-6">
          <div>
            <div className="font-semibold">Days Operated</div>
            <div className="text-gray-400">{gameState.day}</div>
          </div>
          <div>
            <div className="font-semibold">Final Coffee Level</div>
            <div className="text-gray-400">{COFFEE_UPGRADES[gameState.currentCoffeeLevel].name}</div>
          </div>
          <div>
            <div className="font-semibold">Neighborhood Impact</div>
            <div className={`${gameState.resources.gentrification > 20 ? 'text-red-400' : gameState.resources.gentrification > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
              {Math.round(gameState.resources.gentrification * 10) / 10}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="btn-primary flex-1"
          >
            Try Again (Different Choices?)
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary flex-1"
          >
            Return to la incr factory
          </button>
        </div>
      </div>
    </div>
  );
}