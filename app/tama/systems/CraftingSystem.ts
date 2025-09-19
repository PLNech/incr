import { TamaGameState, Recipe, CraftingQueue, Item, TamaTier } from '../types';
import { RECIPES, ITEMS, QUALITY_MULTIPLIERS, QUALITY_NAMES, QUALITY_DISTRIBUTION } from '../data/recipes';

export interface CraftingResult {
  success: boolean;
  message: string;
  queueId?: string;
}

export interface CompletedCraft {
  recipeId: string;
  quantity: number;
  items: Item[];
  queueId: string;
}

export class CraftingSystem {
  private recipes: Recipe[];
  private items: Record<string, Item>;

  constructor() {
    this.recipes = [...RECIPES];
    this.items = { ...ITEMS };
  }

  // Recipe management
  getAvailableRecipes(gameState: TamaGameState): Recipe[] {
    return this.recipes.filter(recipe => {
      // Check if recipe is unlocked
      if (!gameState.crafting.unlockedRecipes.includes(recipe.id)) {
        return false;
      }

      // Check if player level is sufficient
      if (gameState.progression.level < recipe.requiredLevel) {
        return false;
      }

      return true;
    });
  }

  getRecipe(recipeId: string): Recipe | null {
    return this.recipes.find(r => r.id === recipeId) || null;
  }

  // Resource requirements
  getResourceRequirements(recipeId: string, quantity: number = 1): Record<string, number> {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return {};

    const requirements: Record<string, number> = {};

    recipe.ingredients.forEach(ingredient => {
      requirements[ingredient.itemId] = (requirements[ingredient.itemId] || 0) +
                                         (ingredient.quantity * quantity);
    });

    return requirements;
  }

  canCraft(recipeId: string, gameState: TamaGameState, quantity: number = 1): boolean {
    const requirements = this.getResourceRequirements(recipeId, quantity);

    for (const [resource, amount] of Object.entries(requirements)) {
      if (resource in gameState.resources) {
        if ((gameState.resources as any)[resource] < amount) {
          return false;
        }
      } else {
        return false; // Unknown resource
      }
    }

    return true;
  }

  // Crafting queue management
  startCrafting(recipeId: string, quantity: number, gameState: TamaGameState): CraftingResult {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      return {
        success: false,
        message: `Recipe ${recipeId} not found`
      };
    }

    // Check if recipe is available
    const availableRecipes = this.getAvailableRecipes(gameState);
    if (!availableRecipes.some(r => r.id === recipeId)) {
      return {
        success: false,
        message: `Recipe ${recipe.name} is not available`
      };
    }

    // Check resources
    if (!this.canCraft(recipeId, gameState, quantity)) {
      return {
        success: false,
        message: `Insufficient resources for ${recipe.name}`
      };
    }

    // Consume resources
    const requirements = this.getResourceRequirements(recipeId, quantity);
    Object.entries(requirements).forEach(([resource, amount]) => {
      if (resource in gameState.resources) {
        (gameState.resources as any)[resource] -= amount;
      }
    });

    // Add to crafting queue
    const queueId = `craft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const craftTime = recipe.craftTime * this.getCraftingTimeMultiplier(gameState);

    const queueItem: CraftingQueue = {
      id: queueId,
      recipeId: recipe.id,
      startTime,
      endTime: startTime + craftTime,
      quantity
    };

    gameState.crafting.queue.push(queueItem);

    return {
      success: true,
      message: `Started crafting ${quantity}x ${recipe.name}`,
      queueId
    };
  }

  private getCraftingTimeMultiplier(gameState: TamaGameState): number {
    // Base multiplier
    let multiplier = 1.0;

    // Skill tree bonuses (when implemented)
    const crafterSkills = gameState.progression.skillTree?.crafter;
    if (crafterSkills?.speedBoost) {
      multiplier *= (1 - crafterSkills.speedBoost * 0.1); // 10% faster per level
    }

    // Building bonuses (when implemented)
    // TODO: Check for automation buildings that speed up crafting

    return Math.max(0.1, multiplier); // Minimum 10% of original time
  }

  processQueue(gameState: TamaGameState): CompletedCraft[] {
    const now = Date.now();
    const completedItems: CompletedCraft[] = [];
    const remainingQueue: CraftingQueue[] = [];

    gameState.crafting.queue.forEach(queueItem => {
      if (now >= queueItem.endTime) {
        // Craft completed
        const recipe = this.getRecipe(queueItem.recipeId);
        if (recipe) {
          const craftedItems: Item[] = [];

          // Generate items with quality
          for (let i = 0; i < queueItem.quantity; i++) {
            recipe.outputs.forEach(output => {
              for (let j = 0; j < output.quantity; j++) {
                const quality = this.generateItemQuality();
                const item = this.applyQuality(output.itemId, quality);
                craftedItems.push(item);
              }
            });
          }

          completedItems.push({
            recipeId: queueItem.recipeId,
            quantity: queueItem.quantity,
            items: craftedItems,
            queueId: queueItem.id
          });
        }
      } else {
        // Still crafting
        remainingQueue.push(queueItem);
      }
    });

    gameState.crafting.queue = remainingQueue;
    return completedItems;
  }

  // Quality system
  generateItemQuality(): TamaTier {
    const roll = Math.random() * 100;

    if (roll < QUALITY_DISTRIBUTION[0]) return 0;
    if (roll < QUALITY_DISTRIBUTION[0] + QUALITY_DISTRIBUTION[1]) return 1;
    if (roll < QUALITY_DISTRIBUTION[0] + QUALITY_DISTRIBUTION[1] + QUALITY_DISTRIBUTION[2]) return 2;
    return 3;
  }

  applyQuality(itemId: string, quality: TamaTier): Item {
    const baseItem = this.items[itemId];
    if (!baseItem) {
      throw new Error(`Item ${itemId} not found`);
    }

    const qualifiedItem: Item = {
      ...baseItem,
      tier: quality,
      name: quality > 0 ? `${QUALITY_NAMES[quality]} ${baseItem.name}` : baseItem.name
    };

    // Apply quality multiplier to effects
    if (baseItem.effects && quality > 0) {
      const multiplier = QUALITY_MULTIPLIERS[quality];
      qualifiedItem.effects = {};

      Object.entries(baseItem.effects).forEach(([effect, value]) => {
        if (typeof value === 'number') {
          (qualifiedItem.effects as any)[effect] = Math.floor(value * multiplier);
        } else {
          (qualifiedItem.effects as any)[effect] = value;
        }
      });
    }

    return qualifiedItem;
  }

  // Automation support
  getAutomationLevel(gameState: TamaGameState): number {
    // TODO: Implement when buildings are added
    return 0;
  }

  // Discovery system
  discoverRandomRecipe(gameState: TamaGameState): Recipe | null {
    const undiscovered = this.recipes.filter(recipe =>
      !gameState.crafting.unlockedRecipes.includes(recipe.id) &&
      gameState.progression.level >= recipe.requiredLevel
    );

    if (undiscovered.length === 0) return null;

    const discovered = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    gameState.crafting.unlockedRecipes.push(discovered.id);

    return discovered;
  }

  // Utility methods
  getCraftingProgress(queueItem: CraftingQueue): number {
    const now = Date.now();
    const totalTime = queueItem.endTime - queueItem.startTime;
    const elapsed = now - queueItem.startTime;

    return Math.min(1.0, Math.max(0.0, elapsed / totalTime));
  }

  getTimeRemaining(queueItem: CraftingQueue): number {
    return Math.max(0, queueItem.endTime - Date.now());
  }
}