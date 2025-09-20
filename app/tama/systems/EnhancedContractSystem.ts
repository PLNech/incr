import {
  BaseContract,
  EnhancedContract,
  EconomicContract,
  CareContract,
  AdoptionContract,
  CompetitionContract,
  ResearchContract,
  ContractCompatibility,
  ContractRisk
} from '../types-contracts';
import { AdvancedTamaData } from '../types-advanced';
import {
  ContractGenerator,
  EconomicContractOptions,
  CareContractOptions,
  AdoptionContractOptions,
  CompetitionContractOptions,
  ResearchContractOptions
} from './ContractGenerator';
import { ContractMatcher } from './ContractMatcher';

export interface ContractCompletionResult {
  success: boolean;
  bonusesEarned: string[];
  penaltiesIncurred: string[];
}

export interface ContractFilterOptions {
  minCompatibilityScore?: number;
  maxRiskLevel?: number;
  excludeCategories?: string[];
}

export interface AutonomousContractChoice {
  chosenContract: EnhancedContract;
  reasoning: string;
  compatibilityScore: number;
}

export class EnhancedContractSystem {
  private contracts: Map<string, EnhancedContract> = new Map();
  private generator: ContractGenerator = new ContractGenerator();
  private matcher: ContractMatcher = new ContractMatcher();
  private registeredTamas: Set<string> = new Set(); // Track valid Tama IDs

  generateAvailableContracts(count: number): EnhancedContract[] {
    const contracts: EnhancedContract[] = [];
    const categories = ['economic', 'care', 'adoption', 'competition', 'research'];

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      let contract: EnhancedContract;

      switch (category) {
        case 'economic':
          contract = this.generator.generateEconomicContract({ difficulty: 'medium' });
          break;
        case 'care':
          contract = this.generator.generateCareContract({
            careType: 'training',
            severity: 'moderate',
            duration: 24
          });
          break;
        case 'adoption':
          contract = this.generator.generateAdoptionContract({
            adoptionType: 'any',
            adopterExperience: 'intermediate',
            permanentTransfer: true
          });
          break;
        case 'competition':
          contract = this.generator.generateCompetitionContract({
            competitionType: 'skill',
            skillLevel: 'professional',
            participantCount: 12
          });
          break;
        case 'research':
          contract = this.generator.generateResearchContract({
            researchType: 'behavioral',
            studyDuration: 4,
            riskLevel: 'minimal'
          });
          break;
        default:
          contract = this.generator.generateEconomicContract({ difficulty: 'medium' });
      }

      this.contracts.set(contract.id, contract);
      contracts.push(contract);
    }

