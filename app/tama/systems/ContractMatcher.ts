import {
  BaseContract,
  ContractCompatibility,
  ContractRisk,
  ContractEvaluator,
  EconomicContract,
  CareContract,
  AdoptionContract,
  CompetitionContract,
  ResearchContract
} from '../types-contracts';
import { AdvancedTamaData } from '../types-advanced';

export class ContractMatcher implements ContractEvaluator {

  evaluateCompatibility(tama: AdvancedTamaData, contract: BaseContract): ContractCompatibility {
    const statCompatibility = this.evaluateStatCompatibility(tama, contract);
    const personalityMatch = this.evaluatePersonalityMatch(tama, contract);
    const skillRelevance = this.evaluateSkillRelevance(tama, contract);
    const riskTolerance = this.evaluateRiskTolerance(tama, contract);

    const overallScore = (statCompatibility + personalityMatch + skillRelevance + riskTolerance) / 4;

    const strengths = this.identifyStrengths(tama, contract, {
      statCompatibility, personalityMatch, skillRelevance, riskTolerance
    });

    const weaknesses = this.identifyWeaknesses(tama, contract, {
      statCompatibility, personalityMatch, skillRelevance, riskTolerance
    });

    const improvements = this.suggestImprovements(tama, contract, weaknesses);

    return {
      overallScore,
      statCompatibility,
      personalityMatch,
      skillRelevance,
      riskTolerance,
      strengths,
      weaknesses,
      improvements
    };
  }

  estimateSuccessProbability(tama: AdvancedTamaData, contract: BaseContract): number {
    const compatibility = this.evaluateCompatibility(tama, contract);
    const risk = this.calculateRisk(tama, contract);

    // Base success probability on compatibility, reduced by risk
    const baseSuccess = compatibility.overallScore;
    const riskReduction = (risk.physicalRisk + risk.psychologicalRisk) / 2;

    return Math.max(10, Math.min(95, baseSuccess - riskReduction * 0.5));
  }

  calculateRisk(tama: AdvancedTamaData, contract: BaseContract): ContractRisk {
    let physicalRisk = 10; // Base risk
    let psychologicalRisk = 10;
    let socialRisk = 5;
    let reputationRisk = contract.reputationImpact.failure * -2; // Convert negative to positive
    let financialRisk = 10;

    // Contract-specific risk calculations
    switch (contract.category) {
      case 'competition':
        const compContract = contract as CompetitionContract;
        physicalRisk = compContract.eventDetails.injuryRisk;
        psychologicalRisk = compContract.eventDetails.stressLevel;
        reputationRisk = Math.abs(compContract.eventDetails.loseReputationPenalty);
        break;

      case 'research':
        const resContract = contract as ResearchContract;
        physicalRisk = this.mapRiskLevel(resContract.studyDetails.risks.physical);
        psychologicalRisk = this.mapRiskLevel(resContract.studyDetails.risks.psychological);
        socialRisk = this.mapRiskLevel(resContract.studyDetails.risks.social);
        break;

      case 'economic':
        const econContract = contract as EconomicContract;
        financialRisk = econContract.itemDetails.riskLevel === 'high' ? 60 :
                      econContract.itemDetails.riskLevel === 'medium' ? 40 : 20;
        break;

      case 'care':
        psychologicalRisk = 30; // Caring for others can be emotionally taxing
        break;

      case 'adoption':
        socialRisk = 40; // Giving up a Tama has social implications
        psychologicalRisk = 35;
        break;
    }

    // Adjust risks based on Tama characteristics
    const mentalStress = tama.mentalState.stress;
    psychologicalRisk = Math.min(90, psychologicalRisk + mentalStress * 0.5);

    const confidence = tama.mentalState.confidence;
    reputationRisk = Math.max(5, reputationRisk - (confidence - 50) * 0.3);

    const riskMitigation = this.generateRiskMitigation(contract, { physicalRisk, psychologicalRisk });
    const warningFlags = this.generateWarningFlags(tama, contract);

    return {
      physicalRisk: Math.min(90, Math.max(0, physicalRisk)),
      psychologicalRisk: Math.min(90, Math.max(0, psychologicalRisk)),
      socialRisk: Math.min(90, Math.max(0, socialRisk)),
      reputationRisk: Math.min(90, Math.max(0, reputationRisk)),
      financialRisk: Math.min(90, Math.max(0, financialRisk)),
      riskMitigation,
      warningFlags
    };
  }

