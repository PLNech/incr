import { TamaGameState } from '../types';
import { ALL_CRAFTING_ITEMS, CraftingItem } from '../data/japanese-crafting-items';

export interface CraftingProgress {
  // Required original crafting properties
  queue: any[];
  unlockedRecipes: string[];
  // Japanese Crafting System properties (optional for compatibility)
  discoveredRecipes?: Set<string>;
  craftingXP?: number;
  craftingLevel?: number;
  totalItemsCrafted?: number;
  unlockedCategories?: Set<string>;
  hasAlchemyLab?: boolean;
  alchemyLabLevel?: number;
}

export class JapaneseCraftingSystem {
  private allItems: CraftingItem[];

  constructor() {
    this.allItems = ALL_CRAFTING_ITEMS;
  }

  initializeCraftingProgress(): CraftingProgress {
    return {
      // Original crafting system properties
      queue: [],
      unlockedRecipes: [],
      // Japanese crafting system properties
      discoveredRecipes: new Set<string>(),
      craftingXP: 0,
      craftingLevel: 1,
      totalItemsCrafted: 0,
      unlockedCategories: new Set(['food', 'tool']), // Start with basic categories
      hasAlchemyLab: false,
      alchemyLabLevel: 1
    };
  }

  // Get crafting progress from game state or initialize
  getCraftingProgress(gameState: TamaGameState): CraftingProgress {
    if (!gameState.crafting) {
      gameState.crafting = this.initializeCraftingProgress();
    }

    // Initialize Japanese crafting properties if they don't exist
    if (!gameState.crafting.discoveredRecipes) {
      gameState.crafting.discoveredRecipes = new Set<string>();
    }
    if (gameState.crafting.craftingXP === undefined) {
      gameState.crafting.craftingXP = 0;
    }
    if (gameState.crafting.craftingLevel === undefined) {
      gameState.crafting.craftingLevel = 1;
    }
    if (gameState.crafting.totalItemsCrafted === undefined) {
      gameState.crafting.totalItemsCrafted = 0;
    }
    if (!gameState.crafting.unlockedCategories) {
      gameState.crafting.unlockedCategories = new Set(['food', 'tool']);
    }
    if (gameState.crafting.hasAlchemyLab === undefined) {
      gameState.crafting.hasAlchemyLab = false;
    }
    if (gameState.crafting.alchemyLabLevel === undefined) {
      gameState.crafting.alchemyLabLevel = 1;
    }

    // Convert arrays back to Sets if they were serialized
    if (Array.isArray(gameState.crafting.discoveredRecipes)) {
      gameState.crafting.discoveredRecipes = new Set(gameState.crafting.discoveredRecipes);
    }
    if (Array.isArray(gameState.crafting.unlockedCategories)) {
      gameState.crafting.unlockedCategories = new Set(gameState.crafting.unlockedCategories);
    }

    return gameState.crafting;
  }

  // Discover new recipes based on adventure rewards or XP milestones
  discoverRecipe(gameState: TamaGameState, itemId: string): boolean {
    const crafting = this.getCraftingProgress(gameState);
    const item = this.getItemById(itemId);

    if (!item || crafting.discoveredRecipes.has(itemId)) {
      return false; // Item doesn't exist or already discovered
    }

    // Check if player meets requirements to discover this recipe
    if (!this.canDiscoverRecipe(crafting, item)) {
      return false;
    }

    crafting.discoveredRecipes.add(itemId);

    // Award discovery XP
    this.addCraftingXP(gameState, item.discoveryXP);

    // Unlock category if this is first item in category
    crafting.unlockedCategories.add(item.category);

    return true;
  }

  // Check if player can discover a recipe (level requirements, prerequisites)
  private canDiscoverRecipe(crafting: CraftingProgress, item: CraftingItem): boolean {
    // Basic level requirement
    if (item.tier > crafting.craftingLevel) {
      return false;
    }

    // Category must be unlocked
    if (!crafting.unlockedCategories.has(item.category)) {
      return false;
    }

    // For higher tier items, check if prerequisite recipes are known
    if (item.tier > 2 && item.ingredients) {
      const hasAllPrerequisites = item.ingredients.every(ingredient =>
        crafting.discoveredRecipes.has(ingredient.itemId)
      );
      if (!hasAllPrerequisites) {
        return false;
      }
    }

    return true;
  }

