/**
 * UIController - Handles all UI updates and interactions
 * Separates UI concerns from game logic for better maintainability
 */
class UIController {
  constructor(stateManager, resourceManager) {
    this.stateManager = stateManager;
    this.resourceManager = resourceManager;
    this.progressUpdateInterval = null;
    
    // Bind event handlers
    this.setupEventListeners();
    
    // Listen to state changes for UI updates
    this.stateManager.addEventListener('stateChange', () => {
      this.updateUI();
    });
    
    this.stateManager.addEventListener('levelUp', (data) => {
      this.showLevelUpNotification(data.oldLevel, data.newLevel);
    });
    
    this.stateManager.addEventListener('expeditionDeployed', (data) => {
      this.showNotification(`${data.resourceType} expedition deployed! Extract time: ${Math.ceil(data.duration/60000)}m`, 'success');
    });
    
    this.stateManager.addEventListener('resourceCollected', (data) => {
      this.showNotification(`Collected ${data.resourceType}! (+${data.xpGained} XP)`, 'success');
    });
    
    this.stateManager.addEventListener('extractionComplete', (data) => {
      this.showNotification(`${data.resourceType} extraction complete! Click to collect.`, 'info');
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-btn')) {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      }
    });

    // Start progress update interval
    this.startProgressUpdates();
  }

  // Update the entire UI
  updateUI() {
    this.updateHeader();
    this.updateGrid();
    this.updateInventory();
    this.updateTabContent();
    this.updateSelectionStatus();
    this.syncTabButtons();
  }

  // Update header with player stats
  updateHeader() {
    const state = this.stateManager.getState();
    
    // Update level
    const levelElement = document.getElementById('playerLevel');
    if (levelElement) {
      levelElement.textContent = state.level;
    }

    // Update XP
    const xpElement = document.getElementById('playerXP');
    if (xpElement) {
      xpElement.textContent = state.xp;
    }

    // Update points
    const pointsElement = document.getElementById('playerPoints');
    if (pointsElement) {
      pointsElement.textContent = state.points;
    }

    // Update owned cells
    const cellsElement = document.getElementById('ownedCells');
    if (cellsElement) {
      cellsElement.textContent = `${state.ownedCells}/${state.maxCells}`;
    }

    // Update XP progress bar
    this.updateXPProgressBar(state);
  }

  // Update XP progress bar
  updateXPProgressBar(state) {
    const progressBar = document.getElementById('xpProgress');
    if (!progressBar) return;

    const config = this.stateManager.config;
    const currentLevel = state.level;
    const currentXP = state.xp;
    
    if (currentLevel >= config.levelThresholds.length) {
      // Max level reached
      progressBar.style.width = '100%';
      return;
    }

    const currentThreshold = config.levelThresholds[currentLevel - 1] || 0;
    const nextThreshold = config.levelThresholds[currentLevel] || config.levelThresholds[config.levelThresholds.length - 1];
    
    const progressInLevel = currentXP - currentThreshold;
    const totalNeededForLevel = nextThreshold - currentThreshold;
    const progress = Math.min(100, (progressInLevel / totalNeededForLevel) * 100);
    
    progressBar.style.width = `${progress}%`;
  }

  // Update the hexagonal grid
  updateGrid() {
    const grid = document.getElementById('hexGrid');
    if (!grid) return;

    const state = this.stateManager.getState();
    
    // Update each cell
    state.cells.forEach((cell, index) => {
      const cellElement = grid.children[index];
      if (cellElement) {
        this.updateCellDisplay(cellElement, cell, index);
      }
    });
  }

