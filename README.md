# incr 🏭

La incr factory 

A collection of interconnected incremental games built with Next.js and deployed on GitHub Pages.

## Current Games

### ☕ Slow Roast
Build a specialty coffee empire in Amsterdam! Start with a small café and grow into a coffee culture influencer. Features:
- **Resource Management**: Coffee beans, money, reputation, knowledge, and more
- **Customer Education**: Teach different neighborhood segments about specialty coffee
- **James Hoffman Wisdom**: Learn from the coffee master
- **Progressive UI**: Even the upgrades menu needs to be unlocked!
- **Nook Coffee Supplies**: Navigate business relationships with a certain raccoon
- **Neighborhood Dynamics**: Watch as your success changes the area around you

## External Games

### 🥨 StrudleIdle
Become the ultimate pastry chef in this idle game. Bake delicious strudels, unlock new recipes, and expand your bakery empire.
- **Play Game**: [StrudleIdle](/strudle-idle)
- **GitHub**: [https://github.com/example/strudle-idle](https://github.com/example/strudle-idle)

### 💻 Le Dernier Code
A text-based adventure game where you must solve puzzles and uncover secrets to find the last piece of working code in a post-apocalyptic world.
- **Play Game**: [Le Dernier Code](/le-dernier-code)
- **GitHub**: [https://github.com/example/le-dernier-code](https://github.com/example/le-dernier-code)

### 🌐 Propagation Inc.
Manage a network of information and watch it spread. Make strategic decisions to control the narrative and achieve global influence.
- **Play Game**: [Propagation Inc.](/propagation-inc)
- **GitHub**: [https://github.com/example/propagation-inc](https://github.com/example/propagation-inc)

## Setup Instructions for GitHub Pages

### 1. Create GitHub Repository
1. Create a new repository named `incr` (or whatever you prefer)
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"

### 2. File Structure
Create these files in your repository:

```
incr/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── slow-roast/
│       └── page.tsx
└── lib/
    └── gameStateManager.ts
```

### 3. Installation & Development

**Using GitHub.dev (Browser-only):**
1. Go to your repository
2. Press `.` to open GitHub.dev
3. Copy all the artifact files into the correct locations
4. Commit and push changes
5. GitHub Actions will automatically build and deploy

**Local Development:**
```bash
npm install
npm run dev
```

**Build for Production:**
```bash
npm run build
npm run export
```

### 4. GitHub Pages Configuration
1. In your repository, go to Settings → Pages
2. Set Source to "GitHub Actions"
3. The workflow will automatically deploy on every push to `main`

### 5. Access Your Games
Once deployed, your games will be available at:
- `https://yourusername.github.io/incr/` - Game selection hub
- `https://yourusername.github.io/incr/slow-roast/` - Coffee shop game

## Game Framework Features

### Cross-Game State Management
- **Shared Storage**: Games can access each other's progress
- **Global Achievements**: Unlock bonuses across all games
- **Progressive Unlocks**: Complete one game to unlock the next
- **Persistent Identity**: Your name and progress carry forward

### Local Storage System
- **No External Dependencies**: Everything runs in the browser
- **Auto-save**: Games save progress automatically
- **Export/Import**: Backup and restore your progress
- **Cross-Game Integration**: Games can reference each other's data

## Adding New Games

To add a new game to the framework:

1. Create a new directory in `app/your-game-name/`
2. Add the game info to the `GAMES` array in `app/page.tsx`
3. Use the `GameStateManager` for persistence:
   ```typescript
   import { GameStateManager } from '../../lib/gameStateManager';
   
   const gsm = GameStateManager.getInstance();
   gsm.saveGameState('your-game-id', gameData);
   const savedData = gsm.loadGameState('your-game-id');
   ```

## Architecture

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety throughout
- **Tailwind CSS**: Utility-first styling
- **Local Storage**: Client-side persistence
- **GitHub Actions**: Automated deployment
- **Static Export**: Optimized for GitHub Pages

## Development Notes

- **No Server Required**: Everything runs client-side
- **Mobile Friendly**: Responsive design for all screen sizes
- **Offline Capable**: Games work without internet after initial load
- **Performance**: Optimized builds with static generation

## Contributing

Each game should follow these principles:
- **Start Simple**: Begin with minimal mechanics, add complexity gradually
- **Progressive Disclosure**: UI elements unlock as player progresses
- **Cross-Game Awareness**: Check for achievements/progress in other games
- **Thematic Coherence**: Games should feel connected to the broader world

---

## Game Design Philosophy

The Incremental Games Factory focuses on:
1. **Meaningful Progression**: Every action should feel purposeful
2. **Interconnected Systems**: Games reference and unlock each other
3. **Social Commentary**: Games can explore themes through mechanics
4. **Automation Balance**: Manual play that gradually becomes hands-off
5. **Discovery**: Let players uncover mechanics organically

Happy building! ☕🏭