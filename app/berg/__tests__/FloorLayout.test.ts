/**
 * FloorLayout Tests - Core floor management system
 * Testing the authentic Berghain multi-floor layout
 */

import { FloorLayout, Floor, AreaID } from '../core/map/FloorLayout';

describe('FloorLayout', () => {
  let floorLayout: FloorLayout;

  beforeEach(() => {
    floorLayout = new FloorLayout();
  });

  test('should initialize with three floors', () => {
    expect(floorLayout.getFloorPlan(Floor.GROUND)).toBeTruthy();
    expect(floorLayout.getFloorPlan(Floor.FIRST)).toBeTruthy();
    expect(floorLayout.getFloorPlan(Floor.SECOND)).toBeTruthy();
  });

  test('should start with initial areas unlocked', () => {
    const unlockedAreas = floorLayout.getUnlockedAreas();
    
    // Should have entrance, lobby, main staircase, dancefloor, main bar, bathrooms
    expect(unlockedAreas).toContain(AreaID.ENTRANCE);
    expect(unlockedAreas).toContain(AreaID.LOBBY);
    expect(unlockedAreas).toContain(AreaID.MAIN_STAIRCASE);
    expect(unlockedAreas).toContain(AreaID.BERGHAIN_DANCEFLOOR);
    expect(unlockedAreas).toContain(AreaID.BAR_MAIN);
    expect(unlockedAreas).toContain(AreaID.BATHROOMS_FIRST);
    
    expect(unlockedAreas.length).toBeGreaterThanOrEqual(6);
  });

  test('should get area details correctly', () => {
    const entrance = floorLayout.getArea(AreaID.ENTRANCE);
    expect(entrance).toBeTruthy();
    expect(entrance?.id).toBe(AreaID.ENTRANCE);
    expect(entrance?.floor).toBe(Floor.GROUND);
    expect(entrance?.isUnlocked).toBe(true);
    expect(entrance?.unlockTier).toBe(0);
  });

  test('should unlock areas by tier', () => {
    // Säule should unlock at tier 1
    const saeule = floorLayout.getArea(AreaID.SAEULE);
    expect(saeule?.unlockTier).toBe(1);
    expect(saeule?.isUnlocked).toBe(false);
    
    // Unlock it
    const success = floorLayout.unlockArea(AreaID.SAEULE);
    expect(success).toBe(true);
    
    const updatedSaeule = floorLayout.getArea(AreaID.SAEULE);
    expect(updatedSaeule?.isUnlocked).toBe(true);
  });

  test('should get areas for specific tier', () => {
    const tier1Areas = floorLayout.getAreasForTier(1);
    expect(tier1Areas).toContain(AreaID.SAEULE);
    expect(tier1Areas).toContain(AreaID.MEZZANINE);
    expect(tier1Areas).toContain(AreaID.BAR_MEZZANINE);
    expect(tier1Areas).toContain(AreaID.SMOKING_STAIRS);
  });

  test('should handle floor connections correctly', () => {
    // Ground to First floor
    const groundToFirst = floorLayout.getConnectionsBetweenFloors(Floor.GROUND, Floor.FIRST);
    expect(groundToFirst).toContain(AreaID.MAIN_STAIRCASE);
    
    // First to Second floor
    const firstToSecond = floorLayout.getConnectionsBetweenFloors(Floor.FIRST, Floor.SECOND);
    expect(firstToSecond).toContain(AreaID.SMOKING_STAIRS);
  });

  test('should validate area connections', () => {
    // Test that entrance connects to coat check
    const canMove = floorLayout.canMoveToArea(AreaID.ENTRANCE, AreaID.COAT_CHECK);
    expect(canMove).toBe(true);
    
    // Test invalid connection (both areas must be unlocked)
    const cantMove = floorLayout.canMoveToArea(AreaID.ENTRANCE, AreaID.SAEULE);
    expect(cantMove).toBe(false); // Säule is not unlocked initially
  });

  test('should calculate total capacity correctly', () => {
    const initialCapacity = floorLayout.getTotalCapacity();
    expect(initialCapacity).toBeGreaterThan(0);
    
    // Unlock more areas and capacity should increase
    floorLayout.unlockArea(AreaID.SAEULE);
    const newCapacity = floorLayout.getTotalCapacity();
    expect(newCapacity).toBeGreaterThan(initialCapacity);
  });

  test('should prevent duplicate unlocking', () => {
    // Try to unlock an already unlocked area
    const firstUnlock = floorLayout.unlockArea(AreaID.ENTRANCE);
    expect(firstUnlock).toBe(false); // Should return false for already unlocked
    
    const entrance = floorLayout.getArea(AreaID.ENTRANCE);
    expect(entrance?.isUnlocked).toBe(true); // Should still be unlocked
  });

  test('should handle invalid area IDs', () => {
    const invalidArea = floorLayout.getArea('invalid_area' as AreaID);
    expect(invalidArea).toBeNull();
    
    const invalidUnlock = floorLayout.unlockArea('invalid_area' as AreaID);
    expect(invalidUnlock).toBe(false);
  });

  test('should maintain floor grid maps', () => {
    const groundFloor = floorLayout.getFloorPlan(Floor.GROUND);
    expect(groundFloor?.gridMap).toBeTruthy();
    expect(groundFloor?.width).toBe(40);
    expect(groundFloor?.height).toBe(30);
    
    const firstFloor = floorLayout.getFloorPlan(Floor.FIRST);
    expect(firstFloor?.gridMap).toBeTruthy();
    expect(firstFloor?.areas.length).toBeGreaterThan(0);
  });
});