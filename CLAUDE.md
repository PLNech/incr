# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run export` - Build and export static files (used for GitHub Pages)

### Linting and Type Checking
No specific lint or typecheck commands configured. TypeScript compilation errors will show during `npm run build`.

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
└── slow-roast/         # Game-specific pages
    └── page.tsx        # Slow Roast game page

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

## Next Steps for BERG Project
The README indicates the next major project is "Le BergInc" - a Berghain-themed incremental game. When implementing:
- Follow the same modular game architecture
- Create new directory `app/berg/` 
- Add game logic in `lib/bergTypes.ts` and `lib/bergUtils.ts`
- Use the cross-game state system for unlock mechanics