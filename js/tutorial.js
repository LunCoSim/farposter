// Tutorial System for Farpost Game

class TutorialSystem {
  constructor(game) {
    this.game = game;
    this.tutorialSteps = [
      {
        title: "Welcome to Farpost! 🌙",
        description: "Welcome to the Moon's surface! You're about to start your lunar mining adventure. Let's learn the basics.",
        highlight: null,
        action: null
      },
      {
        title: "Buy Your First Expedition ⛏️",
        description: "First, you need to purchase an expedition to extract resources. Click on the 'Buy' tab to see available expeditions.",
        highlight: '.tab-btn[data-tab="buy"]',
        action: 'purchase_expedition',
        target: null
      },
      {
        title: "Deploy Your Expedition 🚀",
        description: "Great! Now you have an expedition. Select it from the Deployment Center, then click on one of your owned cells (marked with ⚡) to deploy it.",
        highlight: '.inventory-item, .hex-cell.owned',
        action: 'deploy_expedition',
        target: null
      },
      {
        title: "Wait for Extraction ⏰",
        description: "Perfect! Your expedition is now extracting resources. You can see the progress timer. In real games, this takes time, but for the tutorial, it's faster!",
        highlight: '.hex-cell.extracting',
        action: 'wait_extraction',
        target: null
      },
      {
        title: "Collect Your Resources 💎",
        description: "Your extraction is complete! Click on the glowing cell to collect your first lunar resource.",
        highlight: '.hex-cell.ready',
        action: 'collect_resource',
        target: null
      },
      {
        title: "Sell Resources for Points 💰",
        description: "Now you have resources! Go to the 'Sell' tab and click 'Sell All Resources' to convert them into points.",
        highlight: '.tab-btn[data-tab="sell"], .sell-button',
        action: 'sell_resources',
        target: null
      },
      {
        title: "Tutorial Complete! 🎉",
        description: "Congratulations! You've learned the basic game loop: Buy expeditions → Deploy → Wait → Collect → Sell → Repeat. You're ready to build your lunar mining empire!",
        highlight: null,
        action: 'complete'
      }
    ];
    
    this.isActive = false;
    this.currentStep = 0;
    this.completedSteps = new Set();
  }

  // Start the tutorial
  startTutorial() {
    console.log('🎓 Starting tutorial...');
    
    const state = this.game.getGameState();
    if (state.tutorial.completed) {
      console.log('Tutorial already completed, resetting first...');
      this.resetTutorial();
      // Wait a moment for reset to complete
      setTimeout(() => {
        this.startTutorial();
      }, 100);
      return;
    }

    // Clear any existing tutorial state - but DON'T hide modal since we're about to show it
    this.disableTutorialBlocking();
    this.clearHighlights();
    
    this.isActive = true;
    this.currentStep = 0;
    this.completedSteps.clear();
    
    this.game.stateManager.updateState({
      tutorial: { 
        isActive: true, 
        completed: false, 
        step: 0, 
        initialSetup: true 
      }
    });
    
    this.setupTutorialEnvironment();
    
    // Show the first step immediately
    this.showStep();
  }

  // Setup tutorial environment
  setupTutorialEnvironment() {
    const state = this.game.getGameState();
    
    // Make sure user has starting resources for tutorial
    const updates = {
      points: Math.max(1000, state.points),
      debugSpeed: 60, // 60x faster for tutorial
      selectedExpedition: null,
      selectedBooster: null,
      mode: 'select'
    };

    // Reset any active extractions for clean tutorial
    updates.cells = state.cells.map(cell => ({
      ...cell,
      extractionStartTime: null,
      extractionEndTime: null,
      isReady: false,
      resourceType: null
    }));

    this.game.stateManager.updateState(updates);
    
    // Enable tutorial blocking
    this.enableTutorialBlocking();
    
    // Force UI refresh
    this.game.uiController.updateUI();
  }

  // Show current tutorial step
  showStep() {
    if (!this.isActive || this.currentStep >= this.tutorialSteps.length) {
      console.log('🎓 showStep() called but tutorial not active or completed');
      return;
    }

    const step = this.tutorialSteps[this.currentStep];
    console.log(`🎓 Showing tutorial step ${this.currentStep + 1}: ${step.title}`);
    
    const modal = document.getElementById('tutorialModal');
    const title = document.getElementById('tutorialTitle');
    const description = document.getElementById('tutorialDescription');

    if (modal && title && description) {
      title.textContent = step.title;
      description.textContent = step.description;
      
      console.log('🎓 Setting modal display and show class...');
      modal.style.display = 'flex';
      modal.classList.add('show');
      
      // Enable blocking AFTER showing modal to avoid interference
      setTimeout(() => {
        console.log('🎓 Re-enabling tutorial blocking...');
        this.enableTutorialBlocking();
      }, 100); // Increased delay to ensure modal is fully visible
      
    } else {
      console.error('🎓 Tutorial modal elements not found!', { modal, title, description });
    }

    // Highlight elements if specified
    if (step.highlight) {
      this.highlightElements(step.highlight);
    }

    console.log(`🎓 Tutorial Step ${this.currentStep + 1}: ${step.title}`);
  }