  // Update individual cell display
  updateCellDisplay(element, cell, index) {
    const state = this.stateManager.getState();
    element.className = 'hex-cell tooltip';
    element.innerHTML = '';
    
    if (!cell.owned) {
      const config = this.stateManager.config;
      const canBuy = state.points >= config.cellPurchaseCost && state.ownedCells < state.maxCells;
      if (canBuy) {
        element.classList.add('available');
        element.textContent = '+';
        element.dataset.tooltip = `Click to buy for ${config.cellPurchaseCost} pts`;
      } else {
        element.classList.add('unavailable');
        element.textContent = '🔒';
        if (state.ownedCells >= state.maxCells) {
          element.dataset.tooltip = 'Max cells reached for your level';
        } else {
          element.dataset.tooltip = `Not enough points (need ${config.cellPurchaseCost})`;
        }
      }
    } else if (cell.isReady) {
      element.classList.add('ready');
      const config = this.stateManager.config.resources[cell.resourceType];
      element.textContent = config?.symbol || '⭐';
      element.dataset.tooltip = `${cell.resourceType} - Ready to collect!`;
    } else if (cell.extractionStartTime) {
      element.classList.add('extracting');
      const config = this.stateManager.config.resources[cell.resourceType];
      element.textContent = config?.symbol || '⚡';
      
      // Check if cell has a booster applied
      const cellBooster = state.boostedCells[index];
      if (cellBooster && cellBooster.endTime > Date.now()) {
        element.classList.add('booster-active');
        const boosterConfig = this.stateManager.config.boosters[cellBooster.boosterType];
        
        // Add booster type class for specific styling
        element.classList.add(`booster-${cellBooster.boosterType.toLowerCase().replace(/\s+/g, '-')}`);
        
        // Create booster indicator overlay
        const boosterIndicator = document.createElement('div');
        boosterIndicator.className = 'booster-indicator';
        boosterIndicator.textContent = boosterConfig?.symbol || '🚀';
        element.appendChild(boosterIndicator);
        
        // Enhanced tooltip with more booster information
        const timeRemaining = Math.ceil((cellBooster.endTime - Date.now()) / 1000 / 60);
        const speedMultiplier = cellBooster.speedMultiplier || boosterConfig.multiplier;
        element.dataset.tooltip = `${cell.resourceType} - Extracting (${cellBooster.boosterType} active - ${speedMultiplier}x speed, ${timeRemaining}m remaining)`;
      } else {
        element.dataset.tooltip = `${cell.resourceType} - Extracting...`;
      }
      
      const timer = document.createElement('div');
      timer.className = 'timer';
      element.appendChild(timer);
      
      const progressOverlay = document.createElement('div');
      progressOverlay.className = 'progress-overlay';
      element.appendChild(progressOverlay);
      
      this.updateCellTimer(element, cell);
    } else {
      element.classList.add('owned');
      
      // Check if cell has a booster applied (for non-extracting cells, shouldn't happen but handle gracefully)
      const cellBooster = state.boostedCells[index];
      if (cellBooster && cellBooster.endTime > Date.now()) {
        element.classList.add('booster-target');
        const boosterConfig = this.stateManager.config.boosters[cellBooster.boosterType];
        element.textContent = boosterConfig?.symbol || '🚀';
        const timeRemaining = Math.ceil((cellBooster.endTime - Date.now()) / 1000 / 60);
        element.dataset.tooltip = `${cellBooster.boosterType} applied - ${timeRemaining}m remaining`;
      } else {
        element.textContent = '⚡';
        element.dataset.tooltip = 'Owned cell - Ready for expedition';
      }
    }

    // Update click handler
    element.onclick = () => this.handleCellClick(index);
  }

  // Update cell timer and progress
  updateCellTimer(element, cell) {
    const timer = element.querySelector('.timer');
    const progressOverlay = element.querySelector('.progress-overlay');
    
    if (timer && progressOverlay) {
      const progressData = this.resourceManager.getExtractionProgress(parseInt(element.dataset.index));
      
      if (progressData) {
        progressOverlay.style.height = `${progressData.progress}%`;
        
        const totalMinutes = Math.floor(progressData.timeRemaining / 60000);
        const seconds = Math.floor((progressData.timeRemaining % 60000) / 1000);
        const timeStr = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
        timer.textContent = timeStr;
      }
    }
  }

