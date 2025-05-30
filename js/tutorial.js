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
        description: "First, you need to purchase an expedition to extract resources. Click on the 'Lunar Regolith' expedition in the Buy tab to purchase it.",
        highlight: '.resource-item',
        action: 'purchase_expedition',
        target: 'Lunar Regolith'
      },
      {
        title: "Deploy Your Expedition 🚀",
        description: "Great! Now you have an expedition. Select it from the Deployment Center, then click on one of your owned cells (marked with ⚡) to deploy it.",
        highlight: '.resource-item, .hex-cell.owned',
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
        highlight: '#sellTab',
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
    if (this.game.gameState.tutorial.completed) {
      console.log('Tutorial already completed');
      return;
    }

    this.isActive = true;
    this.currentStep = 0;
    this.game.gameState.tutorial.isActive = true;
    this.game.gameState.tutorial.step = 0;
    
    console.log('🎓 Starting tutorial...');
    this.showStep();
    this.setupTutorialEnvironment();
  }

  // Setup tutorial environment
  setupTutorialEnvironment() {
    // Make sure user has starting resources for tutorial
    this.game.gameState.points = Math.max(1000, this.game.gameState.points);
    
    // Enable tutorial blocking
    this.enableTutorialBlocking();
    
    // Speed up extractions for tutorial
    this.game.gameState.debugSpeed = 60; // 60x faster for tutorial
  }

  // Show current tutorial step
  showStep() {
    if (!this.isActive || this.currentStep >= this.tutorialSteps.length) {
      return;
    }

    const step = this.tutorialSteps[this.currentStep];
    const modal = document.getElementById('tutorialModal');
    const title = document.getElementById('tutorialTitle');
    const description = document.getElementById('tutorialDescription');

    if (modal && title && description) {
      title.textContent = step.title;
      description.textContent = step.description;
      
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('show'), 10);
    }

    // Highlight elements if specified
    if (step.highlight) {
      this.highlightElements(step.highlight);
    }

    console.log(`🎓 Tutorial Step ${this.currentStep + 1}: ${step.title}`);
  }

  // Hide tutorial modal
  hideTutorialModal() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.style.display = 'none', 300);
    }
    this.clearHighlights();
  }

  // Highlight specific elements
  highlightElements(selector) {
    this.clearHighlights();
    
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
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

    // Block most UI elements
    const elementsToBlock = [
      '.hex-cell:not(.tutorial-highlight)',
      '.resource-item:not(.tutorial-highlight)',
      '.tab:not(.tutorial-highlight)',
      '.achievements-btn',
      '.debug-panel'
    ];

    elementsToBlock.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (!element.classList.contains('tutorial-highlight')) {
          element.classList.add('tutorial-blocked');
        }
      });
    });
  }

  // Disable tutorial blocking
  disableTutorialBlocking() {
    const overlay = document.getElementById('tutorialBlockingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }

    document.querySelectorAll('.tutorial-blocked').forEach(element => {
      element.classList.remove('tutorial-blocked');
    });
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
    if (!this.isActive) return;

    this.completedSteps.add(this.currentStep);
    this.currentStep++;
    this.game.gameState.tutorial.step = this.currentStep;

    // Check for extraction completion in tutorial
    if (this.currentStep === 4) { // Wait for extraction step
      this.checkExtractionCompletion();
      return;
    }

    if (this.currentStep >= this.tutorialSteps.length) {
      this.completeTutorial();
    } else {
      setTimeout(() => {
        this.showStep();
      }, 1000);
    }
  }

  // Check if extraction is complete (for tutorial step 4)
  checkExtractionCompletion() {
    const checkInterval = setInterval(() => {
      const hasReadyCell = this.game.gameState.cells.some(cell => cell.isReady);
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
    this.game.gameState.tutorial.isActive = false;
    this.game.gameState.tutorial.completed = true;
    
    // Reset game speed
    this.game.gameState.debugSpeed = 1;
    
    this.disableTutorialBlocking();
    this.clearHighlights();
    this.hideTutorialModal();
    
    // Award completion achievement and bonus
    this.game.awardAchievement('tutorial_complete');
    this.game.gameState.points += 200;
    this.game.gameState.xp += 300;
    
    this.game.showNotification('🎓 Tutorial completed! You earned 200 points and 300 XP!', 'success');
    this.game.checkLevelUp();
    this.game.updateUI();
    this.game.saveGameState();
    
    console.log('🎓 Tutorial completed successfully!');
  }

  // Skip tutorial
  skipTutorial() {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it later from the debug panel.')) {
      this.completeTutorial();
    }
  }

  // Reset tutorial (for debugging)
  resetTutorial() {
    this.isActive = false;
    this.currentStep = 0;
    this.completedSteps.clear();
    
    this.game.gameState.tutorial.isActive = false;
    this.game.gameState.tutorial.completed = false;
    this.game.gameState.tutorial.step = 0;
    this.game.gameState.tutorial.initialSetup = false;
    
    this.disableTutorialBlocking();
    this.clearHighlights();
    this.hideTutorialModal();
    
    console.log('🎓 Tutorial reset');
    this.game.saveGameState();
  }
}

// Global functions for HTML onclick handlers
window.hideTutorialModal = function() {
  if (window.game && window.game.tutorial) {
    window.game.tutorial.hideTutorialModal();
    window.game.tutorial.completeStep();
  }
};

window.skipTutorial = function() {
  if (window.game && window.game.tutorial) {
    window.game.tutorial.skipTutorial();
  }
};

window.resetTutorial = function() {
  if (window.game && window.game.tutorial) {
    window.game.tutorial.resetTutorial();
    window.game.showNotification('Tutorial reset! Refresh the page to start over.', 'info');
  }
};

// Export for global access
window.TutorialSystem = TutorialSystem; 