import { verifyFirebaseTokenAndGetUser } from '../services/firebaseUser.js';
import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';

const extractBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (!/^Bearer$/i.test(scheme) || !token) return null;

  return token.trim();
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.warn('[auth] missing bearer token', {
        method: req.method,
        path: req.originalUrl,
        hasAuthorizationHeader: Boolean(authHeader),
      });
      return res.status(401).json({
        message: 'Not authorized, missing bearer token',
        code: 'missing-token',
      });
    }

    let decoded;
    let user;
    try {
      const result = await verifyFirebaseTokenAndGetUser(token);
      decoded = result.decoded;
      user = result.user;
    } catch (err) {
      console.warn('[auth] verifyIdToken failed', {
        method: req.method,
        path: req.originalUrl,
        code: err?.code,
        message: err?.message,
      });
      return res.status(401).json({
        message: 'Not authorized, invalid token',
        code: err?.code === 'auth/id-token-expired' ? 'token-expired' : 'invalid-token',
      });
    }

    console.info('[auth] decoded Firebase user', {
      uid: decoded.uid,
      email: decoded.email || null,
      method: req.method,
      path: req.originalUrl,
    });

    if (decoded.email_verified === false) {
      return res.status(403).json({ message: 'Email not verified', code: 'email-not-verified' });
    }

    req.user = user;
    req.firebaseUser = decoded;

    const h = req.headers || {};
    const workspaceId = (
      req.params?.workspaceId ||
      req.body?.workspaceId ||
      req.query?.workspaceId ||
      h['x-workspace-id'] ||
      h.workspaceid ||
      h['workspace-id'] ||
      null
    );

    if (workspaceId && mongoose.isValidObjectId(workspaceId)) {
      const workspace = await Workspace.findById(workspaceId).select('members');
      if (workspace) {
        const member = (workspace.members || []).find((m) => String(m.userId) === String(user._id));
        if (member) {
          req.userRole = member.role;
          req.member = {
            userId: user._id,
            workspaceId: workspace._id,
            role: member.role,
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('[auth] protect crashed:', error);
    return res.status(401).json({ message: 'Not authorized, token failed', code: 'auth-crash' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ message: 'Role context missing. Use membership-based middleware.' });
    }
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};
