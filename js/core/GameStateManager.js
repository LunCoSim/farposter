/**
 * GameStateManager - Handles all game state operations
 * Separated from UI and API concerns for better maintainability
 */
class GameStateManager {
  constructor(config) {
    this.config = config;
    this.state = this.createInitialState();
    this.listeners = new Map();
  }

  // Create initial game state
  createInitialState() {
    return {
      level: 1,
      xp: 0,
      points: 1000,
      ownedCells: 3,
      maxCells: 3,
      selectedExpedition: null,
      selectedBooster: null,
      resources: this.initializeResourceInventory(),
      expeditions: this.initializeResourceInventory(),
      boosters: this.initializeBoosterInventory(),
      cells: this.initializeCells(),
      activeTab: 'buy',
      mode: 'select', // 'select', 'deploy', 'booster'
      debugSpeed: 1,
      activeBooster: null,
      boosterEndTime: null,
      boostedCells: {},
      tutorial: {
        isActive: false,
        completed: false,
        step: 0,
        initialSetup: false
      },
      achievements: {},
      stats: this.initializeStats()
    };
  }

  // Initialize resource inventory with all resources at 0
  initializeResourceInventory() {
    const inventory = {};
    Object.keys(this.config.resources).forEach(resource => {
      inventory[resource] = 0;
    });
    return inventory;
  }

  // Initialize booster inventory
  initializeBoosterInventory() {
    const inventory = {};
    Object.keys(this.config.boosters).forEach(booster => {
      inventory[booster] = 0;
    });
    return inventory;
  }

  // Initialize cells (18 total, 3 owned by default)
  initializeCells() {
    return Array(18).fill(null).map((_, index) => ({
      id: index,
      owned: [7, 8, 9].includes(index), // Middle cells owned by default
      resourceType: null,
      extractionStartTime: null,
      extractionEndTime: null,
      isReady: false
    }));
  }

  // Initialize statistics tracking
  initializeStats() {
    return {
      expeditionsDeployed: 0,
      expeditionsPurchased: 0,
      boostersUsed: 0,
      resourcesCollected: 0,
      resourcesSold: 0,
      cellsPurchased: 0,
      cellsOwned: 3,
      level: 1,
      pointsSpent: 0,
      extractionsThisSession: 0,
      rareResourcesCollected: 0,
      platinumResourcesCollected: 0,
      heliumResourcesCollected: 0
    };
  }

  // Event system for state changes
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Get current state (immutable)
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Update state with validation
  updateState(updates) {
    const oldState = this.getState();
    
    // Validate critical state updates
    if (updates.points !== undefined && updates.points < 0) {
      console.warn('Attempted to set negative points, clamping to 0');
      updates.points = 0;
    }
    
    if (updates.xp !== undefined && updates.xp < 0) {
      console.warn('Attempted to set negative XP, clamping to 0');
      updates.xp = 0;
    }
    
    if (updates.level !== undefined && updates.level < 1) {
      console.warn('Attempted to set level below 1, clamping to 1');
      updates.level = 1;
    }
    
    // Validate resource inventory
    if (updates.resources) {
      Object.keys(updates.resources).forEach(resource => {
        if (updates.resources[resource] < 0) {
          console.warn(`Attempted to set negative ${resource}, clamping to 0`);
          updates.resources[resource] = 0;
        }
      });
    }
    
    // Validate expedition inventory
    if (updates.expeditions) {
      Object.keys(updates.expeditions).forEach(expedition => {
        if (updates.expeditions[expedition] < 0) {
          console.warn(`Attempted to set negative ${expedition} expeditions, clamping to 0`);
          updates.expeditions[expedition] = 0;
        }
      });
    }
    
    // Validate booster inventory
    if (updates.boosters) {
      Object.keys(updates.boosters).forEach(booster => {
        if (updates.boosters[booster] < 0) {
          console.warn(`Attempted to set negative ${booster} boosters, clamping to 0`);
          updates.boosters[booster] = 0;
        }
      });
    }
    
    this.state = { ...this.state, ...updates };
    
    // Check for level up if XP was updated
    if (updates.xp !== undefined) {
      this.checkLevelUp();
    }
    
    this.emit('stateChange', { oldState, newState: this.getState() });
  }

