// Advanced Tama character system - comprehensive RPG-style design

import { TamaData, TamaNeeds } from './types';

export type PersonalityArchetype =
  | 'leader'      // High CHA, tends to organize others
  | 'warrior'     // High STR/CON, protective, competitive
  | 'scholar'     // High INT/WIS, curious, studious
  | 'artist'      // High CHA/WIS, creative, emotional
  | 'explorer'    // High AGI/WIS, wanderlust, independent
  | 'caretaker'   // High WIS/CHA, nurturing, helpful
  | 'trickster'   // High AGI/CHA, mischievous, unpredictable
  | 'hermit'      // Low CHA, high INT/WIS, prefers solitude
  | 'guardian'    // High STR/CON/WIS, protective, stable
  | 'socialite';  // High CHA, loves crowds and parties

export interface TamaRPGStats {
  // Primary D&D-style attributes (1-20, with racial modifiers)
  strength: number;     // Physical power, melee combat, carrying capacity
  agility: number;      // Speed, reflexes, ranged combat, stealth
  intelligence: number; // Learning rate, crafting, magic, problem solving
  wisdom: number;       // Intuition, willpower, divine magic, perception
  charisma: number;     // Leadership, social skills, performance, some magic
  constitution: number; // Health, stamina, poison/disease resistance

  // Derived combat stats
  health: number;           // CON * 10 + level bonuses
  mana: number;             // INT + WIS for magical abilities
  stamina: number;          // CON + AGI for sustained activity
  armorClass: number;       // Natural + equipment AC
  attackBonus: number;      // STR or AGI based on weapon type

  // Skill proficiencies (0-100, affected by relevant stats)
  skills: {
    // Physical Skills (STR/AGI/CON based)
    athletics: number;      // Climbing, swimming, jumping
    combat: number;         // Weapon mastery, tactics
    stealth: number;        // Hiding, silent movement
    survival: number;       // Wilderness, foraging, tracking

    // Mental Skills (INT/WIS based)
    academics: number;      // History, science, languages
    crafting: number;       // Making items, engineering
    medicine: number;       // Healing, anatomy, poison knowledge
    investigation: number;  // Finding clues, research

    // Social Skills (CHA/WIS based)
    persuasion: number;     // Convincing others, leadership
    performance: number;    // Entertainment, artistic expression
    insight: number;        // Reading emotions, detecting lies
    animalHandling: number; // Training, calming creatures
  };

  // Growth and learning patterns
  growthRates: {
    combat: number;         // How quickly they learn fighting
    social: number;         // How quickly they develop relationships
    academic: number;       // How quickly they learn complex topics
    creative: number;       // How quickly they develop artistic skills
  };
}

export interface TamaPersonalityTraits {
  archetype: PersonalityArchetype;

  // Big 5 personality traits (0-100)
  openness: number;       // Creativity, curiosity, willingness to try new things
  conscientiousness: number; // Discipline, organization, reliability
  extraversion: number;   // Social energy, assertiveness, talkativeness
  agreeableness: number;  // Cooperation, trust, empathy
  neuroticism: number;    // Anxiety, emotional instability, stress sensitivity

  // Behavioral tendencies (0-100)
  aggression: number;     // Likelihood to start conflicts
  curiosity: number;      // Drive to explore and learn
  loyalty: number;        // Dedication to friends and causes
  independence: number;   // Preference for solo vs group activities
  playfulness: number;    // Tendency toward fun and games
  competitiveness: number; // Drive to win and excel

  // Social preferences
  preferredGroupSize: 'solitary' | 'small' | 'medium' | 'large';
  leadershipStyle: 'democratic' | 'autocratic' | 'laissez-faire' | 'follower';
  conflictStyle: 'aggressive' | 'assertive' | 'passive' | 'avoidant';

  // Activity preferences (affects autonomous behavior)
  favoriteActivities: Activity[];
  dislikedActivities: Activity[];

  // Relationship compatibility modifiers
  compatibilityFactors: {
    needsLeadership: boolean;     // Prefers to follow strong leaders
    enjoysCompetition: boolean;   // Thrives in competitive environments
    needsStability: boolean;      // Stressed by unpredictable situations
    enjoysLearning: boolean;      // Seeks intellectual stimulation
    needsSocializing: boolean;    // Requires frequent social interaction
  };
}

export type Activity =
  | 'training'     // Skill development, exercise
  | 'socializing'  // Talking, playing with others
  | 'crafting'     // Making things, creative work
  | 'exploring'    // Wandering, discovering new areas
  | 'resting'      // Sleeping, relaxing, meditating
  | 'competing'    // Contests, games, challenges
  | 'teaching'     // Helping others learn skills
  | 'studying'     // Reading, learning, research
  | 'performing'   // Entertainment, showing off
  | 'guarding';    // Protecting territory or others

export interface TamaRelationship {
  targetId: string;
  relationshipType: RelationshipType;
  strength: number;         // -100 (enemies) to +100 (best friends/lovers)
  trust: number;           // 0-100, affects cooperation
  respect: number;         // 0-100, affects deference and learning

  // Relationship history affects current dynamics
  history: RelationshipEvent[];

  // How they interact autonomously
  interactionFrequency: number; // How often they seek each other out
  cooperationLevel: number;     // Likelihood to work together
  conflictLevel: number;        // Likelihood to fight or compete

  // Compatibility factors
  personalityCompatibility: number;  // How well personalities mesh
  statComplementarity: number;       // How well their skills complement
  sharedInterests: number;           // Common favorite activities

  lastInteraction: number;      // Timestamp of last autonomous interaction
  relationshipStability: number; // How resistant to change this relationship is
}

