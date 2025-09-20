import { SimpleContract, SimpleContractType } from '../types-simple-contracts';
import { ALL_CRAFTING_ITEMS } from '../data/japanese-crafting-items';

export class SimpleContractGenerator {
  private contractIdCounter = 0;
  private allCraftingItems = ALL_CRAFTING_ITEMS;

  generateRandomContract(): SimpleContract {
    const types: SimpleContractType[] = ['sales', 'crafting', 'care'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
      case 'sales':
        return this.generateSalesContract();
      case 'crafting':
        return this.generateCraftingContract();
      case 'care':
        return this.generateCareContract();
    }
  }

  private generateSalesContract(): SimpleContract {
    const id = `sales-${++this.contractIdCounter}`;

    // Mix traditional resources with Tier 1 crafting materials
    const salesOptions = [
      {
        type: 'rice_grain',
        quantity: 15 + Math.floor(Math.random() * 20),
        pricePerUnit: 4 + Math.floor(Math.random() * 3),
        title: 'Rice Merchant',
        description: 'A traditional sushi restaurant needs premium rice grain for their kitchen.'
      },
      {
        type: 'bamboo_fiber',
        quantity: 8 + Math.floor(Math.random() * 12),
        pricePerUnit: 6 + Math.floor(Math.random() * 4),
        title: 'Bamboo Artisan',
        description: 'Traditional craftsperson needs quality bamboo fiber for handmade tools.'
      },
      {
        type: 'silk_thread',
        quantity: 3 + Math.floor(Math.random() * 6),
        pricePerUnit: 18 + Math.floor(Math.random() * 10),
        title: 'Silk Weaver',
        description: 'Master textile artist seeks finest silk threads for ceremonial kimonos.'
      },
      {
        type: 'green_tea_leaf',
        quantity: 10 + Math.floor(Math.random() * 15),
        pricePerUnit: 7 + Math.floor(Math.random() * 5),
        title: 'Tea Master',
        description: 'Renowned tea ceremony master needs premium green tea leaves.'
      }
    ];

    const option = salesOptions[Math.floor(Math.random() * salesOptions.length)];
    const totalPayment = option.quantity * option.pricePerUnit;

    return {
      id,
      type: 'sales',
      title: option.title,
      description: `${option.description} They need ${option.quantity} ${option.type} and will pay ${option.pricePerUnit} coins each.`,

      requirements: {
        sell: {
          [option.type]: option.quantity
        }
      },

      reward: {
        tamaCoins: totalPayment,
        experience: Math.floor(totalPayment * 0.1) // 10% of payment as XP
      },

      status: 'available',
      timeLimit: 24 + Math.floor(Math.random() * 24), // 24-48 hours
      createdAt: Date.now()
    };
  }

  private generateCraftingContract(): SimpleContract {
    const id = `craft-${++this.contractIdCounter}`;

    // Select random items from different tiers for varied contracts
    const tier2Items = this.allCraftingItems.filter(item => item.tier === 2);
    const tier3Items = this.allCraftingItems.filter(item => item.tier === 3);

    const craftingOptions = [
      // Tier 2 contracts (easier, lower pay)
      ...tier2Items.slice(0, 8).map(item => ({
        itemId: item.id,
        quantity: 2 + Math.floor(Math.random() * 3),
        payment: 60 + Math.floor(Math.random() * 40),
        title: `${item.name} Order`,
        description: `Local artisan needs quality ${item.name.toLowerCase()} for their workshop.`
      })),
      // Tier 3 contracts (harder, higher pay)
      ...tier3Items.slice(0, 6).map(item => ({
        itemId: item.id,
        quantity: 1 + Math.floor(Math.random() * 2),
        payment: 120 + Math.floor(Math.random() * 80),
        title: `Premium ${item.name}`,
        description: `Discerning client seeks expertly crafted ${item.name.toLowerCase()}.`
      })),
      // Classic Tamagotchi items with special bonus
      {
        itemId: 'bread',
        quantity: 3 + Math.floor(Math.random() * 4),
        payment: 80,
        title: '🎮 Classic Tama Bread',
        description: 'Nostalgic Tama owner wants authentic bread just like the original game!'
      },
      {
        itemId: 'hamburger',
        quantity: 2 + Math.floor(Math.random() * 2),
        payment: 150,
        title: '🎮 Retro Hamburger',
        description: 'Collector needs vintage-style hamburgers for their classic Tama collection.'
      }
    ];

    const option = craftingOptions[Math.floor(Math.random() * Math.min(craftingOptions.length, 20))];

    return {
      id,
      type: 'crafting',
      title: option.title,
      description: `${option.description} They need ${option.quantity} ${option.itemId.replace('_', ' ')}${option.quantity > 1 ? 's' : ''}.`,

      requirements: {
        craft: {
          itemId: option.itemId,
          quantity: option.quantity
        }
      },

      reward: {
        tamaCoins: option.payment,
        experience: Math.floor(option.payment * 0.12) // 12% as XP
      },

      status: 'available',
      timeLimit: 48 + Math.floor(Math.random() * 24), // 48-72 hours
      createdAt: Date.now()
    };
  }

  private generateCareContract(): SimpleContract {
    const id = `care-${++this.contractIdCounter}`;

    const careOptions = [
      {
        minTamas: 1,
        minHappiness: 70,
        minHealth: 80,
        duration: 12,
        payment: 120,
        title: 'Weekend Pet Sitting',
        description: 'Traveling family needs someone to care for their beloved Tama while away.'
      },
      {
        minTamas: 2,
        minHappiness: 60,
        minHealth: 70,
        duration: 24,
        payment: 300,
        title: 'Tama Daycare Service',
        description: 'Local daycare needs experienced caretaker for multiple Tamas.'
      },
      {
        minTamas: 1,
        minHappiness: 80,
        minHealth: 90,
        duration: 6,
        payment: 80,
        title: 'Premium Care Demo',
        description: 'High-end Tama spa wants to see your premium care techniques.'
      }
    ];

    const option = careOptions[Math.floor(Math.random() * careOptions.length)];

    return {
      id,
      type: 'care',
      title: option.title,
      description: `${option.description} Keep ${option.minTamas} Tama${option.minTamas > 1 ? 's' : ''} at ${option.minHappiness}% happiness and ${option.minHealth}% health for ${option.duration} hours.`,

      requirements: {
        care: {
          minimumTamas: option.minTamas,
          minimumHappiness: option.minHappiness,
          minimumHealth: option.minHealth,
          duration: option.duration
        }
      },

      reward: {
        tamaCoins: option.payment,
        rice_grain: Math.floor(option.duration / 8) * 3, // 3 rice per 8 hours
        green_tea_leaf: Math.floor(option.duration / 12) * 2, // 2 tea per 12 hours
        experience: Math.floor(option.payment * 0.15) // 15% as XP
      },

      status: 'available',
      timeLimit: 12 + Math.floor(Math.random() * 12), // 12-24 hours to accept
      createdAt: Date.now()
    };
  }
}