  // Hide tutorial modal
  hideTutorialModal() {
    console.log('🎓 hideTutorialModal() called');
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      console.log('🎓 Modal hidden completely');
    }
  }

  // Highlight specific elements
  highlightElements(selector) {
    console.log(`🎓 Highlighting elements with selector: ${selector}`);
    this.clearHighlights();
    
    const elements = document.querySelectorAll(selector);
    console.log(`🎓 Found ${elements.length} elements to highlight`);
    
    if (elements.length === 0) {
      console.warn(`🎓 No elements found for selector: ${selector}`);
      return;
    }
    
    elements.forEach((element, index) => {
      console.log(`🎓 Highlighting element ${index + 1}:`, element);
      element.classList.add('tutorial-highlight');
      element.classList.remove('tutorial-blocked');
    });
  }

  // Clear all highlights
  clearHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(element => {
      element.classList.remove('tutorial-highlight');
    });
  }

  // Enable tutorial blocking (disable non-relevant UI)
  enableTutorialBlocking() {
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }

    // Remove any existing blocking first
    document.querySelectorAll('.tutorial-blocked').forEach(element => {
      element.classList.remove('tutorial-blocked');
    });

    // Block most UI elements except tutorial-related ones
    const elementsToBlock = [
      '.hex-cell:not(.tutorial-highlight)',
      '.inventory-item:not(.tutorial-highlight)', 
      '.tab-btn:not(.tutorial-highlight)',
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

    // Ensure tutorial controls are never blocked
    document.querySelectorAll('.tutorial-btn, .tutorial-skip, #tutorialModal, .tutorial-content, .tutorial-allowed').forEach(element => {
      element.classList.remove('tutorial-blocked');
      element.classList.add('tutorial-allowed');
    });
  }

  // Disable tutorial blocking
  disableTutorialBlocking() {
    console.log('🎓 Disabling tutorial blocking...');
    
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      console.log('🎓 Removed active class from blocking overlay');
    }

    const blockedElements = document.querySelectorAll('.tutorial-blocked');
    console.log(`🎓 Found ${blockedElements.length} blocked elements to unblock`);
    
    blockedElements.forEach(element => {
      element.classList.remove('tutorial-blocked');
    });
    
    console.log('🎓 Tutorial blocking disabled');
  }

  // Check if tutorial action was completed
  checkAction(action, data = {}) {
    if (!this.isActive) return;

    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;

    let actionMatches = false;

    switch (step.action) {
      case 'purchase_expedition':
        actionMatches = action === 'purchase_expedition' && 
                       (!step.target || data.resourceType === step.target);
        break;
      case 'deploy_expedition':
        actionMatches = action === 'deploy_expedition';
        break;
      case 'collect_resource':
        actionMatches = action === 'collect_resource';
        break;
      case 'sell_resources':
        actionMatches = action === 'sell_resources';
        break;
      case 'wait_extraction':
        // This is handled by the game loop
        break;
      default:
        actionMatches = action === step.action;
    }

    if (actionMatches) {
      this.completeStep();
    }
  }

  // Complete current step
  completeStep() {
    if (!this.isActive) {
      console.warn('🎓 Tutorial not active, skipping step completion');
      return;
    }

    console.log(`🎓 Completing tutorial step ${this.currentStep + 1}`);
    
    // Hide current modal completely
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      console.log('🎓 Current modal hidden');
    }
    
    // Clear current step highlights and unblock
    console.log('🎓 Clearing highlights and disabling blocking...');
    this.clearHighlights();
    this.disableTutorialBlocking();
    
    this.completedSteps.add(this.currentStep);
    this.currentStep++;
    
    console.log(`🎓 Moving to step ${this.currentStep + 1}`);
    
    this.game.stateManager.updateState({
      tutorial: { 
        ...this.game.getGameState().tutorial,
        step: this.currentStep 
      }
    });

    // Check for extraction completion in tutorial
    if (this.currentStep === 4) { // Wait for extraction step
      console.log('🎓 Starting extraction completion check...');
      this.checkExtractionCompletion();
      return;
    }

    if (this.currentStep >= this.tutorialSteps.length) {
      console.log('🎓 Tutorial complete!');
      this.completeTutorial();
    } else {
      console.log(`🎓 About to show next step (${this.currentStep + 1}) in 200ms...`);
      setTimeout(() => {
        console.log(`🎓 Now calling showStep for step ${this.currentStep + 1}...`);
        this.showStep();
      }, 200); // Much shorter delay for better UX
    }
  }

  // Check if extraction is complete (for tutorial step 4)
  checkExtractionCompletion() {
    const checkInterval = setInterval(() => {
      const state = this.game.getGameState();
      const hasReadyCell = state.cells.some(cell => cell.isReady);
      if (hasReadyCell) {
        clearInterval(checkInterval);
        setTimeout(() => {
          this.showStep();
        }, 500);
      }
    }, 1000);
  }

  // Complete the entire tutorial
  completeTutorial() {
    this.isActive = false;
    this.game.stateManager.updateState({
      tutorial: {
        isActive: false,
        completed: true,
        step: this.currentStep,
        initialSetup: true
      },
      debugSpeed: 1, // Reset game speed
      points: this.game.getGameState().points + 200,
      xp: this.game.getGameState().xp + 300
    });
    
    this.disableTutorialBlocking();
    this.clearHighlights();
    this.hideTutorialModal();
    
    // Award completion achievement and bonus
    if (this.game.achievements) {
      this.game.achievements.trackAction('tutorial_complete');
    }
    
    this.game.showNotification('🎓 Tutorial completed! You earned 200 points and 300 XP!', 'success');
    
    console.log('🎓 Tutorial completed successfully!');
  }

  // Skip tutorial
  skipTutorial() {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it later from the debug panel.')) {
      // Reset tutorial without bonuses instead of completing it
      this.resetTutorial();
      if (this.game.showNotification) {
        this.game.showNotification('Tutorial skipped. You can restart it from the debug panel.', 'info');
      }
    }
  }

  // Reset tutorial (for debugging)
  resetTutorial() {
    console.log('🎓 Resetting tutorial...');
    
    this.isActive = false;
    this.currentStep = 0;
    this.completedSteps.clear();
    
    // Clear all tutorial UI effects
    this.disableTutorialBlocking();
    this.clearHighlights();
    this.hideTutorialModal();
    
    this.game.stateManager.updateState({
      tutorial: {
        isActive: false,
        completed: false,
        step: 0,
        initialSetup: false
      }
    });
    
    console.log('🎓 Tutorial reset complete');
  }

  // Progress to next tutorial step (combined hide + complete)
  progressToNextStep() {
    if (!this.isActive) {
      console.warn('🎓 Tutorial not active, cannot progress');
      return;
    }

    console.log(`🎓 Progressing from step ${this.currentStep + 1} to next step`);
    
    // Immediately hide current modal
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      console.log('🎓 Modal hidden for transition');
    }
    
    // Clear current step effects
    this.clearHighlights();
    this.disableTutorialBlocking();
    
    // Progress to next step
    this.completedSteps.add(this.currentStep);
    this.currentStep++;
    
    // Update game state
    this.game.stateManager.updateState({
      tutorial: { 
        ...this.game.getGameState().tutorial,
        step: this.currentStep 
      }
    });

    // Show next step or complete tutorial
    if (this.currentStep >= this.tutorialSteps.length) {
      console.log('🎓 Tutorial complete!');
      this.completeTutorial();
    } else {
      console.log(`🎓 Showing step ${this.currentStep + 1}...`);
      this.showStep();
    }
  }
}

