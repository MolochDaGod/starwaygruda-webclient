import { gameState } from './GameStateManager.js';

/**
 * SWG-Style Profession System
 * Implements the original Star Wars Galaxies profession tree mechanics
 * Each profession has 4 branches with 4 skill boxes each (Novice -> Master)
 */

// ==================== PROFESSION DEFINITIONS ====================

export const PROFESSIONS = {
    // ========== COMBAT PROFESSIONS ==========
    marksman: {
        id: 'marksman',
        name: 'Marksman',
        description: 'Ranged combat specialist',
        type: 'combat',
        xpType: 'combat',
        noviceCost: 15,
        branches: {
            rifles: {
                name: 'Rifle Specialization',
                skills: [
                    { id: 'rifle_1', name: 'Rifle Training I', cost: 2, xpRequired: 1000, abilities: ['aimShot'], stats: { rifleAccuracy: 5 } },
                    { id: 'rifle_2', name: 'Rifle Training II', cost: 3, xpRequired: 2000, abilities: ['headShot'], stats: { rifleAccuracy: 10, rifleDamage: 5 } },
                    { id: 'rifle_3', name: 'Rifle Training III', cost: 4, xpRequired: 4000, abilities: ['crippleShot'], stats: { rifleAccuracy: 15, rifleDamage: 10 } },
                    { id: 'rifle_4', name: 'Rifle Training IV', cost: 5, xpRequired: 8000, abilities: ['lethalShot'], stats: { rifleAccuracy: 20, rifleDamage: 15 } }
                ]
            },
            pistols: {
                name: 'Pistol Specialization',
                skills: [
                    { id: 'pistol_1', name: 'Pistol Training I', cost: 2, xpRequired: 1000, abilities: ['quickDraw'], stats: { pistolAccuracy: 5 } },
                    { id: 'pistol_2', name: 'Pistol Training II', cost: 3, xpRequired: 2000, abilities: ['fanTheHammer'], stats: { pistolAccuracy: 10, pistolSpeed: 5 } },
                    { id: 'pistol_3', name: 'Pistol Training III', cost: 4, xpRequired: 4000, abilities: ['dualWield'], stats: { pistolAccuracy: 15, pistolSpeed: 10 } },
                    { id: 'pistol_4', name: 'Pistol Training IV', cost: 5, xpRequired: 8000, abilities: ['stopShot'], stats: { pistolAccuracy: 20, pistolSpeed: 15 } }
                ]
            },
            carbines: {
                name: 'Carbine Specialization',
                skills: [
                    { id: 'carbine_1', name: 'Carbine Training I', cost: 2, xpRequired: 1000, abilities: ['burstFire'], stats: { carbineAccuracy: 5 } },
                    { id: 'carbine_2', name: 'Carbine Training II', cost: 3, xpRequired: 2000, abilities: ['suppFire'], stats: { carbineAccuracy: 10, carbineDamage: 5 } },
                    { id: 'carbine_3', name: 'Carbine Training III', cost: 4, xpRequired: 4000, abilities: ['strafeShot'], stats: { carbineAccuracy: 15, carbineDamage: 10 } },
                    { id: 'carbine_4', name: 'Carbine Training IV', cost: 5, xpRequired: 8000, abilities: ['overCharge'], stats: { carbineAccuracy: 20, carbineDamage: 15 } }
                ]
            },
            support: {
                name: 'Ranged Support',
                skills: [
                    { id: 'range_support_1', name: 'Ranged Support I', cost: 2, xpRequired: 1000, abilities: ['coverFire'], stats: { rangedDefense: 5 } },
                    { id: 'range_support_2', name: 'Ranged Support II', cost: 3, xpRequired: 2000, abilities: ['pointMan'], stats: { rangedDefense: 10, groupBonus: 2 } },
                    { id: 'range_support_3', name: 'Ranged Support III', cost: 4, xpRequired: 4000, abilities: ['rallyCry'], stats: { rangedDefense: 15, groupBonus: 4 } },
                    { id: 'range_support_4', name: 'Ranged Support IV', cost: 5, xpRequired: 8000, abilities: ['volley'], stats: { rangedDefense: 20, groupBonus: 6 } }
                ]
            }
        },
        masterRequirements: ['rifle_4', 'pistol_4', 'carbine_4', 'range_support_4'],
        masterAbilities: ['deadEye', 'snipe'],
        masterStats: { allRangedDamage: 25, criticalHit: 10 }
    },
    
    brawler: {
        id: 'brawler',
        name: 'Brawler',
        description: 'Unarmed and melee combat specialist',
        type: 'combat',
        xpType: 'combat',
        noviceCost: 15,
        branches: {
            unarmed: {
                name: 'Unarmed Combat',
                skills: [
                    { id: 'unarmed_1', name: 'Unarmed I', cost: 2, xpRequired: 1000, abilities: ['jab'], stats: { unarmedDamage: 5 } },
                    { id: 'unarmed_2', name: 'Unarmed II', cost: 3, xpRequired: 2000, abilities: ['bodyBlow'], stats: { unarmedDamage: 10, unarmedSpeed: 5 } },
                    { id: 'unarmed_3', name: 'Unarmed III', cost: 4, xpRequired: 4000, abilities: ['knockdown'], stats: { unarmedDamage: 15, unarmedSpeed: 10 } },
                    { id: 'unarmed_4', name: 'Unarmed IV', cost: 5, xpRequired: 8000, abilities: ['warcry'], stats: { unarmedDamage: 20, unarmedSpeed: 15 } }
                ]
            },
            oneHand: {
                name: 'One-Handed Weapons',
                skills: [
                    { id: 'onehand_1', name: 'One-Hand I', cost: 2, xpRequired: 1000, abilities: ['slash'], stats: { oneHandDamage: 5 } },
                    { id: 'onehand_2', name: 'One-Hand II', cost: 3, xpRequired: 2000, abilities: ['flurry'], stats: { oneHandDamage: 10, oneHandSpeed: 5 } },
                    { id: 'onehand_3', name: 'One-Hand III', cost: 4, xpRequired: 4000, abilities: ['riposte'], stats: { oneHandDamage: 15, oneHandSpeed: 10 } },
                    { id: 'onehand_4', name: 'One-Hand IV', cost: 5, xpRequired: 8000, abilities: ['dizzy'], stats: { oneHandDamage: 20, oneHandSpeed: 15 } }
                ]
            },
            twoHand: {
                name: 'Two-Handed Weapons',
                skills: [
                    { id: 'twohand_1', name: 'Two-Hand I', cost: 2, xpRequired: 1000, abilities: ['heavySlash'], stats: { twoHandDamage: 8 } },
                    { id: 'twohand_2', name: 'Two-Hand II', cost: 3, xpRequired: 2000, abilities: ['cleave'], stats: { twoHandDamage: 16, twoHandKnockback: 5 } },
                    { id: 'twohand_3', name: 'Two-Hand III', cost: 4, xpRequired: 4000, abilities: ['sweep'], stats: { twoHandDamage: 24, twoHandKnockback: 10 } },
                    { id: 'twohand_4', name: 'Two-Hand IV', cost: 5, xpRequired: 8000, abilities: ['devastate'], stats: { twoHandDamage: 32, twoHandKnockback: 15 } }
                ]
            },
            polearm: {
                name: 'Polearm Weapons',
                skills: [
                    { id: 'polearm_1', name: 'Polearm I', cost: 2, xpRequired: 1000, abilities: ['thrust'], stats: { polearmDamage: 6, polearmRange: 1 } },
                    { id: 'polearm_2', name: 'Polearm II', cost: 3, xpRequired: 2000, abilities: ['legSweep'], stats: { polearmDamage: 12, polearmRange: 2 } },
                    { id: 'polearm_3', name: 'Polearm III', cost: 4, xpRequired: 4000, abilities: ['spinAttack'], stats: { polearmDamage: 18, polearmRange: 3 } },
                    { id: 'polearm_4', name: 'Polearm IV', cost: 5, xpRequired: 8000, abilities: ['impale'], stats: { polearmDamage: 24, polearmRange: 4 } }
                ]
            }
        },
        masterRequirements: ['unarmed_4', 'onehand_4', 'twohand_4', 'polearm_4'],
        masterAbilities: ['berserk', 'intimidate'],
        masterStats: { allMeleeDamage: 25, meleeDefense: 15 }
    },
    
    // ========== SUPPORT PROFESSIONS ==========
    medic: {
        id: 'medic',
        name: 'Medic',
        description: 'Healing and medical specialist',
        type: 'support',
        xpType: 'medical',
        noviceCost: 15,
        branches: {
            healing: {
                name: 'Healing',
                skills: [
                    { id: 'heal_1', name: 'Healing I', cost: 2, xpRequired: 1000, abilities: ['healWound'], stats: { healingPower: 10 } },
                    { id: 'heal_2', name: 'Healing II', cost: 3, xpRequired: 2000, abilities: ['healDamage'], stats: { healingPower: 20 } },
                    { id: 'heal_3', name: 'Healing III', cost: 4, xpRequired: 4000, abilities: ['healEnhanced'], stats: { healingPower: 35 } },
                    { id: 'heal_4', name: 'Healing IV', cost: 5, xpRequired: 8000, abilities: ['healCritical'], stats: { healingPower: 50 } }
                ]
            },
            organic: {
                name: 'Organic Chemistry',
                skills: [
                    { id: 'organic_1', name: 'Organic I', cost: 2, xpRequired: 1000, abilities: ['stimpackA'], stats: { stimQuality: 5 } },
                    { id: 'organic_2', name: 'Organic II', cost: 3, xpRequired: 2000, abilities: ['stimpackB'], stats: { stimQuality: 10 } },
                    { id: 'organic_3', name: 'Organic III', cost: 4, xpRequired: 4000, abilities: ['stimpackC'], stats: { stimQuality: 15 } },
                    { id: 'organic_4', name: 'Organic IV', cost: 5, xpRequired: 8000, abilities: ['stimpackD'], stats: { stimQuality: 20 } }
                ]
            },
            pharmacology: {
                name: 'Pharmacology',
                skills: [
                    { id: 'pharm_1', name: 'Pharmacology I', cost: 2, xpRequired: 1000, abilities: ['antidote'], stats: { medicineEfficiency: 10 } },
                    { id: 'pharm_2', name: 'Pharmacology II', cost: 3, xpRequired: 2000, abilities: ['cureDisease'], stats: { medicineEfficiency: 20 } },
                    { id: 'pharm_3', name: 'Pharmacology III', cost: 4, xpRequired: 4000, abilities: ['curePoison'], stats: { medicineEfficiency: 35 } },
                    { id: 'pharm_4', name: 'Pharmacology IV', cost: 5, xpRequired: 8000, abilities: ['resuscitate'], stats: { medicineEfficiency: 50 } }
                ]
            },
            support: {
                name: 'Medical Support',
                skills: [
                    { id: 'medsupport_1', name: 'Med Support I', cost: 2, xpRequired: 1000, abilities: ['diagnose'], stats: { healRange: 5 } },
                    { id: 'medsupport_2', name: 'Med Support II', cost: 3, xpRequired: 2000, abilities: ['triage'], stats: { healRange: 10 } },
                    { id: 'medsupport_3', name: 'Med Support III', cost: 4, xpRequired: 4000, abilities: ['areaHeal'], stats: { healRange: 15 } },
                    { id: 'medsupport_4', name: 'Med Support IV', cost: 5, xpRequired: 8000, abilities: ['revive'], stats: { healRange: 20 } }
                ]
            }
        },
        masterRequirements: ['heal_4', 'organic_4', 'pharm_4', 'medsupport_4'],
        masterAbilities: ['fullHeal', 'groupHeal'],
        masterStats: { healingPower: 100, medicineEfficiency: 25 }
    },
    
    // ========== CRAFTING PROFESSIONS ==========
    artisan: {
        id: 'artisan',
        name: 'Artisan',
        description: 'Basic crafting and resource gathering',
        type: 'crafting',
        xpType: 'crafting',
        noviceCost: 15,
        branches: {
            engineering: {
                name: 'Engineering',
                skills: [
                    { id: 'eng_1', name: 'Engineering I', cost: 2, xpRequired: 500, abilities: [], stats: { craftingQuality: 5 } },
                    { id: 'eng_2', name: 'Engineering II', cost: 3, xpRequired: 1000, abilities: [], stats: { craftingQuality: 10 } },
                    { id: 'eng_3', name: 'Engineering III', cost: 4, xpRequired: 2000, abilities: [], stats: { craftingQuality: 15 } },
                    { id: 'eng_4', name: 'Engineering IV', cost: 5, xpRequired: 4000, abilities: [], stats: { craftingQuality: 20 } }
                ]
            },
            survey: {
                name: 'Surveying',
                skills: [
                    { id: 'survey_1', name: 'Survey I', cost: 2, xpRequired: 500, abilities: ['survey'], stats: { surveyRange: 32 } },
                    { id: 'survey_2', name: 'Survey II', cost: 3, xpRequired: 1000, abilities: ['deepSurvey'], stats: { surveyRange: 64 } },
                    { id: 'survey_3', name: 'Survey III', cost: 4, xpRequired: 2000, abilities: ['mineralSurvey'], stats: { surveyRange: 128 } },
                    { id: 'survey_4', name: 'Survey IV', cost: 5, xpRequired: 4000, abilities: ['advancedSurvey'], stats: { surveyRange: 256 } }
                ]
            },
            domestic: {
                name: 'Domestic Arts',
                skills: [
                    { id: 'domestic_1', name: 'Domestic I', cost: 2, xpRequired: 500, abilities: ['cook'], stats: { foodQuality: 5 } },
                    { id: 'domestic_2', name: 'Domestic II', cost: 3, xpRequired: 1000, abilities: ['advCook'], stats: { foodQuality: 10 } },
                    { id: 'domestic_3', name: 'Domestic III', cost: 4, xpRequired: 2000, abilities: ['gourmet'], stats: { foodQuality: 15 } },
                    { id: 'domestic_4', name: 'Domestic IV', cost: 5, xpRequired: 4000, abilities: ['masterChef'], stats: { foodQuality: 20 } }
                ]
            },
            business: {
                name: 'Business',
                skills: [
                    { id: 'biz_1', name: 'Business I', cost: 2, xpRequired: 500, abilities: ['vendorAccess'], stats: { vendorSlots: 1 } },
                    { id: 'biz_2', name: 'Business II', cost: 3, xpRequired: 1000, abilities: ['factoryAccess'], stats: { vendorSlots: 2 } },
                    { id: 'biz_3', name: 'Business III', cost: 4, xpRequired: 2000, abilities: ['marketAccess'], stats: { vendorSlots: 3 } },
                    { id: 'biz_4', name: 'Business IV', cost: 5, xpRequired: 4000, abilities: ['merchantGuild'], stats: { vendorSlots: 4 } }
                ]
            }
        },
        masterRequirements: ['eng_4', 'survey_4', 'domestic_4', 'biz_4'],
        masterAbilities: ['experimentBonus', 'resourceBonus'],
        masterStats: { craftingQuality: 50, experimentChance: 10 }
    },
    
    // ========== SCOUTING PROFESSIONS ==========
    scout: {
        id: 'scout',
        name: 'Scout',
        description: 'Wilderness survival and tracking',
        type: 'scouting',
        xpType: 'scouting',
        noviceCost: 15,
        branches: {
            exploration: {
                name: 'Exploration',
                skills: [
                    { id: 'explore_1', name: 'Exploration I', cost: 2, xpRequired: 1000, abilities: ['camp'], stats: { terrainSpeed: 5 } },
                    { id: 'explore_2', name: 'Exploration II', cost: 3, xpRequired: 2000, abilities: ['advCamp'], stats: { terrainSpeed: 10 } },
                    { id: 'explore_3', name: 'Exploration III', cost: 4, xpRequired: 4000, abilities: ['shutle'], stats: { terrainSpeed: 15 } },
                    { id: 'explore_4', name: 'Exploration IV', cost: 5, xpRequired: 8000, abilities: ['warpPoint'], stats: { terrainSpeed: 20 } }
                ]
            },
            hunting: {
                name: 'Hunting',
                skills: [
                    { id: 'hunt_1', name: 'Hunting I', cost: 2, xpRequired: 1000, abilities: ['track'], stats: { trackingRange: 32 } },
                    { id: 'hunt_2', name: 'Hunting II', cost: 3, xpRequired: 2000, abilities: ['mask'], stats: { trackingRange: 64, stealth: 5 } },
                    { id: 'hunt_3', name: 'Hunting III', cost: 4, xpRequired: 4000, abilities: ['trap'], stats: { trackingRange: 128, stealth: 10 } },
                    { id: 'hunt_4', name: 'Hunting IV', cost: 5, xpRequired: 8000, abilities: ['conceal'], stats: { trackingRange: 256, stealth: 15 } }
                ]
            },
            survival: {
                name: 'Survival',
                skills: [
                    { id: 'surv_1', name: 'Survival I', cost: 2, xpRequired: 1000, abilities: ['forage'], stats: { harvestBonus: 5 } },
                    { id: 'surv_2', name: 'Survival II', cost: 3, xpRequired: 2000, abilities: ['skinning'], stats: { harvestBonus: 10, hideQuality: 5 } },
                    { id: 'surv_3', name: 'Survival III', cost: 4, xpRequired: 4000, abilities: ['boneColl'], stats: { harvestBonus: 15, hideQuality: 10 } },
                    { id: 'surv_4', name: 'Survival IV', cost: 5, xpRequired: 8000, abilities: ['meatColl'], stats: { harvestBonus: 20, hideQuality: 15 } }
                ]
            },
            trapping: {
                name: 'Trapping',
                skills: [
                    { id: 'trap_1', name: 'Trapping I', cost: 2, xpRequired: 1000, abilities: ['basicTrap'], stats: { trapDamage: 10 } },
                    { id: 'trap_2', name: 'Trapping II', cost: 3, xpRequired: 2000, abilities: ['snareTrap'], stats: { trapDamage: 20, trapSlow: 10 } },
                    { id: 'trap_3', name: 'Trapping III', cost: 4, xpRequired: 4000, abilities: ['poisonTrap'], stats: { trapDamage: 30, trapSlow: 20 } },
                    { id: 'trap_4', name: 'Trapping IV', cost: 5, xpRequired: 8000, abilities: ['explosiveTrap'], stats: { trapDamage: 50, trapSlow: 30 } }
                ]
            }
        },
        masterRequirements: ['explore_4', 'hunt_4', 'surv_4', 'trap_4'],
        masterAbilities: ['trackCreature', 'scoutAhead'],
        masterStats: { terrainSpeed: 25, harvestBonus: 50, stealth: 25 }
    }
};

