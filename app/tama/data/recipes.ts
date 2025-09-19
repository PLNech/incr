import { Recipe, Item } from '../types';

export const RECIPES: Recipe[] = [
  // Food recipes
  {
    id: 'basic_food',
    name: 'Berry Snack',
    ingredients: [
      { itemId: 'berries', quantity: 2 },
      { itemId: 'wood', quantity: 1 }
    ],
    outputs: [
      { itemId: 'basic_food', quantity: 1 }
    ],
    craftTime: 5000, // 5 seconds
    requiredLevel: 1,
    category: 'food'
  },
  {
    id: 'premium_food',
    name: 'Berry Jam',
    ingredients: [
      { itemId: 'berries', quantity: 4 },
      { itemId: 'wood', quantity: 1 } // For jar
    ],
    outputs: [
      { itemId: 'premium_food', quantity: 1 }
    ],
    craftTime: 15000, // 15 seconds
    requiredLevel: 3,
    category: 'food'
  },
  {
    id: 'gourmet_food',
    name: 'Golden Berry Feast',
    ingredients: [
      { itemId: 'berries', quantity: 8 },
      { itemId: 'wood', quantity: 2 },
      { itemId: 'stone', quantity: 1 }
    ],
    outputs: [
      { itemId: 'gourmet_food', quantity: 1 }
    ],
    craftTime: 30000, // 30 seconds
    requiredLevel: 5,
    category: 'food'
  },

  // Toy recipes
  {
    id: 'simple_toy',
    name: 'Wooden Ball',
    ingredients: [
      { itemId: 'wood', quantity: 1 }
    ],
    outputs: [
      { itemId: 'ball', quantity: 1 }
    ],
    craftTime: 8000, // 8 seconds
    requiredLevel: 1,
    category: 'toy'
  },
  {
    id: 'puzzle_toy',
    name: 'Brain Puzzle',
    ingredients: [
      { itemId: 'wood', quantity: 3 },
      { itemId: 'stone', quantity: 1 }
    ],
    outputs: [
      { itemId: 'puzzle', quantity: 1 }
    ],
    craftTime: 20000, // 20 seconds
    requiredLevel: 4,
    category: 'toy'
  },
  {
    id: 'music_box',
    name: 'Melody Box',
    ingredients: [
      { itemId: 'wood', quantity: 5 },
      { itemId: 'stone', quantity: 2 },
      { itemId: 'berries', quantity: 3 } // For decoration
    ],
    outputs: [
      { itemId: 'music_box', quantity: 1 }
    ],
    craftTime: 45000, // 45 seconds
    requiredLevel: 6,
    category: 'toy'
  },

  // Equipment recipes
  {
    id: 'comfort_bed',
    name: 'Comfort Bed',
    ingredients: [
      { itemId: 'wood', quantity: 4 },
      { itemId: 'berries', quantity: 6 } // Soft padding
    ],
    outputs: [
      { itemId: 'comfort_bed', quantity: 1 }
    ],
    craftTime: 25000, // 25 seconds
    requiredLevel: 3,
    category: 'equipment'
  }
];

export const ITEMS: Record<string, Item> = {
  // Raw materials
  berries: {
    id: 'berries',
    name: 'Berries',
    type: 'material',
    tier: 0,
    description: 'Sweet berries that Tamas love to eat'
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    type: 'material',
    tier: 0,
    description: 'Sturdy wood for crafting'
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    type: 'material',
    tier: 0,
    description: 'Solid stone for advanced crafting'
  },

  // Food items
  basic_food: {
    id: 'basic_food',
    name: 'Berry Snack',
    type: 'consumable',
    tier: 0,
    effects: {
      hunger: 30,
      happiness: 5
    },
    description: 'A simple but nutritious snack'
  },
  premium_food: {
    id: 'premium_food',
    name: 'Berry Jam',
    type: 'consumable',
    tier: 1,
    effects: {
      hunger: 50,
      happiness: 15
    },
    description: 'Delicious jam that makes Tamas very happy'
  },
  gourmet_food: {
    id: 'gourmet_food',
    name: 'Golden Berry Feast',
    type: 'consumable',
    tier: 2,
    effects: {
      hunger: 70,
      happiness: 25,
      experienceMultiplier: 1.5
    },
    description: 'A luxurious feast fit for the finest Tamas'
  },

  // Toy items
  ball: {
    id: 'ball',
    name: 'Wooden Ball',
    type: 'consumable',
    tier: 0,
    effects: {
      happiness: 25,
      energy: -10
    },
    description: 'A simple ball for playful Tamas'
  },
  puzzle: {
    id: 'puzzle',
    name: 'Brain Puzzle',
    type: 'consumable',
    tier: 1,
    effects: {
      happiness: 15,
      energy: -5,
      experienceMultiplier: 2.0
    },
    description: 'A challenging puzzle that boosts learning'
  },
  music_box: {
    id: 'music_box',
    name: 'Melody Box',
    type: 'consumable',
    tier: 2,
    effects: {
      happiness: 30,
      energy: 5
    },
    description: 'Beautiful music that soothes and delights'
  },

  // Equipment items
  comfort_bed: {
    id: 'comfort_bed',
    name: 'Comfort Bed',
    type: 'equipment',
    tier: 1,
    effects: {
      happiness: 10,
      energy: 15
    },
    description: 'A cozy bed that helps Tamas rest better'
  }
};

// Quality tier multipliers (0 = basic, 1 = good, 2 = great, 3 = perfect)
export const QUALITY_MULTIPLIERS = [1.0, 1.5, 2.0, 3.0];
export const QUALITY_NAMES = ['Basic', 'Good', 'Great', 'Perfect'];

// Quality distribution (90% / 9% / 0.9% / 0.09%)
export const QUALITY_DISTRIBUTION = [90, 9, 0.9, 0.09];