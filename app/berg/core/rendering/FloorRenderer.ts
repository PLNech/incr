/**
 * FloorRenderer - Visual rendering system for multi-floor layout
 * Handles grid visualization, area reveals, and smooth transitions
 */

import { FloorLayout, Floor, AreaID, Area } from '../map/FloorLayout';
import { TileType } from '../map/GridMap';

export interface RenderOptions {
  tileSize: number;
  showGrid: boolean;
  showAreaLabels: boolean;
  fadeUnlocked: boolean;
  highlightArea?: AreaID;
}

export interface RevealAnimation {
  areaId: AreaID;
  startTime: number;
  duration: number;
  fromScale: number;
  toScale: number;
  fromOpacity: number;
  toOpacity: number;
}

export class FloorRenderer {
  private floorLayout: FloorLayout;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentFloor: Floor = Floor.GROUND;
  private revealAnimations: Map<AreaID, RevealAnimation> = new Map();
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraScale: number = 1;
  private targetCameraScale: number = 1;
  
  // Rendering options
  private options: RenderOptions = {
    tileSize: 16,
    showGrid: true, // Enable grid by default for debugging
    showAreaLabels: true,
    fadeUnlocked: true
  };
  
  // Tile colors based on type and tier
  private tileColors = {
    [TileType.FLOOR]: '#1a1a1a',
    [TileType.WALL]: '#0a0a0a',
    [TileType.WALKABLE]: '#2a2a2a',
    [TileType.DANCEFLOOR]: '#2d1a4a',
    [TileType.BAR]: '#4a2a1a',
    [TileType.TOILET]: '#1a3a3a',
    [TileType.ENTRANCE]: '#3a3a1a',
    [TileType.STAIRS]: '#4a4a4a',
    [TileType.DARKROOM]: '#0d0d0d',
    [TileType.OUTDOOR]: '#1a4a1a',
    [TileType.MEZZANINE]: '#3a2a4a',
    [TileType.LOUNGE]: '#4a3a2a',
    [TileType.DOOR]: '#3a3a3a',
    [TileType.STAGE]: '#4a1a3a',
    [TileType.VIP_AREA]: '#4a4a1a'
  };
  
  constructor(canvas: HTMLCanvasElement, floorLayout: FloorLayout) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2D context');
    this.ctx = ctx;
    this.floorLayout = floorLayout;
    
