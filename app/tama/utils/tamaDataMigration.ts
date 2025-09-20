import { TamaData, TamaSpecies, TamaTier } from '../types';
import {
  AdvancedTamaData,
  TamaRPGStats,
  TamaPersonalityTraits,
  PersonalityArchetype,
  Activity
} from '../types-advanced';

/**
 * Migrate existing TamaData to AdvancedTamaData structure
 * Converts basic genetics to RPG stats and generates personality
 */
export function migrateToAdvancedTama(basicTama: TamaData): AdvancedTamaData {
  const rpgStats = convertGeneticsToRPGStats(basicTama);
  const personality = generatePersonalityFromStats(rpgStats, basicTama.species, basicTama.tier);

  return {
    // Keep all existing properties
    id: basicTama.id,
    name: basicTama.name,
    species: basicTama.species,
    tier: basicTama.tier,
    level: basicTama.level,
    experience: basicTama.experience,
    needs: basicTama.needs,
    stats: basicTama.stats,
    skills: basicTama.skills || {},
    createdAt: basicTama.createdAt,
    lastInteraction: basicTama.lastInteraction,
    sleepState: basicTama.sleepState,

    // New advanced properties
    rpgStats,
    personality,
    relationships: {},
    currentGoals: [],
    goalHistory: [],

    // Autonomous behavior state
    currentActivity: null,
    activityStartTime: Date.now(),
    activityLocation: 'garden_center',
    autonomyLevel: 25 + basicTama.level * 2, // Base autonomy increases with level

    // Social status derived from genetics and level
    socialStatus: {
      reputation: Math.min(100, 30 + basicTama.level * 3 + rpgStats.charisma),
      leadership: Math.min(100, rpgStats.charisma + rpgStats.wisdom - 10),
      popularity: Math.min(100, 20 + rpgStats.charisma * 2),
      respect: Math.min(100, 10 + basicTama.level * 2 + rpgStats.intelligence)
    },

    // Territory and possessions
    territory: {
      claimedAreas: [],
      favoriteSpots: ['garden_center'], // Everyone starts in the center
      sharedAreas: ['garden_center', 'garden_water', 'garden_trees']
    },

    possessions: {
      personalItems: [],
      sharedItems: [],
      treasuredItems: []
    },

    // Mental state based on current needs and personality
    mentalState: {
      stress: Math.max(0, 100 - Object.values(basicTama.needs).reduce((a, b) => a + b, 0) / 4),
      confidence: Math.min(100, 40 + basicTama.level * 3 + rpgStats.charisma),
      satisfaction: Math.min(100, Object.values(basicTama.needs).reduce((a, b) => a + b, 0) / 4),
      lastMajorEvent: null
    }
  };
}

/**
 * Convert basic genetics to RPG stats using reasonable mappings
 */
function convertGeneticsToRPGStats(tama: TamaData): TamaRPGStats {
  const genetics = tama.genetics;
  const level = tama.level;

  // Base stats (6-14 range, modified by genetics and species)
  const baseStats = {
    strength: 8 + Math.floor(genetics.energy * 0.06), // Energy -> Strength
    agility: 8 + Math.floor(genetics.energy * 0.06), // Energy affects agility too
    intelligence: 8 + Math.floor(genetics.intelligence * 0.06),
    wisdom: 8 + Math.floor(genetics.intelligence * 0.04) + Math.floor(genetics.cuteness * 0.02), // Int + some cuteness
    charisma: 8 + Math.floor(genetics.cuteness * 0.06),
    constitution: 8 + Math.floor((100 - genetics.appetite) * 0.04) + Math.floor(genetics.energy * 0.02) // Low appetite = high constitution
  };

  // Apply species modifiers
  const speciesModifiers = getSpeciesStatModifiers(tama.species);
  Object.keys(baseStats).forEach(stat => {
    baseStats[stat as keyof typeof baseStats] += speciesModifiers[stat as keyof typeof speciesModifiers] || 0;
  });

  // Apply tier bonuses
  const tierBonus = tama.tier * 2;
  Object.keys(baseStats).forEach(stat => {
    baseStats[stat as keyof typeof baseStats] += tierBonus;
  });

  // Calculate derived stats
  const health = baseStats.constitution * 10 + level * 5;
  const mana = baseStats.intelligence + baseStats.wisdom;
  const stamina = baseStats.constitution + baseStats.agility;
  const armorClass = 10 + Math.floor(baseStats.agility / 2) + Math.floor(level / 4);
  const attackBonus = Math.max(baseStats.strength, baseStats.agility) + Math.floor(level / 3);

  // Generate skills based on stats and some randomness
  const skills = generateSkillsFromStats(baseStats, level);

  // Growth rates based on personality and stats
  const growthRates = {
    combat: (baseStats.strength + baseStats.constitution) / 20,
    social: (baseStats.charisma + baseStats.wisdom) / 20,
    academic: (baseStats.intelligence + baseStats.wisdom) / 20,
    creative: (baseStats.charisma + baseStats.intelligence) / 20
  };

  return {
    ...baseStats,
    health,
    mana,
    stamina,
    armorClass,
    attackBonus,
    skills,
    growthRates
  };
}

