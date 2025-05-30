🏭 Resource Inventory# Lunar Explorer: Farcaster Game Design Specification

## 1. Game Overview
A resource extraction game on the Moon where players manage expeditions, extract resources, and expand their territory through a hexagonal grid system.

## 2. Core Systems

### 2.1 Resource System
| Resource | Expedition Cost | Mining Time | Base Value | XP Reward | Unlock Level | Notes |
|----------|----------------|-------------|------------|-----------|--------------|-------|
| Lunar Regolith | 20 | 30 min | 50 | 10 | 1 | Most abundant resource |
| Iron Ore | 30 | 1 hour | 100 | 15 | 1 | Basic construction material |
| Aluminum | 35 | 2 hours | 150 | 18 | 1 | Lightweight construction material |
| Water Ice | 40 | 4 hours | 200 | 20 | 1 | Essential for life support |
| Magnesium | 45 | 6 hours | 180 | 22 | 5 | Lightweight metal |
| Silicon | 50 | 8 hours | 250 | 25 | 5 | Electronics component |
| Titanium | 80 | 12 hours | 500 | 40 | 5 | High-strength material |
| Rare Earth Elements | 150 | 16 hours | 1500 | 75 | 10 | Advanced electronics |
| Platinum Group Metals | 200 | 20 hours | 2000 | 100 | 15 | Catalysts and electronics |
| Helium-3 | 300 | 24 hours | 5000 | 150 | 20 | Fusion fuel |

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

### 2.2 Booster System
| Booster | Cost | Duration | Speed Boost | Unlock Level | Applicable Resources |
|---------|------|----------|-------------|--------------|---------------------|
| Basic Booster | 100 | 1 hour | 2x | 1 | Level 1 resources |
| Advanced Booster | 250 | 1 hour | 3x | 5 | Level 5 resources |
| Elite Booster | 500 | 1 hour | 4x | 10 | Level 10 resources |
| Master Booster | 1000 | 1 hour | 5x | 15 | Level 15 resources |
| Ultimate Booster | 2000 | 1 hour | 10x | 20 | Level 20 resources |
| Instant Extract | Cannot be purchased | Single use | Instant | 1 | All resources |

Booster Properties:
- Each booster can only be used on resources of its tier or lower
- Boosters can be applied to multiple cells simultaneously
- Booster effects stack multiplicatively with cell upgrades
- Boosters cannot be used on already started expeditions
- Instant Extract is a special booster that cannot be purchased and is only received as rewards (particularly during game start)

Example Usage:
- Basic Booster (2x) on Lunar Regolith: 5 min → 2.5 min
- Advanced Booster (3x) on Titanium: 45 min → 15 min
- Elite Booster (4x) on Rare Earth Elements: 90 min → 22.5 min
- Master Booster (5x) on Platinum Group Metals: 120 min → 24 min
- Ultimate Booster (10x) on Helium-3: 180 min → 18 min
- Instant Extract: Any extraction time → Complete immediately

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
| Sell Resources | Unlimited | 5% of sale value | Instant transaction |
| Apply Booster | Limited by inventory | 50 | One booster per cell |

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