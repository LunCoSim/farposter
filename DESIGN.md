🏭 Resource Inventory# Lunar Explorer: Farcaster Game Design Specification

## 1. Game Overview
A resource extraction game on the Moon where players manage expeditions, extract resources, and expand their territory through a hexagonal grid system.

## 2. Core Systems

### 2.1 Resource System
| Resource | Expedition Cost | Mining Time | Base Value | XP Reward | Sale XP | Unlock Level | Notes |
|----------|----------------|-------------|------------|-----------|---------|--------------|-------|
| Lunar Regolith | 20 | 30 min | 50 | 10 | 3 | 1 | Most abundant resource |
| Iron Ore | 30 | 1 hour | 100 | 15 | 5 | 1 | Basic construction material |
| Aluminum | 35 | 2 hours | 150 | 18 | 8 | 1 | Lightweight construction material |
| Water Ice | 40 | 4 hours | 200 | 20 | 10 | 1 | Essential for life support |
| Magnesium | 45 | 6 hours | 180 | 22 | 9 | 5 | Lightweight metal |
| Silicon | 50 | 8 hours | 250 | 25 | 13 | 5 | Electronics component |
| Titanium | 80 | 12 hours | 500 | 40 | 25 | 5 | High-strength material |
| Rare Earth Elements | 150 | 16 hours | 1500 | 75 | 75 | 10 | Advanced electronics |
| Platinum Group Metals | 200 | 20 hours | 2000 | 100 | 100 | 15 | Catalysts and electronics |
| Helium-3 | 300 | 24 hours | 5000 | 150 | 250 | 20 | Fusion fuel |

Resource Availability by Level:
1. Level 1 Resources (Quick Cycle)
   - Lunar Regolith: 30 min cycle
   - Iron Ore: 1 hour cycle
   - Aluminum: 2 hours cycle
   - Water Ice: 4 hours cycle

2. Level 5 Resources (Medium Cycle)
   - Magnesium: 6 hours cycle
   - Silicon: 8 hours cycle
   - Titanium: 12 hours cycle

3. Level 10 Resources (Long Cycle)
   - Rare Earth Elements: 16 hours cycle

4. Level 15 Resources (Extended Cycle)
   - Platinum Group Metals: 20 hours cycle

5. Level 20 Resources (Daily Cycle)
   - Helium-3: 24 hours cycle

Resource Properties:
- All resources have equal chance of being found in any cell
- Resource values scale with mining time and expedition cost
- Higher level resources provide better value-to-time ratio
- Each resource has specific use cases in the game economy
- Resources must be collected when mining cycle completes
- New expedition can be started after collection

Strategic Timing:
- Quick Cycle (30 min - 4 hours): Good for active players
- Medium Cycle (6-12 hours): Good for daily players
- Long Cycle (16-24 hours): Good for casual players
- Players should plan their check-ins based on mining cycles
- Multiple cells can be managed with different cycle times

#### XP Rewards System:
**Collection XP**: Earned when collecting completed resources from cells
- Fixed amount per resource type (see XP Reward column in resource table)
- Earned immediately upon resource collection

**Sale XP**: Earned when selling resources for points
- Fixed amount per resource type (see Sale XP column in resource table)  
- Calculated based on ~5% of resource value, rounded for balance
- Earned for each individual resource sold

**Booster Usage XP**: Earned when using any booster
- All boosters award 50 XP when used
- Earned immediately when booster is applied to a cell
- Applies to both speed boosters and Instant Extract

**Examples:**
- Collecting 1 Lunar Regolith: +10 XP
- Selling 1 Lunar Regolith: +3 XP  
- Using Basic Booster: +50 XP
- Total for complete Lunar Regolith cycle: 63 XP (10 + 3 + 50)

