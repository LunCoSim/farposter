const { supabase, createResponse } = require('./utils/supabase');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, null, 'Method not allowed');
  }

  try {
    const { action, email, password, username } = JSON.parse(event.body);

    let result;
    switch (action) {
      case 'signup':
        result = await handleSignUp(email, password, username);
        break;
      case 'signin':
        result = await handleSignIn(email, password);
        break;
      case 'signout':
        result = await handleSignOut(event);
        break;
      default:
        return createResponse(400, null, 'Invalid action');
    }

    return createResponse(200, result);
  } catch (error) {
    console.error('Auth error:', error);
    return createResponse(500, null, error.message);
  }
};

async function handleSignUp(email, password, username) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) throw error;

    return { 
      success: true, 
      user: data.user,
      session: data.session,
      message: 'Account created successfully' 
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function handleSignIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return { 
      success: true, 
      user: data.user,
      session: data.session,
      message: 'Signed in successfully' 
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function handleSignOut(event) {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Set the session for this request
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '' // We don't need refresh token for sign out
      });
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return { 
      success: true, 
      message: 'Signed out successfully' 
    };
  } catch (error) {
    // Even if signout fails on server, we can return success
    // since the client will clear its state anyway
    return { 
      success: true, 
      message: 'Signed out' 
    };
  }
} 