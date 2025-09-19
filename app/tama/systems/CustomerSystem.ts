import { TamaGameState, Customer, Contract, TamaData } from '../types';
import { TamaEntity } from '../engine/TamaEntity';

export interface ContractResult {
  success: boolean;
  message: string;
  payment: number;
  contractId: string;
}

export interface AssignmentResult {
  success: boolean;
  message: string;
}

export class CustomerSystem {
  private customerNames = [
    'Akira', 'Yuki', 'Hana', 'Ryo', 'Sakura', 'Kenji', 'Miku', 'Taro',
    'Ai', 'Sato', 'Emi', 'Daiki', 'Nana', 'Kenta', 'Rei', 'Masa'
  ];

  // Customer Generation
  generateInitialPopulation(count: number): Customer[] {
    const customers: Customer[] = [];

    for (let i = 0; i < count; i++) {
      customers.push(this.generateCustomer());
    }

    return customers;
  }

  private generateCustomer(): Customer {
    const archetypes: Customer['archetype'][] = ['casual', 'demanding', 'wealthy', 'collector', 'breeder'];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    const customer: Customer = {
      id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.customerNames[Math.floor(Math.random() * this.customerNames.length)],
      archetype,
      preferences: this.generatePreferences(archetype),
      patience: this.generatePatience(archetype),
      paymentMultiplier: this.generatePaymentMultiplier(archetype),
      reputation: Math.floor(Math.random() * 50), // 0-49 starting reputation
      lastVisit: Date.now()
    };

    return customer;
  }

  private generatePreferences(archetype: Customer['archetype']) {
    const basePreferences = {
      preferredSpecies: ['basic'] as any,
      minTier: 0 as any,
      careRequirements: ['fed', 'happy'] as any
    };

    switch (archetype) {
      case 'demanding':
        basePreferences.minTier = 1;
        basePreferences.careRequirements = ['fed', 'happy', 'clean', 'energized'];
        break;
      case 'wealthy':
        basePreferences.preferredSpecies = ['crystal', 'cosmic'];
        basePreferences.minTier = 2;
        basePreferences.careRequirements = ['fed', 'happy', 'clean'];
        break;
      case 'collector':
        basePreferences.preferredSpecies = ['forest', 'aquatic', 'shadow'];
        basePreferences.careRequirements = ['fed', 'happy'];
        break;
      case 'breeder':
        basePreferences.minTier = 1;
        basePreferences.careRequirements = ['fed', 'happy', 'energized'];
        break;
      default: // casual
        basePreferences.careRequirements = ['fed', 'happy'];
    }

    return basePreferences;
  }

  private generatePatience(archetype: Customer['archetype']): number {
    switch (archetype) {
      case 'demanding': return Math.floor(Math.random() * 3) + 2; // 2-4
      case 'wealthy': return Math.floor(Math.random() * 6) + 5; // 5-10
      case 'collector': return Math.floor(Math.random() * 4) + 4; // 4-7
      case 'breeder': return Math.floor(Math.random() * 5) + 3; // 3-7
      default: return Math.floor(Math.random() * 5) + 3; // 3-7
    }
  }

  private generatePaymentMultiplier(archetype: Customer['archetype']): number {
    switch (archetype) {
      case 'demanding': return 0.8 + Math.random() * 0.4; // 0.8-1.2
      case 'wealthy': return 1.5 + Math.random() * 1.5; // 1.5-3.0
      case 'collector': return 1.1 + Math.random() * 0.6; // 1.1-1.7
      case 'breeder': return 1.2 + Math.random() * 0.5; // 1.2-1.7
      default: return 0.7 + Math.random() * 0.6; // 0.7-1.3
    }
  }

