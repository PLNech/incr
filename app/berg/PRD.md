# BergInc: The Berghain Incremental
## Product Requirements Document

### 🎯 **Core Vision**
An incremental idle game that serves as an art piece about gentrification, commercialization, and the inevitable passage of time. Players start managing an authentic underground techno club but are subtly tempted by growth mechanics that slowly destroy the very culture they initially celebrated.

### 🎮 **Core Game Loop**
1. **KlubNacht Simulation**: Watch low-fi dot representations of clubbers move through spaces
2. **Revenue Generation**: Earn money from cover charges, drinks, and events
3. **Tier Progression**: Spend revenue on upgrades that unlock new eras and mechanics
4. **Quote System**: Discover lore through visitor/regular/staff quotes that reveal changing culture
5. **Temptation Mechanic**: Game shows shiny tier upgrades while subtly punishing progression

---

## 🏗️ **Technical Architecture**

### **Stack**: Next.js App Router + TypeScript + Tailwind CSS (Existing Incr Factory)
- **Integration**: New route `/berg` in existing Next.js App Router site
- **Shared Systems**: Leverage existing achievements and state engine
- **Deployment**: Existing Vercel setup (zero additional config)
- **Styling**: Existing Tailwind configuration
- **State Management**: Integrate with existing shared state engine
- **Audio**: HTML5 Audio API for loop mixing
- **TypeScript**: Leverage existing TS setup for better type safety

---

## 🎪 **Core Mechanics**

### **Tier System (The Growth Temptation)**
```
Tier 0: Underground (1995-2000) - Small, authentic, gay club roots
Tier 1: Word of Mouth (2001-2005) - Slightly bigger, still underground  
Tier 2: Rising Fame (2006-2010) - International attention begins
Tier 3: Tourist Magnet (2011-2015) - TripAdvisor lists, queue tourism
Tier 4: Brand Empire (2016-2020) - Merchandise, documentary deals
Tier 5: Corporate Asset (2021+) - IPO rumors, franchise discussions
```

**Key Design Principle**: Player can choose to stay at Tier 0 forever and maintain authenticity, but the game constantly tempts them with "What if you just upgraded once more..."

### **Space Evolution**
```javascript
// Spaces unlock with tiers
const spaces = {
  tier0: ["main_floor", "dark_room", "bar"],
  tier1: ["main_floor", "dark_room", "bar", "panorama_bar"], 
  tier2: ["main_floor", "dark_room", "bar", "panorama_bar", "berghain_kantine"],
  tier3: ["main_floor", "dark_room", "bar", "panorama_bar", "berghain_kantine", "outdoor_area"],
  tier4: ["main_floor", "dark_room", "bar", "panorama_bar", "berghain_kantine", "outdoor_area", "vip_section"],
  tier5: ["main_floor", "dark_room", "bar", "panorama_bar", "berghain_kantine", "outdoor_area", "vip_section", "gift_shop"]
}
```

### **Crowd Simulation (The Heart of the Game)**
```javascript
// Super low-fi visualization
const crowdTypes = {
  tier0: { colors: ["#1a1a1a", "#2d2d2d", "#404040"], behavior: "authentic" },
  tier1: { colors: ["#1a1a1a", "#2d2d2d", "#404040", "#0d4f3c"], behavior: "curious" },
  tier2: { colors: ["#2d2d2d", "#404040", "#0d4f3c", "#1a472a"], behavior: "mixed" },
  tier3: { colors: ["#404040", "#0d4f3c", "#1a472a", "#ff6b6b"], behavior: "tourist" },
  tier4: { colors: ["#0d4f3c", "#1a472a", "#ff6b6b", "#4ecdc4"], behavior: "instagram" },
  tier5: { colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"], behavior: "performative" }
}
```

**Dot Movement Patterns**:
- Early tiers: Slow, organic movement, long stays on dancefloor
- Later tiers: Quick, erratic movement, frequent photo stops, shorter stays