  // Handle cell clicks
  handleCellClick(index) {
    const state = this.stateManager.getState();
    const cell = state.cells[index];
    
    try {
      if (!cell.owned) {
        this.stateManager.purchaseCell(index);
        return;
      }
      
      if (cell.isReady) {
        this.resourceManager.collectResource(index);
        return;
      }
      
      if (state.mode === 'deploy' && state.selectedExpedition) {
        this.resourceManager.deployExpedition(index, state.selectedExpedition);
        
        // Check if we still have expeditions available for continuous deployment
        const updatedState = this.stateManager.getState();
        if (updatedState.expeditions[state.selectedExpedition] <= 0) {
          // No more expeditions, clear selection
          this.stateManager.updateState({
            selectedExpedition: null,
            mode: 'select'
          });
          this.showNotification(`No more ${state.selectedExpedition} expeditions! Selection cleared.`, 'info');
        } else {
          // Still have expeditions, maintain selection for continuous deployment
          this.showNotification(`${state.selectedExpedition} deployed! (${updatedState.expeditions[state.selectedExpedition]} remaining)`, 'success');
        }
        return;
      }
      
      if (state.mode === 'booster' && state.selectedBooster && cell.extractionStartTime) {
        this.resourceManager.applyBooster(index, state.selectedBooster);
        
        // Check if we still have boosters available for continuous application
        const updatedState = this.stateManager.getState();
        if (updatedState.boosters[state.selectedBooster] <= 0) {
          // No more boosters, clear selection
          this.stateManager.updateState({
            selectedBooster: null,
            mode: 'select'
          });
          this.showNotification(`No more ${state.selectedBooster}! Selection cleared.`, 'info');
        } else {
          // Still have boosters, maintain selection for continuous application
          this.showNotification(`${state.selectedBooster} applied! (${updatedState.boosters[state.selectedBooster]} remaining)`, 'success');
        }
        return;
      }
      
      if (cell.extractionStartTime) {
        if (state.selectedBooster) {
          this.resourceManager.applyBooster(index, state.selectedBooster);
          
          // Check if we still have boosters available for continuous application
          const updatedState = this.stateManager.getState();
          if (updatedState.boosters[state.selectedBooster] <= 0) {
            // No more boosters, clear selection
            this.stateManager.updateState({
              selectedBooster: null,
              mode: 'select'
            });
            this.showNotification(`No more ${state.selectedBooster}! Selection cleared.`, 'info');
          } else {
            // Still have boosters, maintain selection for continuous application
            this.showNotification(`${state.selectedBooster} applied! (${updatedState.boosters[state.selectedBooster]} remaining)`, 'success');
          }
        } else {
          this.showNotification('This cell is already extracting! Use boosters to speed it up.', 'warning');
        }
        return;
      }
      
      this.showNotification('Cell is ready for expedition. Purchase and deploy expeditions from the Buy tab!', 'info');
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Update inventory display (deployment center - only expeditions and boosters)
  updateInventory() {
    const container = document.getElementById('resourceList');
    if (!container) return;

    const state = this.stateManager.getState();
    container.innerHTML = '';

    // Expeditions section
    const expeditionSection = document.createElement('div');
    expeditionSection.className = 'inventory-section';
    expeditionSection.innerHTML = '<div class="panel-title">🚀 Expeditions</div>';
    
    let hasExpeditions = false;
    Object.entries(state.expeditions).forEach(([resourceType, amount]) => {
      if (amount > 0) {
        hasExpeditions = true;
        const config = this.stateManager.config.resources[resourceType];
        const isSelected = state.selectedExpedition === resourceType;
        
        const item = document.createElement('div');
        item.className = `inventory-item expedition-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
          <div class="item-info">
            <div class="item-name">${resourceType}</div>
            <div class="item-details">${config.time}m extraction</div>
          </div>
          <div class="item-amount">${amount}</div>
        `;
        item.onclick = () => this.selectExpedition(resourceType);
        expeditionSection.appendChild(item);
      }
    });

    if (!hasExpeditions) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No expeditions owned - Purchase from Buy tab';
      expeditionSection.appendChild(emptyMessage);
    }

    container.appendChild(expeditionSection);

    // Boosters section
    const boosterSection = document.createElement('div');
    boosterSection.className = 'inventory-section';
    boosterSection.innerHTML = '<div class="panel-title">⚡ Boosters</div>';
    
    let hasBoosters = false;
    Object.entries(state.boosters).forEach(([boosterType, amount]) => {
      if (amount > 0) {
        hasBoosters = true;
        const config = this.stateManager.config.boosters[boosterType];
        const isSelected = state.selectedBooster === boosterType;
        
        const item = document.createElement('div');
        item.className = `inventory-item booster-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
          <div class="item-info">
            <div class="item-name">${config.symbol} ${boosterType}</div>
            <div class="item-details">${config.effect}</div>
          </div>
          <div class="item-amount">${amount}</div>
        `;
        item.onclick = () => this.selectBooster(boosterType);
        boosterSection.appendChild(item);
      }
    });

    if (!hasBoosters) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No boosters owned - Purchase from Boosters tab';
      boosterSection.appendChild(emptyMessage);
    }

    container.appendChild(boosterSection);
  }

