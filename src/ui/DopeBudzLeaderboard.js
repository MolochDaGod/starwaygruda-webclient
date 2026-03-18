/**
 * DopeBudzLeaderboard.js
 *
 * Territory map (grid) claimable via battle wins.
 * Seasonal leaderboard rankings.
 * Trophy gain/loss system.
 */

const GRID_COLS = 8;
const GRID_ROWS = 6;

export class DopeBudzLeaderboard {
    constructor() {
        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById('db-leaderboard-styles')) return;
        const style = document.createElement('style');
        style.id = 'db-leaderboard-styles';
        style.textContent = `
            .lb-wrap { display: flex; gap: 24px; min-height: 480px; }

            /* Territory map */
            .lb-territory-panel {
                flex: 1; background: rgba(0,0,0,0.3);
                border: 1px solid rgba(34,197,94,0.15); border-radius: 12px; padding: 16px;
            }
            .lb-panel-title {
                font-size: 16px; color: #22c55e; font-weight: 700; margin-bottom: 12px;
                display: flex; align-items: center; gap: 8px;
            }
            .lb-territory-grid {
                display: grid;
                grid-template-columns: repeat(${GRID_COLS}, 1fr);
                gap: 4px;
            }
            .lb-tile {
                aspect-ratio: 1; border-radius: 6px; border: 2px solid rgba(255,255,255,0.06);
                display: flex; align-items: center; justify-content: center;
                font-size: 16px; cursor: pointer; transition: all 0.2s;
                position: relative;
            }
            .lb-tile.unclaimed { background: rgba(20,30,20,0.5); }
            .lb-tile.unclaimed:hover { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.08); }
            .lb-tile.player { background: rgba(34,197,94,0.2); border-color: #22c55e; }
            .lb-tile.enemy { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); }
            .lb-tile .tile-label {
                position: absolute; bottom: 2px; font-size: 7px; color: rgba(255,255,255,0.4);
                letter-spacing: 0.5px;
            }

            .lb-territory-legend {
                display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: #5a7a5a;
            }
            .lb-legend-dot {
                width: 10px; height: 10px; border-radius: 3px; display: inline-block;
                margin-right: 4px; vertical-align: middle;
            }

            /* Leaderboard panel */
            .lb-rankings-panel {
                width: 320px; flex-shrink: 0; background: rgba(0,0,0,0.3);
                border: 1px solid rgba(34,197,94,0.15); border-radius: 12px; padding: 16px;
                display: flex; flex-direction: column;
            }
            .lb-season-badge {
                display: inline-block; padding: 4px 12px; border-radius: 999px;
                font-size: 10px; font-weight: 700; color: #fbbf24;
                background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25);
                margin-bottom: 12px; width: fit-content;
            }
            .lb-rank-list { flex: 1; overflow-y: auto; }
            .lb-rank-row {
                display: flex; align-items: center; gap: 10px; padding: 8px 10px;
                border-radius: 8px; margin-bottom: 4px; transition: background 0.2s;
            }
            .lb-rank-row:hover { background: rgba(34,197,94,0.06); }
            .lb-rank-row.self { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }
            .lb-rank-num {
                width: 28px; height: 28px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; font-size: 12px;
                font-weight: 800; flex-shrink: 0;
            }
            .lb-rank-num.gold { background: #fbbf24; color: #000; }
            .lb-rank-num.silver { background: #94a3b8; color: #000; }
            .lb-rank-num.bronze { background: #d97706; color: #000; }
            .lb-rank-num.normal { background: rgba(255,255,255,0.06); color: #5a7a5a; }
            .lb-rank-info { flex: 1; }
            .lb-rank-name { font-size: 13px; font-weight: 700; color: #a3d9a3; }
            .lb-rank-record { font-size: 10px; color: #5a7a5a; }
            .lb-rank-trophies { font-size: 13px; font-weight: 800; color: #fbbf24; }

            /* Your stats summary */
            .lb-your-stats {
                background: rgba(0,0,0,0.3); border: 1px solid rgba(34,197,94,0.15);
                border-radius: 10px; padding: 12px; margin-top: 12px;
            }
            .lb-stat-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
            .lb-stat-row .label { color: #5a7a5a; }
            .lb-stat-row .value { color: #a3d9a3; font-weight: 700; }
        `;
        document.head.appendChild(style);
    }

    // ── Public API ───────────────────────────────────────────────────

    renderInto(container, playerData) {
        this.playerData = playerData;
        container.innerHTML = '';
        this._buildUI(container);
    }

    _buildUI(container) {
        const wrap = document.createElement('div');
        wrap.className = 'lb-wrap';

        // Territory map (left)
        const terrPanel = document.createElement('div');
        terrPanel.className = 'lb-territory-panel';
        this._renderTerritoryMap(terrPanel);
        wrap.appendChild(terrPanel);

        // Rankings (right)
        const rankPanel = document.createElement('div');
        rankPanel.className = 'lb-rankings-panel';
        this._renderRankings(rankPanel);
        wrap.appendChild(rankPanel);

        container.appendChild(wrap);
    }

    // ── Territory Map ────────────────────────────────────────────────

    _renderTerritoryMap(panel) {
        panel.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'lb-panel-title';
        title.innerHTML = '🗺️ Territory Map';
        panel.appendChild(title);

        const territories = this.playerData.territories || [];
        const playerTerritorySet = new Set(territories);

        // Generate some "enemy" claimed tiles for visual interest
        const enemyTiles = new Set();
        for (let i = 0; i < 8; i++) {
            const idx = Math.floor(Math.random() * GRID_COLS * GRID_ROWS);
            if (!playerTerritorySet.has(idx)) enemyTiles.add(idx);
        }

        const grid = document.createElement('div');
        grid.className = 'lb-territory-grid';

        const terrainIcons = ['🌿', '🌲', '🏔️', '🌾', '🍄', '🌸', '💎', '🏚️', '⛺', '🗿'];

        for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
            const tile = document.createElement('div');
            const isPlayer = playerTerritorySet.has(i);
            const isEnemy = enemyTiles.has(i);

            tile.className = `lb-tile ${isPlayer ? 'player' : isEnemy ? 'enemy' : 'unclaimed'}`;
            tile.textContent = isPlayer ? '🏴' : isEnemy ? '🔴' : terrainIcons[i % terrainIcons.length];

            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            tile.innerHTML += `<span class="tile-label">${String.fromCharCode(65 + col)}${row + 1}</span>`;

            tile.onclick = () => {
                if (!isPlayer && !isEnemy) {
                    // Prompt battle to claim
                    tile.style.borderColor = '#fbbf24';
                    tile.style.background = 'rgba(251,191,36,0.1)';
                    setTimeout(() => {
                        tile.style.borderColor = '';
                        tile.style.background = '';
                    }, 800);
                }
            };

            grid.appendChild(tile);
        }

        panel.appendChild(grid);

        // Legend
        const legend = document.createElement('div');
        legend.className = 'lb-territory-legend';
        legend.innerHTML = `
            <span><span class="lb-legend-dot" style="background:#22c55e;"></span> Your Territory (${territories.length})</span>
            <span><span class="lb-legend-dot" style="background:#ef4444;"></span> Enemy Territory</span>
            <span><span class="lb-legend-dot" style="background:rgba(255,255,255,0.1);"></span> Unclaimed</span>
        `;
        panel.appendChild(legend);
    }

    // ── Rankings ─────────────────────────────────────────────────────

    _renderRankings(panel) {
        panel.innerHTML = '';

        const title = document.createElement('div');
        title.className = 'lb-panel-title';
        title.innerHTML = '🏆 Season Rankings';
        panel.appendChild(title);

        const badge = document.createElement('div');
        badge.className = 'lb-season-badge';
        badge.textContent = '⚡ Season 1 • 28 days remaining';
        panel.appendChild(badge);

        // Generate mock leaderboard
        const mockPlayers = this._generateMockLeaderboard();

        const list = document.createElement('div');
        list.className = 'lb-rank-list';

        mockPlayers.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = `lb-rank-row ${p.self ? 'self' : ''}`;

            const rank = i + 1;
            const rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'normal';

            row.innerHTML = `
                <div class="lb-rank-num ${rankCls}">${rank}</div>
                <div class="lb-rank-info">
                    <div class="lb-rank-name">${p.name}${p.self ? ' (You)' : ''}</div>
                    <div class="lb-rank-record">${p.wins}W - ${p.losses}L</div>
                </div>
                <div class="lb-rank-trophies">🏆 ${p.trophies}</div>
            `;
            list.appendChild(row);
        });

        panel.appendChild(list);

        // Your stats summary
        const stats = document.createElement('div');
        stats.className = 'lb-your-stats';
        const wr = this.playerData.wins + this.playerData.losses > 0
            ? ((this.playerData.wins / (this.playerData.wins + this.playerData.losses)) * 100).toFixed(1)
            : '0.0';
        stats.innerHTML = `
            <div class="lb-stat-row"><span class="label">Your Trophies</span><span class="value" style="color:#fbbf24;">🏆 ${this.playerData.trophies}</span></div>
            <div class="lb-stat-row"><span class="label">Win Rate</span><span class="value">${wr}%</span></div>
            <div class="lb-stat-row"><span class="label">Territories</span><span class="value">${(this.playerData.territories || []).length} / ${GRID_COLS * GRID_ROWS}</span></div>
            <div class="lb-stat-row"><span class="label">Level</span><span class="value" style="color:#22c55e;">Lv. ${this.playerData.level}</span></div>
        `;
        panel.appendChild(stats);
    }

    _generateMockLeaderboard() {
        const names = [
            'xDankMaster420', 'GreenThumbGod', 'BudWarrior', 'ChronicChampion',
            'HazeKing', 'KushCommander', 'OGPlantBoss', 'SativaSlayer',
            'IndicaEmperor', 'THC_Legend'
        ];

        const players = names.map(name => ({
            name,
            trophies: Math.floor(Math.random() * 2000) + 500,
            wins: Math.floor(Math.random() * 80) + 10,
            losses: Math.floor(Math.random() * 40) + 5,
            self: false,
        }));

        // Insert player
        players.push({
            name: 'You',
            trophies: this.playerData.trophies,
            wins: this.playerData.wins,
            losses: this.playerData.losses,
            self: true,
        });

        // Sort by trophies descending
        players.sort((a, b) => b.trophies - a.trophies);
        return players;
    }
}

export default DopeBudzLeaderboard;
