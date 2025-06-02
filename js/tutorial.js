/**
 * New Tutorial System for Farpost Game
 * Rebuilt from scratch for reliability and maintainability
 */

class TutorialSystem {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialData = null;
    this.completedActions = new Set();
    this.stepChangeTimeout = null;
    this.extractionCheckInterval = null;
    
    // Tutorial step definitions
    this.steps = [
      {
        id: 0,
        title: "Welcome to Farpost! 🌙",
        description: "Welcome to the Moon's surface! You're about to start your lunar mining adventure. Let's learn the basics.",
        type: 'modal', // modal, action, auto
        highlight: null,
        requiredAction: null,
        onEnter: () => this.setupTutorialEnvironment(),
        onExit: () => console.log('Welcome step completed')
      },
      {
        id: 1,
        title: "Buy Your First Expedition ⛏️",
        description: "First, you need to purchase an expedition to extract resources. Click on the 'Buy' tab to see available expeditions.",
        type: 'action',
        highlight: '.tab-btn[data-tab="buy"]',
        requiredAction: 'switch_to_buy',
        onEnter: () => this.highlightBuyTab(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 2,
        title: "Purchase an Expedition 🛒",
        description: "Great! Now click on the 'Lunar Regolith' expedition to purchase it. During the tutorial, only Lunar Regolith expeditions are available to help you learn the basics.",
        type: 'action',
        highlight: '.resource-item:not(.disabled)',
        requiredAction: 'purchase_expedition',
        onEnter: () => this.highlightBuyButtons(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 3,
        title: "Select Your Expedition 📦",
        description: "Perfect! Now you have an expedition in your inventory. Click on the 'Lunar Regolith' expedition in your inventory to select it for deployment.",
        type: 'action',
        highlight: '.inventory-item.expedition-item',
        requiredAction: 'select_expedition',
        onEnter: () => this.highlightInventoryExpeditions(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 4,
        title: "Deploy to a Cell 🚀",
        description: "Great! Your expedition is now selected. Click on one of your owned cells (marked with ⚡) to deploy it.",
        type: 'action',
        highlight: '.hex-cell.owned',
        requiredAction: 'deploy_expedition',
        onEnter: () => this.highlightOwnedCells(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 5,
        title: "Learn About Boosters ⚡",
        description: "Perfect! Your expedition is now extracting resources. Instead of waiting, let's learn about boosters! Go to the 'Boosters' tab to see how you can speed up your expeditions.",
        type: 'action',
        highlight: '.tab-btn[data-tab="boosters"]',
        requiredAction: 'switch_to_boosters',
        onEnter: () => this.highlightBoostersTab(),
        onExit: () => {
          this.clearAllHighlights();
          this.giveInstantExtractBooster();
        }
      },
      {
        id: 6,
        title: "Select Your Free Instant Extract! ⭐",
        description: "Great! Here's a free Instant Extract booster for the tutorial. Click on it to select it for use on your extracting expedition.",
        type: 'action',
        highlight: '.booster-item',
        requiredAction: 'select_booster',
        onEnter: () => this.highlightBoosterItems(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 7,
        title: "Use Instant Extract Booster 🚀",
        description: "Perfect! Now you have an Instant Extract booster selected. Click on your extracting cell to instantly complete the expedition!",
        type: 'action',
        highlight: '.hex-cell.extracting',
        requiredAction: 'booster_applied',
        onEnter: () => this.highlightExtractingCell(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 8,
        title: "Collect Your Resources 💎",
        description: "Excellent! The booster instantly completed your extraction. Click on the glowing cell to collect your resource.",
        type: 'action',
        highlight: '.hex-cell.ready',
        requiredAction: 'collect_resource',
        onEnter: () => this.highlightReadyCell(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 9,
        title: "Sell Resources for Points 💰",
        description: "Now you have resources! Go to the 'Sell' tab and click on your resource to convert it into points.",
        type: 'action',
        highlight: '.tab-btn[data-tab="sell"]',
        requiredAction: 'switch_to_sell',
        onEnter: () => this.highlightSellTab(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 10,
        title: "Complete the Sale 💎",
        description: "Excellent! Now click on your resource item to sell it for points.",
        type: 'action',
        highlight: '.resource-item',
        requiredAction: 'sell_resource',
        onEnter: () => this.highlightSellButton(),
        onExit: () => this.clearAllHighlights()
      },
      {
        id: 11,
        title: "Tutorial Complete! 🎉",
        description: "Congratulations! You've learned the complete game loop: Buy expeditions → Deploy → Use boosters → Collect → Sell → Repeat. You're ready to build your lunar mining empire!",
        type: 'modal',
        highlight: null,
        requiredAction: null,
        onEnter: () => this.completeTutorial(),
        onExit: () => console.log('Tutorial fully completed')
      }
    ];
    
    this.initializeEventListeners();
  }

  // Initialize event listeners for tutorial system
  initializeEventListeners() {
    // Listen for game state changes to detect tutorial progress
    if (this.game.stateManager) {
      this.game.stateManager.addEventListener('stateChange', (data) => {
        if (!this.isActive) return;
        this.checkForActionCompletion(data);
      });
    }
  }

  // Start tutorial from the beginning
  startTutorial() {
    console.log('🎓 Starting tutorial system...');
    
    // Reset tutorial state
    this.isActive = true;
    this.currentStep = 0;
    this.completedActions.clear();
    this.clearAllIntervals();
    
    // Save tutorial state
    this.saveTutorialState();
    
    // Update game state to indicate tutorial is active
    this.game.stateManager.updateState({
      tutorial: { 
        isActive: true, 
        completed: false, 
        step: 0, 
        initialSetup: true 
      }
    });
    
    // Start with the first step
    this.showCurrentStep();
  }

  // Resume tutorial from saved state
  resumeTutorial() {
    const tutorialState = this.loadTutorialState();
    if (!tutorialState || tutorialState.completed) {
      console.log('🎓 No tutorial state to resume');
      return false;
    }
    
    console.log(`🎓 Resuming tutorial from step ${tutorialState.currentStep}`);
    
    this.isActive = true;
    this.currentStep = tutorialState.currentStep;
    this.completedActions = new Set(tutorialState.completedActions || []);
    
    // Restore tutorial environment if needed
    if (this.currentStep > 0) {
    this.setupTutorialEnvironment();
    }
    
    this.showCurrentStep();
    return true;
  }

  // Show the current tutorial step
  showCurrentStep() {
    if (!this.isActive || this.currentStep >= this.steps.length) {
      console.log('🎓 Tutorial completed or not active');
      return;
    }

    const step = this.steps[this.currentStep];
    console.log(`🎓 Showing step ${this.currentStep}: ${step.title}`);
    
    // Execute step enter callback
    if (step.onEnter) {
      step.onEnter();
    }
    
    // Save current state
    this.saveTutorialState();
    
    // Handle step type
    if (step.type === 'modal') {
      this.showModal(step);
    } else if (step.type === 'action') {
      this.setupActionStep(step);
    } else if (step.type === 'auto') {
      this.setupAutoStep(step);
    }
  }

  // Show tutorial modal
  showModal(step) {
    console.log(`🎓 Showing modal for step: ${step.title}`);
    
    const modal = document.getElementById('tutorialModal');
    const title = document.getElementById('tutorialTitle');
    const description = document.getElementById('tutorialDescription');

    if (!modal || !title || !description) {
      console.error('🎓 Tutorial modal elements not found!');
      return;
    }

    title.textContent = step.title;
    description.textContent = step.description;
    
    // Show modal with animation
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
    
    // Disable tutorial blocking while modal is visible
    this.disableBlocking();
  }

  // Setup action step (requires user interaction)
  setupActionStep(step) {
    console.log(`🎓 Setting up action step: ${step.title}`);
    
    // Hide any existing modal
    this.hideModal();
    
    // Wait for modal to hide, then apply highlighting
    setTimeout(() => {
      if (step.highlight) {
        this.applyHighlighting(step.highlight);
      }
      this.enableBlocking();
    }, 300);
  }

  // Setup auto step (automatically progresses)
  setupAutoStep(step) {
    console.log(`🎓 Setting up auto step: ${step.title}`);
    
    // Hide modal first
    this.hideModal();
    
    // Apply highlighting if specified
    setTimeout(() => {
      if (step.highlight) {
        this.applyHighlighting(step.highlight);
      }
      this.enableBlocking();
    }, 300);
  }

  // Handle tutorial actions
  handleAction(actionType, data = {}) {
    if (!this.isActive) return;
    
    const currentStep = this.steps[this.currentStep];
    if (!currentStep) return;
    
    console.log(`🎓 Handling action: ${actionType} for step ${this.currentStep}`);
    
    // Check if this action completes the current step
    if (currentStep.requiredAction === actionType) {
      this.completeCurrentStep();
    } else {
      // Track action for potential future use
      this.completedActions.add(actionType);
    }
  }

  // Complete current step and move to next
  completeCurrentStep() {
    if (!this.isActive) {
      console.warn('🎓 completeCurrentStep called but tutorial is not active');
      return;
    }
    
    if (this.currentStep >= this.steps.length) {
      console.log('🎓 Tutorial already completed');
      this.completeTutorial();
      return;
    }
    
    const step = this.steps[this.currentStep];
    console.log(`🎓 Completing step ${this.currentStep}: ${step.title}`);
    
    // Execute step exit callback
    if (step.onExit) {
      step.onExit();
    }
    
    // Clear any step-specific intervals or timeouts
    this.clearAllIntervals();
    
    // Mark action as completed
    if (step.requiredAction) {
      this.completedActions.add(step.requiredAction);
    }
    
    // Move to next step
    this.currentStep++;
    
    // Save progress
    this.saveTutorialState();
    
    // Hide modal first if it's open
    this.hideModal();
    
    // Check if tutorial is complete
    if (this.currentStep >= this.steps.length) {
      console.log('🎓 Tutorial flow completed');
      this.completeTutorial();
    } else {
      // Show next step after a brief delay
      this.stepChangeTimeout = setTimeout(() => {
        this.showCurrentStep();
      }, 500);
    }
  }

  // Setup tutorial environment (points, but no speed changes)
  setupTutorialEnvironment() {
    console.log('🎓 Setting up tutorial environment...');
    console.log('🎓 ℹ️  Tutorial runs at normal extraction speeds - no speed modifications applied');
    
    const currentState = this.game.stateManager.getState();
    
    const updates = {
      points: Math.max(1000, currentState.points),
      selectedExpedition: null,
      selectedBooster: null,
      mode: 'select'
    };

    // Reset any active extractions for clean tutorial
    updates.cells = currentState.cells.map(cell => ({
      ...cell,
      extractionStartTime: null,
      extractionEndTime: null,
      isReady: false,
      resourceType: null
    }));

    this.game.stateManager.updateState(updates);
    
    // Force UI refresh
    if (this.game.uiController) {
    this.game.uiController.updateUI();
    }
  }

  // Apply highlighting to specified elements
  applyHighlighting(selector) {
    console.log(`🎓 Applying highlighting to: ${selector}`);
    
    // Clear existing highlights first
    this.clearAllHighlights();
    
    // Apply new highlights
    const elements = document.querySelectorAll(selector);
    console.log(`🎓 Found ${elements.length} elements to highlight`);
    
    elements.forEach((element, index) => {
      element.classList.add('tutorial-highlight');
      element.classList.remove('tutorial-blocked');
      console.log(`🎓 Highlighted element ${index + 1}:`, element);
    });
  }

  // Clear all highlighting
  clearAllHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(element => {
      element.classList.remove('tutorial-highlight');
    });
  }

  // Enable tutorial blocking (dim non-highlighted elements)
  enableBlocking() {
    console.log('🎓 Enabling tutorial blocking...');
    
    // Add blocking overlay
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }

    // Block UI elements except highlighted ones
    const elementsToBlock = [
      '.hex-cell:not(.tutorial-highlight)',
      '.inventory-item:not(.tutorial-highlight)', 
      '.tab-btn:not(.tutorial-highlight)',
      '.resource-item:not(.tutorial-highlight)',
      '.booster-item:not(.tutorial-highlight)',
      '.achievements-btn:not(.tutorial-highlight)',
      '#debugPanel'
    ];

    elementsToBlock.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.classList.contains('tutorial-highlight')) {
          element.classList.add('tutorial-blocked');
        }
      });
    });

    // Ensure tutorial controls and highlighted areas are never blocked
    document.querySelectorAll('.tutorial-btn, .tutorial-skip, #tutorialModal, .tutorial-content, .tutorial-highlight').forEach(element => {
      element.classList.remove('tutorial-blocked');
      // Also ensure children of highlighted elements are not blocked
      element.querySelectorAll('*').forEach(child => {
        child.classList.remove('tutorial-blocked');
      });
    });
    
    // Special handling for tab content areas to ensure scrolling works
    document.querySelectorAll('#tabContent, .booster-panel, .resource-panel').forEach(element => {
      if (element.querySelector('.tutorial-highlight')) {
        element.classList.remove('tutorial-blocked');
        element.style.pointerEvents = 'auto';
        element.style.overflow = 'auto';
      }
    });
  }