    this.centerCamera();
  }
  
  private centerCamera(): void {
    const floorPlan = this.floorLayout.getFloorPlan(this.currentFloor);
    if (!floorPlan) return;
    
    // Center the camera on the current floor
    this.cameraX = (floorPlan.width * this.options.tileSize) / 2 - this.canvas.width / 2;
    this.cameraY = (floorPlan.height * this.options.tileSize) / 2 - this.canvas.height / 2;
  }
  
  public setRenderOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  public render(tier: number, currentFloor?: Floor): void {
    const floorToRender = currentFloor !== undefined ? currentFloor : this.currentFloor;
    
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-this.cameraX, -this.cameraY);
    this.ctx.scale(this.cameraScale, this.cameraScale);
    
    // Render specified floor
    this.renderFloor(floorToRender, tier);
    
    // Render area labels if enabled
    if (this.options.showAreaLabels) {
      this.renderAreaLabels(floorToRender);
    }
    
    this.ctx.restore();
    
    // Update animations
    this.updateAnimations();
    
    // Render floor indicator
    this.renderFloorIndicator();
    
    // Debug: Draw a simple test rectangle to verify rendering is working
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(10, 10, 100, 50);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText('RENDERING ACTIVE', 15, 30);
  }
  
  private renderFloor(floor: Floor, tier: number): void {
    const floorPlan = this.floorLayout.getFloorPlan(floor);
    if (!floorPlan) return;
    
    const { gridMap, areas } = floorPlan;
    const tileSize = this.options.tileSize;
    
    // First pass: render all tiles
    for (let x = 0; x < gridMap.width; x++) {
      for (let y = 0; y < gridMap.height; y++) {
        const tile = gridMap.getTile(x, y);
        const area = this.getAreaAtPosition(areas, x, y);
        
        if (area && !area.isUnlocked) {
          // Render locked areas with darker color
          this.ctx.fillStyle = '#0a0a0a';
          this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          continue;
        }
        
        // Apply reveal animation if active
        let opacity = 1;
        let scale = 1;
        
        if (area && this.revealAnimations.has(area.id)) {
          const anim = this.revealAnimations.get(area.id)!;
          const progress = this.getAnimationProgress(anim);
          opacity = this.lerp(anim.fromOpacity, anim.toOpacity, progress);
          scale = this.lerp(anim.fromScale, anim.toScale, progress);
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        if (scale !== 1) {
          const centerX = x * tileSize + tileSize / 2;
          const centerY = y * tileSize + tileSize / 2;
          this.ctx.translate(centerX, centerY);
          this.ctx.scale(scale, scale);
          this.ctx.translate(-centerX, -centerY);
        }
        
        // Tile background
        const color = this.getTileColor(tile.type, tier);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        
        // Grid lines if enabled
        if (this.options.showGrid) {
          this.ctx.strokeStyle = '#333333';
          this.ctx.lineWidth = 0.5;
          this.ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
        
        // Special tile indicators
        this.renderTileIcon(tile.type, x * tileSize, y * tileSize, tileSize);
        
        this.ctx.restore();
      }
    }
    
    // Second pass: render area borders
    for (const area of areas) {
      if (!area.isUnlocked) continue;
      
      const highlight = this.options.highlightArea === area.id;
      this.renderAreaBorder(area, highlight);
    }
  }
  
  private getAreaAtPosition(areas: Area[], x: number, y: number): Area | null {
    for (const area of areas) {
      const { bounds } = area;
      if (x >= bounds.x && x < bounds.x + bounds.width &&
          y >= bounds.y && y < bounds.y + bounds.height) {
        return area;
      }
    }
    return null;
  }
  
  private renderAreaBorder(area: Area, highlight: boolean): void {
    const { x, y, width, height } = area.bounds;
    const tileSize = this.options.tileSize;
    
    this.ctx.strokeStyle = highlight ? '#ff6b6b' : '#444444';
    this.ctx.lineWidth = highlight ? 2 : 1;
    this.ctx.setLineDash(highlight ? [] : [5, 5]);
    
    this.ctx.strokeRect(
      x * tileSize,
      y * tileSize,
      width * tileSize,
      height * tileSize
    );
    
    this.ctx.setLineDash([]);
  }
  
  private renderAreaLabels(floor: Floor): void {
    const floorPlan = this.floorLayout.getFloorPlan(floor);
    if (!floorPlan) return;
    
    const tileSize = this.options.tileSize;
    
    for (const area of floorPlan.areas) {
      if (!area.isUnlocked) continue;
      
      const { x, y, width, height } = area.bounds;
      const centerX = (x + width / 2) * tileSize;
      const centerY = (y + height / 2) * tileSize;
      
      // Background for text
      const textWidth = area.name.length * 6;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(centerX - textWidth / 2 - 4, centerY - 8, textWidth + 8, 16);
      
      // Text
      this.ctx.fillStyle = '#cccccc';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(area.name, centerX, centerY);
    }
  }
  
  private renderTileIcon(type: TileType, x: number, y: number, size: number): void {
    const iconSize = size * 0.6;
    const iconX = x + (size - iconSize) / 2;
    const iconY = y + (size - iconSize) / 2;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `${iconSize}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const icons: Record<string, string> = {
      [TileType.BAR]: '🍺',
      [TileType.TOILET]: '🚻',
      [TileType.STAIRS]: '▲',
      [TileType.ENTRANCE]: '🚪',
      [TileType.STAGE]: '🎵',
      [TileType.VIP_AREA]: '👑'
    };
    
    const icon = icons[type];
    if (icon) {
      this.ctx.fillText(icon, x + size / 2, y + size / 2);
    }
  }
  
  private renderFloorIndicator(): void {
    const floorNames = ['Ground Floor', 'First Floor', 'Second Floor'];
    const floorName = floorNames[this.currentFloor];
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 150, 30);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(floorName, 20, 25);
  }
  
  private getTileColor(type: TileType, tier: number): string {
    const baseColor = this.tileColors[type] || '#1a1a1a';
    
    // Adjust brightness based on tier
    if (tier >= 4) {
      // Brighter, more commercial colors
      return this.brightenColor(baseColor, 0.3);
    } else if (tier >= 2) {
      // Slightly brighter
      return this.brightenColor(baseColor, 0.1);
    }
    
    return baseColor;
  }
  
  private brightenColor(color: string, amount: number): string {
    // Simple color brightening
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
  // Animation methods
  public revealArea(areaId: AreaID, duration: number = 1000): void {
    const animation: RevealAnimation = {
      areaId,
      startTime: performance.now(),
      duration,
      fromScale: 0.8,
      toScale: 1,
      fromOpacity: 0,
      toOpacity: 1
    };
    
    this.revealAnimations.set(areaId, animation);
  }
  
  private updateAnimations(): void {
    const now = performance.now();
    const completed: AreaID[] = [];
    
    for (const [areaId, anim] of Array.from(this.revealAnimations.entries())) {
      if (now >= anim.startTime + anim.duration) {
        completed.push(areaId);
      }
    }
    
    // Remove completed animations
    completed.forEach(areaId => this.revealAnimations.delete(areaId));
    
    // Update camera zoom
    if (this.cameraScale !== this.targetCameraScale) {
      const diff = this.targetCameraScale - this.cameraScale;
      this.cameraScale += diff * 0.1;
      
      if (Math.abs(diff) < 0.01) {
        this.cameraScale = this.targetCameraScale;
      }
    }
  }
  
  private getAnimationProgress(anim: RevealAnimation): number {
    const now = performance.now();
    const elapsed = now - anim.startTime;
    const progress = Math.min(1, elapsed / anim.duration);
    
    // Easing function (ease out cubic)
    return 1 - Math.pow(1 - progress, 3);
  }
  
  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }
  
  // Camera controls
  public zoomOut(targetScale: number = 0.8): void {
    this.targetCameraScale = Math.max(0.5, Math.min(2, targetScale));
  }
  
  public zoomIn(targetScale: number = 1.2): void {
    this.targetCameraScale = Math.max(0.5, Math.min(2, targetScale));
  }
  
  public panCamera(dx: number, dy: number): void {
    this.cameraX += dx;
    this.cameraY += dy;
  }
  
  public switchFloor(floor: Floor): void {
    this.currentFloor = floor;
    this.centerCamera();
  }
  
  public getCurrentFloor(): Floor {
    return this.currentFloor;
  }
  
  // Convert screen coordinates to grid coordinates
  public screenToGrid(screenX: number, screenY: number): { x: number; y: number } | null {
    const gridX = Math.floor((screenX + this.cameraX) / (this.options.tileSize * this.cameraScale));
    const gridY = Math.floor((screenY + this.cameraY) / (this.options.tileSize * this.cameraScale));
    
    const floorPlan = this.floorLayout.getFloorPlan(this.currentFloor);
    if (!floorPlan) return null;
    
    if (gridX >= 0 && gridX < floorPlan.width && gridY >= 0 && gridY < floorPlan.height) {
      return { x: gridX, y: gridY };
    }
    
    return null;
  }
}