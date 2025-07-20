/**
 * FloorLayout - Authentic Berghain multi-floor layout system
 * Based on the real club architecture with progressive unlocking
 */

import { GridMap, TileType } from './GridMap';

export enum Floor {
  GROUND = 0,
  FIRST = 1,
  SECOND = 2
}

export enum AreaID {
  // Ground Floor
  ENTRANCE = 'entrance',
  LOBBY = 'lobby',
  COAT_CHECK = 'coat_check',
  SAEULE = 'saeule', // Chill out bar
  DARKROOM_GROUND = 'darkroom_ground',
  PATIO = 'patio',
  LAB_ORATORY = 'lab_oratory',
  
  // First Floor
  BERGHAIN_DANCEFLOOR = 'berghain_dancefloor',
  BAR_MAIN = 'bar_main',
  BAR_MEZZANINE = 'bar_mezzanine',
  DARKROOM_FIRST = 'darkroom_first',
  MEZZANINE = 'mezzanine',
  BATHROOMS_FIRST = 'bathrooms_first',
  
  // Second Floor
  PANORAMA_BAR = 'panorama_bar',
  PANORAMA_DANCEFLOOR = 'panorama_dancefloor',
  PANORAMA_ALCOVES = 'panorama_alcoves',
  BATHROOMS_SECOND = 'bathrooms_second',
  
  // Connectors
  MAIN_STAIRCASE = 'main_staircase',
  SMOKING_STAIRS = 'smoking_stairs',
  INTERNAL_STAIRS = 'internal_stairs',
  
  // Corridors
  CORRIDOR_GROUND = 'corridor_ground',
  CORRIDOR_FIRST = 'corridor_first',
  CORRIDOR_SECOND = 'corridor_second'
}

export interface Area {
  id: AreaID;
  name: string;
  floor: Floor;
  bounds: { x: number; y: number; width: number; height: number };
  tileType: TileType;
  unlockTier: number;
  isUnlocked: boolean;
  connections: AreaID[];
  capacity: number;
  revenueMultiplier: number;
}

export interface FloorPlan {
  floor: Floor;
  width: number;
  height: number;
  areas: Area[];
  gridMap: GridMap;
}

export class FloorLayout {
  private floors: Map<Floor, FloorPlan> = new Map();
  private unlockedAreas: Set<AreaID> = new Set();
  private currentFloor: Floor = Floor.GROUND;
  
  // Grid dimensions for each floor (expanded to show queue area)
  private readonly FLOOR_WIDTH = 50;
  private readonly FLOOR_HEIGHT = 45;
  
  constructor() {
    this.initializeFloors();
    this.unlockInitialAreas();
  }
  
  private initializeFloors(): void {
    // Initialize all three floors
    this.floors.set(Floor.GROUND, this.createGroundFloor());
    this.floors.set(Floor.FIRST, this.createFirstFloor());
    this.floors.set(Floor.SECOND, this.createSecondFloor());
    
    // Apply initially unlocked areas to grid maps
    this.applyInitialAreasToGrids();
  }
  
  private applyInitialAreasToGrids(): void {
    // Apply all areas marked as initially unlocked to their respective grids
    for (const [floor, floorPlan] of this.floors.entries()) {
      for (const area of floorPlan.areas) {
        if (area.isUnlocked) {
          this.applyAreaToGrid(floorPlan.gridMap, area);
        }
      }
    }
  }
  
