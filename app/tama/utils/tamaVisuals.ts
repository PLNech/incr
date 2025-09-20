import { TamaSpecies, TamaTier } from '../types';

export interface SpeciesTheme {
  primary: string;
  secondary: string;
  text: string;
  border: string;
  accent: string;
  emoji: string;
}

export interface RarityEffect {
  name: string;
  glow: string;
  bonus: string;
  color: string;
  background: string;
}

export const SPECIES_THEMES: Record<TamaSpecies, SpeciesTheme> = {
  basic: {
    primary: 'bg-amber-500',
    secondary: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    accent: 'bg-amber-200',
    emoji: '🐾'
  },
  forest: {
    primary: 'bg-green-500',
    secondary: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    accent: 'bg-green-200',
    emoji: '🌿'
  },
  aquatic: {
    primary: 'bg-blue-500',
    secondary: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    accent: 'bg-blue-200',
    emoji: '🌊'
  },
  crystal: {
    primary: 'bg-purple-500',
    secondary: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    accent: 'bg-purple-200',
    emoji: '💎'
  },
  shadow: {
    primary: 'bg-gray-700',
    secondary: 'bg-gray-200',
    text: 'text-gray-800',
    border: 'border-gray-400',
    accent: 'bg-gray-300',
    emoji: '🌙'
  },
  cosmic: {
    primary: 'bg-indigo-500',
    secondary: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    accent: 'bg-indigo-200',
    emoji: '⭐'
  }
};

export const RARITY_EFFECTS: Record<TamaTier, RarityEffect> = {
  0: {
    name: 'Common',
    glow: '',
    bonus: '+0%',
    color: 'text-gray-600',
    background: 'bg-gray-100'
  },
  1: {
    name: 'Uncommon',
    glow: 'shadow-md',
    bonus: '+10%',
    color: 'text-green-600',
    background: 'bg-green-50'
  },
  2: {
    name: 'Rare',
    glow: 'shadow-lg shadow-blue-200',
    bonus: '+25%',
    color: 'text-blue-600',
    background: 'bg-blue-50'
  },
  3: {
    name: 'Epic',
    glow: 'shadow-xl shadow-purple-300 animate-pulse',
    bonus: '+50%',
    color: 'text-purple-600',
    background: 'bg-purple-50'
  }
};

export const getSpeciesTheme = (species: TamaSpecies): SpeciesTheme => {
  return SPECIES_THEMES[species];
};

export const getRarityEffect = (tier: TamaTier): RarityEffect => {
  return RARITY_EFFECTS[tier];
};

export const getTamaDisplayName = (species: TamaSpecies): string => {
  const names = {
    basic: 'Basic',
    forest: 'Forest',
    aquatic: 'Aquatic',
    crystal: 'Crystal',
    shadow: 'Shadow',
    cosmic: 'Cosmic'
  };
  return names[species];
};

export const getSpeciesDescription = (species: TamaSpecies): string => {
  const descriptions = {
    basic: 'Friendly and adaptable, perfect for beginners',
    forest: 'Nature-loving Tamas with enhanced growth abilities',
    aquatic: 'Graceful swimmers with calming presence',
    crystal: 'Mystical beings with enhanced spiritual connection',
    shadow: 'Mysterious and independent, masters of stealth',
    cosmic: 'Ethereal creatures attuned to celestial energies'
  };
  return descriptions[species];
};

export const getUnlockRequirement = (species: TamaSpecies): number => {
  const requirements = {
    basic: 1,
    forest: 3,
    aquatic: 5,
    crystal: 8,
    shadow: 12,
    cosmic: 15
  };
  return requirements[species];
};