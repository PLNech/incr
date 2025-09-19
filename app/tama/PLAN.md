# Tama Bokujō (たま牧場) Implementation Plan

## Project Overview
Build an idle/incremental game combining Tamagotchi care mechanics with farm management, crafting systems, and prestige loops. Target: 30-60 minute core gameplay loop with infinite scaling.

## Phase 1: TDD Infrastructure & Core Architecture (Days 1-2)

### 1.1 Test Framework Setup
- Configure Jest for unit tests
- Set up test structure: `app/tama/__tests__/`
- Create test utilities and mocks
- Write first failing test for TamaEntity

### 1.2 Core Data Models (Test-First)
```typescript
// Write tests first for:
- TamaEntity (stats, needs, genetics)
- Customer (preferences, patience, payment)
- Recipe (ingredients, outputs, tiers)
- Building (type, capacity, automation)
- GameState (prestige, resources, unlocks)
```

### 1.3 Game Engine Architecture
- Separate game logic from React UI (headless engine)
- Event-driven architecture for game ticks
- Observable pattern for UI updates
- Integration with existing GameStateManager

## Phase 2: Tama Entity System (Days 3-4)

### 2.1 Basic Tama Implementation
Tests first, then implement:
- Tama creation with random genetics
- Need decay system (hunger, happiness, energy)
- Interaction responses (feed, play, clean)
- Experience and leveling system
- Tier calculation (90%-9%-0.9%-0.09%)

### 2.2 Advanced Tama Features
- Name generation (Japanese-inspired)
- Personality traits affecting behavior
- Memory system for relationships
- Skill development for job assignments
- Evolution/growth stages

### 2.3 Tama Collections
- Families and species types
- Genetic inheritance system
- Rare trait emergence
- Tamadex tracking system

## Phase 3: Resource & Crafting System (Days 5-6)

### 3.1 Resource Management
- Primary resources: TamaCoins, Berries, Wood, Stone
- Secondary: Happiness Stars, Evolution Crystals
- Resource generation rates and storage
- Resource sinks and balancing

### 3.2 Crafting Implementation
- Recipe data structure with tiers
- Multi-step crafting chains
- Quality randomization system
- Recipe discovery mechanics
- Crafting queue and timing

### 3.3 Item System
- Item effects on Tamas
- Equipment slots for main Tama
- Consumables vs permanents
- Item tier visualization

## Phase 4: Customer & Contract System (Days 7-8)

### 4.1 Customer Generation
- Population pool at game start
- Customer archetypes with preferences
- Monthly rotation system
- Reputation impact on customer quality

### 4.2 Contract Mechanics
- Contract generation algorithm
- Difficulty scaling with progression
- Bonus/penalty conditions
- Payment calculation (base + bonuses)
- Failure consequences

### 4.3 Daycare Management
- Queue system for customers
- Assignment of Tamas to contracts
- Automation of care routines
- Customer satisfaction tracking

## Phase 5: Buildings & Automation (Days 9-10)

### 5.1 Building System
- Building types: Habitats, Workshops, Farms
- Capacity and upgrade paths
- Worker assignment system
- Production multipliers

### 5.2 Automation Progression
- Manual → Semi-auto → Full automation
- Automation efficiency upgrades
- Job assignment for skilled Tamas
- Resource flow optimization

### 5.3 Factory/Farm Layout
- Grid-based placement (simplified)
- Building interactions and bonuses
- Visual progression of farm growth

## Phase 6: Progression & Prestige (Days 11-12)

### 6.1 Core Progression Loop
- Experience and level system
- Unlock gates for features
- Skill tree implementation
- Three specialization paths

### 6.2 Prestige Layer 1
- Hard reset mechanics
- Multiplier calculations (exponential)
- Legacy bonuses retention
- New species unlocks

### 6.3 Prestige Layer 2
- Meta-currency system
- Permanent upgrade shop
- Market mechanism unlock
- Advanced automation features

### 6.4 Scaling Mathematics
- Exponential cost curves
- Production rate balancing
- Prestige point calculation
- Ensure 30m/45m/60m timing targets

## Phase 7: UI Implementation (Days 13-14)

### 7.1 Layout Structure
- Dense dashboard design
- Mobile-first responsive layout
- Desktop space utilization
- Japanese UI density aesthetic

### 7.2 Core UI Components
- Tama display cards (1-5 detailed, 50-100 simplified)
- Resource header bar
- Building grid view
- Customer queue panel
- Crafting interface
- Skill tree modal

### 7.3 Visual Style
- ASCII/minimal pixel art for MVP
- Color palette: Kawaii saturated
- Dwarf Fortress inspiration for simplicity
- CC0 asset integration system
- Credits display component

### 7.4 Animations & Feedback
- Click feedback (Cookie Clicker style)
- Resource gain floaters
- Tama mood animations (simple)
- Progress bars and timers

