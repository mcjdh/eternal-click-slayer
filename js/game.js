/**
 * Simple Clicker RPG v1.2 - Game Logic
 * Main JavaScript file containing all game mechanics
 * 
 * Features:
 * - Click-based combat system
 * - Multiple helper types with unique stats
 * - Achievement system
 * - Prestige system with permanent bonuses
 */

// -----------------------------------------------------
// --- GAME STATE MANAGEMENT ---
// -----------------------------------------------------

// -----------------------------------------------------
// --- HELPER TYPE DEFINITIONS ---
// -----------------------------------------------------

// Define different helper types with their properties
const helperTypes = [
    { 
        id: 'warrior',
        name: 'Warrior', 
        emoji: '⚔️', 
        description: 'Strong melee fighter with balanced stats',
        baseDamage: 1.5, 
        baseCost: 30,
        costScale: 1.28,
        costLinearAdd: 5,
        damageScaling: 1.0, // Scaling factor for damage calculation
    },
    { 
        id: 'mage',
        name: 'Mage', 
        emoji: '🔮', 
        description: 'High damage but expensive magic user',
        baseDamage: 3.0,
        baseCost: 60,
        costScale: 1.35,
        costLinearAdd: 10,
        damageScaling: 0.8, // Slower scaling but higher base damage
    },
    { 
        id: 'rogue',
        name: 'Rogue', 
        emoji: '🗡️', 
        description: 'Fast attacker with increasing efficiency',
        baseDamage: 1.0,
        baseCost: 25,
        costScale: 1.22,
        costLinearAdd: 3,
        damageScaling: 1.2, // Faster scaling for long-term benefits
    }
];

// --- Game State Variables ---
let state = {
    playerGold: 0,
    playerClickDamage: 1,
    critChance: 0.00, // Start at 0, unlocked via achievement
    critMultiplier: 3,
    playerDPS: 0,
    
    // Helper-type specific tracking
    helperLevels: {
        warrior: 0,
        mage: 0,
        rogue: 0
    },
    helperCosts: {
        warrior: 30,
        mage: 60,
        rogue: 25
    },
    helperDPS: {
        warrior: 0,
        mage: 0, 
        rogue: 0
    },
    
    // Feature Unlocks
    critUnlocked: false,
    helpersUnlocked: false,
    prestigeUnlocked: false, // Unlocks after defeating level 25 boss
    
    // Prestige System
    stars: 0,                 // Star currency earned from prestige
    totalPrestiges: 0,        // Counter for prestiges performed
    starGoldMultiplier: 0,    // Gold bonus from stars (2% per star)

    // Achievement Bonuses
    achievementClickDamageMultiplier: 1.0,
    achievementGoldMultiplier: 1.0,
    achievementCritChanceBonus: 0.00,
    achievementHelperDamageMultiplier: 1.0,

    // Upgrade Costs & Scaling
    baseUpgradeClickCost: 8,
    upgradeClickCost: 8,
    upgradeClickCostScale: 1.12,
    upgradeClickLinearAdd: 1,
    baseUpgradeCritChanceCost: 40,
    upgradeCritChanceCost: 40,
    upgradeCritChanceScale: 1.35,
    upgradeCritChanceLinearAdd: 20,
    critChanceMax: 0.50,
    critChanceIncrement: 0.01,

    // Enemy & Progression State
    enemyLevel: 0,
    enemyMaxHP: 0,
    enemyCurrentHP: 0,
    enemyName: "",
    enemyEmoji: "",
    enemyGoldReward: 0,
    isBoss: false,
    enemiesDefeated: 0,
    totalClicks: 0,
    totalCrits: 0,
    bossLevelInterval: 5,
    enemyHPBase: 10,
    enemyHPScale: 1.16,
    enemyGoldBase: 3,
    enemyGoldScale: 1.10, // Increased from 1.06 to better match HP scaling
    bossHPExponentMultiplier: 1.1,
    bossBaseHPMultiplier: 3.5,
    bossGoldMultiplier: 4.5, // Increased from 4 to better match HP scaling
};

// -----------------------------------------------------
// --- ENEMY DEFINITIONS ---
// -----------------------------------------------------

// --- Enemy Definitions with Emojis
const enemyTypes = [
    { name: "Slime", emoji: "🟢" },
    { name: "Goblin", emoji: "👺" },
    { name: "Bat", emoji: "🦇" },
    { name: "Spider", emoji: "🕷️" },
    { name: "Skeleton", emoji: "💀" },
    { name: "Orc", emoji: "👹" },
    { name: "Wolf", emoji: "🐺" },
    { name: "Bandit", emoji: "🧔" },
    { name: "Imp", emoji: "👿" }
];
const bossTypes = [
    { name: "Giant Slime", emoji: "🦠" },
    { name: "Goblin King", emoji: "👑" },
    { name: "Spider Queen", emoji: "🕸️" },
    { name: "Undead Knight", emoji: "👻" },
    { name: "Orc Warlord", emoji: "🐗" },
    { name: "Stone Golem", emoji: "🗿" },
    { name: "Dark Mage", emoji: "🧙" },
    { name: "Baby Dragon", emoji: "🐉" } // Added a dragon!
];

// -----------------------------------------------------
// --- ACHIEVEMENT SYSTEM ---
// -----------------------------------------------------