---

## 🎵 **Audio Evolution System**

### **Loop Progression**
10 audio loops (30 seconds each) representing the sonic evolution:
```
Loop 1-2: Pure minimal techno (Tier 0-1)
Loop 3-4: Slightly more accessible beats (Tier 1-2)  
Loop 5-6: Commercial-friendly rhythms (Tier 2-3)
Loop 7-8: EDM influences creeping in (Tier 3-4)
Loop 9-10: Full commercialization (Tier 4-5)
```

**Mixing Logic**:
- Tier 0: Only Loop 1 plays
- Tier 1: Slowly varying Blend Loops 1-3
- Tier 2: Slowly varying Blend Loops 1-5
- Tier 3: Slowly varying Blend Loops 3-7
- Tier 4: Slowly varying Blend Loops 5-8
- Tier 5: Slowly varying Blend Loops 7-10
---

## 🎨 **Visual Evolution**

### **Aesthetic Progression**
```css
/* Tier 0-1: Industrial Minimalism */
--bg-color: #0a0a0a;
--text-color: #666666;
--accent-color: #333333;
--lighting: dim;

/* Tier 2-3: Subtle Color Creep */
--bg-color: #1a1a1a;
--text-color: #888888;
--accent-color: #0d4f3c;
--lighting: mixed;

/* Tier 4-5: Vulgar Brightness */
--bg-color: #f0f0f0;
--text-color: #000000;
--accent-color: #ff6b6b;
--lighting: bright;
```

**UI Evolution**:
- Early: Brutalist, minimal buttons, monospace fonts
- Late: Rounded corners, gradients, sans-serif, "user-friendly" design

---

## 💬 **Quote System (Primary Narrative Mechanic)**

### **Quote Categories**
```javascript
const quoteTypes = {
  visitors: "People experiencing the club for the first time",
  regulars: "Long-time community members watching changes", 
  staff: "Bouncer, bartender, cleaner perspectives",
  djs: "Artists commenting on the scene evolution",
  critics: "External media/cultural commentary"
}
```

### **Real Community Quotes by Tier**

```javascript
// TIER 0: Underground Era (1995-2000) - Pure Authenticity
const tier0Quotes = [
  {
    type: "regular",
    text: 

---

## ⚙️ **Upgrade System (The Temptation Engine)**

### **Upgrade Categories**
```javascript
const upgradeTypes = {
  capacity: {
    name: "Venue Capacity", 
    effect: "More people = more revenue",
    warning: "Crowds change the vibe"
  },
  
  marketing: {
    name: "Social Media Presence",
    effect: "Attract broader audience", 
    warning: "Authenticity decreases"
  },
  
  amenities: {
    name: "Customer Comfort",
    effect: "Higher spending per person",
    warning: "Gentrifies the space"
  },
  
  celebrity: {
    name: "Celebrity Bookings", 
    effect: "Massive revenue boost",
    warning: "Changes crowd demographics"
  }
}
```

**Pricing Formula**: `baseCost * 1.15^upgradesOwned` (standard incremental curve)

---

## 📊 **Core Metrics & Feedback Loops**

### **Visible Metrics**
- **Revenue per KlubNacht**: Primary currency
- **Capacity**: How many dots can fit
- **Queue Length**: Visual representation of demand
- **Tier Progress**: XP bar toward next era

### **Hidden Metrics** (Affect quotes/mood)
- **Authenticity Score**: Decreases with commercial upgrades
- **Community Satisfaction**: Regular attendee happiness
- **Cultural Impact**: How "underground" the space feels

### **Win Condition**
There isn't one. The game continues indefinitely, but the "optimal" play is staying small and authentic. The tragedy is that players will likely choose growth anyway.

---

## 🎪 **MVP Feature Set**

### **Core Features**
1. ✅ Basic tier progression (0-2)
2. ✅ Dot crowd simulation in main floor
3. ✅ Simple upgrade shop (capacity, basic marketing)
4. ✅ Quote system with 20-30 quotes across tiers
5. ✅ Audio loop mixing system
6. ✅ Visual theme evolution

### **Polish Features**
1. ✅ Additional spaces (panorama bar, dark room)
2. ✅ More sophisticated dot movement patterns
3. ✅ Extended quote database (100+ quotes)
4. ✅ Achievements/milestones
5. ✅ Save/load system

---

## 🎯 **Success Metrics**

### **Player Engagement**
- **Average session length**: Target 15-30 minutes
- **Return rate**: Players coming back to check progress
- **Tier distribution**: How many players resist vs. embrace growth

### **Artistic Impact**
- **Community discussion**: Are players discussing the social commentary?
- **Self-reflection**: Do players realize their complicity?
- **Cultural resonance**: Does it capture the Berghain gentrification story?

---

## 📁 **File Structure Integration (App Router)**

```typescript
// Add to existing Next.js App Router project
app/
  berg/
    page.tsx           // Main game page (/berg route)
    components/
      ClubSpace.tsx     // Dot simulation component
      QuoteSystem.tsx   // Quote display/collection  
      UpgradeShop.tsx   // Tier progression UI
      AudioManager.tsx  // Loop mixing system
    types.ts           // TypeScript interfaces
    hooks/
      useGameState.ts  // Game logic hook (integrates with shared state engine)
      useAudioMixer.ts // Audio management
    data/
      quotes.ts        // Quote database
      upgrades.ts      // Upgrade definitions
      