  // Update tab content (buy/boosters/sell tabs)
  updateTabContent() {
    const state = this.stateManager.getState();
    const tabContent = document.getElementById('tabContent');
    if (!tabContent) return;
    
    if (state.activeTab === 'buy') {
      this.renderBuyTab(tabContent);
    } else if (state.activeTab === 'boosters') {
      this.renderBoostersTab(tabContent);
    } else if (state.activeTab === 'sell') {
      this.renderSellTab(tabContent);
    }
  }

  // Render buy tab content
  renderBuyTab(container) {
    const state = this.stateManager.getState();
    container.innerHTML = '<div class="panel-title">Purchase Expeditions</div>';
    
    Object.entries(this.stateManager.config.resources).forEach(([resourceType, config]) => {
      const canAfford = state.points >= config.cost;
      const levelOk = state.level >= config.level;
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
      
      container.appendChild(item);
    });
  }

  // Render boosters tab content
  renderBoostersTab(container) {
    const state = this.stateManager.getState();
    container.innerHTML = '<div class="panel-title">Purchase Boosters</div>';
    
    Object.entries(this.stateManager.config.boosters).forEach(([boosterType, config]) => {
      // Skip non-purchasable boosters
      if (config.purchasable === false) return;
      
      const canAfford = state.points >= config.cost;
      const levelOk = state.level >= config.level;
      const isDisabled = !canAfford || !levelOk;
      
      const item = document.createElement('div');
      item.className = `booster-item ${isDisabled ? 'disabled' : ''}`;
      item.innerHTML = `
        <div class="booster-info">
          <div class="booster-name">${config.symbol} ${boosterType}</div>
          <div class="booster-effect">${config.effect}</div>
          <div class="booster-cost">Cost: ${config.cost} pts</div>
          ${!levelOk ? `<div class="booster-cost" style="color: #f44336;">Requires Level ${config.level}</div>` : ''}
        </div>
        <div class="booster-amount">Buy</div>
      `;
      
      if (!isDisabled) {
        item.onclick = () => this.purchaseBooster(boosterType);
      }
      
      container.appendChild(item);
    });
  }

