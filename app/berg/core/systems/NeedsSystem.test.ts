import { Agent, AgentState, MovementBehavior } from '../agents/Agent';
import { NeedsSystem, Need, NeedType, NeedUrgency } from './NeedsSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class NeedsSystemTestSuite {
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

  private createTestAgent(type: string = 'authentic'): Agent {
    return new Agent('test-agent', 10, 10, {
      type: type as any,
      stamina: 100,
      socialEnergy: 80,
      entertainment: 60
    });
  }

  testNeedCreation(): void {
    this.test('creates need with correct properties', () => {
      const need = new Need(NeedType.STAMINA, 80, 20);
      
      if (need.type !== NeedType.STAMINA) {
        throw new Error(`Expected type STAMINA, got ${need.type}`);
      }
      if (need.currentValue !== 80) {
        throw new Error(`Expected currentValue 80, got ${need.currentValue}`);
      }
      if (need.threshold !== 20) {
        throw new Error(`Expected threshold 20, got ${need.threshold}`);
      }
      if (need.urgency !== NeedUrgency.LOW) {
        throw new Error(`Expected urgency LOW for value above threshold, got ${need.urgency}`);
      }
      return true;
    });

    this.test('calculates urgency correctly', () => {
      const lowNeed = new Need(NeedType.STAMINA, 80, 20);
      const mediumNeed = new Need(NeedType.SOCIAL, 15, 20);
      const highNeed = new Need(NeedType.ENTERTAINMENT, 5, 20);

      if (lowNeed.urgency !== NeedUrgency.LOW) {
        throw new Error(`Expected LOW urgency for 80/20, got ${lowNeed.urgency}`);
      }
      if (mediumNeed.urgency !== NeedUrgency.MEDIUM) {
        throw new Error(`Expected MEDIUM urgency for 15/20, got ${mediumNeed.urgency}`);
      }
      if (highNeed.urgency !== NeedUrgency.HIGH) {
        throw new Error(`Expected HIGH urgency for 5/20, got ${highNeed.urgency}`);
      }
      return true;
    });

    this.test('need satisfaction affects urgency', () => {
      const need = new Need(NeedType.STAMINA, 10, 20);
      const initialUrgency = need.urgency;
      
      need.satisfy(50); // Increase to 60
      
      if (need.currentValue !== 60) {
        throw new Error(`Expected value 60 after satisfaction, got ${need.currentValue}`);
      }
      if (need.urgency === initialUrgency) {
        throw new Error('Urgency should change after satisfaction');
      }
      if (need.urgency !== NeedUrgency.LOW) {
        throw new Error(`Expected LOW urgency after satisfaction, got ${need.urgency}`);
      }
      return true;
    });
  }

  testNeedsSystemInitialization(): void {
    this.test('initializes needs from agent state', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      const needs = needsSystem.getAllNeeds();
      if (needs.length !== 3) {
        throw new Error(`Expected 3 needs, got ${needs.length}`);
      }

      const staminaNeed = needsSystem.getNeed(NeedType.STAMINA);
      if (!staminaNeed || staminaNeed.currentValue !== 100) {
        throw new Error(`Expected stamina need with value 100, got ${staminaNeed?.currentValue}`);
      }

      const socialNeed = needsSystem.getNeed(NeedType.SOCIAL);
      if (!socialNeed || socialNeed.currentValue !== 80) {
        throw new Error(`Expected social need with value 80, got ${socialNeed?.currentValue}`);
      }

      const entertainmentNeed = needsSystem.getNeed(NeedType.ENTERTAINMENT);
      if (!entertainmentNeed || entertainmentNeed.currentValue !== 60) {
        throw new Error(`Expected entertainment need with value 60, got ${entertainmentNeed?.currentValue}`);
      }
      return true;
    });

    this.test('sets appropriate thresholds for agent types', () => {
      const authenticAgent = this.createTestAgent('authentic');
      const touristAgent = this.createTestAgent('tourist');
      
      const authenticSystem = new NeedsSystem(authenticAgent);
      const touristSystem = new NeedsSystem(touristAgent);

      const authenticSocial = authenticSystem.getNeed(NeedType.SOCIAL);
      const touristSocial = touristSystem.getNeed(NeedType.SOCIAL);

      if (!authenticSocial || !touristSocial) {
        throw new Error('Social needs should exist for both agent types');
      }

      // Authentic agents should have lower social thresholds (less needy)
      if (authenticSocial.threshold >= touristSocial.threshold) {
        throw new Error(`Authentic agents should be less socially needy: ${authenticSocial.threshold} vs ${touristSocial.threshold}`);
      }
      return true;
    });
  }

  testNeedDecay(): void {
    this.test('needs decay over time', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      const staminaNeed = needsSystem.getNeed(NeedType.STAMINA);
      const initialStamina = staminaNeed?.currentValue;

      // Simulate 10 seconds of decay
      for (let i = 0; i < 10; i++) {
        needsSystem.update(1000, AgentState.MOVING); // 1 second, moving state
      }

      const finalStamina = staminaNeed?.currentValue;
      
      if (!initialStamina || !finalStamina) {
        throw new Error('Stamina need should exist');
      }
      if (finalStamina >= initialStamina) {
        throw new Error(`Stamina should decay during movement: ${initialStamina} -> ${finalStamina}`);
      }
      return true;
    });

    this.test('decay rates vary by agent state', () => {
      const agent = this.createTestAgent();
      const movingSystem = new NeedsSystem(agent);
      const idleSystem = new NeedsSystem(agent);

      // Update both for same duration but different states
      for (let i = 0; i < 5; i++) {
        movingSystem.update(1000, AgentState.MOVING);
        idleSystem.update(1000, AgentState.IDLE);
      }

      const movingStamina = movingSystem.getNeed(NeedType.STAMINA)?.currentValue;
      const idleStamina = idleSystem.getNeed(NeedType.STAMINA)?.currentValue;

      if (!movingStamina || !idleStamina) {
        throw new Error('Both systems should have stamina needs');
      }
      if (movingStamina >= idleStamina) {
        throw new Error(`Moving should drain stamina faster than idle: ${movingStamina} vs ${idleStamina}`);
      }
      return true;
    });

    this.test('social need decays when alone', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      const socialNeed = needsSystem.getNeed(NeedType.SOCIAL);
      const initialSocial = socialNeed?.currentValue;

      // Update with no nearby agents
      for (let i = 0; i < 10; i++) {
        needsSystem.update(1000, AgentState.IDLE, []); // No nearby agents
      }

      const finalSocial = socialNeed?.currentValue;
      
      if (!initialSocial || !finalSocial) {
        throw new Error('Social need should exist');
      }
      if (finalSocial >= initialSocial) {
        throw new Error(`Social need should decay when alone: ${initialSocial} -> ${finalSocial}`);
      }
      return true;
    });
  }

  testNeedSatisfaction(): void {
    this.test('social need satisfied by nearby agents', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      // Reduce social need first
      const socialNeed = needsSystem.getNeed(NeedType.SOCIAL);
      socialNeed?.decay(30);
      const lowSocial = socialNeed?.currentValue;

      // Create nearby agents
      const nearbyAgents = [
        this.createTestAgent('regular'),
        this.createTestAgent('authentic')
      ];

      // Update with nearby agents
      for (let i = 0; i < 5; i++) {
        needsSystem.update(1000, AgentState.IDLE, nearbyAgents);
      }

      const improvedSocial = socialNeed?.currentValue;
      
      if (!lowSocial || !improvedSocial) {
        throw new Error('Social need should exist');
      }
      if (improvedSocial <= lowSocial) {
        throw new Error(`Social need should improve with nearby agents: ${lowSocial} -> ${improvedSocial}`);
      }
      return true;
    });

    this.test('entertainment need satisfied by dancefloor proximity', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      const entertainmentNeed = needsSystem.getNeed(NeedType.ENTERTAINMENT);
      entertainmentNeed?.decay(40);
      const lowEntertainment = entertainmentNeed?.currentValue;

      // Simulate being on dancefloor
      needsSystem.setCurrentLocation('dancefloor');
      
      for (let i = 0; i < 5; i++) {
        needsSystem.update(1000, AgentState.IDLE);
      }

      const improvedEntertainment = entertainmentNeed?.currentValue;
      
      if (!lowEntertainment || !improvedEntertainment) {
        throw new Error('Entertainment need should exist');
      }
      if (improvedEntertainment <= lowEntertainment) {
        throw new Error(`Entertainment should improve on dancefloor: ${lowEntertainment} -> ${improvedEntertainment}`);
      }
      return true;
    });

    this.test('stamina restored in toilets', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      const staminaNeed = needsSystem.getNeed(NeedType.STAMINA);
      staminaNeed?.decay(50);
      const lowStamina = staminaNeed?.currentValue;

      // Simulate being in toilets
      needsSystem.setCurrentLocation('toilets');
      
      for (let i = 0; i < 3; i++) {
        needsSystem.update(1000, AgentState.IDLE);
      }

      const restoredStamina = staminaNeed?.currentValue;
      
      if (!lowStamina || !restoredStamina) {
        throw new Error('Stamina need should exist');
      }
      if (restoredStamina <= lowStamina) {
        throw new Error(`Stamina should restore in toilets: ${lowStamina} -> ${restoredStamina}`);
      }
      return true;
    });
  }

  testUrgentNeedDetection(): void {
    this.test('identifies most urgent need', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      // Make stamina critically low
      const staminaNeed = needsSystem.getNeed(NeedType.STAMINA);
      staminaNeed?.setValue(5);

      const mostUrgent = needsSystem.getMostUrgentNeed();
      
      if (!mostUrgent) {
        throw new Error('Should identify most urgent need');
      }
      if (mostUrgent.type !== NeedType.STAMINA) {
        throw new Error(`Most urgent should be STAMINA, got ${mostUrgent.type}`);
      }
      if (mostUrgent.urgency !== NeedUrgency.HIGH) {
        throw new Error(`Should be HIGH urgency, got ${mostUrgent.urgency}`);
      }
      return true;
    });

    this.test('filters needs by urgency level', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      // Create mixed urgency levels
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(5); // HIGH
      needsSystem.getNeed(NeedType.SOCIAL)?.setValue(15); // MEDIUM
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(80); // LOW

      const highUrgencyNeeds = needsSystem.getNeedsByUrgency(NeedUrgency.HIGH);
      const mediumUrgencyNeeds = needsSystem.getNeedsByUrgency(NeedUrgency.MEDIUM);
      const lowUrgencyNeeds = needsSystem.getNeedsByUrgency(NeedUrgency.LOW);

      if (highUrgencyNeeds.length !== 1 || highUrgencyNeeds[0].type !== NeedType.STAMINA) {
        throw new Error('Should identify one HIGH urgency need (STAMINA)');
      }
      if (mediumUrgencyNeeds.length !== 1 || mediumUrgencyNeeds[0].type !== NeedType.SOCIAL) {
        throw new Error('Should identify one MEDIUM urgency need (SOCIAL)');
      }
      if (lowUrgencyNeeds.length !== 1 || lowUrgencyNeeds[0].type !== NeedType.ENTERTAINMENT) {
        throw new Error('Should identify one LOW urgency need (ENTERTAINMENT)');
      }
      return true;
    });
  }

  testAgentTypeBehaviorDifferences(): void {
    this.test('authentic agents are less socially needy', () => {
      const authentic = this.createTestAgent('authentic');
      const tourist = this.createTestAgent('tourist');
      
      const authenticSystem = new NeedsSystem(authentic);
      const touristSystem = new NeedsSystem(tourist);

      // Both alone for same duration
      for (let i = 0; i < 10; i++) {
        authenticSystem.update(1000, AgentState.IDLE, []);
        touristSystem.update(1000, AgentState.IDLE, []);
      }

      const authenticSocial = authenticSystem.getNeed(NeedType.SOCIAL)?.currentValue;
      const touristSocial = touristSystem.getNeed(NeedType.SOCIAL)?.currentValue;

      if (!authenticSocial || !touristSocial) {
        throw new Error('Both should have social needs');
      }
      if (authenticSocial <= touristSocial) {
        throw new Error(`Authentic agents should handle isolation better: ${authenticSocial} vs ${touristSocial}`);
      }
      return true;
    });

    this.test('influencer agents need more entertainment', () => {
      const regular = this.createTestAgent('regular');
      const influencer = this.createTestAgent('influencer');
      
      const regularSystem = new NeedsSystem(regular);
      const influencerSystem = new NeedsSystem(influencer);

      const regularEntertainment = regularSystem.getNeed(NeedType.ENTERTAINMENT);
      const influencerEntertainment = influencerSystem.getNeed(NeedType.ENTERTAINMENT);

      if (!regularEntertainment || !influencerEntertainment) {
        throw new Error('Both should have entertainment needs');
      }
      
      // Influencers should have higher entertainment thresholds
      if (influencerEntertainment.threshold <= regularEntertainment.threshold) {
        throw new Error(`Influencers should need more entertainment: ${influencerEntertainment.threshold} vs ${regularEntertainment.threshold}`);
      }
      return true;
    });
  }

  testNeedsSystemIntegration(): void {
    this.test('syncs needs back to agent properties', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);

      // Modify needs
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(75);
      needsSystem.getNeed(NeedType.SOCIAL)?.setValue(45);
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(30);

      // Sync back to agent
      needsSystem.syncToAgent();

      if (agent.stamina !== 75) {
        throw new Error(`Expected agent stamina 75, got ${agent.stamina}`);
      }
      if (agent.socialEnergy !== 45) {
        throw new Error(`Expected agent socialEnergy 45, got ${agent.socialEnergy}`);
      }
      if (agent.entertainment !== 30) {
        throw new Error(`Expected agent entertainment 30, got ${agent.entertainment}`);
      }
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🧠 NeedsSystem Test Suite\n');
    
    this.testNeedCreation();
    this.testNeedsSystemInitialization();
    this.testNeedDecay();
    this.testNeedSatisfaction();
    this.testUrgentNeedDetection();
    this.testAgentTypeBehaviorDifferences();
    this.testNeedsSystemIntegration();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 NeedsSystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All needs system tests passed! Agent motivation system is working.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new NeedsSystemTestSuite();
  suite.runAllTests();
}

export default NeedsSystemTestSuite;