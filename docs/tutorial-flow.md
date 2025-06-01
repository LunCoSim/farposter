# Tutorial Flow Documentation

## Overview

This document describes the complete tutorial flow for the Farpost lunar mining game, focusing on expected user behavior, modal sequencing, and step-by-step guidance for new players.

## Tutorial System Overview

### Environment Setup
When tutorial starts:
- Points set to minimum 1,000 for purchasing
- Extraction speed increased for faster tutorial experience
- Game state reset for clean tutorial environment

### Tutorial Persistence
The tutorial system maintains progress across browser sessions:
- **Page Reload Recovery**: If user refreshes the page during tutorial, they resume at their current step
- **Step State Preservation**: Current step number, completed actions, and tutorial environment are maintained
- **Modal Continuation**: After reload, the appropriate modal for the current step appears automatically
- **Highlight Restoration**: UI highlighting and blocking states are restored to match the current tutorial step
- **Progress Protection**: Users never lose tutorial progress due to accidental page refreshes
- **Clean Exit**: Once tutorial is completed or skipped, persistence is cleared for future fresh starts

### Expected Reload Behavior
- **During Modal Display**: Page reloads to show the same modal that was visible before reload
- **During Action Phase**: Page reloads to show highlights for the current step's required action
- **During Extraction Wait**: Page reloads to continue waiting for extraction completion with timer intact
- **Between Steps**: Page reloads to the transition state and continues to next step normally

## Tutorial Steps Detailed Flow

### Step 1: Welcome to Farpost! 🌙

**Purpose**: Introduction and setup
**Modal Content**: 
- Title: "Welcome to Farpost! 🌙"
- Description: "Welcome to the Moon's surface! You're about to start your lunar mining adventure. Let's learn the basics."

**User Flow**:
1. Tutorial auto-starts for new players
2. Modal appears with welcome message
3. User reads introduction
4. User clicks "Got it!" button
5. Modal disappears
6. System progresses to Step 2

**Expected Behavior**:
- Simple welcome message with no interaction required except clicking "Got it!"
- No highlighting or blocking during this step

---

### Step 2: Buy Your First Expedition ⛏️

**Purpose**: Guide user to purchase their first expedition
**Modal Content**:
- Title: "Buy Your First Expedition ⛏️"
- Description: "First, you need to purchase an expedition to extract resources. Click on the 'Buy' tab to see available expeditions."

**User Flow**:
1. Modal appears with purchase instructions
2. User reads instructions and clicks "Got it!"
3. Modal hides completely
4. Buy tab becomes highlighted and clickable
5. Other UI elements become dimmed and non-interactive
6. User clicks on highlighted "Buy" tab
7. User sees expedition options
8. User clicks "Buy" button on any expedition (usually Lunar Regolith)
9. System detects purchase completion
10. Highlight clears and system progresses to Step 3

**Expected Behavior**:
- Only the Buy tab should be clickable and highlighted
- All other elements should be dimmed and non-interactive
- Modal should be completely hidden before highlighting appears
- Purchase confirmation should be visible

---

### Step 3: Deploy Your Expedition 🚀

**Purpose**: Guide user to deploy their purchased expedition
**Modal Content**:
- Title: "Deploy Your Expedition 🚀"
- Description: "Great! Now you have an expedition. Select it from the Deployment Center, then click on one of your owned cells (marked with ⚡) to deploy it."

**User Flow**:
1. Modal appears after purchase completion
2. User reads instructions and clicks "Got it!"
3. Modal hides completely
4. Inventory items and owned cells become highlighted
5. User first clicks on expedition in inventory (becomes selected)
6. User then clicks on an owned cell (marked with ⚡)
7. System detects deployment
8. Cell shows extraction animation with timer
9. System progresses to Step 4

**Expected Behavior**:
- Both inventory expeditions and owned cells should be highlighted
- User must first select expedition, then click cell
- Other UI elements should be blocked
- Clear visual feedback when expedition is selected
- Extraction timer should be visible on deployed cell

---

### Step 4: Wait for Extraction ⏰

