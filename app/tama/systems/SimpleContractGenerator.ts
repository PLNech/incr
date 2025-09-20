import { SimpleContract, SimpleContractType } from '../types-simple-contracts';

export class SimpleContractGenerator {
  private contractIdCounter = 0;

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

    // Different sales options
    const salesOptions = [
      {
        type: 'berries',
        quantity: 15 + Math.floor(Math.random() * 20),
        pricePerUnit: 3 + Math.floor(Math.random() * 2),
        title: 'Berry Buyer',
        description: 'A local merchant wants to purchase fresh berries for their market stall.'
      },
      {
        type: 'wood',
        quantity: 8 + Math.floor(Math.random() * 12),
        pricePerUnit: 8 + Math.floor(Math.random() * 4),
        title: 'Wood Supplier Needed',
        description: 'Construction company needs quality wood for their latest project.'
      },
      {
        type: 'stone',
        quantity: 5 + Math.floor(Math.random() * 8),
        pricePerUnit: 15 + Math.floor(Math.random() * 8),
        title: 'Stone Mason Request',
        description: 'Artisan stone mason is looking for high-quality stone materials.'
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

    const craftingOptions = [
      {
        itemId: 'basic_food',
        quantity: 3 + Math.floor(Math.random() * 4),
        payment: 80,
        title: 'Food Delivery',
        description: 'Busy Tama owner needs prepared meals for their pets.'
      },
      {
        itemId: 'premium_food',
        quantity: 2 + Math.floor(Math.random() * 2),
        payment: 150,
        title: 'Gourmet Catering',
        description: 'Upscale Tama daycare wants premium food for their clients.'
      },
      {
        itemId: 'simple_toy',
        quantity: 2 + Math.floor(Math.random() * 3),
        payment: 100,
        title: 'Toy Commission',
        description: 'Parents want handmade toys for their children\'s Tamas.'
      },
      {
        itemId: 'complex_toy',
        quantity: 1 + Math.floor(Math.random() * 2),
        payment: 200,
        title: 'Custom Toy Order',
        description: 'Collector seeks rare, complex toys for their premium Tama collection.'
      }
    ];

    const option = craftingOptions[Math.floor(Math.random() * craftingOptions.length)];

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
        berries: Math.floor(option.duration / 6) * 5, // 5 berries per 6 hours
        experience: Math.floor(option.payment * 0.15) // 15% as XP
      },

      status: 'available',
      timeLimit: 12 + Math.floor(Math.random() * 12), // 12-24 hours to accept
      createdAt: Date.now()
    };
  }
}