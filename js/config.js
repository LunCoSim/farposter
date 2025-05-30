// Configuration for Farpost Game
// Frontend configuration - no sensitive credentials here!

const config = {
  // Game configuration (matches server-side and design document exactly)
  game: {
    resources: {
      'Lunar Regolith': { time: 0.5, cost: 20, value: 50, xp: 10, saleXP: 3, level: 1, symbol: 'LR' },
      'Iron Ore': { time: 1, cost: 30, value: 100, xp: 15, saleXP: 5, level: 1, symbol: 'Fe' },
      'Aluminum': { time: 2, cost: 35, value: 150, xp: 18, saleXP: 8, level: 1, symbol: 'Al' },
      'Water Ice': { time: 4, cost: 40, value: 200, xp: 20, saleXP: 10, level: 1, symbol: 'H2O' },
      'Magnesium': { time: 6, cost: 45, value: 250, xp: 25, saleXP: 12, level: 5, symbol: 'Mg' },
      'Silicon': { time: 8, cost: 50, value: 300, xp: 30, saleXP: 15, level: 5, symbol: 'Si' },
      'Titanium': { time: 12, cost: 80, value: 600, xp: 50, saleXP: 30, level: 5, symbol: 'Ti' },
      'Rare Earth Elements': { time: 16, cost: 150, value: 1500, xp: 75, saleXP: 75, level: 10, symbol: 'REE' },
      'Platinum Group Metals': { time: 20, cost: 200, value: 2500, xp: 125, saleXP: 125, level: 15, symbol: 'PGM' },
      'Helium-3': { time: 24, cost: 300, value: 6000, xp: 200, saleXP: 300, level: 20, symbol: 'He-3' }
    },
    boosters: {
      'Basic Booster': { 
        cost: 100, 
        multiplier: 2, 
        level: 1, 
        duration: 3600, 
        tierMax: 1,
        useXP: 50,
        effect: '2x speed for 1 hour',
        symbol: '⚡'
      },
      'Advanced Booster': { 
        cost: 250, 
        multiplier: 3, 
        level: 5, 
        duration: 3600, 
        tierMax: 5,
        useXP: 75,
        effect: '3x speed for 1 hour',
        symbol: '⚡⚡'
      },
      'Elite Booster': { 
        cost: 500, 
        multiplier: 4, 
        level: 10, 
        duration: 3600, 
        tierMax: 10,
        useXP: 100,
        effect: '4x speed for 1 hour',
        symbol: '⚡⚡⚡'
      },
      'Master Booster': { 
        cost: 1000, 
        multiplier: 5, 
        level: 15, 
        duration: 3600, 
        tierMax: 15,
        useXP: 150,
        effect: '5x speed for 1 hour',
        symbol: '🚀'
      },
      'Ultimate Booster': { 
        cost: 2000, 
        multiplier: 10, 
        level: 20, 
        duration: 3600, 
        tierMax: 20,
        useXP: 200,
        effect: '10x speed for 1 hour',
        symbol: '🚀🚀'
      },
      'Instant Extract': { 
        cost: null, 
        multiplier: 999, 
        level: 1, 
        duration: 1, 
        tierMax: 20, 
        purchasable: false,
        useXP: 100,
        effect: 'Complete extraction instantly',
        symbol: '⭐'
      }
    },
    levelThresholds: [0, 300, 1200, 2200, 3500, 5200, 7300, 9800, 12800, 16400, 20600, 25600, 31400, 38000, 45400, 53600, 62600, 72400, 83000, 94400],
    cellUnlocks: {
      1: 3, 2: 4, 3: 5, 5: 6, 8: 7, 10: 8, 12: 9, 15: 12, 18: 15, 20: 16, 25: 24, 30: 32, 35: 48, 40: 64
    },
    cellPurchaseCost: 500,
    cellPurchaseXP: 100
  }
};

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.CONFIG = config;
} 