  generateRecommendations(tama: AdvancedTamaData, contract: BaseContract): string[] {
    const compatibility = this.evaluateCompatibility(tama, contract);
    const recommendations: string[] = [];

    if (compatibility.overallScore > 80) {
      recommendations.push('Excellent match - highly recommended');
    } else if (compatibility.overallScore > 60) {
      recommendations.push('Good compatibility - proceed with confidence');
    } else if (compatibility.overallScore > 40) {
      recommendations.push('Moderate fit - consider preparation time');
    } else {
      recommendations.push('Poor match - recommend seeking alternative contracts');
    }

    if (compatibility.improvements.length > 0) {
      recommendations.push(`Consider training: ${compatibility.improvements.slice(0, 2).join(', ')}`);
    }

    return recommendations;
  }

  private evaluateStatCompatibility(tama: AdvancedTamaData, contract: BaseContract): number {
    if (!contract.requirements.minimumStats) return 80; // No stat requirements = good compatibility

    let totalScore = 0;
    let requirementCount = 0;

    for (const [stat, required] of Object.entries(contract.requirements.minimumStats)) {
      const tamaValue = (tama.rpgStats as any)[stat] || 0;
      const requiredValue = Number(required) || 0;
      const ratio = tamaValue / requiredValue;
      // More harsh scoring - significant penalty for not meeting requirements
      const score = ratio >= 1.0 ? Math.min(100, ratio * 80) : Math.max(0, ratio * 40);
      totalScore += score;
      requirementCount++;
    }

    return requirementCount > 0 ? totalScore / requirementCount : 80;
  }

  private evaluatePersonalityMatch(tama: AdvancedTamaData, contract: BaseContract): number {
    let score = 70; // Base personality match

    // Contract-specific personality evaluation
    switch (contract.category) {
      case 'economic':
        // Economics benefits from high charisma and intelligence
        score += (tama.personality.extraversion - 50) * 0.5;
        score += (tama.rpgStats.charisma - 10) * 2;
        break;

      case 'competition':
        // Competition requires competitiveness and confidence
        score += tama.personality.competitiveness * 0.4;
        score += (tama.mentalState.confidence - 50) * 0.5;

        // Heavy penalty for non-aggressive personalities in combat
        const compContract = contract as CompetitionContract;
        if (compContract.competitionType === 'combat' && tama.personality.archetype === 'scholar') {
          score -= 40; // Scholars really don't like combat
        }
        if (compContract.competitionType === 'combat' && tama.personality.aggression < 50) {
          score -= 30; // Low aggression is bad for combat
        }
        break;

      case 'care':
        // Care requires agreeableness and patience
        score += tama.personality.agreeableness * 0.5;
        score -= tama.personality.aggression * 0.3;
        break;

      case 'research':
        // Research benefits from curiosity and conscientiousness
        score += tama.personality.curiosity * 0.4;
        score += tama.personality.conscientiousness * 0.3;
        break;

      case 'adoption':
        // Adoption requires emotional stability
        score += (100 - tama.personality.neuroticism) * 0.3;
        score += tama.personality.loyalty * 0.2;
        break;
    }

    return Math.min(100, Math.max(10, score));
  }

  private evaluateSkillRelevance(tama: AdvancedTamaData, contract: BaseContract): number {
    if (!contract.requirements.requiredSkills) return 75; // No skill requirements

    let totalScore = 0;
    let skillCount = 0;

    for (const [skill, required] of Object.entries(contract.requirements.requiredSkills)) {
      const tamaSkill = (tama.rpgStats.skills as any)[skill] || 0;
      const requiredValue = Number(required) || 0;
      const ratio = tamaSkill / requiredValue;
      // More harsh skill scoring too
      const score = ratio >= 1.0 ? Math.min(100, ratio * 80) : Math.max(0, ratio * 35);
      totalScore += score;
      skillCount++;
    }

    return skillCount > 0 ? totalScore / skillCount : 75;
  }

