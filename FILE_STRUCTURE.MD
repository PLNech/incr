# Slow Roast Game - Complete File Structure

## 📁 Project Setup Files

### `package.json`
- Project dependencies and scripts
- Includes Next.js, React, TypeScript, and Tailwind CSS
- Build scripts for GitHub Pages deployment

### `next.config.js` 
- Next.js configuration for static export
- GitHub Pages compatibility settings
- Base path and asset prefix configuration

### `tsconfig.json`
- TypeScript configuration
- Path aliases and compiler options

### `tailwind.config.js`
- Tailwind CSS configuration
- Custom coffee-themed colors and animations
- Purge settings for production builds

### `postcss.config.js`
- PostCSS configuration for Tailwind CSS
- Autoprefixer setup

### `next-env.d.ts`
- TypeScript environment definitions for Next.js

## 🚀 Deployment Files

### `.github/workflows/deploy.yml`
- GitHub Actions workflow for automatic deployment
- Builds and deploys to GitHub Pages on push to main

## 🎮 Game Framework Files

### `lib/gameStateManager.ts`
- **Cross-game state management system**
- Handles saving/loading game data in localStorage
- Manages global achievements and cross-game unlocks
- Export/import functionality for data backup

### `lib/slowRoastTypes.ts`
- **Type definitions for Slow Roast game**
- Interfaces for game state, resources, customers, etc.
- Game constants and initial data
- Achievement and upgrade definitions

### `lib/slowRoastUtils.ts`
- **Game mechanics and calculations**
- Daily event processing
- Customer visit calculations
- Achievement checking system
- Game phase progression logic

## 🖼️ UI Components

### `app/layout.tsx`
- Root layout component
- Navigation header and footer
- Global styling setup

### `app/globals.css`
- Global CSS styles
- Tailwind CSS imports
- Custom game-specific CSS classes

### `app/page.tsx` 
- **Main game hub/homepage**
- Lists available games
- Shows cross-game progress
- Game unlock system

### `components/SlowRoastComponents.tsx`
- **Reusable UI components for Slow Roast**
- ResourceDisplay, CustomerSegmentCard, DailyLog
- WisdomToast, ActionButton, ShopSetup