### 2.2 Booster System
| Booster | Cost | Duration | Speed Boost | Unlock Level | Applicable Resources |
|---------|------|----------|-------------|--------------|---------------------|
| Basic Booster | 100 | 1 hour | 2x | 1 | Level 1 resources |
| Advanced Booster | 250 | 1 hour | 3x | 5 | Level 5 resources |
| Elite Booster | 500 | 1 hour | 4x | 10 | Level 10 resources |
| Master Booster | 1000 | 1 hour | 5x | 15 | Level 15 resources |
| Ultimate Booster | 2000 | 1 hour | 10x | 20 | Level 20 resources |
| Instant Extract | Cannot be purchased | Single use | Instant | 1 | All resources |

#### Booster Application Mechanics

**Important: Boosters are applied PER-CELL, not globally!**

**Speed Boosters (Basic, Advanced, Elite, Master, Ultimate):**
1. **Purchase** booster from inventory using points
2. **Select** booster from deployment panel
3. **Apply to ongoing expedition** by clicking on a cell that is currently extracting
4. **Immediate effect** - extraction time is reduced based on booster multiplier
5. **Duration-based** - booster remains active for 1 hour from application
6. **Single use per expedition** - each booster application affects one extraction

**Instant Extract Booster:**
1. **Select** Instant Extract from deployment panel
2. **Click on extracting cell** (must be currently extracting)
3. **Immediate completion** - extraction finishes instantly
4. **Single use** - booster is consumed immediately

#### Booster Rules and Restrictions:
- **One active booster per cell**: Each cell can only have one active (non-expired) booster at a time
- **Multiple cells**: Players can apply boosters to multiple different cells simultaneously
- **Only for ongoing expeditions**: Speed boosters can only be applied to currently extracting cells
- **Cannot boost empty cells**: Speed boosters cannot be applied to empty cells for future expeditions
- **Cannot boost ready expeditions**: Speed boosters cannot be applied to completed extractions
- **Expired boosters can be replaced**: When a booster expires, a new one can be applied to the same cell
- **Tier restrictions**: Each booster can only boost resources of its tier or lower
- **Duration**: Speed boosters remain active for 1 hour from application time
- **Instant Extract exceptions**: Can be used on any extracting cell regardless of resource tier

#### Detailed Workflow Examples:

**Example 1 - Speed Booster on Running Expedition:**
```
1. Cell #5 is extracting Lunar Regolith (20 minutes remaining)
2. Player selects Basic Booster from panel
3. Player clicks on extracting Cell #5
4. Extraction time reduced: 20min → 10min (2x speed bonus)
5. Cell #5 shows 🚀 "Basic Booster applied - 60m remaining"
6. Booster remains active for 1 hour
```

**Example 2 - Expired Booster Replacement:**
```
1. Cell #7 has expired Basic Booster during extraction
2. Player selects Advanced Booster from panel
3. Player clicks on extracting Cell #7 (expired booster is replaced)
4. Extraction time reduced further with 3x speed bonus
5. Cell #7 shows 🚀🚀 "Advanced Booster applied - 60m remaining"
```

**Example 3 - Tier Restriction:**
```
1. Player tries to apply Basic Booster (Level 1 tier) to Cell #3 extracting Titanium (Level 5)
2. System shows: "Basic Booster cannot boost Titanium (tier too high)"
3. Booster is not consumed, player can try with appropriate tier booster
```

**Example 4 - Instant Extract:**
```
1. Cell #7 is extracting Helium-3 (24 hours remaining)
2. Player selects Instant Extract
3. Player clicks on Cell #7
4. Extraction completes immediately, resource ready for collection
5. Instant Extract is consumed
```

#### Speed Calculation Examples:
- Basic Booster (2x) on Lunar Regolith: 30min → 15min
- Advanced Booster (3x) on Titanium: 12hours → 4hours
- Elite Booster (4x) on Rare Earth Elements: 16hours → 4hours
- Master Booster (5x) on Platinum Group Metals: 20hours → 4hours
- Ultimate Booster (10x) on Helium-3: 24hours → 2.4hours
- Instant Extract: Any extraction time → Complete immediately

#### Strategic Considerations:
- **Mid-expedition boost**: Apply boosters to running expeditions to speed up completion
- **Resource tier matching**: Match booster tier to resource level for maximum efficiency
- **Multiple expeditions**: Use different boosters on different cells for parallel extraction
- **Timing**: Consider 1-hour expiration when planning booster usage
- **Emergency completion**: Use Instant Extract for urgent resource collection
- **Booster stacking**: Replace expired boosters on active extractions for continued speed bonus

