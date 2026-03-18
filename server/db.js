import mysql from 'mysql2/promise';

let pool = null;

/**
 * Parse Railway's MYSQL_URL or fall back to individual env vars.
 * Railway auto-provides MYSQL_URL when you reference the MySQL service.
 */
function getConnectionConfig() {
    const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (url) {
        return { uri: url, waitForConnections: true, connectionLimit: 10, queueLimit: 0 };
    }
    return {
        host: process.env.MYSQLHOST || 'localhost',
        port: parseInt(process.env.MYSQLPORT || '3306', 10),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || 'starwaygruda',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };
}

const SCHEMA = [
    `CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        account_id BIGINT NOT NULL,
        grudge_id VARCHAR(255) DEFAULT '',
        username VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(255) DEFAULT NULL,
        grudge_token TEXT DEFAULT NULL,
        login_time BIGINT NOT NULL,
        last_activity BIGINT NOT NULL,
        ip_address VARCHAR(64) DEFAULT NULL,
        auth_method VARCHAR(32) DEFAULT 'password',
        INDEX idx_sessions_account (account_id),
        INDEX idx_sessions_activity (last_activity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS characters_ (
        id BIGINT PRIMARY KEY,
        account_id BIGINT NOT NULL,
        name VARCHAR(64) NOT NULL,
        profession VARCHAR(64) NOT NULL,
        level INT DEFAULT 1,
        experience BIGINT DEFAULT 0,
        credits BIGINT DEFAULT 1000,
        planet VARCHAR(64) DEFAULT 'tutorial',
        zone VARCHAR(64) DEFAULT 'Tutorial',
        position_json JSON DEFAULT NULL,
        stats_json JSON DEFAULT NULL,
        appearance_json JSON DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_played DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_chars_account (account_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS inventories (
        account_id BIGINT PRIMARY KEY,
        items_json JSON DEFAULT NULL,
        credits BIGINT DEFAULT 1000,
        bank_credits BIGINT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS professions (
        account_id BIGINT PRIMARY KEY,
        professions_json JSON DEFAULT NULL,
        skill_points_json JSON DEFAULT NULL,
        experience_json JSON DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS islands (
        account_id BIGINT PRIMARY KEY,
        island_json JSON DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    `CREATE TABLE IF NOT EXISTS pvp_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        winner_id BIGINT NOT NULL,
        loser_id BIGINT NOT NULL,
        zone VARCHAR(64) DEFAULT NULL,
        damage_total INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pvp_winner (winner_id),
        INDEX idx_pvp_loser (loser_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

export async function initDb() {
    const config = getConnectionConfig();
    pool = mysql.createPool(config);

    // Verify connection
    const conn = await pool.getConnection();
    console.log('[DB] MySQL connected successfully');
    conn.release();

    // Create tables
    for (const ddl of SCHEMA) {
        await pool.execute(ddl);
    }
    console.log('[DB] Schema verified (6 tables)');
}

export function getDb() {
    if (!pool) throw new Error('Database not initialised — call initDb() first');
    return pool;
}

export async function closeDb() {
    if (pool) {
        await pool.end();
        console.log('[DB] Connection pool closed');
    }
}

// ─── Helper query wrappers used by the server ───────────────────

// Sessions
export async function dbSaveSession(token, session) {
    const sql = `INSERT INTO sessions (token, account_id, grudge_id, username, wallet_address, grudge_token, login_time, last_activity, ip_address, auth_method)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE grudge_token=VALUES(grudge_token), last_activity=VALUES(last_activity)`;
    await pool.execute(sql, [
        token,
        session.accountId,
        session.grudgeId || '',
        session.username,
        session.walletAddress || null,
        session.grudgeToken || null,
        session.loginTime,
        session.lastActivity,
        session.ipAddress || null,
        session.authMethod || 'password',
    ]);
}

export async function dbGetSession(token) {
    const [rows] = await pool.execute('SELECT * FROM sessions WHERE token = ?', [token]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
        accountId: r.account_id,
        grudgeId: r.grudge_id,
        username: r.username,
        walletAddress: r.wallet_address,
        grudgeToken: r.grudge_token,
        loginTime: Number(r.login_time),
        lastActivity: Number(r.last_activity),
        ipAddress: r.ip_address,
        authMethod: r.auth_method,
    };
}

export async function dbDeleteSession(token) {
    await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
}

export async function dbTouchSession(token) {
    await pool.execute('UPDATE sessions SET last_activity = ? WHERE token = ?', [Date.now(), token]);
}

export async function dbCleanExpiredSessions(maxAgeMs = 3600000) {
    const cutoff = Date.now() - maxAgeMs;
    const [result] = await pool.execute('DELETE FROM sessions WHERE last_activity < ?', [cutoff]);
    return result.affectedRows;
}

// Characters
export async function dbGetCharacters(accountId) {
    const [rows] = await pool.execute('SELECT * FROM characters_ WHERE account_id = ? ORDER BY last_played DESC', [accountId]);
    return rows.map(r => ({
        id: Number(r.id),
        name: r.name,
        profession: r.profession,
        level: r.level,
        experience: Number(r.experience),
        credits: Number(r.credits),
        planet: r.planet,
        zone: r.zone,
        position: r.position_json || { x: 0, y: 10, z: 0 },
        stats: r.stats_json || { health: 100, maxHealth: 100, action: 100, maxAction: 100, mind: 100, maxMind: 100 },
        appearance: r.appearance_json || {},
        lastPlayed: r.last_played,
    }));
}

export async function dbCreateCharacter(char, accountId) {
    const sql = `INSERT INTO characters_ (id, account_id, name, profession, level, experience, credits, planet, zone, position_json, stats_json, appearance_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.execute(sql, [
        char.id,
        accountId,
        char.name,
        char.profession,
        char.level || 1,
        char.experience || 0,
        char.credits || 1000,
        char.planet || 'tutorial',
        char.zone || 'Tutorial',
        JSON.stringify(char.position || { x: 0, y: 10, z: 0 }),
        JSON.stringify(char.stats || { health: 100, maxHealth: 100, action: 100, maxAction: 100, mind: 100, maxMind: 100 }),
        JSON.stringify(char.appearance || {}),
    ]);
}

export async function dbDeleteCharacter(characterId) {
    await pool.execute('DELETE FROM characters_ WHERE id = ?', [characterId]);
}

// Inventories
export async function dbGetInventory(accountId) {
    const [rows] = await pool.execute('SELECT * FROM inventories WHERE account_id = ?', [accountId]);
    if (!rows.length) return null;
    const r = rows[0];
    return { items: r.items_json || [], credits: Number(r.credits), bankCredits: Number(r.bank_credits) };
}

export async function dbSaveInventory(accountId, inv) {
    const sql = `INSERT INTO inventories (account_id, items_json, credits, bank_credits)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE items_json=VALUES(items_json), credits=VALUES(credits), bank_credits=VALUES(bank_credits)`;
    await pool.execute(sql, [accountId, JSON.stringify(inv.items || []), inv.credits || 0, inv.bankCredits || 0]);
}

// Professions
export async function dbGetProfessions(accountId) {
    const [rows] = await pool.execute('SELECT * FROM professions WHERE account_id = ?', [accountId]);
    if (!rows.length) return null;
    const r = rows[0];
    return { professions: r.professions_json || {}, skillPoints: r.skill_points_json || { available: 250, spent: 0 }, experience: r.experience_json || {} };
}

export async function dbSaveProfessions(accountId, prof) {
    const sql = `INSERT INTO professions (account_id, professions_json, skill_points_json, experience_json)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE professions_json=VALUES(professions_json), skill_points_json=VALUES(skill_points_json), experience_json=VALUES(experience_json)`;
    await pool.execute(sql, [accountId, JSON.stringify(prof.professions || {}), JSON.stringify(prof.skillPoints || {}), JSON.stringify(prof.experience || {})]);
}

// Islands
export async function dbGetIsland(accountId) {
    const [rows] = await pool.execute('SELECT * FROM islands WHERE account_id = ?', [accountId]);
    if (!rows.length) return null;
    return rows[0].island_json;
}

export async function dbSaveIsland(accountId, island) {
    const sql = `INSERT INTO islands (account_id, island_json) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE island_json=VALUES(island_json)`;
    await pool.execute(sql, [accountId, JSON.stringify(island)]);
}

// PvP logs
export async function dbLogPvpKill(winnerId, loserId, zone) {
    await pool.execute('INSERT INTO pvp_logs (winner_id, loser_id, zone) VALUES (?, ?, ?)', [winnerId, loserId, zone || null]);
}
