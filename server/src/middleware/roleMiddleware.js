// server/src/middleware/roleMiddleware.js
/**
 * Server-side Role-Based Access Control middleware.
 * 
 * The client sends its role in the `X-User-Role` header (set by the dashboard
 * after login). This middleware validates the role against allowed roles for
 * each endpoint. Combined with the Bearer token auth, this ensures:
 *   1. The caller has a valid API token (authMiddleware)
 *   2. The caller's role has permission for this action (roleMiddleware)
 * 
 * For machine-to-machine (Python/PLC) calls, role is 'system' which has full access.
 */

const ROLE_HIERARCHY = {
    system: 100,  // machine-to-machine (no X-User-Role header)
    Host: 90,
    Admin: 80,
    Maintenance: 60,
    Supervisor: 50,
    Operator: 10,
};

/**
 * Returns middleware that requires the caller's role level to be >= minLevel.
 * @param {number} minLevel - Minimum role level required
 */
export const requireRole = (minLevel) => (req, res, next) => {
    const roleHeader = req.headers['x-user-role'] || 'system';
    const level = ROLE_HIERARCHY[roleHeader] ?? 0;

    if (level < minLevel) {
        return res.status(403).json({
            error: 'Insufficient permissions',
            message: `This action requires a higher role level. Your role: ${roleHeader}`,
        });
    }

    req.userRole = roleHeader;
    req.userRoleLevel = level;
    next();
};

// Convenience exports
export const requireOperator = requireRole(ROLE_HIERARCHY.Operator);
export const requireSupervisor = requireRole(ROLE_HIERARCHY.Supervisor);
export const requireMaintenance = requireRole(ROLE_HIERARCHY.Maintenance);
export const requireAdmin = requireRole(ROLE_HIERARCHY.Admin);
export const requireHost = requireRole(ROLE_HIERARCHY.Host);
