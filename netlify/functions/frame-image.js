// Frame image generator for Farpost game
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    
    // Extract game state parameters
    const gameData = {
      level: parseInt(params.level) || 1,
      points: parseInt(params.points) || 1000,
      cells: parseInt(params.cells) || 3,
      extracting: parseInt(params.extracting) || 0,
      ready: parseInt(params.ready) || 0,
      message: params.message || '',
      error: params.error || ''
    };

    // Generate SVG image
    const svg = generateGameStateSVG(gameData);

    return {
      statusCode: 200,
      headers,
      body: svg
    };

  } catch (error) {
    console.error('Frame image generation error:', error);
    
    // Return error image
    const errorSvg = generateErrorSVG(error.message);
    return {
      statusCode: 200,
      headers,
      body: errorSvg
    };
  }
};

function generateGameStateSVG(gameData) {
  const width = 600;
  const height = 600;
  
  // Color scheme
  const colors = {
    background: '#0f0f0f',
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#444444',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336'
  };

  // Create status color based on message or error
  let statusColor = colors.primary;
  let statusText = gameData.message;
  
  if (gameData.error) {
    statusColor = colors.error;
    statusText = `Error: ${gameData.error}`;
  } else if (gameData.message.includes('Not enough') || gameData.message.includes('Invalid')) {
    statusColor = colors.warning;
  } else if (gameData.message.includes('Purchased') || gameData.message.includes('Deployed') || gameData.message.includes('Collected')) {
    statusColor = colors.success;
  }

  // Generate hexagonal grid representation
  const hexGrid = generateHexGrid(gameData.cells, gameData.extracting, gameData.ready);

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f0f0f;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:0.9" />
        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:0.9" />
      </linearGradient>
    </defs>
    
    <rect width="100%" height="100%" fill="url(#bgGradient)"/>
    
    <!-- Header -->
    <rect x="20" y="20" width="560" height="80" rx="10" fill="url(#cardGradient)" stroke="${colors.border}" stroke-width="2"/>
    
    <!-- Game Title -->
    <text x="50" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}">
      🌙 Farpost
    </text>
    <text x="50" y="75" font-family="Arial, sans-serif" font-size="14" fill="${colors.textSecondary}">
      Lunar Mining Empire
    </text>
    
    <!-- Player Stats -->
    <g transform="translate(300, 35)">
      <!-- Level -->
      <text x="0" y="0" font-family="Arial, sans-serif" font-size="12" fill="${colors.textSecondary}">Level</text>
      <text x="0" y="18" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.primary}">${gameData.level}</text>
      
      <!-- Points -->
      <text x="80" y="0" font-family="Arial, sans-serif" font-size="12" fill="${colors.textSecondary}">Points</text>
      <text x="80" y="18" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.primary}">${gameData.points.toLocaleString()}</text>
      
      <!-- Cells -->
      <text x="180" y="0" font-family="Arial, sans-serif" font-size="12" fill="${colors.textSecondary}">Cells</text>
      <text x="180" y="18" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.primary}">${gameData.cells}</text>
    </g>
    
    <!-- Main Game Area -->
    <rect x="20" y="120" width="560" height="360" rx="10" fill="url(#cardGradient)" stroke="${colors.border}" stroke-width="2"/>
    
    <!-- Grid Title -->
    <text x="300" y="150" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${colors.text}" text-anchor="middle">
      Lunar Territory
    </text>
    
    <!-- Hexagonal Grid Visualization -->
    <g transform="translate(300, 280)">
      ${hexGrid}
    </g>
    
    <!-- Status Area -->
    <rect x="20" y="500" width="560" height="80" rx="10" fill="url(#cardGradient)" stroke="${colors.border}" stroke-width="2"/>
    
    <!-- Activity Stats -->
    <g transform="translate(50, 530)">
      <text x="0" y="0" font-family="Arial, sans-serif" font-size="14" fill="${colors.textSecondary}">Activity Status</text>
      
      <!-- Extracting -->
      <circle cx="0" cy="25" r="8" fill="${colors.warning}"/>
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="12" fill="${colors.text}">
        ${gameData.extracting} Extracting
      </text>
      
      <!-- Ready -->
      <circle cx="140" cy="25" r="8" fill="${colors.success}"/>
      <text x="160" y="30" font-family="Arial, sans-serif" font-size="12" fill="${colors.text}">
        ${gameData.ready} Ready
      </text>
      
      <!-- Available -->
      <circle cx="260" cy="25" r="8" fill="${colors.secondary}"/>
      <text x="280" y="30" font-family="Arial, sans-serif" font-size="12" fill="${colors.text}">
        ${Math.max(0, gameData.cells - gameData.extracting - gameData.ready)} Available
      </text>
    </g>
    
    <!-- Status Message -->
    ${statusText ? `
    <text x="300" y="560" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
          fill="${statusColor}" text-anchor="middle" opacity="0.9">
      ${truncateText(statusText, 60)}
    </text>
    ` : ''}
    
    <!-- Footer -->
    <text x="300" y="595" font-family="Arial, sans-serif" font-size="10" fill="${colors.textSecondary}" text-anchor="middle">
      Interact using the buttons below
    </text>
  </svg>`;
}

function generateHexGrid(totalCells, extracting, ready) {
  const cellSize = 25;
  const spacing = 35;
  const rows = 3;
  const cols = 6;
  
  // Colors for different cell states
  const cellColors = {
    owned: '#2a4a2a',
    extracting: '#4a4a2a',
    ready: '#4a3a1a',
    available: '#2a2a4a',
    unavailable: '#2a2a2a'
  };

  let hexagons = '';
  let cellIndex = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (cellIndex >= 18) break; // Max 18 cells
      
      const x = (col - cols/2 + 0.5) * spacing + (row % 2) * (spacing/2);
      const y = (row - rows/2 + 0.5) * spacing;
      
      // Determine cell state
      let cellState = 'unavailable';
      let strokeColor = '#666';
      
      if (cellIndex < totalCells) {
        if (ready > 0) {
          cellState = 'ready';
          strokeColor = '#FF9800';
          ready--;
        } else if (extracting > 0) {
          cellState = 'extracting';
          strokeColor = '#FFC107';
          extracting--;
        } else {
          cellState = 'owned';
          strokeColor = '#4CAF50';
        }
      }
      
      // Create hexagon path
      const hexPath = createHexagonPath(x, y, cellSize);
      
      hexagons += `
        <path d="${hexPath}" fill="${cellColors[cellState]}" stroke="${strokeColor}" stroke-width="2"/>
        <text x="${x}" y="${y + 4}" font-family="Arial, sans-serif" font-size="10" 
              fill="white" text-anchor="middle">${cellIndex}</text>
      `;
      
      cellIndex++;
    }
  }
  
  return hexagons;
}

function createHexagonPath(centerX, centerY, radius) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`;
}

function generateErrorSVG(errorMessage) {
  const width = 600;
  const height = 600;
  
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="100%" height="100%" fill="#1a1a1a"/>
    
    <!-- Error Container -->
    <rect x="50" y="200" width="500" height="200" rx="15" fill="#2a1a1a" stroke="#f44336" stroke-width="2"/>
    
    <!-- Error Icon -->
    <circle cx="300" cy="250" r="30" fill="#f44336"/>
    <text x="300" y="260" font-family="Arial, sans-serif" font-size="30" fill="white" text-anchor="middle">!</text>
    
    <!-- Error Title -->
    <text x="300" y="320" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#f44336" text-anchor="middle">
      Error
    </text>
    
    <!-- Error Message -->
    <text x="300" y="350" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">
      ${truncateText(errorMessage, 50)}
    </text>
    
    <!-- Footer -->
    <text x="300" y="550" font-family="Arial, sans-serif" font-size="12" fill="#cccccc" text-anchor="middle">
      Try again or open the game directly
    </text>
  </svg>`;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
} 