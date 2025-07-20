/**
 * CoordinateSystem - Handles conversion between grid and canvas coordinates
 * Grid coordinates: 0-49 (width), 0-44 (height)
 * Canvas coordinates: pixel-based, depends on canvas size
 */

export interface GridCoordinates {
  x: number; // 0-49
  y: number; // 0-44
}

export interface CanvasCoordinates {
  x: number; // pixel coordinates
  y: number; // pixel coordinates
}

export class CoordinateSystem {
  private static readonly GRID_WIDTH = 50;
  private static readonly GRID_HEIGHT = 45;
  
  private canvasWidth: number;
  private canvasHeight: number;
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }
  
  /**
   * Convert grid coordinates to canvas pixel coordinates
   */
  public gridToCanvas(gridCoords: GridCoordinates): CanvasCoordinates {
    const cellWidth = this.canvasWidth / CoordinateSystem.GRID_WIDTH;
    const cellHeight = this.canvasHeight / CoordinateSystem.GRID_HEIGHT;
    
    return {
      x: (gridCoords.x + 0.5) * cellWidth, // Center of grid cell
      y: (gridCoords.y + 0.5) * cellHeight
    };
  }
  
  /**
   * Convert canvas pixel coordinates to grid coordinates
   */
  public canvasToGrid(canvasCoords: CanvasCoordinates): GridCoordinates {
    const cellWidth = this.canvasWidth / CoordinateSystem.GRID_WIDTH;
    const cellHeight = this.canvasHeight / CoordinateSystem.GRID_HEIGHT;
    
    const gridX = Math.floor(canvasCoords.x / cellWidth);
    const gridY = Math.floor(canvasCoords.y / cellHeight);
    
    // Clamp to valid grid bounds
    return {
      x: Math.max(0, Math.min(CoordinateSystem.GRID_WIDTH - 1, gridX)),
      y: Math.max(0, Math.min(CoordinateSystem.GRID_HEIGHT - 1, gridY))
    };
  }
  
  /**
   * Check if grid coordinates are valid
   */
  public static isValidGridCoordinate(gridCoords: GridCoordinates): boolean {
    return gridCoords.x >= 0 && 
           gridCoords.x < CoordinateSystem.GRID_WIDTH && 
           gridCoords.y >= 0 && 
           gridCoords.y < CoordinateSystem.GRID_HEIGHT;
  }
  
  /**
   * Clamp grid coordinates to valid bounds
   */
  public static clampGridCoordinates(gridCoords: GridCoordinates): GridCoordinates {
    return {
      x: Math.max(0, Math.min(CoordinateSystem.GRID_WIDTH - 1, gridCoords.x)),
      y: Math.max(0, Math.min(CoordinateSystem.GRID_HEIGHT - 1, gridCoords.y))
    };
  }
  
  /**
   * Get grid dimensions
   */
  public static getGridDimensions(): { width: number; height: number } {
    return {
      width: CoordinateSystem.GRID_WIDTH,
      height: CoordinateSystem.GRID_HEIGHT
    };
  }
  
  /**
   * Update canvas dimensions
   */
  public updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  /**
   * Get canvas dimensions
   */
  public getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }
  
  /**
   * Convert grid area to canvas rectangle
   */
  public gridAreaToCanvas(area: { x: number; y: number; width: number; height: number }): {
    x: number; y: number; width: number; height: number;
  } {
    const cellWidth = this.canvasWidth / CoordinateSystem.GRID_WIDTH;
    const cellHeight = this.canvasHeight / CoordinateSystem.GRID_HEIGHT;
    
    return {
      x: area.x * cellWidth,
      y: area.y * cellHeight,
      width: area.width * cellWidth,
      height: area.height * cellHeight
    };
  }
  
  /**
   * Get cell size in canvas pixels
   */
  public getCellSize(): { width: number; height: number } {
    return {
      width: this.canvasWidth / CoordinateSystem.GRID_WIDTH,
      height: this.canvasHeight / CoordinateSystem.GRID_HEIGHT
    };
  }
}