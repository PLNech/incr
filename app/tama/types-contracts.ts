// Enhanced Contract System - Economic, Care, and Adoption contracts

import { AdvancedTamaData, TamaRPGStats, PersonalityArchetype, TamaPersonalityTraits, RelationshipType } from './types-advanced';
import { TamaSpecies, TamaTier, TamaNeeds } from './types';

export type ContractCategory = 'economic' | 'care' | 'adoption' | 'competition' | 'research' | 'entertainment';

export interface BaseContract {
  id: string;
  category: ContractCategory;
  customerId: string;
  title: string;
  description: string;

  // Time constraints
  duration: number;           // Contract length in hours
  deadline?: number;          // Optional hard deadline timestamp
  timePosted: number;         // When contract was made available
  expiryTime: number;         // When contract offer expires

  // Requirements
  requirements: ContractRequirements;

  // Rewards and risks
  basePayment: number;        // Minimum guaranteed payment
  bonusConditions: BonusCondition[];
  penalties: PenaltyCondition[];

  // Contract state
  status: 'available' | 'assigned' | 'active' | 'completed' | 'failed' | 'cancelled';
  assignedTamaId?: string;
  startTime?: number;

  // Reputation effects
  reputationImpact: {
    success: number;          // Rep gained on success
    failure: number;          // Rep lost on failure
    difficulty: number;       // Multiplier based on contract complexity
  };
}

export interface ContractRequirements {
  // Tama stat requirements
  minimumStats?: Partial<TamaRPGStats>;
  forbiddenStats?: Partial<TamaRPGStats>; // Stats that must be BELOW threshold

  // Skill requirements
  requiredSkills?: Partial<Record<keyof TamaRPGStats['skills'], number>>;

  // Personality requirements
  personalityRequirements?: {
    archetype?: PersonalityArchetype[];    // Must be one of these types
    minimumTraits?: Partial<TamaPersonalityTraits>;
    forbiddenTraits?: Partial<TamaPersonalityTraits>;
  };

  // Physical requirements
  speciesRestrictions?: TamaSpecies[];
  tierRequirements?: { minimum?: TamaTier; maximum?: TamaTier };
  levelRequirements?: { minimum?: number; maximum?: number };

  // Relationship requirements (for some contracts)
  relationshipRequirements?: {
    mustHaveFriend?: boolean;     // Need at least one friend
    mustBeSocial?: number;        // Minimum number of positive relationships
    cantHaveEnemies?: boolean;    // No negative relationships allowed
  };

  // Condition requirements
  healthRequirements?: {
    minimumNeeds?: Partial<TamaNeeds>;
    maximumStress?: number;
    minimumSatisfaction?: number;
  };
}

export interface BonusCondition {
  condition: string;            // Human-readable condition
  checkFunction: (tama: AdvancedTamaData, contract: BaseContract) => boolean;
  bonus: number;               // Additional payment
  description: string;         // What the customer wants to see
}

export interface PenaltyCondition {
  condition: string;
  checkFunction: (tama: AdvancedTamaData, contract: BaseContract) => boolean;
  penalty: number;             // Payment reduction or reputation loss
  description: string;         // What would trigger this penalty
}

// ============ ECONOMIC CONTRACTS ============
// Buy/sell items with profit margins, market trading

export interface EconomicContract extends BaseContract {
  category: 'economic';
  economicType: 'buy' | 'sell' | 'trade' | 'transport' | 'negotiate';

  itemDetails: {
    itemsRequested?: { itemId: string; quantity: number; maxPrice: number }[];
    itemsOffered?: { itemId: string; quantity: number; minPrice: number }[];
    tradeItems?: { give: string[]; receive: string[] }[];

    // Market dynamics
    marketConditions: {
      demand: number;           // 0-100, affects prices
      supply: number;           // 0-100, affects availability
      volatility: number;       // 0-100, how much prices fluctuate
      trendDirection: 'rising' | 'falling' | 'stable';
    };

    // Profit opportunities
    expectedMargin: number;     // What profit margin customer expects
    riskLevel: 'low' | 'medium' | 'high'; // Higher risk = higher potential profit

    // Special conditions
    timesSensitive?: boolean;   // Must complete quickly for full payment
    qualityMatters?: boolean;   // Item condition affects payment
    exclusiveDealer?: boolean;  // Can't work with competitors during contract
  };
}

// ============ CARE CONTRACTS ============
// Temporary custody requiring improvement

export interface CareContract extends BaseContract {
  category: 'care';
  careType: 'rehabilitation' | 'training' | 'socialization' | 'medical' | 'behavioral';

