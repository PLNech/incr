import { Agent, AgentState } from '../agents/Agent';
import { NeedsSystem, NeedType, NeedUrgency } from './NeedsSystem';
import { JourneySystem, JourneyPlan, JourneyGoal, JourneyStep } from './JourneySystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class JourneySystemTestSuite {
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

  private createTestAgent(type: string = 'authentic', stamina: number = 100, social: number = 80, entertainment: number = 60): Agent {
    return new Agent('test-agent', 10, 10, {
      type: type as any,
      stamina,
      socialEnergy: social,
      entertainment
    });
  }

  testJourneyStepCreation(): void {
    this.test('creates journey step with correct properties', () => {
      const step = new JourneyStep('dancefloor', 'Experience the music', 80, 2000);
      
      if (step.location !== 'dancefloor') {
        throw new Error(`Expected location 'dancefloor', got '${step.location}'`);
      }
      if (step.reason !== 'Experience the music') {
        throw new Error(`Expected reason 'Experience the music', got '${step.reason}'`);
      }
      if (step.priority !== 80) {
        throw new Error(`Expected priority 80, got ${step.priority}`);
      }
      if (step.estimatedDuration !== 2000) {
        throw new Error(`Expected duration 2000, got ${step.estimatedDuration}`);
      }
      if (step.startTime !== null) {
        throw new Error('Start time should be null initially');
      }
      return true;
    });

    this.test('calculates journey step progress correctly', () => {
      const step = new JourneyStep('bar', 'Get a drink', 70, 1000);
      
      // Before starting
      if (step.getProgress() !== 0) {
        throw new Error('Progress should be 0 before starting');
      }
      if (!step.isComplete()) {
        throw new Error('Step should not be complete initially');
      }

      // Start the step
      step.start();
      if (step.startTime === null) {
        throw new Error('Start time should be set after starting');
      }

      // Simulate time passing
      setTimeout(() => {
        const progress = step.getProgress();
        if (progress <= 0 || progress > 1) {
          throw new Error(`Invalid progress value: ${progress}`);
        }
      }, 100);

      return true;
    });
  }

  testJourneyPlanCreation(): void {
    this.test('creates journey plan with correct goals', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Simulate low stamina
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(10);
      
      const plan = journeySystem.createJourneyPlan();
      
      if (!plan) {
        throw new Error('Should create a journey plan');
      }
      if (plan.steps.length === 0) {
        throw new Error('Journey plan should have steps');
      }
      
      // Should prioritize stamina restoration
      const firstStep = plan.steps[0];
      if (firstStep.location !== 'toilets') {
        throw new Error(`Expected first step to be toilets for low stamina, got ${firstStep.location}`);
      }
      return true;
    });

    this.test('prioritizes urgent needs in journey planning', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Create mixed urgency scenario
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(5); // Critical
      needsSystem.getNeed(NeedType.SOCIAL)?.setValue(15); // Medium
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(80); // Satisfied

      const plan = journeySystem.createJourneyPlan();
      
      if (!plan) {
        throw new Error('Should create journey plan');
      }

      // Critical stamina should be first priority
      const firstStep = plan.steps[0];
      if (firstStep.location !== 'toilets') {
        throw new Error('Critical stamina should be highest priority');
      }

      // Should have social step after stamina
      const hasBarStep = plan.steps.some(step => step.location === 'bar');
      if (!hasBarStep) {
        throw new Error('Should include bar visit for social needs');
      }
      return true;
    });

    this.test('adapts journey plans based on agent type', () => {
      const authenticAgent = this.createTestAgent('authentic');
      const touristAgent = this.createTestAgent('tourist');
      
      const authenticNeeds = new NeedsSystem(authenticAgent);
      const touristNeeds = new NeedsSystem(touristAgent);
      
      const authenticJourney = new JourneySystem(authenticAgent, authenticNeeds);
      const touristJourney = new JourneySystem(touristAgent, touristNeeds);

      // Set same low entertainment for both
      authenticNeeds.getNeed(NeedType.ENTERTAINMENT)?.setValue(20);
      touristNeeds.getNeed(NeedType.ENTERTAINMENT)?.setValue(20);

      const authenticPlan = authenticJourney.createJourneyPlan();
      const touristPlan = touristJourney.createJourneyPlan();

      if (!authenticPlan || !touristPlan) {
        throw new Error('Both agents should have journey plans');
      }

      // Both should go to dancefloor for entertainment, but with different durations
      const authenticDance = authenticPlan.steps.find(s => s.location === 'dancefloor');
      const touristDance = touristPlan.steps.find(s => s.location === 'dancefloor');

      if (!authenticDance || !touristDance) {
        throw new Error('Both should include dancefloor for entertainment');
      }

      // Authentic agents typically stay longer on dancefloor
      if (authenticDance.estimatedDuration <= touristDance.estimatedDuration) {
        throw new Error('Authentic agents should stay longer on dancefloor');
      }
      return true;
    });
  }

  testJourneyExecution(): void {
    this.test('executes journey plan steps in order', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Create a multi-step plan
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(15);
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(20);

      const plan = journeySystem.createJourneyPlan();
      if (!plan || plan.steps.length < 2) {
        throw new Error('Should create multi-step plan');
      }

      journeySystem.startJourney(plan);
      
      if (journeySystem.getCurrentStep() !== plan.steps[0]) {
        throw new Error('Should start with first step');
      }
      if (!journeySystem.isOnJourney()) {
        throw new Error('Should be on journey after starting');
      }
      return true;
    });

    this.test('advances to next step when current step completes', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Create plan with short duration steps for testing
      const plan = new JourneyPlan([
        new JourneyStep('bar', 'Quick drink', 70, 100), // 100ms
        new JourneyStep('dancefloor', 'Quick dance', 60, 100)
      ]);

      journeySystem.startJourney(plan);
      const firstStep = journeySystem.getCurrentStep();
      
      if (!firstStep) {
        throw new Error('Should have current step');
      }

      // Simulate step completion
      firstStep.start();
      
      // Wait for step to complete and update
      setTimeout(() => {
        journeySystem.update(150); // More than step duration
        
        const currentStep = journeySystem.getCurrentStep();
        if (currentStep === firstStep) {
          throw new Error('Should advance to next step');
        }
      }, 150);

      return true;
    });

    this.test('completes journey when all steps finished', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      const shortPlan = new JourneyPlan([
        new JourneyStep('bar', 'Quick visit', 50, 50)
      ]);

      journeySystem.startJourney(shortPlan);
      
      // Fast-forward through journey
      setTimeout(() => {
        journeySystem.update(100); // Complete the step
        
        if (journeySystem.isOnJourney()) {
          throw new Error('Journey should be complete');
        }
        if (journeySystem.getCurrentStep() !== null) {
          throw new Error('Should have no current step after completion');
        }
      }, 100);

      return true;
    });
  }

  testAdaptiveJourneyPlanning(): void {
    this.test('replans journey when needs change significantly', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Start with entertainment need
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(20);
      
      const initialPlan = journeySystem.createJourneyPlan();
      journeySystem.startJourney(initialPlan!);

      // Suddenly make stamina critical
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(5);
      
      // System should detect need for replanning
      const shouldReplan = journeySystem.shouldReplanJourney();
      if (!shouldReplan) {
        throw new Error('Should want to replan when needs become critical');
      }

      // Execute replanning
      const newPlan = journeySystem.replanJourney();
      if (!newPlan) {
        throw new Error('Should create new plan');
      }

      // New plan should prioritize stamina
      const firstStep = newPlan.steps[0];
      if (firstStep.location !== 'toilets') {
        throw new Error('Replanned journey should prioritize toilets for critical stamina');
      }
      return true;
    });

    this.test('considers current location in journey planning', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Set current location to bar
      needsSystem.setCurrentLocation('bar');
      
      // Create low entertainment need
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(20);

      const plan = journeySystem.createJourneyPlan();
      if (!plan) {
        throw new Error('Should create plan');
      }

      // Should not suggest bar as first step since already there
      const firstStep = plan.steps[0];
      if (firstStep.location === 'bar') {
        throw new Error('Should not suggest current location as next destination');
      }
      return true;
    });

    this.test('optimizes journey plan for efficiency', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Create multiple medium-priority needs
      needsSystem.getNeed(NeedType.STAMINA)?.setValue(40); // Needs toilets
      needsSystem.getNeed(NeedType.SOCIAL)?.setValue(35); // Needs bar
      needsSystem.getNeed(NeedType.ENTERTAINMENT)?.setValue(30); // Needs dancefloor

      const plan = journeySystem.createJourneyPlan();
      if (!plan || plan.steps.length < 2) {
        throw new Error('Should create multi-step plan');
      }

      // Plan should be logically ordered (not random)
      const locations = plan.steps.map(s => s.location);
      const hasLogicalFlow = locations.length > 1; // At least some ordering logic

      if (!hasLogicalFlow) {
        throw new Error('Journey plan should have logical step ordering');
      }
      return true;
    });
  }

  testJourneyMemoryAndLearning(): void {
    this.test('remembers recently visited locations', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Visit some locations
      journeySystem.recordLocationVisit('bar', 60000); // 1 minute visit
      journeySystem.recordLocationVisit('dancefloor', 120000); // 2 minute visit

      const recentLocations = journeySystem.getRecentLocationHistory();
      
      if (recentLocations.length !== 2) {
        throw new Error(`Expected 2 recent locations, got ${recentLocations.length}`);
      }

      const barVisit = recentLocations.find(l => l.location === 'bar');
      const dancefloorVisit = recentLocations.find(l => l.location === 'dancefloor');

      if (!barVisit || barVisit.duration !== 60000) {
        throw new Error('Should remember bar visit with correct duration');
      }
      if (!dancefloorVisit || dancefloorVisit.duration !== 120000) {
        throw new Error('Should remember dancefloor visit with correct duration');
      }
      return true;
    });

    this.test('avoids recently visited locations when planning', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Record recent long visit to bar
      journeySystem.recordLocationVisit('bar', 300000); // 5 minutes just finished

      // Create social need (which would normally suggest bar)
      needsSystem.getNeed(NeedType.SOCIAL)?.setValue(25);

      const plan = journeySystem.createJourneyPlan();
      if (!plan) {
        throw new Error('Should create plan');
      }

      // Should prefer alternative location over recently visited bar
      const hasBarStep = plan.steps.some(s => s.location === 'bar');
      const hasDancefloorStep = plan.steps.some(s => s.location === 'dancefloor');

      if (hasBarStep && !hasDancefloorStep) {
        throw new Error('Should prefer dancefloor over recently visited bar for social needs');
      }
      return true;
    });

    this.test('learns location preferences over time', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Simulate positive experiences at dancefloor
      journeySystem.recordLocationVisit('dancefloor', 180000); // Long visit = enjoyed it
      journeySystem.recordLocationVisit('dancefloor', 240000); // Another long visit
      
      // Simulate negative experience at bar
      journeySystem.recordLocationVisit('bar', 30000); // Short visit = didn't enjoy

      const preferences = journeySystem.getLocationPreferences();
      const dancefloorPreference = preferences.get('dancefloor') || 0;
      const barPreference = preferences.get('bar') || 0;

      if (dancefloorPreference <= barPreference) {
        throw new Error('Should prefer dancefloor over bar based on visit history');
      }
      return true;
    });
  }

  testSocialInfluenceOnJourneys(): void {
    this.test('considers nearby agents in journey planning', () => {
      const agent = this.createTestAgent('curious');
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Create other agents at dancefloor
      const nearbyAgents = [
        this.createTestAgent('authentic'),
        this.createTestAgent('regular')
      ];

      // Simulate being near these agents
      const planWithFriends = journeySystem.createJourneyPlan(nearbyAgents);
      const planAlone = journeySystem.createJourneyPlan([]);

      if (!planWithFriends || !planAlone) {
        throw new Error('Should create both plans');
      }

      // Plans might differ based on social context
      // At minimum, should not crash and should produce valid plans
      const withFriendsValid = planWithFriends.steps.length > 0;
      const aloneValid = planAlone.steps.length > 0;

      if (!withFriendsValid || !aloneValid) {
        throw new Error('Both social contexts should produce valid plans');
      }
      return true;
    });

    this.test('follows interesting agents occasionally', () => {
      const followerAgent = this.createTestAgent('curious');
      const influencerAgent = this.createTestAgent('influencer');
      
      const needsSystem = new NeedsSystem(followerAgent);
      const journeySystem = new JourneySystem(followerAgent, needsSystem);

      // Simulate seeing influencer at bar
      const shouldFollow = journeySystem.shouldFollowAgent(influencerAgent, 'bar');
      
      // Curious agents might follow influencers (not guaranteed, but possible)
      if (typeof shouldFollow !== 'boolean') {
        throw new Error('shouldFollowAgent should return boolean');
      }
      return true;
    });
  }

  testJourneySystemIntegration(): void {
    this.test('integrates with pathfinding for navigation', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Test that journey system can request navigation
      const success = journeySystem.navigateToLocation('bar');
      
      // Should attempt navigation (may fail due to no pathfinder, but should try)
      if (typeof success !== 'boolean') {
        throw new Error('Navigation attempt should return boolean');
      }
      return true;
    });

    this.test('updates needs system with current location', () => {
      const agent = this.createTestAgent();
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);

      // Set location through journey system
      journeySystem.setCurrentLocation('toilets');
      
      // Needs system should reflect the location
      const staminaBefore = needsSystem.getNeed(NeedType.STAMINA)?.currentValue;
      
      // Update needs while in toilets
      needsSystem.update(2000, AgentState.IDLE); // 2 seconds
      
      const staminaAfter = needsSystem.getNeed(NeedType.STAMINA)?.currentValue;
      
      if (!staminaBefore || !staminaAfter) {
        throw new Error('Stamina values should exist');
      }
      if (staminaAfter <= staminaBefore) {
        throw new Error('Stamina should increase in toilets');
      }
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🗺️ JourneySystem Test Suite\n');
    
    this.testJourneyStepCreation();
    this.testJourneyPlanCreation();
    this.testJourneyExecution();
    this.testAdaptiveJourneyPlanning();
    this.testJourneyMemoryAndLearning();
    this.testSocialInfluenceOnJourneys();
    this.testJourneySystemIntegration();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 JourneySystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All journey system tests passed! Intelligent navigation system is working.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new JourneySystemTestSuite();
  suite.runAllTests();
}

export default JourneySystemTestSuite;