// ==================== ABILITIES DATABASE ====================

export const ABILITIES = {
    // Marksman abilities
    aimShot: { id: 'aimShot', name: 'Aim Shot', type: 'attack', damage: 50, cost: 20, cooldown: 3, range: 35 },
    headShot: { id: 'headShot', name: 'Head Shot', type: 'attack', damage: 100, cost: 40, cooldown: 8, range: 40 },
    crippleShot: { id: 'crippleShot', name: 'Crippling Shot', type: 'debuff', damage: 30, effect: 'slow', cost: 30, cooldown: 10, range: 30 },
    lethalShot: { id: 'lethalShot', name: 'Lethal Shot', type: 'attack', damage: 150, cost: 60, cooldown: 15, range: 45 },
    
    // Brawler abilities
    jab: { id: 'jab', name: 'Jab', type: 'attack', damage: 20, cost: 10, cooldown: 1, range: 5 },
    bodyBlow: { id: 'bodyBlow', name: 'Body Blow', type: 'attack', damage: 40, cost: 20, cooldown: 3, range: 5 },
    knockdown: { id: 'knockdown', name: 'Knockdown', type: 'attack', damage: 60, effect: 'knockdown', cost: 35, cooldown: 10, range: 5 },
    
    // Medic abilities
    healWound: { id: 'healWound', name: 'Heal Wound', type: 'heal', healing: 100, cost: 30, cooldown: 5, range: 20 },
    healDamage: { id: 'healDamage', name: 'Heal Damage', type: 'heal', healing: 200, cost: 50, cooldown: 8, range: 20 },
    revive: { id: 'revive', name: 'Revive', type: 'resurrect', healing: 500, cost: 100, cooldown: 60, range: 10 },
    
    // Scout abilities
    camp: { id: 'camp', name: 'Set Camp', type: 'utility', effect: 'restPoint', cooldown: 60 },
    track: { id: 'track', name: 'Track', type: 'utility', effect: 'tracking', cooldown: 10, range: 64 },
    forage: { id: 'forage', name: 'Forage', type: 'harvest', cooldown: 5 },
    skinning: { id: 'skinning', name: 'Skinning', type: 'harvest', cooldown: 5 },
    
    // Artisan abilities
    survey: { id: 'survey', name: 'Survey', type: 'utility', effect: 'resourceDetect', cooldown: 5, range: 64 }
};