// --- Achievements Definition (REVISED for Core Progression) ---
const achievements = [
    // Tier 1: Introduction
    { id: 'click10', desc: 'Click 10 times! (Unlocks Critical Hits & +5% Click Damage)', condition: () => state.totalClicks >= 10, reward: () => { state.critUnlocked = true; state.achievementClickDamageMultiplier += 0.05; showFeedback("✨ Critical Hits Unlocked! ✨", false, true); }, achieved: false, emoji: '🖱️' },
    { id: 'defeat5', desc: 'Defeat 5 enemies! (Unlocks Helpers & +10% Gold Gain)', condition: () => state.enemiesDefeated >= 5, reward: () => { state.helpersUnlocked = true; state.achievementGoldMultiplier += 0.10; showFeedback("🤝 Helpers Unlocked! 🤝", false, true);}, achieved: false, emoji: '🎯' },
    { id: 'firstUpgrade', desc: 'Buy your first Click Dmg upgrade! (+0.5% Crit Chance)', condition: (trigger, details) => trigger === 'upgrade' && details.type === 'click' && state.playerClickDamage > 1 && !achievements.find(a => a.id === 'firstUpgrade').achieved, reward: () => { state.achievementCritChanceBonus += 0.005; }, achieved: false, emoji: '🔼' },

    // Tier 2: Early Game Milestones
    { id: 'level10', desc: 'Reach Level 10! (+10% Click Damage)', condition: () => state.enemyLevel >= 10, reward: () => { state.achievementClickDamageMultiplier += 0.10; }, achieved: false, emoji: '📈' },
    { id: 'crit10', desc: 'Land 10 Critical Hits! (+1% Crit Chance)', condition: () => state.totalCrits >= 10, reward: () => { state.achievementCritChanceBonus += 0.01; }, achieved: false, emoji: '💥' }, // Requires crit unlock first
    
    // Modified to check any helper level
    { id: 'helperLevel1', desc: 'Hire your first Helper! (+5% Helper Damage)', condition: (trigger, details) => trigger === 'upgrade' && details.type && details.type.startsWith('helper-') && state.helperLevels[details.type.replace('helper-', '')] === 1, reward: () => { showFeedback("+5% Helper Damage!", false, true); state.achievementHelperDamageMultiplier += 0.05; }, achieved: false, emoji: '🤝' }, // Requires helper unlock first

    // New helper type specific achievements
    { id: 'warriorLevel5', desc: 'Level 5 Warrior! (+7% Helper Damage)', condition: () => state.helperLevels.warrior >= 5, reward: () => { state.achievementHelperDamageMultiplier += 0.07; }, achieved: false, emoji: '⚔️' },
    { id: 'mageLevel5', desc: 'Level 5 Mage! (+10% Helper Damage)', condition: () => state.helperLevels.mage >= 5, reward: () => { state.achievementHelperDamageMultiplier += 0.10; }, achieved: false, emoji: '🔮' },
    { id: 'rogueLevel5', desc: 'Level 5 Rogue! (+5% Crit Chance)', condition: () => state.helperLevels.rogue >= 5, reward: () => { state.achievementCritChanceBonus += 0.05; }, achieved: false, emoji: '🗡️' },
    { id: 'allHelpers', desc: 'Hire all Helper types! (+15% Gold Gain)', condition: () => state.helperLevels.warrior > 0 && state.helperLevels.mage > 0 && state.helperLevels.rogue > 0, reward: () => { state.achievementGoldMultiplier += 0.15; }, achieved: false, emoji: '🏆' },
    
    // Tier 3: Boss & Deeper Progression
    { id: 'firstBoss', desc: 'Defeat the first Boss! (+25% Gold Gain & +10% Click Damage)', condition: (trigger, details) => trigger === 'enemyDefeated' && details.wasBoss && !achievements.find(a => a.id === 'firstBoss').achieved, reward: () => { state.achievementGoldMultiplier += 0.25; state.achievementClickDamageMultiplier += 0.10; }, achieved: false, emoji: '😈' },
    { id: 'damage15', desc: 'Reach 15 Click Damage! (+1% Crit Chance)', condition: () => state.playerClickDamage >= 15, reward: () => { state.achievementCritChanceBonus += 0.01; }, achieved: false, emoji: '⚔️' },
    { id: 'dps10', desc: 'Reach 10 Total DPS! (+10% Gold Gain)', condition: () => state.playerDPS >= 10, reward: () => { state.achievementGoldMultiplier += 0.10; }, achieved: false, emoji: '⏱️' }, // Requires helper unlock
    { id: 'dps50', desc: 'Reach 50 Total DPS! (+15% Helper Damage)', condition: () => state.playerDPS >= 50, reward: () => { state.achievementHelperDamageMultiplier += 0.15; }, achieved: false, emoji: '🔥' },

    // Prestige Achievements
    { id: 'prestigeReady', desc: 'Reach Level 25! (Unlocks Prestige)', condition: () => state.enemyLevel >= 25, reward: () => { state.prestigeUnlocked = true; }, achieved: false, emoji: '🌀' },
    { id: 'firstPrestige', desc: 'Perform your first Prestige! (+10% Click Damage)', condition: (trigger) => trigger === 'prestige' && state.totalPrestiges === 1, reward: () => { state.achievementClickDamageMultiplier += 0.10; }, achieved: false, emoji: '✨' }
];
let achievementNotificationTimeout = null;

// -----------------------------------------------------
// --- UI ELEMENT REFERENCES ---
// -----------------------------------------------------

