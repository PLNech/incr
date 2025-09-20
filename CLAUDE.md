# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run export` - Build and export static files (used for GitHub Pages)

### Linting and Type Checking
- `npm run lint` - Run ESLint with Next.js configuration
- TypeScript compilation errors will show during `npm run build`

## Architecture Overview

### Framework Stack
- **Next.js 14** with App Router (not Pages Router)
- **TypeScript** (strict mode disabled in tsconfig.json)
- **Tailwind CSS** for styling
- **Local Storage** for game state persistence
- **Static Export** optimized for GitHub Pages deployment

### Project Structure

```
app/                     # Next.js App Router pages
├── layout.tsx          # Root layout with navigation
├── page.tsx            # Game hub homepage
├── globals.css         # Global styles and Tailwind imports
├── slow-roast/         # Slow Roast coffee game
│   └── page.tsx        # Game page and components
├── berg/               # BergInc nightclub incremental game
│   ├── page.tsx        # Main game interface
│   ├── types.ts        # Game state and type definitions
│   ├── utils.ts        # Core game mechanics
│   ├── quotes.ts       # Dynamic quote system
│   ├── audio.ts        # Procedural audio generation
│   ├── test-runner.ts  # Comprehensive test suite
│   └── core/           # Modular game systems
│       ├── engine/     # Core game engine
│       ├── agents/     # Agent behavior system
│       ├── systems/    # ECS-style game systems
│       ├── map/        # Floor layouts and pathfinding
│       └── rendering/  # Visual rendering systems
└── tama/               # Tama Bokujō virtual pet management game
    ├── page.tsx        # Main game interface
    ├── types.ts        # Game state and type definitions
    ├── components/     # UI components and modals
    ├── systems/        # Game logic systems (jobs, contracts)
    ├── services/       # External integrations
    ├── data/           # Static game data (buildings, recipes)
    ├── styles/         # Animation and styling definitions
    └── providers/      # React context providers

lib/                    # Core game logic and utilities
├── gameStateManager.ts # Cross-game state management system
├── slowRoastTypes.ts   # Type definitions for Slow Roast
└── slowRoastUtils.ts   # Game mechanics and calculations

components/             # Reusable UI components
└── SlowRoastComponents.tsx  # Game-specific UI components
```

### Key Architectural Patterns

#### Game State Management
- **Singleton Pattern**: `GameStateManager.getInstance()` provides centralized state
- **Cross-Game Persistence**: Games can access each other's progress via shared localStorage
- **Auto-save**: Games save every 10 seconds during active play
- **Export/Import**: Full data backup system for save transfer

#### Game Framework Design
- **Modular Games**: Each game is a separate route in `/app/game-name/`
- **Shared Components**: Common UI patterns in `/components/`
- **Progressive Unlocks**: Games can check other games' achievements to unlock features
- **Phase-Based Progression**: Games evolve mechanics as player progresses

#### Component Architecture
- **Client Components**: All game logic runs client-side (`'use client'` directive)
- **Composite Components**: Complex UI broken into smaller, focused components
- **State Lifting**: Game state managed at page level, passed down to components

### Game-Specific Patterns (Slow Roast)

#### Core Game Loop
- **Time-Based**: 30 seconds = 1 game day (configurable interval)
- **Event Processing**: `SlowRoastEngine.processDailyEvents()` handles daily progression
- **Resource Management**: Money, reputation, gentrification tracked separately
- **Phase Transitions**: Game mechanics evolve through distinct phases

#### Satirical Design
- **Gentrification Simulator**: Coffee quality improvements increase neighborhood gentrification
- **Moral Complexity**: Success comes with unintended social consequences
- **Achievement System**: Tracks both positive business metrics and negative social impact

## Development Guidelines

### Adding New Games
1. Create new directory in `app/your-game-name/`
2. Add game info to `GAMES` array in `app/page.tsx:18`
3. Use `GameStateManager` for persistence:
   ```typescript
   import { GameStateManager } from '../../lib/gameStateManager';
   const gsm = GameStateManager.getInstance();
   gsm.saveGameState('your-game-id', gameData);
   ```

### Code Conventions
- **Avoid Long Files**: Write modular code - files over 500 lines should rather be broken down into modules.
- **File Naming**: camelCase for TypeScript files, kebab-case for directories
- **Component Structure**: Export default function, interfaces above component
- **Type Safety**: Use TypeScript interfaces for game state and component props
- **CSS Classes**: Utility-first Tailwind, custom classes in globals.css for reusable patterns

### GitHub Pages Deployment
- **Static Export**: `output: 'export'` in next.config.js
- **Base Path**: `/incr` prefix for production (configured automatically)
- **Image Optimization**: Disabled (`unoptimized: true`) for static hosting
- **Trailing Slashes**: Required for GitHub Pages compatibility

### Cross-Game Integration
- **Shared Storage**: Use `incr_games_` prefix for localStorage keys
- **Global Achievements**: Track progress across all games
- **Player Identity**: Player name from any game available to all games
- **Unlock System**: Games can check completion of other games

