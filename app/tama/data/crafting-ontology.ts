// Japanese-Inspired 4-Tier Crafting System for Tama Bokujō
// Based on traditional Japanese culture, anime/manga items, and classic Tamagotchi elements

export interface CraftingItem {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  category: 'food' | 'textile' | 'tool' | 'decoration' | 'medicine' | 'toy' | 'spiritual' | 'seasonal';
  description: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  ingredients?: { itemId: string; quantity: number }[];
  discoveryXP: number;
  craftingXP: number;
  tamagotchiClassic?: boolean; // Items from classic Tamagotchi
}

// =====================
// TIER 1: BASIC MATERIALS (80 items)
// =====================

export const TIER1_MATERIALS: CraftingItem[] = [
  // Basic Food Ingredients (20 items)
  { id: 'rice_grain', name: 'Rice Grain', tier: 1, category: 'food', emoji: '🌾', rarity: 'common', description: 'Essential staple grain of Japan', discoveryXP: 5, craftingXP: 2 },
  { id: 'soy_bean', name: 'Soy Bean', tier: 1, category: 'food', emoji: '🫘', rarity: 'common', description: 'Foundation of miso and tofu', discoveryXP: 5, craftingXP: 2 },
  { id: 'seaweed', name: 'Seaweed', tier: 1, category: 'food', emoji: '🌿', rarity: 'common', description: 'Ocean vegetables for umami', discoveryXP: 5, craftingXP: 2 },
  { id: 'green_tea_leaf', name: 'Green Tea Leaf', tier: 1, category: 'food', emoji: '🍃', rarity: 'uncommon', description: 'Fresh leaves for tea ceremony', discoveryXP: 8, craftingXP: 3 },
  { id: 'sesame_seed', name: 'Sesame Seed', tier: 1, category: 'food', emoji: '🫴', rarity: 'common', description: 'Tiny seeds with rich flavor', discoveryXP: 5, craftingXP: 2 },
  { id: 'bamboo_shoot', name: 'Bamboo Shoot', tier: 1, category: 'food', emoji: '🎋', rarity: 'uncommon', description: 'Young bamboo for cooking', discoveryXP: 8, craftingXP: 3 },
  { id: 'fish', name: 'Fresh Fish', tier: 1, category: 'food', emoji: '🐟', rarity: 'common', description: 'Ocean catch for sushi', discoveryXP: 5, craftingXP: 2 },
  { id: 'egg', name: 'Chicken Egg', tier: 1, category: 'food', emoji: '🥚', rarity: 'common', description: 'For tamagoyaki and baking', discoveryXP: 5, craftingXP: 2 },
  { id: 'flour', name: 'Wheat Flour', tier: 1, category: 'food', emoji: '🌾', rarity: 'common', description: 'Ground wheat for noodles', discoveryXP: 5, craftingXP: 2, tamagotchiClassic: true },
  { id: 'sugar', name: 'Sugar', tier: 1, category: 'food', emoji: '🍯', rarity: 'common', description: 'Sweetener for wagashi', discoveryXP: 5, craftingXP: 2 },
  { id: 'milk', name: 'Fresh Milk', tier: 1, category: 'food', emoji: '🥛', rarity: 'common', description: 'Dairy for Western treats', discoveryXP: 5, craftingXP: 2 },
  { id: 'red_bean', name: 'Red Bean', tier: 1, category: 'food', emoji: '🫘', rarity: 'common', description: 'Azuki beans for sweets', discoveryXP: 5, craftingXP: 2 },
  { id: 'mochi_rice', name: 'Sticky Rice', tier: 1, category: 'food', emoji: '🍚', rarity: 'common', description: 'Glutinous rice for mochi', discoveryXP: 5, craftingXP: 2 },
  { id: 'mushroom', name: 'Shiitake', tier: 1, category: 'food', emoji: '🍄', rarity: 'uncommon', description: 'Umami-rich mushrooms', discoveryXP: 8, craftingXP: 3 },
  { id: 'cucumber', name: 'Cucumber', tier: 1, category: 'food', emoji: '🥒', rarity: 'common', description: 'Crisp vegetable for pickles', discoveryXP: 5, craftingXP: 2 },
  { id: 'carrot', name: 'Carrot', tier: 1, category: 'food', emoji: '🥕', rarity: 'common', description: 'Sweet root vegetable', discoveryXP: 5, craftingXP: 2 },
  { id: 'honey', name: 'Wild Honey', tier: 1, category: 'food', emoji: '🍯', rarity: 'uncommon', description: 'Natural sweetener', discoveryXP: 8, craftingXP: 3 },
  { id: 'salt', name: 'Sea Salt', tier: 1, category: 'food', emoji: '🧂', rarity: 'common', description: 'Essential seasoning', discoveryXP: 5, craftingXP: 2 },
  { id: 'plum', name: 'Ume Plum', tier: 1, category: 'food', emoji: '🟫', rarity: 'uncommon', description: 'Sour plums for umeboshi', discoveryXP: 8, craftingXP: 3 },
  { id: 'apple', name: 'Apple', tier: 1, category: 'food', emoji: '🍎', rarity: 'common', description: 'Crisp fruit snack', discoveryXP: 5, craftingXP: 2 },

  // Natural Materials (15 items)
  { id: 'cotton_fiber', name: 'Cotton Fiber', tier: 1, category: 'textile', emoji: '🌸', rarity: 'common', description: 'Soft natural fiber', discoveryXP: 5, craftingXP: 2 },
  { id: 'silk_thread', name: 'Silk Thread', tier: 1, category: 'textile', emoji: '🧵', rarity: 'uncommon', description: 'Lustrous silkworm thread', discoveryXP: 8, craftingXP: 3 },
  { id: 'hemp_fiber', name: 'Hemp Fiber', tier: 1, category: 'textile', emoji: '🌿', rarity: 'common', description: 'Strong plant fiber', discoveryXP: 5, craftingXP: 2 },
  { id: 'mulberry_bark', name: 'Mulberry Bark', tier: 1, category: 'textile', emoji: '🟤', rarity: 'uncommon', description: 'For washi paper making', discoveryXP: 8, craftingXP: 3 },
  { id: 'bamboo_fiber', name: 'Bamboo Fiber', tier: 1, category: 'tool', emoji: '🎋', rarity: 'common', description: 'Flexible bamboo strips', discoveryXP: 5, craftingXP: 2 },
  { id: 'wood_chip', name: 'Wood Chip', tier: 1, category: 'tool', emoji: '🪵', rarity: 'common', description: 'Carved wood pieces', discoveryXP: 5, craftingXP: 2 },
  { id: 'clay', name: 'River Clay', tier: 1, category: 'tool', emoji: '🟤', rarity: 'common', description: 'Moldable earth for pottery', discoveryXP: 5, craftingXP: 2 },
  { id: 'iron_ore', name: 'Iron Ore', tier: 1, category: 'tool', emoji: '⚫', rarity: 'uncommon', description: 'Raw metal for forging', discoveryXP: 8, craftingXP: 3 },
  { id: 'charcoal', name: 'Charcoal', tier: 1, category: 'tool', emoji: '⚫', rarity: 'common', description: 'Fuel for fires', discoveryXP: 5, craftingXP: 2 },
  { id: 'lacquer_sap', name: 'Lacquer Sap', tier: 1, category: 'tool', emoji: '🟤', rarity: 'rare', description: 'Tree sap for coating', discoveryXP: 12, craftingXP: 5 },
  { id: 'beeswax', name: 'Beeswax', tier: 1, category: 'tool', emoji: '🟡', rarity: 'uncommon', description: 'Natural wax coating', discoveryXP: 8, craftingXP: 3 },
  { id: 'flower_petal', name: 'Cherry Blossom', tier: 1, category: 'decoration', emoji: '🌸', rarity: 'uncommon', description: 'Seasonal beauty', discoveryXP: 8, craftingXP: 3 },
  { id: 'crystal_shard', name: 'Quartz Shard', tier: 1, category: 'decoration', emoji: '💎', rarity: 'rare', description: 'Clear mineral crystal', discoveryXP: 12, craftingXP: 5 },
  { id: 'feather', name: 'Bird Feather', tier: 1, category: 'decoration', emoji: '🪶', rarity: 'uncommon', description: 'Delicate plumage', discoveryXP: 8, craftingXP: 3 },
  { id: 'shell', name: 'Sea Shell', tier: 1, category: 'decoration', emoji: '🐚', rarity: 'uncommon', description: 'Ocean treasure', discoveryXP: 8, craftingXP: 3 },

  // Herbs & Medicine (10 items)
  { id: 'ginseng_root', name: 'Ginseng Root', tier: 1, category: 'medicine', emoji: '🌿', rarity: 'rare', description: 'Revitalizing herb root', discoveryXP: 12, craftingXP: 5 },
  { id: 'mint_leaf', name: 'Mint Leaf', tier: 1, category: 'medicine', emoji: '🌿', rarity: 'common', description: 'Cooling aromatic herb', discoveryXP: 5, craftingXP: 2 },
  { id: 'lavender', name: 'Lavender', tier: 1, category: 'medicine', emoji: '💜', rarity: 'uncommon', description: 'Calming purple flowers', discoveryXP: 8, craftingXP: 3 },
  { id: 'ginger_root', name: 'Ginger Root', tier: 1, category: 'medicine', emoji: '🫚', rarity: 'uncommon', description: 'Warming spice root', discoveryXP: 8, craftingXP: 3 },
  { id: 'turmeric', name: 'Turmeric', tier: 1, category: 'medicine', emoji: '🟡', rarity: 'uncommon', description: 'Golden healing spice', discoveryXP: 8, craftingXP: 3 },
  { id: 'chamomile', name: 'Chamomile', tier: 1, category: 'medicine', emoji: '🌼', rarity: 'common', description: 'Soothing flower tea', discoveryXP: 5, craftingXP: 2 },
  { id: 'eucalyptus', name: 'Eucalyptus Leaf', tier: 1, category: 'medicine', emoji: '🌿', rarity: 'uncommon', description: 'Respiratory clearing leaf', discoveryXP: 8, craftingXP: 3 },
  { id: 'aloe_vera', name: 'Aloe Vera', tier: 1, category: 'medicine', emoji: '🌵', rarity: 'common', description: 'Healing succulent gel', discoveryXP: 5, craftingXP: 2 },
  { id: 'pine_needle', name: 'Pine Needle', tier: 1, category: 'medicine', emoji: '🌲', rarity: 'common', description: 'Antiseptic evergreen', discoveryXP: 5, craftingXP: 2 },
  { id: 'willow_bark', name: 'Willow Bark', tier: 1, category: 'medicine', emoji: '🟤', rarity: 'uncommon', description: 'Natural pain relief', discoveryXP: 8, craftingXP: 3 },

  // Spiritual & Seasonal (15 items)
  { id: 'incense_wood', name: 'Sandalwood', tier: 1, category: 'spiritual', emoji: '🪵', rarity: 'rare', description: 'Fragrant sacred wood', discoveryXP: 12, craftingXP: 5 },
  { id: 'prayer_bead', name: 'Wooden Bead', tier: 1, category: 'spiritual', emoji: '🟤', rarity: 'common', description: 'Simple meditation bead', discoveryXP: 5, craftingXP: 2 },
  { id: 'sacred_rope', name: 'Hemp Rope', tier: 1, category: 'spiritual', emoji: '🪢', rarity: 'common', description: 'Twisted sacred binding', discoveryXP: 5, craftingXP: 2 },
  { id: 'paper_strip', name: 'White Paper', tier: 1, category: 'spiritual', emoji: '📜', rarity: 'common', description: 'Pure paper for wishes', discoveryXP: 5, craftingXP: 2 },
  { id: 'candle_wax', name: 'Beeswax', tier: 1, category: 'spiritual', emoji: '🕯️', rarity: 'uncommon', description: 'Natural candle material', discoveryXP: 8, craftingXP: 3 },
  { id: 'maple_leaf', name: 'Maple Leaf', tier: 1, category: 'seasonal', emoji: '🍁', rarity: 'uncommon', description: 'Autumn red beauty', discoveryXP: 8, craftingXP: 3 },
  { id: 'pine_cone', name: 'Pine Cone', tier: 1, category: 'seasonal', emoji: '🌰', rarity: 'common', description: 'Winter forest gift', discoveryXP: 5, craftingXP: 2 },
  { id: 'snowflake', name: 'Perfect Snowflake', tier: 1, category: 'seasonal', emoji: '❄️', rarity: 'rare', description: 'Unique ice crystal', discoveryXP: 12, craftingXP: 5 },
  { id: 'spring_water', name: 'Mountain Spring', tier: 1, category: 'seasonal', emoji: '💧', rarity: 'uncommon', description: 'Pure fresh water', discoveryXP: 8, craftingXP: 3 },
  { id: 'summer_grass', name: 'Summer Grass', tier: 1, category: 'seasonal', emoji: '🌱', rarity: 'common', description: 'Vibrant green blades', discoveryXP: 5, craftingXP: 2 },
  { id: 'moon_dust', name: 'Moon Dust', tier: 1, category: 'seasonal', emoji: '✨', rarity: 'legendary', description: 'Mystical night powder', discoveryXP: 20, craftingXP: 10 },
  { id: 'star_fragment', name: 'Star Fragment', tier: 1, category: 'seasonal', emoji: '⭐', rarity: 'legendary', description: 'Fallen celestial piece', discoveryXP: 20, craftingXP: 10 },
  { id: 'rainbow_drop', name: 'Rainbow Drop', tier: 1, category: 'seasonal', emoji: '🌈', rarity: 'legendary', description: 'Prismatic liquid light', discoveryXP: 20, craftingXP: 10 },
  { id: 'wind_essence', name: 'Wind Essence', tier: 1, category: 'seasonal', emoji: '💨', rarity: 'rare', description: 'Captured breeze spirit', discoveryXP: 12, craftingXP: 5 },
  { id: 'fire_ember', name: 'Sacred Ember', tier: 1, category: 'seasonal', emoji: '🔥', rarity: 'rare', description: 'Ever-burning flame', discoveryXP: 12, craftingXP: 5 },

  // Simple Toy Components (20 items)
  { id: 'rubber_ball', name: 'Rubber Ball', tier: 1, category: 'toy', emoji: '⚽', rarity: 'common', description: 'Bouncy play sphere', discoveryXP: 5, craftingXP: 2, tamagotchiClassic: true },
  { id: 'wooden_block', name: 'Wood Block', tier: 1, category: 'toy', emoji: '🟫', rarity: 'common', description: 'Simple building piece', discoveryXP: 5, craftingXP: 2 },
  { id: 'bell', name: 'Tiny Bell', tier: 1, category: 'toy', emoji: '🔔', rarity: 'common', description: 'Musical chime maker', discoveryXP: 5, craftingXP: 2 },
  { id: 'marble', name: 'Glass Marble', tier: 1, category: 'toy', emoji: '🟢', rarity: 'common', description: 'Smooth rolling sphere', discoveryXP: 5, craftingXP: 2 },
  { id: 'ribbon', name: 'Silk Ribbon', tier: 1, category: 'toy', emoji: '🎀', rarity: 'common', description: 'Colorful fabric strip', discoveryXP: 5, craftingXP: 2 },
  { id: 'button', name: 'Mother-of-Pearl', tier: 1, category: 'toy', emoji: '🔘', rarity: 'uncommon', description: 'Shimmering button', discoveryXP: 8, craftingXP: 3 },
  { id: 'string', name: 'Cotton String', tier: 1, category: 'toy', emoji: '🧶', rarity: 'common', description: 'Twisted thread cord', discoveryXP: 5, craftingXP: 2 },
  { id: 'paper_sheet', name: 'Origami Paper', tier: 1, category: 'toy', emoji: '📄', rarity: 'common', description: 'Square folding paper', discoveryXP: 5, craftingXP: 2 },
  { id: 'paint_drop', name: 'Paint Pigment', tier: 1, category: 'toy', emoji: '🎨', rarity: 'uncommon', description: 'Colored art medium', discoveryXP: 8, craftingXP: 3 },
  { id: 'plastic_bead', name: 'Plastic Bead', tier: 1, category: 'toy', emoji: '🔵', rarity: 'common', description: 'Colorful round bead', discoveryXP: 5, craftingXP: 2 },
  { id: 'metal_wire', name: 'Copper Wire', tier: 1, category: 'toy', emoji: '〰️', rarity: 'common', description: 'Bendable metal strand', discoveryXP: 5, craftingXP: 2 },
  { id: 'fabric_scrap', name: 'Fabric Scrap', tier: 1, category: 'toy', emoji: '🧵', rarity: 'common', description: 'Leftover cloth piece', discoveryXP: 5, craftingXP: 2 },
  { id: 'foam_cube', name: 'Foam Block', tier: 1, category: 'toy', emoji: '⬜', rarity: 'common', description: 'Soft squishy cube', discoveryXP: 5, craftingXP: 2 },
  { id: 'glitter', name: 'Sparkle Dust', tier: 1, category: 'toy', emoji: '✨', rarity: 'uncommon', description: 'Shimmering decoration', discoveryXP: 8, craftingXP: 3 },
  { id: 'feather_down', name: 'Soft Down', tier: 1, category: 'toy', emoji: '🪶', rarity: 'common', description: 'Ultra-soft filling', discoveryXP: 5, craftingXP: 2 },
  { id: 'music_note', name: 'Sound Crystal', tier: 1, category: 'toy', emoji: '🎵', rarity: 'rare', description: 'Stores musical tones', discoveryXP: 12, craftingXP: 5 },
  { id: 'mirror_shard', name: 'Mirror Piece', tier: 1, category: 'toy', emoji: '🪞', rarity: 'uncommon', description: 'Reflective glass fragment', discoveryXP: 8, craftingXP: 3 },
  { id: 'magnet', name: 'Lodestone', tier: 1, category: 'toy', emoji: '🧲', rarity: 'uncommon', description: 'Natural magnetic stone', discoveryXP: 8, craftingXP: 3 },
  { id: 'spring_coil', name: 'Metal Spring', tier: 1, category: 'toy', emoji: '〰️', rarity: 'common', description: 'Bouncy metal coil', discoveryXP: 5, craftingXP: 2 },
  { id: 'lens', name: 'Glass Lens', tier: 1, category: 'toy', emoji: '🔍', rarity: 'uncommon', description: 'Magnifying optic', discoveryXP: 8, craftingXP: 3 },
];