// --- HTML Element References ---
const display = {
    gold: document.getElementById('player-gold'),
    clickDamage: document.getElementById('player-click-damage'),
    critChance: document.getElementById('player-crit-chance'),
    critMulti: document.getElementById('player-crit-multi'),
    stars: document.getElementById('player-stars'),
    
    // DPS reference
    dps: document.getElementById('player-dps'),
    
    // Helper type specific references
    helperLevels: {
        warrior: document.getElementById('helper-level-warrior'),
        mage: document.getElementById('helper-level-mage'),
        rogue: document.getElementById('helper-level-rogue')
    },
    helperDPS: {
        warrior: document.getElementById('helper-dps-warrior'),
        mage: document.getElementById('helper-dps-mage'),
        rogue: document.getElementById('helper-dps-rogue')
    },
    helperCosts: {
        warrior: document.getElementById('helper-cost-warrior'),
        mage: document.getElementById('helper-cost-mage'),
        rogue: document.getElementById('helper-cost-rogue')
    },
    helperUpgradeButtons: {
        warrior: document.getElementById('upgrade-helper-warrior'),
        mage: document.getElementById('upgrade-helper-mage'),
        rogue: document.getElementById('upgrade-helper-rogue')
    },

    enemyDisplay: document.getElementById('enemy-display'),
    enemyAreaTitle: document.getElementById('enemy-area-title'),
    enemyName: document.getElementById('enemy-name'),
    enemyNameEmojiSpan: document.getElementById('enemy-name').querySelector('span'),
    enemyHPText: document.getElementById('enemy-hp-text'),
    enemyHPBar: document.getElementById('enemy-hp-bar'),
    enemyHPFlash: document.getElementById('enemy-hp-flash'),
    enemyGold: document.getElementById('enemy-gold'),
    damagePopupArea: document.getElementById('damage-popup-area'),

    attackButton: document.getElementById('attack-button'),
    upgradeClickButton: document.getElementById('upgrade-click-button'),
    upgradeCritChanceButton: document.getElementById('upgrade-crit-chance-button'),

    nextClickDmg: document.getElementById('next-click-dmg'),
    upgradeClickCost: document.getElementById('upgrade-click-cost'),
    nextCritChance: document.getElementById('next-crit-chance'),
    upgradeCritChanceCost: document.getElementById('upgrade-crit-chance-cost'),

    feedback: document.getElementById('feedback'),
    achievementFeedback: document.getElementById('achievement-feedback'),
    
    // Prestige UI elements
    prestigeSection: document.getElementById('prestige-section'),
    prestigeButton: document.getElementById('prestige-button'),
    starsToEarn: document.getElementById('stars-to-earn'),
    starGoldBonus: document.getElementById('star-gold-bonus'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmStarsToEarn: document.getElementById('confirm-stars-to-earn'),
    confirmPrestige: document.getElementById('confirm-prestige'),
    cancelPrestige: document.getElementById('cancel-prestige'),
};

// -----------------------------------------------------
// --- DISPLAY UPDATE FUNCTIONS ---
// -----------------------------------------------------

// --- Core Update Functions ---
function updateDisplay() {
    try {
        // --- Get Effective Values --- 
        const effectiveClickDamage = Math.round(state.playerClickDamage * state.achievementClickDamageMultiplier);
        const effectiveCritChance = state.critChance + state.achievementCritChanceBonus;
        // Note: Gold multiplier applied on gain, Helper damage multiplier applied in calculateDPS

        // Player Stats
        display.gold.textContent = formatNumber(state.playerGold);
        display.clickDamage.textContent = formatNumber(effectiveClickDamage); // Display effective damage
        display.stars.textContent = state.stars; // Display stars

        // Update prestige UI
        updatePrestigeUI();

        // Crit Stats - Show/Hide based on unlock
        const critStatElement = display.critChance.closest('div');
        const critUpgradeButtonElement = display.upgradeCritChanceButton;
        if (state.critUnlocked) {
            if (critStatElement) critStatElement.style.display = '';
            if (critUpgradeButtonElement) critUpgradeButtonElement.style.display = '';

            display.critChance.textContent = (effectiveCritChance * 100).toFixed(0); // Display effective crit chance
            display.critMulti.textContent = state.critMultiplier;

            // Update Crit Upgrade Button
            display.upgradeCritChanceCost.textContent = formatNumber(state.upgradeCritChanceCost);
            const nextCritPercent = Math.min((effectiveCritChance + state.critChanceIncrement) * 100, state.critChanceMax * 100);
            display.nextCritChance.textContent = nextCritPercent.toFixed(0);
            const critMaxed = effectiveCritChance >= state.critChanceMax;
            display.upgradeCritChanceButton.disabled = state.playerGold < state.upgradeCritChanceCost || critMaxed;
            if (critMaxed) {
                display.upgradeCritChanceButton.querySelector('.upgrade-info').textContent = '✨ Crit Chance Maxed!';
                display.upgradeCritChanceButton.querySelector('.upgrade-cost').textContent = '';
            } else {
                // Reset button text if it was previously maxed
                display.upgradeCritChanceButton.querySelector('.upgrade-info').innerHTML = `✨ Crit Chance (<span id="next-crit-chance">${nextCritPercent.toFixed(0)}</span>%)`;
                display.upgradeCritChanceButton.querySelector('.upgrade-cost').innerHTML = `Cost: <span id="upgrade-crit-chance-cost">${formatNumber(state.upgradeCritChanceCost)}</span> G`;
            }
        } else {
            if (critStatElement) critStatElement.style.display = 'none';
            if (critUpgradeButtonElement) critUpgradeButtonElement.style.display = 'none';
        }

        // Helper Stats - Show/Hide Section based on unlock
        const helperSectionElement = document.getElementById('helper-stats'); // Get section div
        if (state.helpersUnlocked) {
            if (helperSectionElement) helperSectionElement.style.display = '';

            // Display total DPS
            display.dps.textContent = formatNumber(state.playerDPS);
            
            // Update helper type specific displays
            helperTypes.forEach(helper => {
                const helperTypeId = helper.id;
                
                // Update level, DPS and cost for each helper type
                if (display.helperLevels[helperTypeId]) {
                    display.helperLevels[helperTypeId].textContent = state.helperLevels[helperTypeId];
                }
                
                if (display.helperDPS[helperTypeId]) {
                    display.helperDPS[helperTypeId].textContent = formatNumber(state.helperDPS[helperTypeId]);
                }
                
                if (display.helperCosts[helperTypeId]) {
                    display.helperCosts[helperTypeId].textContent = formatNumber(state.helperCosts[helperTypeId]);
                }
                
                // Update upgrade button state
                if (display.helperUpgradeButtons[helperTypeId]) {
                    display.helperUpgradeButtons[helperTypeId].disabled = state.playerGold < state.helperCosts[helperTypeId];
                }
            });
        } else {
            if (helperSectionElement) helperSectionElement.style.display = 'none';
        }

        // Enemy Display
        if (state.enemyCurrentHP > 0) {
            // Update emoji and name text separately
            display.enemyNameEmojiSpan.textContent = state.enemyEmoji + " ";
            display.enemyName.childNodes[1].nodeValue = `${state.isBoss ? 'BOSS: ' : ''}${state.enemyName} (Lv. ${state.enemyLevel})`; // Update text node directly
            display.enemyName.style.color = state.isBoss ? 'var(--boss-color)' : 'var(--enemy-name-color)';

            display.enemyHPText.textContent = `❤️ HP: ${formatNumber(state.enemyCurrentHP)} / ${formatNumber(state.enemyMaxHP)}`;
            const hpPercent = state.enemyMaxHP > 0 ? (state.enemyCurrentHP / state.enemyMaxHP) * 100 : 0;
            display.enemyHPBar.style.width = `${hpPercent}%`;
            display.enemyHPBar.style.backgroundColor = hpPercent < 30 ? (hpPercent < 15 ? 'var(--hp-bar-crit)' : 'var(--hp-bar-low)') : 'var(--hp-bar-high)';
            display.enemyGold.textContent = formatNumber(state.enemyGoldReward); // Display base reward
            display.enemyAreaTitle.textContent = `${state.isBoss ? '😈 Boss Encounter!' : '⚔️ Enemy Area'} (Lv. ${state.enemyLevel})`;
            display.enemyDisplay.classList.remove('defeated');
            display.enemyDisplay.style.opacity = 1;
            display.enemyDisplay.style.transform = 'scale(1)';
        } else {
            display.enemyHPBar.style.width = `0%`;
        }

        // Update Click Upgrade Button
        display.upgradeClickCost.textContent = formatNumber(state.upgradeClickCost);
        display.nextClickDmg.textContent = formatNumber(getNextClickDamage()); // Base damage for next upgrade
        display.upgradeClickButton.disabled = state.playerGold < state.upgradeClickCost;

        // Attack button state
        display.attackButton.disabled = state.enemyCurrentHP <= 0;
    } catch (error) {
        console.error('Error in updateDisplay:', error);
        // Try to recover gracefully - at minimum enable the attack button if possible
        if (display.attackButton) {
            display.attackButton.disabled = false;
        }
    }
}

function calculateDPS() {
    if (!state.helpersUnlocked) { // Check if helpers are unlocked
        state.playerDPS = 0;
        return;
    }
    
    // Reset total DPS calculation
    state.playerDPS = 0;
    
    // Calculate DPS for each helper type
    helperTypes.forEach(helper => {
        const helperTypeId = helper.id;
        const level = state.helperLevels[helperTypeId];
        
        if (level > 0) {
            // Calculate DPS using type-specific formula
            // Base damage * level^damageScaling * achievement multiplier
            const typeDPS = helper.baseDamage * 
                Math.pow(level, helper.damageScaling) * 
                state.achievementHelperDamageMultiplier;
            
            // Store DPS for this helper type
            state.helperDPS[helperTypeId] = typeDPS;
            
            // Add to total DPS
            state.playerDPS += typeDPS;
        } else {
            state.helperDPS[helperTypeId] = 0;
        }
    });
}

// -----------------------------------------------------
// --- GAME LOGIC FUNCTIONS ---
// -----------------------------------------------------

function spawnEnemy() {
    state.enemyLevel++;
    state.isBoss = (state.enemyLevel > 0 && state.enemyLevel % state.bossLevelInterval === 0);

    const levelPower = Math.pow(state.enemyHPScale, state.enemyLevel - 1);
    state.enemyMaxHP = Math.floor(state.enemyHPBase * levelPower);
    // Add a small linear bonus to gold rewards to keep up with HP scaling
    const levelBonus = state.enemyLevel * 0.3; // Increased from 0.2
    state.enemyGoldReward = Math.floor((state.enemyGoldBase + levelBonus) * Math.pow(state.enemyGoldScale, state.enemyLevel - 1)) + 1;

    let enemyData;
    if (state.isBoss) {
        const bossIndex = Math.floor((state.enemyLevel / state.bossLevelInterval) - 1) % bossTypes.length;
        enemyData = bossTypes[bossIndex];
        const bossPower = Math.pow(state.enemyLevel / state.bossLevelInterval, state.bossHPExponentMultiplier);
        state.enemyMaxHP = Math.floor(state.enemyMaxHP * state.bossBaseHPMultiplier * bossPower);
        state.enemyGoldReward = Math.floor(state.enemyGoldReward * state.bossGoldMultiplier * (1 + (state.enemyLevel / (state.bossLevelInterval * 5) )));
    } else {
        const enemyIndex = (state.enemyLevel - 1) % enemyTypes.length;
        enemyData = enemyTypes[enemyIndex];
    }
    state.enemyName = enemyData.name;
    state.enemyEmoji = enemyData.emoji;

    state.enemyCurrentHP = state.enemyMaxHP;

    showFeedback(`${state.isBoss ? '😈' : '⚔️'} A wild ${state.enemyName} (Lv. ${state.enemyLevel}) appeared!`);
    checkAchievements('spawn');
    updateDisplay();
}

function dealDamage(amount, isCrit = false, isDPS = false) {
    if (state.enemyCurrentHP <= 0) return;
    const actualAmount = Math.min(amount, state.enemyCurrentHP);
    state.enemyCurrentHP -= actualAmount; // Fixed: Use actualAmount instead of amount

    showDamagePopup(actualAmount, isCrit, isDPS);
    triggerVisualDamageEffect();

    let defeated = false;
    let wasBoss = false;
    if (state.enemyCurrentHP <= 0) {
        state.enemyCurrentHP = 0;
        defeated = true;
        wasBoss = state.isBoss;

        // Apply gold multiplier on gain (include star bonus)
        const goldGained = Math.round(state.enemyGoldReward * (state.achievementGoldMultiplier + state.starGoldMultiplier));
        state.playerGold += goldGained;

        state.enemiesDefeated++;
        // Update feedback to show actual gold gained
        showFeedback(`✅ Defeated ${state.enemyEmoji} ${state.enemyName}! +${formatNumber(goldGained)} 💰`);
        display.enemyDisplay.classList.add('defeated');
        setTimeout(() => { spawnEnemy(); }, 500);
    }
    checkAchievements('enemyDefeated', { wasBoss: wasBoss, damage: actualAmount }); // Pass actual damage dealt for achievement tracking
    updateDisplay();
}

function attackEnemy() {
    state.totalClicks++;

    // Calculate effective damage including achievement bonus
    const effectiveClickDamage = Math.round(state.playerClickDamage * state.achievementClickDamageMultiplier);

    let isCrit = false;
    let damage = effectiveClickDamage; // Start with effective base damage

    // Only check for crit if unlocked
    if (state.critUnlocked) {
        const effectiveCritChance = state.critChance + state.achievementCritChanceBonus;
        isCrit = Math.random() < effectiveCritChance;
        if (isCrit) {
            state.totalCrits++;
            damage = effectiveClickDamage * state.critMultiplier; // Apply multiplier to effective damage
        }
    }

    dealDamage(damage, isCrit, false);
    checkAchievements('click'); // Check click-based achievements
}

function applyDPS() {
    if (state.playerDPS > 0 && state.enemyCurrentHP > 0) {
        const damagePerTick = state.playerDPS * (dpsIntervalMs / 1000);
        // Always apply damage if DPS exists, even if small
        dealDamage(damagePerTick, false, true);
    }
}

function getNextClickDamage() {
    return state.playerClickDamage + 1 + Math.floor(state.playerClickDamage * 0.05);
}

// -----------------------------------------------------
// --- UPGRADE FUNCTIONS ---
// -----------------------------------------------------

function buyUpgrade(type) {
    let cost = 0;
    let purchased = false;
    let feedbackMsg = "";

    // Check if this is a helper type upgrade
    const helperType = type.startsWith('helper-') ? 
        helperTypes.find(h => h.id === type.replace('helper-', '')) : null;

    switch (type) {
        case 'click': // No unlock check needed for base damage
            cost = state.upgradeClickCost;
            if (state.playerGold >= cost) {
                state.playerGold -= cost;
                state.playerClickDamage = getNextClickDamage();
                state.upgradeClickCost = Math.floor(cost * state.upgradeClickCostScale + state.upgradeClickLinearAdd);
                purchased = true;
                feedbackMsg = `🔼 Click Damage increased to ${formatNumber(Math.round(state.playerClickDamage * state.achievementClickDamageMultiplier))}!`; // Show effective damage
            }
            break;
        case 'critChance':
            // Check unlock status first
            if (!state.critUnlocked) {
                showFeedback("❓ Unlock Critical Hits first via achievements!", true);
                break;
            }
            cost = state.upgradeCritChanceCost;
            const effectiveCritChance = state.critChance + state.achievementCritChanceBonus;
            if (state.playerGold >= cost && effectiveCritChance < state.critChanceMax) {
                state.playerGold -= cost;
                // Only increment the base crit chance
                state.critChance = Math.min(state.critChance + state.critChanceIncrement, state.critChanceMax - state.achievementCritChanceBonus); // Ensure base doesn't exceed max when bonus is added
                state.upgradeCritChanceCost = Math.floor(cost * state.upgradeCritChanceScale + state.upgradeCritChanceLinearAdd);
                purchased = true;
                feedbackMsg = `✨ Crit Chance increased to ${((state.critChance + state.achievementCritChanceBonus) * 100).toFixed(0)}%!`; // Show effective chance
            }
            break;
        default:
            // Handle specific helper type upgrades
            if (helperType) {
                // Check if helpers are unlocked
                if (!state.helpersUnlocked) {
                    showFeedback("❓ Unlock Helpers first via achievements!", true);
                    break;
                }
                
                const helperTypeId = helperType.id;
                cost = state.helperCosts[helperTypeId];
                
                if (state.playerGold >= cost) {
                    state.playerGold -= cost;
                    state.helperLevels[helperTypeId]++;
                    
                    // Calculate new cost with scaling specific to this helper type
                    state.helperCosts[helperTypeId] = Math.floor(
                        cost * helperType.costScale + helperType.costLinearAdd
                    );
                    
                    calculateDPS(); // Recalculate DPS after level up
                    purchased = true;
                    feedbackMsg = `${helperType.emoji} ${helperType.name} leveled up to ${state.helperLevels[helperTypeId]}! (DPS: ${formatNumber(state.helperDPS[helperTypeId])})`;
                }
            }
    }

    if (purchased) {
        showFeedback(feedbackMsg);
        checkAchievements('upgrade', { type: type });
        updateDisplay();
    } else if (cost > 0 && state.playerGold < cost && 
            (type === 'click' || 
            (type === 'critChance' && state.critUnlocked) || 
            (helperType && state.helpersUnlocked))) { // Only show 'not enough gold' if unlocked & failed due to cost
        showFeedback("❌ Not enough gold!", true);
    }
}

// -----------------------------------------------------
// --- ACHIEVEMENT SYSTEM FUNCTIONS ---
// -----------------------------------------------------

function checkAchievements(trigger, details = {}) {
    let unlockedCount = 0;
    achievements.forEach(ach => {
        if (!ach.achieved) {
            let conditionMet = false;
            if (typeof ach.condition === 'function') {
                conditionMet = ach.condition(trigger, details);
            }
            // Fallback check for non-contextual achievements if trigger happened
            if (!conditionMet && (trigger === 'enemyDefeated' || trigger === 'upgrade' || trigger === 'spawn' || trigger === 'click')){
                if (typeof ach.condition === 'function' && ach.condition.length === 0) { // Check if function takes no args
                    conditionMet = ach.condition();
                }
            }

            if (conditionMet) {
                ach.reward();
                ach.achieved = true;
                clearTimeout(achievementNotificationTimeout);
                display.achievementFeedback.textContent = `${ach.emoji} Achievement: ${ach.desc}`;
                display.achievementFeedback.style.opacity = 1;
                achievementNotificationTimeout = setTimeout(() => {
                    display.achievementFeedback.style.opacity = 0;
                }, 4000);
                unlockedCount++;
                console.log(`Achievement Unlocked: ${ach.id} (${ach.desc})`);
            }
        }
    });
    if (unlockedCount > 0) {
        updateDisplay();
    }
}

// -----------------------------------------------------
// --- PRESTIGE SYSTEM FUNCTIONS ---
// -----------------------------------------------------

// Calculate how many stars would be earned on prestige
function calculateStarsToEarn() {
    // More gradual star calculation: 1 star per 25 levels, plus partial stars for progress between milestones
    const fullStars = Math.floor(state.enemyLevel / 25);
    const partialProgress = (state.enemyLevel % 25) / 25;
    const partialStar = partialProgress > 0 ? Math.floor(partialProgress * 10) / 10 : 0; // Round to nearest 0.1
    
    // Return a minimum of 1 star
    return Math.max(1, fullStars + partialStar);
}

// Update prestige UI elements
function updatePrestigeUI() {
    if (state.prestigeUnlocked) {
        display.prestigeSection.style.display = '';
        display.starsToEarn.textContent = calculateStarsToEarn();
        display.starGoldBonus.textContent = (state.starGoldMultiplier * 100).toFixed(0);
    } else {
        display.prestigeSection.style.display = 'none';
    }
}

// Show the prestige confirmation modal
function showPrestigeModal() {
    display.confirmStarsToEarn.textContent = calculateStarsToEarn();
    display.confirmModal.style.display = 'block';
}

// Hide the prestige confirmation modal
function hidePrestigeModal() {
    display.confirmModal.style.display = 'none';
}

// Get initial state for reset
function getInitialState() {
    return {
        playerGold: 0,
        playerClickDamage: 1,
        critChance: 0.00,
        critMultiplier: 3,
        playerDPS: 0,
        
        critUnlocked: false,
        helpersUnlocked: false,
        prestigeUnlocked: true, // Stay unlocked after first prestige
        
        achievementClickDamageMultiplier: 1.0,
        achievementGoldMultiplier: 1.0,
        achievementCritChanceBonus: 0.00,
        achievementHelperDamageMultiplier: 1.0,
        
        baseUpgradeClickCost: 8,
        upgradeClickCost: 8,
        upgradeClickCostScale: 1.12,
        upgradeClickLinearAdd: 1,
        baseUpgradeCritChanceCost: 40,
        upgradeCritChanceCost: 40,
        upgradeCritChanceScale: 1.35,
        upgradeCritChanceLinearAdd: 20,
        critChanceMax: 0.50,
        critChanceIncrement: 0.01,
        
        // Initialize helper type levels and costs
        helperLevels: {
            warrior: 0,
            mage: 0,
            rogue: 0
        },
        helperCosts: {
            warrior: 30,
            mage: 60,
            rogue: 25
        },
        helperDPS: {
            warrior: 0,
            mage: 0,
            rogue: 0
        },
        
        enemyLevel: 0,
        enemyMaxHP: 0,
        enemyCurrentHP: 0,
        enemyName: "",
        enemyEmoji: "",
        enemyGoldReward: 0,
        isBoss: false,
        enemiesDefeated: 0,
        totalClicks: 0,
        totalCrits: 0,
        bossLevelInterval: 5,
        enemyHPBase: 10,
        enemyHPScale: 1.16,
        enemyGoldBase: 3,
        enemyGoldScale: 1.06,
        bossHPExponentMultiplier: 1.1,
        bossBaseHPMultiplier: 3.5,
        bossGoldMultiplier: 4,
        
        // Preserve prestige-related state (these will be overwritten)
        prestigeUnlocked: false,
        stars: 0,
        totalPrestiges: 0,
        starGoldMultiplier: 0,
    };
}

// Perform prestige operation
function performPrestige() {
    // Calculate stars to earn
    const starsToEarn = calculateStarsToEarn();
    
    // Save prestige values to preserve
    const prestigeState = {
        stars: state.stars + starsToEarn,
        totalPrestiges: state.totalPrestiges + 1,
        prestigeUnlocked: true // Keep it unlocked
    };
    
    // Save achievement states
    const achievementStates = achievements.map(a => a.achieved);
    
    // Reset the game state
    Object.assign(state, getInitialState());
    
    // Restore prestige values
    state.stars = prestigeState.stars;
    state.totalPrestiges = prestigeState.totalPrestiges;
    
    // Calculate new star gold multiplier
    state.starGoldMultiplier = state.stars * 0.02; // 2% per star
    
    // Restore achievements (important to keep prestige achievement)
    achievements.forEach((a, i) => {
        if (a.id.startsWith('prestige') || 
            a.id === 'firstPrestige' || 
            a.desc.toLowerCase().includes('prestige')) {
            // Preserve all prestige-related achievements
            a.achieved = achievementStates[i];
        } else {
            a.achieved = false; // Reset all other achievements
        }
    });
    
    // Hide modal
    hidePrestigeModal();
    
    // Reinitialize game with new state
    calculateDPS();
    spawnEnemy();
    updateDisplay();
    updatePrestigeUI();
    
    // Show feedback
    showFeedback(`✨ Prestige successful! You earned ${starsToEarn} Star${starsToEarn > 1 ? 's' : ''}!`, false);
    
    // Check for prestige-related achievements
    checkAchievements('prestige');
    
    // Save game
    saveGame();
}

// -----------------------------------------------------
// --- SAVE/LOAD SYSTEM ---
// -----------------------------------------------------

function saveGame() {
    // Create a copy of the state to save
    const saveData = JSON.parse(JSON.stringify(state));
    
    // Add a timestamp for informational purposes
    saveData.lastSaved = new Date().toISOString();
    
    // Save to localStorage
    try {
        localStorage.setItem('clickerRPGSave', JSON.stringify(saveData));
        showFeedback('💾 Game saved successfully!');
        console.log('Game saved at', saveData.lastSaved);
        return true;
    } catch (e) {
        console.error('Save failed:', e);
        showFeedback('❌ Failed to save game!', true);
        return false;
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem('clickerRPGSave');
        if (!saveData) {
            console.log('No saved game found');
            return false;
        }
        
        const loadedState = JSON.parse(saveData);
        console.log('Found save from:', loadedState.lastSaved || 'unknown date');
        
        // Handle migration from old helper system to new helper types
        migrateHelperData(loadedState);
        
        // Apply loaded state properties to current state
        Object.keys(loadedState).forEach(key => {
            // Skip lastSaved as it's just for info
            if (key !== 'lastSaved') {
                // Copy values, preserving any new properties that might not be in the save
                if (typeof loadedState[key] === 'object' && loadedState[key] !== null) {
                    state[key] = {...(state[key] || {}), ...(loadedState[key] || {})};
                } else {
                    state[key] = loadedState[key];
                }
            }
        });
        
        // Recalculate derived values
        calculateDPS();
        
        showFeedback('🎮 Game loaded successfully!');
        console.log('Game loaded');
        return true;
    } catch (e) {
        console.error('Load failed:', e);
        showFeedback('❌ Failed to load game!', true);
        return false;
    }
}

function formatNumber(num) {
    let value = typeof num === 'number' ? num : 0;
    value = Math.round(value);
    if (value < 1e3) return value.toString();
    const suffixes = ['', 'k', 'M', 'B', 'T', 'q', 'Q', 's', 'S']; // Added more
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
    if (tier >= suffixes.length) return value.toExponential(1);
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = value / scale;
    const formatted = scaled.toFixed(scaled < 10 ? 2 : (scaled < 100 ? 1 : 0));
    return formatted.replace(/\.?0+$/, '') + suffix;
}

let feedbackTimeout = null;
function showFeedback(message, isError = false) {
    clearTimeout(feedbackTimeout);
    const el = display.feedback;
    el.innerHTML = message; // Use innerHTML to render emojis properly if needed
    el.style.color = isError ? 'var(--danger-color)' : 'var(--feedback-color)';
    el.classList.remove('hidden');

    const duration = isError ? 1500 : 3000;
    feedbackTimeout = setTimeout(() => { el.classList.add('hidden'); }, duration);
}

function showDamagePopup(amount, isCrit = false, isDPS = false) {
    // Show all damage, even small amounts
    const amountStr = isCrit ? formatNumber(amount) : (amount < 1 ? amount.toFixed(2) : (amount < 5 ? amount.toFixed(1) : formatNumber(amount)));

    const popup = document.createElement('div');
    popup.innerHTML = isCrit ? `💥 ${amountStr}` : amountStr; // Added crit emoji
    popup.classList.add('damage-popup');

    const randomXOffset = (Math.random() - 0.5) * 70;
    popup.style.left = `calc(50% + ${randomXOffset}px)`;

    if (isCrit) popup.classList.add('crit');
    else if (isDPS) popup.classList.add('dps');

    display.damagePopupArea.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.bottom = '95px'; // Float higher
        popup.style.opacity = '0';
    });

    setTimeout(() => { popup.remove(); }, 900); // Match CSS transition duration
}

