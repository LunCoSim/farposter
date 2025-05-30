// Achievements System for Farpost Game

class AchievementSystem {
  constructor(game) {
    this.game = game;
    this.achievementDefinitions = {
      'first_expedition': {
        title: 'First Expedition',
        description: 'Deploy your first expedition',
        reward: 100,
        icon: '🚀',
        condition: (stats) => stats.expeditionsDeployed >= 1
      },
      'first_boost': {
        title: 'Speed Demon',
        description: 'Use your first booster',
        reward: 50,
        icon: '⚡',
        condition: (stats) => stats.boostersUsed >= 1
      },
      'first_collect': {
        title: 'Resource Collector',
        description: 'Collect your first resource',
        reward: 75,
        icon: '💎',
        condition: (stats) => stats.resourcesCollected >= 1
      },
      'first_sell': {
        title: 'Merchant',
        description: 'Sell your first resource',
        reward: 100,
        icon: '💰',
        condition: (stats) => stats.resourcesSold >= 1
      },
      'second_expedition': {
        title: 'Expanding Operations',
        description: 'Purchase a second expedition',
        reward: 150,
        icon: '🔄',
        condition: (stats) => stats.expeditionsPurchased >= 2
      },
      'tutorial_complete': {
        title: 'Graduate',
        description: 'Complete the tutorial',
        reward: 200,
        icon: '🎓',
        condition: () => true // Manually triggered
      },
      'first_cell': {
        title: 'Territory Expansion',
        description: 'Purchase your first additional cell',
        reward: 150,
        icon: '🏗️',
        condition: (stats) => stats.cellsPurchased >= 1
      },
      'level_5': {
        title: 'Junior Miner',
        description: 'Reach level 5',
        reward: 300,
        icon: '⭐',
        condition: (stats) => stats.level >= 5
      },
      'level_10': {
        title: 'Expert Miner',
        description: 'Reach level 10',
        reward: 500,
        icon: '🌟',
        condition: (stats) => stats.level >= 10
      },
      'resource_hoarder': {
        title: 'Resource Hoarder',
        description: 'Collect 50 resources total',
        reward: 250,
        icon: '📦',
        condition: (stats) => stats.resourcesCollected >= 50
      },
      'big_spender': {
        title: 'Big Spender',
        description: 'Spend 10,000 points total',
        reward: 400,
        icon: '💸',
        condition: (stats) => stats.pointsSpent >= 10000
      },
      'efficient_miner': {
        title: 'Efficient Miner',
        description: 'Complete 10 extractions in a single session',
        reward: 200,
        icon: '⚙️',
        condition: (stats) => stats.extractionsThisSession >= 10
      },
      'lunar_empire': {
        title: 'Lunar Empire',
        description: 'Own 10 cells',
        reward: 1000,
        icon: '👑',
        condition: (stats) => stats.cellsOwned >= 10
      },
      'rare_collector': {
        title: 'Rare Collector',
        description: 'Extract a Rare Earth Elements resource',
        reward: 500,
        icon: '💠',
        condition: (stats) => stats.rareResourcesCollected >= 1
      },
      'platinum_miner': {
        title: 'Platinum Miner',
        description: 'Extract a Platinum Group Metals resource',
        reward: 750,
        icon: '🥈',
        condition: (stats) => stats.platinumResourcesCollected >= 1
      },
      'helium_master': {
        title: 'Helium Master',
        description: 'Extract Helium-3, the most valuable resource',
        reward: 1000,
        icon: '🥇',
        condition: (stats) => stats.heliumResourcesCollected >= 1
      }
    };
  }

  // Initialize achievement stats tracking
  initializeStats() {
    if (!this.game.gameState.stats) {
      this.game.gameState.stats = {
        expeditionsDeployed: 0,
        expeditionsPurchased: 0,
        boostersUsed: 0,
        resourcesCollected: 0,
        resourcesSold: 0,
        cellsPurchased: 0,
        cellsOwned: this.game.gameState.ownedCells,
        level: this.game.gameState.level,
        pointsSpent: 0,
        extractionsThisSession: 0,
        rareResourcesCollected: 0,
        platinumResourcesCollected: 0,
        heliumResourcesCollected: 0
      };
    }
  }

  // Track a specific action
  trackAction(action, data = {}) {
    this.initializeStats();
    const stats = this.game.gameState.stats;

    switch (action) {
      case 'expedition_deployed':
        stats.expeditionsDeployed++;
        break;
      case 'expedition_purchased':
        stats.expeditionsPurchased++;
        break;
      case 'booster_used':
        stats.boostersUsed++;
        break;
      case 'resource_collected':
        stats.resourcesCollected++;
        stats.extractionsThisSession++;
        
        // Track special resource types
        if (data.resourceType === 'Rare Earth Elements') {
          stats.rareResourcesCollected++;
        }
        if (data.resourceType === 'Platinum Group Metals') {
          stats.platinumResourcesCollected++;
        }
        if (data.resourceType === 'Helium-3') {
          stats.heliumResourcesCollected++;
        }
        break;
      case 'resources_sold':
        stats.resourcesSold += data.amount || 1;
        break;
      case 'cell_purchased':
        stats.cellsPurchased++;
        stats.cellsOwned = this.game.gameState.ownedCells;
        break;
      case 'points_spent':
        stats.pointsSpent += data.amount || 0;
        break;
      case 'level_up':
        stats.level = this.game.gameState.level;
        break;
    }

    // Check for new achievements
    this.checkAchievements();
  }

  // Check all achievements against current stats
  checkAchievements() {
    const stats = this.game.gameState.stats;
    const achievements = this.game.gameState.achievements;

    Object.entries(this.achievementDefinitions).forEach(([id, definition]) => {
      if (!achievements[id] || !achievements[id].completed) {
        if (definition.condition(stats)) {
          this.awardAchievement(id);
        }
      }
    });
  }

