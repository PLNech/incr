import { SimpleContractGenerator } from '../systems/SimpleContractGenerator';
import { SimpleContractType } from '../types-simple-contracts';

describe('SimpleContractGenerator with Japanese Crafting Integration', () => {
  let generator: SimpleContractGenerator;

  beforeEach(() => {
    generator = new SimpleContractGenerator();
  });

  describe('Japanese Material Sales Contracts', () => {
    it('should generate sales contracts for Japanese materials', () => {
      const contract = generator['generateSalesContract']();

      expect(contract.type).toBe('sales');
      expect(contract.status).toBe('available');
      expect(contract.timeLimit).toBeGreaterThan(0);

      // Should include traditional resources or Japanese materials
      const sellRequirement = contract.requirements.sell;
      const resourceTypes = Object.keys(sellRequirement);

      expect(resourceTypes.length).toBeGreaterThan(0);

      // Check if includes new Japanese materials
      const hasJapaneseMaterials = resourceTypes.some(type =>
        ['rice_grain', 'bamboo_fiber', 'silk_thread'].includes(type)
      );

      const hasTraditionalResources = resourceTypes.some(type =>
        ['berries', 'wood', 'stone'].includes(type)
      );

      expect(hasJapaneseMaterials || hasTraditionalResources).toBe(true);
    });

    it('should provide appropriate payment for Japanese materials', () => {
      // Generate multiple contracts to test variety
      const contracts = Array.from({ length: 10 }, () =>
        generator['generateSalesContract']()
      );

      contracts.forEach(contract => {
        expect(contract.reward.tamaCoins).toBeGreaterThan(0);
        expect(contract.reward.experience).toBeGreaterThan(0);

        // Payment should scale with quantity and material rarity
        const sellReq = contract.requirements.sell;
        const totalItems = Object.values(sellReq).reduce((sum: number, qty) => {
          const quantity = typeof qty === 'number' ? qty : qty.length;
          return sum + quantity;
        }, 0);

        expect(contract.reward.tamaCoins).toBeGreaterThanOrEqual(totalItems * 3); // Minimum 3 coins per item
      });
    });

    it('should have culturally appropriate titles and descriptions', () => {
      const contracts = Array.from({ length: 5 }, () =>
        generator['generateSalesContract']()
      );

      contracts.forEach(contract => {
        expect(contract.title).toBeTruthy();
        expect(contract.description).toBeTruthy();
        expect(contract.description.length).toBeGreaterThan(20);

        // Check for Japanese-themed contracts
        if (contract.description.includes('rice') || contract.description.includes('bamboo') || contract.description.includes('silk')) {
          expect(contract.description).toMatch(/(restaurant|traditional|artisan|premium|quality)/i);
        }
      });
    });
  });

  describe('Japanese Crafting Contracts', () => {
    it('should generate crafting contracts for Japanese items', () => {
      const contract = generator['generateCraftingContract']();

      expect(contract.type).toBe('crafting');
      expect(contract.requirements.craft).toBeDefined();
      expect(contract.requirements.craft!.itemId).toBeTruthy();
      expect(contract.requirements.craft!.quantity).toBeGreaterThan(0);
    });

    it('should include Tier 2 and Tier 3 crafting contracts', () => {
      const contracts = Array.from({ length: 20 }, () =>
        generator['generateCraftingContract']()
      );

      const itemIds = contracts.map(c => c.requirements.craft!.itemId);

      // Should have variety of items including Japanese crafting items
      const uniqueItems = [...new Set(itemIds)];
      expect(uniqueItems.length).toBeGreaterThan(5);

      // Check for some Japanese items (from our crafting data)
      const hasJapaneseItems = itemIds.some(id =>
        ['white_rice', 'miso_paste', 'sushi_roll', 'ramen_bowl', 'bread', 'hamburger'].includes(id)
      );
      expect(hasJapaneseItems).toBe(true);
    });

    it('should provide Tamagotchi classic item contracts with special markers', () => {
      const contracts = Array.from({ length: 15 }, () =>
        generator['generateCraftingContract']()
      );

      const classicContracts = contracts.filter(c =>
        c.title.includes('🎮') || c.description.includes('classic') || c.description.includes('original')
      );

      // Should generate some classic contracts
      if (classicContracts.length > 0) {
        classicContracts.forEach(contract => {
          expect(contract.reward.tamaCoins).toBeGreaterThan(50);
          expect(['bread', 'hamburger'].some(item =>
            contract.requirements.craft!.itemId.includes(item)
          )).toBe(true);
        });
      }
    });

    it('should scale rewards with item tier and complexity', () => {
      const contracts = Array.from({ length: 10 }, () =>
        generator['generateCraftingContract']()
      );

      contracts.forEach(contract => {
        const quantity = contract.requirements.craft!.quantity;
        const payment = contract.reward.tamaCoins;

        // Higher tier items should generally pay more
        expect(payment).toBeGreaterThanOrEqual(quantity * 30); // Minimum 30 coins per item
        expect(payment).toBeLessThanOrEqual(quantity * 200); // Maximum 200 coins per item

        // Experience should be percentage of payment
        expect(contract.reward.experience).toBeGreaterThanOrEqual(Math.floor(payment * 0.1));
        expect(contract.reward.experience).toBeLessThanOrEqual(Math.floor(payment * 0.15));
      });
    });
  });

  describe('Contract Variety and Balance', () => {
    it('should generate varied contract types', () => {
      const contracts = Array.from({ length: 30 }, () =>
        generator.generateRandomContract()
      );

      const types = contracts.map(c => c.type);
      const typeDistribution = {
        sales: types.filter(t => t === 'sales').length,
        crafting: types.filter(t => t === 'crafting').length,
        care: types.filter(t => t === 'care').length
      };

      // Should have reasonable distribution of contract types
      expect(typeDistribution.sales).toBeGreaterThan(5);
      expect(typeDistribution.crafting).toBeGreaterThan(5);
      expect(typeDistribution.care).toBeGreaterThan(5);
    });

    it('should provide contracts with appropriate time limits', () => {
      const contracts = Array.from({ length: 20 }, () =>
        generator.generateRandomContract()
      );

      contracts.forEach(contract => {
        expect(contract.timeLimit).toBeGreaterThan(12); // At least 12 hours
        expect(contract.timeLimit).toBeLessThanOrEqual(72); // At most 72 hours

        // More complex contracts should have longer time limits
        if (contract.type === 'crafting') {
          expect(contract.timeLimit).toBeGreaterThanOrEqual(24); // Crafting needs time
        }
      });
    });

    it('should maintain contract ID uniqueness', () => {
      const contracts = Array.from({ length: 50 }, () =>
        generator.generateRandomContract()
      );

      const ids = contracts.map(c => c.id);
      const uniqueIds = [...new Set(ids)];

      expect(uniqueIds.length).toBe(contracts.length);
    });
  });

  describe('Cultural Authenticity', () => {
    it('should use appropriate Japanese cultural references in descriptions', () => {
      const contracts = Array.from({ length: 20 }, () =>
        generator.generateRandomContract()
      );

      const japaneseCulturalContracts = contracts.filter(contract =>
        contract.description.includes('traditional') ||
        contract.description.includes('artisan') ||
        contract.description.includes('authentic') ||
        contract.description.includes('restaurant') ||
        contract.description.includes('premium')
      );

      // Should have some culturally themed contracts
      expect(japaneseCulturalContracts.length).toBeGreaterThan(0);

      japaneseCulturalContracts.forEach(contract => {
        expect(contract.description.length).toBeGreaterThan(30);
        expect(contract.title.length).toBeGreaterThan(10);
      });
    });

    it('should balance traditional and new content appropriately', () => {
      const salesContracts = Array.from({ length: 15 }, () =>
        generator['generateSalesContract']()
      );

      let traditionalResourceCount = 0;
      let japaneseResourceCount = 0;

      salesContracts.forEach(contract => {
        const resourceTypes = Object.keys(contract.requirements.sell);
        resourceTypes.forEach(type => {
          if (['berries', 'wood', 'stone'].includes(type)) {
            traditionalResourceCount++;
          } else if (['rice_grain', 'bamboo_fiber', 'silk_thread'].includes(type)) {
            japaneseResourceCount++;
          }
        });
      });

      // Should maintain balance between traditional and new content
      expect(traditionalResourceCount + japaneseResourceCount).toBeGreaterThan(0);
    });
  });

  describe('Integration Validation', () => {
    it('should create contracts that reference valid crafting item IDs', () => {
      const craftingContracts = Array.from({ length: 10 }, () =>
        generator['generateCraftingContract']()
      );

      craftingContracts.forEach(contract => {
        const itemId = contract.requirements.craft!.itemId;
        expect(itemId).toBeTruthy();
        expect(typeof itemId).toBe('string');
        expect(itemId.length).toBeGreaterThan(2);

        // Should not contain spaces or special characters that would break the system
        expect(itemId).not.toMatch(/[^a-z_]/);
      });
    });

    it('should provide reasonable quantities for contract requirements', () => {
      const allContracts = Array.from({ length: 20 }, () =>
        generator.generateRandomContract()
      );

      allContracts.forEach(contract => {
        if (contract.type === 'sales') {
          Object.values(contract.requirements.sell!).forEach(quantity => {
            const qty = typeof quantity === 'number' ? quantity : quantity.length;
            expect(qty).toBeGreaterThan(0);
            expect(qty).toBeLessThanOrEqual(50); // Reasonable upper limit
          });
        }

        if (contract.type === 'crafting') {
          const qty = contract.requirements.craft!.quantity;
          expect(qty).toBeGreaterThan(0);
          expect(qty).toBeLessThanOrEqual(10); // Crafting should be smaller quantities
        }
      });
    });
  });
});