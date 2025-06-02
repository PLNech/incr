// Slow Roast v2.0 - Game Engine and Mechanics

import { 
  GameState, 
  CustomerSegment, 
  DailyEvent,
  Achievement,
  COFFEE_UPGRADES,
  ACHIEVEMENTS,
  COFFEE_WISDOM,
  REVIEW_TEMPLATES,
  ENDING_PATHS
} from './slowRoastTypes';

export class SlowRoastEngine {
  // Process daily progression (called every 30 seconds = 1 game day)
  static processDailyEvents(state: GameState): {
    newState: GameState;
    events: DailyEvent[];
  } {
    const newState = { ...state };
    const events: DailyEvent[] = [];
    
    // Advance day
    newState.day += 1;
    
    // Update game phase based on progression
    newState.phase = this.determineGamePhase(newState);
    
    // Process customer visits and Mrs. García arc
    const customerResults = this.processCustomerInteractions(newState);
    newState.dailyCustomers = customerResults.totalCustomers;
    newState.dailyRevenue = customerResults.revenue;
    newState.resources.money += customerResults.revenue;
    newState.mrsGarciaStage = customerResults.mrsGarciaStage;
    
    // Update gentrification based on coffee level and customers
    const gentrificationIncrease = this.calculateGentrificationIncrease(newState);
    newState.resources.gentrification += gentrificationIncrease;
    
    // Update customer segments based on gentrification
    newState.customerSegments = this.updateCustomerSegments(newState);
    
    // Generate daily review events
    const reviewEvents = this.generateDailyReview(newState);
    events.push(...reviewEvents);
    
    // Check for achievements
    const achievementResults = this.checkAchievements(newState);
    newState.achievements = achievementResults.achievements;
    events.push(...achievementResults.events);
    
    // Check for ending conditions
    const endingResult = this.checkEndingConditions(newState);
    if (endingResult) {
      newState.currentEnding = endingResult;
      newState.phase = 'ending';
    }
    
    // Store events for display
    newState.todaysEvents = events;
    
    return { newState, events };
  }
  
  // Determine current game phase
  static determineGamePhase(state: GameState): GameState['phase'] {
    if (state.day <= 2) return 'setup';
    if (state.currentCoffeeLevel <= 1) return 'innocent';
    if (state.resources.gentrification < 15) return 'snobbery';
    if (state.currentEnding) return 'ending';
    return 'realization';
  }
  
  // Process customer interactions including Mrs. García arc
  static processCustomerInteractions(state: GameState): {
    totalCustomers: number;
    revenue: number;
    mrsGarciaStage: GameState['mrsGarciaStage'];
  } {
    let totalCustomers = 0;
    let revenue = 0;
    
    const currentCoffee = COFFEE_UPGRADES[state.currentCoffeeLevel];
    
    // Process each customer segment
    state.customerSegments.forEach(segment => {
      const segmentCustomers = this.calculateSegmentVisits(segment, state);
      totalCustomers += segmentCustomers;
      
      // Calculate revenue based on coffee price and segment spending
      const segmentRevenue = segmentCustomers * Math.min(currentCoffee.price, segment.spendingPower * 2);
      revenue += segmentRevenue;
    });
    
    // Mrs. García special logic
    const mrsGarciaStage = this.updateMrsGarciaArc(state, currentCoffee);
    
    return { totalCustomers, revenue, mrsGarciaStage };
  }
  
  // Calculate how many customers from a segment visit today
  static calculateSegmentVisits(segment: CustomerSegment, state: GameState): number {
    const currentCoffee = COFFEE_UPGRADES[state.currentCoffeeLevel];
    
    // Base visit chance
    let visitChance = 0.3;
    
    // Reduce visits if coffee is too expensive for segment
    if (currentCoffee.price > segment.spendingPower * 1.5) {
      visitChance *= 0.3; // Significant reduction
    } else if (currentCoffee.price > segment.spendingPower) {
      visitChance *= 0.6; // Moderate reduction
    }
    
    // Coffee education increases visits for higher-end segments
    if (segment.education > 30 && state.currentCoffeeLevel > 2) {
      visitChance *= 1.4;
    }
    
    // Gentrification affects different segments differently
    if (segment.id === 'locals' && state.resources.gentrification > 10) {
      visitChance *= Math.max(0.2, 1 - (state.resources.gentrification / 50));
    }
    
    if (segment.id === 'young_professionals' && state.resources.gentrification > 5) {
      visitChance *= 1 + (state.resources.gentrification / 30);
    }
    
    return Math.floor(segment.size * visitChance * (0.5 + Math.random() * 0.5));
  }
  
