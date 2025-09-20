import { Achievement, Milestone, SkillNode } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Interact with a Tama 5 times',
    category: 'care',
    unlocked: false,
    rewards: {
      tamaCoins: 25,
      skillPoints: 1
    }
  },
  {
    id: 'first_level_5',
    name: 'Growing Together',
    description: 'Raise a Tama to level 5',
    category: 'care',
    unlocked: false,
    rewards: {
      tamaCoins: 50,
      skillPoints: 1
    }
  },
  {
    id: 'first_level_10',
    name: 'Growing Up',
    description: 'Raise a Tama to level 10',
    category: 'care',
    unlocked: false,
    rewards: {
      tamaCoins: 100,
      skillPoints: 1
    }
  },
  {
    id: 'multiple_tamas',
    name: 'Growing Family',
    description: 'Own 3 Tamas at once',
    category: 'collection',
    unlocked: false,
    rewards: {
      tamaCoins: 150,
      skillPoints: 1
    }
  },
  {
    id: 'first_contract',
    name: 'Business Venture',
    description: 'Complete your first contract',
    category: 'business',
    unlocked: false,
    rewards: {
      tamaCoins: 75,
      skillPoints: 1
    }
  },
  {
    id: 'tama_collector',
    name: 'Tama Collector',
    description: 'Own 10 Tamas at once',
    category: 'collection',
    unlocked: false,
    rewards: {
      tamaCoins: 500,
      skillPoints: 2,
      unlocks: ['mega_habitat']
    }
  },
  {
    id: 'contract_master',
    name: 'Contract Master',
    description: 'Complete 100 contracts',
    category: 'business',
    unlocked: false,
    rewards: {
      tamaCoins: 1000,
      skillPoints: 3
    }
  },
  {
    id: 'first_prestige',
    name: 'New Beginnings',
    description: 'Perform your first prestige',
    category: 'prestige',
    unlocked: false,
    rewards: {
      skillPoints: 5,
      unlocks: ['celestial']
    }
  },
  {
    id: 'tier_3_master',
    name: 'Tier 3 Master',
    description: 'Achieve tier 3 with any Tama',
    category: 'breeding',
    unlocked: false,
    rewards: {
      tamaCoins: 2000,
      skillPoints: 4
    }
  }
];

export const MILESTONES: Milestone[] = [
  {
    level: 2,
    name: 'First Steps',
    description: 'Your ranch is growing! Buildings unlocked!',
    rewards: {
      skillPoints: 2,
      tamaCoins: 100,
      rice_grain: 25,
      unlocks: ['crafting_workshop']
    }
  },
  {
    level: 3,
    name: 'Getting Serious',
    description: 'Crafting recipes discovered!',
    rewards: {
      skillPoints: 2,
      tamaCoins: 150,
      bamboo_fiber: 10,
      silk_thread: 5,
      unlocks: ['auto_feeder', 'advanced_treats']
    }
  },
  {
    level: 4,
    name: 'Ranch Manager',
    description: 'Adventures unlocked! Explore the world!',
    rewards: {
      skillPoints: 3,
      tamaCoins: 300,
      happinessStars: 10,
      unlocks: ['luxury_habitat', 'adventures']
    }
  },
  {
    level: 5,
    name: 'Specialization Choice',
    description: 'Choose your specialization path and gain mastery!',
    rewards: {
      skillPoints: 5,
      tamaCoins: 500,
      unlocks: ['specializations', 'alchemy_lab']
    }
  },
  {
    level: 10,
    name: 'Experienced Caretaker',
    description: 'You\'re getting the hang of this',
    rewards: {
      skillPoints: 5,
      tamaCoins: 500,
      unlocks: ['luxury_habitat']
    }
  },
  {
    level: 25,
    name: 'Master Trainer',
    description: 'You\'ve become quite skilled',
    rewards: {
      skillPoints: 10,
      tamaCoins: 2000,
      unlocks: ['genetic_lab']
    }
  },
  {
    level: 50,
    name: 'Tama Legend',
    description: 'You\'re ready for prestige',
    rewards: {
      skillPoints: 20,
      tamaCoins: 10000
    }
  },
  {
    level: 75,
    name: 'Veteran',
    description: 'A seasoned professional',
    rewards: {
      skillPoints: 25,
      tamaCoins: 50000
    }
  },
  {
    level: 100,
    name: 'Grandmaster',
    description: 'The ultimate achievement',
    rewards: {
      skillPoints: 50,
      tamaCoins: 100000
    }
  }
];