  // Render sell tab content
  renderSellTab(container) {
    const state = this.stateManager.getState();
    container.innerHTML = '<div class="panel-title">💰 Sell Resources</div>';
    
    let hasResources = false;
    Object.entries(state.resources).forEach(([resourceType, amount]) => {
      if (amount > 0) {
        hasResources = true;
        const config = this.stateManager.config.resources[resourceType];
        const item = document.createElement('div');
        item.className = 'resource-item';
        item.innerHTML = `
          <div>
            <div class="resource-name">${resourceType}</div>
            <div class="resource-value">${config.value} pts each</div>
            <div class="resource-total">Total value: ${amount * config.value} pts</div>
          </div>
          <div class="resource-amount">${amount}</div>
        `;
        item.onclick = () => this.sellResource(resourceType);
        container.appendChild(item);
      }
    });

    if (!hasResources) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No resources to sell - Deploy expeditions to collect resources';
      container.appendChild(emptyMessage);
    }
  }

  // Update selection status display
  updateSelectionStatus() {
    const state = this.stateManager.getState();
    const statusElement = document.getElementById('selectionStatus');
    if (!statusElement) return;

    if (state.selectedExpedition) {
      statusElement.textContent = `Selected: ${state.selectedExpedition} expedition - Click cells to deploy`;
      statusElement.className = 'selection-status selected';
    } else if (state.selectedBooster) {
      statusElement.textContent = `Selected: ${state.selectedBooster} - Click extracting cells to boost`;
      statusElement.className = 'selection-status selected';
    } else {
      statusElement.textContent = 'No selection - Purchase expeditions and boosters to get started';
      statusElement.className = 'selection-status';
    }
  }

  // Switch active tab
  switchTab(tabName) {
    const state = this.stateManager.getState();
    this.stateManager.updateState({ activeTab: tabName });

    // Update tab button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content to match the new active tab
    this.updateTabContent();
    
    // Emit tutorial events if tutorial is active
    if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
      switch (tabName) {
        case 'boosters':
          window.game.tutorial.handleAction('switch_to_boosters');
          break;
        case 'sell':
          window.game.tutorial.handleAction('switch_to_sell');
          break;
        case 'buy':
          window.game.tutorial.handleAction('switch_to_buy');
          break;
      }
    }
  }

  // Purchase expedition
  purchaseExpedition(resourceType) {
    try {
      this.stateManager.purchaseExpedition(resourceType);
      this.showNotification(`Purchased ${resourceType} expedition!`, 'success');
      
      // Emit tutorial event if tutorial is active
      if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
        window.game.tutorial.handleAction('purchase_expedition', { resourceType });
      }
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Purchase booster
  purchaseBooster(boosterType) {
    try {
      this.stateManager.purchaseBooster(boosterType);
      this.showNotification(`Purchased ${boosterType}!`, 'success');
      
      // Emit tutorial event if tutorial is active
      if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
        window.game.tutorial.handleAction('purchase_booster', { boosterType });
      }
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Select expedition for deployment
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
      const count = state.expeditions[resourceType];
      this.showNotification(`Selected ${resourceType} expedition (${count} available). Click cells to deploy continuously!`, 'success');
      
      // Emit tutorial event if tutorial is active
      if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
        window.game.tutorial.handleAction('select_expedition', { resourceType });
      }
    }
  }

  // Select booster for usage
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
      
      const count = state.boosters[boosterType];
      if (boosterType === 'Instant Extract') {
        this.showNotification(`Selected ${boosterType} (${count} available). Click extracting cells to boost them instantly!`, 'success');
      } else {
        this.showNotification(`Selected ${boosterType} (${count} available). Click extracting cells to speed them up continuously!`, 'success');
      }
    }
  }

  // Start progress updates for extraction timers
  startProgressUpdates() {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }

    // Use requestAnimationFrame for smoother updates when page is visible
    const updateLoop = () => {
      if (document.hidden) {
        // Page is hidden, use less frequent updates
        setTimeout(updateLoop, 5000);
      } else {
        this.updateExtractionProgress();
        setTimeout(updateLoop, 1000);
      }
    };
    
    updateLoop();
  }

  // Update extraction progress for all active cells
  updateExtractionProgress() {
    const state = this.stateManager.getState();
    const grid = document.getElementById('hexGrid');
    if (!grid) return;

    // Clean up expired boosters
    const currentTime = Date.now();
    const newBoostedCells = { ...state.boostedCells };
    let boostersExpired = false;

    Object.keys(newBoostedCells).forEach(cellIndex => {
      const booster = newBoostedCells[cellIndex];
      if (booster && booster.endTime <= currentTime) {
        delete newBoostedCells[cellIndex];
        boostersExpired = true;
        
        // Show notification when booster expires
        const cell = state.cells[parseInt(cellIndex)];
        if (cell && cell.extractionStartTime && !cell.isReady) {
          this.showNotification(`${booster.boosterType} expired on ${cell.resourceType} expedition`, 'info', 3000);
        }
      }
    });

    // Update state if any boosters expired
    if (boostersExpired) {
      this.stateManager.updateState({ boostedCells: newBoostedCells });
    }

    // Update cell displays and timers
    state.cells.forEach((cell, index) => {
      if (cell.extractionStartTime && !cell.isReady) {
        const cellElement = grid.children[index];
        if (cellElement) {
          this.updateCellTimer(cellElement, cell);
        }
      }
    });
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

  // Show level up notification
  showLevelUpNotification(oldLevel, newLevel) {
    this.showNotification(`🎉 Level Up! You are now level ${newLevel}!`, 'success', 8000);
  }

  // Sell resource
  sellResource(resourceType) {
    try {
      const result = this.resourceManager.sellResources(resourceType);
      this.showNotification(`Sold ${result.amount} ${resourceType} for ${result.pointsGained} points! (+${result.xpGained} XP)`, 'success');
      
      // Emit tutorial event if tutorial is active
      if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
        window.game.tutorial.handleAction('sell_resource', { resourceType, result });
      }
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
  }

  // Clean up
  destroy() {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }
  }

  // Ensure tab buttons match the state
  syncTabButtons() {
    const state = this.stateManager.getState();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
    });
  }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
} else {
  window.UIController = UIController;
} 