/**
 * Species-specific stat modifiers
 */
function getSpeciesStatModifiers(species: TamaSpecies) {
  switch (species) {
    case 'basic': return { strength: 0, agility: 0, intelligence: 0, wisdom: 0, charisma: 0, constitution: 0 };
    case 'forest': return { strength: 1, agility: 2, intelligence: 0, wisdom: 2, charisma: 0, constitution: 1 };
    case 'aquatic': return { strength: 0, agility: 2, intelligence: 1, wisdom: 1, charisma: 1, constitution: 1 };
    case 'crystal': return { strength: 0, agility: 0, intelligence: 3, wisdom: 2, charisma: 2, constitution: -1 };
    case 'shadow': return { strength: 2, agility: 3, intelligence: 1, wisdom: 0, charisma: -1, constitution: 1 };
    case 'cosmic': return { strength: 1, agility: 1, intelligence: 2, wisdom: 3, charisma: 2, constitution: 0 };
    default: return { strength: 0, agility: 0, intelligence: 0, wisdom: 0, charisma: 0, constitution: 0 };
  }
}

/**
 * Generate skills based on RPG stats
 */
function generateSkillsFromStats(stats: any, level: number) {
  const baseSkill = Math.max(0, level - 1) * 5; // 5 skill points per level after 1st

  return {
    // Physical skills
    athletics: baseSkill + stats.strength + stats.constitution + Math.floor(Math.random() * 10),
    combat: baseSkill + Math.max(stats.strength, stats.agility) + Math.floor(Math.random() * 10),
    stealth: baseSkill + stats.agility + Math.floor(Math.random() * 10),
    survival: baseSkill + stats.wisdom + stats.constitution + Math.floor(Math.random() * 10),

    // Mental skills
    academics: baseSkill + stats.intelligence + Math.floor(Math.random() * 10),
    crafting: baseSkill + stats.intelligence + stats.agility + Math.floor(Math.random() * 10),
    medicine: baseSkill + stats.wisdom + stats.intelligence + Math.floor(Math.random() * 10),
    investigation: baseSkill + stats.intelligence + stats.wisdom + Math.floor(Math.random() * 10),

    // Social skills
    persuasion: baseSkill + stats.charisma + Math.floor(Math.random() * 10),
    performance: baseSkill + stats.charisma + Math.floor(Math.random() * 10),
    insight: baseSkill + stats.wisdom + Math.floor(Math.random() * 10),
    animalHandling: baseSkill + stats.wisdom + stats.charisma + Math.floor(Math.random() * 10)
  };
}

/**
 * Generate personality traits based on stats and species
 */