  // Contract Generation
  generateContract(customer: Customer, gameState: TamaGameState): Contract {
    const basePayment = this.calculateBasePayment(gameState.progression.level);
    const duration = this.calculateContractDuration(customer, gameState);
    const careLevel = this.calculateCareLevel(customer, gameState);

    const contract: Contract = {
      id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: customer.id,
      requirements: {
        duration,
        careLevel,
        specialRequests: this.generateSpecialRequests(customer)
      },
      payment: {
        baseAmount: Math.floor(basePayment * customer.paymentMultiplier * this.getReputationMultiplier(customer)),
        bonuses: this.generateBonusConditions(customer)
      },
      status: 'pending'
    };

    return contract;
  }

  private calculateBasePayment(playerLevel: number): number {
    return Math.floor(20 + (playerLevel * 5) + Math.random() * 10);
  }

  private calculateContractDuration(customer: Customer, gameState: TamaGameState): number {
    const baseTime = 30000; // 30 seconds
    const levelMultiplier = 1 + (gameState.progression.level * 0.2);
    const archetypeMultiplier = customer.archetype === 'demanding' ? 1.5 : 1.0;

    return Math.floor(baseTime * levelMultiplier * archetypeMultiplier);
  }

  private calculateCareLevel(customer: Customer, gameState: TamaGameState): number {
    const baseLevel = Math.floor(1 + gameState.progression.level * 0.5);
    const archetypeBonus = customer.archetype === 'demanding' ? 2 :
                          customer.archetype === 'wealthy' ? 1 : 0;

    return Math.min(10, baseLevel + archetypeBonus);
  }

  private generateSpecialRequests(customer: Customer): string[] {
    const requests: string[] = [];

    if (customer.archetype === 'demanding') {
      requests.push('perfect_care', 'no_interruptions');
    }
    if (customer.archetype === 'wealthy') {
      requests.push('luxury_treatment');
    }
    if (customer.archetype === 'collector') {
      requests.push('species_expertise');
    }

    return requests;
  }

  private generateBonusConditions(customer: Customer): Array<{ condition: string; amount: number }> {
    const bonuses = [
      { condition: 'perfect_happiness', amount: 20 },
      { condition: 'high_tier', amount: 30 },
      { condition: 'fast_completion', amount: 15 }
    ];

    if (customer.archetype === 'wealthy') {
      bonuses.push({ condition: 'luxury_items_used', amount: 50 });
    }

    return bonuses;
  }

  private getReputationMultiplier(customer: Customer): number {
    if (customer.reputation > 80) return 1.3;
    if (customer.reputation > 50) return 1.1;
    if (customer.reputation < 0) return 0.8;
    return 1.0;
  }

  // Contract Assignment
  assignTamaToContract(contractId: string, tamaId: string, gameState: TamaGameState): AssignmentResult {
    const contract = gameState.activeContracts.find(c => c.id === contractId);
    if (!contract) {
      return { success: false, message: 'Contract not found' };
    }

    const tamaData = gameState.tamas.find(t => t.id === tamaId);
    if (!tamaData) {
      return { success: false, message: 'Tama not found' };
    }

    const tama = new TamaEntity(tamaData);

    // Check if Tama is ready for job
    if (!tama.isReadyForJob()) {
      return { success: false, message: `${tama.name} is not ready for work` };
    }

    // Check if Tama is already busy
    const isBusy = gameState.activeContracts.some(c =>
      c.tamaId === tamaId && c.status === 'active'
    );

    if (isBusy) {
      return { success: false, message: `${tama.name} is already busy with another contract` };
    }

    // Assign the contract
    contract.tamaId = tamaId;
    contract.status = 'active';
    contract.startTime = Date.now();
    contract.endTime = Date.now() + contract.requirements.duration;

    return { success: true, message: `${tama.name} assigned to contract` };
  }

  // Contract Processing
  processContracts(gameState: TamaGameState): ContractResult[] {
    const now = Date.now();
    const results: ContractResult[] = [];

    const activeContracts = gameState.activeContracts.filter(c => c.status === 'active');

    activeContracts.forEach(contract => {
      if (now >= (contract.endTime || 0)) {
        const result = this.completeContract(contract, gameState);
        results.push(result);
      }
    });

    return results;
  }

