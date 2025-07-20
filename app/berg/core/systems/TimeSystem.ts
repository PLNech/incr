/**
 * TimeSystem - Manages Klub Nacht timing and cycles
 * Models realistic club opening hours and day progression
 */

export interface KlubNachtTime {
  day: string; // "Friday", "Saturday", etc.
  hour: number; // 22-10 (10pm Friday to 10am Monday)
  minute: number;
  isOpen: boolean;
  phase: 'opening' | 'warmup' | 'peak' | 'afterhours' | 'closing' | 'closed';
}

export interface KlubNachtCycle {
  startTime: KlubNachtTime;
  endTime: KlubNachtTime;
  totalRevenue: number;
  totalVisitors: number;
  peakHour: number;
  rejectionRate: number;
  lineup: string[];
}

export class TimeSystem {
  private gameStartTime: number;
  private timeMultiplier: number = 60; // 1 minute real = 1 hour game time
  
  // KN typically runs Friday 22:00 to Monday 10:00
  private readonly KN_SCHEDULE = {
    start: { day: 'Friday', hour: 22 },
    end: { day: 'Monday', hour: 10 }
  };
  
  private currentCycle: KlubNachtCycle | null = null;
  
  constructor() {
    this.gameStartTime = Date.now();
  }
  
  public getCurrentTime(): KlubNachtTime {
    const elapsedRealMs = Date.now() - this.gameStartTime;
    const elapsedGameMs = elapsedRealMs * this.timeMultiplier;
    
    // Start on Friday 22:00
    const gameDate = new Date(2024, 0, 5, 22, 0); // Friday Jan 5, 2024 22:00
    gameDate.setTime(gameDate.getTime() + elapsedGameMs);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[gameDate.getDay()];
    const currentHour = gameDate.getHours();
    const currentMinute = gameDate.getMinutes();
    
    const isOpen = this.isClubOpen(currentDay, currentHour);
    const phase = this.getClubPhase(currentDay, currentHour);
    
    return {
      day: currentDay,
      hour: currentHour,
      minute: currentMinute,
      isOpen,
      phase
    };
  }
  
  private isClubOpen(day: string, hour: number): boolean {
    // Friday 22:00 to Monday 10:00
    if (day === 'Friday' && hour >= 22) return true;
    if (day === 'Saturday') return true;
    if (day === 'Sunday') return true;
    if (day === 'Monday' && hour < 10) return true;
    return false;
  }
  
  private getClubPhase(day: string, hour: number): KlubNachtTime['phase'] {
    if (!this.isClubOpen(day, hour)) return 'closed';
    
    // Friday opening
    if (day === 'Friday' && hour >= 22) return 'opening';
    
    // Saturday progression
    if (day === 'Saturday') {
      if (hour >= 0 && hour < 6) return 'peak';
      if (hour >= 6 && hour < 12) return 'afterhours';
      if (hour >= 12 && hour < 18) return 'warmup';
      if (hour >= 18) return 'peak';
    }
    
    // Sunday progression
    if (day === 'Sunday') {
      if (hour >= 0 && hour < 8) return 'peak';
      if (hour >= 8 && hour < 16) return 'afterhours';
      if (hour >= 16) return 'peak';
    }
    
    // Monday closing
    if (day === 'Monday' && hour < 10) return 'closing';
    
    return 'peak';
  }
  
  public getPhaseDescription(phase: KlubNachtTime['phase']): string {
    switch (phase) {
      case 'opening': return 'Doors opening, early arrivals';
      case 'warmup': return 'Warming up, crowd building';
      case 'peak': return 'Peak time, full energy';
      case 'afterhours': return 'After hours, deep vibes';
      case 'closing': return 'Last call, winding down';
      case 'closed': return 'Club closed';
    }
  }
  
  public startNewCycle(): KlubNachtCycle {
    const currentTime = this.getCurrentTime();
    this.currentCycle = {
      startTime: currentTime,
      endTime: { ...currentTime, day: 'Monday', hour: 10, minute: 0 } as KlubNachtTime,
      totalRevenue: 0,
      totalVisitors: 0,
      peakHour: 0,
      rejectionRate: 0,
      lineup: this.generateLineup()
    };
    
    return this.currentCycle;
  }
  
  private generateLineup(): string[] {
    const djs = [
      'Ben Klock', 'Marcel Dettmann', 'Âme', 'Dixon', 'Rødhåd',
      'Len Faki', 'Function', 'Dax J', 'Kobosil', 'SNTS',
      'Richie Hawtin', 'Adam Beyer', 'Charlotte de Witte', 'I Hate Models',
      'Ostgut Ton Residents', 'Panorama Bar Residents'
    ];
    
    // Pick 3-5 DJs for the lineup
    const lineupSize = 3 + Math.floor(Math.random() * 3);
    const lineup = [];
    const shuffled = [...djs].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < lineupSize; i++) {
      lineup.push(shuffled[i]);
    }
    
    return lineup;
  }
  
  public getCurrentCycle(): KlubNachtCycle | null {
    return this.currentCycle;
  }
  
  public updateCycleStats(revenue: number, visitors: number, rejections: number): void {
    if (!this.currentCycle) return;
    
    this.currentCycle.totalRevenue += revenue;
    this.currentCycle.totalVisitors += visitors;
    if (visitors + rejections > 0) {
      this.currentCycle.rejectionRate = rejections / (visitors + rejections);
    }
  }
  
  public shouldEndCycle(): boolean {
    const currentTime = this.getCurrentTime();
    return currentTime.day === 'Monday' && currentTime.hour >= 10;
  }
  
  public getTimeString(): string {
    const time = this.getCurrentTime();
    const hourStr = time.hour.toString().padStart(2, '0');
    const minStr = time.minute.toString().padStart(2, '0');
    return `${time.day} ${hourStr}:${minStr}`;
  }
}