// ==================== PROFESSION SYSTEM CLASS ====================

export class ProfessionSystem {
    constructor() {
        this.professions = PROFESSIONS;
        this.abilities = ABILITIES;
        
        // Subscribe to state changes
        gameState.on('skillLearned', this.onSkillLearned.bind(this));
        
        console.log('📚 ProfessionSystem initialized with SWG skill trees');
    }
    
    /**
     * Get profession data
     */
    getProfession(professionId) {
        return this.professions[professionId];
    }
    
    /**
     * Get all professions
     */
    getAllProfessions() {
        return Object.values(this.professions);
    }
    
    /**
     * Get professions by type
     */
    getProfessionsByType(type) {
        return Object.values(this.professions).filter(p => p.type === type);
    }
    
    /**
     * Check if player can learn novice of a profession
     */
    canLearnNovice(professionId) {
        const profession = this.professions[professionId];
        if (!profession) return { canLearn: false, reason: 'Unknown profession' };
        
        const state = gameState.getState();
        
        // Check skill points
        if (state.skillPoints.available < profession.noviceCost) {
            return { canLearn: false, reason: `Need ${profession.noviceCost} skill points` };
        }
        
        // Check if already learned
        if (state.professions[professionId]) {
            return { canLearn: false, reason: 'Already learned' };
        }
        
        return { canLearn: true };
    }
    
