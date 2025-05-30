/**
 * ResourceManager - Handles resource extraction, expeditions, and boosters
 * Encapsulates all resource-related game mechanics
 */
class ResourceManager {
  constructor(config, stateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.extractionTimers = new Map();
    
    // Listen to state changes to manage timers
    this.stateManager.addEventListener('stateChange', (data) => {
      this.handleStateChange(data);
    });
  }

  // Deploy expedition to a cell
  deployExpedition(cellIndex, resourceType) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];
    const resourceConfig = this.config.resources[resourceType];

    // Validation
    if (!cell.owned) {
      throw new Error('Can only deploy expeditions to owned cells');
    }

    if (cell.extractionStartTime && !cell.isReady) {
      throw new Error('Cell is already extracting resources');
    }

    if (state.expeditions[resourceType] <= 0) {
      throw new Error(`No ${resourceType} expeditions available`);
    }

    if (state.level < resourceConfig.level) {
      throw new Error(`Level ${resourceConfig.level} required for ${resourceType}`);
    }

    // Calculate extraction time (in milliseconds)
    const baseTime = resourceConfig.time * 60 * 1000; // Convert minutes to milliseconds
    const adjustedTime = baseTime / state.debugSpeed; // Apply debug speed multiplier
    
    const startTime = Date.now();
    const endTime = startTime + adjustedTime;

    // Update state
    const newCells = [...state.cells];
    newCells[cellIndex] = {
      ...cell,
      resourceType,
      extractionStartTime: startTime,
      extractionEndTime: endTime,
      isReady: false
    };

    const newExpeditions = { ...state.expeditions };
    newExpeditions[resourceType]--;

    const newStats = { ...state.stats };
    newStats.expeditionsDeployed++;
    newStats.extractionsThisSession++;

    this.stateManager.updateState({
      cells: newCells,
      expeditions: newExpeditions,
      stats: newStats,
      selectedExpedition: null,
      mode: 'select'
    });

    // Set up extraction timer
    this.setExtractionTimer(cellIndex, endTime);

    this.stateManager.emit('expeditionDeployed', {
      cellIndex,
      resourceType,
      startTime,
      endTime
    });

    return {
      cellIndex,
      resourceType,
      duration: adjustedTime,
      endTime
    };
  }

  // Collect completed resource from cell
  collectResource(cellIndex) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];

    if (!cell.isReady) {
      throw new Error('Resource not ready for collection');
    }

    if (!cell.resourceType) {
      throw new Error('No resource type specified for collection');
    }

    const resourceConfig = this.config.resources[cell.resourceType];
    
    // Clear the extraction timer
    this.clearExtractionTimer(cellIndex);

    // Update state
    const newCells = [...state.cells];
    newCells[cellIndex] = {
      ...cell,
      resourceType: null,
      extractionStartTime: null,
      extractionEndTime: null,
      isReady: false
    };

    const newResources = { ...state.resources };
    newResources[cell.resourceType] = (newResources[cell.resourceType] || 0) + 1;

    const newStats = { ...state.stats };
    newStats.resourcesCollected++;
    
    // Track rare resource collections
    if (['Rare Earth Elements'].includes(cell.resourceType)) {
      newStats.rareResourcesCollected++;
    }
    if (['Platinum Group Metals'].includes(cell.resourceType)) {
      newStats.platinumResourcesCollected++;
    }
    if (['Helium-3'].includes(cell.resourceType)) {
      newStats.heliumResourcesCollected++;
    }

    // Clean up any boosters associated with this cell since the expedition is finished
    const newBoostedCells = { ...state.boostedCells };
    if (newBoostedCells[cellIndex]) {
      delete newBoostedCells[cellIndex];
    }

    this.stateManager.updateState({
      cells: newCells,
      resources: newResources,
      stats: newStats,
      xp: state.xp + resourceConfig.xp,
      boostedCells: newBoostedCells
    });

    // Check for level up
    this.stateManager.checkLevelUp();

    this.stateManager.emit('resourceCollected', {
      cellIndex,
      resourceType: cell.resourceType,
      xpGained: resourceConfig.xp
    });

    return {
      resourceType: cell.resourceType,
      xpGained: resourceConfig.xp,
      totalAmount: newResources[cell.resourceType]
    };
  }

  // Sell resources for points
  sellResources(resourceType, amount = null) {
    const state = this.stateManager.getState();
    const available = state.resources[resourceType] || 0;
    const sellAmount = amount || available;

    if (sellAmount <= 0) {
      throw new Error('No resources to sell');
    }

    if (sellAmount > available) {
      throw new Error(`Only ${available} ${resourceType} available`);
    }

    const resourceConfig = this.config.resources[resourceType];
    const pointsGained = sellAmount * resourceConfig.value;
    const xpGained = sellAmount * resourceConfig.saleXP;

    // Update state
    const newResources = { ...state.resources };
    newResources[resourceType] -= sellAmount;

    const newStats = { ...state.stats };
    newStats.resourcesSold += sellAmount;

    this.stateManager.updateState({
      resources: newResources,
      points: state.points + pointsGained,
      xp: state.xp + xpGained,
      stats: newStats
    });

    // Check for level up
    this.stateManager.checkLevelUp();

    this.stateManager.emit('resourcesSold', {
      resourceType,
      amount: sellAmount,
      pointsGained,
      xpGained
    });

    return {
      resourceType,
      amount: sellAmount,
      pointsGained,
      xpGained
    };
  }

  // Apply booster to a cell
  applyBooster(cellIndex, boosterType) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];
    const boosterConfig = this.config.boosters[boosterType];

    // Validation
    if (state.boosters[boosterType] <= 0) {
      throw new Error(`No ${boosterType} boosters available`);
    }

    if (!cell.owned) {
      throw new Error('Can only apply boosters to owned cells');
    }

    // Handle Instant Extract separately
    if (boosterType === 'Instant Extract') {
      return this.applyInstantExtract(cellIndex);
    }

    // Regular boosters can only be applied to ongoing expeditions
    if (!cell.extractionStartTime || cell.isReady) {
      throw new Error('Can only apply boosters to ongoing expeditions');
    }

    // Check if cell already has an active booster
    const existingBooster = state.boostedCells[cellIndex];
    if (existingBooster && existingBooster.endTime > Date.now()) {
      throw new Error('Cell already has an active booster');
    }

    // Check tier restrictions
    const resourceConfig = this.config.resources[cell.resourceType];
    if (resourceConfig.level > boosterConfig.tierMax) {
      throw new Error(`${boosterType} cannot boost ${cell.resourceType} (tier too high)`);
    }

    // Apply booster
    const newBoosters = { ...state.boosters };
    newBoosters[boosterType]--;

    const newBoostedCells = { ...state.boostedCells };
    newBoostedCells[cellIndex] = {
      boosterType,
      endTime: Date.now() + (boosterConfig.duration * 1000)
    };

    // Apply speed boost to ongoing expedition
    const newCells = [...state.cells];
    const remaining = cell.extractionEndTime - Date.now();
    const newRemaining = Math.max(1000, remaining / boosterConfig.multiplier);
    newCells[cellIndex] = {
      ...cell,
      extractionEndTime: Date.now() + newRemaining
    };

    const newStats = { ...state.stats };
    newStats.boostersUsed++;

    this.stateManager.updateState({
      boosters: newBoosters,
      boostedCells: newBoostedCells,
      cells: newCells,
      stats: newStats,
      xp: state.xp + boosterConfig.useXP,
      selectedBooster: null,
      mode: 'select'
    });

    // Update extraction timer
    this.setExtractionTimer(cellIndex, Date.now() + newRemaining);

    // Check for level up
    this.stateManager.checkLevelUp();

    this.stateManager.emit('boosterApplied', {
      cellIndex,
      boosterType,
      multiplier: boosterConfig.multiplier,
      xpGained: boosterConfig.useXP
    });

    return {
      cellIndex,
      boosterType,
      speedMultiplier: boosterConfig.multiplier,
      xpGained: boosterConfig.useXP
    };
  }

  // Apply instant extract booster
  applyInstantExtract(cellIndex) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];
    const boosterConfig = this.config.boosters['Instant Extract'];

    if (!cell.extractionStartTime || cell.isReady) {
      throw new Error('Can only use Instant Extract on currently extracting cells');
    }

    // Use the booster
    const newBoosters = { ...state.boosters };
    newBoosters['Instant Extract']--;

    // Complete extraction instantly
    const newCells = [...state.cells];
    newCells[cellIndex] = {
      ...cell,
      isReady: true,
      extractionEndTime: Date.now()
    };

    const newStats = { ...state.stats };
    newStats.boostersUsed++;

    // Clean up any boosters associated with this cell since the expedition is instantly completed
    const newBoostedCells = { ...state.boostedCells };
    if (newBoostedCells[cellIndex]) {
      delete newBoostedCells[cellIndex];
    }

    this.stateManager.updateState({
      boosters: newBoosters,
      cells: newCells,
      stats: newStats,
      xp: state.xp + boosterConfig.useXP,
      selectedBooster: null,
      mode: 'select',
      boostedCells: newBoostedCells
    });

    // Clear the extraction timer
    this.clearExtractionTimer(cellIndex);

    // Check for level up
    this.stateManager.checkLevelUp();

    this.stateManager.emit('instantExtractApplied', {
      cellIndex,
      xpGained: boosterConfig.useXP
    });

    return {
      cellIndex,
      xpGained: boosterConfig.useXP
    };
  }

  // Set extraction timer for a cell
  setExtractionTimer(cellIndex, endTime) {
    // Clear existing timer
    this.clearExtractionTimer(cellIndex);

    const timeUntilComplete = endTime - Date.now();
    if (timeUntilComplete <= 0) {
      // Already complete
      this.markExtractionComplete(cellIndex);
      return;
    }

    const timerId = setTimeout(() => {
      this.markExtractionComplete(cellIndex);
    }, timeUntilComplete);

    this.extractionTimers.set(cellIndex, timerId);
  }

  // Clear extraction timer for a cell
  clearExtractionTimer(cellIndex) {
    const timerId = this.extractionTimers.get(cellIndex);
    if (timerId) {
      clearTimeout(timerId);
      this.extractionTimers.delete(cellIndex);
    }
  }

  // Mark extraction as complete
  markExtractionComplete(cellIndex) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];

    if (cell && cell.extractionStartTime && !cell.isReady) {
      const newCells = [...state.cells];
      newCells[cellIndex] = {
        ...cell,
        isReady: true
      };

      this.stateManager.updateState({ cells: newCells });

      this.stateManager.emit('extractionComplete', {
        cellIndex,
        resourceType: cell.resourceType
      });
    }

    this.clearExtractionTimer(cellIndex);
  }

  // Handle state changes to update timers
  handleStateChange(data) {
    const { newState } = data;
    
    // Update timers for any cells with ongoing extractions
    newState.cells.forEach((cell, index) => {
      if (cell.extractionStartTime && !cell.isReady) {
        this.setExtractionTimer(index, cell.extractionEndTime);
      }
    });
  }

  // Get extraction progress for a cell (0-100)
  getExtractionProgress(cellIndex) {
    const state = this.stateManager.getState();
    const cell = state.cells[cellIndex];

    if (!cell.extractionStartTime || cell.isReady) {
      return null;
    }

    const totalTime = cell.extractionEndTime - cell.extractionStartTime;
    const elapsed = Date.now() - cell.extractionStartTime;
    const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));

    return {
      progress,
      timeRemaining: Math.max(0, cell.extractionEndTime - Date.now()),
      totalTime
    };
  }

  // Get all active extractions
  getActiveExtractions() {
    const state = this.stateManager.getState();
    const active = [];

    state.cells.forEach((cell, index) => {
      if (cell.extractionStartTime && !cell.isReady) {
        const progress = this.getExtractionProgress(index);
        active.push({
          cellIndex: index,
          resourceType: cell.resourceType,
          ...progress
        });
      }
    });

    return active;
  }

  // Clean up timers
  destroy() {
    this.extractionTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.extractionTimers.clear();
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceManager;
} else {
  window.ResourceManager = ResourceManager;
} 