  // Award a specific achievement
  awardAchievement(achievementId) {
    const definition = this.achievementDefinitions[achievementId];
    if (!definition) {
      console.warn(`Unknown achievement: ${achievementId}`);
      return;
    }

    // Initialize achievement in game state if not exists
    if (!this.game.gameState.achievements[achievementId]) {
      this.game.gameState.achievements[achievementId] = {
        completed: false,
        title: definition.title,
        description: definition.description,
        reward: definition.reward
      };
    }

    // Check if already completed
    if (this.game.gameState.achievements[achievementId].completed) {
      return;
    }

    // Award the achievement
    this.game.gameState.achievements[achievementId].completed = true;
    this.game.gameState.achievements[achievementId].completedAt = Date.now();

    // Give reward
    this.game.gameState.points += definition.reward;
    
    // Show notification
    this.game.showNotification(
      `🏆 Achievement Unlocked: ${definition.icon} ${definition.title}! (+${definition.reward} points)`,
      'success',
      5000
    );

    console.log(`🏆 Achievement unlocked: ${definition.title}`);

    // Update UI and save
    this.game.updateUI();
    this.game.saveGameState();

    // Show achievement popup after a delay
    setTimeout(() => {
      this.showAchievementPopup(achievementId, definition);
    }, 1000);
  }

  // Show achievement popup
  showAchievementPopup(achievementId, definition) {
    // Create achievement popup element
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-popup-content">
        <div class="achievement-icon">${definition.icon}</div>
        <div class="achievement-info">
          <div class="achievement-popup-title">Achievement Unlocked!</div>
          <div class="achievement-popup-name">${definition.title}</div>
          <div class="achievement-popup-description">${definition.description}</div>
          <div class="achievement-popup-reward">+${definition.reward} points</div>
        </div>
      </div>
    `;

    // Style the popup
    popup.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #FFD700 0%, #FFA000 100%);
      color: #000;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
      z-index: 10000;
      max-width: 300px;
      transform: translateX(100%);
      transition: transform 0.5s ease;
      font-weight: bold;
    `;

    document.body.appendChild(popup);

    // Animate in
    setTimeout(() => {
      popup.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after delay
    setTimeout(() => {
      popup.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 500);
    }, 4000);
  }

  // Show achievements panel
  showAchievementsPanel() {
    const panel = document.getElementById('achievementsPanel');
    const list = document.getElementById('achievementsList');
    
    if (!panel || !list) return;

    // Clear existing content
    list.innerHTML = '';

    // Sort achievements: completed first, then by reward value
    const sortedAchievements = Object.entries(this.achievementDefinitions)
      .sort(([idA, defA], [idB, defB]) => {
        const completedA = this.game.gameState.achievements[idA]?.completed || false;
        const completedB = this.game.gameState.achievements[idB]?.completed || false;
        
        if (completedA !== completedB) {
          return completedB - completedA; // Completed first
        }
        return defB.reward - defA.reward; // Then by reward value
      });

    // Create achievement items
    sortedAchievements.forEach(([id, definition]) => {
      const achievement = this.game.gameState.achievements[id];
      const completed = achievement?.completed || false;

      const item = document.createElement('div');
      item.className = `achievement-item ${completed ? 'completed' : ''}`;
      
      let progressText = '';
      if (!completed) {
        // Show progress for some achievements
        const stats = this.game.gameState.stats || {};
        if (id === 'resource_hoarder') {
          progressText = ` (${stats.resourcesCollected || 0}/50)`;
        } else if (id === 'big_spender') {
          progressText = ` (${stats.pointsSpent || 0}/10,000)`;
        } else if (id === 'efficient_miner') {
          progressText = ` (${stats.extractionsThisSession || 0}/10)`;
        }
      }

      item.innerHTML = `
        <div class="achievement-title">
          ${definition.icon} ${definition.title}
          ${completed ? '✅' : ''}
        </div>
        <div class="achievement-description">
          ${definition.description}${progressText}
        </div>
        <div class="achievement-reward">
          Reward: ${definition.reward} points
          ${completed ? `• Unlocked ${new Date(achievement.completedAt).toLocaleDateString()}` : ''}
        </div>
      `;

      list.appendChild(item);
    });

    // Show completion stats
    const completedCount = Object.values(this.game.gameState.achievements)
      .filter(a => a?.completed).length;
    const totalCount = Object.keys(this.achievementDefinitions).length;
    
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #333;
      color: #aaa;
      font-size: 14px;
    `;
    statsDiv.innerHTML = `
      <strong>Progress: ${completedCount}/${totalCount} achievements completed</strong><br>
      Completion Rate: ${Math.round((completedCount / totalCount) * 100)}%
    `;
    list.appendChild(statsDiv);

    // Show panel
    panel.style.display = 'flex';
  }

  // Hide achievements panel
  hideAchievementsPanel() {
    const panel = document.getElementById('achievementsPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  // Get achievement completion stats
  getCompletionStats() {
    const achievements = this.game.gameState.achievements;
    const completed = Object.values(achievements).filter(a => a?.completed).length;
    const total = Object.keys(this.achievementDefinitions).length;
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  }
}

// Global functions for HTML onclick handlers
window.showAchievements = function() {
  if (window.game && window.game.achievements) {
    window.game.achievements.showAchievementsPanel();
  }
};

window.hideAchievements = function() {
  if (window.game && window.game.achievements) {
    window.game.achievements.hideAchievementsPanel();
  }
};

// Export for global access
window.AchievementSystem = AchievementSystem; 