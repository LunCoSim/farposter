// Configuration for Farpost Game
const config = {
  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL || 'your-supabase-url-here',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key-here'
  },
  
  // API endpoints
  api: {
    gameState: '/api/game-state',
    gameActions: '/api/game-actions'
  },
  
  // Game configuration (matches server-side)
  game: {
    resources: {
      'Lunar Regolith': { time: 0.5, cost: 20, value: 50, xp: 10, level: 1, symbol: 'LR' },
      'Iron Ore': { time: 1, cost: 30, value: 100, xp: 15, level: 1, symbol: 'Fe' },
      'Aluminum': { time: 2, cost: 35, value: 150, xp: 18, level: 1, symbol: 'Al' },
      'Water Ice': { time: 4, cost: 40, value: 200, xp: 20, level: 1, symbol: 'H2O' },
      'Magnesium': { time: 6, cost: 45, value: 180, xp: 22, level: 5, symbol: 'Mg' },
      'Silicon': { time: 8, cost: 50, value: 250, xp: 25, level: 5, symbol: 'Si' },
      'Titanium': { time: 12, cost: 80, value: 500, xp: 40, level: 5, symbol: 'Ti' },
      'Rare Earth Elements': { time: 16, cost: 150, value: 1500, xp: 75, level: 10, symbol: 'REE' },
      'Platinum Group Metals': { time: 20, cost: 200, value: 2000, xp: 100, level: 15, symbol: 'PGM' },
      'Helium-3': { time: 24, cost: 300, value: 5000, xp: 150, level: 20, symbol: 'He-3' }
    },
    boosters: {
      'Basic Booster': { cost: 100, multiplier: 2, level: 1, duration: 3600 },
      'Advanced Booster': { cost: 250, multiplier: 3, level: 5, duration: 3600 },
      'Elite Booster': { cost: 500, multiplier: 4, level: 10, duration: 3600 },
      'Master Booster': { cost: 1000, multiplier: 5, level: 15, duration: 3600 },
      'Ultimate Booster': { cost: 2000, multiplier: 10, level: 20, duration: 3600 }
    },
    levelThresholds: [0, 1000, 2500, 4500, 7000, 10000, 13500, 17500, 22000, 27000, 32500],
    cellUnlocks: {
      1: 3, 5: 5, 10: 8, 15: 12, 20: 16, 25: 24, 30: 32, 35: 48, 40: 64
    }
  }
};

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.CONFIG = config;
} 