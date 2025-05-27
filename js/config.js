// Configuration for Farpost Game
const config = {
  // Supabase configuration
  supabase: {
    url: 'https://your-supabase-url.supabase.co',
    anonKey: 'your-supabase-anon-key-here'
  },
  
  // API endpoints
  api: {
    gameState: '/api/game-state',
    gameActions: '/api/game-actions'
  },
  
  // Game configuration (matches server-side)
  game: {
    resources: {
      'Lunar Regolith': { time: 0.5, cost: 20, value: 50, xp: 15, level: 1, symbol: 'LR' },
      'Iron Ore': { time: 1, cost: 30, value: 100, xp: 25, level: 1, symbol: 'Fe' },
      'Aluminum': { time: 2, cost: 35, value: 150, xp: 30, level: 1, symbol: 'Al' },
      'Water Ice': { time: 4, cost: 40, value: 200, xp: 35, level: 1, symbol: 'H2O' },
      'Magnesium': { time: 6, cost: 45, value: 180, xp: 40, level: 5, symbol: 'Mg' },
      'Silicon': { time: 8, cost: 50, value: 250, xp: 45, level: 5, symbol: 'Si' },
      'Titanium': { time: 12, cost: 80, value: 500, xp: 60, level: 5, symbol: 'Ti' },
      'Rare Earth Elements': { time: 16, cost: 150, value: 1500, xp: 100, level: 10, symbol: 'REE' },
      'Platinum Group Metals': { time: 20, cost: 200, value: 2000, xp: 120, level: 15, symbol: 'PGM' },
      'Helium-3': { time: 24, cost: 300, value: 5000, xp: 180, level: 20, symbol: 'He-3' }
    },
    boosters: {
      'Basic Booster': { cost: 100, multiplier: 2, level: 1, duration: 7200 },
      'Advanced Booster': { cost: 250, multiplier: 3, level: 5, duration: 7200 },
      'Elite Booster': { cost: 500, multiplier: 4, level: 10, duration: 7200 },
      'Master Booster': { cost: 1000, multiplier: 5, level: 15, duration: 7200 },
      'Ultimate Booster': { cost: 2000, multiplier: 10, level: 20, duration: 7200 }
    },
    levelThresholds: [0, 300, 1200, 2200, 3500, 5200, 7300, 9800, 12800, 16400, 20600],
    cellUnlocks: {
      1: 3, 2: 4, 3: 5, 10: 8, 15: 12, 20: 16, 25: 24, 30: 32, 35: 48, 40: 64
    }
  }
};

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.CONFIG = config;
} 