  // Main crafting function
  craftItem(gameState: TamaGameState, itemId: string, quantity: number = 1): boolean {
    const crafting = this.getCraftingProgress(gameState);
    const item = this.getItemById(itemId);

    if (!item) {
      return false;
    }

    // Check if recipe is discovered
    if (!crafting.discoveredRecipes.has(itemId) && item.tier > 1) {
      return false;
    }

    // Check if we have required ingredients
    if (!this.hasRequiredIngredients(gameState, item, quantity)) {
      return false;
    }

    // Consume ingredients
    this.consumeIngredients(gameState, item, quantity);

    // Add crafted item to inventory
    if (!gameState.inventory) {
      gameState.inventory = {};
    }
    gameState.inventory[itemId] = (gameState.inventory[itemId] || 0) + quantity;

    // Award crafting XP
    this.addCraftingXP(gameState, item.craftingXP * quantity);

    // Update crafting stats
    crafting.totalItemsCrafted += quantity;

    // Check for tier progression
    this.checkTierProgression(gameState);

    return true;
  }

  private hasRequiredIngredients(gameState: TamaGameState, item: CraftingItem, quantity: number): boolean {
    if (!item.ingredients || item.ingredients.length === 0) {
      return false; // Tier 1 items can't be crafted, only gathered
    }

    return item.ingredients.every(ingredient => {
      const available = gameState.inventory?.[ingredient.itemId] || 0;
      const required = ingredient.quantity * quantity;
      return available >= required;
    });
  }

  private consumeIngredients(gameState: TamaGameState, item: CraftingItem, quantity: number): void {
    if (!item.ingredients || !gameState.inventory) return;

    item.ingredients.forEach(ingredient => {
      const required = ingredient.quantity * quantity;
      gameState.inventory![ingredient.itemId] -= required;
    });
  }

  private addCraftingXP(gameState: TamaGameState, xp: number): void {
    const crafting = this.getCraftingProgress(gameState);
    crafting.craftingXP += xp;

    // Level up calculation (exponential growth)
    const newLevel = Math.floor(Math.sqrt(crafting.craftingXP / 100)) + 1;
    const oldLevel = crafting.craftingLevel;

    if (newLevel > oldLevel) {
      crafting.craftingLevel = newLevel;
      this.onLevelUp(gameState, newLevel);
    }
  }

  private onLevelUp(gameState: TamaGameState, newLevel: number): void {
    const crafting = this.getCraftingProgress(gameState);

    // Unlock new categories at specific levels
    const categoryUnlocks: { [level: number]: string } = {
      3: 'textile',
      5: 'decoration',
      7: 'medicine',
      10: 'toy',
      15: 'spiritual',
      20: 'seasonal'
    };

    if (categoryUnlocks[newLevel]) {
      crafting.unlockedCategories.add(categoryUnlocks[newLevel]);
    }

    // Auto-discover some basic recipes at level milestones
    if (newLevel % 5 === 0) {
      this.autoDiscoverRecipes(gameState, newLevel);
    }
  }

  private autoDiscoverRecipes(gameState: TamaGameState, level: number): void {
    const crafting = this.getCraftingProgress(gameState);
    const tier = Math.min(Math.floor(level / 5), 4);

    // Discover a few random recipes of appropriate tier
    const eligibleItems = this.allItems.filter(item =>
      item.tier === tier &&
      !crafting.discoveredRecipes.has(item.id) &&
      crafting.unlockedCategories.has(item.category)
    );

    // Discover 1-2 random eligible recipes
    const toDiscover = eligibleItems.sort(() => Math.random() - 0.5).slice(0, 2);
    toDiscover.forEach(item => {
      crafting.discoveredRecipes.add(item.id);
    });
  }

  private checkTierProgression(gameState: TamaGameState): void {
    const crafting = this.getCraftingProgress(gameState);

    // Unlock higher tier crafting based on XP thresholds
    const tierThresholds = {
      2: 500,   // Tier 2 unlocked at 500 XP
      3: 2000,  // Tier 3 unlocked at 2000 XP
      4: 8000   // Tier 4 unlocked at 8000 XP
    };

    // Update crafting level based on current XP
    let maxTier = 1;
    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (crafting.craftingXP >= threshold) {
        maxTier = parseInt(tier);
      }
    }