function triggerVisualDamageEffect() {
    display.enemyDisplay.classList.add('shake');
    setTimeout(() => display.enemyDisplay.classList.remove('shake'), 100);

    const flash = display.enemyHPFlash;
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 100);
}

// -----------------------------------------------------
// --- EVENT LISTENERS ---
// -----------------------------------------------------

// Set up event listeners when the DOM is ready
function setupEventListeners() {
    display.attackButton.addEventListener('click', attackEnemy);
    display.upgradeClickButton.addEventListener('click', () => buyUpgrade('click'));
    display.upgradeCritChanceButton.addEventListener('click', () => buyUpgrade('critChance'));
    
    // Set up helper upgrade buttons
    helperTypes.forEach(helper => {
        const helperTypeId = helper.id;
        const upgradeButton = display.helperUpgradeButtons[helperTypeId];
        
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => buyUpgrade(`helper-${helperTypeId}`));
        }
    });
    
    // Prestige button event listeners
    display.prestigeButton.addEventListener('click', showPrestigeModal);
    display.confirmPrestige.addEventListener('click', performPrestige);
    display.cancelPrestige.addEventListener('click', hidePrestigeModal);
    
    // Close modal if clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === display.confirmModal) {
            hidePrestigeModal();
        }
    });
    
    // Save/Load buttons
    const saveButton = document.getElementById('save-game-button');
    const loadButton = document.getElementById('load-game-button');
    
    if (saveButton) saveButton.addEventListener('click', saveGame);
    if (loadButton) loadButton.addEventListener('click', () => {
        if (confirm('Loading will overwrite current progress. Continue?')) {
            loadGame();
            updateDisplay();
        }
    });

    document.addEventListener('keydown', (event) => {
        if ((event.code === 'Space' || event.key === ' ') && !display.attackButton.disabled) {
            event.preventDefault();
            display.attackButton.click(); // Trigger the actual button click
            // Visual feedback for keypress interaction
            display.attackButton.style.transform = 'translateY(1px) scale(0.98)';
            display.attackButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
            setTimeout(() => {
                display.attackButton.style.transform = 'none';
                display.attackButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }, 100);
        }
    });
}