  // Disable tutorial blocking
  disableBlocking() {
    console.log('🎓 Disabling tutorial blocking...');
    
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }

    document.querySelectorAll('.tutorial-blocked').forEach(element => {
      element.classList.remove('tutorial-blocked');
    });
  }

  // Hide tutorial modal
  hideModal() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }

  // Step-specific highlighting methods
  highlightBuyTab() {
    setTimeout(() => {
      this.applyHighlighting('.tab-btn[data-tab="buy"]');
    }, 100);
  }

  highlightBuyButtons() {
    setTimeout(() => {
      // During tutorial, specifically highlight only the Lunar Regolith expedition
      const gameState = this.game.stateManager.getState();
      if (gameState.tutorial && gameState.tutorial.isActive) {
        // Find and highlight only the Lunar Regolith resource item
        const resourceItems = document.querySelectorAll('.resource-item');
        resourceItems.forEach(item => {
          const resourceName = item.querySelector('.resource-name');
          if (resourceName && resourceName.textContent === 'Lunar Regolith') {
            item.classList.add('tutorial-highlight');
          }
        });
      } else {
        // Normal highlighting for all non-disabled items
        this.applyHighlighting('.resource-item:not(.disabled)');
      }
      
      // Also highlight the tab content container to ensure scrolling works
      const tabContent = document.getElementById('tabContent');
      const resourcePanel = document.querySelector('.resource-panel');
      if (tabContent) {
        tabContent.classList.add('tutorial-highlight');
      }
      if (resourcePanel) {
        resourcePanel.classList.add('tutorial-highlight');
      }
    }, 100);
  }

  highlightInventoryExpeditions() {
    setTimeout(() => {
      this.applyHighlighting('.inventory-item.expedition-item');
    }, 100);
  }

  highlightOwnedCells() {
    setTimeout(() => {
      this.applyHighlighting('.hex-cell.owned');
    }, 100);
  }

  highlightReadyCell() {
    setTimeout(() => {
      this.applyHighlighting('.hex-cell.ready');
    }, 100);
  }

  highlightBoostersTab() {
    setTimeout(() => {
      this.applyHighlighting('.tab-btn[data-tab="boosters"]');
    }, 100);
  }

  highlightBoosterItems() {
    setTimeout(() => {
      // Highlight specifically the Instant Extract booster in the inventory
      this.applyHighlighting('.inventory-item.booster-item');
    }, 100);
  }

  highlightSellTab() {
    setTimeout(() => {
      this.applyHighlighting('.tab-btn[data-tab="sell"]');
    }, 100);
  }

  highlightSellButton() {
    setTimeout(() => {
      this.applyHighlighting('.resource-item');
    }, 100);
  }

  // Wait for extraction to complete (auto step)
  waitForExtraction() {
    console.log('🎓 Starting extraction wait...');
    
    this.extractionCheckInterval = setInterval(() => {
      const state = this.game.stateManager.getState();
      const hasReadyCell = state.cells.some(cell => cell.isReady);
      
      if (hasReadyCell) {
        console.log('🎓 Extraction completed, progressing to next step');
        this.handleAction('extraction_complete');
      }
    }, 500);
  }

  // Clear extraction wait interval
  clearExtractionWait() {
    if (this.extractionCheckInterval) {
      clearInterval(this.extractionCheckInterval);
      this.extractionCheckInterval = null;
    }
  }

  // Clear all intervals and timeouts
  clearAllIntervals() {
    if (this.stepChangeTimeout) {
      clearTimeout(this.stepChangeTimeout);
      this.stepChangeTimeout = null;
    }
    
    if (this.extractionCheckInterval) {
      clearInterval(this.extractionCheckInterval);
      this.extractionCheckInterval = null;
    }
  }

  // Check for action completion based on state changes
  checkForActionCompletion(stateChange) {
    if (!this.isActive) return;
    
    const { oldState, newState } = stateChange;
    
    // Check for specific state changes that indicate actions
    
    // Tab switching
    if (this.hasTabSwitchOccurred(oldState, newState)) {
      const newTab = newState.activeTab;
      if (newTab === 'buy') {
        this.handleAction('switch_to_buy');
      } else if (newTab === 'boosters') {
        this.handleAction('switch_to_boosters');
      } else if (newTab === 'sell') {
        this.handleAction('switch_to_sell');
      }
    }
    
    // Expedition purchase
    if (this.hasExpeditionPurchaseOccurred(oldState, newState)) {
      this.handleAction('purchase_expedition');
    }
    
    // Expedition deployment
    if (this.hasExpeditionDeploymentOccurred(oldState, newState)) {
      this.handleAction('deploy_expedition');
    }
    
    // Resource collection
    if (this.hasResourceCollectionOccurred(oldState, newState)) {
      this.handleAction('collect_resource');
    }
    
    // Booster purchase
    if (this.hasBoosterPurchaseOccurred(oldState, newState)) {
      this.handleAction('purchase_booster');
    }
    
    // Booster selection
    if (this.hasBoosterSelectionOccurred(oldState, newState)) {
      this.handleAction('select_booster');
    }
    
    // Booster application (specifically for instant extract)
    if (this.hasBoosterApplicationOccurred(oldState, newState)) {
      this.handleAction('booster_applied');
    }
    
    // Resource sale
    if (this.hasResourceSaleOccurred(oldState, newState)) {
      this.handleAction('sell_resource');
    }
  }

  // Helper methods to detect state changes
  hasTabSwitchOccurred(oldState, newState) {
    return oldState.activeTab !== newState.activeTab;
  }

  hasExpeditionPurchaseOccurred(oldState, newState) {
    const oldTotal = Object.values(oldState.expeditions || {}).reduce((sum, count) => sum + count, 0);
    const newTotal = Object.values(newState.expeditions || {}).reduce((sum, count) => sum + count, 0);
    return newTotal > oldTotal;
  }

  hasExpeditionDeploymentOccurred(oldState, newState) {
    const oldExtracting = (oldState.cells || []).filter(cell => cell.extractionStartTime).length;
    const newExtracting = (newState.cells || []).filter(cell => cell.extractionStartTime).length;
    return newExtracting > oldExtracting;
  }

  hasResourceCollectionOccurred(oldState, newState) {
    const oldTotal = Object.values(oldState.resources || {}).reduce((sum, count) => sum + count, 0);
    const newTotal = Object.values(newState.resources || {}).reduce((sum, count) => sum + count, 0);
    return newTotal > oldTotal;
  }

  hasBoosterPurchaseOccurred(oldState, newState) {
    const oldTotal = Object.values(oldState.boosters || {}).reduce((sum, count) => sum + count, 0);
    const newTotal = Object.values(newState.boosters || {}).reduce((sum, count) => sum + count, 0);
    return newTotal > oldTotal;
  }

  hasBoosterSelectionOccurred(oldState, newState) {
    return oldState.selectedBooster !== newState.selectedBooster && newState.selectedBooster !== null;
  }

  hasBoosterApplicationOccurred(oldState, newState) {
    // Check if instant extract booster was used (count decreased)
    const oldInstantExtract = oldState.boosters?.['Instant Extract'] || 0;
    const newInstantExtract = newState.boosters?.['Instant Extract'] || 0;
    
    // If instant extract count decreased, it was used
    if (newInstantExtract < oldInstantExtract) {
      return true;
    }
    
    // Also check if any cell became ready instantly (extraction completed)
    const oldReady = (oldState.cells || []).filter(cell => cell.isReady).length;
    const newReady = (newState.cells || []).filter(cell => cell.isReady).length;
    
    return newReady > oldReady;
  }

  hasResourceSaleOccurred(oldState, newState) {
    // Check if resources decreased and points increased
    const oldResources = Object.values(oldState.resources || {}).reduce((sum, count) => sum + count, 0);
    const newResources = Object.values(newState.resources || {}).reduce((sum, count) => sum + count, 0);
    const pointsIncreased = (newState.points || 0) > (oldState.points || 0);
    
    return newResources < oldResources && pointsIncreased;
  }

  // Complete the entire tutorial
  completeTutorial() {
    console.log('🎓 completeTutorial() called');
    
    this.isActive = false;
    
    // Immediately and forcefully hide the modal
    this.forceHideModal();
    
    this.game.stateManager.updateState({
      tutorial: {
        isActive: false,
        completed: true,
        step: this.currentStep,
        initialSetup: true
      },
      points: this.game.getGameState().points + 200,
      xp: this.game.getGameState().xp + 100
    });
    
    this.disableBlocking();
    this.clearAllHighlights();
    
    // Award completion achievement and bonus
    if (this.game.achievements) {
      this.game.achievements.trackAction('tutorial_complete');
    }
    
    this.game.showNotification('🎓 Tutorial completed! You earned 200 points and 100 XP!', 'success');
    
    console.log('🎓 Tutorial completed successfully!');
  }

  // Force hide modal with multiple methods
  forceHideModal() {
    console.log('🎓 forceHideModal() called');
    
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      // Remove all classes and hide
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
      
      // Also try hiding the backdrop
      modal.style.background = 'transparent';
      
      console.log('🎓 Modal forcefully hidden with multiple methods');
    } else {
      console.warn('🎓 Tutorial modal element not found');
    }
  }

  // Skip tutorial
  skipTutorial() {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it later from the debug panel.')) {
      this.resetTutorial();
      if (this.game.showNotification) {
        this.game.showNotification('Tutorial skipped. You can restart it from the debug panel.', 'info');
      }
    }
  }

  // Reset tutorial
  resetTutorial() {
    console.log('🎓 Resetting tutorial...');
    
    this.isActive = false;
    this.currentStep = 0;
    this.completedActions.clear();
    this.clearAllIntervals();
    this.clearAllHighlights();
    this.disableBlocking();
    this.hideModal();
    
    // Clear tutorial state
    this.clearTutorialState();
    
    // Update game state
    this.game.stateManager.updateState({
      tutorial: {
        isActive: false,
        completed: false,
        step: 0,
        initialSetup: false
      },
    });
    
    console.log('🎓 Tutorial reset complete');
  }

  // Save tutorial state to localStorage
  saveTutorialState() {
    const tutorialState = {
      isActive: this.isActive,
      currentStep: this.currentStep,
      completedActions: Array.from(this.completedActions),
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('farpost-tutorial-state', JSON.stringify(tutorialState));
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
    }
  }

  // Load tutorial state from localStorage
  loadTutorialState() {
    try {
      const saved = localStorage.getItem('farpost-tutorial-state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load tutorial state:', error);
    }
    return null;
  }

  // Clear tutorial state from localStorage
  clearTutorialState() {
    try {
      localStorage.removeItem('farpost-tutorial-state');
    } catch (error) {
      console.warn('Failed to clear tutorial state:', error);
    }
  }

  // Check if tutorial should auto-resume
  shouldAutoResume() {
    const gameState = this.game.stateManager.getState();
    const tutorialState = this.loadTutorialState();
    
    // Don't resume if tutorial is marked as completed in game state
    if (gameState.tutorial.completed) {
      return false;
    }
    
    // Resume if we have valid tutorial state
    return tutorialState && tutorialState.isActive && tutorialState.currentStep >= 0;
  }

  // Highlight extracting cell
  highlightExtractingCell() {
    console.log('🎓 Highlighting extracting cell');
    this.applyHighlighting('.hex-cell.extracting');
  }

  // Give instant extract booster
  giveInstantExtractBooster() {
    console.log('🎓 Giving instant extract booster for tutorial');
    
    // Add an instant extract booster to the player's inventory
    const currentState = this.game.stateManager.getState();
    const newBoosters = { ...currentState.boosters };
    newBoosters['Instant Extract'] = (newBoosters['Instant Extract'] || 0) + 1;
    
    this.game.stateManager.updateState({
      boosters: newBoosters
    });
    
    this.game.showNotification('🎓 You received a free Instant Extract booster!', 'success');
  }
}