components/           // Existing shared components
  achievements/       // Existing shared achievement system
  
lib/                  // Existing shared utilities
  state-engine.ts     // Integrate with existing state management
  
public/
  berg/
    audio/             // 10 x 30-second loops
    textures/          // Minimal visual assets
```

## 🔗 **Shared State Integration**

```typescript
// Integrate with existing achievements system
interface BergAchievements {
  "underground_purist": boolean;    // Stay at Tier 0 for 24 hours
  "inevitable_growth": boolean;     // Reach Tier 3 
  "culture_destroyer": boolean;     // Reach Tier 5
  "quote_collector": boolean;       // Unlock 50 quotes
  "authentic_resistance": boolean;  // Refuse 10 tier upgrades
}

// Use existing state engine pattern
const useBergState = () => {
  const { gameStates, updateGameState, achievements } = useSharedStateEngine();
  
  return {
    bergState: gameStates.berg || initialBergState,
    updateBerg: (updates: Partial<BergState>) => 
      updateGameState('berg', updates),
    bergAchievements: achievements.berg || {},
    unlockAchievement: (id: keyof BergAchievements) => 
      achievements.unlock('berg', id)
  };
};
```

## 🚀 **Development Roadmap**

### **Phase 1: Core Integration** (Day 1-2)
- Create `app/berg/page.tsx` route in existing App Router
- Integrate with existing shared state engine
- Set up TypeScript interfaces
- Basic dot simulation component
- Tier 0-1 mechanics

### **Phase 2: Game Systems** (Day 3-4)
- Full tier progression system
- Quote collection/display system with shared achievements
- Audio loop mixing
- Visual theme evolution
- Integrate berg-specific achievements

### **Phase 3: Content & Polish** (Day 5-6)
- Complete quote database (100+ entries)
- All tier unlocks and upgrades
- Mobile optimization
- Cross-game achievement integration
- Add to existing site navigation

---

## 🎨 **Art Direction Notes**

### **Typography**
- **Early tiers**: Monospace fonts (Monaco, Consolas)
- **Later tiers**: Sans-serif (Helvetica, Arial)
- **Transition**: Gradual font-family changes with tier progression

### **Color Psychology**
- **Monochrome = Authenticity**: Grayscale represents underground culture
- **Color = Commercialization**: Bright colors represent mainstream appeal
- **Neon = Sell-out**: Fluorescent colors represent full commercialization

### **UI Skeuomorphism**
- **Early**: Raw HTML aesthetics, minimal styling
- **Later**: Over-designed, corporate-friendly interfaces

---

## 🏆 **Cross-Game Integration Ideas**

### **Shared Achievement Synergies**
```typescript
// Berg achievements that unlock bonuses in other games
const crossGameBonuses = {
  "underground_purist": {
    // Staying authentic in Berg unlocks "artisan" bonuses in slow-roast
    game: "slow-roast",
    bonus: "authentic_coffee_blend",
    effect: "Higher quality ratings for minimal roasting"
  },
  
  "culture_destroyer": {
    // Corporate Berg path unlocks business bonuses elsewhere  
    game: "slow-roast",
    bonus: "corporate_efficiency",
    effect: "Faster automation unlocks"
  }
};
```

### **Shared Visual Themes**
- Berg's monochrome→colorful evolution could influence other game aesthetics
- "Authenticity score" mechanic could be reused across games
- Quote system pattern applicable to other narrative incrementals

---

---

## 🤖 **Autonomous Agent Development Guide**

### **🧪 TDD Strategy - Start with Game Logic, Not Visuals**

```typescript
// 1. FIRST: Test core game state transitions
describe('BergInc Core Logic', () => {
  test('should start at tier 0 with minimal revenue', () => {
    const game = new BergGame();
    expect(game.tier).toBe(0);
    expect(game.revenue).toBeLessThan(100);
  });

  test('should unlock tier 1 after revenue threshold', () => {
    const game = new BergGame();
    game.addRevenue(5000);
    expect(game.canUpgradeTier()).toBe(true);
    game.upgradeTier();
    expect(game.tier).toBe(1);
    expect(game.unlockedSpaces).toContain('panorama_bar');
  });

  test('quote unlocking follows tier progression', () => {
    const game = new BergGame();
    const tier0Quotes = game.getAvailableQuotes();
    expect(tier0Quotes.every(q => q.mood === 'grateful')).toBe(true);
    
    game.upgradeTier();
    const tier1Quotes = game.getAvailableQuotes();
    expect(tier1Quotes.some(q => q.mood === 'nostalgic')).toBe(true);
  });
});
```

### **🎯 Critical Test-First Features (Priority Order)**

1. **Tier Progression Logic** - Test revenue thresholds, unlock conditions
2. **Quote System** - Test filtering, unlocking, mood progression
3. **Crowd Simulation** - Test dot spawning, movement, color evolution
4. **Audio Mixing** - Test loop selection based on tier
5. **Visual Theme Evolution** - Test CSS variable changes
6. **Achievement Integration** - Test shared state engine hooks

### **🎭 Playwright E2E Test Scenarios**

```typescript
// Visual regression tests for the artistic vision
test('tier progression changes visual aesthetic', async ({ page }) => {
  await page.goto('/berg');
  
  // Capture tier 0 aesthetic
  await expect(page.locator('[data-testid="club-space"]')).toHaveScreenshot('tier-0-aesthetic.png');
  
  // Fast-forward to tier 3
  await page.evaluate(() => window.debugFastForward?.(3));
  
  // Verify visual evolution
  await expect(page.locator('[data-testid="club-space"]')).toHaveScreenshot('tier-3-aesthetic.png');
  
  // Check crowd color evolution
  const dots = page.locator('[data-testid="clubber-dot"]');
  const colors = await dots.evaluateAll(elements => 
    elements.map(el => getComputedStyle(el).backgroundColor)
  );
  expect(colors.some(color => color.includes('rgb(255, 107, 107)'))).toBe(true); // Tourist pink
});

