import { GameResources } from '../types';

export interface ResourceConfig {
  key: keyof GameResources;
  name: string;
  icon: string;
  priority: number;
  lowThreshold: number;
}

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  // Primary currency
  { key: 'tamaCoins', name: 'Tama Coins', icon: '🪙', priority: 1, lowThreshold: 100 },

  // Japanese crafting materials
  { key: 'rice_grain', name: 'Rice Grain', icon: '🌾', priority: 2, lowThreshold: 5 },
  { key: 'bamboo_fiber', name: 'Bamboo Fiber', icon: '🎋', priority: 3, lowThreshold: 3 },
  { key: 'silk_thread', name: 'Silk Thread', icon: '🧵', priority: 4, lowThreshold: 2 },
  { key: 'green_tea_leaf', name: 'Green Tea Leaf', icon: '🍃', priority: 5, lowThreshold: 3 },

  // Special resources
  { key: 'spirit_essence', name: 'Spirit Essence', icon: '🔮', priority: 6, lowThreshold: 1 },
  { key: 'happinessStars', name: 'Happiness Stars', icon: '⭐', priority: 7, lowThreshold: 0 }
];

export const getResourceIcon = (resourceKey: keyof GameResources): string => {
  const config = RESOURCE_CONFIGS.find(c => c.key === resourceKey);
  return config?.icon || '📦';
};

export const getResourceName = (resourceKey: keyof GameResources): string => {
  const config = RESOURCE_CONFIGS.find(c => c.key === resourceKey);
  return config?.name || resourceKey;
};

export const formatResourceCost = (cost: Partial<GameResources>): string => {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(cost)) {
    if (value && value > 0) {
      const icon = getResourceIcon(key as keyof GameResources);
      parts.push(`${value.toLocaleString()} ${icon}`);
    }
  }

  return parts.join(', ');
};