function generatePersonalityFromStats(stats: TamaRPGStats, species: TamaSpecies, tier: TamaTier): TamaPersonalityTraits {
  // Determine archetype based on highest stats
  const statPairs = [
    { stats: stats.charisma + stats.wisdom, archetype: 'leader' as PersonalityArchetype },
    { stats: stats.strength + stats.constitution, archetype: 'warrior' as PersonalityArchetype },
    { stats: stats.intelligence + stats.wisdom, archetype: 'scholar' as PersonalityArchetype },
    { stats: stats.charisma + stats.intelligence, archetype: 'artist' as PersonalityArchetype },
    { stats: stats.agility + stats.wisdom, archetype: 'explorer' as PersonalityArchetype },
    { stats: stats.wisdom + stats.charisma, archetype: 'caretaker' as PersonalityArchetype }
  ];

  const dominantArchetype = statPairs.reduce((prev, curr) =>
    prev.stats > curr.stats ? prev : curr
  ).archetype;

  // Generate Big 5 traits based on stats
  const openness = Math.min(100, 30 + stats.intelligence + stats.wisdom + Math.floor(Math.random() * 20));
  const conscientiousness = Math.min(100, 30 + stats.wisdom + Math.floor(Math.random() * 20));
  const extraversion = Math.min(100, 20 + stats.charisma * 2 + Math.floor(Math.random() * 20));
  const agreeableness = Math.min(100, 40 + stats.wisdom + stats.charisma + Math.floor(Math.random() * 10));
  const neuroticism = Math.max(0, 60 - stats.constitution - stats.wisdom + Math.floor(Math.random() * 20));

  // Generate behavioral tendencies
  const aggression = Math.max(0, stats.strength - stats.wisdom + Math.floor(Math.random() * 30));
  const curiosity = Math.min(100, stats.intelligence + stats.wisdom + Math.floor(Math.random() * 20));
  const loyalty = Math.min(100, 50 + stats.wisdom + Math.floor(Math.random() * 20));
  const independence = Math.min(100, 30 + stats.agility + (100 - extraversion) / 2);
  const playfulness = Math.min(100, 40 + stats.charisma + Math.floor(Math.random() * 30));
  const competitiveness = Math.min(100, 20 + stats.strength + stats.charisma + Math.floor(Math.random() * 20));

  // Determine preferences based on personality
  const preferredGroupSize = extraversion > 70 ? 'large' :
                           extraversion > 40 ? 'medium' :
                           extraversion > 20 ? 'small' : 'solitary';

  const leadershipStyle = stats.charisma > 15 ? 'democratic' :
                         aggression > 60 ? 'autocratic' :
                         openness > 70 ? 'laissez-faire' : 'follower';

  const conflictStyle = aggression > 70 ? 'aggressive' :
                       stats.charisma > 14 ? 'assertive' :
                       agreeableness > 80 ? 'passive' : 'avoidant';

  // Generate activity preferences based on archetype and stats
  const favoriteActivities = generateFavoriteActivities(dominantArchetype, stats);
  const dislikedActivities = generateDislikedActivities(dominantArchetype, stats);

  return {
    archetype: dominantArchetype,
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,
    aggression,
    curiosity,
    loyalty,
    independence,
    playfulness,
    competitiveness,
    preferredGroupSize,
    leadershipStyle,
    conflictStyle,
    favoriteActivities,
    dislikedActivities,
    compatibilityFactors: {
      needsLeadership: leadershipStyle === 'follower',
      enjoysCompetition: competitiveness > 60,
      needsStability: neuroticism < 30,
      enjoysLearning: curiosity > 60,
      needsSocializing: extraversion > 50
    }
  };
}

function generateFavoriteActivities(archetype: PersonalityArchetype, stats: TamaRPGStats): Activity[] {
  const baseActivities: Activity[] = ['socializing', 'resting'];

  switch (archetype) {
    case 'leader': return [...baseActivities, 'teaching', 'socializing'];
    case 'warrior': return [...baseActivities, 'training', 'competing', 'guarding'];
    case 'scholar': return [...baseActivities, 'studying', 'exploring', 'teaching'];
    case 'artist': return [...baseActivities, 'crafting', 'performing', 'exploring'];
    case 'explorer': return [...baseActivities, 'exploring', 'training', 'studying'];
    case 'caretaker': return [...baseActivities, 'teaching', 'socializing'];
    case 'trickster': return [...baseActivities, 'competing', 'performing', 'exploring'];
    case 'hermit': return ['studying', 'resting', 'crafting'];
    case 'guardian': return [...baseActivities, 'guarding', 'training'];
    case 'socialite': return [...baseActivities, 'socializing', 'performing'];
    default: return baseActivities;
  }
}

function generateDislikedActivities(archetype: PersonalityArchetype, stats: TamaRPGStats): Activity[] {
  switch (archetype) {
    case 'hermit': return ['socializing', 'performing'];
    case 'warrior': return ['studying'];
    case 'scholar': return ['competing'];
    case 'socialite': return ['resting'];
    default: return [];
  }
}

/**
 * Check if a Tama needs migration from basic to advanced format
 */
export function needsMigration(tama: any): tama is TamaData {
  return 'genetics' in tama && !('rpgStats' in tama);
}

/**
 * Migrate all Tamas in a game state
 */
export function migrateAllTamas(tamas: (TamaData | AdvancedTamaData)[]): AdvancedTamaData[] {
  return tamas.map(tama => {
    if (needsMigration(tama)) {
      console.log(`Migrating Tama ${tama.name} to advanced format`);
      return migrateToAdvancedTama(tama);
    }
    return tama as AdvancedTamaData;
  });
}