  temporaryTama: {
    // The Tama being cared for (generated for this contract)
    tamaData: AdvancedTamaData;

    // Current problems that need addressing
    issues: CareIssue[];

    // Improvement goals
    improvementGoals: ImprovementGoal[];

    // Care instructions
    careInstructions: {
      feedingSchedule?: string;
      exerciseRequirements?: string;
      socialNeeds?: string;
      medicalNeeds?: string;
      behavioralGuidelines?: string;
    };

    // Return conditions
    returnRequirements: {
      minimumImprovement: Record<string, number>; // What stats/skills must improve
      forbiddenDeclines: Record<string, number>;  // What stats can't get worse
      behavioralTargets?: string[];              // Specific behaviors to develop
      socialTargets?: string[];                  // Relationships to form
    };
  };
}

export interface CareIssue {
  type: 'health' | 'behavioral' | 'social' | 'educational' | 'emotional';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  description: string;
  affectedStats: Record<string, number>; // What stats are reduced by this issue
  treatmentMethods: string[];           // Suggested ways to address it
  timeToResolve: number;               // Estimated hours of care needed
}

export interface ImprovementGoal {
  goalType: 'stat' | 'skill' | 'relationship' | 'behavior' | 'achievement';
  target: string;                      // What specific thing to improve
  currentValue: number;                // Starting point
  targetValue: number;                 // Where it needs to be
  deadline: number;                    // When this must be achieved by
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Rewards for achieving this specific goal
  completionBonus: number;
  reputationBonus: number;
}

// ============ ADOPTION CONTRACTS ============
// Permanent placement with specific requirements

export interface AdoptionContract extends BaseContract {
  category: 'adoption';
  adoptionType: 'any' | 'specific' | 'breeding' | 'companion' | 'working' | 'show';

  adoptionDetails: {
    // What they're looking for
    seekingType: 'surrender' | 'purchase' | 'breeding_rights' | 'co_ownership';

    // Specific requests
    specificTamaId?: string;           // Want a particular Tama
    breedingRequirements?: {
      desiredOffspring: TamaSpecies;
      geneticTargets: Partial<TamaRPGStats>;
      personalityTargets: Partial<TamaPersonalityTraits>;
    };

    companionRequirements?: {
      forExistingTama: string;         // Must be compatible with this Tama
      relationshipGoal: RelationshipType;
      compatibilityFactors: string[];
    };

    workingRequirements?: {
      jobType: 'guard' | 'hunter' | 'entertainer' | 'therapy' | 'research' | 'breeding';
      requiredCertifications: string[];
      performanceStandards: Record<string, number>;
    };

    // Adoption terms
    permanentTransfer: boolean;        // True adoption vs temporary placement
    visitationRights?: {
      frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
      duration: number;                // Hours per visit
      conditions: string[];            // What's allowed during visits
    };

    // Post-adoption support
    supportProvided: {
      financialSupport?: number;       // Monthly stipend for care
      medicalCoverage?: boolean;       // They pay for vet bills
      trainingSupport?: boolean;       // Help with skill development
      socialSupport?: boolean;         // Introduce to other Tamas
    };

    // Adoption screening
    adopterBackground: {
      experience: 'novice' | 'intermediate' | 'expert';
      facilities: 'basic' | 'good' | 'excellent' | 'luxury';
      otherTamas: number;              // How many Tamas they already have
      specializations: string[];       // Areas of expertise
      references: { rating: number; comments: string }[];
    };
  };

  // Long-term commitments and guarantees
  guarantees: {
    minimumCareStandards: Record<string, number>;
    returnPolicy?: {                  // Conditions under which Tama could be returned
      timeframe: number;              // How long they have to change their mind
      conditions: string[];           // What would justify a return
      penaltyFee: number;            // Cost of returning
    };

    updateFrequency: 'never' | 'monthly' | 'quarterly' | 'annually'; // How often they'll report on Tama's progress
  };
}

// ============ COMPETITION CONTRACTS ============
// Tournaments, shows, contests

export interface CompetitionContract extends BaseContract {
  category: 'competition';
  competitionType: 'combat' | 'show' | 'skill' | 'creativity' | 'endurance' | 'intelligence';

