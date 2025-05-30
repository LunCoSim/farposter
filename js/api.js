// API client for Farpost Game
// This client only communicates with Netlify functions, not directly with Supabase
class FarpostAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.isAuthenticated = false;
    this.isGuest = true; // Start in guest mode by default
    this.currentUser = null;
    this.gameState = null;
  }

  // Initialize API client
  async init() {
    console.log('🔌 Initializing API client...');
    
    // Check if user was previously authenticated
    const authToken = localStorage.getItem('farpost-auth-token');
    if (authToken) {
      try {
        // Try to validate existing token
        await this.validateToken(authToken);
      } catch (error) {
        console.warn('Stored auth token invalid, continuing as guest');
        localStorage.removeItem('farpost-auth-token');
      }
    }
    
    console.log('✅ API client initialized');
    console.log(`🎭 Mode: ${this.isGuest ? 'Guest' : 'Authenticated'}`);
  }

  // Check if user is authenticated (not guest)
  isAuth() {
    return this.isAuthenticated && !this.isGuest;
  }

  // Check if user is in guest mode
  isGuestMode() {
    return this.isGuest;
  }

  // Generic API request method for Netlify functions
  async apiRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add auth header if authenticated
      const authToken = localStorage.getItem('farpost-auth-token');
      if (authToken && !this.isGuest) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const config = {
        method: options.method || 'GET',
        headers,
        ...options
      };

      if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`API request failed:`, error);
      return { success: false, error: error.message };
    }
  }

  // Validate authentication token
  async validateToken(token) {
    const result = await this.apiRequest('/.netlify/functions/auth', {
      method: 'POST',
      body: { action: 'validate' },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (result.success) {
      this.isAuthenticated = true;
      this.isGuest = false;
      this.currentUser = result.data;
      return true;
    }
    
    throw new Error('Invalid token');
  }

  // Sign up new user
  async signUp(email, password, username) {
    const result = await this.apiRequest('/.netlify/functions/auth', {
      method: 'POST',
      body: { action: 'signup', email, password, username }
    });

    if (result.success) {
      this.isAuthenticated = true;
      this.isGuest = false;
      this.currentUser = result.data.user;
      localStorage.setItem('farpost-auth-token', result.data.token);
      console.log('✅ User signed up successfully');
    }

    return result;
  }

  // Sign in existing user
  async signIn(email, password) {
    const result = await this.apiRequest('/.netlify/functions/auth', {
      method: 'POST',
      body: { action: 'signin', email, password }
    });

    if (result.success) {
      this.isAuthenticated = true;
      this.isGuest = false;
      this.currentUser = result.data.user;
      localStorage.setItem('farpost-auth-token', result.data.token);
      console.log('✅ User signed in successfully');
    }

    return result;
  }

  // Sign out user
  async signOut() {
    try {
      // Try to sign out on server
      if (!this.isGuest) {
        await this.apiRequest('/.netlify/functions/auth', {
          method: 'POST',
          body: { action: 'signout' }
        });
      }
    } catch (error) {
      console.warn('Server signout failed:', error);
    }

    // Clear local state regardless
    this.isAuthenticated = false;
    this.isGuest = true;
    this.currentUser = null;
    localStorage.removeItem('farpost-auth-token');
    console.log('✅ Signed out (now in guest mode)');
  }

  // Switch to guest mode
  async playAsGuest() {
    this.isAuthenticated = false;
    this.isGuest = true;
    this.currentUser = null;
    localStorage.removeItem('farpost-auth-token');
    console.log('🎭 Switched to guest mode');
    return { success: true };
  }

  // Load game state (works for both authenticated and guest users)
  async loadGameState() {
    if (this.isGuest) {
      // Guest users use local storage only
      return { 
        success: true, 
        data: null, // Will trigger local storage fallback in game
        message: 'Guest mode - using local storage'
      };
    }

    return await this.apiRequest('/.netlify/functions/game-state');
  }

  // Save game state (only works for authenticated users)
  async saveGameState(gameState) {
    if (this.isGuest) {
      // Guest users only save locally (handled by game.js)
      return { 
        success: true, 
        message: 'Guest mode - saved locally only'
      };
    }

    return await this.apiRequest('/.netlify/functions/game-state', {
      method: 'PUT',
      body: { gameState }
    });
  }

  // Game actions (work for both guest and authenticated)
  async gameAction(action, data = {}) {
    if (this.isGuest) {
      // Guest users handle actions locally
      return {
        success: true,
        message: 'Guest mode - action handled locally'
      };
    }

    return await this.apiRequest('/.netlify/functions/game-actions', {
      method: 'POST',
      body: { action, ...data }
    });
  }

  // Get current user info
  getUserInfo() {
    if (this.isGuest) {
      return {
        username: 'Guest Player',
        displayName: 'Guest Player',
        email: null,
        isGuest: true
      };
    }
    
    return {
      ...this.currentUser,
      isGuest: false
    };
  }
}

// Export for global access
window.FarpostAPI = FarpostAPI; 