  private createGroundFloor(): FloorPlan {
    const gridMap = new GridMap(this.FLOOR_WIDTH, this.FLOOR_HEIGHT);
    const areas: Area[] = [
      {
        id: AreaID.ENTRANCE,
        name: 'Entrance & Ticket Booth',
        floor: Floor.GROUND,
        bounds: { x: 18, y: 25, width: 4, height: 4 },
        tileType: TileType.ENTRANCE,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.COAT_CHECK],
        capacity: 20,
        revenueMultiplier: 0
      },
      {
        id: AreaID.COAT_CHECK,
        name: 'Coat Check & Art',
        floor: Floor.GROUND,
        bounds: { x: 17, y: 20, width: 6, height: 4 },
        tileType: TileType.WALKABLE,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.ENTRANCE, AreaID.LOBBY],
        capacity: 15,
        revenueMultiplier: 0.1
      },
      {
        id: AreaID.LOBBY,
        name: 'Lobby',
        floor: Floor.GROUND,
        bounds: { x: 15, y: 12, width: 10, height: 7 },
        tileType: TileType.WALKABLE,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.COAT_CHECK, AreaID.SAEULE, AreaID.DARKROOM_GROUND, AreaID.MAIN_STAIRCASE],
        capacity: 40,
        revenueMultiplier: 0
      },
      {
        id: AreaID.MAIN_STAIRCASE,
        name: 'Main Steel Staircase',
        floor: Floor.GROUND,
        bounds: { x: 19, y: 8, width: 2, height: 3 },
        tileType: TileType.STAIRS,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.LOBBY, AreaID.BERGHAIN_DANCEFLOOR],
        capacity: 10,
        revenueMultiplier: 0
      },
      {
        id: AreaID.SAEULE,
        name: 'Säule (Chill Out Bar)',
        floor: Floor.GROUND,
        bounds: { x: 10, y: 14, width: 4, height: 5 },
        tileType: TileType.BAR,
        unlockTier: 1,
        isUnlocked: false,
        connections: [AreaID.LOBBY, AreaID.PATIO],
        capacity: 25,
        revenueMultiplier: 1.5
      },
      {
        id: AreaID.DARKROOM_GROUND,
        name: 'Ground Floor Darkroom',
        floor: Floor.GROUND,
        bounds: { x: 26, y: 14, width: 3, height: 4 },
        tileType: TileType.DARKROOM,
        unlockTier: 2,
        isUnlocked: false,
        connections: [AreaID.LOBBY],
        capacity: 15,
        revenueMultiplier: 0
      },
      {
        id: AreaID.PATIO,
        name: 'Patio/Outdoor Area',
        floor: Floor.GROUND,
        bounds: { x: 5, y: 10, width: 8, height: 8 },
        tileType: TileType.OUTDOOR,
        unlockTier: 3,
        isUnlocked: false,
        connections: [AreaID.SAEULE],
        capacity: 50,
        revenueMultiplier: 1.2
      }
    ];
    
    return { floor: Floor.GROUND, width: this.FLOOR_WIDTH, height: this.FLOOR_HEIGHT, areas, gridMap };
  }
  
  private createFirstFloor(): FloorPlan {
    const gridMap = new GridMap(this.FLOOR_WIDTH, this.FLOOR_HEIGHT);
    const areas: Area[] = [
      {
        id: AreaID.BERGHAIN_DANCEFLOOR,
        name: 'Berghain Main Dancefloor',
        floor: Floor.FIRST,
        bounds: { x: 10, y: 8, width: 20, height: 14 },
        tileType: TileType.DANCEFLOOR,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.MAIN_STAIRCASE, AreaID.BAR_MAIN, AreaID.DARKROOM_FIRST, AreaID.MEZZANINE, AreaID.BATHROOMS_FIRST, AreaID.SMOKING_STAIRS],
        capacity: 500,
        revenueMultiplier: 1
      },
      {
        id: AreaID.BAR_MAIN,
        name: 'Main Floor Bar',
        floor: Floor.FIRST,
        bounds: { x: 5, y: 12, width: 4, height: 6 },
        tileType: TileType.BAR,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.BERGHAIN_DANCEFLOOR],
        capacity: 30,
        revenueMultiplier: 2
      },
      {
        id: AreaID.MEZZANINE,
        name: 'Mezzanine & Ice Cream Bar',
        floor: Floor.FIRST,
        bounds: { x: 15, y: 23, width: 10, height: 4 },
        tileType: TileType.MEZZANINE,
        unlockTier: 1,
        isUnlocked: false,
        connections: [AreaID.BERGHAIN_DANCEFLOOR, AreaID.BAR_MEZZANINE],
        capacity: 40,
        revenueMultiplier: 1.5
      },
      {
        id: AreaID.BAR_MEZZANINE,
        name: 'Mezzanine Bar',
        floor: Floor.FIRST,
        bounds: { x: 26, y: 23, width: 3, height: 3 },
        tileType: TileType.BAR,
        unlockTier: 1,
        isUnlocked: false,
        connections: [AreaID.MEZZANINE],
        capacity: 15,
        revenueMultiplier: 2.5
      },
      {
        id: AreaID.BATHROOMS_FIRST,
        name: 'Unisex Bathrooms (1st)',
        floor: Floor.FIRST,
        bounds: { x: 31, y: 10, width: 3, height: 6 },
        tileType: TileType.TOILET,
        unlockTier: 0,
        isUnlocked: false,
        connections: [AreaID.BERGHAIN_DANCEFLOOR],
        capacity: 20,
        revenueMultiplier: 0
      },
      {
        id: AreaID.DARKROOM_FIRST,
        name: 'Berghain Darkroom',
        floor: Floor.FIRST,
        bounds: { x: 31, y: 18, width: 3, height: 3 },
        tileType: TileType.DARKROOM,
        unlockTier: 2,
        isUnlocked: false,
        connections: [AreaID.BERGHAIN_DANCEFLOOR],
        capacity: 20,
        revenueMultiplier: 0
      },
      {
        id: AreaID.SMOKING_STAIRS,
        name: 'Smoking Stairs',
        floor: Floor.FIRST,
        bounds: { x: 19, y: 5, width: 2, height: 2 },
        tileType: TileType.STAIRS,
        unlockTier: 1,
        isUnlocked: false,
        connections: [AreaID.BERGHAIN_DANCEFLOOR, AreaID.PANORAMA_DANCEFLOOR],
        capacity: 15,
        revenueMultiplier: 0.5
      }
    ];
    
    return { floor: Floor.FIRST, width: this.FLOOR_WIDTH, height: this.FLOOR_HEIGHT, areas, gridMap };
  }
  
  private createSecondFloor(): FloorPlan {
    const gridMap = new GridMap(this.FLOOR_WIDTH, this.FLOOR_HEIGHT);
    const areas: Area[] = [
      {
        id: AreaID.PANORAMA_DANCEFLOOR,
        name: 'Panorama Bar Dancefloor',
        floor: Floor.SECOND,
        bounds: { x: 12, y: 10, width: 16, height: 10 },
        tileType: TileType.DANCEFLOOR,
        unlockTier: 2,
        isUnlocked: false,
        connections: [AreaID.SMOKING_STAIRS, AreaID.PANORAMA_BAR, AreaID.PANORAMA_ALCOVES, AreaID.BATHROOMS_SECOND],
        capacity: 200,
        revenueMultiplier: 3
      },
      {
        id: AreaID.PANORAMA_BAR,
        name: 'Panorama Bar (Wrap-around)',
        floor: Floor.SECOND,
        bounds: { x: 10, y: 12, width: 2, height: 6 },
        tileType: TileType.BAR,
        unlockTier: 2,
        isUnlocked: false,
        connections: [AreaID.PANORAMA_DANCEFLOOR],
        capacity: 40,
        revenueMultiplier: 4
      },
      {
        id: AreaID.PANORAMA_ALCOVES,
        name: 'Panorama Alcoves',
        floor: Floor.SECOND,
        bounds: { x: 29, y: 12, width: 4, height: 6 },
        tileType: TileType.LOUNGE,
        unlockTier: 3,
        isUnlocked: false,
        connections: [AreaID.PANORAMA_DANCEFLOOR],
        capacity: 20,
        revenueMultiplier: 2
      },
      {
        id: AreaID.BATHROOMS_SECOND,
        name: 'Unisex Bathrooms (2nd)',
        floor: Floor.SECOND,
        bounds: { x: 20, y: 21, width: 3, height: 3 },
        tileType: TileType.TOILET,
        unlockTier: 2,
        isUnlocked: false,
        connections: [AreaID.PANORAMA_DANCEFLOOR],
        capacity: 15,
        revenueMultiplier: 0
      }
    ];
    
    return { floor: Floor.SECOND, width: this.FLOOR_WIDTH, height: this.FLOOR_HEIGHT, areas, gridMap };
  }
  
  private unlockInitialAreas(): void {
    // Start with minimal areas unlocked
    const initialAreas = [
      AreaID.ENTRANCE,
      AreaID.COAT_CHECK,
      AreaID.LOBBY,
      AreaID.MAIN_STAIRCASE,
      AreaID.BERGHAIN_DANCEFLOOR,
      AreaID.BAR_MAIN,
      AreaID.BATHROOMS_FIRST,
      AreaID.SMOKING_STAIRS  // Enable vertical circulation
    ];
    
    initialAreas.forEach(areaId => {
      this.unlockArea(areaId);
    });
  }
  
  public unlockArea(areaId: AreaID): boolean {
    if (this.unlockedAreas.has(areaId)) return false;
    
    // Find the area across all floors
    for (const [floor, floorPlan] of this.floors.entries()) {
      const area = floorPlan.areas.find(a => a.id === areaId);
      if (area) {
        area.isUnlocked = true;
        this.unlockedAreas.add(areaId);
        
        // Update the grid map to show this area
        this.applyAreaToGrid(floorPlan.gridMap, area);
        return true;
      }
    }
    
    return false;
  }
  
  private applyAreaToGrid(gridMap: GridMap, area: Area): void {
    const { x, y, width, height } = area.bounds;
    
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        // Set the tile type
        gridMap.setTile(x + dx, y + dy, area.tileType);
        
        // Add walls around the edges
        if (dx === 0 || dx === width - 1 || dy === 0 || dy === height - 1) {
          if (area.tileType !== TileType.STAIRS && area.tileType !== TileType.DOOR) {
            gridMap.setTile(x + dx, y + dy, TileType.WALL);
          }
        }
      }
    }
  }
  
  public getFloorPlan(floor: Floor): FloorPlan | null {
    return this.floors.get(floor) || null;
  }
  
  public getCurrentFloor(): Floor {
    return this.currentFloor;
  }
  
  public setCurrentFloor(floor: Floor): void {
    this.currentFloor = floor;
  }
  
  public getArea(areaId: AreaID): Area | null {
    for (const floorPlan of this.floors.values()) {
      const area = floorPlan.areas.find(a => a.id === areaId);
      if (area) return area;
    }
    return null;
  }
  
  public getUnlockedAreas(): AreaID[] {
    return Array.from(this.unlockedAreas);
  }
  
  public getAreasForTier(tier: number): AreaID[] {
    const areas: AreaID[] = [];
    
    for (const floorPlan of this.floors.values()) {
      for (const area of floorPlan.areas) {
        if (area.unlockTier <= tier && !this.unlockedAreas.has(area.id)) {
          areas.push(area.id);
        }
      }
    }
    
    return areas;
  }
  
  public getConnectionsBetweenFloors(fromFloor: Floor, toFloor: Floor): AreaID[] {
    const connections: AreaID[] = [];
    
    if (fromFloor === Floor.GROUND && toFloor === Floor.FIRST) {
      connections.push(AreaID.MAIN_STAIRCASE);
    } else if (fromFloor === Floor.FIRST && toFloor === Floor.GROUND) {
      connections.push(AreaID.MAIN_STAIRCASE);
    } else if (fromFloor === Floor.FIRST && toFloor === Floor.SECOND) {
      connections.push(AreaID.SMOKING_STAIRS);
    } else if (fromFloor === Floor.SECOND && toFloor === Floor.FIRST) {
      connections.push(AreaID.SMOKING_STAIRS);
    }
    
    return connections;
  }
  
  public canMoveToArea(fromAreaId: AreaID, toAreaId: AreaID): boolean {
    const fromArea = this.getArea(fromAreaId);
    const toArea = this.getArea(toAreaId);
    
    if (!fromArea || !toArea || !fromArea.isUnlocked || !toArea.isUnlocked) {
      return false;
    }
    
    return fromArea.connections.includes(toAreaId);
  }
  
  public getTotalCapacity(): number {
    let capacity = 0;
    
    for (const floorPlan of this.floors.values()) {
      for (const area of floorPlan.areas) {
        if (area.isUnlocked) {
          capacity += area.capacity;
        }
      }
    }
    
    return capacity;
  }
}