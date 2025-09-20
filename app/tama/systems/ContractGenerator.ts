import {
  EconomicContract,
  CareContract,
  AdoptionContract,
  CompetitionContract,
  ResearchContract,
  ContractCategory,
  CareIssue,
  ImprovementGoal,
  ResearchProcedure
} from '../types-contracts';
import { AdvancedTamaData, TamaRPGStats } from '../types-advanced';

export interface EconomicContractOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  customerArchetype?: 'casual' | 'demanding' | 'wealthy' | 'collector';
  marketConditions?: {
    demand: number;
    supply: number;
    volatility: number;
    trendDirection: 'rising' | 'falling' | 'stable';
  };
}

export interface CareContractOptions {
  careType: 'rehabilitation' | 'training' | 'socialization' | 'medical' | 'behavioral';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  duration: number;
}

export interface AdoptionContractOptions {
  adoptionType: 'any' | 'specific' | 'breeding' | 'companion' | 'working' | 'show';
  adopterExperience: 'novice' | 'intermediate' | 'expert';
  permanentTransfer: boolean;
  requiresStrongRelationships?: boolean;
}

export interface CompetitionContractOptions {
  competitionType: 'combat' | 'show' | 'skill' | 'creativity' | 'endurance' | 'intelligence';
  skillLevel: 'amateur' | 'professional' | 'elite' | 'legendary';
  participantCount: number;
}

export interface ResearchContractOptions {
  researchType: 'medical' | 'genetic' | 'behavioral' | 'psychological' | 'educational' | 'social';
  studyDuration: number;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high';
}

export class ContractGenerator {
  private contractIdCounter = 0;

  generateEconomicContract(options: EconomicContractOptions): EconomicContract {
    const id = `econ-${++this.contractIdCounter}`;
    const difficulty = options.difficulty || 'medium';
    const marketConditions = options.marketConditions || {
      demand: 50 + Math.random() * 50,
      supply: 30 + Math.random() * 40,
      volatility: Math.random() * 60,
      trendDirection: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as any
    };

    const economicTypes = ['buy', 'sell', 'trade', 'transport', 'negotiate'] as const;
    const economicType = economicTypes[Math.floor(Math.random() * economicTypes.length)];

    const basePaymentMap = { easy: 200, medium: 500, hard: 1000 };
    const durationMap = { easy: 2, medium: 4, hard: 8 };

    return {
      id,
      category: 'economic',
      economicType,
      customerId: `customer-${Math.floor(Math.random() * 1000)}`,
      title: `${economicType.charAt(0).toUpperCase() + economicType.slice(1)} Contract`,
      description: `${difficulty} difficulty ${economicType} contract with market dynamics`,
      duration: durationMap[difficulty],
      timePosted: Date.now(),
      expiryTime: Date.now() + 86400000, // 24 hours
      requirements: {
        minimumStats: difficulty === 'hard' ? { charisma: 15, intelligence: 12 } : { charisma: 8 },
        requiredSkills: economicType === 'negotiate' ? { persuasion: 8, investigation: 5 } : undefined
      },
      basePayment: basePaymentMap[difficulty],
      bonusConditions: [],
      penalties: [],
      status: 'available',
      reputationImpact: {
        success: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
        failure: difficulty === 'hard' ? -10 : difficulty === 'medium' ? -5 : -2,
        difficulty: difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1.0
      },
      itemDetails: {
        marketConditions,
        expectedMargin: 10 + Math.random() * 20,
        riskLevel: difficulty === 'easy' ? 'low' : difficulty === 'hard' ? 'high' : 'medium'
      }
    };
  }

  generateCareContract(options: CareContractOptions): CareContract {
    const id = `care-${++this.contractIdCounter}`;

    // Generate a temporary Tama with issues
    const temporaryTama = this.generateTemporaryTama(options.careType, options.severity);

    const severityMultiplier = { minor: 1, moderate: 1.5, severe: 2, critical: 3 }[options.severity];

    return {
      id,
      category: 'care',
      careType: options.careType,
      customerId: `caregiver-${Math.floor(Math.random() * 1000)}`,
      title: `${options.careType.charAt(0).toUpperCase() + options.careType.slice(1)} Care Contract`,
      description: `${options.severity} ${options.careType} case requiring ${options.duration} hours of care`,
      duration: options.duration,
      timePosted: Date.now(),
      expiryTime: Date.now() + 172800000, // 48 hours
      requirements: {
        personalityRequirements: {
          minimumTraits: { agreeableness: 60, conscientiousness: 50 }
        },
        requiredSkills: options.careType === 'medical' ? { medicine: 8 } : undefined
      },
      basePayment: Math.floor(300 * severityMultiplier),
      bonusConditions: [],
      penalties: [],
      status: 'available',
      reputationImpact: {
        success: Math.floor(8 * severityMultiplier),
        failure: Math.floor(-4 * severityMultiplier),
        difficulty: severityMultiplier
      },
      temporaryTama
    };
  }

