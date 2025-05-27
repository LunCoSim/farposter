-- Farcaster Integration Migration for Farpost
-- Add Farcaster-specific fields to player_profiles table

-- Add Farcaster fields to player_profiles
ALTER TABLE public.player_profiles 
ADD COLUMN farcaster_id TEXT UNIQUE,
ADD COLUMN farcaster_username TEXT,
ADD COLUMN farcaster_display_name TEXT,
ADD COLUMN farcaster_pfp_url TEXT,
ADD COLUMN farcaster_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster Farcaster ID lookups
CREATE INDEX idx_player_profiles_farcaster_id ON public.player_profiles(farcaster_id);

-- Update RLS policies to include Farcaster authentication
CREATE POLICY "Users can access profile via Farcaster ID" ON public.player_profiles
FOR ALL USING (
  auth.uid() = id OR 
  farcaster_id = current_setting('app.current_fid', true)::TEXT
);

-- Create function to get or create user by Farcaster ID
CREATE OR REPLACE FUNCTION public.get_or_create_farcaster_user(
  fid TEXT,
  username TEXT DEFAULT NULL,
  display_name TEXT DEFAULT NULL,
  pfp_url TEXT DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Try to find existing user by Farcaster ID
  SELECT id INTO user_id 
  FROM public.player_profiles 
  WHERE farcaster_id = fid;
  
  -- If user doesn't exist, create one
  IF user_id IS NULL THEN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert new player profile
    INSERT INTO public.player_profiles (
      id, 
      farcaster_id, 
      farcaster_username, 
      farcaster_display_name, 
      farcaster_pfp_url,
      username,
      level,
      xp,
      points,
      owned_cells,
      max_cells
    ) VALUES (
      user_id,
      fid,
      username,
      display_name,
      pfp_url,
      COALESCE(username, 'Player' || substring(fid from 1 for 6)),
      1,
      0,
      1000,
      3,
      3
    );
    
    -- Initialize starting cells (3 owned cells at positions 7, 8, 9)
    INSERT INTO public.game_cells (player_id, cell_index, status)
    VALUES 
      (user_id, 7, 'owned'),
      (user_id, 8, 'owned'), 
      (user_id, 9, 'owned');
      
    -- Initialize resource inventory
    INSERT INTO public.player_resources (player_id, resource_type, amount)
    SELECT user_id, unnest(enum_range(NULL::resource_type)), 0;
    
    -- Initialize expedition inventory with 1 Lunar Regolith expedition
    INSERT INTO public.player_expeditions (player_id, expedition_type, amount)
    SELECT user_id, unnest(enum_range(NULL::resource_type)), 
           CASE WHEN unnest(enum_range(NULL::resource_type)) = 'Lunar Regolith' THEN 1 ELSE 0 END;
    
    -- Initialize booster inventory
    INSERT INTO public.player_boosters (player_id, booster_type, amount)
    VALUES 
      (user_id, 'Basic Booster', 0),
      (user_id, 'Advanced Booster', 0),
      (user_id, 'Elite Booster', 0),
      (user_id, 'Master Booster', 0),
      (user_id, 'Ultimate Booster', 0);
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_farcaster_user TO anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_farcaster_user TO authenticated; 