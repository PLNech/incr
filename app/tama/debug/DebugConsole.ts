'use client';

import { TamaEngine } from '../engine/TamaEngine';

/**
 * Debug console for Tama Bokujō development and testing
 * Provides shortcuts to test late game features without grinding
 */
export class DebugConsole {
  private engine: TamaEngine | null = null;

  setEngine(engine: TamaEngine) {
    this.engine = engine;
  }

  private requireEngine() {
    if (!this.engine) {
      throw new Error('Engine not available. Make sure you\'re in the Tama game.');
    }
    return this.engine;
  }

  // Experience & Levels
  addXP(amount: number = 1000) {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    // Use the public grantExperience method which handles level up checks automatically
    engine.getSystems().progression.grantExperience(gameState, 'tama_interaction', amount);
    console.log(`Added ${amount} XP. Current: ${gameState.progression.experience} (Level ${gameState.progression.level})`);
  }

  setLevel(level: number) {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    gameState.progression.level = level;
    gameState.progression.experience = engine.getSystems().progression.getExperienceRequiredForLevel(level);
    console.log(`Set to Level ${level} with ${gameState.progression.experience} XP`);
  }

  addSkillPoints(amount: number = 20) {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    gameState.progression.skillPoints += amount;
    console.log(`Added ${amount} skill points. Total: ${gameState.progression.skillPoints}`);
  }

  // Resources
  addCoins(amount: number = 10000) {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    gameState.resources.tamaCoins += amount;
    console.log(`Added ${amount} coins. Total: ${gameState.resources.tamaCoins}`);
  }

  addAllResources(multiplier: number = 1000) {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    gameState.resources.tamaCoins += 1000 * multiplier;
    gameState.resources.berries += 500 * multiplier;
    gameState.resources.wood += 200 * multiplier;
    gameState.resources.stone += 100 * multiplier;
    gameState.resources.evolutionCrystals += 50 * multiplier;
    console.log(`Added resources (x${multiplier}):`, gameState.resources);
  }

  // Tama Management
  boostAllTamas() {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    gameState.tamas.forEach(tama => {
      tama.level = 10;
      tama.experience = 1000;
      tama.needs.hunger = 100;
      tama.needs.happiness = 100;
      tama.needs.energy = 100;
      tama.needs.cleanliness = 100;
      tama.tier = 2;
    });
    console.log(`Boosted ${gameState.tamas.length} Tamas to level 10, tier 2, full needs`);
  }

  createSuperTama(name: string = 'DebugTama') {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    engine.createTama(name);
    const newTama = gameState.tamas[gameState.tamas.length - 1];
    if (newTama) {
      newTama.level = 25;
      newTama.tier = 3;
      newTama.experience = 5000;
      newTama.genetics = {
        cuteness: 95,
        intelligence: 95,
        energy: 95,
        appetite: 20
      };
      newTama.needs = {
        hunger: 100,
        happiness: 100,
        energy: 100,
        cleanliness: 100
      };
      console.log(`Created super Tama: ${name} (Level 25, Tier 3)`);
    }
  }

  // Progression Testing
  skipToMidGame() {
    this.setLevel(15);
    this.addSkillPoints(50);
    this.addAllResources(100);
    this.boostAllTamas();
    console.log('🎮 Skipped to mid-game: Level 15, 50 skill points, boosted resources & Tamas');
  }

  skipToLateGame() {
    this.setLevel(40);
    this.addSkillPoints(200);
    this.addAllResources(1000);
    this.boostAllTamas();
    this.createSuperTama('EliteTama1');
    this.createSuperTama('EliteTama2');
    console.log('🚀 Skipped to late-game: Level 40, 200 skill points, maxed resources & elite Tamas');
  }

  prepareForPrestige() {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();

    this.setLevel(50);
    this.addAllResources(10000);

    // Create 5 Tamas, 2 at tier 3+
    for (let i = 0; i < 5; i++) {
      engine.createTama(`PrestigeTama${i + 1}`);
    }

    // Make 2 of them tier 3
    gameState.tamas.slice(-2).forEach((tama, index) => {
      tama.tier = 3;
      tama.level = 30;
      tama.experience = 8000;
    });

    console.log('✨ Ready for prestige: Level 50, 5 Tamas (2 tier 3+), rich resources');
  }

  // Utility
  showGameState() {
    const engine = this.requireEngine();
    const gameState = engine.getGameState();
    console.log('🎮 Current Game State:', {
      level: gameState.progression.level,
      xp: gameState.progression.experience,
      skillPoints: gameState.progression.skillPoints,
      specialization: gameState.progression.specialization,
      prestigeLevel: gameState.progression.prestigeLevel,
      resources: gameState.resources,
      tamasCount: gameState.tamas.length,
      unlocks: gameState.unlocks
    });
  }

  resetGame() {
    if (confirm('⚠️ This will reset ALL game progress. Are you sure?')) {
      const engine = this.requireEngine();
      // Reset to initial state by creating a fresh engine instance
      // This will clear all progress and start fresh
      if (typeof window !== 'undefined') {
        localStorage.removeItem('incr_games_tama');
        window.location.reload();
      }
      console.log('🔄 Game reset complete - page reloading');
    }
  }

  help() {
    console.log(`
🐾 Tama Bokujō Debug Console Help 🐾

=== Quick Progression ===
debug.skipToMidGame()     - Jump to level 15 with resources
debug.skipToLateGame()    - Jump to level 40 with elite setup
debug.prepareForPrestige() - Setup for first prestige

=== Experience & Levels ===
debug.addXP(1000)         - Add experience points
debug.setLevel(25)        - Set player level directly
debug.addSkillPoints(50)  - Add skill points

=== Resources ===
debug.addCoins(10000)     - Add Tama coins
debug.addAllResources(1000) - Add all resources (x multiplier)

=== Tamas ===
debug.boostAllTamas()     - Max out all current Tamas
debug.createSuperTama('Name') - Create level 25, tier 3 Tama

=== Utility ===
debug.showGameState()     - Display current progress
debug.resetGame()         - Reset everything (with confirmation)
debug.help()              - Show this help

Happy testing! 🎮✨
    `);
  }
}

// Make debug console available globally in development
const debugConsole = new DebugConsole();

declare global {
  interface Window {
    tamaDebug: DebugConsole;
    debug: DebugConsole;
  }
}

if (typeof window !== 'undefined') {
  window.tamaDebug = debugConsole;
  window.debug = debugConsole; // Shorter alias
}

export default debugConsole;