  // Update Mrs. García's story arc
  static updateMrsGarciaArc(state: GameState, currentCoffee: typeof COFFEE_UPGRADES[0]): GameState['mrsGarciaStage'] {
    // Mrs. García progression based on coffee price and gentrification
    if (state.mrsGarciaStage === 'gone') return 'gone';
    
    if (currentCoffee.price >= 8 || state.resources.gentrification >= 15) {
      return 'gone';
    }
    
    if (currentCoffee.price >= 6 || state.resources.gentrification >= 8) {
      return 'explains';
    }
    
    if (currentCoffee.price >= 4 || state.resources.gentrification >= 4) {
      return 'hesitant';
    }
    
    return 'regular';
  }
  
  // Calculate daily gentrification increase
  static calculateGentrificationIncrease(state: GameState): number {
    const currentCoffee = COFFEE_UPGRADES[state.currentCoffeeLevel];
    let increase = currentCoffee.gentrificationImpact;
    
    // Multiply by customer volume effect
    increase *= (1 + state.dailyCustomers / 100);
    
    // Add customer segment contributions
    state.customerSegments.forEach(segment => {
      const segmentCustomers = this.calculateSegmentVisits(segment, state);
      increase += segmentCustomers * segment.gentrificationContribution;
    });
    
    return Math.round(increase * 10) / 10; // Round to 1 decimal
  }
  
  // Update customer segments based on gentrification level
  static updateCustomerSegments(state: GameState): CustomerSegment[] {
    return state.customerSegments.map(segment => {
      const newSegment = { ...segment };
      
      // Locals decrease as gentrification increases
      if (segment.id === 'locals') {
        const reductionFactor = Math.max(0.3, 1 - (state.resources.gentrification / 40));
        newSegment.size = Math.floor(40 * reductionFactor);
      }
      
      // Young professionals increase
      if (segment.id === 'young_professionals') {
        const increaseFactor = 1 + (state.resources.gentrification / 25);
        newSegment.size = Math.min(35, Math.floor(15 * increaseFactor));
      }
      
      // Tourists increase moderately
      if (segment.id === 'tourists') {
        const increaseFactor = 1 + (state.resources.gentrification / 50);
        newSegment.size = Math.min(30, Math.floor(20 * increaseFactor));
      }
      
      return newSegment;
    });
  }
  
  // Generate daily review events (Yelp reviews, news, Instagram)
  static generateDailyReview(state: GameState): DailyEvent[] {
    const events: DailyEvent[] = [];
    
    // Daily Yelp review
    const yelpReview = REVIEW_TEMPLATES.yelpReviews[
      Math.floor(Math.random() * REVIEW_TEMPLATES.yelpReviews.length)
    ];
    events.push({
      type: 'review',
      title: 'Daily Yelp Review',
      content: yelpReview,
      tone: 'positive'
    });
    
    // News based on gentrification level
    if (state.resources.gentrification > 5 && Math.random() < 0.4) {
      const newsHeadline = REVIEW_TEMPLATES.newsHeadlines[
        Math.floor(Math.random() * REVIEW_TEMPLATES.newsHeadlines.length)
      ];
      events.push({
        type: 'news',
        title: 'Local News',
        content: newsHeadline,
        tone: state.resources.gentrification > 15 ? 'concerning' : 'neutral'
      });
    }
    
    // Instagram post
    if (Math.random() < 0.6) {
      const instagramPost = REVIEW_TEMPLATES.instagramCaptions[
        Math.floor(Math.random() * REVIEW_TEMPLATES.instagramCaptions.length)
      ];
      events.push({
        type: 'review',
        title: 'Instagram Post',
        content: instagramPost,
        tone: 'positive'
      });
    }
    
    return events;
  }
  