// Global functions for HTML onclick handlers
window.hideTutorialModal = function() {
  console.log('🎓 Tutorial modal "Got it!" clicked');
  if (window.game && window.game.tutorial && window.game.tutorial.isActive) {
    // Call progressToNextStep to properly advance the tutorial
    window.game.tutorial.progressToNextStep();
  } else {
    console.warn('🎓 Tutorial not available or not active');
  }
};

window.skipTutorial = function() {
  console.log('🎓 Skip tutorial clicked');
  if (window.game && window.game.tutorial) {
    // Ask for confirmation and reset tutorial without bonuses
    if (confirm('Are you sure you want to skip the tutorial?')) {
      window.game.tutorial.resetTutorial();
      if (window.game.showNotification) {
        window.game.showNotification('Tutorial skipped. You can restart it from the debug panel.', 'info');
      }
    }
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

window.resetTutorial = function() {
  console.log('🎓 Reset tutorial clicked');
  if (window.game && window.game.tutorial) {
    window.game.tutorial.resetTutorial();
    window.game.showNotification('Tutorial reset! Click the Tutorial button to start again.', 'info');
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
    console.log('- completedSteps:', Array.from(window.game.tutorial.completedSteps));
    console.log('- Tutorial state:', window.game.getGameState().tutorial);
    
    const modal = document.getElementById('tutorialModal');
    console.log('- Modal element:', modal);
    console.log('- Modal display:', modal ? modal.style.display : 'not found');
    console.log('- Modal classes:', modal ? modal.className : 'not found');
  } else {
    console.warn('🎓 Tutorial not available');
  }
};

// Export for global access
window.TutorialSystem = TutorialSystem; 