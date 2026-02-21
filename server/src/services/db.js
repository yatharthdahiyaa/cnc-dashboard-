// server/src/services/db.js
// PostgreSQL storage for CNC readings
import pg from 'pg';

const { Pool } = pg;

// Railway auto-injects DATABASE_URL when a Postgres addon is attached.
// Falls back to nothing (pool will be null) if no DB is configured, so the
// server still starts fine in local dev without a DB.
let pool = null;

export function initDb() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.warn('⚠️  DATABASE_URL not set — readings will NOT be persisted to Postgres.');
        return;
    }

    pool = new Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false }, // Required for Railway's managed Postgres
        max: 5,
        idleTimeoutMillis: 30_000,
    });

    pool.on('error', (err) => {
        console.error('⚠️  Postgres pool error:', err.message);
    });

    // Create the table if it doesn't exist yet
    pool.query(`
    CREATE TABLE IF NOT EXISTS readings (
      id          SERIAL PRIMARY KEY,
      ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      machine_id  TEXT NOT NULL,
      status      TEXT,
      spindle_speed     INTEGER,
      spindle_load      NUMERIC(6,2),
      feed_rate         INTEGER,
      parts_completed   INTEGER,
      parts_target      INTEGER
    );
    CREATE INDEX IF NOT EXISTS readings_machine_ts
      ON readings (machine_id, ts DESC);
  `)
        .then(() => console.log('✅ Postgres connected — readings table ready'))
        .catch((err) => console.error('❌ Postgres init error:', err.message));
}

/**
 * Save one push payload to the DB.
 * Called after every successful POST /api/data/push (fire-and-forget).
 */
export async function saveReading(machineId, raw) {
    if (!pool) return;
    try {
        await pool.query(
            `INSERT INTO readings
         (machine_id, status, spindle_speed, spindle_load, feed_rate, parts_completed, parts_target)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                machineId,
                raw.status ?? null,
                raw.spindle?.speed ?? null,
                raw.spindle?.load ?? null,
                raw.feedRate ?? null,
                raw.production?.partsCompleted ?? null,
                raw.production?.partsTarget ?? null,
            ]
        );
    } catch (err) {
        console.error(`⚠️  DB save error (${machineId}):`, err.message);
    }
}

/**
 * Fetch the last `limit` readings for a machine, newest first.
 * Returns [] if DB not connected.
 */
export async function getHistory(machineId, limit = 200) {
    if (!pool) return [];
    try {
        const { rows } = await pool.query(
            `SELECT ts, status, spindle_speed, spindle_load, feed_rate,
              parts_completed, parts_target
       FROM readings
       WHERE machine_id = $1
       ORDER BY ts DESC
       LIMIT $2`,
            [machineId, limit]
        );
        return rows.reverse(); // return oldest → newest for charting
    } catch (err) {
        console.error('⚠️  DB query error:', err.message);
        return [];
    }
}