  private completeContract(contract: Contract, gameState: TamaGameState): ContractResult {
    const tamaData = gameState.tamas.find(t => t.id === contract.tamaId);
    if (!tamaData) {
      contract.status = 'failed';
      return {
        success: false,
        message: 'Assigned Tama not found',
        payment: 0,
        contractId: contract.id
      };
    }

    const tama = new TamaEntity(tamaData);
    const customer = gameState.customers.find(c => c.id === contract.customerId);

    // Calculate care quality
    const careQuality = this.calculateCareQuality(tama, contract);
    const success = careQuality >= contract.requirements.careLevel;

    // Calculate payment
    let payment = 0;
    if (success) {
      payment = contract.payment.baseAmount;

      // Add bonuses
      contract.payment.bonuses.forEach(bonus => {
        if (this.checkBonusCondition(bonus.condition, tama, contract)) {
          payment += bonus.amount;
        }
      });

      contract.status = 'completed';
    } else {
      contract.status = 'failed';
    }

    // Update customer reputation
    if (customer) {
      this.updateCustomerReputation(customer.id, success, gameState);
    }

    // Update Tama stats
    if (success) {
      tama.stats.jobsCompleted++;
      const tamaIndex = gameState.tamas.findIndex(t => t.id === tama.id);
      if (tamaIndex !== -1) {
        gameState.tamas[tamaIndex] = tama.serialize();
      }
    }

    return {
      success,
      message: success ? 'Contract completed successfully!' : 'Contract failed due to poor care',
      payment,
      contractId: contract.id
    };
  }

  private calculateCareQuality(tama: TamaEntity, contract: Contract): number {
    const needsAverage = (tama.needs.hunger + tama.needs.happiness + tama.needs.energy + tama.needs.cleanliness) / 4;
    const tierBonus = tama.tier * 1;
    const levelBonus = tama.level * 0.5;

    return Math.floor((needsAverage / 10) + tierBonus + levelBonus);
  }

  private checkBonusCondition(condition: string, tama: TamaEntity, contract: Contract): boolean {
    switch (condition) {
      case 'perfect_happiness':
        return tama.needs.happiness >= 95;
      case 'high_tier':
        return tama.tier >= 2;
      case 'fast_completion':
        const duration = (contract.endTime || 0) - (contract.startTime || 0);
        const actualDuration = Date.now() - (contract.startTime || 0);
        return actualDuration <= duration * 0.8;
      case 'luxury_items_used':
        // TODO: Implement when item usage is tracked
        return false;
      default:
        return false;
    }
  }

  // Customer Management
  updateCustomerReputation(customerId: string, success: boolean, gameState: TamaGameState): void {
    const customer = gameState.customers.find(c => c.id === customerId);
    if (!customer) return;

    if (success) {
      customer.reputation += Math.floor(5 + Math.random() * 10);
    } else {
      customer.reputation -= Math.floor(10 + Math.random() * 15);
    }

    customer.reputation = Math.max(-100, Math.min(100, customer.reputation));
  }

  performMonthlyRotation(gameState: TamaGameState): void {
    const newCustomers: Customer[] = [];

    gameState.customers.forEach(customer => {
      const stayChance = this.calculateStayChance(customer);

      if (Math.random() < stayChance) {
        newCustomers.push(customer);
      }
    });

    // Fill up to original count with new customers
    const originalCount = gameState.customers.length;
    while (newCustomers.length < originalCount) {
      newCustomers.push(this.generateCustomer());
    }

    gameState.customers = newCustomers;
  }

  private calculateStayChance(customer: Customer): number {
    let chance = 0.6; // Base 60% chance to stay

    // Reputation affects stay chance
    if (customer.reputation > 80) chance += 0.35; // Make it more likely to stay
    else if (customer.reputation > 50) chance += 0.1;
    else if (customer.reputation < 0) chance -= 0.7; // Make it very likely to leave

    // Archetype affects loyalty
    if (customer.archetype === 'wealthy') chance += 0.2;
    if (customer.archetype === 'collector') chance += 0.15;

    return Math.max(0, Math.min(1, chance));
  }
}