    return contracts;
  }

  generateEconomicContract(options: Partial<EconomicContractOptions> & { expiresIn?: number } = {}): EconomicContract {
    const contract = this.generator.generateEconomicContract({
      difficulty: 'medium',
      customerArchetype: 'casual',
      ...options
    });

    // Allow test to override expiry time
    if ('expiresIn' in options && options.expiresIn !== undefined) {
      contract.expiryTime = Date.now() + options.expiresIn;
    }

    this.contracts.set(contract.id, contract);
    return contract;
  }

  generateCareContract(options: Partial<CareContractOptions> = {}): CareContract {
    const contract = this.generator.generateCareContract({
      careType: 'training',
      severity: 'moderate',
      duration: 24,
      ...options
    });

    this.contracts.set(contract.id, contract);
    return contract;
  }

  generateAdoptionContract(options: Partial<AdoptionContractOptions> = {}): AdoptionContract {
    const contract = this.generator.generateAdoptionContract({
      adoptionType: 'any',
      adopterExperience: 'intermediate',
      permanentTransfer: true,
      ...options
    });

    this.contracts.set(contract.id, contract);
    return contract;
  }

  generateCompetitionContract(options: Partial<CompetitionContractOptions> = {}): CompetitionContract {
    const contract = this.generator.generateCompetitionContract({
      competitionType: 'skill',
      skillLevel: 'professional',
      participantCount: 12,
      ...options
    });

    this.contracts.set(contract.id, contract);
    return contract;
  }

  generateResearchContract(options: Partial<ResearchContractOptions> = {}): ResearchContract {
    const contract = this.generator.generateResearchContract({
      researchType: 'behavioral',
      studyDuration: 4,
      riskLevel: 'minimal',
      ...options
    });

    this.contracts.set(contract.id, contract);
    return contract;
  }

  assignContract(contractId: string, tamaId: string): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'available') {
      return false;
    }

    // For testing purposes, validate against registered Tamas
    // In real implementation, this would check against actual Tama database
    if (!this.registeredTamas.has(tamaId) && !tamaId.startsWith('tama-')) {
      return false; // Invalid Tama ID
    }

    contract.status = 'assigned';
    contract.assignedTamaId = tamaId;
    return true;
  }

  // Helper method for tests to register valid Tamas
  registerTama(tamaId: string): void {
    this.registeredTamas.add(tamaId);
  }

  startContract(contractId: string): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'assigned') {
      return false;
    }

    contract.status = 'active';
    contract.startTime = Date.now();
    return true;
  }

  completeContract(
    contractId: string,
    tama: AdvancedTamaData,
    result: ContractCompletionResult
  ): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'active') {
      return false;
    }

    if (result.success) {
      contract.status = 'completed';

      // Apply reputation gains
      const reputationGain = contract.reputationImpact.success;
      tama.socialStatus.reputation = Math.min(100, tama.socialStatus.reputation + reputationGain);
    } else {
      contract.status = 'failed';

      // Apply reputation losses
      const reputationLoss = Math.abs(contract.reputationImpact.failure);
      tama.socialStatus.reputation = Math.max(0, tama.socialStatus.reputation - reputationLoss);
    }

    return true;
  }

  cancelContract(contractId: string, reason: string): boolean {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return false;
    }

    contract.status = 'cancelled';
    return true;
  }

  processExpiredContracts(): void {
    const now = Date.now();

    Array.from(this.contracts.values()).forEach(contract => {
      if (contract.status === 'available' && contract.expiryTime < now) {
        contract.status = 'cancelled';
      }
    });
  }

  findSuitableContracts(tama: AdvancedTamaData, options: ContractFilterOptions = {}): EnhancedContract[] {
    const suitable: EnhancedContract[] = [];

    Array.from(this.contracts.values()).forEach(contract => {
      if (contract.status !== 'available') return;

      if (options.excludeCategories?.includes(contract.category)) return;

      const compatibility = this.matcher.evaluateCompatibility(tama, contract);
      if (options.minCompatibilityScore && compatibility.overallScore < options.minCompatibilityScore) {
        return;
      }

      const risk = this.matcher.calculateRisk(tama, contract);
      const avgRisk = (risk.physicalRisk + risk.psychologicalRisk + risk.socialRisk) / 3;
      if (options.maxRiskLevel && avgRisk > options.maxRiskLevel) {
        return;
      }

      suitable.push(contract);
    });

    return suitable;
  }

  evaluateCompatibility(tama: AdvancedTamaData, contract: BaseContract): ContractCompatibility {
    return this.matcher.evaluateCompatibility(tama, contract);
  }

  calculateRisk(tama: AdvancedTamaData, contract: BaseContract): ContractRisk {
    return this.matcher.calculateRisk(tama, contract);
  }

  makeAutonomousContractChoice(
    tama: AdvancedTamaData,
    availableContracts: EnhancedContract[]
  ): AutonomousContractChoice | null {
    if (tama.autonomyLevel < 50 || availableContracts.length === 0) {
      return null; // Not autonomous enough or no contracts
    }

    let bestContract: EnhancedContract | null = null;
    let bestScore = 0;
    let bestReasoning = '';

    for (const contract of availableContracts) {
      const compatibility = this.matcher.evaluateCompatibility(tama, contract);
      const risk = this.matcher.calculateRisk(tama, contract);

      // Score based on compatibility, personality preferences, and risk aversion
      let score = compatibility.overallScore;

      // Personality-based preferences
      if (tama.personality.archetype === 'scholar' && contract.category === 'research') {
        score += 20; // Scholars love research
      }
      if (tama.personality.archetype === 'explorer' && contract.category === 'economic') {
        score += 15; // Explorers like economic adventures
      }
      if (tama.personality.competitiveness > 70 && contract.category === 'competition') {
        score += 25; // Competitive Tamas seek competitions
      }

      // Risk adjustment based on neuroticism
      const riskPenalty = (risk.physicalRisk + risk.psychologicalRisk) / 2;
      const riskAversion = tama.personality.neuroticism / 100;
      score -= riskPenalty * riskAversion;

      if (score > bestScore) {
        bestScore = score;
        bestContract = contract;
        bestReasoning = this.generateAutonomousReasoning(tama, contract, compatibility);
      }
    }

    if (bestContract && bestScore > 60) {
      return {
        chosenContract: bestContract,
        reasoning: bestReasoning,
        compatibilityScore: bestScore
      };
    }

    return null;
  }

  private generateAutonomousReasoning(
    tama: AdvancedTamaData,
    contract: EnhancedContract,
    compatibility: ContractCompatibility
  ): string {
    const reasons: string[] = [];

    if (compatibility.overallScore > 80) {
      reasons.push('excellent compatibility');
    }

    if (tama.personality.archetype === 'scholar' && contract.category === 'research') {
      reasons.push('aligns with scholarly interests');
    }

    if (contract.basePayment > 800) {
      reasons.push('offers substantial compensation');
    }

    if (compatibility.strengths.length > 0) {
      reasons.push(`leverages strengths: ${compatibility.strengths[0]}`);
    }

    return `Chosen for ${reasons.join(', ')}.`;
  }

  getContract(contractId: string): EnhancedContract | undefined {
    return this.contracts.get(contractId);
  }

  getAllContracts(): EnhancedContract[] {
    return Array.from(this.contracts.values());
  }

  getContractsByStatus(status: BaseContract['status']): EnhancedContract[] {
    return Array.from(this.contracts.values()).filter(c => c.status === status);
  }
}