  generateAdoptionContract(options: AdoptionContractOptions): AdoptionContract {
    const id = `adopt-${++this.contractIdCounter}`;

    return {
      id,
      category: 'adoption',
      adoptionType: options.adoptionType,
      customerId: `adopter-${Math.floor(Math.random() * 1000)}`,
      title: `${options.adoptionType.charAt(0).toUpperCase() + options.adoptionType.slice(1)} Adoption`,
      description: `Looking for ${options.adoptionType} adoption with ${options.adopterExperience} adopter`,
      duration: 1, // Adoption is typically immediate
      timePosted: Date.now(),
      expiryTime: Date.now() + 604800000, // 1 week
      requirements: {
        relationshipRequirements: options.requiresStrongRelationships ? {
          mustHaveFriend: true,
          mustBeSocial: 2
        } : undefined
      },
      basePayment: options.adoptionType === 'breeding' ? 2000 : 0, // Some adoptions are free
      bonusConditions: [],
      penalties: [],
      status: 'available',
      reputationImpact: {
        success: 20,
        failure: -10,
        difficulty: 1.0
      },
      adoptionDetails: {
        seekingType: options.permanentTransfer ? 'purchase' : 'co_ownership',
        permanentTransfer: options.permanentTransfer,
        supportProvided: {
          trainingSupport: true,
          medicalCoverage: options.adopterExperience === 'expert',
          socialSupport: true,
          financialSupport: options.permanentTransfer ? 0 : 200
        },
        adopterBackground: {
          experience: options.adopterExperience,
          facilities: options.adopterExperience === 'expert' ? 'excellent' : 'good',
          otherTamas: Math.floor(Math.random() * 5),
          specializations: [],
          references: [{ rating: 85 + Math.random() * 15, comments: 'Excellent caretaker' }]
        }
      },
      guarantees: {
        minimumCareStandards: { happiness: 70, health: 80 },
        updateFrequency: 'quarterly'
      }
    };
  }

  generateCompetitionContract(options: CompetitionContractOptions): CompetitionContract {
    const id = `comp-${++this.contractIdCounter}`;

    const skillLevelMultiplier = { amateur: 1, professional: 2, elite: 3, legendary: 5 }[options.skillLevel];

    return {
      id,
      category: 'competition',
      competitionType: options.competitionType,
      customerId: `organizer-${Math.floor(Math.random() * 1000)}`,
      title: `${options.competitionType.charAt(0).toUpperCase() + options.competitionType.slice(1)} Competition`,
      description: `${options.skillLevel} level ${options.competitionType} competition`,
      duration: 2,
      timePosted: Date.now(),
      expiryTime: Date.now() + 259200000, // 3 days
      requirements: {
        minimumStats: options.competitionType === 'combat' ? {
          strength: 10 * skillLevelMultiplier,
          constitution: 8 * skillLevelMultiplier,
          agility: 8 * skillLevelMultiplier
        } : {},
        requiredSkills: options.competitionType === 'combat' ? {
          combat: 5 * skillLevelMultiplier,
          athletics: 4 * skillLevelMultiplier
        } : {},
        personalityRequirements: options.competitionType === 'combat' ? {
          minimumTraits: { aggression: 50, competitiveness: 60 }
        } : undefined
      },
      basePayment: Math.floor(500 * skillLevelMultiplier),
      bonusConditions: [],
      penalties: [],
      status: 'available',
      reputationImpact: {
        success: Math.floor(15 * skillLevelMultiplier),
        failure: Math.floor(-8 * skillLevelMultiplier),
        difficulty: skillLevelMultiplier
      },
      eventDetails: {
        eventName: `${options.skillLevel} ${options.competitionType} Championship`,
        eventDate: Date.now() + 86400000,
        location: 'Competition Arena',
        entryFee: Math.floor(50 * skillLevelMultiplier),
        format: 'single_elimination',
        participantCount: options.participantCount,
        skillLevel: options.skillLevel,
        judgingCriteria: {
          primarySkill: options.competitionType === 'combat' ? 'combat' : 'performance'
        },
        prizes: {
          first: { money: Math.floor(1000 * skillLevelMultiplier) },
          second: { money: Math.floor(400 * skillLevelMultiplier) }
        },
        injuryRisk: options.competitionType === 'combat' ? 60 + skillLevelMultiplier * 10 : 20,
        stressLevel: 50 + skillLevelMultiplier * 15,
        trainingTime: skillLevelMultiplier * 10,
        winReputationBonus: Math.floor(20 * skillLevelMultiplier),
        loseReputationPenalty: Math.floor(-5 * skillLevelMultiplier),
        publicityLevel: options.skillLevel === 'legendary' ? 'international' : 'regional'
      }
    };
  }