    /**
     * Learn novice of a profession
     */
    learnNovice(professionId) {
        const canLearn = this.canLearnNovice(professionId);
        if (!canLearn.canLearn) {
            console.warn(`Cannot learn ${professionId}: ${canLearn.reason}`);
            return false;
        }
        
        const profession = this.professions[professionId];
        
        return gameState.learnSkill(professionId, 'novice', profession.noviceCost);
    }
    
    /**
     * Check if player can learn a skill box
     */
    canLearnSkill(professionId, branchId, skillIndex) {
        const profession = this.professions[professionId];
        if (!profession) return { canLearn: false, reason: 'Unknown profession' };
        
        const branch = profession.branches[branchId];
        if (!branch) return { canLearn: false, reason: 'Unknown branch' };
        
        const skill = branch.skills[skillIndex];
        if (!skill) return { canLearn: false, reason: 'Unknown skill' };
        
        const state = gameState.getState();
        const playerProf = state.professions[professionId];
        
        // Check if has novice
        if (!playerProf || !playerProf.skills.includes('novice')) {
            return { canLearn: false, reason: 'Need novice first' };
        }
        
        // Check prerequisites (previous skill in branch)
        if (skillIndex > 0) {
            const prevSkill = branch.skills[skillIndex - 1];
            if (!playerProf.skills.includes(prevSkill.id)) {
                return { canLearn: false, reason: `Need ${prevSkill.name} first` };
            }
        }
        
        // Check if already learned
        if (playerProf.skills.includes(skill.id)) {
            return { canLearn: false, reason: 'Already learned' };
        }
        
        // Check skill points
        if (state.skillPoints.available < skill.cost) {
            return { canLearn: false, reason: `Need ${skill.cost} skill points` };
        }
        
        // Check XP requirement
        const xpPool = state.experience[profession.xpType];
        if (!xpPool || xpPool.current < skill.xpRequired) {
            return { canLearn: false, reason: `Need ${skill.xpRequired} ${profession.xpType} XP` };
        }
        
        return { canLearn: true, skill };
    }
    
