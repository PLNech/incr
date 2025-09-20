import { SimpleContract } from '../types-simple-contracts';
import { TamaGameState } from '../types';
import { SimpleContractGenerator } from './SimpleContractGenerator';

export class SimpleContractManager {
  private contracts: Map<string, SimpleContract> = new Map();
  private generator = new SimpleContractGenerator();

  generateAvailableContracts(count: number = 3): SimpleContract[] {
    const newContracts: SimpleContract[] = [];

    for (let i = 0; i < count; i++) {
      const contract = this.generator.generateRandomContract();
      this.contracts.set(contract.id, contract);
      newContracts.push(contract);
    }

    return newContracts;
  }

  acceptContract(contractId: string): SimpleContract | null {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'available') {
      return null;
    }

    contract.status = 'active';
    contract.progress = this.initializeProgress(contract);
    return contract;
  }

  private initializeProgress(contract: SimpleContract): any {
    switch (contract.type) {
      case 'sales':
        return { sold: {} };
      case 'crafting':
        return { crafted: { quantity: 0 } };
      case 'care':
        return {
          care: {
            hoursCompleted: 0,
            currentAverageHappiness: 0,
            currentAverageHealth: 0
          }
        };
    }
  }

  updateContractProgress(gameState: TamaGameState): void {
    Array.from(this.contracts.values()).forEach(contract => {
      if (contract.status !== 'active') return;

      switch (contract.type) {
        case 'care':
          this.updateCareProgress(contract, gameState);
          break;
        // Sales and crafting are updated when player performs actions
      }
    });
  }

  private updateCareProgress(contract: SimpleContract, gameState: TamaGameState): void {
    if (!contract.requirements.care || !contract.progress?.care) return;

    const req = contract.requirements.care;
    const progress = contract.progress.care;

    // Check if we have enough Tamas
    if (gameState.tamas.length < req.minimumTamas) {
      return; // Can't progress without enough Tamas
    }

    // Calculate current averages
    const totalHappiness = gameState.tamas.reduce((sum, tama) => sum + tama.needs.happiness, 0);
    const totalHealth = gameState.tamas.reduce((sum, tama) => sum + tama.needs.energy, 0); // Using energy as health proxy

    progress.currentAverageHappiness = totalHappiness / gameState.tamas.length;
    progress.currentAverageHealth = totalHealth / gameState.tamas.length;

    // Check if requirements are met
    if (progress.currentAverageHappiness >= req.minimumHappiness &&
        progress.currentAverageHealth >= req.minimumHealth) {

      progress.hoursCompleted += 0.5; // Increment by 30 minutes (game tick)

      // Check if contract is completed
      if (progress.hoursCompleted >= req.duration) {
        this.completeContract(contract, gameState);
      }
    }
  }

  // Player actions for completing contracts
  sellResourcesForContract(contractId: string, resourceType: string, quantity: number, gameState: TamaGameState): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'active' || contract.type !== 'sales') {
      return false;
    }

    const required = (contract.requirements.sell as any)[resourceType];
    if (!required || quantity > required) {
      return false;
    }

    // Check if player has enough resources
    const currentResources = (gameState.resources as any)[resourceType];
    if (currentResources < quantity) {
      return false;
    }

    // Deduct resources
    (gameState.resources as any)[resourceType] -= quantity;

    // Update progress
    if (!contract.progress) contract.progress = { sold: {} };
    if (!contract.progress.sold) contract.progress.sold = {};

    const currentSold = (contract.progress.sold as any)[resourceType] || 0;
    (contract.progress.sold as any)[resourceType] = currentSold + quantity;

    // Check if contract is complete
    if ((contract.progress.sold as any)[resourceType] >= required) {
      this.completeContract(contract, gameState);
    }

    return true;
  }

  submitCraftedItem(contractId: string, itemId: string, quantity: number, gameState: TamaGameState): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'active' || contract.type !== 'crafting') {
      return false;
    }

    const req = contract.requirements.craft!;
    if (req.itemId !== itemId || quantity > (req.quantity - (contract.progress?.crafted?.quantity || 0))) {
      return false;
    }

    // Check if player has the items in their inventory
    if (!gameState.inventory) {
      gameState.inventory = {};
    }

    const currentInventory = gameState.inventory[itemId] || 0;
    if (currentInventory < quantity) {
      return false; // Not enough items in inventory
    }

    // Deduct items from inventory
    gameState.inventory[itemId] -= quantity;

    // Update contract progress
    if (!contract.progress) contract.progress = { crafted: { quantity: 0 } };
    contract.progress.crafted!.quantity += quantity;

    // Check if contract is complete
    if (contract.progress.crafted!.quantity >= req.quantity) {
      this.completeContract(contract, gameState);
    }

    return true;
  }

  private completeContract(contract: SimpleContract, gameState: TamaGameState): void {
    contract.status = 'completed';

    // Award rewards
    gameState.resources.tamaCoins += contract.reward.tamaCoins;
    if (contract.reward.rice_grain) gameState.resources.rice_grain += contract.reward.rice_grain;
    if (contract.reward.bamboo_fiber) gameState.resources.bamboo_fiber += contract.reward.bamboo_fiber;
    if (contract.reward.silk_thread) gameState.resources.silk_thread += contract.reward.silk_thread;
    if (contract.reward.green_tea_leaf) gameState.resources.green_tea_leaf += contract.reward.green_tea_leaf;
    if (contract.reward.spirit_essence) gameState.resources.spirit_essence += contract.reward.spirit_essence;
    if (contract.reward.experience) {
      gameState.progression.experience += contract.reward.experience;
    }
  }

  getAvailableContracts(): SimpleContract[] {
    return Array.from(this.contracts.values()).filter(c => c.status === 'available');
  }

  getActiveContracts(): SimpleContract[] {
    return Array.from(this.contracts.values()).filter(c => c.status === 'active');
  }

  getContract(contractId: string): SimpleContract | undefined {
    return this.contracts.get(contractId);
  }
}