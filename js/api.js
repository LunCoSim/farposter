// API client for Farpost Game
class FarpostAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.supabase = null;
    this.user = null;
    this.session = null;
  }

  // Initialize Supabase client
  async init() {
    try {
      // Dynamically import Supabase client
      const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
      
      // Get config from environment or config file
      const supabaseUrl = window.CONFIG?.supabase?.url || 'your-supabase-url-here';
      const supabaseKey = window.CONFIG?.supabase?.anonKey || 'your-supabase-anon-key-here';
      
      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Set up auth state listener
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user || null;
        
        if (event === 'SIGNED_IN') {
          this.onAuthStateChange('signed_in', session);
        } else if (event === 'SIGNED_OUT') {
          this.onAuthStateChange('signed_out', null);
        }
      });

      // Check if user is already logged in
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        this.session = session;
        this.user = session.user;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }

  // Auth state change callback (override in game)
  onAuthStateChange(event, session) {
    // Override this method in the game
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signUp(email, password, username) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    if (!this.session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    return {
      'Authorization': `Bearer ${this.session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // Generic API request method
  async apiRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Add auth headers if user is logged in
      if (this.session?.access_token && !options.skipAuth) {
        headers.Authorization = `Bearer ${this.session.access_token}`;
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
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Game state methods
  async loadGameState() {
    return await this.apiRequest('/api/game-state');
  }

  async saveGameState(updates) {
    return await this.apiRequest('/api/game-state', {
      method: 'PUT',
      body: updates
    });
  }

  // Game action methods
  async gameAction(action, payload = {}) {
    return await this.apiRequest('/api/game-actions', {
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
  isAuthenticated() {
    return !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  getSession() {
    return this.session;
  }
}

// Create global API instance
window.farpostAPI = new FarpostAPI(); 