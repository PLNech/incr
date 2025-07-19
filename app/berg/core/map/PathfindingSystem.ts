/**
 * PathfindingSystem - A* pathfinding with crowd density awareness
 * Implements heap-based priority queue for optimal performance
 */

import { GridMap, Position } from './GridMap';

export interface PathNode extends Position {
  f: number; // f = g + h (total cost)
  g: number; // g = actual cost from start
  h: number; // h = heuristic cost to goal
  parent: PathNode | null;
}

export interface PathfindingOptions {
  allowDiagonal?: boolean;
  considerCrowdDensity?: boolean;
  maxSearchNodes?: number;
  heuristicWeight?: number;
  allowOccupiedDestination?: boolean;
}

/**
 * Binary min-heap for efficient priority queue operations
 */
class MinHeap {
  private nodes: PathNode[] = [];

  public get size(): number {
    return this.nodes.length;
  }

  public isEmpty(): boolean {
    return this.nodes.length === 0;
  }

  public push(node: PathNode): void {
    this.nodes.push(node);
    this.heapifyUp(this.nodes.length - 1);
  }

  public pop(): PathNode | undefined {
    if (this.nodes.length === 0) return undefined;
    if (this.nodes.length === 1) return this.nodes.pop();

    const min = this.nodes[0];
    this.nodes[0] = this.nodes.pop()!;
    this.heapifyDown(0);
    return min;
  }

  public clear(): void {
    this.nodes.length = 0;
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      if (this.nodes[index].f >= this.nodes[parentIndex].f) {
        break;
      }
      
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private heapifyDown(index: number): void {
    while (true) {
      let minIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < this.nodes.length && 
          this.nodes[leftChild].f < this.nodes[minIndex].f) {
        minIndex = leftChild;
      }

      if (rightChild < this.nodes.length && 
          this.nodes[rightChild].f < this.nodes[minIndex].f) {
        minIndex = rightChild;
      }

      if (minIndex === index) {
        break;
      }

      this.swap(index, minIndex);
      index = minIndex;
    }
  }

  private swap(i: number, j: number): void {
    [this.nodes[i], this.nodes[j]] = [this.nodes[j], this.nodes[i]];
  }
}

export class PathfindingSystem {
  private map: GridMap;
  private heap: MinHeap;
  private closedSet: Set<string>;
  private openSet: Map<string, PathNode>;

  constructor(map: GridMap) {
    this.map = map;
    this.heap = new MinHeap();
    this.closedSet = new Set();
    this.openSet = new Map();
  }

