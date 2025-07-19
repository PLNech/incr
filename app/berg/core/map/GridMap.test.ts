import { describe, test, expect } from '@jest/globals';
import { GridMap, TileType, Tile } from './GridMap';

describe('GridMap', () => {
  describe('Grid Creation', () => {
    test('creates a grid with specified dimensions', () => {
      const map = new GridMap(10, 10);
      expect(map.width).toBe(10);
      expect(map.height).toBe(10);
      expect(map.getTile(0, 0)).toBeDefined();
      expect(map.getTile(9, 9)).toBeDefined();
    });

    test('initializes all tiles as floor by default', () => {
      const map = new GridMap(5, 5);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const tile = map.getTile(x, y);
          expect(tile.type).toBe(TileType.FLOOR);
          expect(tile.walkable).toBe(true);
        }
      }
    });

    test('throws error for out of bounds access', () => {
      const map = new GridMap(5, 5);
      expect(() => map.getTile(-1, 0)).toThrow('Coordinates out of bounds');
      expect(() => map.getTile(5, 0)).toThrow('Coordinates out of bounds');
      expect(() => map.getTile(0, -1)).toThrow('Coordinates out of bounds');
      expect(() => map.getTile(0, 5)).toThrow('Coordinates out of bounds');
    });
  });

  describe('Tile Manipulation', () => {
    test('can set tile types', () => {
      const map = new GridMap(5, 5);
      map.setTile(2, 2, TileType.WALL);
      
      const tile = map.getTile(2, 2);
      expect(tile.type).toBe(TileType.WALL);
      expect(tile.walkable).toBe(false);
    });

    test('can set special tile types with properties', () => {
      const map = new GridMap(5, 5);
      
      map.setTile(1, 1, TileType.BAR);
      const barTile = map.getTile(1, 1);
      expect(barTile.type).toBe(TileType.BAR);
      expect(barTile.walkable).toBe(false);
      expect(barTile.interactable).toBe(true);

      map.setTile(3, 3, TileType.TOILET);
      const toiletTile = map.getTile(3, 3);
      expect(toiletTile.type).toBe(TileType.TOILET);
      expect(toiletTile.walkable).toBe(false);
      expect(toiletTile.interactable).toBe(true);
    });
  });

  describe('Occupancy Management', () => {
    test('tracks tile occupancy', () => {
      const map = new GridMap(5, 5);
      const agentId = 'agent-123';
      
      expect(map.isOccupied(2, 2)).toBe(false);
      
      map.setOccupant(2, 2, agentId);
      expect(map.isOccupied(2, 2)).toBe(true);
      expect(map.getOccupant(2, 2)).toBe(agentId);
      
      map.clearOccupant(2, 2);
      expect(map.isOccupied(2, 2)).toBe(false);
      expect(map.getOccupant(2, 2)).toBeNull();
    });

    test('prevents multiple occupants on same tile', () => {
      const map = new GridMap(5, 5);
      
      map.setOccupant(2, 2, 'agent-1');
      expect(() => map.setOccupant(2, 2, 'agent-2')).toThrow('Tile already occupied');
    });
  });

  describe('Neighbor Queries', () => {
    test('gets walkable neighbors', () => {
      const map = new GridMap(5, 5);
      map.setTile(1, 0, TileType.WALL); // North wall
      map.setTile(2, 1, TileType.WALL); // East wall
      
      const neighbors = map.getWalkableNeighbors(1, 1);
      
      expect(neighbors).toHaveLength(6); // 8 directions - 2 walls
      expect(neighbors).not.toContainEqual({ x: 1, y: 0 }); // Wall
      expect(neighbors).not.toContainEqual({ x: 2, y: 1 }); // Wall
      expect(neighbors).toContainEqual({ x: 0, y: 1 }); // West
      expect(neighbors).toContainEqual({ x: 1, y: 2 }); // South
    });

    test('handles edge cases for neighbors', () => {
      const map = new GridMap(3, 3);
      
      const cornernNeighbors = map.getWalkableNeighbors(0, 0);
      expect(cornernNeighbors).toHaveLength(3); // Only 3 valid neighbors at corner
      
      const edgeNeighbors = map.getWalkableNeighbors(1, 0);
      expect(edgeNeighbors).toHaveLength(5); // 5 valid neighbors at edge
    });
  });

  describe('Space Connections', () => {
    test('can add doorways between spaces', () => {
      const map = new GridMap(10, 10);
      
      // Create a doorway at (5, 5)
      map.setTile(5, 5, TileType.DOOR);
      const door = map.getTile(5, 5);
      
      expect(door.type).toBe(TileType.DOOR);
      expect(door.walkable).toBe(true);
      expect(door.connectsSpaces).toBe(true);
    });
  });

  describe('Pathfinding Preparation', () => {
    test('calculates movement cost between tiles', () => {
      const map = new GridMap(5, 5);
      
      // Normal floor to floor
      expect(map.getMovementCost(0, 0, 1, 0)).toBe(1);
      
      // Diagonal movement
      expect(map.getMovementCost(0, 0, 1, 1)).toBeCloseTo(1.414, 2);
      
      // To/from door (higher cost due to congestion)
      map.setTile(2, 2, TileType.DOOR);
      expect(map.getMovementCost(1, 2, 2, 2)).toBe(2); // Approaching door
      
      // Cannot move to wall
      map.setTile(3, 3, TileType.WALL);
      expect(map.getMovementCost(2, 3, 3, 3)).toBe(Infinity);
    });
  });

  describe('Crowd Density', () => {
    test('tracks density in regions', () => {
      const map = new GridMap(10, 10);
      
      // Add multiple agents to nearby tiles
      map.setOccupant(5, 5, 'agent-1');
      map.setOccupant(5, 6, 'agent-2');
      map.setOccupant(6, 5, 'agent-3');
      
      // Check density affects movement cost
      const baseCost = map.getMovementCost(4, 5, 5, 5);
      const denseCost = map.getMovementCost(4, 5, 5, 5, true); // with density consideration
      
      expect(denseCost).toBeGreaterThan(baseCost);
    });
  });
});