  private evaluateRiskTolerance(tama: AdvancedTamaData, contract: BaseContract): number {
    let tolerance = 70; // Base tolerance

    // Adjust based on Tama's mental state
    tolerance += (tama.mentalState.confidence - 50) * 0.5;
    tolerance -= tama.mentalState.stress * 0.3;
    tolerance -= tama.personality.neuroticism * 0.2;

    // Adjust based on contract risk level
    const risks = this.calculateRisk(tama, contract);
    const averageRisk = (risks.physicalRisk + risks.psychologicalRisk) / 2;
    tolerance -= averageRisk * 0.3;

    return Math.min(100, Math.max(10, tolerance));
  }

  private identifyStrengths(
    tama: AdvancedTamaData,
    contract: BaseContract,
    scores: { statCompatibility: number; personalityMatch: number; skillRelevance: number; riskTolerance: number }
  ): string[] {
    const strengths: string[] = [];

    if (scores.statCompatibility > 80) {
      strengths.push('Excellent stat compatibility');
    }
    if (scores.personalityMatch > 80) {
      strengths.push('Perfect personality fit');
    }
    if (scores.skillRelevance > 80) {
      strengths.push('Highly relevant skills');
    }
    if (scores.riskTolerance > 80) {
      strengths.push('High risk tolerance');
    }

    if (tama.personality.archetype === 'scholar' && contract.category === 'research') {
      strengths.push('Scholar archetype ideal for research');
    }

    return strengths;
  }

  private identifyWeaknesses(
    tama: AdvancedTamaData,
    contract: BaseContract,
    scores: { statCompatibility: number; personalityMatch: number; skillRelevance: number; riskTolerance: number }
  ): string[] {
    const weaknesses: string[] = [];

    if (scores.statCompatibility < 50) {
      weaknesses.push('Stats below requirements');
    }
    if (scores.personalityMatch < 50) {
      weaknesses.push('Personality mismatch');
    }
    if (scores.skillRelevance < 50) {
      weaknesses.push('Lacking required skills');
    }
    if (scores.riskTolerance < 50) {
      weaknesses.push('Poor risk tolerance');
    }

    return weaknesses;
  }

  private suggestImprovements(tama: AdvancedTamaData, contract: BaseContract, weaknesses: string[]): string[] {
    const improvements: string[] = [];

    if (weaknesses.includes('Stats below requirements')) {
      improvements.push('Stat training recommended');
    }
    if (weaknesses.includes('Lacking required skills')) {
      improvements.push('Skill development needed');
    }
    if (weaknesses.includes('Poor risk tolerance')) {
      improvements.push('Confidence building exercises');
    }

    return improvements;
  }

  private mapRiskLevel(level: string): number {
    switch (level) {
      case 'none': return 0;
      case 'minimal': return 15;
      case 'moderate': return 40;
      case 'high': return 70;
      default: return 25;
    }
  }

  private generateRiskMitigation(contract: BaseContract, risks: { physicalRisk: number; psychologicalRisk: number }): string[] {
    const mitigation: string[] = [];

    if (risks.physicalRisk > 50) {
      mitigation.push('Ensure proper safety equipment');
      mitigation.push('Consider additional training');
    }

    if (risks.psychologicalRisk > 50) {
      mitigation.push('Provide emotional support');
      mitigation.push('Monitor stress levels closely');
    }

    mitigation.push('Regular check-ins during contract');

    return mitigation;
  }

  private generateWarningFlags(tama: AdvancedTamaData, contract: BaseContract): string[] {
    const flags: string[] = [];

    if (tama.mentalState.stress > 70) {
      flags.push('Tama is highly stressed');
    }

    if (contract.category === 'competition' && tama.personality.competitiveness < 30) {
      flags.push('Low competitiveness for competition contract');
    }

    if (contract.category === 'care' && tama.personality.aggression > 70) {
      flags.push('High aggression may conflict with care duties');
    }

    return flags;
  }
}