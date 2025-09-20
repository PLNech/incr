// Simple, practical contract types that are easy to understand

export type SimpleContractType = 'sales' | 'crafting' | 'care';

export interface SimpleContract {
  id: string;
  type: SimpleContractType;
  title: string;
  description: string;

  // Clear requirements and rewards
  requirements: SimpleContractRequirement;
  reward: {
    tamaCoins: number;
    rice_grain?: number;
    bamboo_fiber?: number;
    silk_thread?: number;
    green_tea_leaf?: number;
    spirit_essence?: number;
    experience?: number;
  };

  // Contract state
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';
  timeLimit: number; // hours
  createdAt: number;
  progress?: SimpleContractProgress;
}

export interface SimpleContractRequirement {
  // For sales contracts - sell resources/items
  sell?: {
    berries?: number;
    wood?: number;
    stone?: number;
    items?: { itemId: string; quantity: number }[];
  };

  // For crafting contracts - make specific items
  craft?: {
    itemId: string;
    quantity: number;
  };

  // For care contracts - maintain Tama health/happiness for duration
  care?: {
    minimumTamas: number;
    minimumHappiness: number; // Average across all Tamas
    minimumHealth: number;
    duration: number; // hours to maintain
  };
}

export interface SimpleContractProgress {
  // Sales progress
  sold?: {
    berries?: number;
    wood?: number;
    stone?: number;
    items?: { itemId: string; quantity: number }[];
  };

  // Crafting progress
  crafted?: {
    quantity: number;
  };

  // Care progress
  care?: {
    hoursCompleted: number;
    currentAverageHappiness: number;
    currentAverageHealth: number;
  };
}

export interface ContractOffer {
  // For sales contracts - what they're offering to buy
  buying?: {
    berries?: { quantity: number; pricePerUnit: number };
    wood?: { quantity: number; pricePerUnit: number };
    stone?: { quantity: number; pricePerUnit: number };
  };

  // For crafting contracts - what they need made
  commissioning?: {
    itemId: string;
    quantity: number;
    totalPayment: number;
  };

  // For care contracts - what they're providing
  providing?: {
    tamaCount: number;
    dailyStipend: number;
    totalDuration: number; // days
  };
}