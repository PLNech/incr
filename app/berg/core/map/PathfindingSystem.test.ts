import { GridMap, TileType } from './GridMap';
import { PathfindingSystem, PathNode } from './PathfindingSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class PathfindingTestSuite {
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

  private createTestMap(): { map: GridMap; pathfinder: PathfindingSystem } {
    const map = new GridMap(10, 10);
    const pathfinder = new PathfindingSystem(map);
    return { map, pathfinder };
  }

  testBasicPathfinding(): void {
    this.test('finds direct path between adjacent tiles', () => {
      const { pathfinder } = this.createTestMap();
      const path = pathfinder.findPath(0, 0, 1, 0);
      
      if (!path || path.length !== 2) {
        throw new Error(`Expected path of length 2, got ${path?.length}`);
      }
      if (path[0].x !== 0 || path[0].y !== 0 || path[1].x !== 1 || path[1].y !== 0) {
        throw new Error('Path does not match expected coordinates');
      }
      return true;
    });

    this.test('finds path across empty grid', () => {
      const { pathfinder } = this.createTestMap();
      const path = pathfinder.findPath(0, 0, 9, 9);
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path[0].x !== 0 || path[0].y !== 0) {
        throw new Error('Path should start at origin');
      }
      if (path[path.length - 1].x !== 9 || path[path.length - 1].y !== 9) {
        throw new Error('Path should end at destination');
      }
      return true;
    });

    this.test('returns null when no path exists', () => {
      const { map, pathfinder } = this.createTestMap();
      
      // Create a wall barrier
      for (let x = 1; x < 9; x++) {
        map.setTile(x, 5, TileType.WALL);
      }
      
      const path = pathfinder.findPath(0, 0, 0, 9);
      if (path !== null) {
        throw new Error('Should return null when no path exists');
      }
      return true;
    });

    this.test('handles same start and end position', () => {
      const { pathfinder } = this.createTestMap();
      const path = pathfinder.findPath(5, 5, 5, 5);
      
      if (!path || path.length !== 1) {
        throw new Error(`Expected single-node path, got ${path?.length}`);
      }
      if (path[0].x !== 5 || path[0].y !== 5) {
        throw new Error('Path should contain only the start/end position');
      }
      return true;
    });
  }

  testObstacleAvoidance(): void {
    this.test('navigates around single wall', () => {
      const { map, pathfinder } = this.createTestMap();
      
      // Create a wall at (5, 5)
      map.setTile(5, 5, TileType.WALL);
      
      const path = pathfinder.findPath(4, 5, 6, 5);
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path.length <= 2) {
        throw new Error('Path should go around obstacle, not through it');
      }
      
      // Check path avoids wall
      for (const pos of path) {
        if (pos.x === 5 && pos.y === 5) {
          throw new Error('Path should not go through wall');
        }
      }
      
      if (path[0].x !== 4 || path[0].y !== 5) {
        throw new Error('Path should start at (4,5)');
      }
      if (path[path.length - 1].x !== 6 || path[path.length - 1].y !== 5) {
        throw new Error('Path should end at (6,5)');
      }
      return true;
    });

    this.test('treats non-walkable tiles as obstacles', () => {
      const { map, pathfinder } = this.createTestMap();
      
      map.setTile(5, 5, TileType.BAR);
      map.setTile(5, 6, TileType.TOILET);
      
      const path = pathfinder.findPath(4, 5, 6, 6);
      
      if (!path) {
        throw new Error('No path found');
      }
      
      // Check path avoids non-walkable tiles
      for (const pos of path) {
        if ((pos.x === 5 && pos.y === 5) || (pos.x === 5 && pos.y === 6)) {
          throw new Error('Path should not go through non-walkable tiles');
        }
      }
      return true;
    });
  }

  testDiagonalMovement(): void {
    this.test('supports diagonal movement when enabled', () => {
      const { pathfinder } = this.createTestMap();
      const path = pathfinder.findPath(0, 0, 2, 2, { allowDiagonal: true });
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path.length > 3) {
        throw new Error('Diagonal path should be efficient');
      }
      if (path[0].x !== 0 || path[0].y !== 0) {
        throw new Error('Path should start at origin');
      }
      if (path[path.length - 1].x !== 2 || path[path.length - 1].y !== 2) {
        throw new Error('Path should end at destination');
      }
      return true;
    });

    this.test('restricts to orthogonal movement when diagonal disabled', () => {
      const { pathfinder } = this.createTestMap();
      const path = pathfinder.findPath(0, 0, 2, 2, { allowDiagonal: false });
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path.length !== 5) {
        throw new Error(`Expected orthogonal path of length 5, got ${path.length}`);
      }
      
      // Check each step is orthogonal
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1];
        const curr = path[i];
        const dx = Math.abs(curr.x - prev.x);
        const dy = Math.abs(curr.y - prev.y);
        if (dx + dy !== 1) {
          throw new Error(`Non-orthogonal step from (${prev.x},${prev.y}) to (${curr.x},${curr.y})`);
        }
      }
      return true;
    });
  }

  testSpecialTileHandling(): void {
    this.test('can path through doors', () => {
      const { map, pathfinder } = this.createTestMap();
      
      map.setTile(5, 5, TileType.DOOR);
      
      const path = pathfinder.findPath(4, 5, 6, 5);
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path.length !== 3) {
        throw new Error(`Expected direct path through door, got length ${path.length}`);
      }
      
      // Check path goes through door
      const goesThroughDoor = path.some(pos => pos.x === 5 && pos.y === 5);
      if (!goesThroughDoor) {
        throw new Error('Path should go through door');
      }
      return true;
    });

    this.test('treats entrance as walkable', () => {
      const { map, pathfinder } = this.createTestMap();
      
      map.setTile(5, 5, TileType.ENTRANCE);
      
      const path = pathfinder.findPath(4, 5, 6, 5);
      
      if (!path) {
        throw new Error('No path found');
      }
      
      // Check path goes through entrance
      const goesThroughEntrance = path.some(pos => pos.x === 5 && pos.y === 5);
      if (!goesThroughEntrance) {
        throw new Error('Path should go through entrance');
      }
      return true;
    });

    this.test('avoids non-walkable special tiles', () => {
      const { map, pathfinder } = this.createTestMap();
      
      map.setTile(5, 5, TileType.STAGE);
      
      const path = pathfinder.findPath(4, 5, 6, 5);
      
      if (!path) {
        throw new Error('No path found');
      }
      if (path.length <= 2) {
        throw new Error('Path should go around non-walkable tile');
      }
      
      // Check path avoids stage
      for (const pos of path) {
        if (pos.x === 5 && pos.y === 5) {
          throw new Error('Path should not go through stage');
        }
      }
      return true;
    });
  }

  testCrowdDensityIntegration(): void {
    this.test('considers crowd density when enabled', () => {
      const { map, pathfinder } = this.createTestMap();
      
      // Add occupants to create dense area
      map.setOccupant(5, 4, 'agent-1');
      map.setOccupant(5, 5, 'agent-2');
      map.setOccupant(5, 6, 'agent-3');
      map.setOccupant(6, 5, 'agent-4');
      
      const pathNormal = pathfinder.findPath(0, 5, 9, 5, { considerCrowdDensity: false });
      const pathCrowdAware = pathfinder.findPath(0, 5, 9, 5, { considerCrowdDensity: true });
      
      if (!pathNormal || !pathCrowdAware) {
        throw new Error('Paths not found');
      }
      
      // Both should be valid paths
      if (pathNormal[0].x !== 0 || pathNormal[0].y !== 5) {
        throw new Error('Normal path should start correctly');
      }
      if (pathCrowdAware[0].x !== 0 || pathCrowdAware[0].y !== 5) {
        throw new Error('Crowd-aware path should start correctly');
      }
      
      return true;
    });
  }

  testPerformance(): void {
    this.test('finds path in reasonable time', () => {
      const { pathfinder } = this.createTestMap();
      
      const start = performance.now();
      const path = pathfinder.findPath(0, 0, 9, 9);
      const elapsed = performance.now() - start;
      
      if (!path) {
        throw new Error('No path found');
      }
      if (elapsed > 10) {
        throw new Error(`Pathfinding too slow: ${elapsed}ms`);
      }
      return true;
    });

    this.test('handles large search space efficiently', () => {
      // Create larger map for stress test
      const bigMap = new GridMap(50, 50);
      const bigPathfinder = new PathfindingSystem(bigMap);
      
      const start = performance.now();
      const path = bigPathfinder.findPath(0, 0, 49, 49);
      const elapsed = performance.now() - start;
      
      if (!path) {
        throw new Error('No path found on large map');
      }
      if (elapsed > 100) {
        throw new Error(`Large pathfinding too slow: ${elapsed}ms`);
      }
      return true;
    });
  }

  testEdgeCases(): void {
    this.test('handles out of bounds coordinates', () => {
      const { pathfinder } = this.createTestMap();
      
      const path = pathfinder.findPath(-1, -1, 15, 15);
      if (path !== null) {
        throw new Error('Should return null for out of bounds coordinates');
      }
      return true;
    });

    this.test('handles destination position occupied', () => {
      const { map, pathfinder } = this.createTestMap();
      
      map.setOccupant(5, 5, 'blocking-agent');
      
      const pathBlocked = pathfinder.findPath(0, 0, 5, 5, { allowOccupiedDestination: false });
      if (pathBlocked !== null) {
        throw new Error('Should return null when destination occupied and not allowed');
      }
      
      const pathAllowing = pathfinder.findPath(0, 0, 5, 5, { allowOccupiedDestination: true });
      if (!pathAllowing) {
        throw new Error('Should find path when occupied destination is allowed');
      }
      return true;
    });

    this.test('handles minimal grid size', () => {
      const tinyMap = new GridMap(1, 1);
      const tinyPathfinder = new PathfindingSystem(tinyMap);
      
      const path = tinyPathfinder.findPath(0, 0, 0, 0);
      if (!path || path.length !== 1) {
        throw new Error('Should handle 1x1 grid correctly');
      }
      return true;
    });
  }

  testUtilityMethods(): void {
    this.test('getNextStep returns correct next position', () => {
      const { pathfinder } = this.createTestMap();
      
      const nextStep = pathfinder.getNextStep(0, 0, 5, 5);
      if (!nextStep) {
        throw new Error('Should return next step');
      }
      
      // Next step should be adjacent to start
      const dx = Math.abs(nextStep.x - 0);
      const dy = Math.abs(nextStep.y - 0);
      if (dx + dy === 0 || dx + dy > 2) {
        throw new Error(`Invalid next step: (${nextStep.x}, ${nextStep.y})`);
      }
      return true;
    });

    this.test('isReachable correctly identifies connectivity', () => {
      const { map, pathfinder } = this.createTestMap();
      
      // Test reachable positions
      if (!pathfinder.isReachable(0, 0, 9, 9)) {
        throw new Error('Should be reachable on empty grid');
      }
      
      // Create barrier
      for (let x = 0; x < 10; x++) {
        map.setTile(x, 5, TileType.WALL);
      }
      
      if (pathfinder.isReachable(0, 0, 0, 9)) {
        throw new Error('Should not be reachable across barrier');
      }
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n🗺️ PathfindingSystem Test Suite\n');
    
    this.testBasicPathfinding();
    this.testObstacleAvoidance();
    this.testDiagonalMovement();
    this.testSpecialTileHandling();
    this.testCrowdDensityIntegration();
    this.testPerformance();
    this.testEdgeCases();
    this.testUtilityMethods();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 PathfindingSystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All pathfinding tests passed! A* algorithm is working correctly.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new PathfindingTestSuite();
  suite.runAllTests();
}

export default PathfindingTestSuite;