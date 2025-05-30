const { supabase, getAuthenticatedUser, createResponse } = require('./utils/supabase');

// Import shared game configuration (single source of truth)
const config = require('../../js/config.js');
const gameConfig = config.game;

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, null, 'Method not allowed');
  }

  try {
    const user = await getAuthenticatedUser(event);
    const { action, payload } = JSON.parse(event.body);

    let result;
    switch (action) {
      case 'purchase_expedition':
        result = await purchaseExpedition(user.id, payload);
        break;
      case 'purchase_booster':
        result = await purchaseBooster(user.id, payload);
        break;
      case 'purchase_cell':
        result = await purchaseCell(user.id, payload);
        break;
      case 'deploy_expedition':
        result = await deployExpedition(user.id, payload);
        break;
      case 'collect_resource':
        result = await collectResource(user.id, payload);
        break;
      case 'sell_resources':
        result = await sellResources(user.id, payload);
        break;
      case 'apply_booster':
        result = await applyBooster(user.id, payload);
        break;
      default:
        return createResponse(400, null, 'Invalid action');
    }

    return createResponse(200, result);
  } catch (error) {
    console.error('Game action error:', error);
    return createResponse(500, null, error.message);
  }
};

async function getPlayerProfile(playerId) {
  const { data: profile, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error) throw new Error('Failed to fetch player profile');
  return profile;
}

async function purchaseExpedition(playerId, { resourceType }) {
  const profile = await getPlayerProfile(playerId);
  const resourceConfig = gameConfig.resources[resourceType];

  if (!resourceConfig) {
    throw new Error('Invalid resource type');
  }

  if (resourceConfig.level > profile.level) {
    throw new Error(`Level ${resourceConfig.level} required for ${resourceType}`);
  }

  if (profile.points < resourceConfig.cost) {
    throw new Error('Not enough points');
  }

  // Update points
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({ points: profile.points - resourceConfig.cost })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to update points');

  // Update expeditions inventory
  const { data: existingExpedition } = await supabase
    .from('player_expeditions')
    .select('amount')
    .eq('player_id', playerId)
    .eq('expedition_type', resourceType)
    .single();

  const newAmount = (existingExpedition?.amount || 0) + 1;

  const { error: expeditionError } = await supabase
    .from('player_expeditions')
    .upsert({
      player_id: playerId,
      expedition_type: resourceType,
      amount: newAmount
    });

  if (expeditionError) throw new Error('Failed to update expeditions');

  return { 
    message: `Purchased ${resourceType} expedition`,
    newAmount,
    pointsRemaining: profile.points - resourceConfig.cost
  };
}

async function purchaseBooster(playerId, { boosterType }) {
  const profile = await getPlayerProfile(playerId);
  const boosterConfig = gameConfig.boosters[boosterType];

  if (!boosterConfig) {
    throw new Error('Invalid booster type');
  }

  if (boosterConfig.purchasable === false) {
    throw new Error(`${boosterType} cannot be purchased - only received as rewards`);
  }

  if (boosterConfig.level > profile.level) {
    throw new Error(`Level ${boosterConfig.level} required for ${boosterType}`);
  }

  if (profile.points < boosterConfig.cost) {
    throw new Error('Not enough points');
  }

  // Update points
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({ points: profile.points - boosterConfig.cost })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to update points');

  // Update boosters inventory
  const { data: existingBooster } = await supabase
    .from('player_boosters')
    .select('amount')
    .eq('player_id', playerId)
    .eq('booster_type', boosterType)
    .single();

  const newAmount = (existingBooster?.amount || 0) + 1;

  const { error: boosterError } = await supabase
    .from('player_boosters')
    .upsert({
      player_id: playerId,
      booster_type: boosterType,
      amount: newAmount
    });

  if (boosterError) throw new Error('Failed to update boosters');

  return { 
    message: `Purchased ${boosterType}`,
    newAmount,
    pointsRemaining: profile.points - boosterConfig.cost
  };
}

