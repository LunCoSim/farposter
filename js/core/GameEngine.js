/**
 * GameEngine - Main game coordinator
 * Orchestrates all game subsystems and provides the main API
 */
class GameEngine {
  constructor() {
    this.config = null;
    this.stateManager = null;
    this.resourceManager = null;
    this.uiController = null;
    this.api = null;
    this.farcasterIntegration = null;
    this.tutorial = null;
    this.achievements = null;
    this.isFrameContext = false;
    this.isInitialized = false;
  }

  // Initialize the game engine
  async init() {
    try {
      console.log('🎯 Initializing Farpost Game Engine...');
      
      // Load configuration
      if (!window.CONFIG?.game) {
        throw new Error('Game configuration not loaded! Please ensure config.js is loaded first.');
      }
      this.config = window.CONFIG.game;
      
      // Initialize core managers
      this.stateManager = new GameStateManager(this.config);
      this.resourceManager = new ResourceManager(this.config, this.stateManager);
      this.uiController = new UIController(this.stateManager, this.resourceManager);
      
      // Initialize API client
      this.api = new FarpostAPI();
      await this.api.init();
      
      // Initialize Farcaster integration
      this.farcasterIntegration = new FarcasterIntegration();
      this.isFrameContext = await this.farcasterIntegration.init(this.api);
      
      // Store references globally for legacy compatibility
      window.gameAPI = this.api;
      window.farcasterIntegration = this.farcasterIntegration;
      
      // Load game state
      if (!this.isFrameContext) {
        await this.loadGameState();
      }
      
      // Initialize subsystems
      this.initializeSubsystems();
      
      // Generate initial UI
      this.generateGrid();
      this.uiController.updateUI();
      
      // Update user display
      this.updateUserDisplay(this.api.getUserInfo());
      
      // Setup achievement system event listeners
      this.setupAchievementListeners();
      
      // Check for first-time visitors (show auth modal)
      if (this.api.isGuestMode()) {
        this.checkFirstVisit();
      }
      
      // Setup auto-save
      this.setupAutoSave();
      
      // Hide loading screen
      setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('show');
      }, 500);
      