  // Level calculation
  calculateLevelFromXP(xp) {
    const thresholds = this.config.levelThresholds;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // Check for level up
  checkLevelUp() {
    const newLevel = this.calculateLevelFromXP(this.state.xp);
    if (newLevel > this.state.level) {
      const oldLevel = this.state.level;
      this.updateState({ level: newLevel });
      this.updateMaxCells();
      this.emit('levelUp', { oldLevel, newLevel });
      return true;
    }
    return false;
  }

  // Update max cells based on level
  updateMaxCells() {
    const cellUnlocks = this.config.cellUnlocks;
    let maxCells = 3; // Default starting cells
    
    Object.entries(cellUnlocks).forEach(([level, cells]) => {
      if (this.state.level >= parseInt(level)) {
        maxCells = Math.max(maxCells, cells);
      }
    });
    
    if (maxCells !== this.state.maxCells) {
      this.updateState({ maxCells });
    }
  }

  // Purchase expedition validation and execution
  canPurchaseExpedition(resourceType) {
    const config = this.config.resources[resourceType];
    if (!config) return { valid: false, reason: 'Invalid resource type' };
    
    // Check if tutorial is active and restrict to only Lunar Regolith
    if (this.state.tutorial && this.state.tutorial.isActive && resourceType !== 'Lunar Regolith') {
      return { valid: false, reason: 'Complete tutorial to unlock other expeditions' };
    }
    
    if (this.state.level < config.level) {
      return { valid: false, reason: `Level ${config.level} required` };
    }
    
    if (this.state.points < config.cost) {
      return { valid: false, reason: 'Not enough points' };
    }
    
    return { valid: true };
  }

  purchaseExpedition(resourceType) {
    const validation = this.canPurchaseExpedition(resourceType);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const config = this.config.resources[resourceType];
    const newExpeditions = { ...this.state.expeditions };
    newExpeditions[resourceType] = (newExpeditions[resourceType] || 0) + 1;
    
    const newStats = { ...this.state.stats };
    newStats.expeditionsPurchased++;
    newStats.pointsSpent += config.cost;

    this.updateState({
      points: this.state.points - config.cost,
      expeditions: newExpeditions,
      stats: newStats
    });

    this.emit('expeditionPurchased', { resourceType, cost: config.cost });
  }

  // Purchase booster validation and execution
  canPurchaseBooster(boosterType) {
    const config = this.config.boosters[boosterType];
    if (!config) return { valid: false, reason: 'Invalid booster type' };
    
    if (config.purchasable === false) {
      return { valid: false, reason: 'This booster cannot be purchased' };
    }
    
    if (this.state.level < config.level) {
      return { valid: false, reason: `Level ${config.level} required` };
    }
    
    if (this.state.points < config.cost) {
      return { valid: false, reason: 'Not enough points' };
    }
    
    return { valid: true };
  }

  purchaseBooster(boosterType) {
    const validation = this.canPurchaseBooster(boosterType);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const config = this.config.boosters[boosterType];
    const newBoosters = { ...this.state.boosters };
    newBoosters[boosterType] = (newBoosters[boosterType] || 0) + 1;
    
    const newStats = { ...this.state.stats };
    newStats.pointsSpent += config.cost;

    this.updateState({
      points: this.state.points - config.cost,
      boosters: newBoosters,
      stats: newStats
    });

    this.emit('boosterPurchased', { boosterType, cost: config.cost });
  }

  // Cell purchase validation and execution
  canPurchaseCell(cellIndex = null) {
    if (this.state.points < this.config.cellPurchaseCost) {
      return { valid: false, reason: `Not enough points (need ${this.config.cellPurchaseCost})` };
    }
    
    if (this.state.ownedCells >= this.state.maxCells) {
      return { valid: false, reason: 'Maximum cells reached for your level' };
    }
    
    if (cellIndex !== null && this.state.cells[cellIndex]?.owned) {
      return { valid: false, reason: 'Cell already owned' };
    }
    
    return { valid: true };
  }

  purchaseCell(cellIndex) {
    const validation = this.canPurchaseCell(cellIndex);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const newCells = [...this.state.cells];
    newCells[cellIndex].owned = true;
    
    const newStats = { ...this.state.stats };
    newStats.cellsPurchased++;
    newStats.cellsOwned++;
    newStats.pointsSpent += this.config.cellPurchaseCost;

    this.updateState({
      points: this.state.points - this.config.cellPurchaseCost,
      ownedCells: this.state.ownedCells + 1,
      cells: newCells,
      stats: newStats,
      xp: this.state.xp + this.config.cellPurchaseXP
    });

    this.checkLevelUp();
    this.emit('cellPurchased', { cellIndex, cost: this.config.cellPurchaseCost });
  }

  // Load state from external source
  loadState(externalState) {
    // Validate and merge with defaults
    const mergedState = { ...this.createInitialState(), ...externalState };
    this.state = mergedState;
    this.emit('stateLoaded', this.getState());
  }

  // Reset to initial state
  reset() {
    this.state = this.createInitialState();
    this.emit('stateReset', this.getState());
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStateManager;
} else {
  window.GameStateManager = GameStateManager;
} 