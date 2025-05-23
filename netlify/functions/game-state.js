const { supabase, getAuthenticatedUser, createResponse } = require('./utils/supabase');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  try {
    const user = await getAuthenticatedUser(event);

    if (event.httpMethod === 'GET') {
      // Fetch complete game state
      const gameState = await fetchGameState(user.id);
      return createResponse(200, gameState);
    }

    if (event.httpMethod === 'PUT') {
      // Update game state
      const updates = JSON.parse(event.body);
      const updatedState = await updateGameState(user.id, updates);
      return createResponse(200, updatedState);
    }

    return createResponse(405, null, 'Method not allowed');
  } catch (error) {
    console.error('Game state error:', error);
    return createResponse(500, null, error.message);
  }
};

async function fetchGameState(playerId) {
  // Fetch player profile
  const { data: profile, error: profileError } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('id', playerId)
    .single();

  if (profileError) throw new Error('Failed to fetch player profile');

  // Fetch game cells
  const { data: cells, error: cellsError } = await supabase
    .from('game_cells')
    .select('*')
    .eq('player_id', playerId)
    .order('cell_index');

  if (cellsError) throw new Error('Failed to fetch game cells');

  // Fetch resources
  const { data: resources, error: resourcesError } = await supabase
    .from('player_resources')
    .select('*')
    .eq('player_id', playerId);

  if (resourcesError) throw new Error('Failed to fetch resources');

  // Fetch expeditions
  const { data: expeditions, error: expeditionsError } = await supabase
    .from('player_expeditions')
    .select('*')
    .eq('player_id', playerId);

  if (expeditionsError) throw new Error('Failed to fetch expeditions');

  // Fetch boosters
  const { data: boosters, error: boostersError } = await supabase
    .from('player_boosters')
    .select('*')
    .eq('player_id', playerId);

  if (boostersError) throw new Error('Failed to fetch boosters');

  // Transform data to match client-side format
  const gameState = {
    level: profile.level,
    xp: profile.xp,
    points: profile.points,
    ownedCells: profile.owned_cells,
    maxCells: profile.max_cells,
    activeBooster: profile.active_booster,
    boosterEndTime: profile.booster_end_time ? new Date(profile.booster_end_time).getTime() : null,
    resources: {},
    expeditions: {},
    boosters: {},
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
    })
  };

  // Populate resources object
  resources.forEach(resource => {
    gameState.resources[resource.resource_type] = resource.amount;
  });

  // Populate expeditions object
  expeditions.forEach(expedition => {
    gameState.expeditions[expedition.expedition_type] = expedition.amount;
  });

  // Populate boosters object
  boosters.forEach(booster => {
    gameState.boosters[booster.booster_type] = booster.amount;
  });

  return gameState;
}

async function updateGameState(playerId, updates) {
  const promises = [];

  // Update player profile if needed
  if (updates.profile) {
    const profileUpdate = { ...updates.profile };
    if (profileUpdate.boosterEndTime) {
      profileUpdate.booster_end_time = new Date(profileUpdate.boosterEndTime).toISOString();
      delete profileUpdate.boosterEndTime;
    }
    
    promises.push(
      supabase
        .from('player_profiles')
        .update(profileUpdate)
        .eq('id', playerId)
    );
  }

  // Update cells if needed
  if (updates.cells) {
    updates.cells.forEach(cellUpdate => {
      const updateData = { ...cellUpdate };
      delete updateData.cell_index;
      
      if (updateData.extractionStartTime) {
        updateData.extraction_start_time = new Date(updateData.extractionStartTime).toISOString();
        delete updateData.extractionStartTime;
      }
      
      if (updateData.extractionEndTime) {
        updateData.extraction_end_time = new Date(updateData.extractionEndTime).toISOString();
        delete updateData.extractionEndTime;
      }
      
      if (updateData.isReady !== undefined) {
        updateData.is_ready = updateData.isReady;
        delete updateData.isReady;
      }
      
      if (updateData.resourceType !== undefined) {
        updateData.resource_type = updateData.resourceType;
        delete updateData.resourceType;
      }

      promises.push(
        supabase
          .from('game_cells')
          .upsert({
            player_id: playerId,
            cell_index: cellUpdate.cell_index,
            ...updateData
          })
      );
    });
  }

  // Update resources if needed
  if (updates.resources) {
    Object.entries(updates.resources).forEach(([resourceType, amount]) => {
      promises.push(
        supabase
          .from('player_resources')
          .upsert({
            player_id: playerId,
            resource_type: resourceType,
            amount: amount
          })
      );
    });
  }

  // Update expeditions if needed
  if (updates.expeditions) {
    Object.entries(updates.expeditions).forEach(([expeditionType, amount]) => {
      promises.push(
        supabase
          .from('player_expeditions')
          .upsert({
            player_id: playerId,
            expedition_type: expeditionType,
            amount: amount
          })
      );
    });
  }

  // Update boosters if needed
  if (updates.boosters) {
    Object.entries(updates.boosters).forEach(([boosterType, amount]) => {
      promises.push(
        supabase
          .from('player_boosters')
          .upsert({
            player_id: playerId,
            booster_type: boosterType,
            amount: amount
          })
      );
    });
  }

  // Execute all updates
  const results = await Promise.all(promises);
  
  // Check for errors
  results.forEach((result, index) => {
    if (result.error) {
      throw new Error(`Update failed at index ${index}: ${result.error.message}`);
    }
  });

  // Return updated game state
  return await fetchGameState(playerId);
} 