async function purchaseCell(playerId, { cellIndex = null }) {
  const profile = await getPlayerProfile(playerId);

  if (profile.points < gameConfig.cellPurchaseCost) {
    throw new Error(`Not enough points (need ${gameConfig.cellPurchaseCost})`);
  }

  if (profile.owned_cells >= profile.max_cells) {
    throw new Error('Maximum cells reached for your level');
  }

  // If no cellIndex specified, find first available
  if (cellIndex === null) {
    const { data: existingCells } = await supabase
      .from('game_cells')
      .select('cell_index')
      .eq('player_id', playerId);

    const ownedIndexes = existingCells.map(c => c.cell_index);
    
    for (let i = 0; i < 18; i++) {
      if (!ownedIndexes.includes(i)) {
        cellIndex = i;
        break;
      }
    }

    if (cellIndex === null) {
      throw new Error('No cells available for purchase');
    }
  }

  // Check if cell is already owned
  const { data: existingCell } = await supabase
    .from('game_cells')
    .select('id')
    .eq('player_id', playerId)
    .eq('cell_index', cellIndex)
    .single();

  if (existingCell) {
    throw new Error('Cell is already owned');
  }

  // Update points, owned cells count, and XP
  const newXp = profile.xp + gameConfig.cellPurchaseXP;
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({ 
      points: profile.points - gameConfig.cellPurchaseCost,
      owned_cells: profile.owned_cells + 1,
      xp: newXp
    })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to update profile');

  // Create new cell
  const { error: cellError } = await supabase
    .from('game_cells')
    .insert({
      player_id: playerId,
      cell_index: cellIndex,
      status: 'owned'
    });

  if (cellError) throw new Error('Failed to create cell');

  return { 
    message: 'Cell purchased successfully',
    cellIndex,
    pointsRemaining: profile.points - gameConfig.cellPurchaseCost,
    newXp
  };
}

async function deployExpedition(playerId, { cellIndex, resourceType }) {
  // Get expedition inventory
  const { data: expedition } = await supabase
    .from('player_expeditions')
    .select('amount')
    .eq('player_id', playerId)
    .eq('expedition_type', resourceType)
    .single();

  if (!expedition || expedition.amount === 0) {
    throw new Error(`No ${resourceType} expeditions in inventory`);
  }

  // Get cell
  const { data: cell } = await supabase
    .from('game_cells')
    .select('*')
    .eq('player_id', playerId)
    .eq('cell_index', cellIndex)
    .single();

  if (!cell) {
    throw new Error('Cell not owned');
  }

  if (cell.status === 'extracting') {
    throw new Error('Cell is already extracting');
  }

  if (cell.is_ready) {
    throw new Error('Collect current resource first');
  }

  const resourceConfig = gameConfig.resources[resourceType];
  const extractionTime = resourceConfig.time * 60 * 1000; // Convert minutes to milliseconds
  const now = new Date();
  const endTime = new Date(now.getTime() + extractionTime);

  // Update expedition inventory
  const { error: expeditionError } = await supabase
    .from('player_expeditions')
    .update({ amount: expedition.amount - 1 })
    .eq('player_id', playerId)
    .eq('expedition_type', resourceType);

  if (expeditionError) throw new Error('Failed to update expedition inventory');

  // Update cell
  const { error: cellError } = await supabase
    .from('game_cells')
    .update({
      status: 'extracting',
      resource_type: resourceType,
      extraction_start_time: now.toISOString(),
      extraction_end_time: endTime.toISOString(),
      is_ready: false
    })
    .eq('player_id', playerId)
    .eq('cell_index', cellIndex);

  if (cellError) throw new Error('Failed to update cell');

  return {
    message: `Deployed ${resourceType} expedition`,
    extractionEndTime: endTime.getTime()
  };
}

async function collectResource(playerId, { cellIndex }) {
  const { data: cell } = await supabase
    .from('game_cells')
    .select('*')
    .eq('player_id', playerId)
    .eq('cell_index', cellIndex)
    .single();

  if (!cell) {
    throw new Error('Cell not owned');
  }

  if (!cell.is_ready || new Date() < new Date(cell.extraction_end_time)) {
    throw new Error('Resource not ready for collection');
  }

  const resourceType = cell.resource_type;
  const resourceConfig = gameConfig.resources[resourceType];
  
  // Get current resource amount
  const { data: resource } = await supabase
    .from('player_resources')
    .select('amount')
    .eq('player_id', playerId)
    .eq('resource_type', resourceType)
    .single();

  const newAmount = (resource?.amount || 0) + 1;

  // Update resource inventory
  const { error: resourceError } = await supabase
    .from('player_resources')
    .upsert({
      player_id: playerId,
      resource_type: resourceType,
      amount: newAmount
    });

  if (resourceError) throw new Error('Failed to update resources');

  // Update player XP
  const profile = await getPlayerProfile(playerId);
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({ xp: profile.xp + resourceConfig.xp })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to update XP');

  // Reset cell
  const { error: cellError } = await supabase
    .from('game_cells')
    .update({
      status: 'owned',
      resource_type: null,
      extraction_start_time: null,
      extraction_end_time: null,
      is_ready: false
    })
    .eq('player_id', playerId)
    .eq('cell_index', cellIndex);

  if (cellError) throw new Error('Failed to reset cell');

  return {
    message: `Collected ${resourceType}`,
    resourceType,
    newAmount,
    xpGained: resourceConfig.xp
  };
}