  // Check and unlock achievements
  static checkAchievements(state: GameState): {
    achievements: Achievement[];
    events: DailyEvent[];
  } {
    const events: DailyEvent[] = [];
    const achievements = state.achievements.map(achievement => {
      if (!achievement.unlocked && achievement.requirement(state)) {
        events.push({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          content: `"${achievement.satiricalName}" - ${achievement.description}`,
          tone: 'positive'
        });
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });
    
    return { achievements, events };
  }
  
  // Check for ending conditions
  static checkEndingConditions(state: GameState): string | null {
    // Sellout ending - high level coffee + high gentrification
    if (state.currentCoffeeLevel >= 5 && state.resources.gentrification >= 25) {
      return 'sellout';
    }
    
    // Purist ending - medium coffee level, moderate gentrification
    if (state.currentCoffeeLevel >= 3 && state.day >= 20 && state.resources.gentrification < 15) {
      return 'purist';
    }
    
    // Awakened ending - player helped Mrs. García but she still left
    if (state.playerHelpedMrsGarcia && state.mrsGarciaStage === 'gone') {
      return 'awakened';
    }
    
    // Game naturally ends after 30 days
    if (state.day >= 30) {
      if (state.resources.gentrification >= 20) return 'hypocrite';
      if (state.currentCoffeeLevel <= 2) return 'escape';
      return 'hypocrite';
    }
    
    return null;
  }
  
  // Upgrade coffee level
  static upgradeCoffee(state: GameState, upgradeIndex: number): GameState {
    const upgrade = COFFEE_UPGRADES[upgradeIndex];
    if (!upgrade || state.resources.money < upgrade.cost) {
      return state;
    }
    
    const newState = { ...state };
    newState.resources.money -= upgrade.cost;
    newState.currentCoffeeLevel = upgradeIndex;
    newState.unlockedUpgrades = [...state.unlockedUpgrades, upgrade.id];
    
    return newState;
  }
  
  // Try to help Mrs. García (player choice)
  static helpMrsGarcia(state: GameState, helpType: 'discount' | 'gift'): GameState {
    const newState = { ...state };
    newState.playerHelpedMrsGarcia = true;
    newState.mrsGarciaInteractions += 1;
    
    if (helpType === 'gift') {
      newState.resources.money -= 10; // Cost of helping
    }
    
    // Helping doesn't change the outcome, but affects ending path
    return newState;
  }
  
  // Get available coffee upgrades for current day
  static getAvailableUpgrades(state: GameState): typeof COFFEE_UPGRADES {
    return COFFEE_UPGRADES.filter(upgrade => 
      upgrade.unlockDay <= state.day && 
      !state.unlockedUpgrades.includes(upgrade.id)
    );
  }
  
  // Get Mrs. García dialogue based on current stage
  static getMrsGarciaDialogue(stage: GameState['mrsGarciaStage']): {
    text: string;
    canHelp: boolean;
  } {
    switch (stage) {
      case 'regular':
        return {
          text: "Good morning! The usual coffee, please. How is business?",
          canHelp: false
        };
      case 'hesitant':
        return {
          text: "Oh... the prices have changed. Well, I suppose everything is getting more expensive these days.",
          canHelp: true
        };
      case 'explains':
        return {
          text: "I'm sorry, I had to pay other things first. Each of them having higher cost nowadays, not sure why? Maybe I'll just have water today.",
          canHelp: true
        };
      case 'gone':
        return {
          text: "Mrs. García hasn't been seen in the neighborhood for weeks...",
          canHelp: false
        };
    }
  }
  
  // Get random coffee wisdom
  static getRandomWisdom(): string {
    return COFFEE_WISDOM[Math.floor(Math.random() * COFFEE_WISDOM.length)];
  }
  
  // Get ending description
  static getEndingDescription(endingId: string): typeof ENDING_PATHS[keyof typeof ENDING_PATHS] {
    return ENDING_PATHS[endingId as keyof typeof ENDING_PATHS];
  }
  
  // Initialize new game state
  static initializeGameState(playerName: string, shopName: string): GameState {
    return {
      day: 1,
      phase: 'setup',
      resources: {
        money: 200,
        reputation: 0,
        gentrification: 0
      },
      currentCoffeeLevel: 0,
      unlockedUpgrades: ['basic_coffee'],
      customerSegments: [...INITIAL_CUSTOMER_SEGMENTS],
      dailyCustomers: 0,
      dailyRevenue: 0,
      mrsGarciaStage: 'regular',
      mrsGarciaInteractions: 0,
      playerHelpedMrsGarcia: false,
      todaysEvents: [],
      achievements: ACHIEVEMENTS.map(a => ({ ...a, unlocked: false })),
      currentEnding: null,
      playerName,
      shopName
    };
  }
  
  // Format currency display
  static formatCurrency(amount: number): string {
    return `€${Math.round(amount)}`;
  }
  
  // Format percentage display
  static formatPercentage(value: number): string {
    return `${Math.round(value * 10) / 10}%`;
  }
}