    /**
     * Learn a skill box
     */
    learnSkill(professionId, branchId, skillIndex) {
        const canLearn = this.canLearnSkill(professionId, branchId, skillIndex);
        if (!canLearn.canLearn) {
            console.warn(`Cannot learn skill: ${canLearn.reason}`);
            return false;
        }
        
        const skill = canLearn.skill;
        
        // Learn the skill
        const learned = gameState.learnSkill(professionId, skill.id, skill.cost);
        
        if (learned) {
            // Grant abilities
            skill.abilities.forEach(abilityId => {
                const ability = this.abilities[abilityId];
                if (ability) {
                    gameState.addAbility(ability);
                }
            });
            
            // Apply stats (would need stat system integration)
            console.log(`Learned ${skill.name}! Stats:`, skill.stats);
        }
        
        return learned;
    }
    
    /**
     * Check if player has mastered a profession
     */
    hasMastered(professionId) {
        const profession = this.professions[professionId];
        if (!profession) return false;
        
        const state = gameState.getState();
        const playerProf = state.professions[professionId];
        if (!playerProf) return false;
        
        return profession.masterRequirements.every(req => 
            playerProf.skills.includes(req)
        );
    }
    
    /**
     * Get player's progress in a profession
     */
    getProfessionProgress(professionId) {
        const profession = this.professions[professionId];
        if (!profession) return null;
        
        const state = gameState.getState();
        const playerProf = state.professions[professionId];
        
        if (!playerProf) {
            return { learned: false, novice: false, progress: 0, branches: {} };
        }
        
        const branches = {};
        let totalSkills = 0;
        let learnedSkills = 0;
        
        Object.entries(profession.branches).forEach(([branchId, branch]) => {
            const branchProgress = branch.skills.map((skill, index) => ({
                ...skill,
                learned: playerProf.skills.includes(skill.id),
                canLearn: this.canLearnSkill(professionId, branchId, index).canLearn
            }));
            
            branches[branchId] = {
                name: branch.name,
                skills: branchProgress
            };
            
            totalSkills += branch.skills.length;
            learnedSkills += branchProgress.filter(s => s.learned).length;
        });
        
        return {
            learned: true,
            novice: playerProf.skills.includes('novice'),
            progress: learnedSkills / totalSkills,
            mastered: this.hasMastered(professionId),
            branches
        };
    }
    
    /**
     * Handle skill learned event
     */
    onSkillLearned(data) {
        console.log(`📚 Skill learned: ${data.skillBoxId} in ${data.professionId}`);
        
        // Check for mastery
        if (this.hasMastered(data.professionId)) {
            const profession = this.professions[data.professionId];
            console.log(`🎓 MASTERED ${profession.name}!`);
            
            // Grant master abilities
            profession.masterAbilities.forEach(abilityId => {
                const ability = this.abilities[abilityId];
                if (ability) {
                    gameState.addAbility(ability);
                }
            });
            
            gameState.emit('professionMastered', { professionId: data.professionId });
        }
    }
    
    /**
     * Get ability data
     */
    getAbility(abilityId) {
        return this.abilities[abilityId];
    }
    
    /**
     * Get all player abilities
     */
    getPlayerAbilities() {
        return gameState.getState().abilities;
    }
    
    /**
     * Award XP to a specific pool
     */
    awardXP(type, amount) {
        gameState.addExperience(type, amount);
        console.log(`+${amount} ${type} XP`);
        
        // Emit for UI
        gameState.emit('xpGained', { type, amount });
    }
}

// Singleton
export const professionSystem = new ProfessionSystem();
export default professionSystem;