async function sellResources(playerId, { resourceType = null }) {
  // Get all resources if no specific type
  let resourceQuery = supabase
    .from('player_resources')
    .select('*')
    .eq('player_id', playerId);

  if (resourceType) {
    resourceQuery = resourceQuery.eq('resource_type', resourceType);
  }

  const { data: resources } = await resourceQuery;

  let totalValue = 0;
  let soldItems = 0;
  const updates = [];

  resources.forEach(resource => {
    if (resource.amount > 0) {
      const config = gameConfig.resources[resource.resource_type];
      const value = config.value * resource.amount;
      totalValue += value;
      soldItems += resource.amount;
      
      updates.push(
        supabase
          .from('player_resources')
          .update({ amount: 0 })
          .eq('player_id', playerId)
          .eq('resource_type', resource.resource_type)
      );
    }
  });

  if (totalValue === 0) {
    throw new Error('No resources to sell');
  }

  // Execute resource updates
  await Promise.all(updates);

  // Update player points and XP
  const profile = await getPlayerProfile(playerId);
  const xpGained = Math.floor(totalValue * 0.05);
  
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({ 
      points: profile.points + totalValue,
      xp: profile.xp + xpGained
    })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to update profile');

  return {
    message: `Sold ${soldItems} resources for ${totalValue} points`,
    soldItems,
    totalValue,
    xpGained,
    newPoints: profile.points + totalValue
  };
}

async function applyBooster(playerId, { boosterType, cellIndex = null }) {
  // Get booster inventory
  const { data: booster } = await supabase
    .from('player_boosters')
    .select('amount')
    .eq('player_id', playerId)
    .eq('booster_type', boosterType)
    .single();

  if (!booster || booster.amount === 0) {
    throw new Error(`No ${boosterType} in inventory`);
  }

  const boosterConfig = gameConfig.boosters[boosterType];
  
  // Update booster inventory
  const { error: boosterError } = await supabase
    .from('player_boosters')
    .update({ amount: booster.amount - 1 })
    .eq('player_id', playerId)
    .eq('booster_type', boosterType);

  if (boosterError) throw new Error('Failed to update booster inventory');

  if (cellIndex !== null) {
    // Apply to specific cell
    const { data: cell } = await supabase
      .from('game_cells')
      .select('*')
      .eq('player_id', playerId)
      .eq('cell_index', cellIndex)
      .single();

    if (cell && cell.status === 'extracting') {
      const remaining = new Date(cell.extraction_end_time).getTime() - Date.now();
      const newEndTime = new Date(Date.now() + Math.floor(remaining / boosterConfig.multiplier));

      const { error: cellError } = await supabase
        .from('game_cells')
        .update({ extraction_end_time: newEndTime.toISOString() })
        .eq('player_id', playerId)
        .eq('cell_index', cellIndex);

      if (cellError) throw new Error('Failed to apply booster to cell');

      return {
        message: `${boosterType} applied to cell ${cellIndex}`,
        newEndTime: newEndTime.getTime()
      };
    }
  }

  // Apply globally
  const endTime = new Date(Date.now() + boosterConfig.duration * 1000);
  
  const { error: profileError } = await supabase
    .from('player_profiles')
    .update({
      active_booster: boosterType,
      booster_end_time: endTime.toISOString()
    })
    .eq('id', playerId);

  if (profileError) throw new Error('Failed to activate global booster');

  return {
    message: `${boosterType} activated globally for 1 hour`,
    endTime: endTime.getTime()
  };
} 