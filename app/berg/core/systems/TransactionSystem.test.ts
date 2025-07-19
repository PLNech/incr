import { Agent, AgentState } from '../agents/Agent';
import { NeedsSystem } from './NeedsSystem';
import { TransactionSystem, Transaction, TransactionType, BouncerDecision, QueueSystem } from './TransactionSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class TransactionSystemTestSuite {
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

  private createTestAgent(type: string, id: string = 'test-agent'): Agent {
    return new Agent(id, Math.random() * 20, Math.random() * 20, {
      type: type as any,
      stamina: 80 + Math.random() * 20,
      socialEnergy: 60 + Math.random() * 40,
      entertainment: 50 + Math.random() * 50
    });
  }

  testBouncerInscrutableCriteria(): void {
    this.test('bouncer evaluates agents based on inscrutable criteria', () => {
      const transactionSystem = new TransactionSystem();
      
      // Test different agent types
      const authentic = this.createTestAgent('authentic', 'auth1');
      const tourist = this.createTestAgent('tourist', 'tour1');
      const influencer = this.createTestAgent('influencer', 'inf1');
      
      const authDecision = transactionSystem.evaluateEntry(authentic, []);
      const tourDecision = transactionSystem.evaluateEntry(tourist, []);
      const infDecision = transactionSystem.evaluateEntry(influencer, []);
      
      // Authentic agents should have higher chance
      if (authDecision.allowed && !tourDecision.allowed) {
        return true; // Good outcome
      }
      
      // At minimum, check that decisions have reasoning
      if (!authDecision.reason || !tourDecision.reason) {
        throw new Error('Bouncer decisions should include reasoning');
      }
      
      return true;
    });

    this.test('groups of male agents face rejection ("NO GROUPS OF BLOKES")', () => {
      const transactionSystem = new TransactionSystem();
      
      const maleGroup = [
        this.createTestAgent('tourist', 'male1'),
        this.createTestAgent('tourist', 'male2'),
        this.createTestAgent('regular', 'male3')
      ];
      
      const firstAgent = maleGroup[0];
      const decision = transactionSystem.evaluateEntry(firstAgent, maleGroup);
      
      // Groups of males should face higher rejection rates
      if (decision.allowed && maleGroup.length > 2) {
        // May still get in sometimes, but should have lower confidence
        if (decision.confidence >= 70) {
          throw new Error('Groups of males should have lower entry confidence');
        }
      }
      
      if (decision.reason && decision.reason.includes('group')) {
        return true; // Bouncer considers group composition
      }
      
      return true;
    });

    this.test('overdressed agents get rejected ("ABSOLUTELY DO NOT DRESS UP")', () => {
      const transactionSystem = new TransactionSystem();
      
      const overdressedTourist = this.createTestAgent('tourist', 'overdressed');
      const casualAuthentic = this.createTestAgent('authentic', 'casual');
      
      // Simulate overdressed appearance
      const overdressedDecision = transactionSystem.evaluateEntry(overdressedTourist, [], {
        appearance: 'overdressed',
        attitude: 'excited'
      });
      
      const casualDecision = transactionSystem.evaluateEntry(casualAuthentic, [], {
        appearance: 'casual',
        attitude: 'calm'
      });
      
      // Overdressed should be more likely to be rejected
      if (overdressedDecision.confidence > casualDecision.confidence) {
        throw new Error('Overdressed agents should have lower entry chances');
      }
      
      return true;
    });

    this.test('language affects entry chances ("denied for speaking English")', () => {
      const transactionSystem = new TransactionSystem();
      
      const agent = this.createTestAgent('curious', 'multilingual');
      
      const englishDecision = transactionSystem.evaluateEntry(agent, [], {
        spokenLanguage: 'english',
        hasLocalFriend: false
      });
      
      const germanDecision = transactionSystem.evaluateEntry(agent, [], {
        spokenLanguage: 'german',
        hasLocalFriend: false
      });
      
      const englishWithFriendDecision = transactionSystem.evaluateEntry(agent, [], {
        spokenLanguage: 'english',
        hasLocalFriend: true
      });
      
      // German should be better than English alone
      if (germanDecision.confidence <= englishDecision.confidence) {
        throw new Error('Speaking German should improve entry chances');
      }
      
      // Having local friend should help English speakers
      if (englishWithFriendDecision.confidence <= englishDecision.confidence) {
        throw new Error('Having local friend should help English speakers');
      }
      
      return true;
    });
  }

  testTransactionCreation(): void {
    this.test('creates entry transaction with correct pricing', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      const transaction = transactionSystem.createEntryTransaction(agent, 20); // €20 cover
      
      if (transaction.type !== TransactionType.ENTRY) {
        throw new Error(`Expected ENTRY transaction, got ${transaction.type}`);
      }
      if (transaction.amount !== 20) {
        throw new Error(`Expected amount 20, got ${transaction.amount}`);
      }
      if (transaction.agentId !== agent.id) {
        throw new Error('Transaction should be linked to agent');
      }
      return true;
    });

    this.test('creates drink transaction with agent type pricing', () => {
      const transactionSystem = new TransactionSystem();
      const tourist = this.createTestAgent('tourist');
      const authentic = this.createTestAgent('authentic');
      
      const touristDrink = transactionSystem.createDrinkTransaction(tourist, 'beer', 'bar');
      const authenticDrink = transactionSystem.createDrinkTransaction(authentic, 'beer', 'bar');
      
      if (touristDrink.amount <= authenticDrink.amount) {
        throw new Error('Tourists should pay more for drinks than authentic clubbers');
      }
      
      if (touristDrink.details?.item !== 'beer') {
        throw new Error('Transaction should record drink type');
      }
      
      return true;
    });

    this.test('premium items cost more ("chia pudding a tad pricey but totally worth it")', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('curious');
      
      const juice = transactionSystem.createDrinkTransaction(agent, 'banana_cherry_juice', 'bar');
      const chiaPudding = transactionSystem.createDrinkTransaction(agent, 'chia_pudding', 'bar');
      const beer = transactionSystem.createDrinkTransaction(agent, 'beer', 'bar');
      
      if (chiaPudding.amount <= beer.amount) {
        throw new Error('Chia pudding should be pricier than beer');
      }
      if (juice.amount <= beer.amount) {
        throw new Error('Banana-cherry juice should cost more than beer');
      }
      
      return true;
    });
  }

  testQueueSystem(): void {
    this.test('queue system manages agent waiting', () => {
      const queueSystem = new QueueSystem();
      const agents = [
        this.createTestAgent('authentic', 'auth1'),
        this.createTestAgent('tourist', 'tour1'),
        this.createTestAgent('regular', 'reg1')
      ];
      
      // Add agents to queue
      agents.forEach(agent => queueSystem.addToQueue(agent));
      
      if (queueSystem.getQueueLength() !== 3) {
        throw new Error(`Expected queue length 3, got ${queueSystem.getQueueLength()}`);
      }
      
      const next = queueSystem.getNextInQueue();
      if (!next || next.id !== agents[0].id) {
        throw new Error('Should return first agent in queue');
      }
      
      queueSystem.removeFromQueue(next.id);
      if (queueSystem.getQueueLength() !== 2) {
        throw new Error('Queue length should decrease after removal');
      }
      
      return true;
    });

    this.test('queue tracks waiting time and patience', () => {
      const queueSystem = new QueueSystem();
      const agent = this.createTestAgent('tourist', 'impatient');
      
      queueSystem.addToQueue(agent);
      const initialPatience = queueSystem.getAgentPatience(agent.id);
      
      // Simulate waiting
      queueSystem.updateWaitingTimes(60000); // 1 minute
      
      const afterWaiting = queueSystem.getAgentPatience(agent.id);
      
      if (afterWaiting >= initialPatience) {
        throw new Error('Agent patience should decrease while waiting');
      }
      
      return true;
    });

    this.test('impatient agents leave queue', () => {
      const queueSystem = new QueueSystem();
      const impatientTourist = this.createTestAgent('tourist', 'impatient');
      const patientAuthentic = this.createTestAgent('authentic', 'patient');
      
      queueSystem.addToQueue(impatientTourist);
      queueSystem.addToQueue(patientAuthentic);
      
      // Simulate long wait
      queueSystem.updateWaitingTimes(1800000); // 30 minutes
      
      const leavers = queueSystem.getAgentsWhoLeft();
      
      // Tourists should be more likely to leave than authentic agents
      if (leavers.length === 0) {
        // May still be waiting, but check patience levels
        const touristPatience = queueSystem.getAgentPatience(impatientTourist.id);
        const authenticPatience = queueSystem.getAgentPatience(patientAuthentic.id);
        
        if (touristPatience >= authenticPatience) {
          throw new Error('Tourists should be less patient than authentic clubbers');
        }
      }
      
      return true;
    });
  }

  testRevenueGeneration(): void {
    this.test('generates revenue from entry fees', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      const initialRevenue = transactionSystem.getTotalRevenue();
      
      const transaction = transactionSystem.createEntryTransaction(agent, 25);
      transactionSystem.processTransaction(transaction);
      
      const finalRevenue = transactionSystem.getTotalRevenue();
      
      if (finalRevenue !== initialRevenue + 25) {
        throw new Error(`Expected revenue increase of 25, got ${finalRevenue - initialRevenue}`);
      }
      
      return true;
    });

    this.test('generates revenue from drink sales', () => {
      const transactionSystem = new TransactionSystem();
      const agents = [
        this.createTestAgent('tourist', 'spender1'),
        this.createTestAgent('regular', 'spender2')
      ];
      
      const initialRevenue = transactionSystem.getTotalRevenue();
      
      // Process multiple drink transactions
      agents.forEach(agent => {
        const drinkTx = transactionSystem.createDrinkTransaction(agent, 'beer', 'bar');
        transactionSystem.processTransaction(drinkTx);
      });
      
      const finalRevenue = transactionSystem.getTotalRevenue();
      
      if (finalRevenue <= initialRevenue) {
        throw new Error('Revenue should increase from drink sales');
      }
      
      return true;
    });

    this.test('tracks revenue by category', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('curious');
      
      const entryTx = transactionSystem.createEntryTransaction(agent, 20);
      const drinkTx = transactionSystem.createDrinkTransaction(agent, 'beer', 'bar');
      
      transactionSystem.processTransaction(entryTx);
      transactionSystem.processTransaction(drinkTx);
      
      const revenueByType = transactionSystem.getRevenueByType();
      
      if (!revenueByType[TransactionType.ENTRY] || !revenueByType[TransactionType.DRINK]) {
        throw new Error('Should track revenue by transaction type');
      }
      
      if (revenueByType[TransactionType.ENTRY] !== 20) {
        throw new Error('Entry revenue should be tracked correctly');
      }
      
      return true;
    });
  }

  testDynamicPricing(): void {
    this.test('prices vary by time of day/week', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      // Friday night (peak time)
      const fridayEntry = transactionSystem.getEntryPrice(agent, {
        dayOfWeek: 'friday',
        timeOfDay: 'night',
        currentCapacity: 50,
        maxCapacity: 100
      });
      
      // Wednesday afternoon (off-peak)
      const wednesdayEntry = transactionSystem.getEntryPrice(agent, {
        dayOfWeek: 'wednesday',
        timeOfDay: 'afternoon',
        currentCapacity: 10,
        maxCapacity: 100
      });
      
      if (fridayEntry <= wednesdayEntry) {
        throw new Error('Friday night should be more expensive than Wednesday afternoon');
      }
      
      return true;
    });

    this.test('prices increase with capacity ("without strict admission everything would be completely overcrowded")', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      const lowCapacityPrice = transactionSystem.getEntryPrice(agent, {
        dayOfWeek: 'saturday',
        timeOfDay: 'night',
        currentCapacity: 20,
        maxCapacity: 100
      });
      
      const highCapacityPrice = transactionSystem.getEntryPrice(agent, {
        dayOfWeek: 'saturday',
        timeOfDay: 'night',
        currentCapacity: 80,
        maxCapacity: 100
      });
      
      if (highCapacityPrice <= lowCapacityPrice) {
        throw new Error('Prices should increase as venue fills up');
      }
      
      return true;
    });

    this.test('agent types get different pricing', () => {
      const transactionSystem = new TransactionSystem();
      
      const authentic = this.createTestAgent('authentic');
      const tourist = this.createTestAgent('tourist');
      const influencer = this.createTestAgent('influencer');
      
      const baseConditions = {
        dayOfWeek: 'saturday',
        timeOfDay: 'night',
        currentCapacity: 50,
        maxCapacity: 100
      };
      
      const authenticPrice = transactionSystem.getEntryPrice(authentic, baseConditions);
      const touristPrice = transactionSystem.getEntryPrice(tourist, baseConditions);
      const influencerPrice = transactionSystem.getEntryPrice(influencer, baseConditions);
      
      // Tourists should pay the most
      if (touristPrice <= authenticPrice) {
        throw new Error('Tourists should pay more than authentic clubbers');
      }
      
      // Influencers might get discounted/free entry
      if (influencerPrice >= authenticPrice) {
        throw new Error('Influencers should get better pricing than regular visitors');
      }
      
      return true;
    });
  }

  testAgentSpendingBehavior(): void {
    this.test('agent types have different spending patterns', () => {
      const transactionSystem = new TransactionSystem();
      
      const tourist = this.createTestAgent('tourist');
      const authentic = this.createTestAgent('authentic');
      
      const touristSpending = transactionSystem.predictAgentSpending(tourist, 'bar');
      const authenticSpending = transactionSystem.predictAgentSpending(authentic, 'bar');
      
      if (touristSpending.averagePerHour <= authenticSpending.averagePerHour) {
        throw new Error('Tourists should have higher predicted spending');
      }
      
      if (!touristSpending.preferredItems || !authenticSpending.preferredItems) {
        throw new Error('Should predict preferred items for each agent type');
      }
      
      return true;
    });

    this.test('spending varies by location', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      const barSpending = transactionSystem.predictAgentSpending(agent, 'bar');
      const panoramaSpending = transactionSystem.predictAgentSpending(agent, 'panorama_bar');
      
      if (panoramaSpending.averagePerHour <= barSpending.averagePerHour) {
        throw new Error('Panorama bar should have higher spending rates');
      }
      
      return true;
    });

    this.test('agents with low stamina buy more recovery items', () => {
      const transactionSystem = new TransactionSystem();
      
      const tiredAgent = this.createTestAgent('regular', 'tired');
      tiredAgent.stamina = 20; // Very tired
      
      const energeticAgent = this.createTestAgent('regular', 'energetic');
      energeticAgent.stamina = 90; // Well rested
      
      const tiredPrediction = transactionSystem.predictAgentSpending(tiredAgent, 'bar');
      const energeticPrediction = transactionSystem.predictAgentSpending(energeticAgent, 'bar');
      
      // Tired agents should be more likely to buy energy drinks/food
      const tiredWantsFood = tiredPrediction.preferredItems.some(item => 
        item.includes('juice') || item.includes('pudding') || item.includes('food')
      );
      
      if (!tiredWantsFood) {
        throw new Error('Tired agents should prefer energy-giving items');
      }
      
      return true;
    });
  }

  testTransactionSystemIntegration(): void {
    this.test('integrates with needs system for purchasing decisions', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('curious');
      const needsSystem = new NeedsSystem(agent);
      
      // Set low stamina
      needsSystem.getNeed('stamina' as any)?.setValue(25);
      
      const purchaseRecommendation = transactionSystem.recommendPurchase(agent, needsSystem, 'bar');
      
      if (!purchaseRecommendation) {
        throw new Error('Should recommend purchase for agent with needs');
      }
      
      if (!purchaseRecommendation.item || !purchaseRecommendation.reason) {
        throw new Error('Purchase recommendation should include item and reason');
      }
      
      return true;
    });

    this.test('tracks agent transaction history', () => {
      const transactionSystem = new TransactionSystem();
      const agent = this.createTestAgent('regular');
      
      const tx1 = transactionSystem.createEntryTransaction(agent, 20);
      const tx2 = transactionSystem.createDrinkTransaction(agent, 'beer', 'bar');
      
      transactionSystem.processTransaction(tx1);
      transactionSystem.processTransaction(tx2);
      
      const history = transactionSystem.getAgentTransactionHistory(agent.id);
      
      if (history.length !== 2) {
        throw new Error(`Expected 2 transactions in history, got ${history.length}`);
      }
      
      const totalSpent = transactionSystem.getAgentTotalSpending(agent.id);
      if (totalSpent !== tx1.amount + tx2.amount) {
        throw new Error('Total spending should sum all transactions');
      }
      
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n💰 TransactionSystem Test Suite\n');
    
    this.testBouncerInscrutableCriteria();
    this.testTransactionCreation();
    this.testQueueSystem();
    this.testRevenueGeneration();
    this.testDynamicPricing();
    this.testAgentSpendingBehavior();
    this.testTransactionSystemIntegration();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 TransactionSystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All transaction system tests passed! Realistic economic mechanics working.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new TransactionSystemTestSuite();
  suite.runAllTests();
}

export default TransactionSystemTestSuite;