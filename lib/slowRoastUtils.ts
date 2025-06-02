// Slow Roast Game Utilities and Mechanics

import { 
  SlowRoastGameState, 
  CustomerSegment, 
  JAMES_HOFFMAN_WISDOM,
  calculateCustomerVisits,
  calculateRevenue,
  getGentrificationMessages 
} from './slowRoastTypes';

export class SlowRoastGameEngine {
  static processDailyEvents(state: SlowRoastGameState): {
    newState: SlowRoastGameState;
    events: string[];
  } {
    const events: string[] = [];
    const newState = { ...state };
    const newResources = { ...state.resources };
    
    // Customer visits and coffee sales
    let totalCustomers = 0;
    let totalRevenue = 0;
    let totalGentrification = 0;
    
    state.customerSegments.forEach(segment => {
      const dailyVisitors = calculateCustomerVisits(segment, state.resources.reputation);
      
      if (dailyVisitors > 0) {
        totalCustomers += dailyVisitors;
        const revenue = calculateRevenue(dailyVisitors, segment, state.resources.reputation);
        totalRevenue += revenue;
        totalGentrification += dailyVisitors * segment.gentrificationContribution;
        
        // Consume beans (if available)
        const beansNeeded = dailyVisitors * 0.5;
        if (newResources.beans >= beansNeeded) {
          newResources.beans -= beansNeeded;
        } else {
          // Not enough beans - lose potential customers
          const lostCustomers = Math.floor((beansNeeded - newResources.beans) * 2);
          totalCustomers -= lostCustomers;
          events.push(`⚠️ Lost ${lostCustomers} customers due to insufficient beans!`);
          newResources.beans = 0;
        }
      }
    });
    
    // Update resources
    if (totalCustomers > 0) {
      newResources.customers += totalCustomers;
      newResources.money += totalRevenue;
      newResources.gentrification += totalGentrification;
      
      events.push(`Day ${state.day}: Served ${totalCustomers} customers, earned €${totalRevenue.toFixed(2)}`);
      
      // Bean warning
      if (newResources.beans < 10) {
        events.push("⚠️ Running low on coffee beans!");
      }
      
      // Gentrification events
      if (totalGentrification > 0.5) {
        const gentrificationMessages = getGentrificationMessages(newResources.gentrification);
        if (Math.random() < 0.3) {
          events.push(gentrificationMessages[Math.floor(Math.random() * gentrificationMessages.length)]);
        }
      }
    } else if (state.day > 3) {
      events.push("No customers today. Maybe try educating the neighborhood about specialty coffee?");
    }
    
    // Reputation decay (very slow)
    if (newResources.reputation > 0) {
      newResources.reputation = Math.max(0, newResources.reputation - 0.1);
    }
    
    // Random events
    this.processRandomEvents(state, events);
    
    newState.resources = newResources;
    newState.dailyEvents = events;
    
    return { newState, events };
  }
  
  static processRandomEvents(state: SlowRoastGameState, events: string[]): void {
    const random = Math.random();
    
    // Coffee influencer visit (rare)
    if (random < 0.02 && state.resources.reputation > 30) {
      events.push("☕ A coffee influencer posted about your shop! (+5 reputation, +10 knowledge)");
      state.resources.reputation += 5;
      state.resources.knowledge += 10;
    }
    
    // Bean supplier shortage
    else if (random < 0.05 && state.day > 10) {
      events.push("📦 Your bean supplier is running late. Prices increased 20% this week.");
    }
    
    // Local newspaper feature
    else if (random < 0.03 && state.resources.reputation > 50) {
      events.push("📰 Featured in 'Amsterdam Coffee Guide'! New customers discovered your shop.");
      // This will affect tomorrow's customer visits
    }
    
    // Competition opens
    else if (random < 0.01 && state.day > 20) {
      events.push("☕ Another specialty coffee shop opened nearby. Competition is heating up!");
      // Slightly reduce customer base
      state.customerSegments.forEach(segment => {
        segment.size = Math.max(1, Math.floor(segment.size * 0.95));
      });
    }
  }
  
  static educateCustomerSegment(
    state: SlowRoastGameState, 
    segmentId: string, 
    knowledgeCost: number = 5
  ): SlowRoastGameState {
    if (state.resources.knowledge < knowledgeCost) {
      return state; // Cannot afford education
    }
    
    const newState = { ...state };
    newState.resources = { ...state.resources };
    newState.resources.knowledge -= knowledgeCost;
    
    newState.customerSegments = state.customerSegments.map(segment => {
      if (segment.id === segmentId) {
        const educationGain = 2 + Math.floor(Math.random() * 3); // 2-4 points
        return {
          ...segment,
          education: Math.min(100, segment.education + educationGain)
        };
      }
      return segment;
    });
    
    // Add to daily events
    const segment = state.customerSegments.find(s => s.id === segmentId);
    if (segment) {
      newState.dailyEvents = [
        ...(newState.dailyEvents || []),
        `Educated ${segment.name} about specialty coffee (+${2} education)`
      ];
    }
    
    return newState;
  }
  
