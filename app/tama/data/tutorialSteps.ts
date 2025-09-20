// Tutorial step definitions for different modals

export interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  buildings: [
    {
      title: "Welcome to Buildings!",
      description: "Buildings provide automation and bonuses to help your Tamas grow. Each building has unique effects that enhance your gameplay experience."
    },
    {
      title: "Building Categories",
      description: "Buildings are organized by type: Habitat (housing), Workshop (crafting), Automation (auto-care), Decoration (happiness), and Prestige (powerful upgrades).",
      target: "[data-tutorial='building-categories']"
    },
    {
      title: "Resource Requirements",
      description: "Each building costs resources to construct. Make sure you have enough materials before building. Hover over buildings to see their effects.",
      target: "[data-tutorial='building-cost']"
    },
    {
      title: "Building Effects",
      description: "Buildings provide various bonuses like increased Tama capacity, faster crafting, passive income, and automation. Check the effects before building!",
      target: "[data-tutorial='building-effects']"
    },
    {
      title: "Level Requirements",
      description: "Advanced buildings unlock as you level up. Focus on simpler buildings first, then unlock more powerful ones as you progress."
    }
  ],

  crafting: [
    {
      title: "Welcome to Crafting!",
      description: "Crafting lets you create items to care for your Tamas. You can make food, toys, equipment, and even buildings through crafting."
    },
    {
      title: "Recipe Categories",
      description: "Recipes are organized into Food (nutrition), Toys (happiness), Equipment (stat boosts), and Buildings (construction materials).",
      target: "[data-tutorial='recipe-categories']"
    },
    {
      title: "Ingredients & Resources",
      description: "Each recipe requires specific ingredients. Make sure you have enough resources before starting. Some recipes use items you've crafted before.",
      target: "[data-tutorial='recipe-ingredients']"
    },
    {
      title: "Crafting Queue",
      description: "Items take time to craft. You can queue multiple items and they'll craft automatically. Your queue shows progress and estimated completion times.",
      target: "[data-tutorial='crafting-queue']"
    },
    {
      title: "Experience & Unlocks",
      description: "Crafting grants experience and unlocks new recipes as you level up. Experiment with different items to discover what works best for your Tamas!"
    }
  ],

  contracts: [
    {
      title: "Welcome to Contracts!",
      description: "Contracts let other people hire your Tamas for jobs. This is a great way to earn resources while giving your Tamas purpose and experience."
    },
    {
      title: "Customer Types",
      description: "Different customers have different preferences and pay different amounts. Wealthy customers pay more but have higher standards.",
      target: "[data-tutorial='customer-list']"
    },
    {
      title: "Contract Requirements",
      description: "Each contract has duration and care requirements. Make sure your Tama can meet the customer's needs before accepting!",
      target: "[data-tutorial='contract-requirements']"
    },
    {
      title: "Tama Assignment",
      description: "Assign the right Tama for each job. Consider their level, needs, and personality. Happy, well-cared Tamas perform better on contracts.",
      target: "[data-tutorial='tama-assignment']"
    },
    {
      title: "Payments & Reputation",
      description: "Successfully completed contracts earn money and improve your reputation. Failed contracts hurt your reputation, so choose carefully!"
    }
  ],

  adventures: [
    {
      title: "Welcome to Adventures!",
      description: "Adventures let your Tamas explore the world and bring back rare resources, items, and experience. Each adventure is a unique journey!"
    },
    {
      title: "Adventure Locations",
      description: "Different locations offer different rewards and challenges. Start with safer locations and work your way up to more dangerous expeditions.",
      target: "[data-tutorial='location-list']"
    },
    {
      title: "Risk vs Reward",
      description: "Higher risk adventures offer better rewards but have lower success rates. Consider your Tama's stats and condition before sending them out.",
      target: "[data-tutorial='risk-indicator']"
    },
    {
      title: "Tama Preparation",
      description: "Make sure your Tama is well-fed, happy, and energetic before adventures. Their stats affect success rates and the quality of rewards they find.",
      target: "[data-tutorial='tama-stats']"
    },
    {
      title: "Adventure Progress",
      description: "Active adventures show progress in real-time. You can track multiple adventures simultaneously and see estimated completion times.",
      target: "[data-tutorial='active-adventures']"
    },
    {
      title: "Inventory & Items",
      description: "Items found during adventures are stored in your inventory. Some items can be sold for coins, others might be used for crafting or trading."
    }
  ],

  skills: [
    {
      title: "Welcome to Skills!",
      description: "Skills provide permanent bonuses that make caring for your Tamas more efficient and rewarding. Choose your specialization carefully!"
    },
    {
      title: "Skill Categories",
      description: "There are three main paths: Caretaker (Tama care bonuses), Breeder (genetics and breeding), and Entrepreneur (business and contracts).",
      target: "[data-tutorial='skill-trees']"
    },
    {
      title: "Skill Points",
      description: "You earn skill points by leveling up and completing achievements. Spend them wisely - you can't easily change your choices later!",
      target: "[data-tutorial='skill-points']"
    },
    {
      title: "Prerequisites",
      description: "Advanced skills require you to learn prerequisite skills first. Plan your build path to unlock the most powerful abilities.",
      target: "[data-tutorial='skill-prerequisites']"
    },
    {
      title: "Specialization Bonus",
      description: "Focusing on one skill tree gives powerful specialization bonuses. But don't ignore the other trees completely - balance is key!"
    }
  ]
};