  generateResearchContract(options: ResearchContractOptions): ResearchContract {
    const id = `research-${++this.contractIdCounter}`;

    return {
      id,
      category: 'research',
      researchType: options.researchType,
      customerId: `institution-${Math.floor(Math.random() * 1000)}`,
      title: `${options.researchType.charAt(0).toUpperCase() + options.researchType.slice(1)} Research Study`,
      description: `${options.studyDuration}-week ${options.researchType} research with ${options.riskLevel} risk`,
      duration: options.studyDuration * 168, // Convert weeks to hours
      timePosted: Date.now(),
      expiryTime: Date.now() + 1209600000, // 2 weeks
      requirements: {
        healthRequirements: {
          minimumNeeds: { hunger: 70, energy: 70, cleanliness: 70 }
        }
      },
      basePayment: options.studyDuration * 150,
      bonusConditions: [],
      penalties: [],
      status: 'available',
      reputationImpact: {
        success: 5,
        failure: -2,
        difficulty: 0.8
      },
      studyDetails: {
        studyTitle: `${options.researchType} Research Study`,
        principalInvestigator: `Dr. ${Math.floor(Math.random() * 1000)}`,
        institution: 'Tama Research Institute',
        ethicsApproval: `IRB-2024-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        procedures: this.generateResearchProcedures(options.researchType, options.riskLevel),
        timeCommitment: {
          totalHours: options.studyDuration * 10,
          sessionsPerWeek: 3,
          sessionDuration: 2,
          studyLength: options.studyDuration
        },
        eligibilityRequirements: {},
        exclusionCriteria: [],
        concomitantRestrictions: [],
        risks: {
          physical: options.riskLevel === 'low' ? 'minimal' : options.riskLevel,
          psychological: options.riskLevel === 'high' ? 'moderate' : 'minimal',
          social: 'none',
          specificRisks: []
        },
        benefits: {
          directBenefits: ['health monitoring', 'skill assessment'],
          societalBenefits: ['advancement of Tama science'],
          compensation: {
            baseAmount: options.studyDuration * 150,
            completionBonus: options.studyDuration * 50,
            healthcareProvided: true
          }
        },
        dataCollected: {
          physiologicalMeasures: ['vital signs'],
          behavioralObservations: ['activity patterns'],
          longTermFollowup: 3
        },
        withdrawalPolicy: {
          canWithdrawAnytime: true,
          noticePeriod: 7
        },
        dataPrivacy: {
          identityProtected: true,
          dataSharing: 'anonymized',
          publicationRights: 'with consent'
        }
      }
    };
  }

  private generateTemporaryTama(careType: string, severity: string): CareContract['temporaryTama'] {
    const severityMap = { minor: 1, moderate: 2, severe: 3, critical: 4 };
    const issueCount = severityMap[severity as keyof typeof severityMap];

    const issues: CareIssue[] = [];
    for (let i = 0; i < issueCount; i++) {
      issues.push({
        type: careType === 'medical' ? 'health' : 'behavioral',
        severity: severity as any,
        description: `${severity} ${careType} issue requiring attention`,
        affectedStats: { happiness: -20, energy: -15 },
        treatmentMethods: ['daily care', 'specialized attention'],
        timeToResolve: issueCount * 8
      });
    }

    const improvementGoals: ImprovementGoal[] = [
      {
        goalType: 'stat',
        target: 'happiness',
        currentValue: 40,
        targetValue: 70,
        deadline: Date.now() + 86400000,
        priority: 'high',
        completionBonus: 100,
        reputationBonus: 5
      }
    ];

    return {
      tamaData: {
        id: `temp-tama-${Date.now()}`,
        name: 'Temporary Care Tama',
        species: 'basic',
        tier: 1,
        level: 3,
        experience: 100,
        needs: { hunger: 60, happiness: 40, energy: 50, cleanliness: 55 },
        stats: { totalInteractions: 5, hoursLived: 72, jobsCompleted: 0 },
        skills: {},
        createdAt: Date.now() - 259200000,
        lastInteraction: Date.now() - 7200000
      } as any,
      issues,
      improvementGoals,
      careInstructions: {
        feedingSchedule: 'Every 6 hours',
        exerciseRequirements: 'Light activity daily',
        socialNeeds: 'Gentle interaction'
      },
      returnRequirements: {
        minimumImprovement: { happiness: 30, energy: 20 },
        forbiddenDeclines: { health: -10 }
      }
    };
  }

  private generateResearchProcedures(researchType: string, riskLevel: string): ResearchProcedure[] {
    const procedures: ResearchProcedure[] = [];

    if (researchType === 'medical') {
      procedures.push({
        name: 'Health Assessment',
        description: 'Comprehensive health evaluation',
        frequency: 'weekly',
        duration: 30,
        discomfort: riskLevel === 'high' ? 'moderate' : 'minimal',
        requirements: ['fasting for 2 hours'],
        measurements: ['vital signs', 'biomarkers']
      });
    }

    procedures.push({
      name: 'Behavioral Observation',
      description: 'Monitoring daily behavior patterns',
      frequency: 'daily',
      duration: 60,
      discomfort: 'none',
      requirements: ['normal activity'],
      measurements: ['activity levels', 'social interactions']
    });

    return procedures;
  }
}