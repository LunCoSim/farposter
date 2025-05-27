const { validateFrameMessage } = require('@farcaster/hub-nodejs');

// Farcaster Frame handler for Farpost game
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Return initial frame metadata
      return handleGetRequest(event, headers);
    } else if (event.httpMethod === 'POST') {
      // Handle frame interactions
      return await handlePostRequest(event, headers);
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Frame handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Handle GET requests - return initial frame
function handleGetRequest(event, headers) {
  const baseUrl = `https://${event.headers.host}`;
  
  // Generate initial frame HTML
  const frameHtml = generateFrameHtml({
    title: "🌙 Farpost - Lunar Mining Game",
    description: "Extract resources from the Moon's surface and build your lunar empire!",
    image: `${baseUrl}/api/frame-image?level=1&points=1000&cells=3&extracting=0&ready=0`,
    buttons: [
      { label: "🎮 Start Playing", action: "post" },
      { label: "📖 How to Play", action: "link", target: `${baseUrl}#tutorial` },
      { label: "🏆 Leaderboard", action: "link", target: `${baseUrl}#leaderboard` },
      { label: "🌐 Open Game", action: "link", target: baseUrl }
    ],
    postUrl: `${baseUrl}/api/frame`,
    inputText: "Enter your username (optional)"
  });

  return {
    statusCode: 200,
    headers: {
      ...headers,
      'Content-Type': 'text/html'
    },
    body: frameHtml
  };
}

// Handle POST requests - process frame interactions
async function handlePostRequest(event, headers) {
  try {
    const body = JSON.parse(event.body);
    const baseUrl = `https://${event.headers.host}`;

    // Extract frame message data
    const frameMessage = body.untrustedData;
    const trustedData = body.trustedData;

    // Validate frame message (optional - for production use)
    // const isValid = await validateFrameMessage(trustedData);
    // if (!isValid) {
    //   throw new Error('Invalid frame message');
    // }

    // Extract user and interaction data
    const fid = frameMessage.fid;
    const buttonIndex = frameMessage.buttonIndex;
    const inputText = frameMessage.inputText || '';
    const castId = frameMessage.castId;
    const url = frameMessage.url;
    const timestamp = frameMessage.timestamp;

    console.log('Frame interaction:', { fid, buttonIndex, inputText, castId });

    // Get or create user game state
    const gameState = await getOrCreateUserGameState(fid);

    // Process the button action
    let actionResult = null;
    switch (buttonIndex) {
      case 1: // Start Playing / Continue
        actionResult = await handleStartAction(fid, gameState, inputText);
        break;
      case 2: // Purchase action
        actionResult = await handlePurchaseAction(fid, gameState, inputText);
        break;
      case 3: // Deploy action
        actionResult = await handleDeployAction(fid, gameState, inputText);
        break;
      case 4: // Collect action
        actionResult = await handleCollectAction(fid, gameState);
        break;
      default:
        actionResult = { success: false, message: 'Unknown action' };
    }

    // Generate response frame based on action result and game state
    const responseFrame = generateResponseFrame(gameState, actionResult, baseUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseFrame)
    };

  } catch (error) {
    console.error('POST request error:', error);
    
    // Return error frame
    const errorFrame = generateErrorFrame(error.message, `https://${event.headers.host}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(errorFrame)
    };
  }
}

// Get or create user game state
async function getOrCreateUserGameState(fid) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get or create user using the Farcaster ID
    const { data: userId, error: userError } = await supabase
      .rpc('get_or_create_farcaster_user', {
        fid: fid.toString()
      });
    
    if (userError) {
      console.error('Error getting/creating user:', userError);
      throw new Error('Failed to get or create user');
    }
    
    // Fetch complete game state
    const [profileResult, cellsResult, resourcesResult, expeditionsResult] = await Promise.all([
      supabase.from('player_profiles').select('*').eq('id', userId).single(),
      supabase.from('game_cells').select('*').eq('player_id', userId).order('cell_index'),
      supabase.from('player_resources').select('*').eq('player_id', userId),
      supabase.from('player_expeditions').select('*').eq('player_id', userId)
    ]);
    
    if (profileResult.error) throw new Error('Failed to fetch profile');
    if (cellsResult.error) throw new Error('Failed to fetch cells');
    if (resourcesResult.error) throw new Error('Failed to fetch resources');
    if (expeditionsResult.error) throw new Error('Failed to fetch expeditions');
    
    const profile = profileResult.data;
    const cells = cellsResult.data;
    const resources = resourcesResult.data;
    const expeditions = expeditionsResult.data;
    
    // Transform to frame-compatible format
    const gameState = {
      fid: fid,
      playerId: userId,
      level: profile.level,
      xp: profile.xp,
      points: profile.points,
      ownedCells: profile.owned_cells,
      maxCells: profile.max_cells,
      resources: {},
      expeditions: {},
      cells: Array(18).fill(null).map((_, index) => {
        const cell = cells.find(c => c.cell_index === index);
        return {
          id: index,
          owned: !!cell,
          resourceType: cell?.resource_type || null,
          extractionStartTime: cell?.extraction_start_time ? new Date(cell.extraction_start_time).getTime() : null,
          extractionEndTime: cell?.extraction_end_time ? new Date(cell.extraction_end_time).getTime() : null,
          isReady: cell?.is_ready || false
        };
      }),
      lastUpdated: Date.now()
    };
    
    // Populate resources
    resources.forEach(resource => {
      gameState.resources[resource.resource_type] = resource.amount;
    });
    
    // Populate expeditions
    expeditions.forEach(expedition => {
      gameState.expeditions[expedition.expedition_type] = expedition.amount;
    });
    
    return gameState;
    
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to demo state
    return {
      fid: fid,
      level: 1,
      xp: 0,
      points: 1000,
      ownedCells: 3,
      maxCells: 3,
      resources: {
        'Lunar Regolith': 0,
        'Iron Ore': 0,
        'Aluminum': 0,
        'Water Ice': 0
      },
      expeditions: {
        'Lunar Regolith': 1,
        'Iron Ore': 0,
        'Aluminum': 0,
        'Water Ice': 0
      },
      cells: Array(18).fill(null).map((_, index) => ({
        id: index,
        owned: [7, 8, 9].includes(index),
        resourceType: null,
        extractionStartTime: null,
        extractionEndTime: null,
        isReady: false
      })),
      lastUpdated: Date.now(),
      demoMode: true
    };
  }
}

// Handle start/continue action
async function handleStartAction(fid, gameState, inputText) {
  return {
    success: true,
    message: `Welcome to Farpost! You have ${gameState.points} points and ${gameState.ownedCells} lunar cells.`,
    gameState: gameState
  };
}

// Handle purchase action
async function handlePurchaseAction(fid, gameState, inputText) {
  const resourceType = inputText.trim() || 'Lunar Regolith';
  const resourceCosts = {
    'Lunar Regolith': 20,
    'Iron Ore': 30,
    'Aluminum': 35,
    'Water Ice': 40
  };

  const cost = resourceCosts[resourceType];
  if (!cost) {
    return {
      success: false,
      message: `Unknown resource: ${resourceType}. Try: Lunar Regolith, Iron Ore, Aluminum, Water Ice`,
      gameState: gameState
    };
  }

  if (gameState.points < cost) {
    return {
      success: false,
      message: `Not enough points! Need ${cost}, have ${gameState.points}`,
      gameState: gameState
    };
  }

  // Purchase expedition
  gameState.points -= cost;
  gameState.expeditions[resourceType] = (gameState.expeditions[resourceType] || 0) + 1;

  return {
    success: true,
    message: `Purchased ${resourceType} expedition! (Cost: ${cost} points)`,
    gameState: gameState
  };
}

// Handle deploy action
async function handleDeployAction(fid, gameState, inputText) {
  const cellIndex = parseInt(inputText.trim());
  
  if (isNaN(cellIndex) || cellIndex < 0 || cellIndex >= gameState.cells.length) {
    return {
      success: false,
      message: `Invalid cell number. Enter 0-${gameState.cells.length - 1}`,
      gameState: gameState
    };
  }

  const cell = gameState.cells[cellIndex];
  if (!cell.owned) {
    return {
      success: false,
      message: `Cell ${cellIndex} is not owned!`,
      gameState: gameState
    };
  }

  if (cell.extractionStartTime) {
    return {
      success: false,
      message: `Cell ${cellIndex} is already extracting!`,
      gameState: gameState
    };
  }

  // Find available expedition
  const availableExpedition = Object.entries(gameState.expeditions)
    .find(([type, count]) => count > 0);

  if (!availableExpedition) {
    return {
      success: false,
      message: `No expeditions available! Purchase equipment first.`,
      gameState: gameState
    };
  }

  const [resourceType] = availableExpedition;
  const extractionTime = 30000; // 30 seconds for demo

  // Deploy expedition
  gameState.expeditions[resourceType]--;
  cell.resourceType = resourceType;
  cell.extractionStartTime = Date.now();
  cell.extractionEndTime = Date.now() + extractionTime;
  cell.isReady = false;

  return {
    success: true,
    message: `Deployed ${resourceType} to cell ${cellIndex}! Extraction time: 30 seconds`,
    gameState: gameState
  };
}

// Handle collect action
async function handleCollectAction(fid, gameState) {
  const now = Date.now();
  let collected = 0;
  let totalValue = 0;

  // Check and collect ready resources
  gameState.cells.forEach(cell => {
    if (cell.extractionEndTime && now >= cell.extractionEndTime && !cell.isReady) {
      cell.isReady = true;
    }
    
    if (cell.isReady && cell.resourceType) {
      // Collect resource
      gameState.resources[cell.resourceType] = (gameState.resources[cell.resourceType] || 0) + 1;
      collected++;
      
      // Auto-sell for simplicity
      const resourceValues = {
        'Lunar Regolith': 50,
        'Iron Ore': 100,
        'Aluminum': 150,
        'Water Ice': 200
      };
      
      const value = resourceValues[cell.resourceType] || 50;
      totalValue += value;
      gameState.points += value;
      
      // Reset cell
      cell.resourceType = null;
      cell.extractionStartTime = null;
      cell.extractionEndTime = null;
      cell.isReady = false;
    }
  });

  if (collected === 0) {
    return {
      success: false,
      message: "No resources ready for collection yet!",
      gameState: gameState
    };
  }

  return {
    success: true,
    message: `Collected ${collected} resources and earned ${totalValue} points!`,
    gameState: gameState
  };
}

// Generate response frame
function generateResponseFrame(gameState, actionResult, baseUrl) {
  const extractingCount = gameState.cells.filter(cell => 
    cell.extractionStartTime && !cell.isReady).length;
  const readyCount = gameState.cells.filter(cell => cell.isReady).length;
  
  // Generate image with current state
  const imageUrl = `${baseUrl}/api/frame-image?` + new URLSearchParams({
    level: gameState.level,
    points: gameState.points,
    cells: gameState.ownedCells,
    extracting: extractingCount,
    ready: readyCount,
    message: actionResult.message
  }).toString();

  // Determine available actions
  const canPurchase = gameState.points >= 20;
  const hasExpeditions = Object.values(gameState.expeditions).some(count => count > 0);
  const hasReadyCells = readyCount > 0;
  const hasOwnedCells = gameState.cells.some(cell => 
    cell.owned && !cell.extractionStartTime && !cell.isReady);

  const buttons = [];
  
  if (hasReadyCells) {
    buttons.push({ label: "📦 Collect Resources", action: "post" });
  }
  
  if (hasExpeditions && hasOwnedCells) {
    buttons.push({ label: "🚀 Deploy to Cell", action: "post" });
  }
  
  if (canPurchase) {
    buttons.push({ label: "💰 Buy Equipment", action: "post" });
  }
  
  buttons.push({ label: "🌐 Open Game", action: "link", target: baseUrl });

  return {
    type: "frame",
    version: "vNext",
    image: imageUrl,
    buttons: buttons,
    input: hasExpeditions && hasOwnedCells ? {
      text: "Enter cell number (0-17)"
    } : canPurchase ? {
      text: "Enter resource type"
    } : undefined,
    state: JSON.stringify({
      fid: gameState.fid,
      timestamp: Date.now(),
      level: gameState.level,
      points: gameState.points
    }),
    postUrl: `${baseUrl}/api/frame`
  };
}

// Generate error frame
function generateErrorFrame(errorMessage, baseUrl) {
  return {
    type: "frame",
    version: "vNext",
    image: `${baseUrl}/api/frame-image?error=${encodeURIComponent(errorMessage)}`,
    buttons: [
      { label: "🔄 Try Again", action: "post" },
      { label: "🌐 Open Game", action: "link", target: baseUrl }
    ],
    postUrl: `${baseUrl}/api/frame`
  };
}

// Generate frame HTML for GET requests
function generateFrameHtml({ title, description, image, buttons, postUrl, inputText }) {
  const buttonHtml = buttons.map((button, index) => {
    if (button.action === 'link') {
      return `<meta property="fc:frame:button:${index + 1}" content="${button.label}" />
              <meta property="fc:frame:button:${index + 1}:action" content="link" />
              <meta property="fc:frame:button:${index + 1}:target" content="${button.target}" />`;
    } else {
      return `<meta property="fc:frame:button:${index + 1}" content="${button.label}" />`;
    }
  }).join('\n    ');

  const inputHtml = inputText ? 
    `<meta property="fc:frame:input:text" content="${inputText}" />` : '';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    
    <!-- Farcaster Frame metadata -->
    <meta property="fc:frame" content="vNext">
    <meta property="fc:frame:image" content="${image}">
    <meta property="fc:frame:post_url" content="${postUrl}">
    ${inputHtml}
    ${buttonHtml}
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${postUrl}">
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${image}" alt="Game State" style="max-width: 100%; height: auto;">
    <p><a href="/">Play the full game</a></p>
</body>
</html>`;
} 