export type RelationshipType =
  | 'stranger'     // Just met, neutral
  | 'acquaintance' // Know each other casually
  | 'friend'       // Positive relationship, mutual support
  | 'best_friend'  // Very close, high trust and cooperation
  | 'rival'        // Competitive but respectful opposition
  | 'enemy'        // Active hostility, will avoid or confront
  | 'mentor'       // Teaching relationship, high respect one way
  | 'student'      // Learning relationship, high respect other way
  | 'romantic'     // Love interest, unique bonuses and jealousy
  | 'family'       // Related Tamas (breeding), permanent bond
  | 'leader'       // Follower relationship, deference and loyalty
  | 'follower';    // Leadership relationship, responsibility

export interface RelationshipEvent {
  timestamp: number;
  eventType: 'cooperation' | 'conflict' | 'teaching' | 'bonding' | 'betrayal' | 'rescue' | 'competition';
  impact: number;        // How much this changed the relationship
  description: string;   // Human-readable description of what happened
  witnessIds: string[];  // Other Tamas who saw this, affects their relationships too
}

export interface AutonomousGoal {
  id: string;
  type: GoalType;
  priority: number;      // 1-10, higher = more important
  targetId?: string;     // For social goals, target Tama or object
  requiredStats?: Partial<TamaRPGStats>; // Stat requirements to attempt
  timeRequired: number;  // How long this takes in minutes

  // Success conditions
  skillCheck?: {
    skill: keyof TamaRPGStats['skills'];
    difficulty: number;   // DC to beat
    criticalSuccess: number; // Roll needed for exceptional results
  };

  // Rewards for completion
  rewards: {
    statGains?: Partial<TamaRPGStats>;
    skillExperience?: Partial<Record<keyof TamaRPGStats['skills'], number>>;
    relationshipChanges?: { targetId: string; change: number }[];
    moodChange: number;   // Happiness modifier
    items?: string[];     // Items gained/created
    stressIncrease?: number; // Optional stress change for rewards too
  };

  // Failure consequences
  failureEffects: {
    statLoss?: Partial<TamaRPGStats>;
    skillExperience?: Partial<Record<keyof TamaRPGStats['skills'], number>>;
    relationshipDamage?: { targetId: string; damage: number }[];
    moodChange: number;
    stressIncrease: number;
  };

  // Conditions when this goal becomes available/unavailable
  availabilityConditions: {
    minimumStats?: Partial<TamaRPGStats>;
    requiredRelationships?: { targetId: string; minimumStrength: number }[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    requiredItems?: string[];
    forbiddenActivities?: Activity[]; // Can't do this while doing these
  };
}

export type GoalType =
  | 'train_skill'      // Practice a specific skill alone
  | 'socialize'        // Seek out social interaction
  | 'compete'          // Challenge someone to a contest
  | 'teach'            // Help someone learn a skill
  | 'explore'          // Wander and discover new areas
  | 'create'           // Make something (art, crafts, etc.)
  | 'rest'             // Sleep or relax to recover
  | 'resolve_conflict' // Try to fix a damaged relationship
  | 'bond'             // Deepen an existing friendship
  | 'establish_territory' // Claim a favorite spot
  | 'help_friend'      // Assist another Tama with their goals
  | 'avoid_enemy'      // Stay away from someone they dislike
  | 'seek_romance'     // Try to develop romantic relationship
  | 'protect_territory' // Defend claimed area from intruders
  | 'gather_resources' // Collect items or food
  | 'seek_stimulation'; // Find interesting/challenging activities

// Enhanced Tama data structure
export interface AdvancedTamaData extends Omit<TamaData, 'genetics' | 'personality' | 'stats'> {
  // Replace basic genetics with full RPG system
  rpgStats: TamaRPGStats;
  // Keep original stats for compatibility
  stats: {
    totalInteractions: number;
    hoursLived: number;
    jobsCompleted: number;
  };
  personality: TamaPersonalityTraits;

  // Social and autonomous systems
  relationships: Record<string, TamaRelationship>; // keyed by other Tama ID
  currentGoals: AutonomousGoal[];                  // What they're trying to do
  goalHistory: CompletedGoal[];                    // What they've accomplished

  // Autonomous behavior state
  currentActivity: Activity | null;        // What they're doing right now
  activityStartTime: number;              // When they started current activity
  activityLocation: string;               // Where they're doing it
  autonomyLevel: number;                  // 0-100, how independently they act

  // Social status and reputation
  socialStatus: {
    reputation: number;      // How others generally view them (0-100)
    leadership: number;      // Natural leadership ability (0-100)
    popularity: number;      // How well-liked they are overall (0-100)
    respect: number;         // How much others respect their abilities (0-100)
  };

  // Territorial and possession concepts
  territory: {
    claimedAreas: string[];   // Areas this Tama considers "theirs"
    favoriteSpots: string[];  // Preferred locations for different activities
    sharedAreas: string[];    // Areas they're willing to share
  };

  possessions: {
    personalItems: string[];   // Items that belong specifically to this Tama
    sharedItems: string[];     // Items they're willing to let others use
    treasuredItems: string[];  // Items with special emotional significance
  };

  // Stress and mental health
  mentalState: {
    stress: number;           // 0-100, affects performance and relationships
    confidence: number;       // 0-100, affects willingness to try new things
    satisfaction: number;     // 0-100, how content they are with their life
    lastMajorEvent: {         // Significant events affect mental state
      type: 'positive' | 'negative' | 'neutral';
      impact: number;
      timestamp: number;
      description: string;
    } | null;
  };
}

export interface CompletedGoal extends AutonomousGoal {
  completionTime: number;
  success: boolean;
  outcomeDescription: string;
  actualRewards: AutonomousGoal['rewards'];
  witnessReactions?: Record<string, 'impressed' | 'jealous' | 'supportive' | 'indifferent'>;
}