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

const pickTeamId = (req, { paramName } = {}) => {
  // Headers are lowercased by Node; accept a few common spellings.
  //
  // Source priority:
  //   1. The explicit param name passed by the route (e.g. 'id' for team
  //      routes whose URL is /:id). Only the route knows whether its :id
  //      is a team id — guessing was wrong (e.g. /channels/:id/members has
  //      a channel id there, not a team id).
  //   2. req.params.teamId (only if the route declared :teamId).
  //   3. body / query.
  //   4. X-Team-Id header (the active team the frontend sends with every
  //      request; correct fallback when the route doesn't carry the team
  //      in its URL).
  const h = req.headers || {};
  return (
    (paramName && req.params?.[paramName]) ||
    req.params?.teamId ||
    req.body?.teamId ||
    req.query?.teamId ||
    h['x-team-id'] ||
    h['teamid'] ||
    h['team-id'] ||
    null
  );
};

// Attaches req.teamId / req.teamRole. Returns 400 if the team id is missing
// when the caller requires it — pass `{ required: true }`.
//
// `paramName` opts in to using a URL param as the source of the team id (for
// routes like PUT /teams/:id/... where the URL itself names the team). Omit
// it on routes where :id is some other resource (channel, project) and the
// active-team header is the right source.
export const resolveTeamRole = ({ required = false, paramName } = {}) => async (req, res, next) => {
  try {
    const teamId = pickTeamId(req, { paramName });
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
    req.userRole = membership.role;
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
