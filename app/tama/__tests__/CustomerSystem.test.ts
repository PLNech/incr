import { CustomerSystem } from '../systems/CustomerSystem';
import { createMockGameState, createMockTama, mockTamaEntity, advanceTime, resetTime } from './setup';

describe('CustomerSystem', () => {
  let customerSystem: CustomerSystem;
  let gameState: ReturnType<typeof createMockGameState>;

  beforeEach(() => {
    gameState = createMockGameState();
    customerSystem = new CustomerSystem();
    resetTime();
  });

  afterEach(() => {
    resetTime();
  });

  describe('Customer Generation', () => {
    it('should create a population pool at game start', () => {
      const customers = customerSystem.generateInitialPopulation(10);

      expect(customers.length).toBe(10);
      customers.forEach(customer => {
        expect(customer.id).toBeDefined();
        expect(customer.name).toBeDefined();
        expect(customer.archetype).toMatch(/casual|demanding|wealthy|collector|breeder/);
        expect(customer.patience).toBeGreaterThanOrEqual(1);
        expect(customer.patience).toBeLessThanOrEqual(10);
        expect(customer.paymentMultiplier).toBeGreaterThan(0);
        expect(customer.reputation).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate customers with different archetypes', () => {
      const customers = customerSystem.generateInitialPopulation(50);
      const archetypes = customers.map(c => c.archetype);
      const uniqueArchetypes = new Set(archetypes);

      expect(uniqueArchetypes.size).toBeGreaterThan(1); // Should have variety
    });

    it('should create customers with preferences matching their archetype', () => {
      const wealthyCustomers = customerSystem.generateInitialPopulation(20)
        .filter(c => c.archetype === 'wealthy');

      wealthyCustomers.forEach(customer => {
        expect(customer.paymentMultiplier).toBeGreaterThan(1.5); // Wealthy pay more
      });
    });
  });

  describe('Contract Generation', () => {
    it('should generate contracts from customer preferences', () => {
      gameState.customers = customerSystem.generateInitialPopulation(5);
      const customer = gameState.customers[0];

      const contract = customerSystem.generateContract(customer, gameState);

      expect(contract.id).toBeDefined();
      expect(contract.customerId).toBe(customer.id);
      expect(contract.requirements.duration).toBeGreaterThan(0);
      expect(contract.requirements.careLevel).toBeGreaterThanOrEqual(1);
      expect(contract.requirements.careLevel).toBeLessThanOrEqual(10);
      expect(contract.payment.baseAmount).toBeGreaterThan(0);
      expect(contract.status).toBe('pending');
    });

    it('should scale contract difficulty with progression level', () => {
      gameState.customers = customerSystem.generateInitialPopulation(5);

      // Test multiple contracts to account for randomness
      const level1Contracts = [];
      const level5Contracts = [];

      gameState.progression.level = 1;
      for (let i = 0; i < 10; i++) {
        level1Contracts.push(customerSystem.generateContract(gameState.customers[0], gameState));
      }

      gameState.progression.level = 5;
      for (let i = 0; i < 10; i++) {
        level5Contracts.push(customerSystem.generateContract(gameState.customers[0], gameState));
      }

      // Care level should always be higher at level 5
      const avgLevel1Care = level1Contracts.reduce((sum, c) => sum + c.requirements.careLevel, 0) / level1Contracts.length;
      const avgLevel5Care = level5Contracts.reduce((sum, c) => sum + c.requirements.careLevel, 0) / level5Contracts.length;

      expect(avgLevel5Care).toBeGreaterThan(avgLevel1Care);

      // Payment should generally be higher at level 5 (average across multiple contracts)
      const avgLevel1Payment = level1Contracts.reduce((sum, c) => sum + c.payment.baseAmount, 0) / level1Contracts.length;
      const avgLevel5Payment = level5Contracts.reduce((sum, c) => sum + c.payment.baseAmount, 0) / level5Contracts.length;

      expect(avgLevel5Payment).toBeGreaterThan(avgLevel1Payment);
    });

    it('should apply customer payment multipliers', () => {
      const customer = customerSystem.generateInitialPopulation(1)[0];
      customer.paymentMultiplier = 2.0;
      gameState.customers = [customer];

      const contract = customerSystem.generateContract(customer, gameState);

      expect(contract.payment.baseAmount).toBeGreaterThan(50); // Base * multiplier
    });

    it('should include bonus conditions for extra payment', () => {
      gameState.customers = customerSystem.generateInitialPopulation(5);
      const contract = customerSystem.generateContract(gameState.customers[0], gameState);

      expect(contract.payment.bonuses).toBeDefined();
      expect(contract.payment.bonuses.length).toBeGreaterThan(0);
    });
  });

  describe('Contract Assignment', () => {
    it('should assign suitable Tamas to contracts', () => {
      gameState.customers = customerSystem.generateInitialPopulation(3);
      gameState.tamas = [createMockTama()];
      const contract = customerSystem.generateContract(gameState.customers[0], gameState);
      gameState.activeContracts = [contract];

      const result = customerSystem.assignTamaToContract(contract.id, gameState.tamas[0].id, gameState);

      expect(result.success).toBe(true);
      expect(contract.tamaId).toBe(gameState.tamas[0].id);
      expect(contract.status).toBe('active');
      expect(contract.startTime).toBeDefined();
      expect(contract.endTime).toBeDefined();
    });

    it('should reject assignment if Tama is not ready for job', () => {
      gameState.customers = customerSystem.generateInitialPopulation(3);
      const tiredTama = { ...mockTamaEntity };
      tiredTama.needs.energy = 10; // Too tired
      gameState.tamas = [tiredTama];

      const contract = customerSystem.generateContract(gameState.customers[0], gameState);
      gameState.activeContracts = [contract];

      const result = customerSystem.assignTamaToContract(contract.id, tiredTama.id, gameState);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not ready');
      expect(contract.status).toBe('pending');
    });

    it('should prevent assigning same Tama to multiple contracts', () => {
      // Fresh setup for this test
      const freshGameState = createMockGameState();
      freshGameState.customers = customerSystem.generateInitialPopulation(3);
      freshGameState.tamas = [createMockTama()];

      const contract1 = customerSystem.generateContract(freshGameState.customers[0], freshGameState);
      const contract2 = customerSystem.generateContract(freshGameState.customers[1], freshGameState);

      freshGameState.activeContracts = [contract1, contract2];

      const result1 = customerSystem.assignTamaToContract(contract1.id, freshGameState.tamas[0].id, freshGameState);
      expect(result1.success).toBe(true); // First assignment should succeed
      expect(contract1.status).toBe('active');

      const result2 = customerSystem.assignTamaToContract(contract2.id, freshGameState.tamas[0].id, freshGameState);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('busy');
    });
  });

  describe('Contract Processing', () => {
    it('should complete contracts when time elapsed', () => {
      const freshGameState = createMockGameState();
      freshGameState.customers = customerSystem.generateInitialPopulation(3);
      freshGameState.tamas = [createMockTama()];

      const contract = customerSystem.generateContract(freshGameState.customers[0], freshGameState);
      contract.requirements.duration = 5000; // 5 seconds
      freshGameState.activeContracts = [contract];

      // Assign tama first
      const assignResult = customerSystem.assignTamaToContract(contract.id, freshGameState.tamas[0].id, freshGameState);
      expect(assignResult.success).toBe(true); // Verify assignment succeeded

      // Verify assignment worked
      expect(contract.status).toBe('active');
      expect(contract.tamaId).toBe(freshGameState.tamas[0].id);

      // Fast forward time
      advanceTime(6000);

      const results = customerSystem.processContracts(freshGameState);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].payment).toBeGreaterThan(0);
      expect(contract.status).toBe('completed');
    });

    it('should fail contracts if Tama care level is insufficient', () => {
      const freshGameState = createMockGameState();
      freshGameState.customers = customerSystem.generateInitialPopulation(3);
      const badTama = createMockTama();
      badTama.needs.happiness = 35; // Just barely ready for work
      badTama.needs.hunger = 35; // Just barely ready for work
      freshGameState.tamas = [badTama];

      const contract = customerSystem.generateContract(freshGameState.customers[0], freshGameState);
      contract.requirements.careLevel = 8; // High care requirement
      contract.requirements.duration = 1000;
      freshGameState.activeContracts = [contract];

      const assignResult = customerSystem.assignTamaToContract(contract.id, badTama.id, freshGameState);
      expect(assignResult.success).toBe(true); // Assignment should succeed even with bad care

      advanceTime(2000);

      const results = customerSystem.processContracts(freshGameState);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(false);
      expect(contract.status).toBe('failed');
    });

    it('should calculate bonuses based on conditions', () => {
      const freshGameState = createMockGameState();
      freshGameState.customers = customerSystem.generateInitialPopulation(3);
      const excellentTama = createMockTama();
      excellentTama.tier = 2; // High tier
      excellentTama.needs.happiness = 100;
      freshGameState.tamas = [excellentTama];

      const contract = customerSystem.generateContract(freshGameState.customers[0], freshGameState);
      contract.payment.bonuses = [
        { condition: 'high_tier', amount: 50 },
        { condition: 'perfect_happiness', amount: 30 }
      ];
      contract.requirements.duration = 1000;
      freshGameState.activeContracts = [contract];

      const assignResult = customerSystem.assignTamaToContract(contract.id, excellentTama.id, freshGameState);
      expect(assignResult.success).toBe(true);

      advanceTime(2000);

      const results = customerSystem.processContracts(freshGameState);
      const totalPayment = contract.payment.baseAmount + 50 + 30; // Base + bonuses

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].payment).toBe(totalPayment);
    });
  });

  describe('Customer Rotation', () => {
    it('should handle monthly customer rotation', () => {
      gameState.customers = customerSystem.generateInitialPopulation(10);
      const originalIds = gameState.customers.map(c => c.id);

      // Simulate monthly rotation
      customerSystem.performMonthlyRotation(gameState);

      const newIds = gameState.customers.map(c => c.id);
      const changedCustomers = newIds.filter(id => !originalIds.includes(id));

      expect(changedCustomers.length).toBeGreaterThan(0); // Some customers changed
      expect(gameState.customers.length).toBe(10); // Same total count
    });

    it('should retain high-reputation customers longer', () => {
      const loyalCustomer = customerSystem.generateInitialPopulation(1)[0];
      loyalCustomer.reputation = 100;
      loyalCustomer.id = 'loyal-customer';

      // Test multiple runs to account for randomness
      let retentionCount = 0;
      const testRuns = 20;

      for (let run = 0; run < testRuns; run++) {
        const testGameState = createMockGameState();
        const testCustomer = { ...loyalCustomer };
        testGameState.customers = [testCustomer];

        // Single rotation
        customerSystem.performMonthlyRotation(testGameState);

        const stillHasLoyal = testGameState.customers.some(c => c.id === 'loyal-customer');
        if (stillHasLoyal) retentionCount++;
      }

      // High reputation customer should be retained most of the time (>80%)
      expect(retentionCount / testRuns).toBeGreaterThan(0.8);
    });

    it('should remove low-reputation customers faster', () => {
      const badCustomer = customerSystem.generateInitialPopulation(1)[0];
      badCustomer.reputation = -50;
      badCustomer.id = 'bad-customer';

      gameState.customers = [badCustomer, ...customerSystem.generateInitialPopulation(9)];

      customerSystem.performMonthlyRotation(gameState);

      const stillHasBad = gameState.customers.some(c => c.id === 'bad-customer');
      expect(stillHasBad).toBe(false); // Low reputation customer was removed
    });
  });

  describe('Reputation System', () => {
    it('should increase customer reputation on successful contracts', () => {
      gameState.customers = customerSystem.generateInitialPopulation(3);
      const customer = gameState.customers[0];
      const initialReputation = customer.reputation;

      customerSystem.updateCustomerReputation(customer.id, true, gameState);

      expect(customer.reputation).toBeGreaterThan(initialReputation);
    });

    it('should decrease customer reputation on failed contracts', () => {
      gameState.customers = customerSystem.generateInitialPopulation(3);
      const customer = gameState.customers[0];
      const initialReputation = customer.reputation;

      customerSystem.updateCustomerReputation(customer.id, false, gameState);

      expect(customer.reputation).toBeLessThan(initialReputation);
    });

    it('should affect future contract generation based on reputation', () => {
      gameState.customers = customerSystem.generateInitialPopulation(3);
      const customer = gameState.customers[0];

      // Build high reputation
      for (let i = 0; i < 5; i++) {
        customerSystem.updateCustomerReputation(customer.id, true, gameState);
      }

      const highRepContract = customerSystem.generateContract(customer, gameState);

      // Reset and build low reputation
      customer.reputation = 0;
      for (let i = 0; i < 3; i++) {
        customerSystem.updateCustomerReputation(customer.id, false, gameState);
      }

      const lowRepContract = customerSystem.generateContract(customer, gameState);

      expect(highRepContract.payment.baseAmount).toBeGreaterThan(lowRepContract.payment.baseAmount);
    });
  });
});