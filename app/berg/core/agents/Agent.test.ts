import { GridMap, TileType } from '../map/GridMap';
import { PathfindingSystem } from '../map/PathfindingSystem';
import { Agent, AgentState, MovementBehavior } from './Agent';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class AgentTestSuite {
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

  private createTestEnvironment(): { map: GridMap; pathfinder: PathfindingSystem; agent: Agent } {
    const map = new GridMap(20, 20);
    const pathfinder = new PathfindingSystem(map);
    
    // Create a simple club layout
    // Entrance area
    map.setTile(10, 19, TileType.ENTRANCE);
    
    // Bar area
    for (let x = 2; x <= 4; x++) {
      map.setTile(x, 2, TileType.BAR);
    }
    
    // Toilets
    for (let x = 16; x <= 18; x++) {
      map.setTile(x, 2, TileType.TOILET);
    }
    
    // Dancefloor (center area)
    for (let x = 8; x <= 12; x++) {
      for (let y = 8; y <= 12; y++) {
        map.setTile(x, y, TileType.DANCEFLOOR);
      }
    }

    const agent = new Agent('test-agent-1', 10, 19, {
      type: 'authentic',
      movementBehavior: MovementBehavior.ORGANIC,
      stamina: 100,
      socialEnergy: 80,
      entertainment: 60
    });

    return { map, pathfinder, agent };
  }

  testAgentCreation(): void {
    this.test('creates agent with correct initial state', () => {
      const agent = new Agent('test-1', 5, 5, {
        type: 'authentic',
        movementBehavior: MovementBehavior.ORGANIC
      });

      if (agent.id !== 'test-1') {
        throw new Error(`Expected id 'test-1', got '${agent.id}'`);
      }
      if (agent.x !== 5 || agent.y !== 5) {
        throw new Error(`Expected position (5,5), got (${agent.x},${agent.y})`);
      }
      if (agent.state !== AgentState.IDLE) {
        throw new Error(`Expected initial state IDLE, got ${agent.state}`);
      }
      if (agent.type !== 'authentic') {
        throw new Error(`Expected type 'authentic', got '${agent.type}'`);
      }
      return true;
    });

    this.test('applies default values for optional parameters', () => {
      const agent = new Agent('test-2', 0, 0, { type: 'tourist' });

      if (agent.stamina !== 100) {
        throw new Error(`Expected default stamina 100, got ${agent.stamina}`);
      }
      if (agent.socialEnergy !== 50) {
        throw new Error(`Expected default socialEnergy 50, got ${agent.socialEnergy}`);
      }
      if (agent.movementBehavior !== MovementBehavior.ERRATIC) {
        throw new Error(`Expected tourist default to ERRATIC, got ${agent.movementBehavior}`);
      }
      return true;
    });
  }

  testMovementSystem(): void {
    this.test('sets destination and initiates pathfinding', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const success = agent.setDestination(5, 5);
      
      if (!success) {
        throw new Error('setDestination should succeed for valid position');
      }
      if (agent.state !== AgentState.MOVING) {
        throw new Error(`Expected state MOVING, got ${agent.state}`);
      }
      if (!agent.hasDestination()) {
        throw new Error('Agent should have destination');
      }
      return true;
    });

    this.test('rejects invalid destinations', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      // Try to set destination out of bounds
      const success = agent.setDestination(-5, -5);
      
      if (success) {
        throw new Error('setDestination should fail for invalid position');
      }
      if (agent.state !== AgentState.IDLE) {
        throw new Error(`Expected state to remain IDLE, got ${agent.state}`);
      }
      return true;
    });

    this.test('updates position during movement', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const startX = agent.x;
      const startY = agent.y;
      
      // Set destination and update multiple times
      agent.setDestination(5, 5);
      
      // Update several times to allow movement
      for (let i = 0; i < 10; i++) {
        agent.update(16); // 16ms = 60fps
      }

      if (agent.x === startX && agent.y === startY) {
        throw new Error('Agent should have moved from starting position');
      }
      return true;
    });

    this.test('reaches destination and becomes idle', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      // Set very close destination
      const nearX = agent.x + 1;
      const nearY = agent.y;
      
      agent.setDestination(nearX, nearY);
      
      // Update until destination reached
      let iterations = 0;
      while (agent.state === AgentState.MOVING && iterations < 100) {
        agent.update(16);
        iterations++;
      }

      if (agent.state !== AgentState.IDLE) {
        throw new Error(`Expected agent to become IDLE, got ${agent.state}`);
      }
      if (agent.hasDestination()) {
        throw new Error('Agent should not have destination after reaching it');
      }
      
      // Should be close to target
      const distance = Math.sqrt((agent.x - nearX) ** 2 + (agent.y - nearY) ** 2);
      if (distance > 2) {
        throw new Error(`Agent too far from destination: ${distance}`);
      }
      return true;
    });
  }

  testOccupancyManagement(): void {
    this.test('registers and clears occupancy on map', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const gridX = Math.floor(agent.x);
      const gridY = Math.floor(agent.y);

      // Check initial occupancy
      if (!map.isOccupied(gridX, gridY)) {
        throw new Error('Agent should register occupancy at initial position');
      }
      if (map.getOccupant(gridX, gridY) !== agent.id) {
        throw new Error('Map should show agent as occupant');
      }

      // Move agent
      agent.setDestination(5, 5);
      for (let i = 0; i < 20; i++) {
        agent.update(16);
      }

      const newGridX = Math.floor(agent.x);
      const newGridY = Math.floor(agent.y);

      // Old position should be clear (if agent moved)
      if (newGridX !== gridX || newGridY !== gridY) {
        if (map.isOccupied(gridX, gridY)) {
          throw new Error('Agent should clear old position');
        }
      }

      // New position should be occupied
      if (!map.isOccupied(newGridX, newGridY)) {
        throw new Error('Agent should occupy new position');
      }
      return true;
    });
  }

  testBehaviorPatterns(): void {
    this.test('organic movement behavior works', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);
      
      // Organic should prefer slower, more deliberate movement
      const organicSpeed = agent.getMovementSpeed();
      if (organicSpeed > 2.0) {
        throw new Error(`Organic movement should be slow, got speed ${organicSpeed}`);
      }
      return true;
    });

    this.test('erratic movement behavior works', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);
      
      agent.movementBehavior = MovementBehavior.ERRATIC;
      
      const erraticSpeed = agent.getMovementSpeed();
      if (erraticSpeed <= 1.0) {
        throw new Error(`Erratic movement should be faster than organic, got speed ${erraticSpeed}`);
      }
      return true;
    });

    this.test('performative movement behavior works', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);
      
      agent.movementBehavior = MovementBehavior.PERFORMATIVE;
      
      const performativeSpeed = agent.getMovementSpeed();
      if (performativeSpeed <= 2.0) {
        throw new Error(`Performative movement should be fastest, got speed ${performativeSpeed}`);
      }
      return true;
    });
  }

  testStaminaSystem(): void {
    this.test('stamina decreases during movement', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const initialStamina = agent.stamina;
      
      // Move for extended period
      agent.setDestination(1, 1);
      for (let i = 0; i < 60; i++) { // 1 second at 60fps
        agent.update(16);
      }

      if (agent.stamina >= initialStamina) {
        throw new Error(`Stamina should decrease during movement: ${initialStamina} -> ${agent.stamina}`);
      }
      return true;
    });

    this.test('stamina affects movement speed when low', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const normalSpeed = agent.getMovementSpeed();
      
      // Reduce stamina significantly
      agent.stamina = 20;
      
      const tiredSpeed = agent.getMovementSpeed();
      if (tiredSpeed >= normalSpeed) {
        throw new Error(`Low stamina should reduce speed: ${normalSpeed} -> ${tiredSpeed}`);
      }
      return true;
    });
  }

  testAgentInteractions(): void {
    this.test('detects nearby agents', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      // Create another agent nearby
      const agent2 = new Agent('test-agent-2', agent.x + 2, agent.y + 1, { type: 'regular' });
      agent2.setPathfinder(pathfinder);

      const nearbyAgents = agent.getNearbyAgents([agent, agent2], 5);
      
      if (nearbyAgents.length !== 1) {
        throw new Error(`Expected 1 nearby agent, got ${nearbyAgents.length}`);
      }
      if (nearbyAgents[0].id !== 'test-agent-2') {
        throw new Error('Should detect the other agent');
      }
      return true;
    });

    this.test('does not detect distant agents', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      // Create agent far away
      const agent2 = new Agent('test-agent-2', 0, 0, { type: 'regular' });
      agent2.setPathfinder(pathfinder);

      const nearbyAgents = agent.getNearbyAgents([agent, agent2], 5);
      
      if (nearbyAgents.length !== 0) {
        throw new Error(`Expected 0 nearby agents at distance, got ${nearbyAgents.length}`);
      }
      return true;
    });
  }

  testCleanup(): void {
    this.test('cleanup removes map occupancy', () => {
      const { map, pathfinder, agent } = this.createTestEnvironment();
      agent.setPathfinder(pathfinder);

      const gridX = Math.floor(agent.x);
      const gridY = Math.floor(agent.y);

      // Verify initial occupancy
      if (!map.isOccupied(gridX, gridY)) {
        throw new Error('Agent should initially occupy position');
      }

      // Cleanup agent
      agent.cleanup();

      // Position should be clear
      if (map.isOccupied(gridX, gridY)) {
        throw new Error('Agent should clear position on cleanup');
      }
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🤖 Agent System Test Suite\n');
    
    this.testAgentCreation();
    this.testMovementSystem();
    this.testOccupancyManagement();
    this.testBehaviorPatterns();
    this.testStaminaSystem();
    this.testAgentInteractions();
    this.testCleanup();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 Agent System Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All agent tests passed! Agent system is ready for integration.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new AgentTestSuite();
  suite.runAllTests();
}

export default AgentTestSuite;