// Global functions for HTML onclick handlers
window.hideTutorialModal = function() {
  console.log('🎓 Tutorial modal "Got it!" clicked');
  
  // Always try to hide the modal first
  const modal = document.getElementById('tutorialModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
  }
  
  if (window.game && window.game.tutorial) {
    if (window.game.tutorial.isActive) {
      // Tutorial is active, progress normally
      console.log('🎓 Tutorial active, progressing to next step');
      window.game.tutorial.completeCurrentStep();
    } else {
      // Tutorial might be completed or in weird state, ensure cleanup
      console.log('🎓 Tutorial not active, ensuring modal is hidden');
      window.game.tutorial.forceHideModal();
      window.game.tutorial.disableBlocking();
      window.game.tutorial.clearAllHighlights();
    }
  } else {
    console.warn('🎓 Tutorial not available, hiding modal manually');
    // Fallback: force hide modal manually
    if (modal) {
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.classList.remove('show');
    }
    
    // Also remove any tutorial blocking
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    document.querySelectorAll('.tutorial-blocked').forEach(element => {
      element.classList.remove('tutorial-blocked');
    });
    
    document.querySelectorAll('.tutorial-highlight').forEach(element => {
      element.classList.remove('tutorial-highlight');
    });
  }
};

window.skipTutorial = function() {
  console.log('🎓 Skip tutorial clicked');
  if (window.game && window.game.tutorial) {
    window.game.tutorial.skipTutorial();
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

window.startTutorial = function() {
  console.log('🎓 Start tutorial clicked');
  if (window.game && window.game.tutorial) {
    window.game.tutorial.startTutorial();
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

window.resetTutorial = function() {
  console.log('🎓 Reset tutorial clicked');
  if (window.game && window.game.tutorial) {
    window.game.tutorial.resetTutorial();
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

// Debug function to test tutorial manually
window.debugTutorial = function() {
  if (window.game && window.game.tutorial) {
    console.log('🎓 Tutorial Debug Info:');
    console.log('- isActive:', window.game.tutorial.isActive);
    console.log('- currentStep:', window.game.tutorial.currentStep);
    console.log('- total steps:', window.game.tutorial.tutorialSteps.length);
    console.log('- completedSteps:', Array.from(window.game.tutorial.completedSteps));
    console.log('- Tutorial state:', window.game.getGameState().tutorial);
    
    const modal = document.getElementById('tutorialModal');
    console.log('- Modal element:', modal);
    console.log('- Modal display:', modal ? modal.style.display : 'not found');
    console.log('- Modal classes:', modal ? modal.className : 'not found');
    console.log('- Modal opacity:', modal ? modal.style.opacity : 'not found');
    console.log('- Modal visibility:', modal ? modal.style.visibility : 'not found');
    
    // Show current step info
    if (window.game.tutorial.currentStep < window.game.tutorial.tutorialSteps.length) {
      const currentStepData = window.game.tutorial.tutorialSteps[window.game.tutorial.currentStep];
      console.log('- Current step data:', currentStepData);
    } else {
      console.log('- Current step: BEYOND TUTORIAL (should be completed)');
    }
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

// Debug function to force close tutorial modal
window.debugCloseTutorial = function() {
  console.log('🎓 Force closing tutorial modal...');
  
  const modal = document.getElementById('tutorialModal');
  if (modal) {
    modal.style.display = 'none';
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    modal.style.pointerEvents = 'none';
    modal.classList.remove('show');
    console.log('🎓 Modal force closed');
  }
  
  // Also clean up tutorial state
  if (window.game && window.game.tutorial) {
    window.game.tutorial.isActive = false;
    window.game.tutorial.disableBlocking();
    window.game.tutorial.clearAllHighlights();
    console.log('🎓 Tutorial state cleaned up');
  }
  
  alert('Tutorial modal force closed. Check console for details.');
};

// Export TutorialSystem to global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TutorialSystem;
  } else {
  window.TutorialSystem = TutorialSystem;
  }