    if (maxTier > crafting.craftingLevel) {
      crafting.craftingLevel = maxTier;
    }
  }

  // Alchemy Lab experimentation system
  experimentInAlchemyLab(gameState: TamaGameState, tamaId: string): { success: boolean; itemId?: string; xp: number } {
    const crafting = this.getCraftingProgress(gameState);

    if (!crafting.hasAlchemyLab) {
      return { success: false, xp: 0 };
    }

    // Base success rate starts low, improves with lab level and tama job level
    const tama = gameState.tamas.find(t => t.id === tamaId);
    if (!tama) {
      return { success: false, xp: 0 };
    }

    // Enhanced success rate calculation using multiple Tama characteristics
    // Intelligence is the primary factor (0-100 → 0-25 bonus points)
    const intelligenceBonus = (tama.genetics.intelligence / 100) * 0.25;

    // Energy affects focus and precision (0-100 → 0-10 bonus points)
    const energyBonus = (tama.needs.energy / 100) * 0.10;

    // Experience matters (level + jobs completed)
    const experienceBonus = ((tama.level * 0.8) + (tama.stats.jobsCompleted * 1.2)) * 0.01;

    // Happiness affects confidence and willingness to take risks (0-100 → 0-8 bonus)
    const happinessBonus = (tama.needs.happiness / 100) * 0.08;

    // Lab level provides base safety and equipment quality
    const labBonus = crafting.alchemyLabLevel * 0.06;

    // Base success rate starts low for safety
    const successRate = Math.min(0.85, Math.max(0.05, 0.10 + labBonus + intelligenceBonus + energyBonus + experienceBonus + happinessBonus));

    const success = Math.random() < successRate;
    const xpReward = success ? 50 : 10;

    if (success) {
      // Discover a random recipe that player hasn't learned yet
      const unknownRecipes = this.allItems.filter(item =>
        !crafting.discoveredRecipes.has(item.id) &&
        item.tier <= crafting.craftingLevel &&
        crafting.unlockedCategories.has(item.category)
      );

      if (unknownRecipes.length > 0) {
        const discoveredItem = unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
        crafting.discoveredRecipes.add(discoveredItem.id);
        this.addCraftingXP(gameState, xpReward);

        return { success: true, itemId: discoveredItem.id, xp: xpReward };
      }
    }

    // Failed experiment still gives some XP
    this.addCraftingXP(gameState, xpReward);
    return { success, xp: xpReward };
  }

  // Utility functions
  getItemById(itemId: string): CraftingItem | undefined {
    return this.allItems.find(item => item.id === itemId);
  }

  getDiscoveredItems(gameState: TamaGameState, tier?: number, category?: string): CraftingItem[] {
    const crafting = this.getCraftingProgress(gameState);

    return this.allItems.filter(item => {
      if (!crafting.discoveredRecipes.has(item.id) && item.tier > 1) return false;
      if (tier && item.tier !== tier) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  }

  getCraftableItems(gameState: TamaGameState): CraftingItem[] {
    const discovered = this.getDiscoveredItems(gameState);

    return discovered.filter(item => {
      if (!item.ingredients) return false;
      return this.hasRequiredIngredients(gameState, item, 1);
    });
  }

  // Purchase Alchemy Lab
  purchaseAlchemyLab(gameState: TamaGameState): boolean {
    const cost = 10000; // 10k tama coins

    if (gameState.resources.tamaCoins >= cost) {
      gameState.resources.tamaCoins -= cost;
      const crafting = this.getCraftingProgress(gameState);
      crafting.hasAlchemyLab = true;
      return true;
    }

    return false;
  }

  // Upgrade Alchemy Lab
  upgradeAlchemyLab(gameState: TamaGameState): boolean {
    const crafting = this.getCraftingProgress(gameState);

    if (!crafting.hasAlchemyLab) return false;

    const cost = crafting.alchemyLabLevel * 5000; // Escalating cost

    if (gameState.resources.tamaCoins >= cost && crafting.alchemyLabLevel < 10) {
      gameState.resources.tamaCoins -= cost;
      crafting.alchemyLabLevel++;
      return true;
    }

    return false;
  }
}