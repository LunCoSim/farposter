// Authentication Functions for Farpost Game

// Authentication modal management
function showAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.style.display = 'flex';
    setTimeout(() => authModal.classList.add('show'), 10);
  }
}

function hideAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.remove('show');
    setTimeout(() => authModal.style.display = 'none', 300);
  }
}

function showModeSelection() {
  document.getElementById('modeSelection').style.display = 'block';
  document.getElementById('signUpForm').style.display = 'none';
  document.getElementById('signInForm').style.display = 'none';
  clearAuthError();
}

function showSignUpForm() {
  document.getElementById('modeSelection').style.display = 'none';
  document.getElementById('signUpForm').style.display = 'block';
  document.getElementById('signInForm').style.display = 'none';
  clearAuthError();
}

function showSignInForm() {
  document.getElementById('modeSelection').style.display = 'none';
  document.getElementById('signUpForm').style.display = 'none';
  document.getElementById('signInForm').style.display = 'block';
  clearAuthError();
}

function showAuthError(message) {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearAuthError() {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

// Guest mode selection
async function selectGuestMode() {
  try {
    if (window.game && window.game.api) {
      await window.game.api.playAsGuest();
      window.game.updateUserDisplay({ username: 'Guest Player', isGuest: true });
      window.game.showNotification('Playing as guest! Progress will be saved locally.', 'info');
    }
    hideAuthModal();
  } catch (error) {
    console.error('Error switching to guest mode:', error);
    showAuthError('Failed to switch to guest mode. Please try again.');
  }
}

// Handle sign up
async function handleSignUp() {
  const username = document.getElementById('signUpUsername').value.trim();
  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value;

  if (!username || !email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  try {
    if (window.game && window.game.api) {
      const result = await window.game.api.signUp(email, password, username);
      
      if (result.success) {
        window.game.updateUserDisplay(window.game.api.getUserInfo());
        window.game.showNotification('Account created successfully! Welcome to Farpost!', 'success');
        hideAuthModal();
        
        // Load any existing game state from server
        await window.game.loadGameState();
        window.game.updateUI();
      } else {
        showAuthError(result.error || 'Failed to create account');
      }
    }
  } catch (error) {
    console.error('Sign up error:', error);
    showAuthError('Failed to create account. Please try again.');
  }
}

// Handle sign in
async function handleSignIn() {
  const email = document.getElementById('signInEmail').value.trim();
  const password = document.getElementById('signInPassword').value;

  if (!email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  try {
    if (window.game && window.game.api) {
      const result = await window.game.api.signIn(email, password);
      
      if (result.success) {
        window.game.updateUserDisplay(window.game.api.getUserInfo());
        window.game.showNotification('Signed in successfully! Welcome back!', 'success');
        hideAuthModal();
        
        // Load game state from server
        await window.game.loadGameState();
        window.game.updateUI();
      } else {
        showAuthError(result.error || 'Failed to sign in');
      }
    }
  } catch (error) {
    console.error('Sign in error:', error);
    showAuthError('Failed to sign in. Please check your credentials.');
  }
}

// Update user display in header
function updateUserDisplay(user) {
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay && user) {
    if (user.isGuest) {
      userDisplay.innerHTML = `
        <span style="color: #aaa;">Guest Player</span>
        <button onclick="showAuthModal()" style="background: #4CAF50; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; cursor: pointer;">
          Create Account
        </button>
      `;
    } else {
      userDisplay.innerHTML = `
        <span style="color: #4CAF50;">${user.username || user.displayName || 'Player'}</span>
        <button onclick="handleSignOut()" style="background: #ff4444; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; cursor: pointer;">
          Sign Out
        </button>
      `;
    }
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    if (window.game && window.game.api) {
      await window.game.api.signOut();
      updateUserDisplay({ username: 'Guest Player', isGuest: true });
      window.game.showNotification('Signed out. Now playing as guest.', 'info');
    }
  } catch (error) {
    console.error('Sign out error:', error);
    window.game?.showNotification('Error signing out', 'error');
  }
}

// Check if user should see auth modal on first visit
function checkFirstVisit() {
  // Skip automatic auth modal display - game now starts in guest mode by default
  // The auth modal can still be shown manually via showAuthModal() function
  console.log('🎮 Game starting in guest mode by default (auth modal skipped)');
  
  // Mark as having seen the modal to prevent future automatic displays
  const hasSeenModal = localStorage.getItem('farpost-seen-auth-modal');
  if (!hasSeenModal) {
    localStorage.setItem('farpost-seen-auth-modal', 'true');
  }
}

// Export functions for global access
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.showModeSelection = showModeSelection;
window.showSignUpForm = showSignUpForm;
window.showSignInForm = showSignInForm;
window.selectGuestMode = selectGuestMode;
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.updateUserDisplay = updateUserDisplay;
window.checkFirstVisit = checkFirstVisit; 