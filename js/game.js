// Main Game Logic for Farpost
class FarpostGame {
  constructor() {
    this.gameState = {
      level: 1,
      xp: 0,
      points: 1000,
      ownedCells: 3,
      maxCells: 3,
      selectedExpedition: null,
      selectedBooster: null,
      resources: {
        'Lunar Regolith': 0,
        'Iron Ore': 0,
        'Aluminum': 0,
        'Water Ice': 0,
        'Magnesium': 0,
        'Silicon': 0,
        'Titanium': 0,
        'Rare Earth Elements': 0,
        'Platinum Group Metals': 0,
        'Helium-3': 0
      },
      expeditions: {
        'Lunar Regolith': 0,
        'Iron Ore': 0,
        'Aluminum': 0,
        'Water Ice': 0,
        'Magnesium': 0,
        'Silicon': 0,
        'Titanium': 0,
        'Rare Earth Elements': 0,
        'Platinum Group Metals': 0,
        'Helium-3': 0
      },
      boosters: {
        'Basic Booster': { cost: 100, effect: '2x speed for 1 extraction', level: 3, speedMultiplier: 2, duration: 1, symbol: '⚡' },
        'Advanced Booster': { cost: 200, effect: '3x speed for 1 extraction', level: 5, speedMultiplier: 3, duration: 1, symbol: '⚡⚡' },
        'Elite Booster': { cost: 400, effect: '5x speed for 1 extraction', level: 8, speedMultiplier: 5, duration: 1, symbol: '⚡⚡⚡' },
        'Master Booster': { cost: 800, effect: '2x speed for 3 extractions', level: 12, speedMultiplier: 2, duration: 3, symbol: '🚀' },
        'Ultimate Booster': { cost: 1500, effect: '3x speed for 3 extractions', level: 16, speedMultiplier: 3, duration: 3, symbol: '🚀🚀' },
        'Instant Extract': { cost: 1000, effect: 'Complete extraction instantly', level: 10, speedMultiplier: 999, duration: 1, symbol: '⭐' }
      },
      cells: Array(18).fill(null).map((_, index) => ({
        id: index,
        owned: [7, 8, 9].includes(index), // Middle cells owned by default
        resourceType: null,
        extractionStartTime: null,
        extractionEndTime: null,
        isReady: false
      })),
      activeTab: 'buy',
      mode: 'select', // 'select', 'deploy', 'booster'
      debugSpeed: 1,
      // Booster tracking
      activeBooster: null,
      boosterUsesRemaining: 0,
      // Tutorial system
      tutorial: {
        isActive: false,
        completed: false,
        step: 0,
        initialSetup: false
      },
      // Achievement system
      achievements: {},
      // Statistics tracking
      stats: {
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
      }
    };

    this.api = null;
    this.farcasterIntegration = null;
    this.isFrameContext = false;
  }

  // Initialize game
  async init() {
    try {
      console.log('🎯 Initializing Farpost Game...');
      
      // Initialize API client
      this.api = new FarpostAPI();
      await this.api.init();
      
      // Initialize Farcaster integration
      this.farcasterIntegration = new FarcasterIntegration();
      this.isFrameContext = await this.farcasterIntegration.init(this.api);
    
      // Store references globally for legacy compatibility
      window.gameAPI = this.api;
      window.farcasterIntegration = this.farcasterIntegration;
      
      // Initialize tutorial and achievements systems
      this.tutorial = new TutorialSystem(this);
      this.achievements = new AchievementSystem(this);
      
      // Load game state (from server or local storage)
      if (!this.isFrameContext) {
        await this.loadGameState();
      }
      
      // Initialize achievement stats
      this.achievements.initializeStats();
      
      // Check if tutorial should start
      if (!this.gameState.tutorial.completed && !this.gameState.tutorial.initialSetup) {
        this.gameState.tutorial.initialSetup = true;
        setTimeout(() => {
          this.tutorial.startTutorial();
        }, 2000);
      }
      
      this.generateGrid();
      this.updateUI();
      this.setupEventListeners();
      this.startGameLoop();
      
      // Update user display
      this.updateUserDisplay(this.api.getUserInfo());
      
      // Check for first-time visitors (show auth modal)
      if (this.api.isGuestMode()) {
        checkFirstVisit();
      }
      
      // Hide loading screen
      setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('show');
      }, 500);
      
