/**
 * Team-scoped authorization middleware.
 *
 * Reads the active team id from the request (header preferred) and attaches:
 *   req.teamId    — ObjectId string
 *   req.teamRole  — 'admin' | 'manager' | 'member'
 *
 * Must run AFTER `protect` (which sets req.user).
 *
 * Usage:
 *   router.get('/stuff', protect, resolveTeamRole, handler);
 *   router.delete('/stuff', protect, resolveTeamRole, requireTeamRole('admin'), handler);
 */
import { findUserTeamMembership } from '../services/teamMember.js';

const pickTeamId = (req) => {
  // Headers are lowercased by Node; accept a few common spellings.
  const h = req.headers || {};
  return (
    h['x-team-id'] ||
    h['teamid'] ||
    h['team-id'] ||
    req.query?.teamId ||
    req.body?.teamId ||
    null
  );
};

// Attaches req.teamId / req.teamRole. Returns 400 if the header is missing
// when the caller requires it — pass `{ required: true }` to enforce.
export const resolveTeamRole = ({ required = false } = {}) => async (req, res, next) => {
  try {
    const teamId = pickTeamId(req);
    if (!teamId) {
      if (required) return res.status(400).json({ message: 'teamId header required' });
      return next();
    }
    if (!req.user?._id) return res.status(401).json({ message: 'Not authenticated' });

    const membership = await findUserTeamMembership(req.user._id, teamId);
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    req.teamId = String(teamId);
    req.teamRole = membership.role;
    req.teamMembership = membership;
    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Factory: gate an endpoint to one or more team roles.
// Example: router.delete('/x', protect, resolveTeamRole({required:true}), requireTeamRole('admin'), fn)
export const requireTeamRole = (...allowed) => (req, res, next) => {
  if (!req.teamRole) return res.status(403).json({ message: 'Team role not resolved' });
  if (allowed.length && !allowed.includes(req.teamRole)) {
    return res.status(403).json({
      message: `Requires role: ${allowed.join(' or ')} (you are ${req.teamRole})`,
    });
  }
  next();
};
