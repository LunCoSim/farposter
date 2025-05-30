// API client for Farpost Game
// This client only communicates with Netlify functions, not directly with Supabase
class FarpostAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.isAuthenticated = false;
    this.currentUser = null;
    this.gameState = null;
  }

  // Generic API request method for Netlify functions
  async apiRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      const config = {
        method: options.method || 'GET',
        headers,
        ...options
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods - these will be handled by backend functions
  async signIn(email, password) {
    try {
      const result = await this.apiRequest('/.netlify/functions/auth', {
        method: 'POST',
        body: { action: 'signin', email, password }
      });
      
      if (result.success) {
        this.isAuthenticated = true;
        this.currentUser = result.user;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signUp(email, password, username) {
    try {
      const result = await this.apiRequest('/.netlify/functions/auth', {
        method: 'POST',
        body: { action: 'signup', email, password, username }
      });
      
      if (result.success) {
        this.isAuthenticated = true;
        this.currentUser = result.user;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      const result = await this.apiRequest('/.netlify/functions/auth', {
        method: 'POST',
        body: { action: 'signout' }
      });
      
      if (result.success) {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.gameState = null;
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Game state methods
  async loadGameState() {
    try {
      const result = await this.apiRequest('/.netlify/functions/game-state');
      if (result.success) {
        this.gameState = result.data;
        this.isAuthenticated = true;
      }
      return result;
    } catch (error) {
      console.error('Failed to load game state:', error);
      throw error;
    }
  }

  async saveGameState(updates) {
    return await this.apiRequest('/.netlify/functions/game-state', {
      method: 'PUT',
      body: updates
    });
  }

  // Game action methods
  async gameAction(action, payload = {}) {
    return await this.apiRequest('/.netlify/functions/game-actions', {
      method: 'POST',
      body: { action, payload }
    });
  }

  // Specific game actions
  async purchaseExpedition(resourceType) {
    return await this.gameAction('purchase_expedition', { resourceType });
  }

  async purchaseBooster(boosterType) {
    return await this.gameAction('purchase_booster', { boosterType });
  }

  async purchaseCell(cellIndex = null) {
    return await this.gameAction('purchase_cell', { cellIndex });
  }

  async deployExpedition(cellIndex, resourceType) {
    return await this.gameAction('deploy_expedition', { cellIndex, resourceType });
  }

  async collectResource(cellIndex) {
    return await this.gameAction('collect_resource', { cellIndex });
  }

  async sellResources(resourceType = null) {
    return await this.gameAction('sell_resources', { resourceType });
  }

  async applyBooster(boosterType, cellIndex = null) {
    return await this.gameAction('apply_booster', { boosterType, cellIndex });
  }

  // Utility methods
  isAuth() {
    return this.isAuthenticated;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getGameState() {
    return this.gameState;
  }

  // Initialize the API (check if user is already logged in)
  async init() {
    try {
      // Try to load game state to check if user is authenticated
      await this.loadGameState();
      return true;
    } catch (error) {
      // If loading fails, user is not authenticated
      this.isAuthenticated = false;
      return false;
    }
  }
}

// Create global API instance
window.farpostAPI = new FarpostAPI(); 