  eventDetails: {
    eventName: string;
    eventDate: number;               // When the competition happens
    location: string;
    entryFee: number;               // Cost to participate

    // Competition format
    format: 'single_elimination' | 'round_robin' | 'points_based' | 'time_trial' | 'collaborative';
    participantCount: number;       // Expected number of competitors
    skillLevel: 'amateur' | 'professional' | 'elite' | 'legendary';

    // What's being judged
    judgingCriteria: {
      primarySkill: keyof TamaRPGStats['skills'];
      secondarySkills?: (keyof TamaRPGStats['skills'])[];
      personalityFactors?: (keyof TamaPersonalityTraits)[];
      appearanceFactors?: string[];
    };

    // Prizes and recognition
    prizes: {
      first: { money: number; items?: string[]; titles?: string[] };
      second?: { money: number; items?: string[]; titles?: string[] };
      third?: { money: number; items?: string[]; titles?: string[] };
      participation?: { money: number; items?: string[] };
    };

    // Risks and requirements
    injuryRisk: number;             // 0-100, chance of harm during competition
    stressLevel: number;            // 0-100, how stressful the event is
    trainingTime: number;           // Hours of prep work recommended

    // Reputation effects
    winReputationBonus: number;
    loseReputationPenalty: number;
    publicityLevel: 'local' | 'regional' | 'national' | 'international';
  };
}

// ============ RESEARCH CONTRACTS ============
// Medical studies, genetic research, behavior analysis

export interface ResearchContract extends BaseContract {
  category: 'research';
  researchType: 'medical' | 'genetic' | 'behavioral' | 'psychological' | 'educational' | 'social';

  studyDetails: {
    studyTitle: string;
    principalInvestigator: string;
    institution: string;
    ethicsApproval: string;         // Ethics committee approval number

    // What the study involves
    procedures: ResearchProcedure[];
    timeCommitment: {
      totalHours: number;
      sessionsPerWeek: number;
      sessionDuration: number;
      studyLength: number;          // Total weeks
    };

    // Requirements and restrictions
    eligibilityRequirements: ContractRequirements;
    exclusionCriteria: string[];
    concomitantRestrictions: string[]; // What Tama can't do during study

    // Risks and benefits
    risks: {
      physical: 'none' | 'minimal' | 'moderate' | 'high';
      psychological: 'none' | 'minimal' | 'moderate' | 'high';
      social: 'none' | 'minimal' | 'moderate' | 'high';
      specificRisks: string[];
    };

    benefits: {
      directBenefits: string[];     // What the Tama gets from participating
      societalBenefits: string[];   // How this helps all Tamas
      compensation: {
        baseAmount: number;
        performanceBonuses?: Record<string, number>;
        completionBonus?: number;
        healthcareProvided?: boolean;
      };
    };

    // Data collection
    dataCollected: {
      physiologicalMeasures?: string[];
      behavioralObservations?: string[];
      performanceMetrics?: string[];
      socialInteractions?: boolean;
      longTermFollowup?: number;    // Months of follow-up after study
    };

    // Participant rights
    withdrawalPolicy: {
      canWithdrawAnytime: boolean;
      noticePeriod: number;         // Days notice required
      penaltyForWithdrawal?: number;
    };

    dataPrivacy: {
      identityProtected: boolean;
      dataSharing: 'none' | 'anonymized' | 'coded' | 'full';
      publicationRights: string;
    };
  };
}

export interface ResearchProcedure {
  name: string;
  description: string;
  frequency: string;              // How often this happens
  duration: number;               // Minutes per session
  discomfort: 'none' | 'minimal' | 'moderate' | 'significant';
  requirements: string[];         // What the Tama needs to do
  measurements: string[];         // What data is collected
}

// ============ CONTRACT MATCHING AND EVALUATION ============

export interface ContractEvaluator {
  evaluateCompatibility(tama: AdvancedTamaData, contract: BaseContract): ContractCompatibility;
  estimateSuccessProbability(tama: AdvancedTamaData, contract: BaseContract): number;
  calculateRisk(tama: AdvancedTamaData, contract: BaseContract): ContractRisk;
  generateRecommendations(tama: AdvancedTamaData, contract: BaseContract): string[];
}

export interface ContractCompatibility {
  overallScore: number;           // 0-100, how well suited this Tama is

  statCompatibility: number;      // Do they meet stat requirements?
  personalityMatch: number;       // Does their personality fit?
  skillRelevance: number;         // Do they have relevant skills?
  riskTolerance: number;          // Can they handle the risks?

  strengths: string[];            // What makes this Tama good for this contract
  weaknesses: string[];          // What concerns exist
  improvements: string[];        // What could be trained to improve fit
}

export interface ContractRisk {
  physicalRisk: number;          // 0-100, chance of physical harm
  psychologicalRisk: number;     // 0-100, chance of stress/trauma
  socialRisk: number;            // 0-100, chance of relationship damage
  reputationRisk: number;        // 0-100, chance of reputation loss
  financialRisk: number;         // 0-100, chance of losing money

  riskMitigation: string[];      // Ways to reduce these risks
  warningFlags: string[];        // Specific things to watch out for
}

// Union type for all contract types
export type EnhancedContract =
  | EconomicContract
  | CareContract
  | AdoptionContract
  | CompetitionContract
  | ResearchContract;