test('temptation mechanics work as intended', async ({ page }) => {
  await page.goto('/berg');
  
  // Verify player can resist upgrades
  await page.click('[data-testid="upgrade-capacity"]');
  await page.click('[data-testid="decline-upgrade"]');
  
  // Check that game shows "missed opportunity" messaging
  await expect(page.locator('[data-testid="temptation-message"]')).toBeVisible();
  
  // Verify tier stays at 0
  await expect(page.locator('[data-testid="current-tier"]')).toHaveText('0');
});

test('quote emotional progression reflects gentrification', async ({ page }) => {
  await page.goto('/berg');
  
  // Collect initial quotes
  const tier0Quote = await page.textContent('[data-testid="current-quote"]');
  expect(tier0Quote).toMatch(/saved my life|finally somewhere|beautiful/i);
  
  // Progress to later tier
  await page.evaluate(() => window.debugFastForward?.(4));
  
  // Verify mood shift in quotes
  const tier4Quote = await page.textContent('[data-testid="current-quote"]');
  expect(tier4Quote).toMatch(/don't recognize|corporate|miss when/i);
});
```

### **⚡ Autonomous Iteration Feedback Loops**

```typescript
// Self-checking mechanisms for the agent
const autonomousChecks = {
  // 1. Performance bounds
  dotSimulationCheck: () => {
    const dotCount = document.querySelectorAll('[data-testid="clubber-dot"]').length;
    console.assert(dotCount <= 100, 'Too many dots - performance issue');
  },
  
  // 2. Artistic vision adherence  
  visualThemeCheck: (tier: number) => {
    const bgColor = getComputedStyle(document.body).backgroundColor;
    if (tier <= 1) {
      console.assert(bgColor.includes('10, 10, 10'), 'Early tiers should be dark');
    }
    if (tier >= 4) {
      console.assert(!bgColor.includes('10, 10, 10'), 'Late tiers should be bright');
    }
  },
  
  // 3. Game balance validation
  progressionCheck: (gameState: BergState) => {
    const revenuePerMinute = gameState.revenue / gameState.timeElapsed;
    console.assert(revenuePerMinute < 1000, 'Revenue scaling too fast');
    
    const authenticityLoss = (5 - gameState.tier) / 5;
    console.assert(authenticityLoss >= 0, 'Authenticity should decrease with tiers');
  }
};
```

### **🎨 Visual/Audio Testing Strategy**

```typescript
// Test experiential elements that define the art piece
describe('Artistic Vision Tests', () => {
  test('audio mixing reflects cultural degradation', () => {
    const mixer = new AudioMixer();
    
    // Tier 0: Pure minimal techno
    mixer.updateTier(0);
    expect(mixer.getActiveLoops()).toEqual([1]);
    
    // Tier 5: Commercial chaos
    mixer.updateTier(5);
    const loops = mixer.getActiveLoops();
    expect(loops).toContain(9);
    expect(loops).toContain(10);
    expect(loops).not.toContain(1);
  });

  test('crowd behavior degrades with commercialization', () => {
    const simulation = new CrowdSimulation();
    
    // Early: Organic movement
    simulation.setTier(0);
    const earlyBehavior = simulation.getMovementPattern();
    expect(earlyBehavior.speed).toBeLessThan(2);
    expect(earlyBehavior.pauseDuration).toBeGreaterThan(5000);
    
    // Late: Erratic, performative
    simulation.setTier(4);
    const lateBehavior = simulation.getMovementPattern();
    expect(lateBehavior.speed).toBeGreaterThan(4);
    expect(lateBehavior.pauseDuration).toBeLessThan(2000);
  });
});
```

### **🚨 Critical Success Metrics for Agent**

```typescript
// Automated checks the agent should run
const criticalMetrics = {
  // Core game loop completeness
  gameLoopWorks: () => {
    // Can player click → earn → upgrade → progress?
    return testGameLoop();
  },
  
  // Artistic vision preserved  
  visionIntact: () => {
    // Does tier progression feel like cultural loss?
    return testEmotionalProgression();
  },
  
  // Performance acceptable
  performanceOK: () => {
    // 60fps with 50+ dots, mobile responsive
    return testPerformanceBounds();
  },
  
  // Integration working
  sharedStateWorks: () => {
    // Achievements save, cross-game bonuses work
    return testStateIntegration();
  }
};
```

### **🎯 Agent Development Philosophy**

1. **Start Boring, Add Magic**: Build functional mechanics first, artistic touches second
2. **Test Feelings, Not Just Functions**: The emotional progression is as important as the math
3. **Mobile-First Testing**: Test on mobile viewport from day 1
4. **Performance as Feature**: Smooth 60fps dot simulation is part of the art
5. **Debug Tools**: Add `window.debugFastForward()` for rapid tier testing
6. **Fail Fast on Vision**: If it doesn't feel like gentrification, restart the approach

### **🔧 Recommended Debug Tools for Agent**

```typescript
// Add these to window for easy testing
window.debugTools = {
  fastForward: (targetTier: number) => {
    // Instantly set tier and trigger all state changes
  },
  
  spawnDots: (count: number, type: string) => {
    // Test crowd simulation with specific types
  },
  
  previewTheme: (tier: number) => {
    // See visual evolution without progression
  },
  
  mockQuotes: () => {
    // Test quote system with sample data
  },
  
  resetToTier0: () => {
    // Quick reset for testing resistance mechanics
  }
};
```

*Remember: The game should feel like watching a beloved community slowly change. If the agent ever loses sight of this emotional core, course-correct immediately.*

---

## 💡 **Design Philosophy**

### **Player Agency Paradox**
The game's central tension: players have complete control over progression but are psychologically nudged toward choices that destroy what they initially valued. This mirrors real gentrification where individual rational choices create collective cultural loss.

### **Subtlety Over Preaching**
The social commentary emerges through gameplay rather than explicit messaging. Players discover the theme through experience, not exposition.

### **Nostalgia as Currency**
The quote system transforms cultural loss into collectible content, mirroring how capitalism commodifies even its own critique.

---

## 🔧 **TypeScript Interfaces**

```typescript
// Core game state types
interface GameState {
    tier: number;
    revenue: number;
    capacity: number;
    upgrades: Record<string, number>;
    unlockedQuotes: Quote[];
    spaces: Space[];
}

interface Quote {
    id: string;
    type: 'visitor' | 'regular' | 'staff' | 'dj' | 'critic';
    tier: number;
    text: string;
    mood: 'grateful' | 'nostalgic' | 'excited' | 'concerned' | 'defeated';
    unlockCondition?: string;
}

interface Clubber {
    id: string;
    x: number;
    y: number;
    color: string;
    type: 'authentic' | 'curious' | 'tourist' | 'influencer';
    currentSpace: string;
    movementPattern: 'organic' | 'erratic' | 'performative';
}

interface Space {
    id: string;
    name: string;
    unlockTier: number;
    capacity: number;
    revenueMultiplier: number;
    dimensions: { width: number; height: number };
}

interface Upgrade {
    id: string;
    name: string;
    category: 'capacity' | 'marketing' | 'amenities' | 'celebrity';
    baseCost: number;
    effect: string;
    warning: string;
    unlockTier: number;
}
```

## 🔧 **Technical Implementation Notes**

### **Performance Considerations**
- Use `requestAnimationFrame` for smooth dot movement
- Limit concurrent dot simulations (max 50-100 dots)
- Lazy load audio files
- Optimize re-renders with React.memo

### **Mobile Optimization**
- Touch-friendly UI elements
- Responsive design for portrait/landscape
- Reduced particle counts on mobile devices

### **Accessibility**
- Alt text for visual elements
- Keyboard navigation support
- High contrast mode option
- Screen reader friendly quote system

---

*"In the end, every scene becomes its own nostalgia." - The Berghain Story*