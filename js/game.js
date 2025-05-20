/**
 * Simple Clicker RPG v1.2 - Game Logic
 * Main JavaScript file containing all game mechanics
 */

// -----------------------------------------------------
// --- GAME STATE MANAGEMENT ---
// -----------------------------------------------------

// --- Game State Variables ---
let state = {
    playerGold: 0,
    playerClickDamage: 1,
    critChance: 0.00, // Start at 0, unlocked via achievement
    critMultiplier: 3,
    helperLevel: 0, // Start at 0, unlocked via achievement
    helperBaseDamage: 1.5,
    playerDPS: 0,

    // Feature Unlocks - NEW
    critUnlocked: false,
    helpersUnlocked: false,
    prestigeUnlocked: false, // Unlocks after defeating level 25 boss
    
    // Prestige System - NEW
    stars: 0,                 // Star currency earned from prestige
    totalPrestiges: 0,        // Counter for prestiges performed
    starGoldMultiplier: 0,    // Gold bonus from stars (2% per star)

    // Achievement Bonuses - NEW
    achievementClickDamageMultiplier: 1.0,
    achievementGoldMultiplier: 1.0,
    achievementCritChanceBonus: 0.00,

    // Upgrade Costs & Scaling (Keep existing)
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
    baseUpgradeHelperCost: 30,
    upgradeHelperCost: 30,
    upgradeHelperCostScale: 1.28,
    upgradeHelperLinearAdd: 5,

    // Enemy & Progression State (Keep existing)
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
    { id: 'helperLevel1', desc: 'Hire your first Helper! (+5% Helper Damage)', condition: (trigger, details) => trigger === 'upgrade' && details.type === 'helper' && state.helperLevel === 1, reward: () => { /* Modify helper damage calculation later */ showFeedback("+5% Helper Damage!", false, true); state.helperBaseDamage *= 1.05; }, achieved: false, emoji: '🤝' }, // Requires helper unlock first

    // Tier 3: Boss & Deeper Progression
    { id: 'firstBoss', desc: 'Defeat the first Boss! (+25% Gold Gain & +10% Click Damage)', condition: (trigger, details) => trigger === 'enemyDefeated' && details.wasBoss && !achievements.find(a => a.id === 'firstBoss').achieved, reward: () => { state.achievementGoldMultiplier += 0.25; state.achievementClickDamageMultiplier += 0.10; }, achieved: false, emoji: '😈' },
    { id: 'damage15', desc: 'Reach 15 Click Damage! (+1% Crit Chance)', condition: () => state.playerClickDamage >= 15, reward: () => { state.achievementCritChanceBonus += 0.01; }, achieved: false, emoji: '⚔️' },
    { id: 'dps10', desc: 'Reach 10 Total DPS! (+10% Gold Gain)', condition: () => state.playerDPS >= 10, reward: () => { state.achievementGoldMultiplier += 0.10; }, achieved: false, emoji: '⏱️' }, // Requires helper unlock

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
    helperLevel: document.getElementById('helper-level'),
    helperDPSEach: document.getElementById('helper-dps-each'),
    dps: document.getElementById('player-dps'),

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
    upgradeHelperButton: document.getElementById('upgrade-helper-button'),

    nextClickDmg: document.getElementById('next-click-dmg'),
    upgradeClickCost: document.getElementById('upgrade-click-cost'),
    nextCritChance: document.getElementById('next-crit-chance'),
    upgradeCritChanceCost: document.getElementById('upgrade-crit-chance-cost'),
    nextHelperLevel: document.getElementById('next-helper-level'),
    upgradeHelperCost: document.getElementById('upgrade-helper-cost'),

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
    const helperUpgradeButtonElement = display.upgradeHelperButton;
    if (state.helpersUnlocked) {
        if (helperSectionElement) helperSectionElement.style.display = '';
        if (helperUpgradeButtonElement) helperUpgradeButtonElement.style.display = '';

        display.helperLevel.textContent = state.helperLevel;
        display.helperDPSEach.textContent = formatNumber(state.helperBaseDamage); // Base damage shown here
        display.dps.textContent = formatNumber(state.playerDPS); // Actual DPS calculated elsewhere

        // Update Helper Upgrade Button
        display.upgradeHelperCost.textContent = formatNumber(state.upgradeHelperCost);
        display.nextHelperLevel.textContent = state.helperLevel + 1;
        display.upgradeHelperButton.disabled = state.playerGold < state.upgradeHelperCost;
    } else {
        if (helperSectionElement) helperSectionElement.style.display = 'none';
        if (helperUpgradeButtonElement) helperUpgradeButtonElement.style.display = 'none';
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
}

function calculateDPS() {
    if (!state.helpersUnlocked) { // Check if helpers are unlocked
        state.playerDPS = 0;
        return;
    }
    // Apply achievement bonuses to base damage if applicable
    // Currently, the helperLevel1 achievement directly modifies state.helperBaseDamage
    // If we add a multiplier state.achievementHelperDamageMultiplier, apply it here:
    // const effectiveHelperBaseDamage = state.helperBaseDamage * state.achievementHelperDamageMultiplier;
    // state.playerDPS = state.helperLevel * effectiveHelperBaseDamage;

    // Current implementation (achievement modifies base damage directly):
    state.playerDPS = state.helperLevel * state.helperBaseDamage;
}

// -----------------------------------------------------
// --- GAME LOGIC FUNCTIONS ---
// -----------------------------------------------------

function spawnEnemy() {
    state.enemyLevel++;
    state.isBoss = (state.enemyLevel > 0 && state.enemyLevel % state.bossLevelInterval === 0);

    const levelPower = Math.pow(state.enemyHPScale, state.enemyLevel - 1);
    state.enemyMaxHP = Math.floor(state.enemyHPBase * levelPower);
    state.enemyGoldReward = Math.floor((state.enemyGoldBase + (state.enemyLevel * 0.2)) * Math.pow(state.enemyGoldScale, state.enemyLevel - 1)) + 1;

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
    state.enemyCurrentHP -= amount;

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
    checkAchievements('enemyDefeated', { wasBoss: wasBoss, damage: amount });
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
        if (damagePerTick >= 0.1) {
            dealDamage(damagePerTick, false, true);
        }
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
        case 'helper':
            // Check unlock status first
            if (!state.helpersUnlocked) {
                showFeedback("❓ Unlock Helpers first via achievements!", true);
                break;
            }
            cost = state.upgradeHelperCost;
            if (state.playerGold >= cost) {
                state.playerGold -= cost;
                state.helperLevel++;
                state.upgradeHelperCost = Math.floor(cost * state.upgradeHelperCostScale + state.upgradeHelperLinearAdd);
                calculateDPS(); // Recalculate DPS after level up
                purchased = true;
                feedbackMsg = `🤝 Helpers leveled up to ${state.helperLevel}! (Total DPS: ${formatNumber(state.playerDPS)})`;
            }
            break;
    }

    if (purchased) {
        showFeedback(feedbackMsg);
        checkAchievements('upgrade', { type: type });
        updateDisplay();
    } else if (cost > 0 && state.playerGold < cost && (type === 'click' || (type === 'critChance' && state.critUnlocked) || (type === 'helper' && state.helpersUnlocked))) { // Only show 'not enough gold' if unlocked & failed due to cost
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
    // 1 star per 25 levels completed, minimum 1
    return Math.max(1, Math.floor(state.enemyLevel / 25));
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
        helperLevel: 0,
        helperBaseDamage: 1.5,
        playerDPS: 0,
        
        critUnlocked: false,
        helpersUnlocked: false,
        
        achievementClickDamageMultiplier: 1.0,
        achievementGoldMultiplier: 1.0,
        achievementCritChanceBonus: 0.00,
        
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
        baseUpgradeHelperCost: 30,
        upgradeHelperCost: 30,
        upgradeHelperCostScale: 1.28,
        upgradeHelperLinearAdd: 5,
        
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
    state.prestigeUnlocked = prestigeState.prestigeUnlocked;
    
    // Calculate new star gold multiplier
    state.starGoldMultiplier = state.stars * 0.02; // 2% per star
    
    // Restore achievements (important to keep prestige achievement)
    achievements.forEach((a, i) => {
        // Preserve prestige-related achievements only
        if (a.id === 'prestigeReady' || a.id === 'firstPrestige') {
            a.achieved = achievementStates[i];
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

// Save game to localStorage
function saveGame() {
    const saveData = {
        player: {
            gold: state.playerGold,
            clickDamage: state.playerClickDamage,
            critChance: state.critChance,
            helperLevel: state.helperLevel,
        },
        upgrades: {
            clickCost: state.upgradeClickCost,
            critCost: state.upgradeCritChanceCost,
            helperCost: state.upgradeHelperCost,
        },
        unlocks: {
            crit: state.critUnlocked,
            helpers: state.helpersUnlocked,
            prestige: state.prestigeUnlocked,
        },
        enemy: {
            level: state.enemyLevel,
        },
        achievements: achievements.map(a => a.achieved),
        stats: {
            enemiesDefeated: state.enemiesDefeated,
            totalClicks: state.totalClicks,
            totalCrits: state.totalCrits,
        },
        // Add prestige data
        prestige: {
            stars: state.stars,
            totalPrestiges: state.totalPrestiges,
        }
    };
    
    localStorage.setItem('clickerGameSave', JSON.stringify(saveData));
    console.log("Game saved.");
}

// Load game from localStorage
function loadGame() {
    const saveData = JSON.parse(localStorage.getItem('clickerGameSave'));
    if (!saveData) return false;
    
    try {
        // Load player data
        state.playerGold = saveData.player.gold || 0;
        state.playerClickDamage = saveData.player.clickDamage || 1;
        state.critChance = saveData.player.critChance || 0;
        state.helperLevel = saveData.player.helperLevel || 0;
        
        // Load upgrade costs
        state.upgradeClickCost = saveData.upgrades.clickCost || state.baseUpgradeClickCost;
        state.upgradeCritChanceCost = saveData.upgrades.critCost || state.baseUpgradeCritChanceCost;
        state.upgradeHelperCost = saveData.upgrades.helperCost || state.baseUpgradeHelperCost;
        
        // Load unlocks
        state.critUnlocked = saveData.unlocks.crit || false;
        state.helpersUnlocked = saveData.unlocks.helpers || false;
        state.prestigeUnlocked = saveData.unlocks.prestige || false;
        
        // Load enemy data
        const savedLevel = saveData.enemy.level || 0;
        state.enemyLevel = savedLevel > 0 ? savedLevel - 1 : 0; // Will be incremented in spawnEnemy
        
        // Load achievements
        if (saveData.achievements && Array.isArray(saveData.achievements)) {
            achievements.forEach((a, i) => {
                if (i < saveData.achievements.length) {
                    a.achieved = saveData.achievements[i];
                }
            });
        }
        
        // Load stats
        if (saveData.stats) {
            state.enemiesDefeated = saveData.stats.enemiesDefeated || 0;
            state.totalClicks = saveData.stats.totalClicks || 0;
            state.totalCrits = saveData.stats.totalCrits || 0;
        }
        
        // Load prestige data
        if (saveData.prestige) {
            state.stars = saveData.prestige.stars || 0;
            state.totalPrestiges = saveData.prestige.totalPrestiges || 0;
            state.starGoldMultiplier = state.stars * 0.02; // Recalculate from stars (2% per star)
        }
        
        // Recalculate dependent values
        calculateDPS();
        
        console.log("Game loaded successfully.");
        return true;
    } catch (error) {
        console.error("Error loading save:", error);
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
    if (amount < 0.1 && !isDPS) return; // Show even small DPS ticks, but not tiny click hits
    const amountStr = isCrit ? formatNumber(amount) : ( amount < 5 ? amount.toFixed(1) : formatNumber(amount) );

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
    display.upgradeHelperButton.addEventListener('click', () => buyUpgrade('helper'));
    
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
// --- GAME INITIALIZATION ---
// -----------------------------------------------------

const dpsIntervalMs = 500;
let dpsIntervalId = null;

function initGame() {
    console.log("Initializing Simple Clicker RPG v1.2 (Dark Mode & Emojis)...");
    setupEventListeners();
    
    // Try to load saved game first
    const loaded = loadGame();
    if (!loaded) {
        console.log("No save found or load failed, starting fresh game.");
    }
    
    calculateDPS();
    spawnEnemy();
    updateDisplay();
    updatePrestigeUI();
    
    if (dpsIntervalId) clearInterval(dpsIntervalId);
    dpsIntervalId = setInterval(applyDPS, dpsIntervalMs);
    showFeedback("✨ Game Started! Click the enemy or press Space! ✨");
    checkAchievements('init');
    console.log("Game Initialized.");
    
    // Set up auto-save
    setInterval(saveGame, 30000); // Auto-save every 30 seconds
}

// Start the game when the page is loaded
document.addEventListener('DOMContentLoaded', initGame);