  static brewCoffeeManually(state: SlowRoastGameState): SlowRoastGameState {
    if (state.resources.beans < 1) {
      return state; // Cannot brew without beans
    }
    
    const newState = { ...state };
    newState.resources = { ...state.resources };
    newState.resources.beans -= 1;
    newState.resources.reputation += 0.1;
    newState.resources.knowledge += 0.05;
    
    // Small chance for special event
    if (Math.random() < 0.1) {
      const wisdom = JAMES_HOFFMAN_WISDOM[Math.floor(Math.random() * JAMES_HOFFMAN_WISDOM.length)];
      newState.dailyEvents = [
        ...(newState.dailyEvents || []),
        `While brewing, you remember: "${wisdom}"`
      ];
      newState.resources.knowledge += 0.5; // Bonus knowledge
    }
    
    return newState;
  }
  
  static purchaseBeans(state: SlowRoastGameState, quantity: number = 25, cost: number = 20): SlowRoastGameState {
    if (state.resources.money < cost) {
      return state; // Cannot afford beans
    }
    
    const newState = { ...state };
    newState.resources = { ...state.resources };
    newState.resources.money -= cost;
    newState.resources.beans += quantity;
    
    return newState;
  }
  
  static unlockFeature(state: SlowRoastGameState, feature: string, cost: number): SlowRoastGameState {
    if (state.resources.money < cost || state.unlockedFeatures.includes(feature)) {
      return state; // Cannot afford or already unlocked
    }
    
    const newState = { ...state };
    newState.resources = { ...state.resources };
    newState.resources.money -= cost;
    newState.unlockedFeatures = [...state.unlockedFeatures, feature];
    
    // Special unlock effects
    switch (feature) {
      case 'upgrades_menu':
        newState.dailyEvents = [
          ...(newState.dailyEvents || []),
          "🔓 Unlocked shop improvements! You can now purchase equipment and training."
        ];
        break;
      case 'customer_analytics':
        newState.dailyEvents = [
          ...(newState.dailyEvents || []),
          "📊 Advanced customer analytics available! Better understand your neighborhood."
        ];
        break;
    }
    
    return newState;
  }
  
  static checkAchievements(state: SlowRoastGameState): {
    newState: SlowRoastGameState;
    newAchievements: string[];
  } {
    const newAchievements: string[] = [];
    
    // Check each achievement
    const achievements = [
      {
        id: 'first_day',
        name: 'First Day',
        check: () => state.day >= 1
      },
      {
        id: 'first_customer',
        name: 'First Customer',
        check: () => state.resources.customers >= 1
      },
      {
        id: 'coffee_educator',
        name: 'Coffee Educator',
        check: () => state.customerSegments.reduce((sum, seg) => sum + seg.education, 0) >= 150
      },
      {
        id: 'neighborhood_favorite',
        name: 'Neighborhood Favorite',
        check: () => state.resources.reputation >= 50
      },
      {
        id: 'bean_hoarder',
        name: 'Bean Hoarder',
        check: () => state.resources.beans >= 200
      },
      {
        id: 'money_maker',
        name: 'Money Maker',
        check: () => state.resources.money >= 1000
      },
      {
        id: 'gentrification_catalyst',
        name: 'Neighborhood Change',
        check: () => state.resources.gentrification >= 25
      }
    ];
    
    achievements.forEach(achievement => {
      if (!state.achievements.includes(achievement.id) && achievement.check()) {
        newAchievements.push(achievement.id);
      }
    });
    
    const newState = { ...state };
    if (newAchievements.length > 0) {
      newState.achievements = [...state.achievements, ...newAchievements];
      
      // Achievement rewards
      newAchievements.forEach(achievementId => {
        switch (achievementId) {
          case 'first_customer':
            newState.resources.knowledge += 5;
            break;
          case 'coffee_educator':
            newState.resources.reputation += 10;
            break;
          case 'neighborhood_favorite':
            newState.resources.influence += 5;
            break;
        }
      });
    }
    
    return { newState, newAchievements };
  }
  
  static updateGamePhase(state: SlowRoastGameState): SlowRoastGameState {
    const newState = { ...state };
    
    if (state.day <= 3) {
      newState.gamePhase = 'setup';
    } else if (state.resources.reputation < 25) {
      newState.gamePhase = 'learning';
    } else if (state.resources.reputation < 75) {
      newState.gamePhase = 'growing';
    } else if (state.resources.reputation < 150) {
      newState.gamePhase = 'established';
    } else {
      newState.gamePhase = 'empire';
    }
    
    return newState;
  }
  
  static getRandomWisdom(): string {
    return JAMES_HOFFMAN_WISDOM[Math.floor(Math.random() * JAMES_HOFFMAN_WISDOM.length)];
  }
  
  static formatCurrency(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }
  
  static formatNumber(num: number): string {
    return Math.floor(num).toLocaleString();
  }
}