// -----------------------------------------------------
// --- SAVE/LOAD SYSTEM ---
// -----------------------------------------------------


/**
 * Migrates legacy helper data to the new helper types system.
 * This is for backward compatibility with older save files.
 */
function migrateHelperData(loadedState) {
    // If we have old helper level data but no helper types data, migrate it
    if (loadedState.helperLevel > 0 && 
        (!loadedState.helperLevels || 
         Object.values(loadedState.helperLevels).reduce((sum, val) => sum + val, 0) === 0)) {
        
        console.log('Migrating from old helper system to new helper types');
        
        // Assign all levels to Warrior for simplicity
        if (!loadedState.helperLevels) loadedState.helperLevels = {};
        loadedState.helperLevels.warrior = loadedState.helperLevel;
        
        // Set other helper levels to 0 if not present
        helperTypes.forEach(helper => {
            if (helper.id !== 'warrior') {
                loadedState.helperLevels[helper.id] = loadedState.helperLevels[helper.id] || 0;
            }
        });
        
        // Update costs based on levels
        if (!loadedState.helperCosts) loadedState.helperCosts = {};
        helperTypes.forEach(helper => {
            const level = loadedState.helperLevels[helper.id] || 0;
            let cost = helper.baseCost;
            
            // Recalculate the cost based on current level
            for (let i = 0; i < level; i++) {
                cost = Math.floor(cost * helper.costScale + helper.costLinearAdd);
            }
            
            loadedState.helperCosts[helper.id] = cost;
        });
    }
}

