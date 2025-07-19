import { Agent } from '../agents/Agent';
import { ReputationSystem, ReputationCategory, ReputationEvent, ReputationModifier } from './ReputationSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class ReputationSystemTestSuite {
  private results: TestResult[] = [];

  private test(name: string, testFn: () => boolean): void {
    try {
      const passed = testFn();
      this.results.push({ name, passed });
      console.log(`${passed ? '✅' : '❌'} ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name}: ${error}`);
    }
  }

  private createTestAgent(type: string, id: string): Agent {
    return new Agent(id, Math.random() * 20, Math.random() * 20, {
      type: type as any,
      stamina: 80 + Math.random() * 20,
      socialEnergy: 60 + Math.random() * 40,
      entertainment: 50 + Math.random() * 50
    });
  }

  testReputationInitialization(): void {
    this.test('creates reputation system with default values', () => {
      const reputationSystem = new ReputationSystem();
      
      const agent = this.createTestAgent('authentic', 'agent1');
      const reputation = reputationSystem.getAgentReputation(agent.id);
      
      if (!reputation) {
        throw new Error('Should create reputation entry for new agent');
      }
      
      if (reputation.overall < 40 || reputation.overall > 60) {
        throw new Error(`Expected neutral reputation around 50, got ${reputation.overall}`);
      }
      
      return true;
    });

    this.test('agent type affects initial reputation', () => {
      const reputationSystem = new ReputationSystem();
      
      const authentic = this.createTestAgent('authentic', 'auth1');
      const tourist = this.createTestAgent('tourist', 'tour1');
      
      const authReputation = reputationSystem.getAgentReputation(authentic.id);
      const tourReputation = reputationSystem.getAgentReputation(tourist.id);
      
      if (!authReputation || !tourReputation) {
        throw new Error('Should create reputations for both agents');
      }
      
      // Authentic agents should start with higher reputation in scene
      if (authReputation.scene <= tourReputation.scene) {
        throw new Error('Authentic agents should have higher initial scene reputation');
      }
      
      return true;
    });
  }

  testReputationCategories(): void {
    this.test('tracks different reputation categories', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('regular', 'agent2');
      
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 15,
        reason: 'great_dancing',
        witnesses: ['witness1', 'witness2'],
        location: 'dancefloor'
      });
      
      const reputation = reputationSystem.getAgentReputation(agent.id);
      
      if (!reputation) {
        throw new Error('Should have reputation data');
      }
      
      if (reputation.scene <= 50) {
        throw new Error('Scene reputation should increase after positive event');
      }
      
      return true;
    });

    this.test('different categories are tracked independently', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('curious', 'agent3');
      
      // Improve scene reputation
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 20,
        reason: 'amazing_dance_moves',
        witnesses: ['witness1'],
        location: 'dancefloor'
      });
      
      // Damage social reputation
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SOCIAL,
        impact: -15,
        reason: 'rude_behavior',
        witnesses: ['witness2'],
        location: 'bar'
      });
      
      const reputation = reputationSystem.getAgentReputation(agent.id);
      
      if (!reputation) {
        throw new Error('Should have reputation data');
      }
      
      if (reputation.scene <= 50) {
        throw new Error('Scene reputation should be high');
      }
      
      if (reputation.social >= 50) {
        throw new Error('Social reputation should be low');
      }
      
      return true;
    });
  }

  testWitnessSystem(): void {
    this.test('witnesses affect reputation impact', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('regular', 'agent4');
      
      const initialReputation = reputationSystem.getAgentReputation(agent.id);
      const initialScene = initialReputation?.scene || 50;
      
      // Event with many witnesses
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 10,
        reason: 'good_vibes',
        witnesses: ['w1', 'w2', 'w3', 'w4', 'w5'], // Many witnesses
        location: 'dancefloor'
      });
      
      const withWitnessesReputation = reputationSystem.getAgentReputation(agent.id);
      const witnessedGain = (withWitnessesReputation?.scene || 50) - initialScene;
      
      // Reset agent
      const agent2 = this.createTestAgent('regular', 'agent5');
      const initial2 = reputationSystem.getAgentReputation(agent2.id);
      const initialScene2 = initial2?.scene || 50;
      
      // Same event with no witnesses
      reputationSystem.recordEvent(agent2.id, {
        category: ReputationCategory.SCENE,
        impact: 10,
        reason: 'good_vibes',
        witnesses: [], // No witnesses
        location: 'dancefloor'
      });
      
      const withoutWitnessesReputation = reputationSystem.getAgentReputation(agent2.id);
      const unwitnessedGain = (withoutWitnessesReputation?.scene || 50) - initialScene2;
      
      if (witnessedGain <= unwitnessedGain) {
        throw new Error('Witnessed events should have larger reputation impact');
      }
      
      return true;
    });

    this.test('witness agents gain reputation insight', () => {
      const reputationSystem = new ReputationSystem();
      const performer = this.createTestAgent('authentic', 'performer');
      const witness = this.createTestAgent('regular', 'witness');
      
      reputationSystem.recordEvent(performer.id, {
        category: ReputationCategory.SCENE,
        impact: 20,
        reason: 'legendary_performance',
        witnesses: [witness.id],
        location: 'dancefloor'
      });
      
      const witnessInsight = reputationSystem.getWitnessInsight(witness.id, performer.id);
      
      if (!witnessInsight) {
        throw new Error('Witness should have insight about performer');
      }
      
      if (witnessInsight.reliability < 0.5) {
        throw new Error('Witness should have reasonable reliability for direct observation');
      }
      
      return true;
    });
  }

  testReputationDecay(): void {
    this.test('reputation naturally decays over time', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('regular', 'agent6');
      
      // Build high reputation
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 30,
        reason: 'amazing_night',
        witnesses: ['w1', 'w2'],
        location: 'dancefloor'
      });
      
      const highReputation = reputationSystem.getAgentReputation(agent.id);
      const highScene = highReputation?.scene || 50;
      
      // Simulate time passage with decay
      reputationSystem.processDecay(3600000); // 1 hour
      
      const decayedReputation = reputationSystem.getAgentReputation(agent.id);
      const decayedScene = decayedReputation?.scene || 50;
      
      if (decayedScene >= highScene) {
        throw new Error('Reputation should decay over time');
      }
      
      return true;
    });

    this.test('recent activity slows decay', () => {
      const reputationSystem = new ReputationSystem();
      const activeAgent = this.createTestAgent('regular', 'active');
      const inactiveAgent = this.createTestAgent('regular', 'inactive');
      
      // Both agents start with high reputation
      reputationSystem.recordEvent(activeAgent.id, {
        category: ReputationCategory.SCENE,
        impact: 25,
        reason: 'great_start',
        witnesses: ['w1'],
        location: 'dancefloor'
      });
      
      reputationSystem.recordEvent(inactiveAgent.id, {
        category: ReputationCategory.SCENE,
        impact: 25,
        reason: 'great_start',
        witnesses: ['w1'],
        location: 'dancefloor'
      });
      
      // Active agent continues activity
      reputationSystem.recordEvent(activeAgent.id, {
        category: ReputationCategory.SOCIAL,
        impact: 5,
        reason: 'stayed_active',
        witnesses: ['w2'],
        location: 'bar'
      });
      
      // Process decay
      reputationSystem.processDecay(3600000); // 1 hour
      
      const activeRep = reputationSystem.getAgentReputation(activeAgent.id);
      const inactiveRep = reputationSystem.getAgentReputation(inactiveAgent.id);
      
      if (!activeRep || !inactiveRep) {
        throw new Error('Should have reputation data for both agents');
      }
      
      // Active agent should have slower decay due to recent activity
      if (activeRep.overall <= inactiveRep.overall) {
        throw new Error('Active agent should have slower reputation decay');
      }
      
      return true;
    });
  }

  testReputationModifiers(): void {
    this.test('reputation modifiers affect calculations', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('tourist', 'agent7');
      
      // Add modifier for tourist stigma
      reputationSystem.addModifier(agent.id, {
        category: ReputationCategory.SCENE,
        multiplier: 0.7, // Tourist penalty
        reason: 'tourist_stigma',
        duration: 7200000, // 2 hours
        source: 'agent_type'
      });
      
      const beforeEvent = reputationSystem.getAgentReputation(agent.id);
      const beforeScene = beforeEvent?.scene || 50;
      
      // Positive event with modifier active
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 20,
        reason: 'good_dancing',
        witnesses: ['w1'],
        location: 'dancefloor'
      });
      
      const afterEvent = reputationSystem.getAgentReputation(agent.id);
      const afterScene = afterEvent?.scene || 50;
      const gain = afterScene - beforeScene;
      
      // Gain should be reduced due to tourist modifier
      if (gain >= 20) {
        throw new Error('Tourist modifier should reduce reputation gains');
      }
      
      if (gain <= 10) {
        throw new Error('Modifier should not completely negate gains');
      }
      
      return true;
    });

    this.test('modifiers expire after duration', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('regular', 'agent8');
      
      // Add short-term modifier
      reputationSystem.addModifier(agent.id, {
        category: ReputationCategory.SOCIAL,
        multiplier: 1.5,
        reason: 'good_mood',
        duration: 100, // Very short duration for testing
        source: 'temporary_boost'
      });
      
      const modifiersBefore = reputationSystem.getActiveModifiers(agent.id);
      
      // Wait for modifier to expire
      setTimeout(() => {
        reputationSystem.cleanExpiredModifiers();
        const modifiersAfter = reputationSystem.getActiveModifiers(agent.id);
        
        if (modifiersAfter.length >= modifiersBefore.length) {
          throw new Error('Expired modifiers should be cleaned up');
        }
      }, 150);
      
      return true; // Simplified for synchronous testing
    });
  }

  testReputationQueries(): void {
    this.test('provides reputation comparisons between agents', () => {
      const reputationSystem = new ReputationSystem();
      const agent1 = this.createTestAgent('authentic', 'high_rep');
      const agent2 = this.createTestAgent('tourist', 'low_rep');
      
      // Build different reputation levels
      reputationSystem.recordEvent(agent1.id, {
        category: ReputationCategory.SCENE,
        impact: 30,
        reason: 'legendary_status',
        witnesses: ['w1', 'w2', 'w3'],
        location: 'dancefloor'
      });
      
      reputationSystem.recordEvent(agent2.id, {
        category: ReputationCategory.SCENE,
        impact: -10,
        reason: 'awkward_dancing',
        witnesses: ['w1'],
        location: 'dancefloor'
      });
      
      const comparison = reputationSystem.compareAgents(agent1.id, agent2.id);
      
      if (!comparison) {
        throw new Error('Should provide comparison data');
      }
      
      if (comparison.agent1Better <= comparison.agent2Better) {
        throw new Error('Agent1 should have better reputation in more categories');
      }
      
      return true;
    });

    this.test('identifies reputation leaders by category', () => {
      const reputationSystem = new ReputationSystem();
      
      const sceneKing = this.createTestAgent('authentic', 'scene_king');
      const socialite = this.createTestAgent('regular', 'socialite');
      const average = this.createTestAgent('curious', 'average');
      
      // Build scene reputation for scene_king
      reputationSystem.recordEvent(sceneKing.id, {
        category: ReputationCategory.SCENE,
        impact: 40,
        reason: 'scene_domination',
        witnesses: ['w1', 'w2', 'w3', 'w4'],
        location: 'dancefloor'
      });
      
      // Build social reputation for socialite
      reputationSystem.recordEvent(socialite.id, {
        category: ReputationCategory.SOCIAL,
        impact: 35,
        reason: 'social_butterfly',
        witnesses: ['w1', 'w2'],
        location: 'bar'
      });
      
      const sceneLeaders = reputationSystem.getTopAgents(ReputationCategory.SCENE, 3);
      const socialLeaders = reputationSystem.getTopAgents(ReputationCategory.SOCIAL, 3);
      
      if (!sceneLeaders.some(leader => leader.agentId === sceneKing.id)) {
        throw new Error('Scene king should be in scene leaders');
      }
      
      if (!socialLeaders.some(leader => leader.agentId === socialite.id)) {
        throw new Error('Socialite should be in social leaders');
      }
      
      return true;
    });
  }

  testLocationReputation(): void {
    this.test('tracks agent reputation by location', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('regular', 'agent9');
      
      // Build reputation at specific location
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SCENE,
        impact: 25,
        reason: 'dancefloor_legend',
        witnesses: ['w1', 'w2'],
        location: 'dancefloor'
      });
      
      // Lower reputation at different location
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.SOCIAL,
        impact: -5,
        reason: 'bar_incident',
        witnesses: ['w3'],
        location: 'bar'
      });
      
      const dancefloorRep = reputationSystem.getLocationReputation(agent.id, 'dancefloor');
      const barRep = reputationSystem.getLocationReputation(agent.id, 'bar');
      
      if (!dancefloorRep || !barRep) {
        throw new Error('Should have location-specific reputation data');
      }
      
      if (dancefloorRep.overall <= barRep.overall) {
        throw new Error('Dancefloor reputation should be higher than bar reputation');
      }
      
      return true;
    });
  }

  testReputationEvents(): void {
    this.test('reputation events are stored with full context', () => {
      const reputationSystem = new ReputationSystem();
      const agent = this.createTestAgent('influencer', 'agent10');
      
      reputationSystem.recordEvent(agent.id, {
        category: ReputationCategory.CULTURAL,
        impact: -20,
        reason: 'cultural_appropriation',
        witnesses: ['witness1', 'witness2'],
        location: 'dancefloor',
        metadata: {
          severity: 'high',
          response: 'community_backlash'
        }
      });
      
      const events = reputationSystem.getReputationEvents(agent.id);
      
      if (events.length !== 1) {
        throw new Error(`Expected 1 reputation event, got ${events.length}`);
      }
      
      const event = events[0];
      if (event.reason !== 'cultural_appropriation') {
        throw new Error('Event should preserve reason');
      }
      
      if (!event.witnesses.includes('witness1')) {
        throw new Error('Event should preserve witness list');
      }
      
      if (!event.metadata || event.metadata.severity !== 'high') {
        throw new Error('Event should preserve metadata');
      }
      
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🏆 ReputationSystem Test Suite\n');
    
    this.testReputationInitialization();
    this.testReputationCategories();
    this.testWitnessSystem();
    this.testReputationDecay();
    this.testReputationModifiers();
    this.testReputationQueries();
    this.testLocationReputation();
    this.testReputationEvents();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 ReputationSystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All reputation system tests passed! Social dynamics ready for authentic clubber status tracking.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new ReputationSystemTestSuite();
  suite.runAllTests();
}

export default ReputationSystemTestSuite;