// =====================
// TIER 2: BASIC CRAFTED ITEMS (80 items)
// =====================

export const TIER2_ITEMS: CraftingItem[] = [
  // Basic Japanese Food (25 items)
  { id: 'white_rice', name: 'Steamed Rice', tier: 2, category: 'food', emoji: '🍚', rarity: 'common', description: 'Perfectly cooked rice', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'rice_grain', quantity: 2 }], tamagotchiClassic: true },
  { id: 'miso_paste', name: 'Miso Paste', tier: 2, category: 'food', emoji: '🟤', rarity: 'common', description: 'Fermented soy bean paste', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'soy_bean', quantity: 2 }] },
  { id: 'tofu', name: 'Silken Tofu', tier: 2, category: 'food', emoji: '⬜', rarity: 'common', description: 'Smooth soy protein', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'soy_bean', quantity: 2 }] },
  { id: 'matcha_powder', name: 'Matcha Powder', tier: 2, category: 'food', emoji: '🍵', rarity: 'uncommon', description: 'Powdered green tea', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'green_tea_leaf', quantity: 2 }] },
  { id: 'sesame_oil', name: 'Sesame Oil', tier: 2, category: 'food', emoji: '🫗', rarity: 'common', description: 'Aromatic cooking oil', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'sesame_seed', quantity: 2 }] },
  { id: 'pickled_bamboo', name: 'Menma', tier: 2, category: 'food', emoji: '🥢', rarity: 'uncommon', description: 'Fermented bamboo shoots', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'bamboo_shoot', quantity: 2 }] },
  { id: 'sashimi', name: 'Fresh Sashimi', tier: 2, category: 'food', emoji: '🍣', rarity: 'uncommon', description: 'Sliced raw fish', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'fish', quantity: 2 }] },
  { id: 'tamagoyaki', name: 'Tamagoyaki', tier: 2, category: 'food', emoji: '🍳', rarity: 'common', description: 'Sweet rolled omelet', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'egg', quantity: 2 }] },
  { id: 'udon_noodle', name: 'Udon Noodles', tier: 2, category: 'food', emoji: '🍜', rarity: 'common', description: 'Thick wheat noodles', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'flour', quantity: 2 }] },
  { id: 'candy', name: 'Hard Candy', tier: 2, category: 'food', emoji: '🍬', rarity: 'common', description: 'Sweet crystallized treat', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'sugar', quantity: 2 }], tamagotchiClassic: true },
  { id: 'butter', name: 'Fresh Butter', tier: 2, category: 'food', emoji: '🧈', rarity: 'common', description: 'Churned dairy fat', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'milk', quantity: 2 }] },
  { id: 'anko', name: 'Red Bean Paste', tier: 2, category: 'food', emoji: '🟤', rarity: 'common', description: 'Sweet azuki filling', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'red_bean', quantity: 2 }] },
  { id: 'mochi', name: 'Plain Mochi', tier: 2, category: 'food', emoji: '🍡', rarity: 'common', description: 'Chewy rice cake', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'mochi_rice', quantity: 2 }] },
  { id: 'shiitake_dried', name: 'Dried Shiitake', tier: 2, category: 'food', emoji: '🍄', rarity: 'uncommon', description: 'Concentrated umami', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'mushroom', quantity: 2 }] },
  { id: 'pickles', name: 'Cucumber Pickles', tier: 2, category: 'food', emoji: '🥒', rarity: 'common', description: 'Fermented vegetables', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'cucumber', quantity: 2 }] },
  { id: 'carrot_cake', name: 'Carrot Cake', tier: 2, category: 'food', emoji: '🍰', rarity: 'uncommon', description: 'Sweet vegetable dessert', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'carrot', quantity: 2 }], tamagotchiClassic: true },
  { id: 'honey_cake', name: 'Honey Castella', tier: 2, category: 'food', emoji: '🍰', rarity: 'uncommon', description: 'Portuguese-inspired sponge', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'honey', quantity: 2 }] },
  { id: 'sea_salt', name: 'Refined Salt', tier: 2, category: 'food', emoji: '🧂', rarity: 'common', description: 'Pure seasoning crystal', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'salt', quantity: 2 }] },
  { id: 'umeboshi', name: 'Pickled Plum', tier: 2, category: 'food', emoji: '🟫', rarity: 'uncommon', description: 'Sour preserved fruit', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'plum', quantity: 2 }] },
  { id: 'apple_pie', name: 'Mini Apple Pie', tier: 2, category: 'food', emoji: '🥧', rarity: 'uncommon', description: 'Western-style dessert', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'apple', quantity: 2 }], tamagotchiClassic: true },
  { id: 'bread', name: 'Fresh Bread', tier: 2, category: 'food', emoji: '🍞', rarity: 'common', description: 'Basic baked loaf', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'flour', quantity: 1 }, { itemId: 'milk', quantity: 1 }], tamagotchiClassic: true },
  { id: 'hamburger', name: 'Mini Burger', tier: 2, category: 'food', emoji: '🍔', rarity: 'uncommon', description: 'Western fast food', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'bread', quantity: 1 }, { itemId: 'fish', quantity: 1 }], tamagotchiClassic: true },
  { id: 'ice_cream', name: 'Soft Serve', tier: 2, category: 'food', emoji: '🍦', rarity: 'uncommon', description: 'Frozen dairy treat', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'milk', quantity: 1 }, { itemId: 'sugar', quantity: 1 }] },
  { id: 'donut', name: 'Glazed Donut', tier: 2, category: 'food', emoji: '🍩', rarity: 'uncommon', description: 'Fried sweet ring', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'flour', quantity: 1 }, { itemId: 'sugar', quantity: 1 }] },
  { id: 'cookie', name: 'Sugar Cookie', tier: 2, category: 'food', emoji: '🍪', rarity: 'common', description: 'Simple baked treat', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'flour', quantity: 1 }, { itemId: 'butter', quantity: 1 }] },

  // Basic Textiles & Paper (15 items)
  { id: 'cotton_thread', name: 'Cotton Thread', tier: 2, category: 'textile', emoji: '🧵', rarity: 'common', description: 'Spun cotton yarn', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'cotton_fiber', quantity: 2 }] },
  { id: 'silk_fabric', name: 'Silk Cloth', tier: 2, category: 'textile', emoji: '🟫', rarity: 'uncommon', description: 'Woven silk material', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'silk_thread', quantity: 2 }] },
  { id: 'hemp_rope', name: 'Hemp Rope', tier: 2, category: 'textile', emoji: '🪢', rarity: 'common', description: 'Twisted hemp cord', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'hemp_fiber', quantity: 2 }] },
  { id: 'washi_paper', name: 'Washi Paper', tier: 2, category: 'textile', emoji: '📜', rarity: 'uncommon', description: 'Traditional Japanese paper', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'mulberry_bark', quantity: 2 }] },
  { id: 'bamboo_mat', name: 'Bamboo Mat', tier: 2, category: 'tool', emoji: '🟫', rarity: 'common', description: 'Woven bamboo surface', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'bamboo_fiber', quantity: 2 }] },
  { id: 'wooden_bowl', name: 'Wood Bowl', tier: 2, category: 'tool', emoji: '🥣', rarity: 'common', description: 'Carved eating vessel', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'wood_chip', quantity: 2 }] },
  { id: 'ceramic_pot', name: 'Clay Pot', tier: 2, category: 'tool', emoji: '🫖', rarity: 'common', description: 'Fired clay vessel', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'clay', quantity: 2 }] },
  { id: 'iron_ingot', name: 'Iron Ingot', tier: 2, category: 'tool', emoji: '⬜', rarity: 'uncommon', description: 'Smelted metal bar', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'iron_ore', quantity: 2 }] },
  { id: 'fire_brick', name: 'Charcoal Brick', tier: 2, category: 'tool', emoji: '⬛', rarity: 'common', description: 'Compressed fuel', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'charcoal', quantity: 2 }] },
  { id: 'lacquer_paint', name: 'Black Lacquer', tier: 2, category: 'tool', emoji: '⬛', rarity: 'rare', description: 'Glossy protective coating', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'lacquer_sap', quantity: 2 }] },
  { id: 'candle', name: 'Beeswax Candle', tier: 2, category: 'tool', emoji: '🕯️', rarity: 'uncommon', description: 'Natural light source', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'beeswax', quantity: 2 }] },
  { id: 'flower_crown', name: 'Sakura Crown', tier: 2, category: 'decoration', emoji: '👑', rarity: 'uncommon', description: 'Spring celebration headpiece', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'flower_petal', quantity: 2 }] },
  { id: 'crystal_pendant', name: 'Quartz Pendant', tier: 2, category: 'decoration', emoji: '💎', rarity: 'rare', description: 'Polished crystal jewelry', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'crystal_shard', quantity: 2 }] },
  { id: 'feather_fan', name: 'Feather Fan', tier: 2, category: 'decoration', emoji: '🪭', rarity: 'uncommon', description: 'Delicate cooling tool', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'feather', quantity: 2 }] },
  { id: 'shell_necklace', name: 'Shell Necklace', tier: 2, category: 'decoration', emoji: '📿', rarity: 'uncommon', description: 'Ocean-inspired jewelry', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'shell', quantity: 2 }] },

  // Basic Medicine (10 items)
  { id: 'ginseng_tea', name: 'Ginseng Tea', tier: 2, category: 'medicine', emoji: '🍵', rarity: 'rare', description: 'Energizing herbal drink', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'ginseng_root', quantity: 2 }] },
  { id: 'mint_oil', name: 'Mint Oil', tier: 2, category: 'medicine', emoji: '🫗', rarity: 'common', description: 'Cooling aromatic oil', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'mint_leaf', quantity: 2 }] },
  { id: 'lavender_sachet', name: 'Lavender Pouch', tier: 2, category: 'medicine', emoji: '💜', rarity: 'uncommon', description: 'Calming sleep aid', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'lavender', quantity: 2 }] },
  { id: 'ginger_candy', name: 'Ginger Drop', tier: 2, category: 'medicine', emoji: '🍬', rarity: 'uncommon', description: 'Warming throat sweet', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'ginger_root', quantity: 2 }] },
  { id: 'turmeric_paste', name: 'Golden Paste', tier: 2, category: 'medicine', emoji: '🟡', rarity: 'uncommon', description: 'Anti-inflammatory salve', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'turmeric', quantity: 2 }] },
  { id: 'chamomile_tea', name: 'Chamomile Tea', tier: 2, category: 'medicine', emoji: '🍵', rarity: 'common', description: 'Soothing bedtime drink', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'chamomile', quantity: 2 }] },
  { id: 'eucalyptus_oil', name: 'Eucalyptus Oil', tier: 2, category: 'medicine', emoji: '🫗', rarity: 'uncommon', description: 'Decongestant oil', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'eucalyptus', quantity: 2 }] },
  { id: 'aloe_gel', name: 'Healing Gel', tier: 2, category: 'medicine', emoji: '🧴', rarity: 'common', description: 'Soothing skin treatment', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'aloe_vera', quantity: 2 }] },
  { id: 'pine_salve', name: 'Pine Balm', tier: 2, category: 'medicine', emoji: '🫙', rarity: 'common', description: 'Antiseptic healing balm', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'pine_needle', quantity: 2 }] },
  { id: 'willow_tea', name: 'Willow Bark Tea', tier: 2, category: 'medicine', emoji: '🍵', rarity: 'uncommon', description: 'Natural pain reliever', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'willow_bark', quantity: 2 }] },

  // Simple Toys (20 items)
  { id: 'bouncy_ball', name: 'Super Ball', tier: 2, category: 'toy', emoji: '🏀', rarity: 'common', description: 'High-bounce rubber toy', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'rubber_ball', quantity: 2 }], tamagotchiClassic: true },
  { id: 'building_blocks', name: 'Block Set', tier: 2, category: 'toy', emoji: '🧱', rarity: 'common', description: 'Stackable toy blocks', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'wooden_block', quantity: 2 }] },
  { id: 'wind_chime', name: 'Glass Chime', tier: 2, category: 'toy', emoji: '🎐', rarity: 'uncommon', description: 'Melodic hanging ornament', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'bell', quantity: 2 }] },
  { id: 'marble_set', name: 'Marble Collection', tier: 2, category: 'toy', emoji: '🔵', rarity: 'common', description: 'Colorful glass spheres', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'marble', quantity: 2 }] },
  { id: 'hair_bow', name: 'Silk Bow', tier: 2, category: 'toy', emoji: '🎀', rarity: 'common', description: 'Decorative hair accessory', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'ribbon', quantity: 2 }] },
  { id: 'decorative_button', name: 'Fancy Button', tier: 2, category: 'toy', emoji: '🔘', rarity: 'uncommon', description: 'Ornate clothing fastener', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'button', quantity: 2 }] },
  { id: 'friendship_bracelet', name: 'Woven Bracelet', tier: 2, category: 'toy', emoji: '📿', rarity: 'common', description: 'Hand-braided friendship band', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'string', quantity: 2 }] },
  { id: 'paper_crane', name: 'Origami Crane', tier: 2, category: 'toy', emoji: '🕊️', rarity: 'uncommon', description: 'Folded paper bird', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'paper_sheet', quantity: 2 }] },
  { id: 'paint_brush', name: 'Art Brush', tier: 2, category: 'toy', emoji: '🖌️', rarity: 'uncommon', description: 'Creative painting tool', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'paint_drop', quantity: 2 }] },
  { id: 'bead_necklace', name: 'Bead Chain', tier: 2, category: 'toy', emoji: '📿', rarity: 'common', description: 'Colorful beaded jewelry', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'plastic_bead', quantity: 2 }] },
  { id: 'wire_sculpture', name: 'Wire Art', tier: 2, category: 'toy', emoji: '🗿', rarity: 'uncommon', description: 'Bent metal artwork', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'metal_wire', quantity: 2 }] },
  { id: 'patchwork_quilt', name: 'Mini Quilt', tier: 2, category: 'toy', emoji: '🟫', rarity: 'common', description: 'Sewn fabric comfort', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'fabric_scrap', quantity: 2 }] },
  { id: 'stress_cube', name: 'Squeeze Toy', tier: 2, category: 'toy', emoji: '⬜', rarity: 'common', description: 'Squishy stress relief', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'foam_cube', quantity: 2 }] },
  { id: 'sparkle_wand', name: 'Magic Wand', tier: 2, category: 'toy', emoji: '🪄', rarity: 'uncommon', description: 'Glittery pretend magic', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'glitter', quantity: 2 }] },
  { id: 'pillow', name: 'Soft Pillow', tier: 2, category: 'toy', emoji: '🛏️', rarity: 'common', description: 'Comfortable cushion', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'feather_down', quantity: 2 }] },
  { id: 'music_box', name: 'Melody Box', tier: 2, category: 'toy', emoji: '🎵', rarity: 'rare', description: 'Magical tune player', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'music_note', quantity: 2 }] },
  { id: 'hand_mirror', name: 'Vanity Mirror', tier: 2, category: 'toy', emoji: '🪞', rarity: 'uncommon', description: 'Personal reflection tool', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'mirror_shard', quantity: 2 }] },
  { id: 'magnetic_toy', name: 'Magnet Game', tier: 2, category: 'toy', emoji: '🧲', rarity: 'uncommon', description: 'Attractive puzzle pieces', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'magnet', quantity: 2 }] },
  { id: 'spring_toy', name: 'Bouncing Coil', tier: 2, category: 'toy', emoji: '〰️', rarity: 'common', description: 'Metal slinky toy', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'spring_coil', quantity: 2 }] },
  { id: 'magnifying_glass', name: 'Detective Glass', tier: 2, category: 'toy', emoji: '🔍', rarity: 'uncommon', description: 'Investigation tool toy', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'lens', quantity: 2 }] },

  // Spiritual Items (10 items)
  { id: 'incense_stick', name: 'Sandalwood Incense', tier: 2, category: 'spiritual', emoji: '🏮', rarity: 'rare', description: 'Fragrant prayer stick', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'incense_wood', quantity: 2 }] },
  { id: 'prayer_beads', name: 'Mala Beads', tier: 2, category: 'spiritual', emoji: '📿', rarity: 'common', description: 'Meditation counting beads', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'prayer_bead', quantity: 2 }] },
  { id: 'blessing_rope', name: 'Shimenawa Rope', tier: 2, category: 'spiritual', emoji: '🪢', rarity: 'common', description: 'Sacred Shinto barrier', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'sacred_rope', quantity: 2 }] },
  { id: 'wish_paper', name: 'Ema Plaque', tier: 2, category: 'spiritual', emoji: '🏷️', rarity: 'common', description: 'Wooden wish tablet', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'paper_strip', quantity: 2 }] },
  { id: 'ritual_candle', name: 'Prayer Candle', tier: 2, category: 'spiritual', emoji: '🕯️', rarity: 'uncommon', description: 'Sacred light source', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'candle_wax', quantity: 2 }] },
  { id: 'autumn_wreath', name: 'Maple Wreath', tier: 2, category: 'seasonal', emoji: '🍂', rarity: 'uncommon', description: 'Fall decoration circle', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'maple_leaf', quantity: 2 }] },
  { id: 'winter_ornament', name: 'Pine Decoration', tier: 2, category: 'seasonal', emoji: '🎄', rarity: 'common', description: 'Holiday tree accent', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'pine_cone', quantity: 2 }] },
  { id: 'snow_globe', name: 'Crystal Snow', tier: 2, category: 'seasonal', emoji: '❄️', rarity: 'rare', description: 'Captured winter magic', discoveryXP: 20, craftingXP: 12,
    ingredients: [{ itemId: 'snowflake', quantity: 2 }] },
  { id: 'blessed_water', name: 'Holy Spring Water', tier: 2, category: 'seasonal', emoji: '💧', rarity: 'uncommon', description: 'Purified mountain water', discoveryXP: 15, craftingXP: 8,
    ingredients: [{ itemId: 'spring_water', quantity: 2 }] },
  { id: 'summer_lei', name: 'Grass Garland', tier: 2, category: 'seasonal', emoji: '🌱', rarity: 'common', description: 'Fresh woven crown', discoveryXP: 10, craftingXP: 5,
    ingredients: [{ itemId: 'summer_grass', quantity: 2 }] }
];

export const CRAFTING_ONTOLOGY = {
  TIER1_MATERIALS,
  TIER2_ITEMS,
  // TIER3 and TIER4 will be generated dynamically based on combinations
};

export const CRAFTING_CATEGORIES = {
  food: '🍱 Food & Drink',
  textile: '🧵 Textiles & Fabric',
  tool: '🔨 Tools & Utensils',
  decoration: '🎋 Decoration & Art',
  medicine: '🌿 Medicine & Health',
  toy: '🧸 Toys & Games',
  spiritual: '⛩️ Spiritual & Ritual',
  seasonal: '🌸 Seasonal & Nature'
} as const;

export const RARITY_COLORS = {
  common: '#10B981',     // Emerald-500
  uncommon: '#3B82F6',   // Blue-500
  rare: '#8B5CF6',       // Purple-500
  legendary: '#F59E0B'   // Amber-500
} as const;