// -----------------------------------------------------
// --- GAME INITIALIZATION ---
// -----------------------------------------------------

const dpsIntervalMs = 500;
let dpsIntervalId = null;
let autoSaveIntervalId = null;

function initGame() {
    console.log("Initializing Simple Clicker RPG v1.2...");
    
    // Initialize helper costs from their base values
    helperTypes.forEach(helper => {
        const helperTypeId = helper.id;
        state.helperCosts[helperTypeId] = helper.baseCost;
    });
    
    setupEventListeners();
    
    // Try to load saved game
    const loaded = loadGame();
    if (!loaded) {
        console.log("No save found or load failed, starting fresh game.");
    }
    
    calculateDPS();
    
    // If we loaded a game and had an enemy, keep it, otherwise spawn a new one
    if (!loaded || state.enemyCurrentHP <= 0) {
        spawnEnemy();
    }
    
    updateDisplay();
    updatePrestigeUI();
    
    // Setup intervals
    if (dpsIntervalId) clearInterval(dpsIntervalId);
    dpsIntervalId = setInterval(applyDPS, dpsIntervalMs);
    
    // Auto-save every 2 minutes
    if (autoSaveIntervalId) clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = setInterval(saveGame, 2 * 60 * 1000);
    
    showFeedback("✨ Game Started! Click the enemy or press Space! ✨");
    checkAchievements('init');
    console.log("Game Initialized.");
}

// Start the game when the page is loaded
document.addEventListener('DOMContentLoaded', initGame);