      console.log('✅ Game initialized successfully!');
      
    } catch (error) {
      console.error('Error initializing game:', error);
      this.showNotification('Failed to initialize game. Please refresh the page.', 'error');
      
      // Hide loading screen even if there's an error
      setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('show');
      }, 500);
    }
  }

  // Get game configuration from the CONFIG object
  getGameConfig() {
    return window.CONFIG?.game || {
      resources: {
        'Lunar Regolith': { time: 0.5, cost: 20, value: 50, xp: 15, level: 1, symbol: 'LR' },
        'Iron Ore': { time: 1, cost: 30, value: 100, xp: 25, level: 1, symbol: 'Fe' },
        'Aluminum': { time: 2, cost: 35, value: 150, xp: 30, level: 1, symbol: 'Al' },
        'Water Ice': { time: 4, cost: 40, value: 200, xp: 35, level: 1, symbol: 'H2O' },
        'Magnesium': { time: 6, cost: 45, value: 180, xp: 40, level: 5, symbol: 'Mg' },
        'Silicon': { time: 8, cost: 50, value: 250, xp: 45, level: 5, symbol: 'Si' },
        'Titanium': { time: 12, cost: 80, value: 500, xp: 60, level: 5, symbol: 'Ti' },
        'Rare Earth Elements': { time: 20, cost: 150, value: 1000, xp: 100, level: 10, symbol: 'REE' },
        'Platinum Group Metals': { time: 30, cost: 300, value: 2000, xp: 200, level: 15, symbol: 'PGM' },
        'Helium-3': { time: 60, cost: 500, value: 5000, xp: 500, level: 20, symbol: 'He3' }
      },
      boosters: {
        'Basic Booster': { cost: 100, effect: '2x speed for 1 extraction', level: 3, speedMultiplier: 2, duration: 1, symbol: '⚡' },
        'Advanced Booster': { cost: 200, effect: '3x speed for 1 extraction', level: 5, speedMultiplier: 3, duration: 1, symbol: '⚡⚡' },
        'Elite Booster': { cost: 400, effect: '5x speed for 1 extraction', level: 8, speedMultiplier: 5, duration: 1, symbol: '⚡⚡⚡' },
        'Master Booster': { cost: 800, effect: '2x speed for 3 extractions', level: 12, speedMultiplier: 2, duration: 3, symbol: '🚀' },
        'Ultimate Booster': { cost: 1500, effect: '3x speed for 3 extractions', level: 16, speedMultiplier: 3, duration: 3, symbol: '🚀🚀' },
        'Instant Extract': { cost: 1000, effect: 'Complete extraction instantly', level: 10, speedMultiplier: 999, duration: 1, symbol: '⭐' }
      },
      levelThresholds: {
        2: 1000, 3: 2500, 4: 5000, 5: 8000, 6: 12000, 7: 17000, 8: 23000, 9: 30000, 10: 38000,
        11: 47000, 12: 57000, 13: 68000, 14: 80000, 15: 93000, 16: 107000, 17: 122000, 18: 138000, 19: 155000, 20: 173000
      },
      cellUnlocks: { 1: 3, 3: 6, 5: 9, 8: 12, 12: 15, 20: 18 }
    };
  }

  // Load game state from local storage
  async loadGameState() {
    try {
      // For now, just use local storage since API isn't working yet
      const saved = localStorage.getItem('farpost-game-state');
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          this.gameState = { ...this.gameState, ...parsedState };
          console.log('✅ Game state loaded from local storage');
        } catch (error) {
          console.warn('Could not parse saved game state:', error);
        }
      }
    } catch (error) {
      console.warn('Error loading game state:', error);
    }
  }

  // Save game state to local storage
  async saveGameState() {
    try {
      localStorage.setItem('farpost-game-state', JSON.stringify(this.gameState));
      console.log('💾 Game state saved');
    } catch (error) {
      console.warn('Could not save game state:', error);
    }
  }

  // Show notification to user
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      padding: 16px 24px;
      border-radius: 12px;
      color: white;
      font-weight: bold;
      font-size: 16px;
      z-index: 10000;
      max-width: 500px;
      min-width: 250px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.2);
      opacity: 0;
      transition: all 0.4s ease-in-out;
      backdrop-filter: blur(10px);
    `;

    switch (type) {
      case 'success':
        notification.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
        notification.style.borderColor = '#4CAF50';
        break;
      case 'error':
        notification.style.backgroundColor = 'rgba(244, 67, 54, 0.95)';
        notification.style.borderColor = '#f44336';
        break;
      case 'warning':
        notification.style.backgroundColor = 'rgba(255, 152, 0, 0.95)';
        notification.style.borderColor = '#ff9800';
        break;
      default:
        notification.style.backgroundColor = 'rgba(33, 150, 243, 0.95)';
        notification.style.borderColor = '#2196F3';
    }

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    }, 50);

    setTimeout(() => {
      if (notification.parentNode) {
        // Animate out
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-30px) scale(0.9)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 400);
      }
    }, duration);
  }

  // Generate hexagonal grid
  generateGrid() {
    console.log('🌐 Generating game grid...');
    const grid = document.getElementById('hexGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    this.gameState.cells.forEach((cell, index) => {
      const cellElement = document.createElement('div');
      cellElement.className = 'hex-cell tooltip';
      cellElement.dataset.index = index;
      cellElement.onclick = () => this.selectCell(index);
      
      this.updateCellDisplay(cellElement, cell);
      grid.appendChild(cellElement);
    });
  }

  // Update cell display
  updateCellDisplay(element, cell) {
    const index = parseInt(element.dataset.index);
    element.className = 'hex-cell tooltip';
    
    // Clear any existing content
    element.innerHTML = '';
    
    if (!cell.owned) {
      const canBuy = this.gameState.points >= 500 && this.gameState.ownedCells < this.gameState.maxCells;
      if (canBuy) {
        element.classList.add('available');
        element.textContent = '+';
        element.dataset.tooltip = 'Click to buy for 500 pts';
      } else {
        element.classList.add('unavailable');
        element.textContent = '🔒';
        if (this.gameState.ownedCells >= this.gameState.maxCells) {
          element.dataset.tooltip = 'Max cells reached for your level';
        } else {
          element.dataset.tooltip = 'Not enough points (need 500)';
        }
      }
    } else if (cell.isReady) {
      element.classList.add('ready');
      const config = this.getGameConfig().resources[cell.resourceType];
      element.textContent = config?.symbol || '⭐';
      element.dataset.tooltip = `${cell.resourceType} - Ready to collect!`;
    } else if (cell.extractionStartTime) {
      element.classList.add('extracting');
      const config = this.getGameConfig().resources[cell.resourceType];
      element.textContent = config?.symbol || '⚡';
      
      const timer = document.createElement('div');
      timer.className = 'timer';
      element.appendChild(timer);
      
      const progressOverlay = document.createElement('div');
      progressOverlay.className = 'progress-overlay';
      element.appendChild(progressOverlay);
      
      this.updateCellTimer(element, cell);
      element.dataset.tooltip = `${cell.resourceType} - Extracting...`;
    } else {
      element.classList.add('owned');
      element.textContent = '⚡';
      element.dataset.tooltip = 'Owned cell - Ready for expedition';
    }
  }

  // Update cell timer and progress
  updateCellTimer(element, cell) {
    const timer = element.querySelector('.timer');
    const progressOverlay = element.querySelector('.progress-overlay');
    
    if (timer && progressOverlay) {
      const totalTime = cell.extractionEndTime - cell.extractionStartTime;
      const elapsed = Date.now() - cell.extractionStartTime;
      const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
      
      progressOverlay.style.height = `${progress}%`;
      
      const remaining = Math.max(0, cell.extractionEndTime - Date.now());
      const totalMinutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const timeStr = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
      timer.textContent = timeStr;
    }
  }

  // Select cell action
  selectCell(index) {
    const cell = this.gameState.cells[index];
    
    if (!cell.owned) {
      this.buyCell(index);
      return;
    }
    
    if (cell.isReady) {
      this.collectResource(index);
      return;
    }
    
    if (this.gameState.mode === 'deploy' && this.gameState.selectedExpedition) {
      this.deployExpedition(index);
      return;
    }
    
    if (this.gameState.mode === 'booster' && this.gameState.selectedBooster && cell.extractionStartTime) {
      this.useBooster(index, this.gameState.selectedBooster);
      return;
    }
    
    if (cell.extractionStartTime) {
      if (this.gameState.selectedBooster) {
        this.useBooster(index, this.gameState.selectedBooster);
      } else {
        this.showNotification('This cell is already extracting! Use boosters to speed it up.', 'warning');
      }
      return;
    }
    
    this.showNotification('Cell is ready for expedition. Purchase and deploy expeditions from the Buy tab!', 'info');
  }

  // Buy cell
  buyCell(index) {
    if (this.gameState.points < 500) {
      this.showNotification('Not enough points!', 'error');
      return;
    }
    
    if (this.gameState.ownedCells >= this.gameState.maxCells) {
      this.showNotification('Maximum cells reached for your level!', 'warning');
      return;
    }
    
    this.gameState.points -= 500;
    this.gameState.ownedCells++;
    this.gameState.cells[index].owned = true;
    this.gameState.xp += 150;
    
    // Track for achievements
    this.achievements?.trackAction('cell_purchased');
    this.achievements?.trackAction('points_spent', { amount: 500 });
    
    this.showNotification('Cell purchased successfully!', 'success');
    this.checkLevelUp();
    this.updateUI();
    this.saveGameState();
  }

  // Deploy expedition
  deployExpedition(index) {
    const cell = this.gameState.cells[index];
    
    if (this.gameState.expeditions[this.gameState.selectedExpedition] === 0) {
      this.showNotification(`No ${this.gameState.selectedExpedition} expeditions in inventory!`, 'error');
      return;
    }
    
    const resourceConfig = this.getGameConfig().resources[this.gameState.selectedExpedition];
    let extractionTime = resourceConfig.time * 60 * 1000; // Convert minutes to milliseconds
    extractionTime = Math.floor(extractionTime / this.gameState.debugSpeed);
    
    // Apply active booster effect if available
    if (this.gameState.activeBooster && this.gameState.boosterUsesRemaining > 0) {
      const boosterConfig = this.getGameConfig().boosters[this.gameState.activeBooster];
      if (boosterConfig && this.gameState.activeBooster !== 'Instant Extract') {
        extractionTime = Math.floor(extractionTime / boosterConfig.speedMultiplier);
        this.gameState.boosterUsesRemaining--;
        
        // Clear active booster if no uses remaining
        if (this.gameState.boosterUsesRemaining <= 0) {
          this.showNotification(`${this.gameState.activeBooster} effect expired!`, 'info');
          this.gameState.activeBooster = null;
          this.gameState.boosterUsesRemaining = 0;
        }
      }
    }
    
    // Deploy expedition
    this.gameState.expeditions[this.gameState.selectedExpedition]--;
    cell.resourceType = this.gameState.selectedExpedition;
    cell.extractionStartTime = Date.now();
    cell.extractionEndTime = Date.now() + extractionTime;
    cell.isReady = false;
    
    // Track for achievements and tutorial
    this.achievements?.trackAction('expedition_deployed');
    this.tutorial?.checkAction('deploy_expedition');
    
    const remaining = this.gameState.expeditions[this.gameState.selectedExpedition];
    if (remaining === 0) {
      this.showNotification(`Deployed last ${cell.resourceType} expedition!`, 'warning');
      this.gameState.selectedExpedition = null;
      this.gameState.mode = 'select';
    } else {
      this.showNotification(`Deployed ${cell.resourceType} expedition! (${remaining} remaining)`, 'success');
    }
    
    this.updateUI();
    this.saveGameState();
  }

  // Collect resource
  collectResource(index) {
    const cell = this.gameState.cells[index];
    const resourceType = cell.resourceType;
    const resourceConfig = this.getGameConfig().resources[resourceType];
    
    this.gameState.resources[resourceType]++;
    this.gameState.xp += resourceConfig.xp;
    
    // Track for achievements and tutorial
    this.achievements?.trackAction('resource_collected', { resourceType });
    this.tutorial?.checkAction('collect_resource');
    
    // Reset cell
    cell.resourceType = null;
    cell.extractionStartTime = null;
    cell.extractionEndTime = null;
    cell.isReady = false;
    
    this.showNotification(`Collected ${resourceType}!`, 'success');
    this.checkLevelUp();
    this.updateUI();
    this.saveGameState();
  }

  // Check level up
  checkLevelUp() {
    const nextThreshold = this.getGameConfig().levelThresholds[this.gameState.level];
    
    if (nextThreshold && this.gameState.xp >= nextThreshold) {
      this.gameState.level++;
      
      // Update max cells based on level
      const newMaxCells = Object.entries(this.getGameConfig().cellUnlocks)
        .filter(([level, _]) => parseInt(level) <= this.gameState.level)
        .pop()?.[1] || 3;
      
      this.gameState.maxCells = newMaxCells;
      
      this.showNotification(`Level up! You are now level ${this.gameState.level}!`, 'success');
      
      // Track level up for achievements
      this.achievements?.trackAction('level_up');
      
      this.updateUI();
      this.saveGameState();
    }
  }

  // Update user display
  updateUserDisplay(user) {
    updateUserDisplay(user);
  }

  // Award achievement (convenience method)
  awardAchievement(achievementId) {
    if (this.achievements) {
      this.achievements.awardAchievement(achievementId);
    }
  }

  // Update UI
  updateUI() {
    console.log('🔄 Updating UI...');
    
    // Update header stats
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.textContent = this.gameState.level;
    
    const currentThreshold = this.getGameConfig().levelThresholds[this.gameState.level - 1] || 0;
    const nextThreshold = this.getGameConfig().levelThresholds[this.gameState.level];
    
    const xpEl = document.getElementById('xp');
    const xpProgressEl = document.getElementById('xp-progress');
    
    if (xpEl && xpProgressEl) {
      if (nextThreshold) {
        const xpInCurrentLevel = this.gameState.xp - currentThreshold;
        const xpNeededForLevel = nextThreshold - currentThreshold;
        const xpProgress = (xpInCurrentLevel / xpNeededForLevel) * 100;
        xpEl.textContent = `${Math.max(0, xpInCurrentLevel)} / ${xpNeededForLevel}`;
        xpProgressEl.style.width = `${Math.max(0, Math.min(100, xpProgress))}%`;
      } else {
        xpEl.textContent = `${this.gameState.xp} / MAX`;
        xpProgressEl.style.width = '100%';
      }
    }
    
    const pointsEl = document.getElementById('points');
    if (pointsEl) pointsEl.textContent = this.gameState.points.toLocaleString();
    
    const cellsEl = document.getElementById('cells');
    if (cellsEl) cellsEl.textContent = `${this.gameState.ownedCells} / ${this.gameState.maxCells}`;
    
    // Update cells
    document.querySelectorAll('.hex-cell').forEach((element, index) => {
      this.updateCellDisplay(element, this.gameState.cells[index]);
    });

    this.updateTabContent();
    this.updateResourceList();
    this.updateCellInfo();
  }

  // Update cell info display
  updateCellInfo() {
    const cellInfo = document.getElementById('cellInfo');
    if (!cellInfo) return;
    
    if (this.gameState.mode === 'deploy' && this.gameState.selectedExpedition) {
      cellInfo.textContent = `Deploy ${this.gameState.selectedExpedition} • Right-click or ESC to deselect`;
      return;
    }
    
    if (this.gameState.mode === 'booster' && this.gameState.selectedBooster) {
      cellInfo.textContent = `Use ${this.gameState.selectedBooster} on extracting cells • Right-click or ESC to deselect`;
      return;
    }
    
    cellInfo.textContent = 'Buy expeditions, then deploy from Deployment Center';
  }

  // Update resource list
  updateResourceList() {
    const resourceList = document.getElementById('resourceList');
    if (!resourceList) return;
    
    resourceList.innerHTML = '';
    
    const expeditionTitle = document.createElement('div');
    expeditionTitle.className = 'panel-title';
    expeditionTitle.textContent = 'Deploy Expeditions';
    expeditionTitle.style.marginBottom = '10px';
    resourceList.appendChild(expeditionTitle);
    
    let hasExpeditions = false;
    Object.entries(this.getGameConfig().resources).forEach(([resourceType, resourceConfig]) => {
      if (resourceConfig.level <= this.gameState.level) {
        const amount = this.gameState.expeditions[resourceType] || 0;
        const isSelected = this.gameState.selectedExpedition === resourceType;
        const hasExp = amount > 0;
        
        if (hasExp) hasExpeditions = true;
        
        const item = document.createElement('div');
        item.className = `resource-item ${isSelected ? 'selected' : ''} ${!hasExp ? 'disabled' : ''}`;
        item.innerHTML = `
          <div>
            <div class="resource-name">${resourceType}</div>
            <div class="resource-value">${resourceConfig.time}m duration | ${resourceConfig.value} pts reward</div>
          </div>
          <div class="resource-amount">${amount}</div>
        `;
        
        if (hasExp) {
          item.onclick = () => this.selectExpedition(resourceType);
        }
        
        resourceList.appendChild(item);
      }
    });
    
    if (!hasExpeditions) {
      const noExpeditions = document.createElement('div');
      noExpeditions.className = 'resource-item disabled';
      noExpeditions.innerHTML = `
        <div>
          <div class="resource-name">Purchase expeditions from the Buy tab</div>
          <div class="resource-value">Select an expedition type above to deploy</div>
        </div>
        <div class="resource-amount">ℹ️</div>
      `;
      resourceList.appendChild(noExpeditions);
    }

    // Show active booster effect
    if (this.gameState.activeBooster && this.gameState.boosterUsesRemaining > 0) {
      const activeBoosterDiv = document.createElement('div');
      activeBoosterDiv.className = 'resource-item';
      activeBoosterDiv.style.background = 'rgba(33, 150, 243, 0.2)';
      activeBoosterDiv.style.borderLeft = '4px solid #2196F3';
      const boosterConfig = this.getGameConfig().boosters[this.gameState.activeBooster];
      activeBoosterDiv.innerHTML = `
        <div>
          <div class="resource-name">🚀 ${this.gameState.activeBooster} Active</div>
          <div class="resource-value">${boosterConfig?.effect || 'Speed boost active'}</div>
        </div>
        <div class="resource-amount">${this.gameState.boosterUsesRemaining} uses left</div>
      `;
      resourceList.appendChild(activeBoosterDiv);
    }

    // Add booster selection section
    const boosterTitle = document.createElement('div');
    boosterTitle.className = 'panel-title';
    boosterTitle.textContent = 'Use Boosters';
    boosterTitle.style.marginTop = '20px';
    boosterTitle.style.marginBottom = '10px';
    resourceList.appendChild(boosterTitle);
    
    let hasBoosters = false;
    Object.entries(this.getGameConfig().boosters).forEach(([boosterType, boosterConfig]) => {
      const amount = this.gameState.boosters[boosterType] || 0;
      const isSelected = this.gameState.selectedBooster === boosterType;
      const hasBooster = amount > 0;
      const levelOk = this.gameState.level >= boosterConfig.level;
      const canUse = hasBooster && !this.gameState.activeBooster && levelOk;
      
      if (hasBooster) hasBoosters = true;
      
      const item = document.createElement('div');
      item.className = `booster-item ${isSelected ? 'selected' : ''} ${!canUse ? 'disabled' : ''}`;
      item.innerHTML = `
        <div class="booster-info">
          <div class="booster-name">${boosterConfig.symbol} ${boosterType}</div>
          <div class="booster-effect">${boosterConfig.effect}</div>
          ${!levelOk ? `<div class="booster-cost" style="color: #f44336;">Requires Level ${boosterConfig.level}</div>` : ''}
        </div>
        <div class="resource-amount">${amount}</div>
      `;
      
      if (canUse) {
        item.onclick = () => this.selectBooster(boosterType);
      }
      
      resourceList.appendChild(item);
    });
    
    if (!hasBoosters) {
      const noBoosters = document.createElement('div');
      noBoosters.className = 'booster-item disabled';
      noBoosters.innerHTML = `
        <div class="booster-info">
          <div class="booster-name">Purchase boosters from the Boosters tab</div>
          <div class="booster-effect">Boosters speed up extraction times</div>
        </div>
        <div class="resource-amount">ℹ️</div>
      `;
      resourceList.appendChild(noBoosters);
    }
  }

  // Select expedition for deployment
  selectExpedition(resourceType) {
    if (this.gameState.expeditions[resourceType] === 0) {
      this.showNotification(`No ${resourceType} expeditions in inventory!`, 'error');
      return;
    }
    
    if (this.gameState.selectedExpedition === resourceType) {
      this.gameState.selectedExpedition = null;
      this.gameState.mode = 'select';
      this.showNotification(`Deselected ${resourceType} expedition.`, 'info');
    } else {
      this.gameState.selectedExpedition = resourceType;
      this.gameState.selectedBooster = null;
      this.gameState.mode = 'deploy';
      this.showNotification(`Selected ${resourceType} expedition. Click cells to deploy!`, 'success');
    }
    
    this.updateUI();
  }

  // Select booster for usage
  selectBooster(boosterType) {
    if (this.gameState.boosters[boosterType] === 0) {
      this.showNotification(`No ${boosterType} boosters in inventory!`, 'error');
      return;
    }
    
    if (this.gameState.activeBooster) {
      this.showNotification(`${this.gameState.activeBooster} is already active!`, 'warning');
      return;
    }
    
    if (this.gameState.selectedBooster === boosterType) {
      this.gameState.selectedBooster = null;
      this.gameState.mode = 'select';
      this.showNotification(`Deselected ${boosterType}.`, 'info');
    } else {
      this.gameState.selectedBooster = boosterType;
      this.gameState.selectedExpedition = null;
      this.gameState.mode = 'booster';
      this.showNotification(`Selected ${boosterType}. Click extracting cells to boost them!`, 'success');
    }
    
    this.updateUI();
  }

  // Use booster on a cell
  useBooster(cellIndex, boosterType) {
    const cell = this.gameState.cells[cellIndex];
    const boosterConfig = this.getGameConfig().boosters[boosterType];
    
    if (!cell.extractionStartTime || cell.isReady) {
      this.showNotification('Can only boost cells that are currently extracting!', 'error');
      return;
    }
    
    if (this.gameState.boosters[boosterType] === 0) {
      this.showNotification(`No ${boosterType} boosters in inventory!`, 'error');
      return;
    }
    
    // Use the booster
    this.gameState.boosters[boosterType]--;
    
    // Apply booster effect
    if (boosterType === 'Instant Extract') {
      // Instant extraction
      cell.isReady = true;
      cell.extractionEndTime = Date.now();
      this.showNotification(`${boosterType} used! Extraction completed instantly!`, 'success');
    } else {
      // Speed boost effect
      this.gameState.activeBooster = boosterType;
      this.gameState.boosterUsesRemaining = boosterConfig.duration;
      
      // Reduce remaining time based on speed multiplier
      const remaining = cell.extractionEndTime - Date.now();
      const newRemaining = Math.max(1000, remaining / boosterConfig.speedMultiplier);
      cell.extractionEndTime = Date.now() + newRemaining;
      
      this.showNotification(`${boosterType} activated! ${boosterConfig.speedMultiplier}x speed for ${boosterConfig.duration} extraction(s)!`, 'success');
    }
    
    // Track for achievements
    this.achievements?.trackAction('booster_used');
    
    // Clear selection
    this.gameState.selectedBooster = null;
    this.gameState.mode = 'select';
    
    this.updateUI();
    this.saveGameState();
  }

  // Update tab content
  updateTabContent() {
    const tabContent = document.getElementById('tabContent');
    if (!tabContent) return;
    
    if (this.gameState.activeTab === 'buy') {
      tabContent.innerHTML = '<div class="panel-title">Purchase Expeditions</div>';
      
      Object.entries(this.getGameConfig().resources).forEach(([resourceType, config]) => {
        const canAfford = this.gameState.points >= config.cost;
        const levelOk = this.gameState.level >= config.level;
        const isDisabled = !canAfford || !levelOk;
        
        const item = document.createElement('div');
        item.className = `resource-item ${isDisabled ? 'disabled' : ''}`;
        item.innerHTML = `
          <div>
            <div class="resource-name">${resourceType}</div>
            <div class="resource-value">${config.value} pts reward | ${config.time}m duration</div>
            <div class="resource-cost">Cost: ${config.cost} pts</div>
            ${!levelOk ? `<div class="resource-cost" style="color: #f44336;">Requires Level ${config.level}</div>` : ''}
          </div>
          <div class="resource-amount">Buy</div>
        `;
        
        if (!isDisabled) {
          item.onclick = () => this.purchaseExpedition(resourceType);
        }
        
        tabContent.appendChild(item);
      });
      
    } else if (this.gameState.activeTab === 'boosters') {
      tabContent.innerHTML = '<div class="panel-title">Purchase Boosters</div>';
      
      Object.entries(this.getGameConfig().boosters).forEach(([boosterType, config]) => {
        const canAfford = this.gameState.points >= config.cost;
        const levelOk = this.gameState.level >= config.level;
        const isDisabled = !canAfford || !levelOk;
        const ownedAmount = this.gameState.boosters[boosterType] || 0;
        
        const item = document.createElement('div');
        item.className = `booster-item ${isDisabled ? 'disabled' : ''}`;
        item.innerHTML = `
          <div class="booster-info">
            <div class="booster-name">${config.symbol} ${boosterType}</div>
            <div class="booster-effect">${config.effect}</div>
            <div class="booster-cost">Cost: ${config.cost} pts</div>
            ${!levelOk ? `<div class="booster-cost" style="color: #f44336;">Requires Level ${config.level}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="resource-amount">Owned: ${ownedAmount}</div>
            <div class="resource-amount" style="color: #FF9800;">Buy</div>
          </div>
        `;
        
        if (!isDisabled) {
          item.onclick = () => this.purchaseBooster(boosterType);
        }
        
        tabContent.appendChild(item);
      });
      
    } else if (this.gameState.activeTab === 'sell') {
      tabContent.innerHTML = '<div class="panel-title">Collected Resources</div>';
      
      let hasResources = false;
      Object.entries(this.gameState.resources).forEach(([resourceType, amount]) => {
        if (amount > 0) {
          hasResources = true;
          const resourceConfig = this.getGameConfig().resources[resourceType];
          const totalValue = resourceConfig.value * amount;
          const item = document.createElement('div');
          item.className = 'resource-item';
          item.innerHTML = `
            <div>
              <div class="resource-name">${resourceType}</div>
              <div class="resource-value">Value: ${resourceConfig.value} pts each (Total: ${totalValue} pts)</div>
            </div>
            <div class="resource-amount">${amount}</div>
          `;
          tabContent.appendChild(item);
        }
      });
      
      if (hasResources) {
        const sellAllButton = document.createElement('div');
        sellAllButton.className = 'resource-item';
        sellAllButton.style.background = 'rgba(76, 175, 80, 0.2)';
        sellAllButton.style.borderLeft = '4px solid #4CAF50';
        sellAllButton.innerHTML = `
          <div>
            <div class="resource-name">💰 Sell All Resources</div>
            <div class="resource-value">Convert all resources to points</div>
          </div>
          <div class="resource-amount">Sell All</div>
        `;
        sellAllButton.onclick = () => this.sellResources();
        tabContent.appendChild(sellAllButton);
      } else {
        const noResources = document.createElement('div');
        noResources.className = 'resource-item disabled';
        noResources.innerHTML = `
          <div>
            <div class="resource-name">No resources collected yet</div>
            <div class="resource-value">Deploy expeditions to collect resources</div>
          </div>
          <div class="resource-amount">0</div>
        `;
        tabContent.appendChild(noResources);
      }
    }
  }

  // Purchase expedition
  purchaseExpedition(resourceType) {
    const resourceConfig = this.getGameConfig().resources[resourceType];
    
    if (resourceConfig.level > this.gameState.level) {
      this.showNotification(`Level ${resourceConfig.level} required for ${resourceType}!`, 'error');
      return;
    }
    
    if (this.gameState.points < resourceConfig.cost) {
      this.showNotification(`Not enough points! Need ${resourceConfig.cost} points for ${resourceType} expedition.`, 'error');
      return;
    }
    
    this.gameState.points -= resourceConfig.cost;
    this.gameState.expeditions[resourceType] = (this.gameState.expeditions[resourceType] || 0) + 1;
    
    // Track for achievements and tutorial
    this.achievements?.trackAction('expedition_purchased');
    this.achievements?.trackAction('points_spent', { amount: resourceConfig.cost });
    this.tutorial?.checkAction('purchase_expedition', { resourceType });
    
    this.showNotification(`Purchased ${resourceType} expedition! (Owned: ${this.gameState.expeditions[resourceType]})`, 'success');
    
    this.updateUI();
    this.saveGameState();
  }

  // Purchase booster
  purchaseBooster(boosterType) {
    const boosterConfig = this.getGameConfig().boosters[boosterType];
    
    if (boosterConfig.level > this.gameState.level) {
      this.showNotification(`Level ${boosterConfig.level} required for ${boosterType}!`, 'error');
      return;
    }
    
    if (this.gameState.points < boosterConfig.cost) {
      this.showNotification(`Not enough points! Need ${boosterConfig.cost} points for ${boosterType}.`, 'error');
      return;
    }
    
    this.gameState.points -= boosterConfig.cost;
    this.gameState.boosters[boosterType] = (this.gameState.boosters[boosterType] || 0) + 1;
    
    // Track for achievements
    this.achievements?.trackAction('points_spent', { amount: boosterConfig.cost });
    
    this.showNotification(`Purchased ${boosterType}! (Owned: ${this.gameState.boosters[boosterType]})`, 'success');
    
    this.updateUI();
    this.saveGameState();
  }

  // Sell resources
  sellResources() {
    let totalValue = 0;
    let soldItems = 0;
    
    Object.entries(this.gameState.resources).forEach(([resourceType, amount]) => {
      if (amount > 0) {
        const value = this.getGameConfig().resources[resourceType].value * amount;
        totalValue += value;
        soldItems += amount;
        this.gameState.resources[resourceType] = 0;
      }
    });
    
    if (totalValue === 0) {
      this.showNotification('No resources to sell!', 'warning');
      return;
    }
    
    this.gameState.points += totalValue;
    this.gameState.xp += Math.floor(totalValue * 0.05);
    
    // Track for achievements and tutorial
    this.achievements?.trackAction('resources_sold', { amount: soldItems });
    this.tutorial?.checkAction('sell_resources');
    
    this.showNotification(`Sold ${soldItems} resources for ${totalValue} points!`, 'success');
    this.checkLevelUp();
    this.updateUI();
    this.saveGameState();
  }

  // Setup event listeners
  setupEventListeners() {
    console.log('🎮 Setting up event listeners...');
    
    const buyTab = document.getElementById('buyTab');
    const boostersTab = document.getElementById('boostersTab');
    const sellTab = document.getElementById('sellTab');
    
    if (buyTab) {
      buyTab.onclick = () => {
        this.gameState.activeTab = 'buy';
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        buyTab.classList.add('active');
        this.updateUI();
      };
    }
    
    if (boostersTab) {
      boostersTab.onclick = () => {
        this.gameState.activeTab = 'boosters';
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        boostersTab.classList.add('active');
        this.updateUI();
      };
    }
    
    if (sellTab) {
      sellTab.onclick = () => {
        this.gameState.activeTab = 'sell';
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        sellTab.classList.add('active');
        this.updateUI();
      };
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.deselectAll();
      }
    });
    
    document.addEventListener('contextmenu', (e) => {
      if (this.gameState.selectedExpedition || this.gameState.selectedBooster) {
        e.preventDefault();
        this.deselectAll();
      }
    });
  }

  // Deselect all selections
  deselectAll() {
    if (this.gameState.selectedExpedition || this.gameState.selectedBooster) {
      const wasSelected = this.gameState.selectedExpedition || this.gameState.selectedBooster;
      this.gameState.selectedExpedition = null;
      this.gameState.selectedBooster = null;
      this.gameState.mode = 'select';
      this.showNotification(`Deselected ${wasSelected}.`, 'info');
      this.updateUI();
    }
  }

  // Start game loop
  startGameLoop() {
    console.log('⏰ Starting game loop...');
    
    setInterval(() => {
      const now = Date.now();
      let updated = false;
      
      this.gameState.cells.forEach((cell, index) => {
        if (cell.extractionEndTime && now >= cell.extractionEndTime && !cell.isReady) {
          console.log(`🔔 Cell ${index} (${cell.resourceType}) extraction completed! Marking as ready.`);
          cell.isReady = true;
          updated = true;
          
          // Show notification that resource is ready
          this.showNotification(`${cell.resourceType} ready for collection in cell ${index}!`, 'success');
        }
      });
      
      if (updated) {
        console.log('🔄 Updating UI due to newly ready resources');
        this.updateUI();
        this.saveGameState();
      }
      
      document.querySelectorAll('.hex-cell').forEach((element, index) => {
        const cell = this.gameState.cells[index];
        if (cell.extractionStartTime && !cell.isReady) {
          this.updateCellTimer(element, cell);
        }
      });
    }, 1000);
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.game = new FarpostGame();
  await window.game.init();
});

// Global functions for HTML onclick handlers
window.shareProgress = function() {
  window.game?.showNotification('Share feature coming soon!', 'info');
};

window.resetGame = function() {
  if (confirm('Are you sure you want to reset all game progress? This cannot be undone!')) {
    localStorage.removeItem('farpost-game-state');
    window.location.reload();
  }
};

window.toggleDebug = function() {
  const debugPanel = document.getElementById('debugPanel');
  if (debugPanel) {
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
  }
};

// Export for global access
window.FarpostGame = FarpostGame;