**Purpose**: Show extraction in progress and wait for completion
**Modal Content**:
- Title: "Wait for Extraction ⏰"
- Description: "Perfect! Your expedition is now extracting resources. You can see the progress timer. In real games, this takes time, but for the tutorial, it's faster!"

**User Flow**:
1. Modal appears after deployment
2. User reads information and clicks "Got it!"
3. Modal hides completely
4. Extracting cell becomes highlighted showing timer animation
5. System automatically waits for extraction completion
6. System checks for extraction completion every second
7. When extraction completes, cell shows ready state (glowing)
8. System automatically progresses to Step 5

**Expected Behavior**:
- Extracting cell should be highlighted and show progress timer
- No user action required - automatic progression
- Fast extraction due to tutorial speed boost
- Clear transition from extracting to ready state

---

### Step 5: Collect Your Resources 💎

**Purpose**: Guide user to collect completed resources
**Modal Content**:
- Title: "Collect Your Resources 💎"
- Description: "Your extraction is complete! Click on the glowing cell to collect your first lunar resource."

**User Flow**:
1. Modal appears after extraction completion
2. User reads instructions and clicks "Got it!"
3. Modal hides completely
4. Ready cell becomes highlighted with glowing effect
5. User clicks on the highlighted ready cell
6. System detects resource collection
7. Resource appears in inventory
8. Cell returns to owned state
9. System progresses to Step 6

**Expected Behavior**:
- Only the ready cell should be highlighted and clickable
- Cell should have clear glowing/ready visual effect
- Resource should appear in inventory after collection
- Cell should return to normal owned state

---

### Step 6: Apply Your First Booster ⚡

**Purpose**: Teach user how to use boosters to enhance expeditions
**Modal Content**:
- Title: "Apply Your First Booster ⚡"
- Description: "Great job! Now let's learn about boosters. Go to the 'Boosters' tab and purchase a Speed Booster to make your next expedition faster."

**User Flow**:
1. Modal appears after resource collection
2. User reads instructions and clicks "Got it!"
3. Modal hides completely
4. Boosters tab becomes highlighted
5. User clicks on highlighted "Boosters" tab
6. User sees booster options
7. User clicks "Buy" button on a Speed Booster
8. System detects booster purchase
9. User deploys another expedition with the booster applied
10. System detects boosted deployment
11. System progresses to Step 7

**Expected Behavior**:
- Boosters tab should be highlighted and clickable
- Clear explanation of what boosters do
- User should be able to purchase and apply booster
- Boosted expedition should show enhanced effects
- Visual indication that booster is active

---

### Step 7: Sell Resources for Points 💰

**Purpose**: Guide user to sell resources for points
**Modal Content**:
- Title: "Sell Resources for Points 💰"
- Description: "Now you have resources! Go to the 'Sell' tab and click 'Sell All Resources' to convert them into points."

**User Flow**:
1. Modal appears after booster application
2. User reads instructions and clicks "Got it!"
3. Modal hides completely
4. Sell tab and sell button become highlighted
5. User clicks on "Sell" tab to switch view
6. User sees sell interface with collected resources
7. User clicks "Sell All Resources" button
8. System detects resource sale
9. Resources converted to points with visual feedback
10. System progresses to Step 8

**Expected Behavior**:
- Both Sell tab and sell button should be highlighted
- User can click either sell tab first or navigate directly
- Points should increase visibly after selling resources
- Clear confirmation of sale completion

---

### Step 8: Tutorial Complete! 🎉

**Purpose**: Congratulate user and provide completion rewards
**Modal Content**:
- Title: "Tutorial Complete! 🎉"
- Description: "Congratulations! You've learned the complete game loop: Buy expeditions → Deploy → Wait → Collect → Use boosters → Sell → Repeat. You're ready to build your lunar mining empire!"

**User Flow**:
1. Modal appears after selling resources
2. User reads completion message and clicks "Got it!"
3. Tutorial system deactivates
4. All highlighting and blocking removed
5. Game speed returns to normal
6. Completion rewards granted:
   - Points bonus
   - XP bonus
   - "Graduate" achievement unlocked