#### UI and Visual Indicators:
**Cell States:**
- **Empty owned cell**: ⚡ "Owned cell - Ready for expedition"
- **Boosted cell**: 🚀 "Basic Booster applied - 45m remaining"  
- **Extracting cell**: Resource symbol + timer "Iron Ore - Extracting..."
- **Ready cell**: Resource symbol + glow "Iron Ore - Ready to collect!"

**Booster Selection Flow:**
1. Click on booster in "Use Boosters" section
2. UI shows: "Selected Basic Booster. Click owned cells to apply booster for next expedition!"
3. Valid cells highlight, invalid cells grayed out
4. Click on valid cell to apply booster
5. Cell updates visual state, booster deducted from inventory

**Error Handling:**
- "Can only apply boosters to owned cells!" (clicked non-owned cell)
- "Can only apply boosters to ongoing expeditions! Start an expedition first." (clicked empty or ready cell)
- "Cell already has an active booster! Wait for it to expire." (clicked cell with active booster)
- "Basic Booster cannot boost Titanium (tier too high)" (tier mismatch)

### 2.3 Cell System
| Level | Cells Available | Cell Purchase Cost | XP for Purchase |
|-------|-----------------|-------------------|-----------------|
| 1 | 3 | 500 | 100 |
| 2 | 4 | 500 | 100 |
| 3 | 5 | 500 | 100 |
| 10 | 8 | 500 | 100 |
| 15 | 12 | 500 | 100 |
| 20 | 16 | 500 | 100 |
| 25 | 24 | 500 | 100 |
| 30 | 32 | 500 | 100 |
| 35 | 48 | 500 | 100 |
| 40 | 64 | 500 | 100 |

### 2.4 Level System
| Level | XP Required (Cumulative) | Features Unlocked |
|-------|--------------------------|-------------------|
| 1 | 0 | Starting level, Basic resources |
| 2 | 300 | Additional cell slot |
| 3 | 1200 | Additional cell slot |
| 4 | 2200 | - |
| 5 | 3500 | Medium-tier resources (Magnesium, Silicon, Titanium), Advanced Booster |
| 6 | 5200 | - |
| 7 | 7300 | - |
| 8 | 9800 | - |
| 9 | 12800 | - |
| 10 | 16400 | Long-cycle resources (Rare Earth Elements), Elite Booster, Additional cells |
| 11 | 20600 | - |
| 12+ | TBD | Additional levels and features |

Level Progression:
- XP is earned from resource extraction and collection
- Each level unlocks new features, resources, or capabilities
- Higher levels provide access to more valuable resources and better equipment
- Cell capacity increases at specific level milestones

## 3. Player Actions

### 3.1 Daily Actions
| Action | Frequency | XP Reward | Notes |
|--------|-----------|-----------|-------|
| Start Expedition | Unlimited | Based on resource | Limited by available cells |
| Collect Resources | Unlimited | Based on resource | Must wait for mining time |
| Sell Resources | Unlimited | Fixed XP per resource | See resource table for sale XP values |
| Apply Speed Booster | Limited by inventory | 50 | Apply to owned cell, consumed on use |
| Use Instant Extract | Limited by inventory | 50 | Use on extracting cell, immediate effect |

### 3.2 Weekly Actions
| Action | Frequency | XP Reward | Notes |
|--------|-----------|-----------|-------|
| Purchase Booster | Limited by level | 0 | Requires available points |
| Level Up | When XP threshold met | 200 | Unlocks new features |
| Purchase Cell | When level allows | 100 | Requires available points |

## 4. Game Cycles

### 4.1 Short Cycle (5-15 minutes)
- Basic resource extraction
- Quick resource sales
- Booster application
- Cell management

### 4.2 Medium Cycle (1-2 hours)
- Strategic resource extraction
- Booster management
- Cell purchases
- Resource optimization

