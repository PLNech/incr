import { Agent } from '../agents/Agent';
import { MemorySystem, MemoryType, LocationMemory, AgentMemory, EventMemory } from './MemorySystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class MemorySystemTestSuite {
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

  testMemoryCreation(): void {
    this.test('creates memory system for agent', () => {
      const agent = this.createTestAgent('authentic', 'agent1');
      const memorySystem = new MemorySystem(agent);
      
      if (memorySystem.getAgentId() !== 'agent1') {
        throw new Error('Memory system should be linked to correct agent');
      }
      
      return true;
    });

    this.test('agent starts with empty memories', () => {
      const agent = this.createTestAgent('regular', 'agent2');
      const memorySystem = new MemorySystem(agent);
      
      if (memorySystem.getLocationMemories().length !== 0) {
        throw new Error('Should start with no location memories');
      }
      
      if (memorySystem.getAgentMemories().length !== 0) {
        throw new Error('Should start with no agent memories');
      }
      
      if (memorySystem.getEventMemories().length !== 0) {
        throw new Error('Should start with no event memories');
      }
      
      return true;
    });
  }

  testLocationMemories(): void {
    this.test('records location experiences', () => {
      const agent = this.createTestAgent('curious', 'agent3');
      const memorySystem = new MemorySystem(agent);
      
      memorySystem.recordLocationExperience('dancefloor', 85, {
        crowdDensity: 0.7,
        musicQuality: 90,
        duration: 1800000 // 30 minutes
      });
      
      const memories = memorySystem.getLocationMemories();
      
      if (memories.length !== 1) {
        throw new Error(`Expected 1 location memory, got ${memories.length}`);
      }
      
      const memory = memories[0];
      if (memory.location !== 'dancefloor') {
        throw new Error('Should record correct location');
      }
      
      if (memory.satisfaction !== 85) {
        throw new Error('Should record correct satisfaction');
      }
      
      return true;
    });

    this.test('calculates location preferences from multiple visits', () => {
      const agent = this.createTestAgent('regular', 'agent4');
      const memorySystem = new MemorySystem(agent);
      
      // Record multiple visits to bar with varying satisfaction
      memorySystem.recordLocationExperience('bar', 70, { crowdDensity: 0.3 });
      memorySystem.recordLocationExperience('bar', 80, { crowdDensity: 0.4 });
      memorySystem.recordLocationExperience('bar', 90, { crowdDensity: 0.2 });
      
      const preference = memorySystem.getLocationPreference('bar');
      
      if (preference === null) {
        throw new Error('Should have preference for visited location');
      }
      
      // Average should be 80
      if (Math.abs(preference.averageSatisfaction - 80) > 1) {
        throw new Error(`Expected average satisfaction ~80, got ${preference.averageSatisfaction}`);
      }
      
      if (preference.visitCount !== 3) {
        throw new Error(`Expected 3 visits, got ${preference.visitCount}`);
      }
      
      return true;
    });

    this.test('prefers locations with consistently high satisfaction', () => {
      const agent = this.createTestAgent('authentic', 'agent5');
      const memorySystem = new MemorySystem(agent);
      
      // Record experiences at two locations
      memorySystem.recordLocationExperience('dancefloor', 90, {});
      memorySystem.recordLocationExperience('dancefloor', 85, {});
      memorySystem.recordLocationExperience('dancefloor', 88, {});
      
      memorySystem.recordLocationExperience('bar', 60, {});
      memorySystem.recordLocationExperience('bar', 65, {});
      
      const dancefloorPref = memorySystem.getLocationPreference('dancefloor');
      const barPref = memorySystem.getLocationPreference('bar');
      
      if (!dancefloorPref || !barPref) {
        throw new Error('Should have preferences for both locations');
      }
      
      if (dancefloorPref.averageSatisfaction <= barPref.averageSatisfaction) {
        throw new Error('Dancefloor should have higher satisfaction than bar');
      }
      
      return true;
    });

    this.test('forgets old location memories over time', () => {
      const agent = this.createTestAgent('tourist', 'agent6');
      const memorySystem = new MemorySystem(agent);
      
      // Record old experience
      memorySystem.recordLocationExperience('toilets', 50, {});
      
      // Simulate time passage (25 hours)
      const now = performance.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000;
      
      // Manually set old timestamp for testing
      const memories = memorySystem.getLocationMemories();
      if (memories.length > 0) {
        (memories[0] as any).timestamp = oldTimestamp;
      }
      
      // Clean old memories
      memorySystem.cleanOldMemories();
      
      const afterClean = memorySystem.getLocationMemories();
      
      if (afterClean.length !== 0) {
        throw new Error('Old memories should be cleaned up');
      }
      
      return true;
    });
  }

  testAgentMemories(): void {
    this.test('records interactions with other agents', () => {
      const agent1 = this.createTestAgent('authentic', 'agent7');
      const agent2 = this.createTestAgent('regular', 'agent8');
      const memorySystem = new MemorySystem(agent1);
      
      memorySystem.recordAgentInteraction(agent2, 75, 'danced_together');
      
      const memories = memorySystem.getAgentMemories();
      
      if (memories.length !== 1) {
        throw new Error(`Expected 1 agent memory, got ${memories.length}`);
      }
      
      const memory = memories[0];
      if (memory.agentId !== 'agent8') {
        throw new Error('Should record correct agent ID');
      }
      
      if (memory.satisfaction !== 75) {
        throw new Error('Should record correct satisfaction');
      }
      
      if (memory.context !== 'danced_together') {
        throw new Error('Should record interaction context');
      }
      
      return true;
    });

    this.test('builds relationship strength from repeated interactions', () => {
      const agent1 = this.createTestAgent('regular', 'agent9');
      const agent2 = this.createTestAgent('curious', 'agent10');
      const memorySystem = new MemorySystem(agent1);
      
      // Record multiple positive interactions
      memorySystem.recordAgentInteraction(agent2, 80, 'shared_drink');
      memorySystem.recordAgentInteraction(agent2, 85, 'danced_together');
      memorySystem.recordAgentInteraction(agent2, 90, 'conversation');
      
      const relationship = memorySystem.getAgentRelationship('agent10');
      
      if (!relationship) {
        throw new Error('Should have relationship data');
      }
      
      if (relationship.interactionCount !== 3) {
        throw new Error(`Expected 3 interactions, got ${relationship.interactionCount}`);
      }
      
      // Should have high relationship strength
      if (relationship.relationshipStrength < 80) {
        throw new Error(`Expected high relationship strength, got ${relationship.relationshipStrength}`);
      }
      
      return true;
    });

    this.test('negative interactions reduce relationship strength', () => {
      const agent1 = this.createTestAgent('tourist', 'agent11');
      const agent2 = this.createTestAgent('authentic', 'agent12');
      const memorySystem = new MemorySystem(agent1);
      
      // Start with neutral interaction
      memorySystem.recordAgentInteraction(agent2, 50, 'brief_encounter');
      
      // Add negative interaction
      memorySystem.recordAgentInteraction(agent2, 20, 'conflict');
      
      const relationship = memorySystem.getAgentRelationship('agent12');
      
      if (!relationship) {
        throw new Error('Should have relationship data');
      }
      
      // Relationship strength should be below 50
      if (relationship.relationshipStrength >= 50) {
        throw new Error(`Expected reduced relationship strength, got ${relationship.relationshipStrength}`);
      }
      
      return true;
    });
  }

  testEventMemories(): void {
    this.test('records significant events', () => {
      const agent = this.createTestAgent('influencer', 'agent13');
      const memorySystem = new MemorySystem(agent);
      
      memorySystem.recordEvent('entry_rejection', 'bar', {
        reason: 'overdressed',
        bouncerType: 'strict'
      });
      
      const events = memorySystem.getEventMemories();
      
      if (events.length !== 1) {
        throw new Error(`Expected 1 event memory, got ${events.length}`);
      }
      
      const event = events[0];
      if (event.eventType !== 'entry_rejection') {
        throw new Error('Should record correct event type');
      }
      
      if (event.location !== 'bar') {
        throw new Error('Should record correct location');
      }
      
      return true;
    });

    this.test('retrieves events by type', () => {
      const agent = this.createTestAgent('curious', 'agent14');
      const memorySystem = new MemorySystem(agent);
      
      memorySystem.recordEvent('entry_success', 'dancefloor', {});
      memorySystem.recordEvent('entry_rejection', 'vip', {});
      memorySystem.recordEvent('entry_success', 'bar', {});
      
      const successEvents = memorySystem.getEventsByType('entry_success');
      const rejectionEvents = memorySystem.getEventsByType('entry_rejection');
      
      if (successEvents.length !== 2) {
        throw new Error(`Expected 2 success events, got ${successEvents.length}`);
      }
      
      if (rejectionEvents.length !== 1) {
        throw new Error(`Expected 1 rejection event, got ${rejectionEvents.length}`);
      }
      
      return true;
    });
  }

  testMemoryInfluenceOnBehavior(): void {
    this.test('memory influences location preferences', () => {
      const agent = this.createTestAgent('regular', 'agent15');
      const memorySystem = new MemorySystem(agent);
      
      // Create strong preference for dancefloor
      for (let i = 0; i < 5; i++) {
        memorySystem.recordLocationExperience('dancefloor', 85 + Math.random() * 10, {});
      }
      
      // Create weak preference for bar
      memorySystem.recordLocationExperience('bar', 40, {});
      memorySystem.recordLocationExperience('bar', 45, {});
      
      const behaviorInfluence = memorySystem.getBehaviorInfluence();
      
      if (!behaviorInfluence.preferredLocations) {
        throw new Error('Should have preferred locations');
      }
      
      const topPreference = behaviorInfluence.preferredLocations[0];
      if (topPreference !== 'dancefloor') {
        throw new Error(`Expected dancefloor as top preference, got ${topPreference}`);
      }
      
      return true;
    });

    this.test('memory affects decision confidence', () => {
      const agent = this.createTestAgent('authentic', 'agent16');
      const memorySystem = new MemorySystem(agent);
      
      // Record many positive experiences
      for (let i = 0; i < 10; i++) {
        memorySystem.recordLocationExperience('dancefloor', 80 + Math.random() * 15, {});
      }
      
      const behaviorInfluence = memorySystem.getBehaviorInfluence();
      
      if (behaviorInfluence.decisionConfidence < 0.7) {
        throw new Error(`Expected high decision confidence, got ${behaviorInfluence.decisionConfidence}`);
      }
      
      return true;
    });

    this.test('recent memories have stronger influence', () => {
      const agent = this.createTestAgent('curious', 'agent17');
      const memorySystem = new MemorySystem(agent);
      
      // Record old negative experience
      memorySystem.recordLocationExperience('bar', 30, {});
      
      // Record recent positive experiences
      memorySystem.recordLocationExperience('bar', 85, {});
      memorySystem.recordLocationExperience('bar', 90, {});
      
      const preference = memorySystem.getLocationPreference('bar');
      
      if (!preference) {
        throw new Error('Should have bar preference');
      }
      
      // Recent positive experiences should outweigh old negative one
      if (preference.averageSatisfaction < 60) {
        throw new Error(`Expected positive preference due to recent experiences, got ${preference.averageSatisfaction}`);
      }
      
      return true;
    });
  }

  testMemoryCapacityAndMaintenance(): void {
    this.test('memory system has capacity limits', () => {
      const agent = this.createTestAgent('tourist', 'agent18');
      const memorySystem = new MemorySystem(agent);
      
      // Fill memory with many location experiences
      for (let i = 0; i < 150; i++) {
        memorySystem.recordLocationExperience(`location_${i}`, 50 + Math.random() * 50, {});
      }
      
      const memories = memorySystem.getLocationMemories();
      
      // Should not exceed reasonable capacity
      if (memories.length > 100) {
        throw new Error(`Memory should have capacity limits, got ${memories.length} memories`);
      }
      
      return true;
    });

    this.test('maintains most important memories when at capacity', () => {
      const agent = this.createTestAgent('regular', 'agent19');
      const memorySystem = new MemorySystem(agent);
      
      // Add high-satisfaction memory
      memorySystem.recordLocationExperience('important_place', 95, {});
      
      // Fill with many mediocre memories
      for (let i = 0; i < 120; i++) {
        memorySystem.recordLocationExperience(`mediocre_${i}`, 50, {});
      }
      
      // Important memory should still exist
      const importantPref = memorySystem.getLocationPreference('important_place');
      
      if (!importantPref) {
        throw new Error('Important high-satisfaction memory should be preserved');
      }
      
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🧠 MemorySystem Test Suite\n');
    
    this.testMemoryCreation();
    this.testLocationMemories();
    this.testAgentMemories();
    this.testEventMemories();
    this.testMemoryInfluenceOnBehavior();
    this.testMemoryCapacityAndMaintenance();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 MemorySystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All memory system tests passed! Agent intelligence ready for authentic clubber behavior.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new MemorySystemTestSuite();
  suite.runAllTests();
}

export default MemorySystemTestSuite;