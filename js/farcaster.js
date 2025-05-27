// Farcaster Mini App Integration for Farpost Game
class FarcasterIntegration {
  constructor() {
    this.isFrameContext = false;
    this.isMiniApp = false;
    this.frameData = null;
    this.user = null;
    this.gameAPI = null;
    this.frameUrl = window.location.origin;
    this.sdk = null;
    this.context = null;
  }

  // Initialize Farcaster integration
  async init(gameAPI) {
    this.gameAPI = gameAPI;
    
    // Wait for SDK to be available
    await this.waitForSDK();
    
    if (this.sdk) {
      await this.initializeMiniApp();
    } else {
      // Fallback to legacy frame detection
      this.detectFrameContext();
      if (this.isFrameContext) {
        await this.handleFrameContext();
      }
    }
    
    return this.isFrameContext || this.isMiniApp;
  }

  // Wait for SDK to be available or load it dynamically
  async waitForSDK() {
    try {
      // Try to load SDK dynamically if not available
      if (!window.sdk) {
        console.log('🎯 Loading Farcaster SDK dynamically...');
        const module = await import('https://esm.sh/@farcaster/frame-sdk');
        window.sdk = module.sdk;
      }
      
      if (window.sdk) {
        console.log('🎯 Farcaster SDK loaded');
        this.sdk = window.sdk;
        return true;
      } else {
        console.warn('⚠️ Farcaster SDK not available');
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load Farcaster SDK:', error);
      return false;
    }
  }

  // Initialize Mini App with SDK
  async initializeMiniApp() {
    try {
      // Check if SDK exists and has init method
      if (!this.sdk || typeof this.sdk.init !== 'function') {
        console.log('🎯 SDK not available or init method missing, skipping Mini App initialization');
        this.isMiniApp = false;
        this.detectFrameContext();
        return;
      }
      
      // Initialize the SDK
      const context = await this.sdk.init();
      this.context = context;
      this.isMiniApp = true;
      
      console.log('🎯 Mini App context detected:', context);
      
      if (context?.user) {
        this.frameData = {
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          bio: context.user.bio
        };
        
        await this.handleMiniAppContext();
      }
      
    } catch (error) {
      console.error('Error initializing Mini App:', error);
      this.isMiniApp = false;
      // Fallback to legacy frame detection
      this.detectFrameContext();
    }
  }

  // Detect if running inside a Farcaster frame
  detectFrameContext() {
    try {
      // Check for frame context via URL parameters or postMessage
      const urlParams = new URLSearchParams(window.location.search);
      const hasFrameParams = urlParams.has('fc_frame') || urlParams.has('fid');
      
      // Check if parent window is different (indicating iframe)
      const isIframe = window.self !== window.top;
      
      // Check for Farcaster-specific headers or context
      const userAgent = navigator.userAgent;
      const isFarcasterClient = userAgent.includes('Farcaster') || userAgent.includes('Warpcast');
      
      this.isFrameContext = hasFrameParams || (isIframe && isFarcasterClient);
      
      if (this.isFrameContext) {
        console.log('🎯 Farcaster Frame context detected');
        this.extractFrameData(urlParams);
      }
    } catch (error) {
      console.error('Error detecting frame context:', error);
      this.isFrameContext = false;
    }
  }

  // Extract frame data from URL parameters
  extractFrameData(urlParams) {
    this.frameData = {
      fid: urlParams.get('fid'),
      username: urlParams.get('username'),
      displayName: urlParams.get('display_name'),
      pfpUrl: urlParams.get('pfp_url'),
      castHash: urlParams.get('cast_hash'),
      frameUrl: urlParams.get('frame_url') || this.frameUrl,
      buttonIndex: parseInt(urlParams.get('button_index')) || 1,
      inputText: urlParams.get('input_text') || '',
      state: urlParams.get('state') || ''
    };
    
    console.log('📊 Frame data extracted:', this.frameData);
  }

  // Handle Mini App context initialization
  async handleMiniAppContext() {
    if (!this.frameData?.fid) {
      console.warn('No Farcaster user ID found in mini app context');
      return;
    }

    try {
      // Create or get user based on Farcaster ID
      await this.authenticateWithFarcaster();
      
      // Load game state for this user
      await this.loadUserGameState();
      
      // Enable Mini App features
      this.enableMiniAppFeatures();
      
    } catch (error) {
      console.error('Error handling mini app context:', error);
    }
  }

  // Handle frame context initialization (legacy fallback)
  async handleFrameContext() {
    if (!this.frameData?.fid) {
      console.warn('No Farcaster user ID found in frame data');
      return;
    }

    try {
      // Create or get user based on Farcaster ID
      await this.authenticateWithFarcaster();
      
      // Load game state for this user
      await this.loadUserGameState();
      
      // Handle frame button action
      await this.handleFrameAction();
      
    } catch (error) {
      console.error('Error handling frame context:', error);
    }
  }

  // Enable Mini App specific features
  enableMiniAppFeatures() {
    try {
      // Enable notifications if available
      if (this.sdk?.notifications) {
        this.setupNotifications();
      }
      
      // Enable wallet interactions if available
      if (this.sdk?.wallet) {
        this.setupWalletFeatures();
      }
      
      // Setup Mini App specific UI
      this.setupMiniAppUI();
      
    } catch (error) {
      console.error('Error enabling mini app features:', error);
    }
  }

  // Setup notifications
  setupNotifications() {
    // This can be used to send notifications to users
    console.log('📱 Notifications enabled for Mini App');
  }

  // Setup wallet features
  setupWalletFeatures() {
    // This can be used for wallet interactions
    console.log('💰 Wallet features enabled for Mini App');
  }

  // Setup Mini App UI
  setupMiniAppUI() {
    // Add Mini App specific styling or features
    document.body.classList.add('mini-app-mode');
    console.log('🎨 Mini App UI enabled');
  }

  // Authenticate user with Farcaster data
  async authenticateWithFarcaster() {
    if (!this.gameAPI) {
      throw new Error('Game API not initialized');
    }

    try {
      // Try to sign in with Farcaster ID as email
      const farcasterEmail = `${this.frameData.fid}@farcaster.local`;
      const farcasterPassword = `fc_${this.frameData.fid}_${Date.now()}`;
      
      // First try to sign in
      let result = await this.gameAPI.signIn(farcasterEmail, farcasterPassword);
      
      if (!result.success) {
        // If sign in fails, create new account
        result = await this.gameAPI.signUp(
          farcasterEmail, 
          farcasterPassword,
          this.frameData.username || `User${this.frameData.fid}`
        );
      }

      if (result.success) {
        this.user = result.data.user;
        console.log('🎯 Authenticated with Farcaster:', this.user);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Farcaster authentication failed:', error);
      throw error;
    }
  }

  // Load user's game state
  async loadUserGameState() {
    try {
      const gameState = await this.gameAPI.loadGameState();
      
      if (gameState) {
        // Update the global game state with loaded data
        Object.assign(window.gameState, gameState);
        console.log('📊 Game state loaded for Farcaster user');
      } else {
        console.log('🆕 New Farcaster user - using default game state');
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      // Continue with default state
    }
  }

  // Handle frame button actions
  async handleFrameAction() {
    const buttonIndex = this.frameData.buttonIndex;
    const inputText = this.frameData.inputText;
    const state = this.frameData.state;

    console.log(`🎮 Frame action: Button ${buttonIndex}, Input: "${inputText}", State: "${state}"`);

    try {
      switch (buttonIndex) {
        case 1: // Play/Continue
          await this.handlePlayAction();
          break;
        case 2: // Purchase
          await this.handlePurchaseAction(inputText);
          break;
        case 3: // Deploy
          await this.handleDeployAction(inputText);
          break;
        case 4: // Collect/Sell
          await this.handleCollectAction();
          break;
        default:
          console.log('Unknown button action');
      }
    } catch (error) {
      console.error('Error handling frame action:', error);
    }
  }

  // Handle play action
  async handlePlayAction() {
    // Simply load the game - no specific action needed
    console.log('🎮 Play action - game loaded');
  }

  // Handle purchase action
  async handlePurchaseAction(resourceType) {
    if (!resourceType) {
      console.log('No resource type specified for purchase');
      return;
    }

    try {
      const result = await this.gameAPI.purchaseExpedition(resourceType);
      if (result.success) {
        console.log(`✅ Purchased ${resourceType} expedition`);
        // Update local game state
        window.gameState.expeditions[resourceType] = (window.gameState.expeditions[resourceType] || 0) + 1;
        window.gameState.points -= window.CONFIG.game.resources[resourceType].cost;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  }

  // Handle deploy action
  async handleDeployAction(cellIndex) {
    const cell = parseInt(cellIndex);
    if (isNaN(cell) || cell < 0 || cell >= window.gameState.cells.length) {
      console.log('Invalid cell index for deployment');
      return;
    }

    try {
      // Deploy first available expedition to the specified cell
      const availableExpedition = Object.entries(window.gameState.expeditions)
        .find(([type, count]) => count > 0);
      
      if (availableExpedition) {
        const [resourceType] = availableExpedition;
        const result = await this.gameAPI.deployExpedition(cell, resourceType);
        if (result.success) {
          console.log(`🚀 Deployed ${resourceType} to cell ${cell}`);
        }
      }
    } catch (error) {
      console.error('Deploy failed:', error);
    }
  }

  // Handle collect action
  async handleCollectAction() {
    try {
      // Find ready cells and collect them
      const readyCells = window.gameState.cells
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell }) => cell.isReady);

      for (const { index } of readyCells) {
        await this.gameAPI.collectResource(index);
        console.log(`📦 Collected resource from cell ${index}`);
      }

      // Sell all resources
      await this.gameAPI.sellResources();
      console.log('💰 Sold all resources');
      
    } catch (error) {
      console.error('Collect/sell failed:', error);
    }
  }

  // Generate frame metadata for the current game state
  generateFrameMetadata() {
    const gameState = window.gameState;
    
    // Generate image URL based on game state
    const imageUrl = `${this.frameUrl}/api/frame-image?` + new URLSearchParams({
      level: gameState.level,
      points: gameState.points,
      cells: gameState.ownedCells,
      extracting: gameState.cells.filter(cell => cell.extractionStartTime && !cell.isReady).length,
      ready: gameState.cells.filter(cell => cell.isReady).length
    }).toString();

    // Determine available actions
    const canPurchase = gameState.points >= 20; // Minimum for Lunar Regolith
    const hasExpeditions = Object.values(gameState.expeditions).some(count => count > 0);
    const hasReadyCells = gameState.cells.some(cell => cell.isReady);
    const hasOwnedCells = gameState.cells.some(cell => cell.owned && !cell.extractionStartTime);

    // Generate buttons based on game state
    const buttons = [];
    
    if (hasReadyCells) {
      buttons.push({
        label: "Collect & Sell",
        action: "post",
        target: `${this.frameUrl}/api/frame?action=collect`
      });
    }
    
    if (hasExpeditions && hasOwnedCells) {
      buttons.push({
        label: "Deploy Expedition",
        action: "post",
        target: `${this.frameUrl}/api/frame?action=deploy`,
        post_url: `${this.frameUrl}/api/frame`
      });
    }
    
    if (canPurchase) {
      buttons.push({
        label: "Buy Equipment",
        action: "post",
        target: `${this.frameUrl}/api/frame?action=purchase`,
        post_url: `${this.frameUrl}/api/frame`
      });
    }
    
    buttons.push({
      label: "Open Game",
      action: "link",
      target: this.frameUrl
    });

    return {
      image: imageUrl,
      buttons: buttons,
      input: hasExpeditions && hasOwnedCells ? {
        text: "Enter cell number (0-17)"
      } : canPurchase ? {
        text: "Enter resource type"
      } : null,
      aspectRatio: "1:1",
      state: JSON.stringify({
        timestamp: Date.now(),
        level: gameState.level,
        points: gameState.points
      })
    };
  }

  // Save game state when actions are performed
  async saveGameState() {
    if (this.gameAPI && this.user) {
      try {
        await this.gameAPI.saveGameState(window.gameState);
        console.log('💾 Game state saved for Farcaster user');
      } catch (error) {
        console.error('Error saving game state:', error);
      }
    }
  }

  // Get user info for display
  getUserInfo() {
    if (this.frameData) {
      return {
        fid: this.frameData.fid,
        username: this.frameData.username,
        displayName: this.frameData.displayName,
        pfpUrl: this.frameData.pfpUrl,
        bio: this.frameData.bio,
        isFrameUser: this.isFrameContext,
        isMiniAppUser: this.isMiniApp
      };
    }
    return null;
  }

  // Check if user is authenticated via Farcaster
  isAuthenticated() {
    return (this.isFrameContext || this.isMiniApp) && this.user !== null;
  }

  // Send notification to user (Mini App feature)
  async sendNotification(title, body, targetUrl = null) {
    if (!this.isMiniApp || !this.sdk?.actions) {
      console.warn('Notifications not available');
      return false;
    }

    try {
      const result = await this.sdk.actions.addFrame({
        title,
        body,
        url: targetUrl || window.location.href
      });
      console.log('📱 Notification sent:', result);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Share achievement or game state
  async shareGameState(message, imageUrl = null) {
    if (!this.isMiniApp || !this.sdk?.actions) {
      console.warn('Sharing not available');
      return false;
    }

    try {
      const result = await this.sdk.actions.openComposer({
        text: message,
        embeds: imageUrl ? [{ url: imageUrl }] : undefined
      });
      console.log('📤 Share composer opened:', result);
      return true;
    } catch (error) {
      console.error('Failed to open share composer:', error);
      return false;
    }
  }
}

// Export for browser environment
window.FarcasterIntegration = FarcasterIntegration; 