### 4.3 Long Cycle (Daily)
- Level progression
- Resource unlocking
- Strategic planning
- Territory expansion

## 5. Technical Requirements

### 5.1 Backend requirements
1. Resource Management
   - Resource definitions
   - Extraction tracking
   - Inventory management
   - Market transactions

2. Cell Management
   - Cell ownership
   - Resource distribution
   - Extraction status
   - Cell unlocking

3. Player Management
   - Level progression
   - XP tracking
   - Inventory tracking
   - Booster management

4. Market System
   - Resource pricing
   - Transaction handling
   - Market updates
   - Price history

### 5.2 Frontend Requirements
1. Map Interface
   - Hexagonal grid display
   - Cell status visualization
   - Resource distribution view
   - Active extraction indicators

2. Resource Management
   - Resource inventory
   - Extraction controls
   - Market interface
   - Booster management

3. Player Dashboard
   - Level progress
   - XP tracking
   - Resource statistics
   - Achievement display

## 6. Game Balance

### 6.1 Resource Balance
- Basic resources (Level 1) provide steady income
- Mid-tier resources (Level 5) offer better risk/reward
- Advanced resources (Level 10+) provide high-value opportunities

### 6.2 Progression Balance
- Early game: Focus on basic resources and cell acquisition
- Mid game: Introduction of boosters and advanced resources
- Late game: Strategic resource management and territory optimization

### 6.3 Economic Balance
- Resource values scale with extraction time
- Market prices fluctuate based on supply/demand
- Booster costs balanced against resource values
- Cell purchase costs scale with game progression

## 7. Future Considerations
1. Multiplayer Features
   - Resource trading
   - Joint expeditions
   - Territory disputes

2. Advanced Mechanics
   - Resource processing
   - Base building
   - Research system

3. Special Events
   - Resource rushes
   - Market events
   - Special expeditions 

## 8. Tutorial System

### 8.1 Tutorial Overview
The tutorial system guides new players through the core game mechanics in a structured, step-by-step approach. It provides hands-on learning with visual highlights and progress tracking.

### 8.2 Tutorial Flow
| Step | Title | Action Required | Completion Trigger |
|------|-------|----------------|-------------------|
| 1 | Welcome to Farpost! 🌙 | None (informational) | Click "Got it!" |
| 2 | Buy Your First Expedition ⛏️ | Purchase "Lunar Regolith" expedition | Purchase any expedition |
| 3 | Deploy Your Expedition 🚀 | Select expedition and deploy to owned cell | Deploy expedition to cell |
| 4 | Wait for Extraction ⏰ | Wait for extraction to complete | Extraction completion (sped up in tutorial) |
| 5 | Collect Your Resources 💎 | Click ready cell to collect resource | Collect resource from cell |
| 6 | Sell Resources for Points 💰 | Go to Sell tab and sell resources | Sell resources |
| 7 | Tutorial Complete! 🎉 | None (completion message) | Tutorial finished |

### 8.3 Tutorial Mechanics

#### Environment Setup:
- **Starting Resources**: Ensures player has 1,000+ points
- **Speed Acceleration**: 60x faster extraction times during tutorial
- **UI Blocking**: Disables non-relevant UI elements with `.tutorial-blocked` class
- **Visual Highlights**: Highlights relevant elements with `.tutorial-highlight` class
- **Purchase Restrictions**: During tutorial, only Lunar Regolith expeditions can be purchased

#### Tutorial State Management:
```javascript
tutorial: {
  isActive: false,
  completed: false,
  step: 0,
  initialSetup: false
}
```

#### Purchase Restrictions During Tutorial:
- **Expedition Purchases**: Only "Lunar Regolith" expeditions are available for purchase
- **UI Feedback**: Other expeditions show "Complete tutorial to unlock" message
- **Frontend Validation**: Purchase buttons are disabled for non-Lunar Regolith expeditions
- **Backend Validation**: GameStateManager validates purchases and blocks non-Lunar Regolith during tutorial
- **Visual Highlighting**: Only Lunar Regolith expedition is highlighted during purchase step