  /**
   * Find optimal path using A* algorithm
   */
  public findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    options: PathfindingOptions = {}
  ): Position[] | null {
    const opts = this.setDefaultOptions(options);
    
    // Validate coordinates
    if (!this.isValidPosition(startX, startY) || !this.isValidPosition(endX, endY)) {
      return null;
    }

    // Check if destination is reachable
    if (!opts.allowOccupiedDestination && this.map.isOccupied(endX, endY)) {
      return null;
    }

    // Same position
    if (startX === endX && startY === endY) {
      return [{ x: startX, y: startY }];
    }

    // Initialize search state
    this.resetSearchState();

    const startNode: PathNode = {
      x: startX,
      y: startY,
      f: 0,
      g: 0,
      h: this.calculateHeuristic(startX, startY, endX, endY),
      parent: null
    };
    startNode.f = startNode.g + startNode.h * opts.heuristicWeight;

    this.heap.push(startNode);
    this.openSet.set(this.positionKey(startX, startY), startNode);

    let searchedNodes = 0;

    while (!this.heap.isEmpty() && searchedNodes < opts.maxSearchNodes) {
      const current = this.heap.pop()!;
      const currentKey = this.positionKey(current.x, current.y);

      // Remove from open set and add to closed set
      this.openSet.delete(currentKey);
      this.closedSet.add(currentKey);

      // Goal reached
      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      // Explore neighbors
      const neighbors = this.getPathfindingNeighbors(current, opts);
      
      for (const neighbor of neighbors) {
        const neighborKey = this.positionKey(neighbor.x, neighbor.y);
        
        if (this.closedSet.has(neighborKey)) {
          continue;
        }

        const movementCost = this.map.getMovementCost(
          current.x,
          current.y,
          neighbor.x,
          neighbor.y,
          opts.considerCrowdDensity
        );

        if (movementCost === Infinity) {
          continue;
        }

        const tentativeG = current.g + movementCost;
        const existingNode = this.openSet.get(neighborKey);

        if (!existingNode) {
          // New node
          const newNode: PathNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.calculateHeuristic(neighbor.x, neighbor.y, endX, endY),
            f: 0,
            parent: current
          };
          newNode.f = newNode.g + newNode.h * opts.heuristicWeight;

          this.heap.push(newNode);
          this.openSet.set(neighborKey, newNode);
        } else if (tentativeG < existingNode.g) {
          // Better path found to existing node
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h * opts.heuristicWeight;
          existingNode.parent = current;
          
          // Note: In a more optimized implementation, we would update the heap
          // For now, the existing node will eventually be processed with updated cost
        }
      }

      searchedNodes++;
    }

    // No path found
    return null;
  }

  private setDefaultOptions(options: PathfindingOptions): Required<PathfindingOptions> {
    return {
      allowDiagonal: options.allowDiagonal ?? true,
      considerCrowdDensity: options.considerCrowdDensity ?? false,
      maxSearchNodes: options.maxSearchNodes ?? 10000,
      heuristicWeight: options.heuristicWeight ?? 1.0,
      allowOccupiedDestination: options.allowOccupiedDestination ?? true
    };
  }

  private resetSearchState(): void {
    this.heap.clear();
    this.closedSet.clear();
    this.openSet.clear();
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.map.width && y >= 0 && y < this.map.height;
  }

  private positionKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private calculateHeuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Octile distance (diagonal + orthogonal)
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    // Cost: 1 for orthogonal, √2 for diagonal
    const diagonalSteps = Math.min(dx, dy);
    const orthogonalSteps = Math.abs(dx - dy);
    
    return diagonalSteps * Math.sqrt(2) + orthogonalSteps;
  }

  private getPathfindingNeighbors(
    node: PathNode,
    options: Required<PathfindingOptions>
  ): Position[] {
    const neighbors: Position[] = [];
    const { x, y } = node;

    // Define movement directions
    const orthogonalDirections = [
      { dx: 0, dy: -1 },  // North
      { dx: 1, dy: 0 },   // East  
      { dx: 0, dy: 1 },   // South
      { dx: -1, dy: 0 }   // West
    ];

    const diagonalDirections = [
      { dx: 1, dy: -1 },  // Northeast
      { dx: 1, dy: 1 },   // Southeast
      { dx: -1, dy: 1 },  // Southwest
      { dx: -1, dy: -1 }  // Northwest
    ];

    // Add orthogonal neighbors
    for (const dir of orthogonalDirections) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (this.isValidPosition(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    // Add diagonal neighbors if allowed
    if (options.allowDiagonal) {
      for (const dir of diagonalDirections) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        if (this.isValidPosition(nx, ny)) {
          // Check for diagonal cutting through walls
          if (this.canMoveDiagonally(x, y, nx, ny)) {
            neighbors.push({ x: nx, y: ny });
          }
        }
      }
    }

    return neighbors;
  }

  private canMoveDiagonally(fromX: number, fromY: number, toX: number, toY: number): boolean {
    // For diagonal movement, both adjacent orthogonal moves must be valid
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) {
      return false; // Not a diagonal move
    }

    // Check adjacent tiles that the diagonal move would "cut through"
    const tile1 = this.map.getTile(fromX + dx, fromY);
    const tile2 = this.map.getTile(fromX, fromY + dy);
    
    return tile1.walkable && tile2.walkable;
  }

  private reconstructPath(endNode: PathNode): Position[] {
    const path: Position[] = [];
    let current: PathNode | null = endNode;

    while (current !== null) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  /**
   * Find path with simplified options for common use cases
   */
  public findSimplePath(startX: number, startY: number, endX: number, endY: number): Position[] | null {
    return this.findPath(startX, startY, endX, endY, {
      allowDiagonal: true,
      considerCrowdDensity: false
    });
  }

  /**
   * Find path that avoids crowded areas
   */
  public findCrowdAwarePath(startX: number, startY: number, endX: number, endY: number): Position[] | null {
    return this.findPath(startX, startY, endX, endY, {
      allowDiagonal: true,
      considerCrowdDensity: true
    });
  }

  /**
   * Quick path finding with limited search for performance
   */
  public findQuickPath(startX: number, startY: number, endX: number, endY: number): Position[] | null {
    return this.findPath(startX, startY, endX, endY, {
      allowDiagonal: true,
      considerCrowdDensity: false,
      maxSearchNodes: 1000,
      heuristicWeight: 1.2 // Slightly more greedy for speed
    });
  }

  /**
   * Get next step towards destination (useful for real-time movement)
   */
  public getNextStep(startX: number, startY: number, endX: number, endY: number): Position | null {
    const path = this.findQuickPath(startX, startY, endX, endY);
    
    if (!path || path.length < 2) {
      return null;
    }
    
    return path[1]; // Return next step (path[0] is current position)
  }

  /**
   * Check if two positions are connected by a walkable path
   */
  public isReachable(startX: number, startY: number, endX: number, endY: number): boolean {
    const path = this.findPath(startX, startY, endX, endY, {
      maxSearchNodes: 500, // Quick check
      heuristicWeight: 2.0  // Very greedy for speed
    });
    
    return path !== null;
  }
}