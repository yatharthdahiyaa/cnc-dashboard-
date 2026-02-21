// server/src/middleware/validatePayload.js

/**
 * Validates machine data payload shape before it is stored.
 * Rejects clearly malformed data with a 400 and a descriptive error.
 */

const isNumber = (v) => typeof v === 'number' && isFinite(v);
const isString = (v) => typeof v === 'string' && v.trim().length > 0;

const VALID_STATUSES = new Set(['RUNNING', 'IDLE', 'PAUSED', 'ALARM', 'MAINTENANCE', 'OFFLINE']);

/**
 * Validate a single machine data object.
 * Returns an array of error strings (empty = valid).
 */
export function validateMachineData(data, prefix = '') {
    const errors = [];

    if (!data || typeof data !== 'object') {
        errors.push(`${prefix}payload must be an object`);
        return errors;
    }

    // status
    if (!isString(data.status)) {
        errors.push(`${prefix}status is required (string)`);
    } else if (!VALID_STATUSES.has(data.status.toUpperCase())) {
        errors.push(`${prefix}status must be one of: ${[...VALID_STATUSES].join(', ')}`);
    }

    // spindle
    if (data.spindle !== undefined) {
        if (typeof data.spindle !== 'object') {
            errors.push(`${prefix}spindle must be an object`);
        } else {
            if (data.spindle.speed !== undefined && !isNumber(data.spindle.speed))
                errors.push(`${prefix}spindle.speed must be a number`);
            if (data.spindle.load !== undefined && !isNumber(data.spindle.load))
                errors.push(`${prefix}spindle.load must be a number`);
            if (data.spindle.temperature !== undefined && !isNumber(data.spindle.temperature))
                errors.push(`${prefix}spindle.temperature must be a number`);
        }
    }

    // axis
    if (data.axis !== undefined) {
        if (typeof data.axis !== 'object') {
            errors.push(`${prefix}axis must be an object`);
        } else {
            ['x', 'y', 'z'].forEach(ax => {
                if (data.axis[ax] !== undefined && !isNumber(data.axis[ax]))
                    errors.push(`${prefix}axis.${ax} must be a number`);
            });
        }
    }

    // production
    if (data.production !== undefined) {
        if (typeof data.production !== 'object') {
            errors.push(`${prefix}production must be an object`);
        } else {
            ['partsCompleted', 'partsTarget', 'cycleTime'].forEach(f => {
                if (data.production[f] !== undefined && !isNumber(data.production[f]))
                    errors.push(`${prefix}production.${f} must be a number`);
            });
        }
    }

    // runtime
    if (data.runtime !== undefined) {
        if (typeof data.runtime !== 'object') {
            errors.push(`${prefix}runtime must be an object`);
        } else {
            ['total', 'today', 'lastJob'].forEach(f => {
                if (data.runtime[f] !== undefined && !isNumber(data.runtime[f]))
                    errors.push(`${prefix}runtime.${f} must be a number`);
            });
        }
    }

    return errors;
}

/**
 * Express middleware for POST /api/data/push
 * Validates machine1 and/or machine2 in the body.
 */
export const validateBulkPush = (req, res, next) => {
    const { machine1, machine2 } = req.body || {};
    const errors = [];

    if (machine1) errors.push(...validateMachineData(machine1, 'machine1.'));
    if (machine2) errors.push(...validateMachineData(machine2, 'machine2.'));

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
};

/**
 * Express middleware for POST /api/machines/:id/data
 * Validates the body as a single machine data object.
 */
export const validateSinglePush = (req, res, next) => {
    const errors = validateMachineData(req.body, '');
    if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
};