#### Completion Rewards:
- **Points Bonus**: +200 points
- **XP Bonus**: +100 XP
- **Achievement**: "Graduate" achievement unlocked
- **System Reset**: Game speed returns to normal (1x)
- **Unlock All Expeditions**: All expedition types become available for purchase

### 8.4 Tutorial Controls
- **Skip Option**: Players can skip tutorial with confirmation dialog
- **Reset Function**: Debug function to restart tutorial (available in debug panel)
- **Auto-Trigger**: Tutorial starts automatically for new players after 2-second delay

## 9. Achievement System

### 9.1 Achievement Categories

#### Progression Achievements
| Achievement | Trigger | Reward | Icon |
|-------------|---------|--------|------|
| First Expedition | Deploy first expedition | 100 pts | 🚀 |
| Graduate | Complete tutorial | 200 pts | 🎓 |
| Junior Miner | Reach level 5 | 300 pts | ⭐ |
| Expert Miner | Reach level 10 | 500 pts | 🌟 |

#### Resource Management
| Achievement | Trigger | Reward | Icon |
|-------------|---------|--------|------|
| Resource Collector | Collect first resource | 75 pts | 💎 |
| Merchant | Sell first resource | 100 pts | 💰 |
| Resource Hoarder | Collect 50 resources total | 250 pts | 📦 |

#### Advanced Gameplay
| Achievement | Trigger | Reward | Icon |
|-------------|---------|--------|------|
| Speed Demon | Use first booster | 50 pts | ⚡ |
| Territory Expansion | Purchase first additional cell | 150 pts | 🏗️ |
| Efficient Miner | Complete 10 extractions in session | 200 pts | ⚙️ |
| Big Spender | Spend 10,000 points total | 400 pts | 💸 |

#### Elite Resources
| Achievement | Trigger | Reward | Icon |
|-------------|---------|--------|------|
| Rare Collector | Extract Rare Earth Elements | 500 pts | 💠 |
| Platinum Miner | Extract Platinum Group Metals | 750 pts | 🥈 |
| Helium Master | Extract Helium-3 | 1,000 pts | 🥇 |

#### Territory Control
| Achievement | Trigger | Reward | Icon |
|-------------|---------|--------|------|
| Expanding Operations | Purchase second expedition | 150 pts | 🔄 |
| Lunar Empire | Own 10 cells | 1,000 pts | 👑 |

### 9.2 Achievement Mechanics

#### Automatic Tracking:
The system tracks player statistics continuously:
```javascript
stats: {
  expeditionsDeployed: 0,
  expeditionsPurchased: 0,
  boostersUsed: 0,
  resourcesCollected: 0,
  resourcesSold: 0,
  cellsPurchased: 0,
  cellsOwned: 3,
  level: 1,
  pointsSpent: 0,
  extractionsThisSession: 0,
  rareResourcesCollected: 0,
  platinumResourcesCollected: 0,
  heliumResourcesCollected: 0
}
```

#### Achievement Conditions:
Each achievement has a condition function that checks against player stats:
```javascript
condition: (stats) => stats.resourcesCollected >= 50
```

#### Reward System:
- **Point Rewards**: Automatic point addition to player balance
- **Visual Notification**: Toast notification with achievement details
- **Achievement Popup**: Animated popup with achievement icon and details
- **Persistent Storage**: Achievement state saved in game state

### 9.3 Achievement Display

#### Achievement Panel:
- **Completion Status**: Shows completed vs. total achievements
- **Progress Tracking**: Displays progress for relevant achievements (e.g., "45/50 resources")
- **Completion Rate**: Percentage of achievements unlocked
- **Sorting**: Completed achievements shown first, then by reward value

#### Visual Indicators:
- **Completed**: ✅ checkmark with completion date
- **In Progress**: Shows current progress toward goal
- **Locked**: Standard display with reward information

## 10. Authentication System

### 10.1 Authentication Modes

#### Guest Mode
- **Local Storage**: Game state saved to browser localStorage
- **No Account Required**: Immediate gameplay access
- **Limited Features**: Cannot share achievements or sync across devices
- **Upgrade Path**: Can create account later to preserve progress