### Performance Considerations
- **Client-Side Only**: No server-side dependencies
- **Local Storage**: All persistence happens in browser
- **Static Generation**: Optimized builds with Next.js export
- **Lazy Loading**: Components load only when needed

## Testing Requirements

### Test-Driven Development (TDD) - MANDATORY
- **🚨 CRITICAL: ALWAYS write tests first** before implementing ANY features
- **🚨 NO EXCEPTIONS: Follow red-green-refactor cycle strictly**
  1. Write a failing test (RED)
  2. Write minimal code to make it pass (GREEN)
  3. Refactor and improve (REFACTOR)
  4. Repeat for next feature
- **Unit tests** for all game logic and utility functions
- **Integration tests** for component interactions
- **End-to-end tests** for user workflows using Playwright
- **Run tests frequently** during development - test early, test often
- **Test all edge cases** and error conditions
- **Ensure tests pass** before committing any code
- **🔥 VIOLATION WARNING**: Writing implementation before tests violates core methodology

### Testing Commands
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run Jest tests in watch mode during development
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:berg` - Run BergInc comprehensive test suite
- **CRITICAL**: Tests must pass before any deployment or feature completion

### Testing Strategy
- **Red-Green-Refactor cycle**: Write failing test → Make it pass → Improve code
- **Test coverage**: Aim for 80%+ coverage on core game logic
- **Real user scenarios**: E2E tests should simulate actual gameplay
- **Performance testing**: Verify games run smoothly under load
- **Cross-browser testing**: Ensure compatibility across browsers

### BergInc Testing Architecture
BergInc features a comprehensive test suite with modular testing:
- **Core Systems**: Each system (agents, pathfinding, queues) has individual test files
- **Integration Tests**: Full game engine integration testing
- **Headless Testing**: Game logic separated from UI for automated testing
- **Performance Testing**: Crowd simulation performance bounds verification
- **Visual Regression**: Theme and aesthetic progression validation
- **Manual Test Runners**: Node.js scripts for specific system validation

### BergInc Game Architecture
- **ECS Pattern**: Entity-Component-System architecture for game objects
- **Modular Systems**: Independent systems for visitors, queues, reputation, etc.
- **Headless Engine**: Game logic completely separate from React UI
- **Grid-Based Movement**: Pathfinding system with floor layouts
- **Dynamic Theming**: Visual themes evolve as club becomes more commercial
- **Procedural Audio**: Generated audio loops that change with game progression
- **Quote System**: Contextual quotes that reflect the club's transformation

## Animation & UI Design Principles

### Tama Bokujō Animation System
Based on research into thoughtful micro-interactions and delightful feedback in idle/incremental games:

#### Core Animation Principles
- **Meaningful Feedback**: Every user action gets immediate visual response
- **System Status Communication**: Clear visual indicators of loading, progress, and completion states
- **Natural Timing**: Use easing curves that feel organic (cubic-bezier functions)
- **Accessibility First**: Respect `prefers-reduced-motion` for accessibility
- **Performance**: Hardware-accelerated transforms, minimal layout thrashing

#### Animation Timing Scale
- **Instant (100ms)**: Button press feedback, micro-interactions
- **Fast (200ms)**: Hover states, simple transitions
- **Normal (300ms)**: Modal openings, tab switches
- **Slow (500ms)**: Progress bars, celebrations
- **Very Slow (800ms)**: Major state changes, achievements

#### Key Animation Categories
1. **Button States**: Hover lift, active press, ripple effects
2. **Progress Feedback**: XP gains, resource increments, completion celebrations
3. **Modal Transitions**: Smooth backdrop fades, content slide-ins
4. **Card Interactions**: Tama card hover lifts, bounce-in animations
5. **System Status**: Loading states, job assignment feedback, contract progress
6. **Celebrations**: Level ups, achievements, successful completions

#### UI Interaction Catalog
- **Resource Bar**: Animated increment counters with pop-up values
- **Tama Cards**: Hover lift, interaction button feedback, need bar animations
- **Modal Systems**: Backdrop fade, content slide with back-easing
- **Progress Bars**: Smooth fills with shimmer effects, pulse for active states
- **Buttons**: Universal hover lift, active press, success ripple effects
- **Notifications**: Slide-in from right, timed fade-out, celebration pops
- **Job Assignments**: Success feedback, status change animations
- **Contract Progress**: Real-time progress bars, completion celebrations

### Implementation Standards
- Use CSS custom properties for consistent timing/easing
- Leverage Tailwind classes combined with custom CSS animations
- Implement progressive enhancement (animations enhance, don't break functionality)
- Test across devices and respect user motion preferences

## Response Protocol

### Structured Responses
When providing options, analysis, or complex information, use numbered lists with 1-4 levels to offer mindmap-like tree-structured responses:
1. **Main Topic**
   1. Sub-point
   2. Another sub-point
      1. Detail
      2. Another detail
2. **Second Main Topic**
   1. Sub-point with details

This hierarchical structure helps organize complex information and makes it easier to navigate design decisions and implementation details.