      this.isInitialized = true;
      console.log('✅ Game Engine initialized successfully!');
      
    } catch (error) {
      console.error('Error initializing game engine:', error);
      this.showNotification('Failed to initialize game. Please refresh the page.', 'error');
      
      // Hide loading screen even if there's an error
      setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('show');
      }, 500);
    }
  }

  // Initialize subsystems (tutorial, achievements)
  initializeSubsystems() {
    // Initialize tutorial system
    if (window.TutorialSystem) {
      this.tutorial = new TutorialSystem(this);
    }
    
    // Initialize achievement system
    if (window.AchievementSystem) {
      this.achievements = new AchievementSystem(this);
      this.achievements.initializeStats();
    }
    
    // Check if tutorial should start
    const state = this.stateManager.getState();
    if (!state.tutorial.completed && !state.tutorial.initialSetup) {
      this.stateManager.updateState({
        tutorial: { ...state.tutorial, initialSetup: true }
      });
      
      setTimeout(() => {
        if (this.tutorial) {
          this.tutorial.startTutorial();
        }
      }, 2000);
    }
  }

  // Setup achievement system event listeners
  setupAchievementListeners() {
    if (!this.achievements) return;

    // Listen to game events for achievement tracking
    this.stateManager.addEventListener('expeditionDeployed', () => {
      this.achievements.trackAction('expedition_deployed');
    });

    this.stateManager.addEventListener('resourceCollected', () => {
      this.achievements.trackAction('resource_collected');
    });

    this.stateManager.addEventListener('boosterApplied', () => {
      this.achievements.trackAction('booster_used');
    });

    this.stateManager.addEventListener('cellPurchased', () => {
      this.achievements.trackAction('cell_purchased');
    });

    this.stateManager.addEventListener('levelUp', () => {
      this.achievements.trackAction('level_up');
    });
  }

  // Setup auto-save functionality
  setupAutoSave() {
    // Save game state on every state change
    this.stateManager.addEventListener('stateChange', () => {
      this.saveGameState();
    });

    // Periodic save as backup
    setInterval(() => {
      if (this.isInitialized) {
        this.saveGameState();
      }
    }, 30000); // Save every 30 seconds
  }

  // Generate hexagonal grid
  generateGrid() {
    console.log('🌐 Generating game grid...');
    const grid = document.getElementById('hexGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const state = this.stateManager.getState();
    state.cells.forEach((cell, index) => {
      const cellElement = document.createElement('div');
      cellElement.className = 'hex-cell tooltip';
      cellElement.dataset.index = index;
      
      grid.appendChild(cellElement);
    });
  }

  // Load game state from server or local storage
  async loadGameState() {
    try {
      console.log('📥 Loading game state...');
      
      if (this.api.isGuestMode()) {
        // Guest mode - load from local storage
        const saved = localStorage.getItem('farpost-game-state');
        if (saved) {
          try {
            const parsedState = JSON.parse(saved);
            this.stateManager.loadState(parsedState);
            console.log('✅ Game state loaded from local storage');
          } catch (error) {
            console.warn('Could not parse saved game state:', error);
          }
        }
      } else {
        // Authenticated user - try to load from server
        const result = await this.api.loadGameState();
        if (result.success && result.data) {
          this.stateManager.loadState(result.data);
          console.log('✅ Game state loaded from server');
        } else {
          console.log('📝 No server state found, using defaults');
        }
      }
    } catch (error) {
      console.warn('Error loading game state:', error);
    }
  }

  // Save game state to server and/or local storage
  async saveGameState() {
    try {
      const state = this.stateManager.getState();
      
      // Always save to local storage
      localStorage.setItem('farpost-game-state', JSON.stringify(state));
      
      // Save to server if authenticated
      if (!this.api.isGuestMode()) {
        const result = await this.api.saveGameState(state);
        if (!result.success) {
          console.warn('Failed to save to server:', result.error);
        }
      }
    } catch (error) {
      console.warn('Could not save game state:', error);
    }
  }

  // Reset game to initial state
  resetGame() {
    console.log('🔄 Resetting game...');
    
    // Clear saved states
    localStorage.removeItem('farpost-game-state');
    
    // Reset state manager
    this.stateManager.reset();
    
    // Update UI
    this.uiController.updateUI();
    
    // Save the reset state
    this.saveGameState();
    
    this.showNotification('Game reset successfully!', 'success');
  }

  // Show notification (delegate to UI controller)
  showNotification(message, type = 'info', duration = 5000) {
    this.uiController.showNotification(message, type, duration);
  }

  // Update user display in header (legacy compatibility)
  updateUserDisplay(user) {
    if (window.updateUserDisplay) {
      window.updateUserDisplay(user);
    }
  }

  // Check first visit (legacy compatibility)
  checkFirstVisit() {
    if (window.checkFirstVisit) {
      window.checkFirstVisit();
    }
  }

  // Get current game state (read-only)
  getGameState() {
    return this.stateManager.getState();
  }

  // Get game configuration
  getGameConfig() {
    return this.config;
  }

  // Purchase expedition (public API)
  purchaseExpedition(resourceType) {
    try {
      this.stateManager.purchaseExpedition(resourceType);
      this.showNotification(`Purchased ${resourceType} expedition!`, 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Purchase booster (public API)
  purchaseBooster(boosterType) {
    try {
      this.stateManager.purchaseBooster(boosterType);
      this.showNotification(`Purchased ${boosterType}!`, 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Purchase cell (public API)
  buyCell(cellIndex) {
    try {
      this.stateManager.purchaseCell(cellIndex);
      this.showNotification(`Purchased cell ${cellIndex}!`, 'success');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Deploy expedition (public API)
  deployExpedition(cellIndex, resourceType = null) {
    try {
      const state = this.stateManager.getState();
      const targetResourceType = resourceType || state.selectedExpedition;
      
      if (!targetResourceType) {
        this.showNotification('No expedition selected', 'error');
        return;
      }

      this.resourceManager.deployExpedition(cellIndex, targetResourceType);
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Collect resource (public API)
  collectResource(cellIndex) {
    try {
      this.resourceManager.collectResource(cellIndex);
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Use booster (public API)
  useBooster(cellIndex, boosterType = null) {
    try {
      const state = this.stateManager.getState();
      const targetBoosterType = boosterType || state.selectedBooster;
      
      if (!targetBoosterType) {
        this.showNotification('No booster selected', 'error');
        return;
      }

      this.resourceManager.applyBooster(cellIndex, targetBoosterType);
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Sell resources (public API)
  sellResources(resourceType, amount = null) {
    try {
      const result = this.resourceManager.sellResources(resourceType, amount);
      this.showNotification(
        `Sold ${result.amount} ${resourceType} for ${result.pointsGained} points! (+${result.xpGained} XP)`, 
        'success'
      );
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Select expedition (public API)
  selectExpedition(resourceType) {
    const state = this.stateManager.getState();
    
    if (state.expeditions[resourceType] === 0) {
      this.showNotification(`No ${resourceType} expeditions in inventory!`, 'error');
      return;
    }
    
    if (state.selectedExpedition === resourceType) {
      this.stateManager.updateState({
        selectedExpedition: null,
        mode: 'select'
      });
      this.showNotification(`Deselected ${resourceType} expedition.`, 'info');
    } else {
      this.stateManager.updateState({
        selectedExpedition: resourceType,
        selectedBooster: null,
        mode: 'deploy'
      });
      this.showNotification(`Selected ${resourceType} expedition. Click cells to deploy!`, 'success');
    }
  }

  // Select booster (public API)
  selectBooster(boosterType) {
    const state = this.stateManager.getState();
    
    if (state.boosters[boosterType] === 0) {
      this.showNotification(`No ${boosterType} boosters in inventory!`, 'error');
      return;
    }
    
    if (state.selectedBooster === boosterType) {
      this.stateManager.updateState({
        selectedBooster: null,
        mode: 'select'
      });
      this.showNotification(`Deselected ${boosterType}.`, 'info');
    } else {
      this.stateManager.updateState({
        selectedBooster: boosterType,
        selectedExpedition: null,
        mode: 'booster'
      });
      
      if (boosterType === 'Instant Extract') {
        this.showNotification(`Selected ${boosterType}. Click extracting cells to boost them instantly!`, 'success');
      } else {
        this.showNotification(`Selected ${boosterType}. Click ongoing expeditions to speed them up!`, 'success');
      }
    }
  }

  // Switch tab (public API)
  switchTab(tabName) {
    this.stateManager.updateState({ activeTab: tabName });
  }

  // Get extraction progress for all cells
  getExtractionProgress() {
    return this.resourceManager.getActiveExtractions();
  }

  // Cleanup
  destroy() {
    console.log('🔄 Destroying game engine...');
    
    if (this.resourceManager) {
      this.resourceManager.destroy();
    }
    
    if (this.uiController) {
      this.uiController.destroy();
    }
    
    this.isInitialized = false;
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
} else {
  window.GameEngine = GameEngine;
} 