7. Success notification displayed
8. User can continue playing normally

**Expected Behavior**:
- All tutorial UI effects should be removed
- Normal game functionality restored
- Completion rewards applied and visible
- Achievement notification shown
- User has full access to all game features

## Modal Behavior

### Modal Appearance
- Modal appears with smooth fade-in animation
- Content slides into view smoothly
- Backdrop dims the game interface

### Modal Hiding
- Modal fades out smoothly when "Got it!" is clicked
- Complete disappearance before next step begins
- No overlapping modals

## Highlighting System

### Highlight Behavior
- Highlighted elements are fully interactive and visually emphasized
- Non-highlighted elements are dimmed and non-interactive during tutorial steps
- Clear visual distinction between interactive and blocked elements
- Highlights only appear after modal is completely hidden

### Timing Rules
- Highlights never appear while modal is visible
- Highlights only appear after modal hide transition completes
- Highlights cleared before next modal appears
- One clear action at a time

## Expected User Experience

### Overall Flow
1. **Learn Basics**: Welcome → Buy → Deploy → Wait → Collect
2. **Learn Enhancement**: Apply boosters for better efficiency
3. **Learn Economy**: Sell resources for points and rewards
4. **Complete**: Get rewards and continue playing

### Key Learning Outcomes
- Understanding the core mining loop
- Learning how to enhance expeditions with boosters
- Understanding the resource economy
- Knowing how to optimize their mining operations

### Visual Feedback
- Clear highlighting of interactive elements
- Progress indicators during extractions
- Resource collection animations
- Point increases when selling
- Achievement unlocking celebration

## Troubleshooting Common Issues

### Modal Issues
- **Multiple modals**: Only one modal should be visible at a time
- **Modal not hiding**: Modal should completely disappear before highlights appear
- **Overlapping content**: Modal and highlights should never be visible simultaneously

### Highlighting Issues
- **No highlights**: Highlights should appear after modal hides
- **Wrong elements highlighted**: Only relevant elements should be interactive
- **Highlights not clearing**: Previous highlights should clear before new ones appear

### Progression Issues
- **Stuck tutorial**: User should always have a clear next action
- **Skipped steps**: Each step should complete before progressing
- **Lost progress**: Tutorial state should be maintained throughout

### Persistence Issues
- **Lost progress on reload**: Tutorial should resume at exact same step after page refresh
- **Wrong step after reload**: Correct modal and highlights should appear based on saved progress
- **Tutorial reset unintentionally**: Only manual skip/reset should clear tutorial progress
- **Extraction timer lost**: Ongoing extractions should continue with correct timing after reload
- **Environment not restored**: Tutorial speed boost and other settings should persist after reload

### Debug Options
- Skip tutorial option available at any time
- Reset tutorial function for starting over
- Manual tutorial start for returning players
- Progress inspection to verify current tutorial state

## Testing Scenarios

### Happy Path
1. Complete welcome → Buy expedition → Deploy → Wait → Collect → Apply booster → Sell → Complete
2. All modals appear and hide correctly
3. All highlights appear at correct times
4. All user actions detected properly
5. Rewards granted successfully

### Edge Cases
- Rapid clicking during transitions
- Browser refresh during tutorial
- Multiple tutorial start attempts
- User navigating away and returning
- Mobile device rotation during tutorial

### Reload Testing
- **Reload during welcome modal**: Should show welcome modal again
- **Reload during purchase step**: Should highlight Buy tab and wait for purchase
- **Reload during deployment step**: Should highlight inventory and cells, maintain selected expedition
- **Reload during extraction**: Should continue extraction timer from correct remaining time
- **Reload during collection step**: Should highlight ready cell if extraction completed
- **Reload during booster step**: Should highlight Boosters tab and track booster purchase progress
- **Reload during sell step**: Should highlight Sell tab and sell button
- **Reload after completion**: Should not restart tutorial, normal game state

### Cross-Session Testing
- Complete half of tutorial, close browser completely, reopen - should resume correctly
- Tutorial in progress, computer restart, return to game - should continue from correct step
- Multiple browser tabs with same game - tutorial state should be consistent 