## Phase 8: Game Feel & Polish (Days 15-16)

### 8.1 Notification System
- Rolling news ticker
- Emergent story generation
- Tama interaction logs
- Achievement announcements

### 8.2 Achievement System
- 100+ achievements design
- Progressive unlock tiers
- Tamadex completion tracking
- Cross-game achievement prep

### 8.3 Sound Design (Future)
- Click sounds
- Tama vocalizations
- Ambient farm sounds
- Achievement fanfares

### 8.4 Performance Optimization
- Entity pooling for 100+ Tamas
- Render optimization
- State update batching
- Memory management

## Phase 9: Save System & Meta (Day 17)

### 9.1 Save/Load Implementation
- Integration with GameStateManager
- Export/import functionality
- Auto-save every 10 seconds
- Migration system for updates

### 9.2 Statistics Tracking
- Lifetime stats
- Per-prestige stats
- Records and milestones
- Monthly review popups

### 9.3 Settings & Options
- Graphics quality toggle
- Notation preferences
- Auto-buy configurations
- Accessibility options

## Phase 10: Testing & Balance (Days 18-20)

### 10.1 Comprehensive Testing
- Unit tests: 80%+ coverage
- Integration tests for game loops
- E2E tests for critical paths
- Performance benchmarks

### 10.2 Balance Testing
- Progression curve validation
- Resource economy balance
- Prestige timing verification
- Automation cost curves

### 10.3 Playtest Iterations
- 30-minute first prestige achievable
- 45-minute optimal path
- 60-minute completionist
- Infinite scaling verification

## Technical Implementation Notes

### File Structure
```
app/tama/
├── page.tsx                 # Main game component
├── PLAN.md                  # This document
├── types.ts                 # TypeScript definitions
├── engine/
│   ├── TamaEngine.ts       # Core game loop
│   ├── TamaEntity.ts       # Tama class
│   ├── CraftingSystem.ts   # Recipe handler
│   ├── CustomerSystem.ts   # Contract logic
│   └── PrestigeSystem.ts   # Prestige calculations
├── systems/
│   ├── ResourceSystem.ts   # Resource management
│   ├── BuildingSystem.ts   # Buildings/automation
│   ├── AchievementSystem.ts # Achievement tracking
│   └── SaveSystem.ts       # Save/load logic
├── components/
│   ├── TamaCard.tsx        # Tama display
│   ├── CraftingPanel.tsx   # Crafting UI
│   ├── CustomerQueue.tsx   # Customer display
│   ├── BuildingGrid.tsx    # Farm layout
│   └── SkillTree.tsx       # Skill progression
├── data/
│   ├── recipes.ts          # Crafting recipes
│   ├── achievements.ts     # Achievement definitions
│   ├── customerTypes.ts    # Customer archetypes
│   └── tamaSpecies.ts      # Tama types/families
├── utils/
│   ├── calculations.ts     # Game math
│   ├── generators.ts       # Random generation
│   └── formatters.ts       # Display helpers
└── __tests__/
    ├── TamaEntity.test.ts
    ├── CraftingSystem.test.ts
    ├── PrestigeSystem.test.ts
    └── integration/
        └── gameLoop.test.ts
```

### Testing Strategy
1. **Unit Tests**: Every system module
2. **Integration Tests**: Game loops and state changes
3. **E2E Tests**: Full gameplay scenarios
4. **Performance Tests**: 100 Tama benchmark

### Key Design Patterns
1. **Entity-Component-System** for Tamas
2. **Observer Pattern** for UI updates
3. **Factory Pattern** for entity creation
4. **Strategy Pattern** for AI behaviors
5. **Command Pattern** for user actions

### Performance Targets
- 60 FPS with 5 detailed Tamas
- 30 FPS with 100 simple Tamas
- < 100ms save/load time
- < 10MB save file size

### Progression Formula
```typescript
// Prestige points calculation
prestigePoints = Math.floor(Math.pow(totalCoins / 1000, 0.5))

// Cost scaling
upgradeCost = baseCost * Math.pow(1.15, level)

// Production rate
production = baseRate * multipliers * (1 + prestigeBonus)
```

### Critical Success Metrics
- First-time player reaches prestige in 30-45 minutes
- Clear progression visible every 30 seconds
- Automation reduces active play to 20% by midgame
- 100+ hours of content through achievements
- Smooth performance on mobile devices

## Development Priorities
1. **Core Loop First**: Get Tama care working
2. **Early Testability**: TDD from day one
3. **Frequent Saves**: Prevent progress loss
4. **Visual Feedback**: Every action has response
5. **Balance Early**: Test progression timing
6. **Polish Later**: Function over form initially

This plan ensures a robust, scalable implementation that respects the incremental genre while innovating with Tama care mechanics and crafting depth.