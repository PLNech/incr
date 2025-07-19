/**
 * GridMap - Core tile-based map system for BergInc
 * Manages spatial representation, walkability, and occupancy
 */

export enum TileType {
  FLOOR = 'floor',
  WALL = 'wall',
  DOOR = 'door',
  BAR = 'bar',
  TOILET = 'toilet',
  DANCEFLOOR = 'dancefloor',
  ENTRANCE = 'entrance',
  STAGE = 'stage',
  VIP_AREA = 'vip'
}

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  walkable: boolean;
  interactable: boolean;
  connectsSpaces: boolean;
  occupantId: string | null;
}

export interface Position {
  x: number;
  y: number;
}

export class GridMap {
  private grid: Tile[][];
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = this.initializeGrid();
  }

  private initializeGrid(): Tile[][] {
    const grid: Tile[][] = [];
    
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        grid[x][y] = this.createTile(x, y, TileType.FLOOR);
      }
    }
    
    return grid;
  }

  private createTile(x: number, y: number, type: TileType): Tile {
    const tileProperties = this.getTileProperties(type);
    
    return {
      x,
      y,
      type,
      ...tileProperties,
      occupantId: null
    };
  }

  private getTileProperties(type: TileType): Omit<Tile, 'x' | 'y' | 'type' | 'occupantId'> {
    switch (type) {
      case TileType.FLOOR:
      case TileType.DANCEFLOOR:
        return { walkable: true, interactable: false, connectsSpaces: false };
      
      case TileType.WALL:
        return { walkable: false, interactable: false, connectsSpaces: false };
      
      case TileType.DOOR:
        return { walkable: true, interactable: false, connectsSpaces: true };
      
      case TileType.BAR:
      case TileType.TOILET:
      case TileType.STAGE:
      case TileType.VIP_AREA:
        return { walkable: false, interactable: true, connectsSpaces: false };
      
      case TileType.ENTRANCE:
        return { walkable: true, interactable: true, connectsSpaces: true };
      
      default:
        return { walkable: true, interactable: false, connectsSpaces: false };
    }
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private validatePosition(x: number, y: number): void {
    if (!this.isValidPosition(x, y)) {
      throw new Error(`Coordinates out of bounds: (${x}, ${y})`);
    }
  }

  public getTile(x: number, y: number): Tile {
    this.validatePosition(x, y);
    return this.grid[x][y];
  }

  public setTile(x: number, y: number, type: TileType): void {
    this.validatePosition(x, y);
    this.grid[x][y] = this.createTile(x, y, type);
  }

  public isOccupied(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile.occupantId !== null;
  }

  public getOccupant(x: number, y: number): string | null {
    const tile = this.getTile(x, y);
    return tile.occupantId;
  }

  public setOccupant(x: number, y: number, agentId: string): void {
    const tile = this.getTile(x, y);
    
    if (tile.occupantId !== null) {
      throw new Error(`Tile already occupied by ${tile.occupantId}`);
    }
    
    tile.occupantId = agentId;
  }

  public clearOccupant(x: number, y: number): void {
    const tile = this.getTile(x, y);
    tile.occupantId = null;
  }

  public getWalkableNeighbors(x: number, y: number): Position[] {
    const neighbors: Position[] = [];
    
    // All 8 directions (N, NE, E, SE, S, SW, W, NW)
    const directions = [
      { dx: 0, dy: -1 },  // N
      { dx: 1, dy: -1 },  // NE
      { dx: 1, dy: 0 },   // E
      { dx: 1, dy: 1 },   // SE
      { dx: 0, dy: 1 },   // S
      { dx: -1, dy: 1 },  // SW
      { dx: -1, dy: 0 },  // W
      { dx: -1, dy: -1 }  // NW
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (this.isValidPosition(nx, ny)) {
        const tile = this.getTile(nx, ny);
        if (tile.walkable) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    
    return neighbors;
  }

  public getMovementCost(
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number,
    considerDensity: boolean = false
  ): number {
    // Validate positions
    if (!this.isValidPosition(fromX, fromY) || !this.isValidPosition(toX, toY)) {
      return Infinity;
    }
    
    const toTile = this.getTile(toX, toY);
    
    // Cannot move to non-walkable tiles
    if (!toTile.walkable) {
      return Infinity;
    }
    
    // Calculate base movement cost
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const isDiagonal = dx > 0 && dy > 0;
    let cost = isDiagonal ? Math.sqrt(2) : 1;
    
    // Add cost modifiers based on tile type
    if (toTile.type === TileType.DOOR) {
      cost *= 2; // Doors create congestion
    }
    
    // Consider crowd density if requested
    if (considerDensity) {
      const density = this.getLocalDensity(toX, toY);
      cost *= (1 + density * 0.5); // Up to 50% increase based on density
    }
    
    return cost;
  }

  private getLocalDensity(x: number, y: number, radius: number = 2): number {
    let occupiedCount = 0;
    let totalTiles = 0;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (this.isValidPosition(nx, ny)) {
          totalTiles++;
          if (this.isOccupied(nx, ny)) {
            occupiedCount++;
          }
        }
      }
    }
    
    return totalTiles > 0 ? occupiedCount / totalTiles : 0;
  }

  /**
   * Debug method to visualize the grid as ASCII
   */
  public toAscii(): string {
    let result = '';
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.grid[x][y];
        
        if (tile.occupantId) {
          result += '@'; // Occupied
        } else {
          switch (tile.type) {
            case TileType.FLOOR: result += '.'; break;
            case TileType.WALL: result += '#'; break;
            case TileType.DOOR: result += '+'; break;
            case TileType.BAR: result += 'B'; break;
            case TileType.TOILET: result += 'T'; break;
            case TileType.DANCEFLOOR: result += 'D'; break;
            case TileType.ENTRANCE: result += 'E'; break;
            case TileType.STAGE: result += 'S'; break;
            case TileType.VIP_AREA: result += 'V'; break;
            default: result += '?';
          }
        }
      }
      result += '\n';
    }
    
    return result;
  }
}