export const SKILL_TREES = {
  caretaker: {
    feeding_efficiency: {
      id: 'feeding_efficiency',
      name: 'Feeding Efficiency',
      description: 'Feeding actions restore 20% more hunger per level',
      level: 0,
      maxLevel: 5,
      cost: 1,
      effects: {
        feedingBonus: 0.2
      }
    },
    happiness_expert: {
      id: 'happiness_expert',
      name: 'Happiness Expert',
      description: 'Playing with Tamas is 25% more effective per level',
      level: 0,
      maxLevel: 5,
      cost: 1,
      effects: {
        happinessBonus: 0.25
      }
    },
    energy_conservation: {
      id: 'energy_conservation',
      name: 'Energy Conservation',
      description: 'Tamas lose energy 10% slower per level',
      level: 0,
      maxLevel: 3,
      cost: 2,
      prerequisites: ['feeding_efficiency'],
      effects: {
        energyDecayReduction: 0.1
      }
    },
    master_caretaker: {
      id: 'master_caretaker',
      name: 'Master Caretaker',
      description: 'All care actions are 50% more effective',
      level: 0,
      maxLevel: 1,
      cost: 5,
      prerequisites: ['happiness_expert', 'energy_conservation'],
      effects: {
        allCareBonus: 0.5
      }
    }
  },
  breeder: {
    genetics_knowledge: {
      id: 'genetics_knowledge',
      name: 'Genetics Knowledge',
      description: 'Better understanding of Tama genetics, 15% bonus to stat growth per level',
      level: 0,
      maxLevel: 5,
      cost: 1,
      effects: {
        geneticsBonus: 0.15
      }
    },
    breeding_efficiency: {
      id: 'breeding_efficiency',
      name: 'Breeding Efficiency',
      description: 'Breeding actions have 20% higher success rate per level',
      level: 0,
      maxLevel: 3,
      cost: 2,
      effects: {
        breedingSuccessBonus: 0.2
      }
    },
    tier_specialist: {
      id: 'tier_specialist',
      name: 'Tier Specialist',
      description: 'Tier evolution requirements reduced by 10% per level',
      level: 0,
      maxLevel: 3,
      cost: 3,
      prerequisites: ['genetics_knowledge'],
      effects: {
        tierRequirementReduction: 0.1
      }
    },
    master_breeder: {
      id: 'master_breeder',
      name: 'Master Breeder',
      description: 'Unlock advanced breeding techniques',
      level: 0,
      maxLevel: 1,
      cost: 10,
      prerequisites: ['breeding_efficiency', 'tier_specialist'],
      effects: {
        advancedBreeding: 1
      }
    }
  },
  entrepreneur: {
    business_acumen: {
      id: 'business_acumen',
      name: 'Business Acumen',
      description: 'Contract payments increased by 15% per level',
      level: 0,
      maxLevel: 5,
      cost: 1,
      effects: {
        contractPaymentBonus: 0.15
      }
    },
    negotiation_skills: {
      id: 'negotiation_skills',
      name: 'Negotiation Skills',
      description: 'Customer satisfaction requirements reduced by 5% per level',
      level: 0,
      maxLevel: 3,
      cost: 2,
      effects: {
        customerSatisfactionBonus: 0.05
      }
    },
    resource_management: {
      id: 'resource_management',
      name: 'Resource Management',
      description: 'All resources earned increased by 10% per level',
      level: 0,
      maxLevel: 5,
      cost: 2,
      prerequisites: ['business_acumen'],
      effects: {
        resourceBonus: 0.1
      }
    },
    master_entrepreneur: {
      id: 'master_entrepreneur',
      name: 'Master Entrepreneur',
      description: 'Unlock premium business opportunities',
      level: 0,
      maxLevel: 1,
      cost: 15,
      prerequisites: ['negotiation_skills', 'resource_management'],
      effects: {
        premiumContracts: 1
      }
    }
  }
};

export const EXPERIENCE_SOURCES = {
  tama_interaction: { base: 6, description: 'Interacting with Tamas' },
  first_interaction: { base: 12, description: 'First interaction with a new Tama' },
  tama_creation: { base: 10, description: 'Creating a new Tama' },
  contract_completion: { base: 25, description: 'Completing contracts' },
  tama_level_up: { base: 50, description: 'Tama reaches new level' },
  tama_tier_up: { base: 200, description: 'Tama reaches new tier' },
  building_built: { base: 15, description: 'Constructing buildings' },
  recipe_discovery: { base: 30, description: 'Discovering new recipes' },
  achievement_unlock: { base: 100, description: 'Unlocking achievements' },
  adventure_completion: { base: 20, description: 'Completing adventures' },
  daily_login: { base: 8, description: 'Daily login bonus' },
  tutorial_step: { base: 5, description: 'Completing tutorial steps' }
};

export const PRESTIGE_REQUIREMENTS = {
  minLevel: 50,
  minTamaCount: 5,
  minTier3Count: 2
};

export const EXPERIENCE_CURVE_BASE = 20; // Further reduced for faster early levels
export const EXPERIENCE_CURVE_MULTIPLIER = 1.25; // Even gentler curve for better progression feel
export const PRESTIGE_POINT_MULTIPLIER = 0.1;