#### Registered User Mode
- **Cloud Sync**: Game state synchronized with Supabase backend
- **Cross-Device**: Access game from multiple devices
- **Achievement Sharing**: Can share progress and achievements
- **Data Persistence**: Permanent game state storage

### 10.2 Authentication Flow

#### First-Time Visitor Experience:
1. **Auto-Detection**: System checks for existing auth token
2. **Modal Display**: Auth modal appears after 1-second delay if no token found
3. **Mode Selection**: Three options presented:
   - **Play as Guest**: Immediate access, local storage
   - **Create Account**: Registration form with email/password
   - **Sign In**: Login form for existing users

#### Registration Process:
1. **Form Validation**: Username, email, and password (min 6 chars) required
2. **Account Creation**: Supabase Auth integration
3. **Profile Setup**: Creates player profile in database
4. **State Migration**: Merges any local guest progress with new account
5. **Welcome Message**: Success notification and UI update

#### Sign-In Process:
1. **Credential Validation**: Email and password verification
2. **JWT Token**: Secure authentication token issued
3. **State Loading**: Downloads saved game state from server
4. **UI Update**: User display shows username and sign-out option

### 10.3 Authentication Security

#### JWT-Based Authentication:
- **Secure Tokens**: Industry-standard JWT tokens for session management
- **Automatic Refresh**: Token refresh handling for extended sessions
- **Row-Level Security**: Database policies restrict access to user's own data

#### Data Protection:
- **Password Hashing**: Supabase handles secure password storage
- **CORS Protection**: Cross-origin request restrictions
- **Input Validation**: Server-side validation of all user inputs
- **SQL Injection Prevention**: Parameterized queries only

### 10.4 User Session Management

#### Session States:
```javascript
// Guest User
{
  username: 'Guest Player',
  isGuest: true,
  authToken: null
}

// Authenticated User
{
  username: 'PlayerName',
  email: 'player@example.com',
  isGuest: false,
  authToken: 'jwt_token_here'
}
```

#### Session Actions:
- **Sign Out**: Clears auth token, switches to guest mode
- **Account Upgrade**: Converts guest session to registered account
- **State Sync**: Periodic saving of game state to server
- **Offline Handling**: Graceful degradation when server unavailable

### 10.5 User Interface Integration

#### Header Display:
- **Guest Mode**: Shows "Guest Player" with "Create Account" button
- **Authenticated**: Shows username with "Sign Out" button
- **Dynamic Updates**: Real-time UI updates based on auth state

#### Modal Management:
- **Progressive Forms**: Mode selection → Registration/Login forms
- **Error Handling**: Clear error messages for failed attempts
- **Form Validation**: Real-time input validation and feedback
- **Responsive Design**: Works on all device sizes

#### Navigation Flow:
- **Seamless Transition**: No game interruption during auth changes
- **State Preservation**: Game continues without data loss
- **User Feedback**: Clear notifications for all auth actions

## 11. Integration Points

### 11.1 System Interactions

#### Tutorial ↔ Achievements:
- Tutorial completion awards "Graduate" achievement
- Tutorial tracks achievement-eligible actions during guidance
- Achievement progress visible during tutorial (when relevant)

#### Authentication ↔ Game State:
- Guest mode uses localStorage for immediate play
- Registered users get cloud sync and cross-device access
- Achievement sharing requires authenticated account
- Progress migration when upgrading from guest to registered

#### Achievements ↔ Game Progression:
- Achievement rewards accelerate progression
- Resource-specific achievements encourage exploration of all extraction types
- Level-based achievements provide progression milestones
- Spending achievements encourage economic engagement

### 11.2 Data Flow Architecture

#### Tutorial System:
```
Game State → Tutorial Checker → UI Highlights → User Action → Progress Tracking
```

#### Achievement System:
```
Game Action → Stat Tracking → Condition Evaluation → Reward Grant → UI Update
```

#### Authentication System:
```
User Input → Validation → API Call → Token Management → State Sync → UI Update
``` 