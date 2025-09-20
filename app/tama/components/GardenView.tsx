'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TamaGameState } from '../types';
import { AdvancedTamaData } from '../types-advanced';
import { TamaEngine } from '../engine/TamaEngine';

interface GardenViewProps {
  gameState: TamaGameState;
  engine: TamaEngine | null;
  showRelationships?: boolean;
}

interface TamaPosition {
  id: string;
  x: number;
  y: number;
  activity: string;
  direction: number; // 0-7 for 8 directions
  lastMove: number;
  targetX?: number;
  targetY?: number;
}

interface GardenTile {
  type: 'grass' | 'dirt' | 'water' | 'tree' | 'rock' | 'building';
  variant: number; // For different grass patterns, rock types, etc.
  occupied?: string; // Tama ID if occupied
}

export const GardenView: React.FC<GardenViewProps> = ({ gameState, engine, showRelationships = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tamaPositions, setTamaPositions] = useState<Record<string, TamaPosition>>({});
  const [gardenMap, setGardenMap] = useState<GardenTile[][]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [advancedTamas, setAdvancedTamas] = useState<AdvancedTamaData[]>([]);
  const [activitySummary, setActivitySummary] = useState<Record<string, { activity: any; goals: number; relationships: number }>>({});
  const [showRelationshipsLocal, setShowRelationshipsLocal] = useState(showRelationships);

  // Garden dimensions
  const GARDEN_WIDTH = 32;
  const GARDEN_HEIGHT = 24;
  const TILE_SIZE = 16; // 16x16 pixel tiles

  // Update advanced Tamas data from engine
  useEffect(() => {
    if (engine) {
      const advanced = engine.getAdvancedTamas();
      const summary = engine.getActivitySummary();
      setAdvancedTamas(advanced);
      setActivitySummary(summary);
    }
  }, [engine, gameState.tamas?.length]); // React to new Tamas

  // Update relationship display when prop changes
  useEffect(() => {
    setShowRelationshipsLocal(showRelationships);
  }, [showRelationships]);

  // Color palette (inspired by Dwarf Fortress)
  const COLORS = {
    grass: ['#4a7c59', '#5d8f6a', '#3e6b4e', '#6da076'],
    dirt: ['#8b7355', '#a08660', '#756147', '#9e8a6c'],
    water: ['#4a86c7', '#5b97d8', '#3975b6', '#6ca8e9'],
    tree: ['#2d5016', '#3a6b1e', '#234208', '#4d7f2a'],
    rock: ['#6b6b6b', '#5a5a5a', '#7c7c7c', '#4f4f4f'],
    tamaColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#f1c40f']
  };

  // Initialize garden map
  useEffect(() => {
    if (gardenMap.length === 0) {
      const newMap: GardenTile[][] = [];

      for (let y = 0; y < GARDEN_HEIGHT; y++) {
        const row: GardenTile[] = [];
        for (let x = 0; x < GARDEN_WIDTH; x++) {
          // Generate terrain based on position and noise
          let tileType: GardenTile['type'] = 'grass';
          let variant = Math.floor(Math.random() * 4);

          // Add some variety to the terrain
          const noise = Math.sin(x * 0.3) * Math.cos(y * 0.2) + Math.random() * 0.3;

          if (noise > 0.7) tileType = 'tree';
          else if (noise > 0.5) tileType = 'rock';
          else if (noise < -0.5 && x > 3 && x < GARDEN_WIDTH - 3) tileType = 'water';
          else if (Math.random() < 0.1) tileType = 'dirt';

          row.push({ type: tileType, variant });
        }
        newMap.push(row);
      }

      setGardenMap(newMap);
    }
  }, []);

  // Initialize Tama positions - reacts to changes in Tama count
  useEffect(() => {
    if (gameState.tamas && gameState.tamas.length > 0) {
      setTamaPositions(prev => {
        const newPositions: Record<string, TamaPosition> = { ...prev };

        // Add positions for new Tamas
        gameState.tamas.forEach((tama, index) => {
          if (!newPositions[tama.id]) {
            // Spread new Tamas around the garden
            const angle = (index / gameState.tamas.length) * Math.PI * 2;
            const radius = Math.min(GARDEN_WIDTH, GARDEN_HEIGHT) * 0.3;
            const centerX = GARDEN_WIDTH / 2;
            const centerY = GARDEN_HEIGHT / 2;

            newPositions[tama.id] = {
              id: tama.id,
              x: Math.max(1, Math.min(GARDEN_WIDTH - 2, centerX + Math.cos(angle) * radius)),
              y: Math.max(1, Math.min(GARDEN_HEIGHT - 2, centerY + Math.sin(angle) * radius)),
              activity: 'idle',
              direction: Math.floor(Math.random() * 8),
              lastMove: Date.now()
            };
          }
        });

        // Remove positions for deleted Tamas
        const currentTamaIds = new Set(gameState.tamas.map(t => t.id));
        Object.keys(newPositions).forEach(tamaId => {
          if (!currentTamaIds.has(tamaId)) {
            delete newPositions[tamaId];
          }
        });

        return newPositions;
      });
    }
  }, [gameState.tamas?.length, gameState.tamas?.map(t => t.id).join(',') || '']); // React to tama count and IDs

  // Animation loop
  useEffect(() => {
    if (!isAnimating && Object.keys(tamaPositions).length > 0) {
      setIsAnimating(true);

      const animationLoop = () => {
        updateTamaPositions();
        renderGarden();
        setTimeout(animationLoop, 200); // 5 FPS for Dwarf Fortress feel
      };

      animationLoop();
    }
  }, [tamaPositions, gardenMap]);

  const updateTamaPositions = () => {
    const now = Date.now();

    setTamaPositions(prev => {
      const updated = { ...prev };

      Object.keys(updated).forEach(tamaId => {
        const pos = updated[tamaId];
        const tama = gameState.tamas.find(t => t.id === tamaId);

        if (!tama) return;

        // Get autonomous activity from advanced Tama or fall back to basic behavior
        const advancedTama = advancedTamas.find(at => at.id === tamaId);
        if (advancedTama && advancedTama.currentActivity) {
          // Use autonomous behavior activity
          pos.activity = advancedTama.currentActivity;
        } else {
          // Fall back to basic need-based activity
          const needsAttention = Object.values(tama.needs).some(need => need < 50);
          const hasHighEnergy = tama.needs.energy > 70;

          if (needsAttention) {
            pos.activity = tama.needs.hunger < 50 ? 'hungry' :
                            tama.needs.happiness < 50 ? 'sad' :
                            tama.needs.cleanliness < 50 ? 'dirty' : 'tired';
          } else if (hasHighEnergy) {
            pos.activity = Math.random() < 0.3 ? 'playing' : 'exploring';
          } else {
            pos.activity = 'resting';
          }
        }

        // Move Tamas occasionally
        if (now - pos.lastMove > 2000 + Math.random() * 3000) { // 2-5 seconds
          const moveChance = pos.activity === 'exploring' ? 0.8 :
                           pos.activity === 'playing' ? 0.6 : 0.2;

          if (Math.random() < moveChance) {
            // Pick a random nearby position
            const newX = Math.max(1, Math.min(GARDEN_WIDTH - 2,
              pos.x + (Math.random() - 0.5) * 4));
            const newY = Math.max(1, Math.min(GARDEN_HEIGHT - 2,
              pos.y + (Math.random() - 0.5) * 4));

            // Check if position is walkable
            if (gardenMap[Math.floor(newY)] &&
                gardenMap[Math.floor(newY)][Math.floor(newX)] &&
                gardenMap[Math.floor(newY)][Math.floor(newX)].type !== 'water' &&
                gardenMap[Math.floor(newY)][Math.floor(newX)].type !== 'rock') {

              pos.targetX = newX;
              pos.targetY = newY;
            }

            pos.lastMove = now;
          }
        }

        // Smooth movement towards target
        if (pos.targetX !== undefined && pos.targetY !== undefined) {
          const dx = pos.targetX - pos.x;
          const dy = pos.targetY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0.1) {
            const speed = 0.05; // Movement speed
            pos.x += (dx / distance) * speed;
            pos.y += (dy / distance) * speed;

            // Update direction
            pos.direction = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 8;
          } else {
            pos.x = pos.targetX;
            pos.y = pos.targetY;
            pos.targetX = undefined;
            pos.targetY = undefined;
          }
        }
      });

      return updated;
    });
  };

  const renderGarden = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up crisp pixel art rendering
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#2d5016'; // Dark green background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render terrain
    for (let y = 0; y < GARDEN_HEIGHT; y++) {
      for (let x = 0; x < GARDEN_WIDTH; x++) {
        if (!gardenMap[y] || !gardenMap[y][x]) continue;

        const tile = gardenMap[y][x];
        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        // Get color for tile type
        const colorSet = COLORS[tile.type];
        const color = colorSet[tile.variant % colorSet.length];

        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Add simple ASCII-like characters for terrain features
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = `${TILE_SIZE - 2}px monospace`;
        ctx.textAlign = 'center';

        let char = '';
        switch (tile.type) {
          case 'tree': char = '♠'; break;
          case 'rock': char = '●'; break;
          case 'water': char = '~'; break;
          case 'dirt': char = '·'; break;
        }

        if (char) {
          ctx.fillText(char, screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 2);
        }
      }
    }

    // Render Tamas
    Object.values(tamaPositions).forEach((pos, index) => {
      const tama = gameState.tamas.find(t => t.id === pos.id);
      if (!tama) return;

      const screenX = pos.x * TILE_SIZE;
      const screenY = pos.y * TILE_SIZE;

      // Tama body color based on species and tier
      const colorIndex = (tama.species.charCodeAt(0) + tama.tier) % COLORS.tamaColors.length;
      ctx.fillStyle = COLORS.tamaColors[colorIndex];

      // Draw Tama as a filled circle
      ctx.beginPath();
      ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      // Activity indicator
      ctx.fillStyle = 'white';
      ctx.font = `${TILE_SIZE - 4}px monospace`;
      ctx.textAlign = 'center';

      let activityChar = '';
      let fillStyle = 'white';
      switch (pos.activity) {
        // Basic need states
        case 'hungry': fillStyle = '#e74c3c'; activityChar = '♦'; break;
        case 'sad': fillStyle = '#3498db'; activityChar = '▼'; break;
        case 'dirty': fillStyle = '#3498db'; activityChar = '~'; break;
        case 'tired': fillStyle = '#95a5a6'; activityChar = 'z'; break;

        // Basic activities
        case 'playing': fillStyle = '#f1c40f'; activityChar = '○'; break;
        case 'exploring': fillStyle = '#e67e22'; activityChar = '?'; break;
        case 'resting': fillStyle = '#2ecc71'; activityChar = '♪'; break;

        // Autonomous activities
        case 'socializing': fillStyle = '#9b59b6'; activityChar = '♥'; break;
        case 'training': fillStyle = '#e74c3c'; activityChar = '⚔'; break;
        case 'crafting': fillStyle = '#f39c12'; activityChar = '⚒'; break;
        case 'studying': fillStyle = '#3498db'; activityChar = '📖'; break;
        case 'teaching': fillStyle = '#1abc9c'; activityChar = '🎓'; break;
        case 'competing': fillStyle = '#e67e22'; activityChar = '⚡'; break;
        case 'performing': fillStyle = '#9b59b6'; activityChar = '🎭'; break;
        case 'guarding': fillStyle = '#7f8c8d'; activityChar = '🛡'; break;

        default: fillStyle = '#7f8c8d'; activityChar = '●'; break;
      }

      // Use fallback characters for complex emoji
      if (activityChar === '📖') activityChar = '§';
      else if (activityChar === '🎓') activityChar = '∩';
      else if (activityChar === '🎭') activityChar = '☺';
      else if (activityChar === '🛡') activityChar = '╬';

      ctx.fillStyle = fillStyle;

      ctx.fillText(activityChar, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 2);

      // Tama name label (small, above)
      if (TILE_SIZE >= 16) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(screenX - 10, screenY - 16, tama.name.length * 6 + 4, 12);
        ctx.fillStyle = 'white';
        ctx.font = '10px monospace';
        ctx.fillText(tama.name, screenX + TILE_SIZE / 2, screenY - 6);
      }
    });

    // Draw grid (optional debug)
    if (false) { // Set to true for debug grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= GARDEN_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, GARDEN_HEIGHT * TILE_SIZE);
        ctx.stroke();
      }

      for (let y = 0; y <= GARDEN_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(GARDEN_WIDTH * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Garden Canvas */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">🌱 Tama Garden</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRelationshipsLocal(!showRelationshipsLocal)}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {showRelationshipsLocal ? 'Hide Relationships' : 'Show Relationships'}
            </button>
            <div className="text-sm text-gray-300">
              {Object.keys(tamaPositions).length} Tamas roaming
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-600 rounded bg-black overflow-hidden relative">
          <canvas
            ref={canvasRef}
            width={GARDEN_WIDTH * TILE_SIZE}
            height={GARDEN_HEIGHT * TILE_SIZE}
            className="block"
            role="img"
            aria-label="Tama Garden Canvas"
            style={{
              imageRendering: 'pixelated',
              width: `${GARDEN_WIDTH * TILE_SIZE * 2}px`, // 2x scaling
              height: `${GARDEN_HEIGHT * TILE_SIZE * 2}px`
            }}
          />
          {/* Relationship visualization overlay indicator */}
          {showRelationshipsLocal && (
            <div data-testid="relationship-overlay-active" className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 text-xs rounded">
              Relationships Active
            </div>
          )}
        </div>
      </div>

      {/* Activity Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-red-500">♦</span>
          <span className="text-gray-900">Hungry</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-blue-500">▼</span>
          <span className="text-gray-900">Sad</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-blue-500">~</span>
          <span className="text-gray-900">Dirty</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-gray-700">z</span>
          <span className="text-gray-900">Tired</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-yellow-600">○</span>
          <span className="text-gray-900">Playing</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-orange-600">?</span>
          <span className="text-gray-900">Exploring</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-green-600">♪</span>
          <span className="text-gray-900">Resting</span>
        </div>
        {/* Autonomous activities */}
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-purple-600">♥</span>
          <span className="text-gray-900">Socializing</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-red-600">⚔</span>
          <span className="text-gray-900">Training</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-orange-600">⚒</span>
          <span className="text-gray-900">Crafting</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-blue-600">§</span>
          <span className="text-gray-900">Studying</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-teal-600">∩</span>
          <span className="text-gray-900">Teaching</span>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded border">
          <span className="text-orange-600">⚡</span>
          <span className="text-gray-900">Competing</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-semibold mb-3">Garden Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-600">Active Tamas</div>
            <div className="text-lg font-semibold text-blue-600">
              {Object.values(tamaPositions).filter(p => p.activity === 'playing' || p.activity === 'exploring').length}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Needs Attention</div>
            <div className="text-lg font-semibold text-red-600">
              {Object.values(tamaPositions).filter(p =>
                ['hungry', 'sad', 'dirty', 'tired'].includes(p.activity)
              ).length}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Content</div>
            <div className="text-lg font-semibold text-green-600">
              {Object.values(tamaPositions).filter(p => p.activity === 'resting').length}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Garden Health</div>
            <div className="text-lg font-semibold text-purple-600">
              {Math.round((Object.values(tamaPositions).filter(p =>
                !['hungry', 'sad', 'dirty', 'tired'].includes(p.activity)
              ).length / Math.max(1, Object.keys(tamaPositions).length)) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};