/**
 * GrudgeCharacterCreation
 * 
 * Full 5-step character creation wizard ported from
 * Warlord-Crafting-Suite (warlord-crafting-suite.vercel.app/character)
 * 
 * Steps: Race → Class → Name → Avatar → Summary
 * Features: Faction-grouped race selection, class cards, AI avatar gen,
 *           canvas radar chart, stat summary, animated transitions
 */

import { RACES, CLASSES, FACTION_COLORS, ATTRIBUTES, calculateStartingAttributes, getRaceById, getClassById } from '../data/grudgeGameData.js';

export class GrudgeCharacterCreation {
    constructor(options = {}) {
        this.onComplete = options.onComplete || null;
        this.onCancel = options.onCancel || null;

        this.step = 'race'; // race | class | name | avatar | summary
        this.selectedRaceId = null;
        this.selectedClassId = null;
        this.characterName = '';
        this.avatarUrl = null;
        this.isGeneratingAvatar = false;
        this.isCreating = false;

        this.container = null;
        this._escHandler = null;

        this._injectStyles();
        this._createContainer();
    }

    // ─── STYLES ──────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('grudge-cc-styles')) return;
        const style = document.createElement('style');
        style.id = 'grudge-cc-styles';
        style.textContent = `
            .gcc-root {
                position: fixed; inset: 0; z-index: 5000;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
                color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex; flex-direction: column;
                overflow-y: auto;
            }
            .gcc-root * { box-sizing: border-box; }

            /* Header */
            .gcc-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
                flex-shrink: 0;
            }
            .gcc-header-left { display: flex; align-items: center; gap: 16px; }
            .gcc-header h1 { font-size: 24px; color: #fbbf24; margin: 0; letter-spacing: 2px; }
            .gcc-header p { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }

            /* Step indicator */
            .gcc-steps { display: flex; gap: 12px; align-items: center; }
            .gcc-step-dot {
                width: 32px; height: 32px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; font-size: 13px;
                font-weight: 700; border: 2px solid rgba(255,255,255,0.2);
                color: rgba(255,255,255,0.4); transition: all 0.3s;
            }
            .gcc-step-dot.active { border-color: #f59e0b; background: #f59e0b; color: #000; }
            .gcc-step-dot.done { border-color: rgba(245,158,11,0.5); background: rgba(245,158,11,0.2); color: #f59e0b; }
            .gcc-step-line { width: 24px; height: 1px; background: rgba(255,255,255,0.1); }
            .gcc-step-label { display: none; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.4); }
            .gcc-step-dot.active + .gcc-step-label { display: inline; color: #f59e0b; }

            /* Main content area */
            .gcc-main {
                flex: 1; padding: 24px 32px; display: flex; flex-direction: column;
                align-items: center; max-width: 1200px; width: 100%; margin: 0 auto;
            }
            .gcc-main h2 { font-size: 28px; color: #fbbf24; margin: 0 0 8px; text-align: center; }
            .gcc-main .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; text-align: center; }

            /* Faction rows */
            .gcc-faction-row {
                display: grid; grid-template-columns: 180px 1fr 1fr; gap: 16px;
                padding: 16px; border-radius: 12px; border: 2px solid transparent;
                background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
                margin-bottom: 16px; width: 100%; transition: all 0.3s;
            }
            .gcc-faction-row.selected { box-shadow: 0 0 30px var(--faction-glow); }
            .gcc-faction-info { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8px; }
            .gcc-faction-icon { font-size: 48px; margin-bottom: 8px; }
            .gcc-faction-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
            .gcc-faction-desc { font-size: 10px; color: #94a3b8; line-height: 1.4; }

            /* Race card */
            .gcc-race-card {
                position: relative; cursor: pointer; border: 2px solid rgba(255,255,255,0.1);
                border-radius: 12px; overflow: hidden; background: rgba(30,30,50,0.6);
                transition: all 0.3s; aspect-ratio: 4/5;
            }
            .gcc-race-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.3); }
            .gcc-race-card.selected { border-color: #fbbf24; box-shadow: 0 0 20px rgba(251,191,36,0.4); transform: translateY(-4px); }
            .gcc-race-card .race-img {
                width: 100%; height: 100%; object-fit: cover;
                transition: transform 0.5s;
            }
            .gcc-race-card:hover .race-img { transform: scale(1.05); }
            .gcc-race-card .race-overlay {
                position: absolute; inset: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, transparent 70%);
            }
            .gcc-race-card .race-content {
                position: absolute; bottom: 0; left: 0; right: 0; padding: 16px;
            }
            .gcc-race-card .race-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
            .gcc-race-card .race-desc { font-size: 11px; color: #cbd5e1; line-height: 1.3; margin-bottom: 6px; }
            .gcc-race-bonuses { display: flex; flex-wrap: wrap; gap: 4px; }
            .gcc-race-bonus {
                background: rgba(255,255,255,0.1); border-radius: 4px;
                padding: 2px 6px; font-size: 10px;
            }
            .gcc-race-bonus .val { color: #fbbf24; font-weight: 700; }
            .gcc-race-traits { margin-top: 6px; }
            .gcc-race-trait { font-size: 10px; color: #34d399; display: flex; align-items: center; gap: 4px; }
            .gcc-selected-badge {
                position: absolute; top: 12px; right: 12px; width: 28px; height: 28px;
                border-radius: 50%; background: #f59e0b; display: flex;
                align-items: center; justify-content: center; font-size: 14px; color: #000;
            }

            /* Class cards */
            .gcc-class-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; max-width: 900px; }
            .gcc-class-card {
                position: relative; cursor: pointer; border: 4px solid transparent;
                border-radius: 12px; overflow: hidden; background: rgba(30,30,50,0.5);
                height: 180px; transition: all 0.3s;
            }
            .gcc-class-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); }
            .gcc-class-card.selected { border-color: #f59e0b; box-shadow: 0 0 30px rgba(245,158,11,0.5); transform: scale(1.03); }
            .gcc-class-card .class-bg {
                position: absolute; inset: 0;
                background: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
            }
            .gcc-class-card .class-content {
                position: absolute; inset: 0; padding: 20px; display: flex;
                flex-direction: column; justify-content: center;
            }
            .gcc-class-archetype { font-size: 10px; color: #fbbf24; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
            .gcc-class-name { font-size: 32px; font-weight: 700; margin-bottom: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
            .gcc-class-desc { font-size: 13px; color: #d1d5db; max-width: 300px; }
            .gcc-class-selected-pill {
                display: inline-flex; align-items: center; gap: 6px;
                background: #f59e0b; color: #000; padding: 6px 16px;
                border-radius: 999px; font-size: 12px; font-weight: 700; margin-top: 12px;
                width: fit-content;
            }

            /* Name input */
            .gcc-name-panel {
                background: rgba(30,30,50,0.5); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px; padding: 32px; width: 100%; max-width: 500px;
            }
            .gcc-name-panel label { display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 8px; }
            .gcc-name-panel input {
                width: 100%; padding: 12px 16px; font-size: 16px;
                background: rgba(30,41,59,1); border: 1px solid #475569;
                border-radius: 8px; color: #fff; outline: none; transition: all 0.2s;
            }
            .gcc-name-panel input:focus { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.3); }
            .gcc-name-panel .char-count { font-size: 11px; color: #64748b; margin-top: 6px; }

            /* Avatar step */
            .gcc-avatar-panel {
                background: rgba(30,30,50,0.5); border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px; padding: 32px; width: 100%; max-width: 500px;
                text-align: center;
            }
            .gcc-avatar-preview {
                width: 200px; height: 200px; border-radius: 12px; margin: 0 auto 20px;
                background: rgba(30,41,59,1); display: flex; align-items: center;
                justify-content: center; font-size: 64px; color: #475569;
                overflow: hidden; border: 4px solid #f59e0b;
            }
            .gcc-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }

            /* Summary */
            .gcc-summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; width: 100%; max-width: 1000px; }
            .gcc-summary-panel {
                background: rgba(30,30,50,0.6); border-radius: 12px; padding: 20px;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .gcc-summary-panel h3 { font-size: 16px; color: #fbbf24; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
            .gcc-attr-row {
                display: flex; align-items: center; justify-content: space-between;
                background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px 12px;
                margin-bottom: 6px; border: 1px solid rgba(255,255,255,0.05);
                transition: border-color 0.2s;
            }
            .gcc-attr-row:hover { border-color: rgba(245,158,11,0.3); }
            .gcc-attr-row .attr-left { display: flex; align-items: center; gap: 8px; }
            .gcc-attr-row .attr-icon { font-size: 18px; }
            .gcc-attr-row .attr-name { font-size: 13px; color: #cbd5e1; }
            .gcc-attr-row .attr-val { font-size: 18px; font-weight: 700; color: #fcd34d; }
            .gcc-radar-wrap { display: flex; flex-direction: column; align-items: center; }
            .gcc-radar-canvas { width: 220px; height: 220px; }
            .gcc-power-bar {
                background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px 16px;
                border: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px;
            }
            .gcc-power-bar .bar-track { height: 8px; background: rgba(0,0,0,0.4); border-radius: 999px; overflow: hidden; margin: 8px 0 4px; }
            .gcc-power-bar .bar-fill { height: 100%; background: linear-gradient(90deg, #d97706, #fbbf24); border-radius: 999px; transition: width 0.6s; }
            .gcc-power-label { display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
            .gcc-stat-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
            .gcc-stat-row .stat-label { color: #94a3b8; }
            .gcc-stat-row .stat-val { font-weight: 700; }

            /* Buttons */
            .gcc-btn {
                padding: 12px 32px; font-size: 15px; font-weight: 700;
                border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                display: inline-flex; align-items: center; gap: 8px;
            }
            .gcc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .gcc-btn-primary { background: #f59e0b; color: #000; }
            .gcc-btn-primary:hover:not(:disabled) { background: #fbbf24; }
            .gcc-btn-ghost { background: transparent; color: #94a3b8; }
            .gcc-btn-ghost:hover { color: #fff; }
            .gcc-btn-outline { background: transparent; color: #f59e0b; border: 2px solid #f59e0b; }
            .gcc-btn-outline:hover { background: rgba(245,158,11,0.1); }
            .gcc-btn-big { padding: 16px 48px; font-size: 17px; }

            /* Footer */
            .gcc-footer {
                padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1);
                background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
                display: flex; justify-content: space-between; align-items: center;
                flex-shrink: 0;
            }

            /* Loading overlay */
            .gcc-loading-overlay {
                position: fixed; inset: 0; z-index: 6000;
                background: rgba(0,0,0,0.9); backdrop-filter: blur(4px);
                display: flex; align-items: center; justify-content: center;
            }
            .gcc-loading-spinner {
                width: 80px; height: 80px; border: 4px solid rgba(245,158,11,0.3);
                border-top-color: #f59e0b; border-radius: 50%;
                animation: gcc-spin 1s linear infinite; margin-bottom: 20px;
            }
            @keyframes gcc-spin { to { transform: rotate(360deg); } }
            .gcc-loading-step {
                display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                border-radius: 8px; border: 2px solid transparent; margin-bottom: 8px;
                transition: all 0.3s;
            }
            .gcc-loading-step.pending { border-color: #334155; background: rgba(51,65,85,0.3); }
            .gcc-loading-step.active { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
            .gcc-loading-step.done { border-color: #22c55e; background: rgba(34,197,94,0.1); }
            .gcc-loading-step .step-icon {
                width: 32px; height: 32px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
            }

            /* Faction badge */
            .gcc-faction-pill {
                display: inline-block; padding: 4px 16px; border-radius: 999px;
                font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            }

            /* Fade animation helper */
            .gcc-fade-in { animation: gcc-fadein 0.35s ease-out; }
            @keyframes gcc-fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }

    // ─── CONTAINER ───────────────────────────────────────────────────

    _createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'gcc-root';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);

        this._escHandler = (e) => {
            if (e.key === 'Escape' && this.container.style.display !== 'none') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this._escHandler);
    }

    // ─── SHOW / HIDE ────────────────────────────────────────────────

    show() {
        this.step = 'race';
        this.selectedRaceId = null;
        this.selectedClassId = null;
        this.characterName = '';
        this.avatarUrl = null;
        this.container.style.display = 'flex';
        this._render();
    }

    hide() {
        this.container.style.display = 'none';
        if (this.onCancel) this.onCancel();
    }

    // ─── RENDER ROUTER ──────────────────────────────────────────────

    _render() {
        this.container.innerHTML = '';
        this.container.appendChild(this._renderHeader());

        const main = document.createElement('div');
        main.className = 'gcc-main gcc-fade-in';

        switch (this.step) {
            case 'race':    this._renderRaceStep(main); break;
            case 'class':   this._renderClassStep(main); break;
            case 'name':    this._renderNameStep(main); break;
            case 'avatar':  this._renderAvatarStep(main); break;
            case 'summary': this._renderSummaryStep(main); break;
        }

        this.container.appendChild(main);
        this.container.appendChild(this._renderFooter());
    }

    // ─── HEADER ─────────────────────────────────────────────────────

    _renderHeader() {
        const header = document.createElement('header');
        header.className = 'gcc-header';

        const stepOrder = ['race', 'class', 'name', 'avatar', 'summary'];
        const stepLabels = ['Race', 'Class', 'Name', 'Avatar', 'Finalize'];
        const currentIdx = stepOrder.indexOf(this.step);

        const stepsHtml = stepOrder.map((s, i) => {
            const cls = s === this.step ? 'active' : (i < currentIdx ? 'done' : '');
            return `
                <div class="gcc-step-dot ${cls}">${i + 1}</div>
                ${s === this.step ? `<span class="gcc-step-label" style="display:inline">${stepLabels[i]}</span>` : ''}
                ${i < stepOrder.length - 1 ? '<div class="gcc-step-line"></div>' : ''}
            `;
        }).join('');

        header.innerHTML = `
            <div class="gcc-header-left">
                <div>
                    <h1>CHARACTER CREATION</h1>
                    <p>Forge your legend in the world of Grudge</p>
                </div>
            </div>
            <div class="gcc-steps">${stepsHtml}</div>
        `;
        return header;
    }

    // ─── FOOTER ─────────────────────────────────────────────────────

    _renderFooter() {
        const footer = document.createElement('footer');
        footer.className = 'gcc-footer';

        const backBtn = document.createElement('button');
        backBtn.className = 'gcc-btn gcc-btn-ghost';
        backBtn.innerHTML = '◂ ' + (this.step === 'race' ? 'Cancel' : 'Back');
        backBtn.onclick = () => {
            const order = ['race', 'class', 'name', 'avatar', 'summary'];
            const idx = order.indexOf(this.step);
            if (idx <= 0) this.hide();
            else { this.step = order[idx - 1]; this._render(); }
        };

        footer.appendChild(backBtn);
        return footer;
    }

    // ─── STEP 1: RACE ───────────────────────────────────────────────

    _renderRaceStep(main) {
        main.innerHTML = '<h2>Choose Your Faction & Race</h2>';

        const factions = ['Crusade', 'Fabled', 'Legion'];
        factions.forEach(factionName => {
            const fColor = FACTION_COLORS[factionName];
            const factionRaces = RACES.filter(r => r.faction === factionName);
            const isSelected = this.selectedRaceId && factionRaces.some(r => r.id === this.selectedRaceId);

            const row = document.createElement('div');
            row.className = `gcc-faction-row ${isSelected ? 'selected' : ''}`;
            row.style.borderColor = isSelected ? fColor.border : 'transparent';
            row.style.setProperty('--faction-glow', fColor.glow);

            // Faction info column
            const info = document.createElement('div');
            info.className = 'gcc-faction-info';
            info.innerHTML = `
                <div class="gcc-faction-icon">${factionRaces[0]?.icon || '⚔️'}</div>
                <div class="gcc-faction-name" style="color: ${fColor.text}">${factionName}</div>
                <div class="gcc-faction-desc">${fColor.description}</div>
            `;
            row.appendChild(info);

            // Race cards
            factionRaces.forEach(race => {
                const card = document.createElement('div');
                card.className = `gcc-race-card ${this.selectedRaceId === race.id ? 'selected' : ''}`;
                card.onclick = () => { this.selectedRaceId = race.id; this._render(); };

                const bonusHtml = Object.entries(race.bonuses || {})
                    .filter(([, v]) => v > 0).slice(0, 4)
                    .map(([k, v]) => `<span class="gcc-race-bonus"><span class="val">+${v}</span> ${k.slice(0, 3)}</span>`)
                    .join('');

                const traitHtml = race.traits.slice(0, 2)
                    .map(t => `<div class="gcc-race-trait">✦ ${t}</div>`).join('');

                card.innerHTML = `
                    <div style="width:100%;height:100%;background:linear-gradient(135deg, ${fColor.bg} 0%, rgba(0,0,0,0.6) 100%);
                        display:flex;align-items:center;justify-content:center;font-size:72px;">${race.icon}</div>
                    <div class="race-overlay"></div>
                    ${this.selectedRaceId === race.id ? '<div class="gcc-selected-badge">▸</div>' : ''}
                    <div class="race-content">
                        <div class="race-name">${race.name}</div>
                        <div class="race-desc">${race.description}</div>
                        <div class="gcc-race-bonuses">${bonusHtml}</div>
                        <div class="gcc-race-traits">${traitHtml}</div>
                    </div>
                `;
                row.appendChild(card);
            });

            main.appendChild(row);
        });

        // Continue button
        if (this.selectedRaceId) {
            const race = getRaceById(this.selectedRaceId);
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;justify-content:center;margin-top:20px;';
            const btn = document.createElement('button');
            btn.className = 'gcc-btn gcc-btn-primary gcc-btn-big';
            btn.textContent = `Continue as ${race.name} ▸`;
            btn.onclick = () => { this.step = 'class'; this._render(); };
            wrap.appendChild(btn);
            main.appendChild(wrap);
        }
    }

    // ─── STEP 2: CLASS ──────────────────────────────────────────────

    _renderClassStep(main) {
        main.innerHTML = '<h2>Select Your Path</h2><div class="subtitle">Choose your combat specialization</div>';

        const grid = document.createElement('div');
        grid.className = 'gcc-class-grid';

        CLASSES.forEach(cls => {
            const card = document.createElement('div');
            card.className = `gcc-class-card ${this.selectedClassId === cls.id ? 'selected' : ''}`;
            card.onclick = () => { this.selectedClassId = cls.id; this._render(); };

            card.innerHTML = `
                <div style="position:absolute;inset:0;background:linear-gradient(135deg, ${cls.color}33 0%, rgba(0,0,0,0.8) 100%);
                    display:flex;align-items:center;justify-content:flex-end;padding-right:30px;font-size:64px;opacity:0.6;">${cls.icon}</div>
                <div class="class-bg"></div>
                <div class="class-content">
                    <div class="gcc-class-archetype">${cls.archetype}</div>
                    <div class="gcc-class-name">${cls.name}</div>
                    <div class="gcc-class-desc">${cls.description}</div>
                    ${this.selectedClassId === cls.id ? '<div class="gcc-class-selected-pill">▸ Selected</div>' : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        main.appendChild(grid);

        if (this.selectedClassId) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;justify-content:center;margin-top:24px;';
            const btn = document.createElement('button');
            btn.className = 'gcc-btn gcc-btn-primary gcc-btn-big';
            btn.textContent = 'Continue ▸';
            btn.onclick = () => { this.step = 'name'; this._render(); };
            wrap.appendChild(btn);
            main.appendChild(wrap);
        }
    }

    // ─── STEP 3: NAME ───────────────────────────────────────────────

    _renderNameStep(main) {
        main.innerHTML = '<h2>Name Your Warlord</h2><div class="subtitle">Choose a name worthy of legend</div>';

        const panel = document.createElement('div');
        panel.className = 'gcc-name-panel';
        panel.innerHTML = `
            <label>Character Name</label>
            <input type="text" id="gcc-name-input" placeholder="Enter character name..." maxlength="20" value="${this.characterName}" autofocus />
            <div class="char-count"><span id="gcc-name-count">${this.characterName.length}</span> / 20 characters</div>
        `;
        main.appendChild(panel);

        // Wire input
        requestAnimationFrame(() => {
            const input = document.getElementById('gcc-name-input');
            if (input) {
                input.focus();
                input.addEventListener('input', (e) => {
                    this.characterName = e.target.value;
                    const counter = document.getElementById('gcc-name-count');
                    if (counter) counter.textContent = this.characterName.length;
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && this.characterName.trim()) {
                        this.step = 'avatar'; this._render();
                    }
                });
            }
        });

        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;justify-content:center;margin-top:24px;';
        const btn = document.createElement('button');
        btn.className = 'gcc-btn gcc-btn-primary gcc-btn-big';
        btn.textContent = 'Continue ▸';
        btn.disabled = !this.characterName.trim();
        btn.onclick = () => {
            this.characterName = document.getElementById('gcc-name-input')?.value || this.characterName;
            if (this.characterName.trim()) { this.step = 'avatar'; this._render(); }
        };
        wrap.appendChild(btn);
        main.appendChild(wrap);
    }

    // ─── STEP 4: AVATAR ─────────────────────────────────────────────

    _renderAvatarStep(main) {
        const race = getRaceById(this.selectedRaceId);
        const cls = getClassById(this.selectedClassId);

        main.innerHTML = `
            <h2>Generate Your Avatar</h2>
            <div class="subtitle">Create a unique avatar for your ${race?.name || ''} ${cls?.name || ''}</div>
        `;

        const panel = document.createElement('div');
        panel.className = 'gcc-avatar-panel';

        const preview = document.createElement('div');
        preview.className = 'gcc-avatar-preview';
        if (this.avatarUrl) {
            preview.innerHTML = `<img src="${this.avatarUrl}" alt="Avatar" />`;
        } else {
            preview.textContent = race?.icon || '✦';
        }
        panel.appendChild(preview);

        if (!this.avatarUrl) {
            // Generate button
            const genBtn = document.createElement('button');
            genBtn.className = 'gcc-btn gcc-btn-primary';
            genBtn.textContent = this.isGeneratingAvatar ? '⟳ Generating...' : '✦ Generate Avatar';
            genBtn.disabled = this.isGeneratingAvatar;
            genBtn.onclick = () => this._generateAvatar();
            panel.appendChild(genBtn);
        } else {
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

            const regenBtn = document.createElement('button');
            regenBtn.className = 'gcc-btn gcc-btn-outline';
            regenBtn.textContent = 'Regenerate';
            regenBtn.onclick = () => this._generateAvatar();
            btnRow.appendChild(regenBtn);

            const contBtn = document.createElement('button');
            contBtn.className = 'gcc-btn gcc-btn-primary';
            contBtn.textContent = 'Continue ▸';
            contBtn.onclick = () => { this.step = 'summary'; this._render(); };
            btnRow.appendChild(contBtn);
            panel.appendChild(btnRow);
        }

        main.appendChild(panel);

        // Skip link
        const skip = document.createElement('button');
        skip.className = 'gcc-btn gcc-btn-ghost';
        skip.style.marginTop = '16px';
        skip.textContent = 'Skip — Use Default Avatar';
        skip.onclick = () => {
            this.avatarUrl = null; // will use race icon fallback
            this.step = 'summary';
            this._render();
        };
        main.appendChild(skip);
    }

    async _generateAvatar() {
        this.isGeneratingAvatar = true;
        this._render();

        const race = getRaceById(this.selectedRaceId);
        const cls = getClassById(this.selectedClassId);

        try {
            // Try Puter AI if available (from Warlord-Crafting-Suite)
            if (window.puter?.ai?.txt2img) {
                const prompt = `Create a cartoon-style profile avatar for a ${race.name} ${cls.name} character. Style: Vibrant colors, friendly appearance, fantasy RPG aesthetic. Frame: Circular portrait, head and shoulders. Background: Simple gradient.`;
                const imgEl = await window.puter.ai.txt2img(prompt, { model: 'gpt-image-1', quality: 'medium' });

                const canvas = document.createElement('canvas');
                canvas.width = imgEl.width;
                canvas.height = imgEl.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgEl, 0, 0);

                // Name overlay
                const oh = canvas.height * 0.25;
                const grad = ctx.createLinearGradient(0, canvas.height - oh, 0, canvas.height);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.5, 'rgba(0,0,0,0.7)');
                grad.addColorStop(1, 'rgba(0,0,0,0.9)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, canvas.height - oh, canvas.width, oh);

                const fs = Math.floor(canvas.height * 0.08);
                ctx.font = `bold ${fs}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fbbf24';
                ctx.fillText(this.characterName.slice(0, 20), canvas.width / 2, canvas.height - oh / 2 + fs * 0.2);

                this.avatarUrl = canvas.toDataURL('image/webp', 0.7);
            } else {
                // Fallback: generate a simple canvas avatar
                this.avatarUrl = this._generateFallbackAvatar(race, cls);
            }
        } catch (err) {
            console.warn('[GrudgeCC] Avatar generation failed:', err);
            this.avatarUrl = this._generateFallbackAvatar(race, cls);
        }

        this.isGeneratingAvatar = false;
        this._render();
    }

    _generateFallbackAvatar(race, cls) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const fColor = FACTION_COLORS[race.faction] || FACTION_COLORS.Crusade;

        // Background gradient
        const bg = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
        bg.addColorStop(0, fColor.primary);
        bg.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 256, 256);

        // Race icon
        ctx.font = '80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(race.icon, 128, 110);

        // Name
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(this.characterName.slice(0, 15), 128, 200);

        // Subtitle
        ctx.font = '12px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${race.name} ${cls.name}`, 128, 225);

        return canvas.toDataURL('image/png');
    }

    // ─── STEP 5: SUMMARY ────────────────────────────────────────────

    _renderSummaryStep(main) {
        const race = getRaceById(this.selectedRaceId);
        const cls = getClassById(this.selectedClassId);
        const stats = calculateStartingAttributes(this.selectedRaceId, this.selectedClassId);
        const fColor = FACTION_COLORS[race?.faction || 'Crusade'];
        const totalPower = Object.values(stats).reduce((a, b) => a + b, 0) * 10 + 100;

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'text-align:center;margin-bottom:24px;';
        headerDiv.innerHTML = `
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:rgba(245,158,11,0.7);margin-bottom:4px;">Character Preview</div>
            <h2 style="font-size:40px;color:#fbbf24;margin:0;">${this.characterName}</h2>
            <div style="font-size:18px;color:#cbd5e1;margin-top:4px;">${race?.name || ''} ${cls?.name || ''}</div>
            <div class="gcc-faction-pill" style="background:${fColor.bg};color:${fColor.text};margin-top:8px;">${race?.faction || ''} Faction</div>
        `;
        main.appendChild(headerDiv);

        // Grid
        const grid = document.createElement('div');
        grid.className = 'gcc-summary-grid';

        // Left: attributes
        const leftPanel = document.createElement('div');
        leftPanel.className = 'gcc-summary-panel';
        leftPanel.innerHTML = `<h3>⚡ Starting Attributes</h3>`;
        Object.entries(stats).forEach(([key, val]) => {
            const attr = ATTRIBUTES.find(a => a.key === key);
            leftPanel.innerHTML += `
                <div class="gcc-attr-row">
                    <div class="attr-left">
                        <span class="attr-icon">${attr?.icon || '•'}</span>
                        <span class="attr-name">${key}</span>
                    </div>
                    <span class="attr-val">${val}</span>
                </div>
            `;
        });
        grid.appendChild(leftPanel);

        // Center: avatar + radar
        const centerPanel = document.createElement('div');
        centerPanel.className = 'gcc-summary-panel gcc-radar-wrap';

        const avatarDiv = document.createElement('div');
        avatarDiv.style.cssText = `width:120px;height:120px;border-radius:50%;border:4px solid ${fColor.border};
            overflow:hidden;margin-bottom:8px;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:48px;`;
        if (this.avatarUrl) {
            avatarDiv.innerHTML = `<img src="${this.avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
        } else {
            avatarDiv.textContent = race?.icon || '?';
        }
        centerPanel.appendChild(avatarDiv);

        const subText = document.createElement('div');
        subText.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:12px;';
        subText.textContent = `${race?.name || ''} ${cls?.name || ''}`;
        centerPanel.appendChild(subText);

        // Canvas radar chart
        const radarCanvas = document.createElement('canvas');
        radarCanvas.className = 'gcc-radar-canvas';
        radarCanvas.width = 220;
        radarCanvas.height = 220;
        centerPanel.appendChild(radarCanvas);
        requestAnimationFrame(() => this._drawRadarChart(radarCanvas, stats));

        const quoteDiv = document.createElement('div');
        quoteDiv.style.cssText = 'font-size:11px;color:#64748b;font-style:italic;margin-top:12px;text-align:center;';
        quoteDiv.textContent = `"Welcome to the ${race?.faction || 'realm'}, ${cls?.name || 'warrior'}."`;
        centerPanel.appendChild(quoteDiv);
        grid.appendChild(centerPanel);

        // Right: power summary
        const rightPanel = document.createElement('div');
        rightPanel.className = 'gcc-summary-panel';
        rightPanel.innerHTML = `<h3>Power Summary</h3>`;

        rightPanel.innerHTML += `
            <div class="gcc-power-bar">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⚡ Power Level</span>
                    <span style="font-size:24px;font-weight:700;color:#fbbf24;">${totalPower}</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, Object.values(stats).reduce((a, b) => a + b, 0) * 2)}%"></div></div>
                <div class="gcc-power-label"><span>Novice</span><span>Champion</span></div>
            </div>
            <div class="gcc-stat-row"><span class="stat-label">Starting Gold</span><span class="stat-val" style="color:#fbbf24;">100</span></div>
            <div class="gcc-stat-row"><span class="stat-label">Starting Level</span><span class="stat-val" style="color:#22c55e;">1</span></div>
            <div class="gcc-stat-row"><span class="stat-label">Faction</span><span class="stat-val" style="color:${fColor.text};">${race?.faction || ''}</span></div>
        `;
        grid.appendChild(rightPanel);
        main.appendChild(grid);

        // Create button
        const actionDiv = document.createElement('div');
        actionDiv.style.cssText = 'text-align:center;margin-top:28px;';
        const createBtn = document.createElement('button');
        createBtn.className = 'gcc-btn gcc-btn-primary gcc-btn-big';
        createBtn.style.cssText = 'background:linear-gradient(90deg,#d97706,#f59e0b);padding:18px 56px;font-size:18px;box-shadow:0 8px 24px rgba(245,158,11,0.2);';
        createBtn.textContent = this.isCreating ? '⟳ Creating...' : 'Save & Begin Adventure';
        createBtn.disabled = this.isCreating;
        createBtn.onclick = () => this._handleCreate();
        actionDiv.appendChild(createBtn);
        main.appendChild(actionDiv);
    }

    // ─── RADAR CHART (Canvas) ───────────────────────────────────────

    _drawRadarChart(canvas, stats) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = 85;
        const keys = Object.keys(stats);
        const n = keys.length;
        const maxVal = 15;
        const angleStep = (Math.PI * 2) / n;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid rings
        [0.25, 0.5, 0.75, 1.0].forEach(pct => {
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = cx + Math.cos(angle) * r * pct;
                const y = cy + Math.sin(angle) * r * pct;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.stroke();
        });

        // Axis lines
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.stroke();
        }

        // Data fill
        ctx.beginPath();
        keys.forEach((key, i) => {
            const val = Math.min(stats[key] / maxVal, 1);
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + Math.cos(angle) * r * val;
            const y = cy + Math.sin(angle) * r * val;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(234,179,8,0.25)';
        ctx.fill();
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Data points + labels
        keys.forEach((key, i) => {
            const val = Math.min(stats[key] / maxVal, 1);
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + Math.cos(angle) * r * val;
            const y = cy + Math.sin(angle) * r * val;

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#EAB308';
            ctx.fill();

            // Label
            const lx = cx + Math.cos(angle) * (r + 14);
            const ly = cy + Math.sin(angle) * (r + 14);
            ctx.font = '10px Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(key.slice(0, 3).toUpperCase(), lx, ly);
        });
    }

    // ─── CREATE CHARACTER ───────────────────────────────────────────

    async _handleCreate() {
        if (!this.selectedRaceId || !this.selectedClassId || !this.characterName.trim()) return;

        this.isCreating = true;
        this._showLoadingOverlay();

        const race = getRaceById(this.selectedRaceId);
        const cls = getClassById(this.selectedClassId);

        // ── Create via unified backend (api.grudge-studio.com) ──
        // Backend validates race/class, computes attributes (base + race + class),
        // generates AI avatar, mints cNFT, returns full character.
        const UNIFIED_API = 'https://api.grudge-studio.com/api';
        const token = localStorage.getItem('grudge_auth_token');
        let character = null;
        let cnft = null;

        try {
            const res = await fetch(`${UNIFIED_API}/characters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: this.characterName.trim(),
                    raceId: this.selectedRaceId,
                    classId: this.selectedClassId,
                    gameOrigin: 'babylon-engine',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                character = data.character;
                cnft = data.cnft;
                character.raceName = race?.name;
                character.className = cls?.name;
                character.faction = data.faction || race?.faction;
                character.prefabId = character.prefabId || `${this.selectedRaceId}_${this.selectedClassId}`;
                character.grudgeId = data.grudgeId;
                console.log('[GrudgeCC] Character created on unified backend:', character.id, cnft ? '+ cNFT minted' : '');
            } else {
                console.warn('[GrudgeCC] Backend creation failed, falling back to local');
            }
        } catch (e) {
            console.warn('[GrudgeCC] Backend unreachable, creating locally:', e.message);
        }

        // Fallback to local creation if backend is unavailable
        if (!character) {
            const stats = calculateStartingAttributes(this.selectedRaceId, this.selectedClassId);
            character = {
                id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
                name: this.characterName.trim(),
                raceId: this.selectedRaceId,
                classId: this.selectedClassId,
                raceName: race?.name,
                className: cls?.name,
                faction: race?.faction,
                avatarUrl: this.avatarUrl,
                attributes: stats,
                prefabId: `${this.selectedRaceId}_${this.selectedClassId}`,
                level: 1,
                experience: 0,
                gold: 100,
                skillPoints: 1,
                attributePoints: 7,
                equipment: { head: null, chest: null, legs: null, feet: null, hands: null, shoulders: null, mainHand: null, offHand: null },
                createdAt: new Date().toISOString(),
            };
        }

        // Cache locally for offline access
        try {
            const existing = JSON.parse(localStorage.getItem('grudge_characters') || '[]');
            existing.push(character);
            localStorage.setItem('grudge_characters', JSON.stringify(existing));
            localStorage.setItem('activeCharacter', JSON.stringify(character));
            localStorage.setItem('activeCharacterId', character.id);
        } catch (e) {
            console.warn('[GrudgeCC] localStorage save error:', e);
        }

        // Update loading steps
        await this._sleep(500);
        this._updateLoadingStep(0, 'done');
        this._updateLoadingStep(1, 'active');
        await this._sleep(400);
        this._updateLoadingStep(1, 'done');
        this._updateLoadingStep(2, 'active');
        await this._sleep(400);
        this._updateLoadingStep(2, 'done');
        await this._sleep(600);

        this._hideLoadingOverlay();
        this.container.style.display = 'none';
        this.isCreating = false;

        // Dispatch event with full character + cNFT data
        window.dispatchEvent(new CustomEvent('grudgeCharacterCreated', { detail: { character, cnft } }));
        if (this.onComplete) this.onComplete(character);
    }

    _showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'gcc-loading';
        overlay.className = 'gcc-loading-overlay';
        overlay.innerHTML = `
            <div style="text-align:center;max-width:420px;padding:32px;">
                <div class="gcc-loading-spinner"></div>
                <h2 style="font-size:28px;color:#fbbf24;margin-bottom:4px;">Summoning Hero</h2>
                <p style="font-size:18px;color:#94a3b8;margin-bottom:24px;">${this.characterName}</p>
                <div id="gcc-loading-steps">
                    <div class="gcc-loading-step active" data-step="0">
                        <div class="step-icon" style="background:#f59e0b;color:#000;">⟳</div>
                        <span style="color:#fbbf24;">Creating character in Grudge DB</span>
                    </div>
                    <div class="gcc-loading-step pending" data-step="1">
                        <div class="step-icon" style="background:#334155;color:#64748b;">2</div>
                        <span style="color:#64748b;">Minting character cNFT on Solana</span>
                    </div>
                    <div class="gcc-loading-step pending" data-step="2">
                        <div class="step-icon" style="background:#334155;color:#64748b;">3</div>
                        <span style="color:#64748b;">Finalizing hero profile</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    _updateLoadingStep(idx, status) {
        const step = document.querySelector(`#gcc-loading-steps .gcc-loading-step[data-step="${idx}"]`);
        if (!step) return;
        step.className = `gcc-loading-step ${status}`;
        const icon = step.querySelector('.step-icon');
        const label = step.querySelector('span');
        if (status === 'done') {
            icon.style.background = '#22c55e';
            icon.style.color = '#000';
            icon.textContent = '✓';
            label.style.color = '#4ade80';
        } else if (status === 'active') {
            icon.style.background = '#f59e0b';
            icon.style.color = '#000';
            icon.textContent = '⟳';
            label.style.color = '#fbbf24';
        }
    }

    _hideLoadingOverlay() {
        const el = document.getElementById('gcc-loading');
        if (el) el.remove();
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ─── CLEANUP ────────────────────────────────────────────────────

    dispose() {
        if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
        if (this.container?.parentNode) this.container.parentNode.removeChild(this.container);
        const style = document.getElementById('grudge-cc-styles');
        if (style) style.remove();
    }
}

export default GrudgeCharacterCreation;
